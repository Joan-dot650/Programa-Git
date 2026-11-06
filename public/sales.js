import { api, session } from './api.js';
import { cart } from './cart.js';
import { escape, currency, bindAction, pagination, notice } from './components.js';

const lines = (items) => `<div class="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>${items.map((p) => `<tr><td>${escape(p.nombre)}</td><td>${p.cantidad}</td><td>${currency(p.precioUnitario)}</td><td>${currency(p.subtotal)}</td></tr>`).join('')}</tbody></table></div>`;

export async function quotesView(root, page = 1) {
  const result = await api(`/cotizaciones?pagina=${page}&limite=5`);
  const pending = [...cart.lines.values()];
  root.innerHTML = `<div class="section-heading"><h1>Cotizaciones</h1><a href="#catalogo">Seguir explorando</a></div><section class="panel"><h2>Tu selección</h2>${pending.length ? `<div class="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Acción</th></tr></thead><tbody>${pending.map((p) => `<tr><td>${escape(p.nombre)}</td><td>${p.cantidad}</td><td><button class="secondary small" data-remove="${p.id}">Quitar</button></td></tr>`).join('')}</tbody></table></div><p class="hint">La cotización usa los precios vigentes del servidor y no reserva inventario.</p><button id="quote">Generar cotización</button>` : '<p class="muted">Añade productos desde el catálogo para crear una cotización.</p>'}</section><h2>Historial de cotizaciones</h2><div class="stack">${result.cotizaciones.map((quote) => `<article class="panel"><div class="section-heading"><h3>Cotización #${quote.id}</h3><strong>${currency(quote.total)}</strong></div><p class="hint muted">Válida hasta ${new Date(quote.venceEn).toLocaleDateString('es-CO')}${session.user.rol === 'ADMIN' ? ` · Cliente #${quote.usuarioId}` : ''}</p>${lines(quote.items)}${quote.usuarioId === session.user.id ? `<p class="hint">Verifica tu perfil y la dirección. Al confirmar se descuenta el inventario disponible.</p><button data-confirm="${quote.id}">Confirmar pedido</button>` : ''}</article>`).join('') || '<div class="empty">Aún no hay cotizaciones.</div>'}</div><div id="pager"></div>`;
  root.querySelectorAll('[data-remove]').forEach((button) => bindAction(button, () => { cart.remove(Number(button.dataset.remove)); return quotesView(root, page); }));
  if (pending.length) bindAction(root.querySelector('#quote'), async () => {
    const quote = await api('/cotizaciones', { method: 'POST', body: { items: cart.items() } });
    cart.clear(); await quotesView(root); notice(`Cotización #${quote.id} creada con precios del servidor.`);
  });
  root.querySelectorAll('[data-confirm]').forEach((button) => bindAction(button, async () => {
    if (!window.confirm('¿Confirmar este pedido con los datos de tu perfil?')) return;
    const order = await api('/pedidos', { method: 'POST', body: { cotizacionId: Number(button.dataset.confirm) } });
    location.hash = 'pedidos'; notice(`Pedido #${order.id} registrado. Estado: ${order.estado}.`);
  }));
  pagination(root.querySelector('#pager'), page, result.total, 5, (next) => quotesView(root, next));
}

export async function ordersView(root, page = 1) {
  const result = await api(`/pedidos?pagina=${page}&limite=5`);
  root.innerHTML = `<div class="section-heading"><h1>${session.user.rol === 'ADMIN' ? 'Gestión de pedidos' : 'Mis pedidos'}</h1><span class="tag">${result.total} pedidos</span></div><div class="stack">${result.pedidos.map((order) => `<article class="panel"><div class="section-heading"><h3>Pedido #${order.id}</h3><span class="tag ${order.estado === 'PENDIENTE' ? 'pending' : ''}">${order.estado}</span></div><p class="hint">Entrega: ${escape(order.envio.nombre)} · ${escape(order.envio.municipio)} · ${escape(order.envio.direccion)}</p>${lines(order.items)}<div class="row"><strong>Total: ${currency(order.total)}</strong><div class="actions">${order.estado === 'PENDIENTE' ? `<button class="danger small" data-state="CANCELADO" data-id="${order.id}">Cancelar pedido</button>` : ''}${session.user.rol === 'ADMIN' && ['PENDIENTE', 'ENVIADO'].includes(order.estado) ? `<button class="small" data-state="${order.estado === 'PENDIENTE' ? 'ENVIADO' : 'ENTREGADO'}" data-id="${order.id}">${order.estado === 'PENDIENTE' ? 'Marcar enviado' : 'Marcar entregado'}</button>` : ''}</div></div></article>`).join('') || '<div class="empty">Todavía no hay pedidos. Crea una cotización para comenzar.</div>'}</div><div id="pager"></div>`;
  root.querySelectorAll('[data-state]').forEach((button) => bindAction(button, async () => {
    if (!window.confirm(`¿Cambiar el pedido #${button.dataset.id} a ${button.dataset.state}?`)) return;
    await api(`/pedidos/${button.dataset.id}/estado`, { method: 'PATCH', body: { estado: button.dataset.state } });
    await ordersView(root, page); notice('Estado del pedido actualizado.');
  }));
  pagination(root.querySelector('#pager'), page, result.total, 5, (next) => ordersView(root, next));
}
