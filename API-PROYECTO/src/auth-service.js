import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from './errors.js';
import { hashPassword, verifyPassword } from './passwords.js';
import { credentials, profile } from './validation.js';

const digest = (token) => createHash('sha256').update(token).digest('hex');
const publicUser = (row) => ({ id: row.id, usuario: row.usuario, rol: row.rol,
  nombre: row.nombre, telefono: row.telefono, municipio: row.municipio,
  direccion: row.direccion, creadoEn: row.creado_en });

/** Función compartida con el comando local de administrador; la API siempre crea CLIENTE. */
export async function createUser(store, body, role = 'CLIENTE') {
  const { username, password } = credentials(body);
  if (store.one('SELECT id FROM usuarios WHERE usuario=?', username)) throw new ApiError(409, 'El usuario ya está registrado.');
  const encoded = await hashPassword(password);
  try {
    const result = store.run('INSERT INTO usuarios (usuario,password_hash,rol,creado_en) VALUES (?,?,?,?)',
      username, encoded, role, new Date().toISOString());
    return publicUser(store.one('SELECT * FROM usuarios WHERE id=?', Number(result.lastInsertRowid)));
  } catch (error) {
    if (error.errcode === 2067) throw new ApiError(409, 'El usuario ya está registrado.');
    throw error;
  }
}

export async function createAuthService(store, now = Date.now) {
  const dummy = await hashPassword(randomBytes(32).toString('hex'));
  return {
    async register(body) {
      return { exito: true, mensaje: 'Registro satisfactorio.', usuario: await createUser(store, body) };
    },
    async login(body) {
      const { username, password } = credentials(body);
      const user = store.one('SELECT * FROM usuarios WHERE usuario=?', username);
      const valid = await verifyPassword(password, user?.password_hash ?? dummy);
      if (!user || !valid) throw new ApiError(401, 'Error en la autenticación');
      const token = randomBytes(32).toString('hex');
      const expires = now() + 2 * 60 * 60 * 1000;
      store.transaction(() => {
        store.run('DELETE FROM sesiones WHERE expira_ms<=?', now());
        // Un nuevo inicio de sesión invalida la sesión anterior de la misma cuenta.
        store.run('DELETE FROM sesiones WHERE usuario_id=?', user.id);
        store.run('INSERT INTO sesiones (token_hash,usuario_id,expira_ms) VALUES (?,?,?)', digest(token), user.id, expires);
      });
      return { exito: true, mensaje: 'Autenticación satisfactoria', token, tipo: 'Bearer',
        expiraEn: new Date(expires).toISOString(), usuario: publicUser(user) };
    },
    authenticate(header) {
      if (typeof header !== 'string' || !/^Bearer [a-f0-9]{64}$/.test(header)) throw new ApiError(401, 'Se requiere un token Bearer válido.');
      const tokenHash = digest(header.slice(7));
      const user = store.one(`SELECT u.* FROM usuarios u JOIN sesiones s ON s.usuario_id=u.id
        WHERE s.token_hash=? AND s.expira_ms>?`, tokenHash, now());
      if (!user) throw new ApiError(401, 'Sesión inválida o vencida.');
      return { ...publicUser(user), tokenHash };
    },
    logout(user) { store.run('DELETE FROM sesiones WHERE token_hash=?', user.tokenHash); },
    getProfile(user) { return publicUser(store.one('SELECT * FROM usuarios WHERE id=?', user.id)); },
    updateProfile(user, body) {
      const data = profile(body);
      store.run('UPDATE usuarios SET nombre=?,telefono=?,municipio=?,direccion=? WHERE id=?',
        data.nombre, data.telefono, data.municipio, data.direccion, user.id);
      return this.getProfile(user);
    },
  };
}
