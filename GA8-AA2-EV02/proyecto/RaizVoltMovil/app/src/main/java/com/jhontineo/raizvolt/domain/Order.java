package com.jhontineo.raizvolt.domain;

public final class Order {
  public static final String PENDING = "PENDIENTE",
      SENT = "ENVIADO",
      DELIVERED = "ENTREGADO",
      CANCELLED = "CANCELADO";
  public final long id, quoteId, createdAt;
  public final String status;

  public Order(long id, long quoteId, long time, String status) {
    this.id = id;
    this.quoteId = quoteId;
    this.createdAt = time;
    this.status = status;
  }
}
