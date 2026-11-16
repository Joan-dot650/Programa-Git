package com.jhontineo.raizvolt.domain;

import java.util.*;

public final class CatalogService {
  private final Store store;

  public CatalogService(Store store) {
    this.store = store;
  }

  public List<Product> list(String query) {
    return store.products(query == null ? "" : query.trim());
  }

  public long save(Product p) {
    String sku = Rules.text(p.sku, "Código", 2, 24).toUpperCase(Locale.ROOT);
    if (!sku.matches("[A-Z0-9_-]+"))
      throw new IllegalArgumentException("Código: letras, números, guion y guion bajo.");
    String name = Rules.text(p.name, "Producto", 3, 80),
        category = Rules.text(p.category, "Categoría", 2, 40);
    if (p.price <= 0 || p.price > 99999999999L || p.stock < 0 || p.stock > 1000000)
      throw new IllegalArgumentException("Precio o existencias fuera de rango.");
    return store.transaction(
        () -> {
          Product old = p.id == 0 ? null : store.product(p.id);
          if (p.id != 0 && old == null) throw new IllegalArgumentException("Producto inexistente.");
          return store.saveProduct(
              new Product(
                  p.id, sku, name, category, p.price, old == null ? p.stock : old.stock, true));
        });
  }

  public void adjust(long id, int delta, String reason) {
    String why = Rules.text(reason, "Motivo", 3, 100);
    if (delta == 0) throw new IllegalArgumentException("El ajuste no puede ser cero.");
    store.transaction(
        () -> {
          Product p = store.product(id);
          if (p == null || !p.active) throw new IllegalArgumentException("Producto no disponible.");
          long next = (long) p.stock + delta;
          if (next < 0 || next > 1000000)
            throw new IllegalArgumentException("El ajuste deja existencias fuera de rango.");
          store.setStock(id, (int) next, why);
          return null;
        });
  }

  public void archive(long id) {
    store.transaction(
        () -> {
          if (store.product(id) == null)
            throw new IllegalArgumentException("Producto inexistente.");
          store.archive(id);
          return null;
        });
  }
}
