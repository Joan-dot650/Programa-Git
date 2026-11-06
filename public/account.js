import { api, session } from './api.js';
import { escape, bindForm, notice } from './components.js';

export function accountView(root, afterLogin) {
  root.innerHTML = `<section class="panel narrow"><span class="tag">TU CUENTA RAÍZVOLT</span><h1>Bienvenido</h1><p class="muted">Accede para cotizar y consultar tus pedidos.</p><form id="login" class="stack"><div><label for="usuario">Usuario</label><input id="usuario" name="usuario" required minlength="3" maxlength="30" autocomplete="username"></div><div><label for="contrasena">Contraseña</label><input id="contrasena" name="contrasena" type="password" required minlength="8" maxlength="128" autocomplete="current-password"></div><button type="submit">Iniciar sesión</button><button class="secondary" type="button" id="register">Crear cuenta</button></form><p class="hint muted">Usuario: 3 a 30 letras, números, puntos, guiones o guion bajo. Contraseña: 8 a 128 caracteres. Al recargar la página debes volver a iniciar sesión.</p></section>`;
  bindForm(root.querySelector('#login'), async (data) => {
    const result = await api('/login', { method: 'POST', body: data });
    session.token = result.token; session.user = result.usuario; afterLogin();
    location.hash = 'catalogo'; notice(`Sesión iniciada: ${result.usuario.usuario}.`);
  });
  root.querySelector('#register').addEventListener('click', async () => {
    const form = root.querySelector('#login'); if (!form.reportValidity()) return;
    const button = root.querySelector('#register'); button.disabled = true;
    try { await api('/registro', { method: 'POST', body: Object.fromEntries(new FormData(form)) }); notice('Cuenta creada. Pulsa Iniciar sesión.'); }
    catch (error) { notice(error.message, true); } finally { button.disabled = false; }
  });
}
export async function profileView(root) {
  const user = await api('/perfil');
  const fields = [['nombre', 'Nombre completo', 3, 100], ['telefono', 'Teléfono', 7, 20], ['municipio', 'Municipio', 3, 80], ['direccion', 'Dirección de entrega', 5, 200]];
  root.innerHTML = `<div class="section-heading"><h1>Mi perfil</h1><span class="tag">${escape(user.rol)}</span></div><section class="panel"><p class="muted">Completa estos datos antes de confirmar un pedido. Usa datos ficticios para la demostración.</p><form id="profile" class="form-grid">${fields.map(([key, label, min, max]) => `<div><label for="${key}">${label}</label><input id="${key}" name="${key}" value="${escape(user[key])}" minlength="${min}" maxlength="${max}" required></div>`).join('')}<div class="full"><button type="submit">Guardar perfil</button></div></form></section>`;
  bindForm(root.querySelector('#profile'), async (body) => { session.user = await api('/perfil', { method: 'PUT', body }); notice('Perfil guardado correctamente.'); });
}
