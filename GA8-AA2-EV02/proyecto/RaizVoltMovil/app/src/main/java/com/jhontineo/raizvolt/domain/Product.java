package com.jhontineo.raizvolt.domain;

/** Producto inmutable; precio en centavos de COP. */
public final class Product {
  public final long id, price;
  public final String sku, name, category;
  public final int stock;
  public final boolean active;

  public Product(
      long id, String sku, String name, String category, long price, int stock, boolean active) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.category = category;
    this.price = price;
    this.stock = stock;
    this.active = active;
  }

  public Product stock(int next) {
    return new Product(id, sku, name, category, price, next, active);
  }
}
