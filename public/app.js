import { api, session } from './api.js';
import { cart } from './cart.js';
import { escape, notice, bindAction } from './components.js';
import { catalogView } from './catalog.js';
import { accountView, profileView } from './account.js';
import { quotesView, ordersView } from './sales.js';
import { adminView } from './admin.js';

function navigation() {
  const current = location.hash.slice(1) || 'catalogo';
  const items = [['catalogo', 'Catálogo'], ...(session.user ? [['cotizaciones', 'Cotizaciones'], ['pedidos', 'Pedidos'], ['perfil', 'Mi perfil'], ...(session.user.rol === 'ADMIN' ? [['admin', 'Administración']] : [])] : [['cuenta', 'Ingresar']])];
  document.querySelector('#nav').innerHTML = items.map(([path, label]) => `<a href="#${path}" ${path === current ? 'class="active" aria-current="page"' : ''}>${label}</a>`).join('') + (session.user ? '<button id="logout" class="secondary small">Salir</button>' : '');
  document.querySelector('#session-label').textContent = session.user ? `${session.user.usuario} · ${session.user.rol}` : 'Catálogo público';
  if (session.user) bindAction(document.querySelector('#logout'), async () => {
    try { await api('/logout', { method: 'POST' }); }
    finally { session.token = null; session.user = null; cart.clear(); location.hash = 'catalogo'; await render(); notice('Sesión cerrada.'); }
  });
}

// Cada navegación usa un contenedor separado; una respuesta tardía no reemplaza la vista nueva.
export async function render() {
  let route = location.hash.slice(1) || 'catalogo';
  if (!['catalogo', 'cuenta'].includes(route) && !session.user) { location.hash = 'cuenta'; return; }
  navigation();
  const host = document.querySelector('#main'); const root = document.createElement('div');
  host.replaceChildren(root); root.innerHTML = '<p class="muted">Cargando...</p>';
  try {
    const views = { catalogo: catalogView, cuenta: (r) => accountView(r, navigation), perfil: profileView, cotizaciones: quotesView, pedidos: ordersView,
      admin: (r) => session.user?.rol === 'ADMIN' ? adminView(r) : Promise.reject(new Error('Se requiere el rol ADMIN.')) };
    await (views[route] ?? catalogView)(root);
  } catch (error) { root.innerHTML = `<div class="empty">${escape(error.message)}</div>`; notice(error.message, true); }
}
window.addEventListener('hashchange', render);
window.addEventListener('session-expired', () => { cart.clear(); location.hash = 'cuenta'; navigation(); });
render();
