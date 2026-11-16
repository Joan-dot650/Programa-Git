package com.jhontineo.raizvolt.domain;

import java.util.*;

/** Carrito sincronizado; la actividad guarda su estado para la recreación. */
public final class Cart {
  private final LinkedHashMap<Long, Integer> quantities = new LinkedHashMap<>();

  public synchronized void set(long id, int quantity) {
    if (id <= 0 || quantity < 0 || quantity > 999)
      throw new IllegalArgumentException("Cantidad: entre 1 y 999 unidades.");
    if (quantity == 0) quantities.remove(id);
    else {
      if (!quantities.containsKey(id) && quantities.size() >= 100)
        throw new IllegalArgumentException("Máximo 100 productos por carrito.");
      quantities.put(id, quantity);
    }
  }

  public synchronized void add(long id) {
    set(id, (quantities.containsKey(id) ? quantities.get(id) : 0) + 1);
  }

  public synchronized Map<Long, Integer> snapshot() {
    return Collections.unmodifiableMap(new LinkedHashMap<>(quantities));
  }

  public synchronized int count() {
    int n = 0;
    for (int quantity : quantities.values()) n += quantity;
    return n;
  }

  public synchronized void clear() {
    quantities.clear();
  }
}
