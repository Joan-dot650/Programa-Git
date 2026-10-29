export const CATEGORIAS = Object.freeze({
  PANEL_SOLAR: 'Panel solar',
  INVERSOR: 'Inversor',
  BATERIA: 'Batería',
  KIT_SOLAR: 'Kit solar',
  ACCESORIO: 'Accesorio',
});

export const FORMULARIO_VACIO = Object.freeze({
  codigo: '', nombre: '', categoria: '', precio: '', existencias: '',
});

/** No se convierte a Number: los centavos permanecen exactos incluso en totales grandes. */
export function formatearMoneda(decimal) {
  const [entero, centavos = '00'] = String(decimal).split('.');
  return `$ ${BigInt(entero || '0').toLocaleString('es-CO')},${centavos.padEnd(2, '0')}`;
}

export function validarProducto(valores) {
  const errores = {};
  const codigo = valores.codigo.trim().toUpperCase();
  const nombre = valores.nombre.trim();
  const precio = valores.precio.trim();
  const existencias = valores.existencias.trim();
  if (!/^[A-Z0-9-]{3,30}$/.test(codigo)) {
    errores.codigo = 'Escribe de 3 a 30 letras, números o guiones.';
  }
  if (nombre.length < 3 || nombre.length > 120 || /[\u0000-\u001f\u007f-\u009f]/.test(nombre)) {
    errores.nombre = 'Escribe de 3 a 120 caracteres en una sola línea.';
  }
  if (!Object.hasOwn(CATEGORIAS, valores.categoria)) {
    errores.categoria = 'Selecciona una categoría de la lista.';
  }
  if (!/^[0-9]{1,10}([.,][0-9]{1,2})?$/.test(precio) || !/[1-9]/.test(precio)) {
    errores.precio = 'Ingresa un precio mayor que 0, hasta 9999999999.99 y con máximo 2 decimales.';
  }
  if (!/^[0-9]+$/.test(existencias) || Number(existencias) > 1000000) {
    errores.existencias = 'Escribe un número entero entre 0 y 1000000.';
  }
  return errores;
}

export function normalizarProducto(valores) {
  return {
    codigo: valores.codigo.trim().toUpperCase(),
    nombre: valores.nombre.trim(),
    categoria: valores.categoria,
    precio: valores.precio.trim().replace(',', '.'),
    existencias: valores.existencias.trim(),
  };
}

/** Rutas con hash: funcionan al recargar sin reglas especiales del servidor. */
export function leerRuta(hash = window.location.hash) {
  const [ruta, parametros = ''] = hash.replace(/^#/, '').split('?');
  if (!ruta || ruta === '/' || ruta === '/productos') {
    return { vista: 'catalogo', consulta: new URLSearchParams(parametros).get('q')?.slice(0, 120) || '' };
  }
  if (ruta === '/productos/nuevo') return { vista: 'nuevo' };
  const coincidencia = ruta.match(/^\/productos\/([1-9][0-9]*)\/(editar|eliminar)$/);
  if (coincidencia) return { vista: coincidencia[2], id: coincidencia[1] };
  return { vista: 'desconocida' };
}
