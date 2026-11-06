import { ApiError } from './errors.js';
import { items, money, pagination, object, integer, profile, MAX_STOCK, invalid } from './validation.js';

export class SalesService {
  constructor(store, catalog, now = Date.now) { this.store = store; this.catalog = catalog; this.now = now; }

  owned(table, resourceId, user) {
    // table solo se recibe desde métodos internos con nombres fijos.
    const row = this.store.one(`SELECT * FROM ${table} WHERE id=?`, resourceId);
    if (!row || (user.rol !== 'ADMIN' && row.usuario_id !== user.id)) throw new ApiError(404, 'Recurso no encontrado.');
    return row;
  }

  quoteOutput(row) {
    const lines = this.store.all('SELECT * FROM cotizacion_items WHERE cotizacion_id=? ORDER BY producto_id', row.id);
    return { id: row.id, usuarioId: row.usuario_id, total: money(row.total_centavos), moneda: 'COP',
      creadoEn: row.creado_en, venceEn: new Date(row.expira_ms).toISOString(),
      items: lines.map((line) => ({ productoId: line.producto_id, codigo: line.codigo, nombre: line.nombre,
        precioUnitario: money(line.precio_centavos), cantidad: line.cantidad,
        subtotal: money(BigInt(line.precio_centavos) * BigInt(line.cantidad)) })) };
  }

  quote(id, user) { return this.quoteOutput(this.owned('cotizaciones', id, user)); }

  createQuote(body, user) {
    const requested = items(body);
    return this.store.transaction(() => {
      const lines = requested.map((line) => ({ ...line, p: this.catalog.find(line.productId) }));
      const total = lines.reduce((sum, line) => sum + BigInt(line.p.precio_centavos) * BigInt(line.quantity), 0n);
      const quoteId = Number(this.store.run('INSERT INTO cotizaciones (usuario_id,total_centavos,creado_en,expira_ms) VALUES (?,?,?,?)',
        user.id, String(total), new Date(this.now()).toISOString(), this.now() + 7 * 86400000).lastInsertRowid);
      for (const line of lines) this.store.run('INSERT INTO cotizacion_items (cotizacion_id,producto_id,codigo,nombre,precio_centavos,cantidad) VALUES (?,?,?,?,?,?)',
        quoteId, line.productId, line.p.codigo, line.p.nombre, line.p.precio_centavos, line.quantity);
      return this.quote(quoteId, user);
    });
  }

  list(table, params, user) {
    const { page, limit, offset } = pagination(params);
    const where = user.rol === 'ADMIN' ? '1=1' : 'usuario_id=?';
    const args = user.rol === 'ADMIN' ? [] : [user.id];
    const rows = this.store.all(`SELECT * FROM ${table} WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...args, limit, offset);
    return { [table]: rows.map((row) => table === 'cotizaciones' ? this.quoteOutput(row) : this.orderOutput(row)),
      total: this.store.one(`SELECT count(*) AS n FROM ${table} WHERE ${where}`, ...args).n, pagina: page, limite: limit };
  }

  orderOutput(row) {
    const quote = this.store.one('SELECT * FROM cotizaciones WHERE id=?', row.cotizacion_id);
    return { id: row.id, cotizacionId: row.cotizacion_id, usuarioId: row.usuario_id,
      estado: row.estado, total: money(row.total_centavos), moneda: 'COP', envio: JSON.parse(row.envio_json),
      creadoEn: row.creado_en, actualizadoEn: row.actualizado_en, items: this.quoteOutput(quote).items };
  }
  order(id, user) { return this.orderOutput(this.owned('pedidos', id, user)); }

  createOrder(body, user) {
    object(body, ['cotizacionId']);
    const quoteId = integer(body.cotizacionId, 'cotizacionId', 1, Number.MAX_SAFE_INTEGER);
    return this.store.transaction(() => {
      const quote = this.store.one('SELECT * FROM cotizaciones WHERE id=? AND usuario_id=?', quoteId, user.id);
      if (!quote) throw new ApiError(404, 'Cotización propia no encontrada.');
      // Reintentar la misma cotización devuelve el pedido existente, sin descontar otra vez.
      const existing = this.store.one('SELECT * FROM pedidos WHERE cotizacion_id=?', quoteId);
      if (existing) return { created: false, pedido: this.orderOutput(existing) };
      if (quote.expira_ms <= this.now()) throw new ApiError(409, 'La cotización venció. Genera una nueva.');
      const owner = this.store.one('SELECT * FROM usuarios WHERE id=?', user.id);
      const shipping = profile({ nombre: owner.nombre, telefono: owner.telefono, municipio: owner.municipio, direccion: owner.direccion });
      const lines = this.store.all('SELECT * FROM cotizacion_items WHERE cotizacion_id=?', quoteId);
      for (const line of lines) {
        const p = this.store.one('SELECT * FROM productos WHERE id=?', line.producto_id);
        if (!p?.activo || p.existencias < line.cantidad) throw new ApiError(409, `Producto ${line.codigo} no disponible o sin existencias suficientes.`);
      }
      const time = new Date(this.now()).toISOString();
      const orderId = Number(this.store.run("INSERT INTO pedidos (cotizacion_id,usuario_id,estado,total_centavos,envio_json,creado_en,actualizado_en) VALUES (?,?,'PENDIENTE',?,?,?,?)",
        quoteId, user.id, quote.total_centavos, JSON.stringify(shipping), time, time).lastInsertRowid);
      for (const line of lines) {
        this.store.run('UPDATE productos SET existencias=existencias-?,actualizado_en=? WHERE id=?', line.cantidad, time, line.producto_id);
        const balance = this.store.one('SELECT existencias FROM productos WHERE id=?', line.producto_id).existencias;
        this.catalog.movement(line.producto_id, user.id, -line.cantidad, balance, 'Reserva de pedido', orderId);
      }
      return { created: true, pedido: this.order(orderId, user) };
    });
  }

  changeState(orderId, body, user) {
    object(body, ['estado']);
    if (!['ENVIADO', 'ENTREGADO', 'CANCELADO'].includes(body.estado)) invalid('estado', 'Usa ENVIADO, ENTREGADO o CANCELADO.');
    return this.store.transaction(() => {
      const order = this.owned('pedidos', orderId, user);
      if (user.rol !== 'ADMIN' && body.estado !== 'CANCELADO') throw new ApiError(403, 'Solo el administrador puede enviar o entregar pedidos.');
      if (order.estado === body.estado) return this.orderOutput(order);
      const allowed = { PENDIENTE: ['ENVIADO', 'CANCELADO'], ENVIADO: ['ENTREGADO'], ENTREGADO: [], CANCELADO: [] };
      if (!allowed[order.estado].includes(body.estado)) throw new ApiError(409, 'Transición de estado no permitida.');
      const time = new Date(this.now()).toISOString();
      if (body.estado === 'CANCELADO') {
        const lines = this.store.all('SELECT * FROM cotizacion_items WHERE cotizacion_id=?', order.cotizacion_id);
        for (const line of lines) {
          const p = this.store.one('SELECT * FROM productos WHERE id=?', line.producto_id);
          const balance = p.existencias + line.cantidad;
          if (balance > MAX_STOCK) throw new ApiError(409, 'La devolución excede el máximo de inventario; solicita al administrador revisar el saldo.');
          this.store.run('UPDATE productos SET existencias=?,actualizado_en=? WHERE id=?', balance, time, line.producto_id);
          this.catalog.movement(line.producto_id, user.id, line.cantidad, balance, 'Cancelación de pedido', orderId);
        }
      }
      this.store.run('UPDATE pedidos SET estado=?,actualizado_en=? WHERE id=?', body.estado, time, orderId);
      return this.order(orderId, user);
    });
  }
}
