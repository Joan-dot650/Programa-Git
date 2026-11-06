import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { runInNewContext } from 'node:vm';
import { createApplication } from '../src/app.js';
import { Store } from '../src/database.js';
import { createUser } from '../src/auth-service.js';

/** Reproduce el subconjunto de scripts pm usado por ESTA colección, mediante Node.
 * No sustituye Postman ni pretende ejecutar cualquier colección de terceros. */
test('Las 34 solicitudes de la colección completan el recorrido HTTP documentado', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'raizvolt-coleccion-'));
  const databasePath = join(dir, 'demo.sqlite');
  const store = new Store(databasePath);
  await createUser(store, { usuario: 'admin.coleccion', contrasena: 'ClaveColeccion2026!' }, 'ADMIN');
  store.close();
  const server = await createApplication({ databasePath });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try {
    const collection = JSON.parse(await readFile(new URL('../ejemplos/RaizVolt.postman_collection.json', import.meta.url)));
    const values = new Map(collection.variable.map(({ key, value }) => [key, value]));
    values.set('base_url', `http://127.0.0.1:${server.address().port}`);
    values.set('admin_usuario', 'admin.coleccion'); values.set('admin_contrasena', 'ClaveColeccion2026!');
    const replace = (source) => source.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      assert.ok(values.has(key), `Variable faltante: ${key}`); return String(values.get(key));
    });
    let checked = 0;
    for (const item of collection.item) {
      const pm = { collectionVariables: { get: (k) => values.get(k), set: (k, v) => values.set(k, v) },
        test: (name, check) => { check(); checked++; } };
      for (const event of item.event ?? []) if (event.listen === 'prerequest') {
        runInNewContext(event.script.exec.join('\n'), { pm }, { timeout: 1000 });
      }
      const request = item.request;
      const response = await fetch(replace(request.url), { method: request.method,
        headers: Object.fromEntries(request.header.map(({ key, value }) => [key, replace(value)])),
        body: request.body ? replace(request.body.raw) : undefined });
      const source = await response.text();
      pm.response = { json: () => JSON.parse(source), to: { have: { status: (expected) => {
        assert.equal(response.status, expected, `${item.name}: ${source}`);
      } } } };
      for (const event of item.event ?? []) if (event.listen === 'test') {
        runInNewContext(event.script.exec.join('\n'), { pm }, { timeout: 1000 });
      }
    }
    assert.equal(collection.item.length, 34); assert.equal(checked, 34);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
});
