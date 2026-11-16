package com.jhontineo.raizvolt.domain;

import java.util.*;

public final class Quote {
  public final long id, createdAt;
  public final Profile customer;
  public final List<Line> lines;

  public Quote(long id, long time, Profile customer, List<Line> lines) {
    this.id = id;
    this.createdAt = time;
    this.customer = customer;
    this.lines = Collections.unmodifiableList(new ArrayList<>(lines));
  }

  public long total() {
    long total = 0;
    for (Line line : lines) {
      long subtotal = line.total();
      if (total > Long.MAX_VALUE - subtotal)
        throw new IllegalArgumentException("Total fuera de rango.");
      total += subtotal;
    }
    return total;
  }
}
