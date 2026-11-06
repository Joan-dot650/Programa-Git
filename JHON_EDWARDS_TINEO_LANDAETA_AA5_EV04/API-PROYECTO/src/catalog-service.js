import { ApiError } from './errors.js';
import { product, money, pagination, text, object, integer, invalid, CATEGORIES, MAX_STOCK } from './validation.js';

export function productOutput(row) {
  return { id: row.id, codigo: row.codigo, nombre: row.nombre, categoria: row.categoria,
    precio: money(row.precio_centavos), existencias: row.existencias, activo: !!row.activo };
}

export class CatalogService {
  constructor(store) { this.store = store; }

  find(id) {
    const row = this.store.one('SELECT * FROM productos WHERE id=? AND activo=1', id);
    if (!row) throw new ApiError(404, 'Producto no encontrado.');
    return row;
  }

  list(params) {
    const { page, limit, offset } = pagination(params, ['q', 'categoria']);
    const q = text(params.get('q') ?? '', 'q', 0, 120).toLowerCase();
    const category = params.get('categoria') ?? '';
    if (category && !CATEGORIES.includes(category)) invalid('categoria', 'Categoría desconocida.');
    // instr usa coincidencia literal: % y _ no se interpretan como comodines SQL.
    const where = "activo=1 AND (?='' OR instr(minusculas_es(codigo),?)>0 OR instr(minusculas_es(nombre),?)>0) AND (?='' OR categoria=?)";
    const args = [q, q, q, category, category];
    const total = this.store.one(`SELECT count(*) AS n FROM productos WHERE ${where}`, ...args).n;
    const rows = this.store.all(`SELECT * FROM productos WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`, ...args, limit, offset);
    return { productos: rows.map(productOutput), total, pagina: page, limite: limit };
  }

  movement(productId, actorId, delta, balance, reason, orderId = null) {
    this.store.run('INSERT INTO movimientos (producto_id,usuario_id,pedido_id,variacion,saldo,motivo,creado_en) VALUES (?,?,?,?,?,?,?)',
      productId, actorId, orderId, delta, balance, reason, new Date().toISOString());
  }

  save(body, actor, productId = null) {
    const p = product(body, productId === null);
    if (productId !== null) this.find(productId);
    if (this.store.one('SELECT id FROM productos WHERE codigo=? AND id!=?', p.code, productId ?? 0)) throw new ApiError(409, 'El código ya existe, incluso si el producto fue retirado.');
    return this.store.transaction(() => {
      const time = new Date().toISOString();
      if (productId === null) {
        productId = Number(this.store.run('INSERT INTO productos (codigo,nombre,categoria,precio_centavos,existencias,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?)',
          p.code, p.name, p.category, p.cents, p.stock, time, time).lastInsertRowid);
        this.movement(productId, actor.id, p.stock, p.stock, 'Inventario inicial');
      } else {
        this.store.run('UPDATE productos SET codigo=?,nombre=?,categoria=?,precio_centavos=?,actualizado_en=? WHERE id=?',
          p.code, p.name, p.category, p.cents, time, productId);
      }
      return productOutput(this.find(productId));
    });
  }

  remove(productId) {
    this.find(productId);
    // Baja lógica para conservar cotizaciones, pedidos y movimientos históricos.
    this.store.run('UPDATE productos SET activo=0,actualizado_en=? WHERE id=?', new Date().toISOString(), productId);
  }

  adjust(productId, body, actor) {
    object(body, ['variacion', 'motivo']);
    const delta = integer(body.variacion, 'variacion', -MAX_STOCK, MAX_STOCK);
    if (!delta) invalid('variacion', 'Debe ser diferente de cero.');
    const reason = text(body.motivo, 'motivo', 5, 200);
    return this.store.transaction(() => {
      const row = this.find(productId);
      const balance = row.existencias + delta;
      if (balance < 0 || balance > MAX_STOCK) throw new ApiError(409, 'El ajuste dejaría existencias fuera del rango 0-1000000.');
      this.store.run('UPDATE productos SET existencias=?,actualizado_en=? WHERE id=?', balance, new Date().toISOString(), productId);
      this.movement(productId, actor.id, delta, balance, reason);
      return productOutput(this.find(productId));
    });
  }

  summary() {
    const rows = this.store.all('SELECT precio_centavos,existencias FROM productos WHERE activo=1');
    const value = rows.reduce((sum, p) => sum + BigInt(p.precio_centavos) * BigInt(p.existencias), 0n);
    return { referencias: rows.length, unidades: rows.reduce((sum, p) => sum + p.existencias, 0),
      stockBajo: rows.filter((p) => p.existencias < 5).length, valorInventario: money(value), moneda: 'COP' };
  }

  movements(params) {
    const { page, limit, offset } = pagination(params);
    return { movimientos: this.store.all(`SELECT m.id, m.producto_id AS productoId, p.codigo,
      m.usuario_id AS usuarioId, m.pedido_id AS pedidoId, m.variacion, m.saldo, m.motivo, m.creado_en AS creadoEn
      FROM movimientos m JOIN productos p ON p.id=m.producto_id ORDER BY m.id DESC LIMIT ? OFFSET ?`, limit, offset),
      total: this.store.one('SELECT count(*) AS n FROM movimientos').n, pagina: page, limite: limit };
  }
}
