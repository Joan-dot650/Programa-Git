import test from 'node:test';
import assert from 'node:assert/strict';
import { price, money, credentials, profile, product, items, pagination, id } from '../../src/validation.js';
test('U-V01: decimal a centavos y total grande sin pérdida', () => {
  assert.equal(price('680000.50'), 68000050); assert.equal(money(999999999999000000n), '9999999999990000.00');
});
test('U-V02: precio rechaza cero, coma, número JSON y exceso', () => {
  for (const input of ['0', '1,20', 20, '10000000000.00', '-1']) assert.throws(() => price(input), { status: 400 });
});
test('U-V03: credenciales normalizan usuario e impiden asignar rol', () => {
  assert.equal(credentials({ usuario: ' CLIENTE ', contrasena: 'Clave1234' }).username, 'cliente');
  assert.throws(() => credentials({ usuario: 'cliente', contrasena: 'Clave1234', rol: 'ADMIN' }), { status: 400 });
});
test('U-V04: perfil exige teléfono, municipio y dirección válidos', () => {
  const data = { nombre: 'Cliente Demo', telefono: '3000000000', municipio: 'Bogotá', direccion: 'Calle de prueba 123' };
  assert.equal(profile(data).municipio, 'Bogotá');
  assert.throws(() => profile({ ...data, telefono: 'abc1234' }), { status: 400 });
});
test('U-V05: producto requiere stock entero y categoría conocida', () => {
  const data = { codigo: 'sol-01', nombre: 'Panel solar', categoria: 'PANEL_SOLAR', precio: '150.00', existencias: 2 };
  assert.equal(product(data, true).code, 'SOL-01');
  assert.throws(() => product({ ...data, existencias: 2.5 }, true), { status: 400 });
  assert.throws(() => product({ ...data, categoria: 'OTRA' }, true), { status: 400 });
});
test('U-V06: cotización rechaza duplicados y cantidades negativas', () => {
  assert.throws(() => items({ items: [{ productoId: 1, cantidad: 1 }, { productoId: 1, cantidad: 2 }] }), { status: 400 });
  assert.throws(() => items({ items: [{ productoId: 1, cantidad: -1 }] }), { status: 400 });
});
test('U-V07: paginación limita consultas y rechaza parámetros repetidos', () => {
  assert.equal(pagination(new URLSearchParams('pagina=2&limite=10')).offset, 10);
  assert.throws(() => pagination(new URLSearchParams('limite=101')), { status: 400 });
  assert.throws(() => pagination(new URLSearchParams('pagina=1&pagina=2')), { status: 400 });
});
test('U-V08: identificadores rechazan cero e inyección', () => {
  assert.equal(id('42'), 42); for (const input of ['0', '1 OR 1=1', '-3']) assert.throws(() => id(input), { status: 400 });
});
