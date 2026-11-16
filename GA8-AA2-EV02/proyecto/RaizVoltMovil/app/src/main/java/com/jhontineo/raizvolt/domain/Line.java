package com.jhontineo.raizvolt.domain;

public final class Line {
  public final long productId, price;
  public final String name;
  public final int quantity;

  public Line(long productId, String name, long price, int quantity) {
    this.productId = productId;
    this.name = name;
    this.price = price;
    this.quantity = quantity;
  }

  public long total() {
    if (price < 0 || quantity < 1 || price > Long.MAX_VALUE / quantity)
      throw new IllegalArgumentException("Importe fuera de rango.");
    return price * quantity;
  }
}
