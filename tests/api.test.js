import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApplication } from '../src/app.js';
import { Store } from '../src/database.js';
import { createUser } from '../src/auth-service.js';

let directory, dbPath, server, base, admin, client, other;
let tick = Date.now();
let serial = 0;
const pass = 'Clave de pruebas 2026!';
const shipping = { nombre: 'Cliente de prueba', telefono: '+57 300 000 0000', municipio: 'Zipaquirá', direccion: 'Calle ficticia 10-20' };

async function request(method, path, body, token, options = {}) {
  const headers = { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  const response = await fetch((options.base ?? base) + path, { method, headers,
    body: options.raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  const source = await response.text();
  let data;
  try { data = source ? JSON.parse(source) : undefined; } catch { data = source; }
  return { status: response.status, data, headers: response.headers };
}
function status(response, expected) { assert.equal(response.status, expected, JSON.stringify(response.data)); return response.data; }
async function login(username) { return status(await request('POST', '/api/login', { usuario: username, contrasena: pass }), 200).token; }
async function makeProduct(overrides = {}) {
  return status(await request('POST', '/api/productos', {
    codigo: `SOL-${++serial}`, nombre: 'Panel solar de prueba', categoria: 'PANEL_SOLAR', precio: '680000.50', existencias: 10, ...overrides,
  }, admin), 201);
}
async function quote(product, count = 2, token = client) {
  return status(await request('POST', '/api/cotizaciones', { items: [{ productoId: product.id, cantidad: count }] }, token), 201);
}
async function openServer(options = {}) {
  const instance = await createApplication({ databasePath: dbPath, now: () => tick, rateLimit: { maxAttempts: 1000 }, ...options });
  instance.listen(0, '127.0.0.1'); await once(instance, 'listening');
  return instance;
}
async function closeServer(instance) { await new Promise((resolve, reject) => instance.close((error) => error ? reject(error) : resolve())); }

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'raizvolt-api-'));
  dbPath = join(directory, 'test.sqlite');
  const store = new Store(dbPath);
  await createUser(store, { usuario: 'admin.prueba', contrasena: pass }, 'ADMIN');
  await createUser(store, { usuario: 'cliente.prueba', contrasena: pass });
  await createUser(store, { usuario: 'otro.cliente', contrasena: pass });
  store.close();
  server = await openServer(); base = `http://127.0.0.1:${server.address().port}`;
  admin = await login('admin.prueba'); client = await login('cliente.prueba'); other = await login('otro.cliente');
  status(await request('PUT', '/api/perfil', shipping, client), 200);
  status(await request('PUT', '/api/perfil', shipping, other), 200);
});
after(async () => { if (server?.listening) await closeServer(server); await rm(directory, { recursive: true, force: true }); });

test('Salud pública y cabeceras de seguridad', async () => {
  const result = await request('GET', '/api/salud'); status(result, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
});
test('Registro normaliza el usuario y nunca entrega hash ni contraseña', async () => {
  const data = status(await request('POST', '/api/registro', { usuario: ' NUEVO.Cliente ', contrasena: pass }), 201);
  assert.equal(data.usuario.usuario, 'nuevo.cliente'); assert.equal(data.usuario.rol, 'CLIENTE');
  assert.ok(!JSON.stringify(data).includes('hash')); assert.ok(!JSON.stringify(data).includes(pass));
});
test('Usuario duplicado, incluso con mayúsculas, devuelve 409', async () => {
  status(await request('POST', '/api/registro', { usuario: 'NUEVO.CLIENTE', contrasena: pass }), 409);
});
test('La API no permite registrarse como administrador', async () => {
  status(await request('POST', '/api/registro', { usuario: 'intruso', contrasena: pass, rol: 'ADMIN' }), 400);
});
for (const [label, body] of [
  ['cuerpo nulo', null], ['arreglo', []], ['usuario corto', { usuario: 'ab', contrasena: pass }],
  ['usuario con inyección SQL', { usuario: "' OR 1=1--", contrasena: pass }],
  ['contraseña corta', { usuario: 'nuevo', contrasena: '1234567' }],
  ['contraseña vacía de espacios', { usuario: 'nuevo', contrasena: '        ' }],
  ['contraseña excesiva', { usuario: 'nuevo', contrasena: 'a'.repeat(129) }],
]) test(`Registro rechaza ${label}`, async () => { status(await request('POST', '/api/registro', body), 400); });
test('Error de acceso genérico para cuenta inexistente y contraseña incorrecta', async () => {
  const a = status(await request('POST', '/api/login', { usuario: 'cliente.prueba', contrasena: 'Equivocada123!' }), 401);
  const b = status(await request('POST', '/api/login', { usuario: 'no.existe', contrasena: pass }), 401);
  assert.equal(a.mensaje, b.mensaje);
});
test('Ruta protegida sin token devuelve 401 y anuncia Bearer', async () => {
  const result = await request('GET', '/api/perfil'); status(result, 401);
  assert.equal(result.headers.get('www-authenticate'), 'Bearer');
});
test('Un cliente no crea productos ni consulta inventario administrativo', async () => {
  status(await request('POST', '/api/productos', {}, client), 403);
  status(await request('GET', '/api/inventario', undefined, client), 403);
});
test('Perfil propio conserva tildes y no acepta cambiar el rol', async () => {
  assert.equal(status(await request('GET', '/api/perfil', undefined, client), 200).municipio, 'Zipaquirá');
  status(await request('PUT', '/api/perfil', { ...shipping, rol: 'ADMIN' }, client), 400);
  status(await request('PUT', '/api/perfil', { ...shipping, telefono: 'abcde123' }, client), 400);
});
test('Catálogo enumera las cinco categorías del proyecto anterior', async () => {
  assert.deepEqual(status(await request('GET', '/api/categorias'), 200).categorias,
    ['PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO']);
});
test('CRUD registra, consulta, edita y retira sin reutilizar código', async () => {
  const p = await makeProduct({ codigo: ' sol-unico ' }); assert.equal(p.codigo, 'SOL-UNICO');
  status(await request('GET', `/api/productos/${p.id}`), 200);
  const updated = status(await request('PUT', `/api/productos/${p.id}`, {
    codigo: p.codigo, nombre: 'Panel actualizado', categoria: 'PANEL_SOLAR', precio: '700000.99',
  }, admin), 200);
  assert.equal(updated.precio, '700000.99'); assert.equal(updated.existencias, 10);
  status(await request('DELETE', `/api/productos/${p.id}`, undefined, admin), 204);
  status(await request('GET', `/api/productos/${p.id}`), 404);
  status(await request('POST', '/api/productos', { codigo: p.codigo, nombre: 'Repetido', categoria: 'PANEL_SOLAR', precio: '1.00', existencias: 0 }, admin), 409);
});
for (const [label, overrides] of [
  ['precio numérico', { precio: 1.50 }], ['precio cero', { precio: '0.00' }],
  ['precio negativo', { precio: '-1.00' }], ['precio con tres decimales', { precio: '1.001' }],
  ['precio fuera del máximo', { precio: '10000000000.00' }], ['precio con coma', { precio: '12,50' }],
  ['stock negativo', { existencias: -1 }], ['stock fraccionario', { existencias: 1.5 }],
  ['stock como texto', { existencias: '1' }], ['stock excesivo', { existencias: 1000001 }],
  ['categoría desconocida', { categoria: 'OTRA' }], ['nombre corto', { nombre: 'ab' }],
  ['nombre con control', { nombre: 'Panel\nsolar' }], ['código inválido', { codigo: 'PANEL/1' }],
]) test(`Producto rechaza ${label}`, async () => {
  status(await request('POST', '/api/productos', { codigo: `VAL-${++serial}`, nombre: 'Producto válido', categoria: 'PANEL_SOLAR', precio: '10.00', existencias: 1, ...overrides }, admin), 400);
});
test('ID inválido, recurso inexistente y método incorrecto se distinguen', async () => {
  status(await request('GET', '/api/productos/abc'), 400);
  status(await request('GET', '/api/productos/999999'), 404);
  const r = await request('PATCH', '/api/productos/1', {}, admin); status(r, 405);
  assert.ok(r.headers.get('allow').includes('DELETE'));
});
test('Filtros literales, tildes, paginación y parámetros inesperados', async () => {
  const p = await makeProduct({ nombre: 'BATERÍA solar especial', categoria: 'BATERIA' });
  const page = status(await request('GET', '/api/productos?q=bater%C3%ADa&categoria=BATERIA&limite=1'), 200);
  assert.equal(page.productos[0].id, p.id);
  assert.equal(status(await request('GET', '/api/productos?q=%25'), 200).total, 0);
  for (const query of ['limite=101', 'pagina=0', 'pagina=1&pagina=2', 'campo=secreto', 'categoria=OTRA']) {
    status(await request('GET', `/api/productos?${query}`), 400);
  }
});
test('Ajuste de inventario registra motivo y saldo, y rechaza saldo negativo', async () => {
  const p = await makeProduct({ existencias: 2 });
  assert.equal(status(await request('POST', `/api/productos/${p.id}/inventario`, { variacion: 3, motivo: 'Ingreso de prueba' }, admin), 200).existencias, 5);
  status(await request('POST', `/api/productos/${p.id}/inventario`, { variacion: -6, motivo: 'Salida excesiva' }, admin), 409);
  status(await request('POST', `/api/productos/${p.id}/inventario`, { variacion: 0, motivo: 'Ajuste nulo' }, admin), 400);
  const history = status(await request('GET', '/api/inventario/movimientos', undefined, admin), 200).movimientos;
  assert.ok(history.some((m) => m.productoId === p.id && m.variacion === 3 && m.saldo === 5));
});
test('Resumen mantiene importes exactos por encima del límite entero de JavaScript', async () => {
  const store = new Store(dbPath);
  const before = BigInt(status(await request('GET', '/api/inventario', undefined, admin), 200).valorInventario.replace('.', ''));
  const p = await makeProduct({ precio: '9999999999.99', existencias: 1000000 });
  const after = BigInt(status(await request('GET', '/api/inventario', undefined, admin), 200).valorInventario.replace('.', ''));
  assert.equal(after - before, 999999999999n * 1000000n);
  assert.equal(store.one('SELECT precio_centavos FROM productos WHERE id=?', p.id).precio_centavos, 999999999999);
  store.close();
});
test('Cotización calcula precios del servidor, no descuenta stock y congela los importes', async () => {
  const p = await makeProduct({ precio: '0.10' });
  const q = await quote(p, 3); assert.equal(q.total, '0.30');
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).existencias, 10);
  await request('PUT', `/api/productos/${p.id}`, { codigo: p.codigo, nombre: p.nombre, categoria: p.categoria, precio: '99.00' }, admin);
  assert.equal(status(await request('GET', `/api/cotizaciones/${q.id}`, undefined, client), 200).total, '0.30');
  assert.equal(status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 201).total, '0.30');
});
test('Cotización valida cantidades, repetidos y campos de precio impuestos por el cliente', async () => {
  const p = await makeProduct();
  for (const payload of [
    { items: [] }, { items: [{ productoId: p.id, cantidad: 0 }] },
    { items: [{ productoId: p.id, cantidad: 10001 }] },
    { items: [{ productoId: p.id, cantidad: 1 }, { productoId: p.id, cantidad: 1 }] },
    { items: [{ productoId: p.id, cantidad: 1, precio: '0.01' }] },
    { items: [{ productoId: p.id, cantidad: 1 }], usuarioId: 1 },
  ]) status(await request('POST', '/api/cotizaciones', payload, client), 400);
});
test('Cliente ajeno no consulta ni convierte una cotización de otra cuenta', async () => {
  const q = await quote(await makeProduct());
  status(await request('GET', `/api/cotizaciones/${q.id}`, undefined, other), 404);
  status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, other), 404);
  const list = status(await request('GET', '/api/cotizaciones', undefined, other), 200);
  assert.ok(!list.cotizaciones.some((item) => item.id === q.id));
});
test('Cotización caducada se rechaza sin alterar existencias', async () => {
  const p = await makeProduct(); const q = await quote(p);
  const store = new Store(dbPath); store.run('UPDATE cotizaciones SET expira_ms=? WHERE id=?', tick - 1, q.id); store.close();
  status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 409);
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).existencias, 10);
});
test('Pedido requiere un perfil completo antes de reservar productos', async () => {
  const token = await login('nuevo.cliente'); const q = await quote(await makeProduct(), 1, token);
  status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, token), 400);
});
test('Pedido multiartículo falla de forma atómica ante existencias insuficientes', async () => {
  const a = await makeProduct({ existencias: 5 }); const b = await makeProduct({ existencias: 0 });
  const q = status(await request('POST', '/api/cotizaciones', { items: [{ productoId: a.id, cantidad: 1 }, { productoId: b.id, cantidad: 1 }] }, client), 201);
  status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 409);
  assert.equal(status(await request('GET', `/api/productos/${a.id}`), 200).existencias, 5);
});
test('Dos confirmaciones concurrentes de la misma cotización reservan una sola vez', async () => {
  const p = await makeProduct({ existencias: 5 }); const q = await quote(p);
  const results = await Promise.all([request('POST', '/api/pedidos', { cotizacionId: q.id }, client), request('POST', '/api/pedidos', { cotizacionId: q.id }, client)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
  assert.equal(results[0].data.id, results[1].data.id);
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).existencias, 3);
});
test('Dos cotizaciones compiten por la última unidad sin sobreventa', async () => {
  const p = await makeProduct({ existencias: 1 }); const a = await quote(p, 1); const b = await quote(p, 1, other);
  const r = await Promise.all([request('POST', '/api/pedidos', { cotizacionId: a.id }, client), request('POST', '/api/pedidos', { cotizacionId: b.id }, other)]);
  assert.deepEqual(r.map((x) => x.status).sort(), [201, 409]);
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).existencias, 0);
});
test('Cancelar un pedido devuelve existencias una sola vez y conserva sus datos', async () => {
  const p = await makeProduct(); const q = await quote(p);
  const order = status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 201);
  for (let i = 0; i < 2; i++) status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'CANCELADO' }, client), 200);
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).existencias, 10);
  assert.equal(status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 200).estado, 'CANCELADO');
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'ENVIADO' }, admin), 409);
});
test('El estado del pedido respeta permisos, propietario y transiciones', async () => {
  const q = await quote(await makeProduct());
  const order = status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 201);
  status(await request('GET', `/api/pedidos/${order.id}`, undefined, other), 404);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'CANCELADO' }, other), 404);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'ENVIADO' }, client), 403);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'ENTREGADO' }, admin), 409);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'ENVIADO' }, admin), 200);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'CANCELADO' }, client), 409);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'ENTREGADO' }, admin), 200);
  assert.ok(status(await request('GET', '/api/pedidos', undefined, admin), 200).pedidos.length > 0);
});
test('Retirar un producto impide nuevas compras y permite cancelar reservas anteriores', async () => {
  const p = await makeProduct(); const a = await quote(p); const b = await quote(p);
  const order = status(await request('POST', '/api/pedidos', { cotizacionId: a.id }, client), 201);
  status(await request('DELETE', `/api/productos/${p.id}`, undefined, admin), 204);
  status(await request('POST', '/api/pedidos', { cotizacionId: b.id }, client), 409);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'CANCELADO' }, client), 200);
});
test('Modificar perfil no cambia la dirección guardada en un pedido anterior', async () => {
  const q = await quote(await makeProduct());
  const order = status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 201);
  await request('PUT', '/api/perfil', { ...shipping, direccion: 'Otra calle ficticia 25' }, client);
  assert.equal(status(await request('GET', `/api/pedidos/${order.id}`, undefined, client), 200).envio.direccion, shipping.direccion);
});
test('Registro concurrente conserva una sola cuenta y responde 201/409', async () => {
  const results = await Promise.all([1, 2].map(() => request('POST', '/api/registro', { usuario: 'registro.concurrente', contrasena: pass })));
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
});
test('Cancelación multiartículo revierte todo si una devolución supera el máximo', async () => {
  const a = await makeProduct({ existencias: 2 }); const b = await makeProduct({ existencias: 2 });
  const q = status(await request('POST', '/api/cotizaciones', { items: [{ productoId: a.id, cantidad: 1 }, { productoId: b.id, cantidad: 1 }] }, client), 201);
  const order = status(await request('POST', '/api/pedidos', { cotizacionId: q.id }, client), 201);
  status(await request('POST', `/api/productos/${b.id}/inventario`, { variacion: 999999, motivo: 'Ingreso hasta el límite' }, admin), 200);
  status(await request('PATCH', `/api/pedidos/${order.id}/estado`, { estado: 'CANCELADO' }, client), 409);
  assert.equal(status(await request('GET', `/api/productos/${a.id}`), 200).existencias, 1);
  assert.equal(status(await request('GET', `/api/pedidos/${order.id}`, undefined, client), 200).estado, 'PENDIENTE');
});
test('Protocolo rechaza JSON roto, UTF-8 inválido, tipos y cuerpos excesivos', async () => {
  status(await request('POST', '/api/login', {}, undefined, { raw: '{"incompleto":' }), 400);
  status(await request('POST', '/api/login', {}, undefined, { raw: Buffer.from([0xff]) }), 400);
  status(await request('POST', '/api/login', {}, undefined, { headers: { 'Content-Type': 'text/plain' } }), 415);
  status(await request('POST', '/api/login', {}, undefined, { headers: { 'Content-Encoding': 'gzip' } }), 415);
  status(await request('POST', '/api/login', {}, undefined, { raw: JSON.stringify({ dato: 'x'.repeat(33000) }) }), 413);
});
test('Tokens guardados como hash; un nuevo login y logout revocan accesos previos', async () => {
  const previous = await login('nuevo.cliente'); const next = await login('nuevo.cliente');
  status(await request('GET', '/api/perfil', undefined, previous), 401);
  const store = new Store(dbPath);
  assert.equal(store.one('SELECT count(*) AS n FROM sesiones WHERE token_hash=?', next).n, 0); store.close();
  status(await request('POST', '/api/logout', undefined, next), 204);
  status(await request('GET', '/api/perfil', undefined, next), 401);
});
test('Rate limit devuelve 429 y Retry-After al superar la ventana por IP', async () => {
  const instance = await openServer({ databasePath: ':memory:', rateLimit: { maxAttempts: 1, windowMs: 10000 } });
  const url = `http://127.0.0.1:${instance.address().port}`;
  try {
    await request('POST', '/api/login', {}, undefined, { base: url });
    const r = await request('POST', '/api/login', {}, undefined, { base: url }); status(r, 429);
    assert.ok(Number(r.headers.get('retry-after')) > 0);
  } finally { await closeServer(instance); }
});
test('Datos y sesiones persisten al reiniciar el servidor', async () => {
  const p = await makeProduct({ codigo: 'PERSISTE-01' });
  await closeServer(server); server = await openServer(); base = `http://127.0.0.1:${server.address().port}`;
  assert.equal(status(await request('GET', `/api/productos/${p.id}`), 200).codigo, 'PERSISTE-01');
  status(await request('GET', '/api/perfil', undefined, client), 200);
});
test('Token vencido se rechaza después de dos horas', async () => {
  tick += 2 * 60 * 60 * 1000 + 1;
  status(await request('GET', '/api/perfil', undefined, client), 401);
  admin = await login('admin.prueba'); client = await login('cliente.prueba');
});
test('Contrato OpenAPI cubre exactamente las rutas implementadas', async () => {
  const spec = JSON.parse(await readFile(new URL('../docs/openapi.json', import.meta.url)));
  const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const actual = [...source.matchAll(/route\('([A-Z]+)', '([^']+)'/g)].map((m) => `${m[1]} ${m[2]}`);
  const documented = Object.entries(spec.paths).flatMap(([path, methods]) => Object.keys(methods).filter((m) => ['get','post','put','delete','patch'].includes(m)).map((m) => `${m.toUpperCase()} ${path}`));
  assert.deepEqual(documented.filter((p) => p !== 'GET /api/openapi.json').sort(), actual.sort());
  assert.equal(status(await request('GET', '/api/openapi.json'), 200).openapi, '3.1.1');
  const response = await fetch(base + '/'); assert.equal(response.status, 200); assert.ok((await response.text()).includes('RaízVolt'));
});
