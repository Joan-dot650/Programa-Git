package com.jhontineo.raizvolt.domain;

import java.util.*;

/** Doble para probar reglas aisladas. La atomicidad real se prueba con SQLite en Android. */
final class FakeStore implements Store {
  final Map<Long, Product> products = new LinkedHashMap<>();
  final Map<Long, Quote> quotes = new LinkedHashMap<>();
  final Map<Long, Order> orders = new LinkedHashMap<>();
  Profile profile;

  public <T> T transaction(Work<T> work) {
    return work.run();
  }

  public List<Product> products(String query) {
    List<Product> result = new ArrayList<>();
    for (Product p : products.values())
      if (p.active
          && (p.name + p.sku + p.category)
              .toLowerCase(Locale.ROOT)
              .contains(query.toLowerCase(Locale.ROOT))) result.add(p);
    return result;
  }

  public Product product(long id) {
    return products.get(id);
  }

  public long saveProduct(Product p) {
    for (Product other : products.values())
      if (other.id != p.id && other.sku.equals(p.sku))
        throw new IllegalArgumentException("Duplicado");
    long id = p.id == 0 ? products.size() + 1 : p.id;
    products.put(id, new Product(id, p.sku, p.name, p.category, p.price, p.stock, p.active));
    return id;
  }

  public void setStock(long id, int stock, String reason) {
    products.put(id, product(id).stock(stock));
  }

  public void archive(long id) {
    Product p = product(id);
    products.put(id, new Product(id, p.sku, p.name, p.category, p.price, p.stock, false));
  }

  public Profile profile() {
    return profile;
  }

  public void saveProfile(Profile p) {
    profile = p;
  }

  public long saveQuote(Quote q) {
    long id = quotes.size() + 1;
    quotes.put(id, new Quote(id, q.createdAt, q.customer, q.lines));
    return id;
  }

  public Quote quote(long id) {
    return quotes.get(id);
  }

  public List<Quote> quotes() {
    return new ArrayList<>(quotes.values());
  }

  public Order order(long id) {
    return orders.get(id);
  }

  public Order orderForQuote(long q) {
    for (Order o : orders.values()) if (o.quoteId == q) return o;
    return null;
  }

  public long saveOrder(long q, long t) {
    long id = orders.size() + 1;
    orders.put(id, new Order(id, q, t, Order.PENDING));
    return id;
  }

  public void setStatus(long id, String status) {
    Order o = order(id);
    orders.put(id, new Order(id, o.quoteId, o.createdAt, status));
  }

  public List<Order> orders() {
    return new ArrayList<>(orders.values());
  }
}
