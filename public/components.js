/** Todo texto recibido del servidor se escapa antes de incluirlo en HTML. */
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
// Se formatea el decimal como texto para conservar exactitud en importes grandes.
export function currency(value) {
  const [whole, cents = '00'] = String(value).split('.');
  return `$ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${cents.padEnd(2, '0')} COP`;
}
export const categories = ['PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO'];
export const categoryName = (value) => ({ PANEL_SOLAR: 'Panel solar', INVERSOR: 'Inversor', BATERIA: 'Batería', KIT_SOLAR: 'Kit solar', ACCESORIO: 'Accesorio' })[value] ?? value;
export const options = (selected = '', all = false) => `${all ? '<option value="">Todas las categorías</option>' : ''}${categories.map((c) => `<option value="${c}" ${c === selected ? 'selected' : ''}>${categoryName(c)}</option>`).join('')}`;
export function notice(message, error = false) {
  const box = document.querySelector('#notice'); box.textContent = message;
  box.hidden = !message; box.className = error ? 'error' : '';
}
export function formData(form) { return Object.fromEntries(new FormData(form)); }
export function bindForm(form, action) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const button = form.querySelector('[type=submit]');
    button.disabled = true;
    try { await action(formData(form)); } catch (error) { notice(error.message, true); }
    finally { button.disabled = false; }
  });
}
export function bindAction(button, action) {
  button.addEventListener('click', async () => {
    button.disabled = true;
    try { await action(); } catch (error) { notice(error.message, true); }
    finally { button.disabled = false; }
  });
}
export function pagination(root, page, total, limit, onPage) {
  const pages = Math.max(1, Math.ceil(total / limit));
  root.innerHTML = `<div class="pager"><button class="secondary small" id="previous" ${page <= 1 ? 'disabled' : ''}>Anterior</button><span>Página ${page} de ${pages} · ${total} registros</span><button class="secondary small" id="next" ${page >= pages ? 'disabled' : ''}>Siguiente</button></div>`;
  bindAction(root.querySelector('#previous'), () => onPage(page - 1));
  bindAction(root.querySelector('#next'), () => onPage(page + 1));
}
