import test from 'node:test';
import assert from 'node:assert/strict';
import { Cart } from '../../public/cart.js';
import { escape, currency } from '../../public/components.js';
test('U-F01: carrito acumula cantidades y envía únicamente ID y cantidad', () => {
  const cart = new Cart(); cart.add({ id: 1, nombre: 'Panel', precio: '99.00' }, 2); cart.add({ id: 1 }, 3);
  assert.deepEqual(cart.items(), [{ productoId: 1, cantidad: 5 }]);
});
test('U-F02: carrito rechaza cero, fracción y exceso', () => {
  const cart = new Cart(); for (const q of [0, -1, 1.5, 10001]) assert.throws(() => cart.add({ id: 1 }, q));
});
test('U-F03: carrito limita 20 productos, permite quitar y limpiar', () => {
  const cart = new Cart(); for (let i = 1; i <= 20; i++) cart.add({ id: i }, 1);
  assert.throws(() => cart.add({ id: 21 }, 1)); cart.remove(1); cart.add({ id: 21 }, 1); cart.clear(); assert.deepEqual(cart.items(), []);
});
test('U-F04: contenido HTML no se interpreta al mostrar datos', () => {
  assert.equal(escape('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
});
test('U-F05: moneda conserva decimales y valores grandes', () => {
  assert.equal(currency('680000.50'), '$ 680.000,50 COP');
  assert.equal(currency('9999999999990000.01'), '$ 9.999.999.999.990.000,01 COP');
});
