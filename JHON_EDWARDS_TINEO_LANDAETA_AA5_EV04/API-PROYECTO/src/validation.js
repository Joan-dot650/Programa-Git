import { ApiError } from './errors.js';

export const CATEGORIES = ['PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO'];
export const MAX_STOCK = 1000000;

export function invalid(field, message) {
  throw new ApiError(400, 'Datos de entrada inválidos.', { [field]: message });
}

/** Lista cerrada de campos: evita que el cliente asigne roles, precios o propietarios. */
export function object(body, keys) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('cuerpo', 'Se requiere un objeto JSON.');
  if (Object.keys(body).some((key) => !keys.includes(key))) invalid('campos', `Solo se admiten: ${keys.join(', ')}.`);
  return body;
}

export function text(value, field, min, max) {
  if (typeof value !== 'string') invalid(field, 'Debe ser texto.');
  const clean = value.trim();
  if (clean.length < min || clean.length > max || /[\u0000-\u001f\u007f]/u.test(clean)) {
    invalid(field, `Usa de ${min} a ${max} caracteres sin saltos de línea ni caracteres de control.`);
  }
  return clean;
}

export function integer(value, field, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) invalid(field, `Debe ser un número entero de ${min} a ${max}.`);
  return value;
}

export function id(value) {
  if (!/^[1-9]\d*$/.test(value)) invalid('id', 'Identificador entero positivo.');
  return integer(Number(value), 'id', 1, Number.MAX_SAFE_INTEGER);
}

/** Los importes entran como texto; se convierten a centavos sin usar punto flotante. */
export function price(value) {
  if (typeof value !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    invalid('precio', 'Usa texto decimal con punto, sin miles, hasta 9999999999.99. Ejemplo: "680000.50".');
  }
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0')));
  if (cents < 1 || cents > 999999999999) invalid('precio', 'Debe ser mayor que cero y no superar 9999999999.99.');
  return cents;
}

export function money(cents) {
  const amount = BigInt(cents);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, '0')}`;
}

export function credentials(body) {
  object(body, ['usuario', 'contrasena']);
  const username = typeof body.usuario === 'string' ? body.usuario.trim().toLowerCase() : '';
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) invalid('usuario', 'Usa 3-30 letras, números, punto, guion o guion bajo; comienza con letra o número.');
  if (typeof body.contrasena !== 'string' || body.contrasena.length < 8 || body.contrasena.length > 128 || !body.contrasena.trim()) {
    invalid('contrasena', 'Usa de 8 a 128 caracteres; no puede contener solo espacios.');
  }
  return { username, password: body.contrasena };
}

export function product(body, creating) {
  object(body, ['codigo', 'nombre', 'categoria', 'precio', ...(creating ? ['existencias'] : [])]);
  const code = text(body.codigo, 'codigo', 3, 30).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(code)) invalid('codigo', 'Solo letras A-Z, números y guion.');
  if (!CATEGORIES.includes(body.categoria)) invalid('categoria', `Usa una de: ${CATEGORIES.join(', ')}.`);
  return {
    code, name: text(body.nombre, 'nombre', 3, 120), category: body.categoria,
    cents: price(body.precio), stock: creating ? integer(body.existencias, 'existencias', 0, MAX_STOCK) : undefined,
  };
}

export function profile(body) {
  object(body, ['nombre', 'telefono', 'municipio', 'direccion']);
  const phone = text(body.telefono, 'telefono', 7, 20);
  if (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7) invalid('telefono', 'Usa al menos siete dígitos; admite +, espacios, paréntesis y guiones.');
  return { nombre: text(body.nombre, 'nombre', 3, 100), telefono: phone,
    municipio: text(body.municipio, 'municipio', 3, 80), direccion: text(body.direccion, 'direccion', 5, 200) };
}

export function items(body) {
  object(body, ['items']);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) invalid('items', 'Envía entre 1 y 20 productos diferentes.');
  const unique = new Set();
  return body.items.map((item) => {
    object(item, ['productoId', 'cantidad']);
    const productId = integer(item.productoId, 'productoId', 1, Number.MAX_SAFE_INTEGER);
    const quantity = integer(item.cantidad, 'cantidad', 1, 10000);
    if (unique.has(productId)) invalid('items', 'No repitas un producto; suma su cantidad.');
    unique.add(productId);
    return { productId, quantity };
  });
}

/** Rechaza parámetros desconocidos/repetidos y acota el tamaño de cada página. */
export function pagination(params, extra = []) {
  const allowed = ['pagina', 'limite', ...extra];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) invalid(key, 'Parámetro desconocido o repetido.');
  }
  function number(name, fallback, max) {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^[1-9]\d*$/.test(raw)) invalid(name, 'Usa un entero positivo.');
    return integer(Number(raw), name, 1, max);
  }
  const page = number('pagina', 1, 1000000);
  const limit = number('limite', 20, 100);
  return { page, limit, offset: (page - 1) * limit };
}
