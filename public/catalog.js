import { api, session } from './api.js';
import { cart } from './cart.js';
import { escape, currency, options, categoryName, bindForm, bindAction, pagination, notice } from './components.js';

export async function catalogView(root, { page = 1, q = '', categoria = '' } = {}) {
  const result = await api(`/productos?${new URLSearchParams({ pagina: page, limite: 6, q, categoria })}`);
  root.innerHTML = `<section class="hero"><div class="hero-copy"><div class="eyebrow">CONSTRUYE TU SOLUCIÓN SOLAR</div><h1>La energía del sol,<br>más cerca de ti.</h1><p>Explora nuestro catálogo, prepara tu cotización y consulta cada paso de tu pedido desde un solo lugar.</p></div><div class="hero-art" aria-hidden="true"><div class="solar"></div><strong>ENERGÍA CON RAÍCES</strong></div></section>
    <div class="section-heading"><h2>Catálogo de productos</h2><span class="tag">${result.total} referencias</span></div>
    <form id="filters" class="toolbar"><div><label for="q">Buscar por nombre o código</label><input id="q" name="q" maxlength="120" value="${escape(q)}" placeholder="Ej. panel solar"></div><div><label for="category">Categoría</label><select id="category" name="categoria">${options(categoria, true)}</select></div><button type="submit">Buscar</button></form>
    <div class="grid">${result.productos.map((p) => `<article class="card"><div class="product-icon">${escape(categoryName(p.categoria))}</div><span class="code">${escape(p.codigo)}</span><h3>${escape(p.nombre)}</h3><div class="price">${currency(p.precio)}</div><span class="stock">${p.existencias} unidades disponibles</span><div class="row"><label for="quantity-${p.id}" class="muted">Cantidad</label><input id="quantity-${p.id}" class="quantity" type="number" min="1" max="10000" value="1" aria-label="Cantidad de ${escape(p.nombre)}"></div><button data-add="${p.id}">Añadir a cotización</button></article>`).join('')}</div>${result.total ? '' : '<div class="empty">No hay productos que coincidan con la búsqueda.</div>'}<div id="pager"></div>`;
  bindForm(root.querySelector('#filters'), (data) => catalogView(root, { ...data, page: 1 }));
  root.querySelectorAll('[data-add]').forEach((button) => bindAction(button, () => {
    if (!session.user) { location.hash = 'cuenta'; notice('Inicia sesión o regístrate para cotizar.'); return; }
    const p = result.productos.find((item) => item.id === Number(button.dataset.add));
    cart.add(p, Number(root.querySelector(`#quantity-${p.id}`).value));
    notice(`${p.nombre} añadido. Abre Cotizaciones para continuar.`);
  }));
  pagination(root.querySelector('#pager'), page, result.total, 6, (next) => catalogView(root, { page: next, q, categoria }));
}
