import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createApplication } from '../src/app.js';

let directory;
let databasePath;
let server;
let baseUrl;
const credentials = { usuario: 'jhon.demo', contrasena: 'Solar2026!' };

async function start(options) {
  const instance = await createApplication(options);
  instance.listen(0, '127.0.0.1');
  await once(instance, 'listening');
  return { instance, url: `http://127.0.0.1:${instance.address().port}` };
}

async function stop(instance) {
  if (!instance.listening) return;
  await new Promise((resolve, reject) => instance.close((error) => error ? reject(error) : resolve()));
}

async function post(path, body, url = baseUrl) {
  const response = await fetch(`${url}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return { response, data: await response.json() };
}

// Se prueba por HTTP y con un archivo SQLite temporal real, sin tocar cuentas del usuario.
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'aa5-auth-'));
  databasePath = join(directory, 'usuarios.sqlite');
  const running = await start({ databasePath, rateLimit: { maxAttempts: 500 } });
  server = running.instance;
  baseUrl = running.url;
});

after(async () => {
  if (server) await stop(server);
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('RF01: registra una cuenta y excluye contraseña/hash de la respuesta', async () => {
  const { response, data } = await post('/api/registro', credentials);
  assert.equal(response.status, 201);
  assert.equal(data.exito, true);
  assert.equal(data.mensaje, 'Registro satisfactorio.');
  assert.equal(data.usuario.usuario, credentials.usuario);
  assert.ok(data.usuario.id > 0);
  assert.equal('password_hash' in data.usuario, false);
  assert.equal('contrasena' in data.usuario, false);
});

test('RF02: credenciales correctas devuelven autenticación satisfactoria', async () => {
  const { response, data } = await post('/api/login', credentials);
  assert.equal(response.status, 200);
  assert.equal(data.mensaje, 'Autenticación satisfactoria');
});

test('RF03: contraseña incorrecta produce HTTP 401', async () => {
  const { response, data } = await post('/api/login', { ...credentials, contrasena: 'Equivocada123!' });
  assert.equal(response.status, 401);
  assert.deepEqual(data, { exito: false, mensaje: 'Error en la autenticación' });
});

test('RF03: usuario inexistente tiene el mismo error de autenticación', async () => {
  const { response, data } = await post('/api/login', { ...credentials, usuario: 'no.existe' });
  assert.equal(response.status, 401);
  assert.deepEqual(data, { exito: false, mensaje: 'Error en la autenticación' });
});

test('RF04: rechaza registro duplicado', async () => {
  const { response } = await post('/api/registro', credentials);
  assert.equal(response.status, 409);
});

test('RF04: normaliza espacios de extremos y mayúsculas del usuario', async () => {
  const { response, data } = await post('/api/login', { ...credentials, usuario: '  JHON.DEMO  ' });
  assert.equal(response.status, 200);
  assert.equal(data.usuario.usuario, 'jhon.demo');
  const duplicate = await post('/api/registro', { ...credentials, usuario: 'JHON.DEMO' });
  assert.equal(duplicate.response.status, 409);
});

const invalidCases = [
  ['campos ausentes', {}],
  ['usuario vacío', { ...credentials, usuario: '' }],
  ['usuario corto', { ...credentials, usuario: 'ab' }],
  ['usuario largo', { ...credentials, usuario: 'a'.repeat(31) }],
  ['usuario numérico', { ...credentials, usuario: 12345 }],
  ['usuario con espacio interno', { ...credentials, usuario: 'jhon demo' }],
  ['usuario que comienza con guion', { ...credentials, usuario: '-demo' }],
  ['intento de inyección SQL', { ...credentials, usuario: "' OR 1=1 --" }],
  ['contraseña corta', { ...credentials, contrasena: '1234567' }],
  ['contraseña demasiado larga', { ...credentials, contrasena: 'a'.repeat(129) }],
  ['contraseña en blanco', { ...credentials, contrasena: '        ' }],
  ['contraseña no textual', { ...credentials, contrasena: 12345678 }],
  ['propiedad inesperada', { ...credentials, administrador: true }],
  ['objeto nulo', null],
  ['arreglo', []],
];

for (const [name, body] of invalidCases) {
  test(`RF04: ${name} se rechaza en registro e inicio de sesión`, async () => {
    for (const path of ['/api/registro', '/api/login']) {
      const { response, data } = await post(path, body);
      assert.equal(response.status, 400);
      assert.equal(data.exito, false);
    }
  });
}

test('acepta los límites inferiores de longitud', async () => {
  const body = { usuario: 'abc', contrasena: '12345678' };
  assert.equal((await post('/api/registro', body)).response.status, 201);
  assert.equal((await post('/api/login', body)).response.status, 200);
});

test('acepta los límites superiores de longitud', async () => {
  const body = { usuario: 'a'.repeat(30), contrasena: 'a'.repeat(128) };
  assert.equal((await post('/api/registro', body)).response.status, 201);
  assert.equal((await post('/api/login', body)).response.status, 200);
});

test('permite caracteres especiales y conserva espacios y mayúsculas de contraseña', async () => {
  const body = { usuario: 'especial', contrasena: ' Clave ñ $ 2026! ' };
  assert.equal((await post('/api/registro', body)).response.status, 201);
  assert.equal((await post('/api/login', body)).response.status, 200);
  assert.equal((await post('/api/login', { ...body, contrasena: body.contrasena.trim() })).response.status, 401);
  assert.equal((await post('/api/login', { ...body, contrasena: body.contrasena.toLowerCase() })).response.status, 401);
});

test('dos registros simultáneos del mismo usuario crean una sola cuenta', async () => {
  const body = { ...credentials, usuario: 'simultaneo' };
  const results = await Promise.all([post('/api/registro', body), post('/api/registro', body)]);
  assert.deepEqual(results.map((item) => item.response.status).sort(), [201, 409]);
});

test('la base guarda hashes diferentes para contraseñas iguales', async () => {
  await post('/api/registro', { ...credentials, usuario: 'otra.cuenta' });
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const rows = db.prepare('SELECT password_hash FROM usuarios WHERE usuario IN (?, ?)').all('jhon.demo', 'otra.cuenta');
    assert.equal(rows.length, 2);
    assert.notEqual(rows[0].password_hash, rows[1].password_hash);
    for (const row of rows) {
      assert.match(row.password_hash, /^scrypt\$16384\$8\$5\$/);
      assert.equal(row.password_hash.includes(credentials.contrasena), false);
    }
  } finally { db.close(); }
});

test('RF05: la cuenta persiste después de cerrar y reabrir el servidor', async () => {
  await stop(server);
  const running = await start({ databasePath, rateLimit: { maxAttempts: 500 } });
  server = running.instance;
  baseUrl = running.url;
  assert.equal((await post('/api/login', credentials)).response.status, 200);
});

test('rechaza JSON mal formado con HTTP 400', async () => {
  const response = await fetch(`${baseUrl}/api/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).mensaje, 'JSON inválido.');
});

test('rechaza bytes UTF-8 inválidos con HTTP 400', async () => {
  const response = await fetch(`${baseUrl}/api/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: Buffer.from([0xff]),
  });
  assert.equal(response.status, 400);
  await response.text();
});

test('exige application/json con HTTP 415', async () => {
  const response = await fetch(`${baseUrl}/api/registro`, { method: 'POST', body: JSON.stringify(credentials) });
  assert.equal(response.status, 415);
  await response.text();
});

test('rechaza cuerpos comprimidos no admitidos con HTTP 415', async () => {
  const response = await fetch(`${baseUrl}/api/registro`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body: '{}',
  });
  assert.equal(response.status, 415);
  await response.text();
});

test('limita el tamaño del cuerpo con HTTP 413', async () => {
  const { response } = await post('/api/registro', { usuario: 'x'.repeat(5000), contrasena: '12345678' });
  assert.equal(response.status, 413);
});

test('rechaza un método incorrecto e informa el método permitido', async () => {
  const response = await fetch(`${baseUrl}/api/login`);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'POST');
  await response.text();
});

test('una ruta inexistente devuelve JSON 404', async () => {
  const response = await fetch(`${baseUrl}/no-existe`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).exito, false);
});

test('no expone la base de datos ni los archivos fuente por HTTP', async () => {
  for (const path of ['/data/usuarios.sqlite', '/src/server.js', '/.git/config']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 404);
    await response.text();
  }
});

test('la pantalla y sus recursos se sirven sin dependencias externas', async () => {
  for (const path of ['/', '/styles.css', '/app.js']) {
    const response = await fetch(baseUrl + path);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 100);
  }
});

test('incluye cabeceras de seguridad y no habilita CORS abierto', async () => {
  const response = await fetch(`${baseUrl}/api/salud`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  await response.text();
});

test('el contrato OpenAPI documenta ambos métodos', async () => {
  const response = await fetch(`${baseUrl}/api/openapi.json`);
  assert.equal(response.status, 200);
  const contract = await response.json();
  assert.equal(contract.openapi, '3.1.0');
  assert.ok(contract.paths['/api/registro'].post.responses['201']);
  assert.ok(contract.paths['/api/login'].post.responses['401']);
});

test('el límite predeterminado bloquea la solicitud 21 de una IP', async (context) => {
  const running = await start({ databasePath: ':memory:' });
  context.after(() => stop(running.instance));
  for (let index = 0; index < 20; index += 1) {
    const result = await post(index % 2 ? '/api/login' : '/api/registro', {}, running.url);
    assert.equal(result.response.status, 400);
  }
  const result = await post('/api/login', credentials, running.url);
  assert.equal(result.response.status, 429);
  assert.ok(Number(result.response.headers.get('retry-after')) > 0);
});

test('el límite permite nuevos intentos al vencer la ventana', async (context) => {
  let time = 100000;
  const running = await start({ databasePath: ':memory:', rateLimit: { maxAttempts: 1, windowMs: 1000, now: () => time } });
  context.after(() => stop(running.instance));
  assert.equal((await post('/api/login', {}, running.url)).response.status, 400);
  assert.equal((await post('/api/login', {}, running.url)).response.status, 429);
  time += 1001;
  assert.equal((await post('/api/login', {}, running.url)).response.status, 400);
});
