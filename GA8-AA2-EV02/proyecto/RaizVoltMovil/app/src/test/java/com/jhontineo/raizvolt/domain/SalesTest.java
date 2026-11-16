package com.jhontineo.raizvolt.domain;

import static org.junit.Assert.*;

import java.util.*;
import org.junit.*;

public class SalesTest {
  FakeStore db;
  SalesService service;
  long now = 1700000000000L;

  Map<Long, Integer> items(int n) {
    Map<Long, Integer> m = new LinkedHashMap<>();
    m.put(1L, n);
    return m;
  }

  @Before
  public void setup() {
    db = new FakeStore();
    db.saveProduct(new Product(1, "P1", "Panel solar", "Paneles", 10001, 10, true));
    db.saveProfile(new Profile("Cliente Demo", "3001234567", "Bogotá", "Calle 10 # 20"));
    service = new SalesService(db);
  }

  @Test
  public void quoteSnapshotsPriceAndCustomer() {
    long id = service.quote(items(2), now);
    db.saveProduct(new Product(1, "P1", "Otro nombre", "Paneles", 99999, 10, true));
    db.saveProfile(new Profile("Cliente Nuevo", "3001112222", "Cali", "Calle 20"));
    Quote q = db.quote(id);
    assertEquals(20002, q.total());
    assertEquals("Cliente Demo", q.customer.name);
    assertEquals("Panel solar", q.lines.get(0).name);
    assertEquals(10, db.product(1).stock);
  }

  @Test
  public void emptyQuoteRejected() {
    assertThrows(IllegalArgumentException.class, () -> service.quote(Collections.emptyMap(), now));
  }

  @Test
  public void missingCustomerRejected() {
    db.profile = null;
    assertThrows(IllegalArgumentException.class, () -> service.quote(items(1), now));
  }

  @Test
  public void unavailableProductRejected() {
    db.archive(1);
    assertThrows(IllegalArgumentException.class, () -> service.quote(items(1), now));
  }

  @Test
  public void zeroQuantityRejected() {
    assertThrows(IllegalArgumentException.class, () -> service.quote(items(0), now));
  }

  @Test
  public void quoteExcessStockRejected() {
    assertThrows(IllegalArgumentException.class, () -> service.quote(items(11), now));
  }

  @Test
  public void confirmationReservesOnce() {
    long q = service.quote(items(2), now);
    long order = service.confirm(q, now);
    assertEquals(order, service.confirm(q, now));
    assertEquals(8, db.product(1).stock);
    assertEquals(1, db.orders.size());
  }

  @Test
  public void expiredQuoteRejected() {
    long q = service.quote(items(1), now);
    assertThrows(
        IllegalArgumentException.class, () -> service.confirm(q, now + SalesService.VALIDITY + 1));
  }

  @Test
  public void boundaryValidityAccepted() {
    long q = service.quote(items(1), now);
    assertTrue(service.confirm(q, now + SalesService.VALIDITY) > 0);
  }

  @Test
  public void insufficientSecondLineDoesNotReserveFirst() {
    db.saveProduct(new Product(2, "P2", "Batería solar", "Baterías", 20000, 5, true));
    Map<Long, Integer> m = items(2);
    m.put(2L, 2);
    long q = service.quote(m, now);
    db.setStock(2, 1, "Salida");
    assertThrows(IllegalArgumentException.class, () -> service.confirm(q, now));
    assertEquals(10, db.product(1).stock);
    assertTrue(db.orders.isEmpty());
  }

  @Test
  public void cancellationReturnsStockOnlyOnce() {
    long q = service.quote(items(2), now);
    long o = service.confirm(q, now);
    service.cancel(o);
    service.cancel(o);
    assertEquals(10, db.product(1).stock);
    assertEquals(Order.CANCELLED, db.order(o).status);
    assertEquals(o, service.confirm(q, now));
    assertEquals(10, db.product(1).stock);
  }

  @Test
  public void dispatchThenDelivery() {
    long o = service.confirm(service.quote(items(1), now), now);
    service.advance(o);
    assertEquals(Order.SENT, db.order(o).status);
    service.advance(o);
    assertEquals(Order.DELIVERED, db.order(o).status);
  }

  @Test
  public void dispatchedCannotCancel() {
    long o = service.confirm(service.quote(items(1), now), now);
    service.advance(o);
    assertThrows(IllegalArgumentException.class, () -> service.cancel(o));
    assertEquals(9, db.product(1).stock);
  }

  @Test
  public void terminalOrderCannotAdvance() {
    long o = service.confirm(service.quote(items(1), now), now);
    service.cancel(o);
    assertThrows(IllegalArgumentException.class, () -> service.advance(o));
  }

  @Test
  public void nonexistentOrderRejected() {
    assertThrows(IllegalArgumentException.class, () -> service.cancel(999));
  }

  @Test
  public void returnCannotOverflowStock() {
    long o = service.confirm(service.quote(items(1), now), now);
    db.setStock(1, 1000000, "Ingreso");
    assertThrows(IllegalArgumentException.class, () -> service.cancel(o));
    assertEquals(Order.PENDING, db.order(o).status);
  }
}
