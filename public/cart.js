/** Carrito transitorio: solo IDs y cantidades; el servidor decide precios y totales. */
export class Cart {
  constructor() { this.lines = new Map(); }
  add(product, quantity) {
    const count = (this.lines.get(product.id)?.cantidad ?? 0) + quantity;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || count > 10000) throw new Error('La cantidad debe estar entre 1 y 10000.');
    if (!this.lines.has(product.id) && this.lines.size >= 20) throw new Error('Máximo 20 productos por cotización.');
    this.lines.set(product.id, { ...product, cantidad: count });
  }
  remove(id) { this.lines.delete(id); }
  clear() { this.lines.clear(); }
  items() { return [...this.lines.values()].map((p) => ({ productoId: p.id, cantidad: p.cantidad })); }
}
export const cart = new Cart();
