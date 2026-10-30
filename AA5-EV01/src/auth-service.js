import { randomBytes } from 'node:crypto';
import { ApiError } from './errors.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { validateCredentials } from './validation.js';

/** Expone solo datos públicos; excluye explícitamente el hash de las respuestas. */
function publicUser(record) {
  return { id: Number(record.id), usuario: record.usuario, creadoEn: record.creado_en };
}

export async function createAuthService(repository) {
  // Igualamos el trabajo criptográfico cuando el nombre de usuario no existe.
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));

  return {
    async register(body) {
      const { username, password } = validateCredentials(body);
      if (repository.findByUsername(username)) {
        throw new ApiError(409, 'El usuario ya está registrado.');
      }
      const passwordHash = await hashPassword(password);
      const record = repository.create(username, passwordHash);
      return { exito: true, mensaje: 'Registro satisfactorio.', usuario: publicUser(record) };
    },

    async login(body) {
      const { username, password } = validateCredentials(body);
      const record = repository.findByUsername(username);
      const matches = await verifyPassword(password, record?.password_hash ?? dummyHash);
      if (!record || !matches) throw new ApiError(401, 'Error en la autenticación');
      return { exito: true, mensaje: 'Autenticación satisfactoria', usuario: publicUser(record) };
    },
  };
}

