import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { Store } from './database.js';
import { ApiError } from './errors.js';
import { createAuthService } from './auth-service.js';
import { CatalogService, productOutput } from './catalog-service.js';
import { SalesService } from './sales-service.js';
import { createRateLimiter } from './rate-limit.js';
import { CATEGORIES, id, invalid } from './validation.js';

const STATIC = new Map([
  ['/', ['../docs/SERVICIOS.html', 'text/html; charset=utf-8']],
  ['/api/openapi.json', ['../docs/openapi.json', 'application/json; charset=utf-8']],
]);

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

/** Limita el cuerpo a 32 KiB y rechaza UTF-8 inválido, tipos incorrectos y compresión. */
function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json'
    || request.headers['content-encoding']) {
    request.resume();
    throw new ApiError(415, 'Envía application/json sin compresión.');
  }
  return new Promise((resolve, reject) => {
    let size = 0;
    let exceeded = false;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 32768) {
        if (!exceeded) reject(new ApiError(413, 'El cuerpo supera 32768 bytes.'));
        exceeded = true;
        chunks.length = 0;
      } else if (!exceeded) chunks.push(chunk);
    });
    request.on('end', () => {
      if (exceeded) return;
      try { resolve(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
      catch { reject(new ApiError(400, 'JSON inválido.')); }
    });
    request.on('error', reject);
    request.on('aborted', () => reject(new ApiError(400, 'Solicitud interrumpida.')));
  });
}

/** Construye un servidor aislable; el puerto se abre desde server.js o desde las pruebas. */
export async function createApplication({ databasePath = ':memory:', rateLimit, now = Date.now } = {}) {
  const store = new Store(databasePath);
  let auth;
  try { auth = await createAuthService(store, now); }
  catch (error) { store.close(); throw error; }
  const catalog = new CatalogService(store);
  const sales = new SalesService(store, catalog, now);
  const consume = createRateLimiter(rateLimit);
  const routes = [];
  function route(method, path, access, body, handler, query = false) {
    routes.push({ method, path, access, body, handler, query,
      pattern: new RegExp(`^${path.replace('{id}', '([^/]+)')}$`) });
  }

  route('GET', '/api/salud', 'PUBLICO', false, () => ({ body: { exito: true, mensaje: 'RaízVolt API disponible.', version: '1.0.0' } }));
  route('POST', '/api/registro', 'PUBLICO', true, async (c) => ({ status: 201, body: await auth.register(c.body) }));
  route('POST', '/api/login', 'PUBLICO', true, async (c) => ({ body: await auth.login(c.body) }));
  route('POST', '/api/logout', 'USUARIO', false, (c) => { auth.logout(c.user); return { status: 204 }; });
  route('GET', '/api/perfil', 'USUARIO', false, (c) => ({ body: auth.getProfile(c.user) }));
  route('PUT', '/api/perfil', 'USUARIO', true, (c) => ({ body: auth.updateProfile(c.user, c.body) }));
  route('GET', '/api/categorias', 'PUBLICO', false, () => ({ body: { categorias: CATEGORIES } }));
  route('GET', '/api/productos', 'PUBLICO', false, (c) => ({ body: catalog.list(c.params) }), true);
  route('GET', '/api/productos/{id}', 'PUBLICO', false, (c) => ({ body: productOutput(catalog.find(c.id)) }));
  route('POST', '/api/productos', 'ADMIN', true, (c) => {
    const p = catalog.save(c.body, c.user);
    return { status: 201, body: p, location: `/api/productos/${p.id}` };
  });
  route('PUT', '/api/productos/{id}', 'ADMIN', true, (c) => ({ body: catalog.save(c.body, c.user, c.id) }));
  route('DELETE', '/api/productos/{id}', 'ADMIN', false, (c) => { catalog.remove(c.id); return { status: 204 }; });
  route('GET', '/api/inventario', 'ADMIN', false, () => ({ body: catalog.summary() }));
  route('GET', '/api/inventario/movimientos', 'ADMIN', false, (c) => ({ body: catalog.movements(c.params) }), true);
  route('POST', '/api/productos/{id}/inventario', 'ADMIN', true, (c) => ({ body: catalog.adjust(c.id, c.body, c.user) }));
  route('POST', '/api/cotizaciones', 'USUARIO', true, (c) => {
    const quote = sales.createQuote(c.body, c.user);
    return { status: 201, body: quote, location: `/api/cotizaciones/${quote.id}` };
  });
  route('GET', '/api/cotizaciones', 'USUARIO', false, (c) => ({ body: sales.list('cotizaciones', c.params, c.user) }), true);
  route('GET', '/api/cotizaciones/{id}', 'USUARIO', false, (c) => ({ body: sales.quote(c.id, c.user) }));
  route('POST', '/api/pedidos', 'USUARIO', true, (c) => {
    const result = sales.createOrder(c.body, c.user);
    return { status: result.created ? 201 : 200, body: result.pedido, location: `/api/pedidos/${result.pedido.id}` };
  });
  route('GET', '/api/pedidos', 'USUARIO', false, (c) => ({ body: sales.list('pedidos', c.params, c.user) }), true);
  route('GET', '/api/pedidos/{id}', 'USUARIO', false, (c) => ({ body: sales.order(c.id, c.user) }));
  route('PATCH', '/api/pedidos/{id}/estado', 'USUARIO', true, (c) => ({ body: sales.changeState(c.id, c.body, c.user) }));

  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'");
    try {
      let url;
      try { url = new URL(request.url, 'http://localhost'); }
      catch { throw new ApiError(400, 'URL inválida.'); }
      if (STATIC.has(url.pathname)) {
        if (request.method !== 'GET') { response.setHeader('Allow', 'GET'); throw new ApiError(405, 'Método no permitido.'); }
        if ([...url.searchParams].length) invalid('consulta', 'Este recurso no recibe parámetros.');
        const [path, type] = STATIC.get(url.pathname);
        const data = await readFile(new URL(path, import.meta.url));
        response.writeHead(200, { 'Content-Type': type }); response.end(data); return;
      }
      const matching = routes.filter((r) => r.pattern.test(url.pathname));
      if (!matching.length) throw new ApiError(404, 'Recurso no encontrado.');
      const selected = matching.find((r) => r.method === request.method);
      if (!selected) { response.setHeader('Allow', matching.map((r) => r.method).join(', ')); throw new ApiError(405, 'Método no permitido.'); }
      if (!selected.query && [...url.searchParams].length) invalid('consulta', 'Este recurso no recibe parámetros.');
      let user;
      if (selected.access !== 'PUBLICO') {
        user = auth.authenticate(request.headers.authorization);
        if (selected.access === 'ADMIN' && user.rol !== 'ADMIN') throw new ApiError(403, 'Se requiere el rol ADMIN.');
      }
      if (['/api/registro', '/api/login'].includes(url.pathname)) {
        const wait = consume(request.socket.remoteAddress);
        if (wait) { response.setHeader('Retry-After', String(wait)); throw new ApiError(429, 'Demasiados intentos. Espera antes de reintentar.'); }
      }
      const match = selected.pattern.exec(url.pathname);
      const context = { user, params: url.searchParams, id: match[1] === undefined ? undefined : id(match[1]),
        body: selected.body ? await readJson(request) : undefined };
      const result = await selected.handler(context);
      if (result.location) response.setHeader('Location', result.location);
      request.resume();
      json(response, result.status ?? 200, result.body);
    } catch (error) {
      request.resume();
      if (response.destroyed || response.headersSent) return;
      const known = error instanceof ApiError;
      if (error.status === 401) response.setHeader('WWW-Authenticate', 'Bearer');
      const output = { exito: false, mensaje: known ? error.message : 'Error interno del servicio.' };
      if (known && error.details) output.errores = error.details;
      if (!known) console.error('Error interno al procesar una solicitud.');
      json(response, known ? error.status : 500, output);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('close', () => store.close());
  return server;
}
