package com.jhontineo.raizvolt.domain;

import java.util.*;

/** Cotizaciones y pedidos: precios congelados y cambios de inventario atómicos. */
public final class SalesService {
  public static final long VALIDITY = 7L * 24 * 60 * 60 * 1000;
  private final Store store;

  public SalesService(Store store) {
    this.store = store;
  }

  public List<Line> lines(Map<Long, Integer> quantities) {
    List<Line> lines = new ArrayList<>();
    for (Map.Entry<Long, Integer> entry : quantities.entrySet()) {
      Product p = store.product(entry.getKey());
      Integer quantity = entry.getValue();
      if (p == null || !p.active)
        throw new IllegalArgumentException("Producto retirado del catálogo.");
      if (quantity == null || quantity < 1 || quantity > 999)
        throw new IllegalArgumentException("Cantidad inválida.");
      if (p.stock < quantity)
        throw new IllegalArgumentException("Existencias insuficientes: " + p.name);
      lines.add(new Line(p.id, p.name, p.price, quantity));
    }
    return lines;
  }

  public long quote(Map<Long, Integer> quantities, long now) {
    if (quantities.isEmpty() || quantities.size() > 100)
      throw new IllegalArgumentException("Añade entre 1 y 100 productos.");
    return store.transaction(
        () -> {
          Profile customer = store.profile();
          if (customer == null)
            throw new IllegalArgumentException("Guarda primero los datos de Cliente.");
          return store.saveQuote(new Quote(0, now, Rules.profile(customer), lines(quantities)));
        });
  }

  public long confirm(long quoteId, long now) {
    return store.transaction(
        () -> {
          Order existing = store.orderForQuote(quoteId);
          if (existing != null) return existing.id;
          Quote q = store.quote(quoteId);
          if (q == null) throw new IllegalArgumentException("Cotización inexistente.");
          if (now < q.createdAt || now - q.createdAt > VALIDITY)
            throw new IllegalArgumentException(
                "La cotización venció. Genera otra desde el catálogo.");
          // Validar todas las líneas antes de escribir; SQLite también revierte fallos de
          // escritura.
          for (Line line : q.lines) {
            Product p = store.product(line.productId);
            if (p == null || !p.active || p.stock < line.quantity)
              throw new IllegalArgumentException("Sin existencias suficientes: " + line.name);
          }
          long id = store.saveOrder(quoteId, now);
          for (Line line : q.lines) {
            Product p = store.product(line.productId);
            store.setStock(p.id, p.stock - line.quantity, "Pedido " + id);
          }
          return id;
        });
  }

  public void cancel(long id) {
    store.transaction(
        () -> {
          Order order = required(id);
          if (Order.CANCELLED.equals(order.status)) return null;
          if (!Order.PENDING.equals(order.status))
            throw new IllegalArgumentException("Solo se cancela un pedido pendiente.");
          Quote q = store.quote(order.quoteId);
          for (Line line : q.lines) {
            Product p = store.product(line.productId);
            if ((long) p.stock + line.quantity > 1000000)
              throw new IllegalArgumentException("La devolución supera el límite de existencias.");
          }
          for (Line line : q.lines) {
            Product p = store.product(line.productId);
            store.setStock(p.id, p.stock + line.quantity, "Cancelación " + id);
          }
          store.setStatus(id, Order.CANCELLED);
          return null;
        });
  }

  public void advance(long id) {
    store.transaction(
        () -> {
          Order order = required(id);
          String next;
          if (Order.PENDING.equals(order.status)) next = Order.SENT;
          else if (Order.SENT.equals(order.status)) next = Order.DELIVERED;
          else throw new IllegalArgumentException("El pedido ya está cerrado.");
          store.setStatus(id, next);
          return null;
        });
  }

  private Order required(long id) {
    Order order = store.order(id);
    if (order == null) throw new IllegalArgumentException("Pedido inexistente.");
    return order;
  }
}
