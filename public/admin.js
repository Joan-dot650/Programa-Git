import { api } from './api.js';
import { escape, currency, options, bindForm, bindAction, pagination, notice } from './components.js';

export async function adminView(root, page = 1) {
  const [products, summary, movements] = await Promise.all([api(`/productos?pagina=${page}&limite=10`), api('/inventario'), api('/inventario/movimientos?limite=10')]);
  root.innerHTML = `<div class="section-heading"><h1>Catálogo e inventario</h1><span class="tag">ADMINISTRACIÓN</span></div><div class="stats"><div class="panel">Referencias activas<strong>${summary.referencias}</strong></div><div class="panel">Unidades disponibles<strong>${summary.unidades}</strong></div><div class="panel">Referencias con stock bajo<strong>${summary.stockBajo}</strong></div></div><section class="panel"><div class="section-heading"><h2>Productos</h2><button id="new">Nuevo producto</button></div><div class="table-wrap"><table><thead><tr><th>Código / producto</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>${products.productos.map((p) => `<tr><td><span class="code">${escape(p.codigo)}</span><br>${escape(p.nombre)}</td><td>${currency(p.precio)}</td><td>${p.existencias}</td><td><div class="actions"><button class="secondary small" data-edit="${p.id}">Editar</button><button class="secondary small" data-stock="${p.id}">Ajustar stock</button><button class="danger small" data-delete="${p.id}">Retirar</button></div></td></tr>`).join('')}</tbody></table></div><div id="pager"></div></section><section class="panel" id="editor" hidden></section><section class="panel"><h2>Últimos 10 movimientos</h2><div class="table-wrap"><table><thead><tr><th>Código</th><th>Variación</th><th>Saldo</th><th>Motivo</th></tr></thead><tbody>${movements.movimientos.map((m) => `<tr><td>${escape(m.codigo)}</td><td>${m.variacion > 0 ? '+' : ''}${m.variacion}</td><td>${m.saldo}</td><td>${escape(m.motivo)}</td></tr>`).join('')}</tbody></table></div><p class="hint muted">El historial completo está disponible en la API con paginación.</p></section>`;
  const editor = root.querySelector('#editor');
  const edit = (product = {}) => {
    editor.hidden = false;
    editor.innerHTML = `<h2>${product.id ? 'Editar producto' : 'Nuevo producto'}</h2><form id="product-form" class="form-grid"><div><label for="codigo">Código</label><input id="codigo" name="codigo" required minlength="3" maxlength="30" pattern="[A-Za-z0-9-]+" value="${escape(product.codigo)}"></div><div><label for="nombre">Nombre</label><input id="nombre" name="nombre" required minlength="3" maxlength="120" value="${escape(product.nombre)}"></div><div><label for="categoria">Categoría</label><select id="categoria" name="categoria">${options(product.categoria)}</select></div><div><label for="precio">Precio en COP (punto decimal)</label><input id="precio" name="precio" required inputmode="decimal" pattern="[0-9]{1,10}([.][0-9]{1,2})?" value="${escape(product.precio)}"></div>${product.id ? '' : '<div><label for="existencias">Existencias iniciales</label><input id="existencias" name="existencias" type="number" min="0" max="1000000" required value="0"></div>'}<div class="full"><button type="submit">Guardar producto</button></div></form>`;
    editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bindForm(editor.querySelector('form'), async (body) => {
      if (!product.id) body.existencias = Number(body.existencias);
      await api(`/productos${product.id ? `/${product.id}` : ''}`, { method: product.id ? 'PUT' : 'POST', body });
      await adminView(root, page); notice('Producto guardado correctamente.');
    });
  };
  bindAction(root.querySelector('#new'), () => edit());
  root.querySelectorAll('[data-edit]').forEach((button) => bindAction(button, () => edit(products.productos.find((p) => p.id === Number(button.dataset.edit)))));
  root.querySelectorAll('[data-delete]').forEach((button) => bindAction(button, async () => {
    if (!window.confirm('¿Retirar este producto del catálogo? Se conservará su historial.')) return;
    await api(`/productos/${button.dataset.delete}`, { method: 'DELETE' }); await adminView(root); notice('Producto retirado del catálogo.');
  }));
  root.querySelectorAll('[data-stock]').forEach((button) => bindAction(button, () => {
    const p = products.productos.find((item) => item.id === Number(button.dataset.stock)); editor.hidden = false;
    editor.innerHTML = `<h2>Ajustar stock: ${escape(p.codigo)}</h2><p>Saldo actual: ${p.existencias} unidades.</p><form id="stock-form" class="form-grid"><div><label for="variacion">Variación (+ entrada / - salida)</label><input id="variacion" name="variacion" type="number" min="-1000000" max="1000000" required></div><div><label for="motivo">Motivo</label><input id="motivo" name="motivo" minlength="5" maxlength="200" required></div><div class="full"><button type="submit">Guardar ajuste</button></div></form>`;
    editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bindForm(editor.querySelector('form'), async (body) => { body.variacion = Number(body.variacion); await api(`/productos/${p.id}/inventario`, { method: 'POST', body }); await adminView(root, page); notice('Inventario ajustado y movimiento registrado.'); });
  }));
  pagination(root.querySelector('#pager'), page, products.total, 10, (next) => adminView(root, next));
}
