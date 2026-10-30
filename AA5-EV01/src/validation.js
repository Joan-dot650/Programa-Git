import { ApiError } from './errors.js';

/** Aplica las mismas reglas al registro y al inicio de sesión. */
export function validateCredentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'El cuerpo debe ser un objeto JSON.');
  }

  const details = {};
  const fields = Object.keys(body);
  if (fields.some((field) => !['usuario', 'contrasena'].includes(field))) {
    details.campos = 'Solo se admiten usuario y contrasena.';
  }

  // Solo se normaliza el usuario; la contraseña conserva todos sus caracteres.
  const username = typeof body.usuario === 'string' ? body.usuario.trim().toLowerCase() : '';
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) {
    details.usuario = 'Usa de 3 a 30 caracteres: letras, números, punto, guion o guion bajo. Comienza con letra o número.';
  }

  const password = body.contrasena;
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !password.trim()) {
    details.contrasena = 'La contraseña debe tener de 8 a 128 caracteres y no puede contener solo espacios.';
  }
  if (Object.keys(details).length > 0) {
    throw new ApiError(400, 'Datos de entrada inválidos.', details);
  }
  return { username, password };
}

