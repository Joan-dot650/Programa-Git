import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarProducto, normalizarProducto, formatearMoneda, leerRuta } from '../src/utils/productos.js';

const valido = { codigo: 'SOL-550', nombre: 'Panel solar', categoria: 'PANEL_SOLAR', precio: '680000.50', existencias: '12' };
test('normaliza código, espacios y coma sin convertir importes a punto flotante', () => {
  assert.deepEqual(normalizarProducto({ ...valido, codigo: ' sol-550 ', nombre: ' Panel solar ', precio: '680000,50' }), valido);
});
test('acepta tildes, cero existencias y límites monetarios', () => {
  for (const precio of ['0.01', '0,01', '9999999999.99']) {
    assert.deepEqual(validarProducto({ ...valido, nombre: 'Batería pequeña', precio, existencias: '0' }), {});
  }
});
for (const [campo, valores] of Object.entries({
  codigo: ['', 'AB', 'BAD_CODE', 'ÑÑÑ', 'A'.repeat(31)],
  nombre: ['', 'ab', 'a'.repeat(121), 'Panel\nsolar', 'Panel\u0085solar'],
  categoria: ['', 'OTRA', 'toString'],
  precio: ['', '0', '-1', '1e3', '1.234', '1.000.000', '10000000000', 'NaN', 'Infinity'],
  existencias: ['', '-1', '1.5', '1e3', '1000001', 'Infinity'],
})) {
  for (const valor of valores) test(`rechaza ${campo}: ${JSON.stringify(valor)}`, () => {
    assert.ok(validarProducto({ ...valido, [campo]: valor })[campo]);
  });
}
test('muestra centavos exactos aunque el total supere Number.MAX_SAFE_INTEGER', () => {
  assert.equal(formatearMoneda('9999999999990000.01'), '$ 9.999.999.999.990.000,01');
  assert.equal(formatearMoneda('680000.50'), '$ 680.000,50');
});
test('interpreta rutas al recargar y conserva búsqueda codificada', () => {
  assert.deepEqual(leerRuta('#/productos?q=Bater%C3%ADa'), { vista: 'catalogo', consulta: 'Batería' });
  assert.deepEqual(leerRuta('#/productos/12/editar'), { vista: 'editar', id: '12' });
  assert.deepEqual(leerRuta('#/productos/12/eliminar'), { vista: 'eliminar', id: '12' });
  assert.deepEqual(leerRuta('#/productos/nuevo'), { vista: 'nuevo' });
  assert.equal(leerRuta('#/productos/0/editar').vista, 'desconocida');
  assert.equal(leerRuta('#/otra').vista, 'desconocida');
});
