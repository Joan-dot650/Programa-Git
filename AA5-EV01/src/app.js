import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { ApiError } from './errors.js';
import { UserRepository } from './user-repository.js';
import { createAuthService } from './auth-service.js';
import { createRateLimiter } from './rate-limit.js';

const MAX_BODY_BYTES = 4096;
const STATIC_FILES = new Map([
  ['/', ['../public/index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['../public/styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['../public/app.js', 'text/javascript; charset=utf-8']],
  ['/api/openapi.json', ['../docs/openapi.json', 'application/json; charset=utf-8']],
]);

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

/** Lee un cuerpo acotado y rechaza JSON mal formado o codificación incompatible. */
function readJson(request) {
  const mediaType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json' || request.headers['content-encoding']) {
    request.resume();
    throw new ApiError(415, 'Envía application/json sin compresión.');
  }
  return new Promise((resolve, reject) => {
    let totalBytes = 0;
    let exceeded = false;
    const chunks = [];
    request.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        if (!exceeded) reject(new ApiError(413, 'El cuerpo supera el límite de 4096 bytes.'));
        exceeded = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (exceeded) return;
      try {
        // fatal evita reemplazar silenciosamente bytes UTF-8 inválidos.
        const source = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
        resolve(JSON.parse(source));
      } catch {
        reject(new ApiError(400, 'JSON inválido.'));
      }
    });
    request.on('error', reject);
  });
}

/** Construye el servidor sin abrir un puerto: facilita pruebas con recursos aislados. */
export async function createApplication({ databasePath, rateLimit } = {}) {
  const repository = new UserRepository(databasePath ?? ':memory:');
  let auth;
  try {
    auth = await createAuthService(repository);
  } catch (error) {
    repository.close();
    throw error;
  }
  const consumeAttempt = createRateLimiter(rateLimit);

  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");

    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const isAuth = path === '/api/registro' || path === '/api/login';
      const isReadOnly = STATIC_FILES.has(path) || path === '/api/salud';
      if (!isAuth && !isReadOnly) throw new ApiError(404, 'Recurso no encontrado.');

      const allowedMethod = isAuth ? 'POST' : 'GET';
      if (request.method !== allowedMethod) {
        response.setHeader('Allow', allowedMethod);
        throw new ApiError(405, 'Método no permitido.');
      }

      if (isAuth) {
        // No se confía en X-Forwarded-For: la demostración escucha en localhost.
        const retryAfter = consumeAttempt(request.socket.remoteAddress);
        if (retryAfter) {
          response.setHeader('Retry-After', retryAfter);
          throw new ApiError(429, 'Demasiados intentos. Intenta de nuevo más tarde.');
        }
        const body = await readJson(request);
        const result = path === '/api/registro' ? await auth.register(body) : await auth.login(body);
        sendJson(response, path === '/api/registro' ? 201 : 200, result);
        return;
      }

      if (path === '/api/salud') {
        sendJson(response, 200, { exito: true, mensaje: 'Servicio disponible.' });
        return;
      }

      // Lista cerrada de archivos: ninguna entrada del cliente se usa como ruta de disco.
      const [relativePath, contentType] = STATIC_FILES.get(path);
      const contents = await readFile(new URL(relativePath, import.meta.url));
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(contents);
    } catch (error) {
      request.resume();
      if (response.destroyed || response.headersSent) return;
      const known = error instanceof ApiError;
      const body = { exito: false, mensaje: known ? error.message : 'Error interno del servicio.' };
      if (known && error.details) body.errores = error.details;
      // No se imprimen errores con credenciales ni se envían trazas al navegador.
      if (!known) console.error('Error interno al procesar una solicitud.');
      sendJson(response, known ? error.status : 500, body);
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.on('close', () => repository.close());
  return server;
}

