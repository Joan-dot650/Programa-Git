import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, cp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { DatabaseSync } from 'node:sqlite';

// Cada caso valida el artefacto entregado con una base temporal independiente.
async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'raizvolt-release-'));
  const dbPath = join(dir, 'prueba.sqlite');
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  let child;
  const base = `http://127.0.0.1:${port}`;
  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      const done = once(child, 'exit'); child.kill('SIGTERM'); await done;
    }
  }
  async function start(path = dbPath) {
    child = spawn(process.execPath, ['dist/src/server.js'], { env: { ...process.env, DB_PATH: path, PORT: String(port) }, stdio: 'pipe' });
    let log = ''; child.stderr.on('data', data => { log += data; });
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(log || 'El compilado no inició');
      try { if ((await fetch(base + '/api/salud')).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('El compilado no respondió a salud: ' + log);
  }
  t.after(async () => { await stop(); await rm(dir, { recursive: true, force: true }); });
  await start();
  return { base, dir, dbPath, start, stop };
}

test('R-01: artefacto compilado inicia y declara la misma versión que el paquete', async t => {
  const { base } = await setup(t);
  const result = await fetch(base + '/api/salud');
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.exito, true);
  assert.equal(body.version, JSON.parse(await readFile('dist/package.json', 'utf8')).version);
});
test('R-02: compilado entrega interfaz, JavaScript, estilos y contratos', async t => {
  const { base } = await setup(t);
  for (const path of ['/', '/app.js', '/style.css', '/documentacion', '/api/openapi.json']) {
    const res = await fetch(base + path); assert.equal(res.status, 200, path); assert.ok((await res.text()).length > 0);
  }
});
test('R-03: compilado conserva cuentas después de cerrar y reiniciar', async t => {
  const env = await setup(t);
  const body = JSON.stringify({ usuario: 'persistencia.ev02', contrasena: 'Temporal-Prueba2026!' });
  assert.equal((await fetch(env.base + '/api/registro', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status, 201);
  await env.stop(); await env.start();
  const res = await fetch(env.base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  assert.equal(res.status, 200); assert.equal((await res.json()).usuario.usuario, 'persistencia.ev02');
});
test('R-04: respaldo con servidor detenido restaura datos e integridad referencial', async t => {
  const env = await setup(t);
  const body = JSON.stringify({ usuario: 'respaldo.ev02', contrasena: 'Temporal-Prueba2026!' });
  assert.equal((await fetch(env.base + '/api/registro', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status, 201);
  await env.stop();
  const restored = join(env.dir, 'restaurada.sqlite'); await cp(env.dbPath, restored, { errorOnExist: true, force: false });
  const db = new DatabaseSync(restored);
  assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []); db.close();
  await env.start(restored);
  assert.equal((await fetch(env.base + '/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body })).status, 200);
});
test('R-05: compilado bloquea archivos internos y protege inventario', async t => {
  const { base } = await setup(t);
  for (const path of ['/src/server.js', '/data/raizvolt.sqlite', '/.env']) assert.equal((await fetch(base + path)).status, 404);
  assert.equal((await fetch(base + '/api/inventario')).status, 401);
});
test('R-06: compilado y fuentes entregan el mismo contrato y esquema', async t => {
  const { base } = await setup(t);
  assert.deepEqual(await (await fetch(base + '/api/openapi.json')).json(), JSON.parse(await readFile('docs/openapi.json', 'utf8')));
  assert.equal(await readFile('dist/src/schema.sql', 'utf8'), await readFile('src/schema.sql', 'utf8'));
});
