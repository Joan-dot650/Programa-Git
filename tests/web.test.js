import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApplication } from '../src/app.js';

test('W-01: interfaz y componentes públicos con CSP y lista cerrada de archivos', async () => {
  const server = await createApplication(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const root = await fetch(base); assert.equal(root.status, 200); assert.match(await root.text(), /RaízVolt/);
    assert.match(root.headers.get('content-security-policy'), /script-src 'self'/);
    for (const path of ['/app.js', '/style.css', '/documentacion']) assert.equal((await fetch(base + path)).status, 200);
    for (const path of ['/src/schema.sql', '/data/raizvolt.sqlite', '/.env', '/unknown.js']) assert.equal((await fetch(base + path)).status, 404);
    assert.equal((await fetch(base + '/app.js', { method: 'POST' })).status, 405);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
