import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../src/passwords.js';
import { createAuthService } from '../../src/auth-service.js';
import { createRateLimiter } from '../../src/rate-limit.js';

test('U-A01: hash con sal individual, contraseña válida e incorrecta', async () => {
  const a = await hashPassword('SolarUnidad2026!'); const b = await hashPassword('SolarUnidad2026!');
  assert.notEqual(a, b); assert.equal(await verifyPassword('SolarUnidad2026!', a), true);
  assert.equal(await verifyPassword('Incorrecta2026!', a), false);
});
test('U-A02: hash corrupto se rechaza sin derivación insegura', async () => {
  assert.equal(await verifyPassword('Clave123!', 'scrypt$999999999$8$5$x$y'), false);
});
test('U-A03: autenticar valida token y consulta solo su hash', async () => {
  const user = { id: 7, usuario: 'cliente.unidad', rol: 'CLIENTE' }; let query;
  const store = { one(sql, digest, time) { query = { sql, digest, time }; return user; } };
  const auth = await createAuthService(store, () => 1000);
  assert.throws(() => auth.authenticate('Bearer incorrecto'), { status: 401 });
  const result = auth.authenticate(`Bearer ${'a'.repeat(64)}`);
  assert.equal(result.id, 7); assert.notEqual(query.digest, 'a'.repeat(64)); assert.equal(query.time, 1000);
});
test('U-A04: sesión inexistente se rechaza', async () => {
  const auth = await createAuthService({ one: () => undefined });
  assert.throws(() => auth.authenticate(`Bearer ${'b'.repeat(64)}`), { status: 401 });
});
test('U-A05: logout revoca exclusivamente el hash de la sesión', async () => {
  let params; const auth = await createAuthService({ run: (...args) => { params = args; } });
  auth.logout({ tokenHash: 'hash-sesion' }); assert.equal(params[1], 'hash-sesion');
  assert.match(params[0], /DELETE FROM sesiones WHERE token_hash=\?/);
});
test('U-A06: límite por IP, aislamiento y vencimiento con reloj inyectado', () => {
  let now = 0; const consume = createRateLimiter({ maxAttempts: 2, windowMs: 1000, now: () => now });
  assert.equal(consume('a'), 0); assert.equal(consume('a'), 0); assert.equal(consume('a'), 1);
  assert.equal(consume('b'), 0); now = 1000; assert.equal(consume('a'), 0);
});
