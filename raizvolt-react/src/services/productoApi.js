const BASE_API = '/raizvolt/api';

export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, errores = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.errores = errores;
  }
}

async function solicitar(ruta, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_API}${ruta}`, {
      credentials: 'same-origin',
      ...opciones,
      headers: { Accept: 'application/json', ...opciones.headers },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    const mensaje = opciones.method
      ? 'Se perdió la conexión. El resultado no está confirmado; consulta el catálogo antes de repetir la operación.'
      : 'No fue posible conectar con el servidor. Comprueba que la aplicación esté iniciada e inténtalo de nuevo.';
    throw new ErrorApi(mensaje);
  }
  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = respuesta.status === 403
      ? 'La sesión venció. Tus datos siguen aquí; vuelve a guardar para renovar la sesión.'
      : datos?.mensaje || 'No fue posible completar la solicitud.';
    throw new ErrorApi(mensaje, respuesta.status, datos?.errores || {});
  }
  if (datos === null) throw new ErrorApi('El servidor devolvió una respuesta inesperada.');
  return datos;
}

async function escribir(ruta, metodo, producto) {
  // Obtener el token en cada operación también recupera una sesión caducada.
  const csrf = await solicitar('/csrf');
  return solicitar(ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', [csrf.headerName]: csrf.token },
    ...(producto ? { body: JSON.stringify(producto) } : {}),
  });
}

export const productoApi = {
  consultar: (consulta, signal) => solicitar(`/productos?q=${encodeURIComponent(consulta)}`, { signal }),
  buscar: (id, signal) => solicitar(`/productos/${id}`, { signal }),
  registrar: (producto) => escribir('/productos', 'POST', producto),
  actualizar: (id, producto) => escribir(`/productos/${id}`, 'PUT', producto),
  eliminar: (id) => escribir(`/productos/${id}`, 'DELETE'),
};
