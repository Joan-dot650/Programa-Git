import test from 'node:test';
import assert from 'node:assert/strict';
import { CatalogService } from '../../src/catalog-service.js';
import { SalesService } from '../../src/sales-service.js';
import { Store } from '../../src/database.js';

test('U-C01: catálogo traduce producto inexistente en 404', () => {
  const catalog = new CatalogService({ one: () => undefined }); assert.throws(() => catalog.find(99), { status: 404 });
});
test('U-C02: resumen de inventario conserva exactitud monetaria', () => {
  const catalog = new CatalogService({ all: () => [{ precio_centavos: 125, existencias: 3 }, { precio_centavos: 200, existencias: 10 }] });
  assert.deepEqual(catalog.summary(), { referencias: 2, unidades: 13, stockBajo: 1, valorInventario: '23.75', moneda: 'COP' });
});
test('U-C03: ajuste fuera de rango no escribe movimiento ni producto', () => {
  let writes = 0; const catalog = new CatalogService({ transaction: (fn) => fn(), one: () => ({ existencias: 2 }), run: () => writes++ });
  assert.throws(() => catalog.adjust(1, { variacion: -3, motivo: 'Salida de prueba' }, { id: 1 }), { status: 409 }); assert.equal(writes, 0);
});
test('U-S01: acceso a documentos ajenos devuelve 404', () => {
  const service = new SalesService({ one: () => ({ usuario_id: 8 }) });
  assert.throws(() => service.owned('pedidos', 1, { id: 7, rol: 'CLIENTE' }), { status: 404 });
});
test('U-S02: cliente no puede despachar pedido', () => {
  const service = new SalesService({ transaction: (fn) => fn(), one: () => ({ usuario_id: 7, estado: 'PENDIENTE' }) });
  assert.throws(() => service.changeState(1, { estado: 'ENVIADO' }, { id: 7, rol: 'CLIENTE' }), { status: 403 });
});
test('U-S03: administrador no puede pasar directamente a entregado', () => {
  const service = new SalesService({ transaction: (fn) => fn(), one: () => ({ usuario_id: 7, estado: 'PENDIENTE' }) });
  assert.throws(() => service.changeState(1, { estado: 'ENTREGADO' }, { id: 1, rol: 'ADMIN' }), { status: 409 });
});
test('U-S04: precio de cotización se toma del catálogo y usa enteros exactos', () => {
  let total; const store = { transaction: (fn) => fn(), run: (sql, ...args) => { if (sql.startsWith('INSERT INTO cotizaciones')) total = args[1]; return { lastInsertRowid: 3 }; } };
  const service = new SalesService(store, { find: () => ({ precio_centavos: 101, codigo: 'SOL', nombre: 'Panel' }) }, () => 0);
  service.quote = () => ({ id: 3 }); service.createQuote({ items: [{ productoId: 1, cantidad: 3 }] }, { id: 7 }); assert.equal(total, '303');
});
test('U-S05: cotización vencida bloquea el pedido antes de escritura', () => {
  let writes = 0; const service = new SalesService({ transaction: (fn) => fn(), one: (sql) => sql.includes('FROM cotizaciones') ? { expira_ms: 100 } : undefined, run: () => writes++ }, {}, () => 100);
  assert.throws(() => service.createOrder({ cotizacionId: 1 }, { id: 7 }), { status: 409 }); assert.equal(writes, 0);
});
test('U-D01: transacción confirma resultado o revierte el fallo', () => {
  const calls = []; const store = { db: { exec: (sql) => calls.push(sql) } };
  assert.equal(Store.prototype.transaction.call(store, () => 8), 8);
  assert.deepEqual(calls, ['BEGIN IMMEDIATE', 'COMMIT']); calls.length = 0;
  assert.throws(() => Store.prototype.transaction.call(store, () => { throw new Error('fallo'); }));
  assert.deepEqual(calls, ['BEGIN IMMEDIATE', 'ROLLBACK']);
});
