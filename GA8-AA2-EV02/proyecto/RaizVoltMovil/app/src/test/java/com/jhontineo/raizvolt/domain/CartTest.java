package com.jhontineo.raizvolt.domain;

import static org.junit.Assert.*;

import java.util.*;
import org.junit.*;

public class CartTest {
  @Test
  public void repeatedProductCombines() {
    Cart c = new Cart();
    c.add(1);
    c.add(1);
    assertEquals(2, c.count());
    assertEquals(1, c.snapshot().size());
  }

  @Test
  public void zeroRemoves() {
    Cart c = new Cart();
    c.add(1);
    c.set(1, 0);
    assertTrue(c.snapshot().isEmpty());
  }

  @Test
  public void negativeQuantityRejected() {
    assertThrows(IllegalArgumentException.class, () -> new Cart().set(1, -1));
  }

  @Test
  public void maxQuantityEnforced() {
    Cart c = new Cart();
    c.set(1, 999);
    assertThrows(IllegalArgumentException.class, () -> c.add(1));
    assertEquals(999, c.count());
  }

  @Test
  public void snapshotIsImmutableAndIndependent() {
    Cart c = new Cart();
    c.add(1);
    Map<Long, Integer> snapshot = c.snapshot();
    c.clear();
    assertEquals(1, snapshot.size());
    assertThrows(UnsupportedOperationException.class, () -> snapshot.put(2L, 3));
  }

  @Test
  public void moneyIsExact() {
    assertEquals(68000001, Rules.money("680000,01"));
    assertEquals(136000002, new Line(1, "Panel", 68000001, 2).total());
  }

  @Test
  public void invalidPricePrecisionRejected() {
    assertThrows(IllegalArgumentException.class, () -> Rules.money("12.345"));
    assertThrows(IllegalArgumentException.class, () -> Rules.money("1e3"));
  }

  @Test
  public void currencyDisplayKeepsTwoDecimals() {
    assertTrue(Rules.cop(10001).contains("100,01"));
    assertTrue(Rules.cop(10000).contains("100,00"));
  }
}
