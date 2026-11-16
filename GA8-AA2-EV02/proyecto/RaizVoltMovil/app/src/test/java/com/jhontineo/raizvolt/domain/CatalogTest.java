package com.jhontineo.raizvolt.domain;

import static org.junit.Assert.*;

import org.junit.*;

public class CatalogTest {
  FakeStore db;
  CatalogService service;

  @Before
  public void setup() {
    db = new FakeStore();
    service = new CatalogService(db);
  }

  Product product(long id, String sku, long price, int stock) {
    return new Product(id, sku, "Panel solar", "Paneles", price, stock, true);
  }

  @Test
  public void createNormalizesCode() {
    long id = service.save(product(0, " panel-01 ", 150050, 8));
    assertEquals("PANEL-01", db.product(id).sku);
  }

  @Test
  public void editPreservesStock() {
    long id = service.save(product(0, "XX", 100, 8));
    service.save(product(id, "XX", 200, 500));
    assertEquals(8, db.product(id).stock);
    assertEquals(200, db.product(id).price);
  }

  @Test
  public void duplicateCodeRejected() {
    service.save(product(0, "XX", 100, 2));
    assertThrows(IllegalArgumentException.class, () -> service.save(product(0, "XX", 100, 4)));
  }

  @Test
  public void invalidCodeRejected() {
    assertThrows(
        IllegalArgumentException.class, () -> service.save(product(0, "bad code", 100, 2)));
  }

  @Test
  public void zeroPriceRejected() {
    assertThrows(IllegalArgumentException.class, () -> service.save(product(0, "XX", 0, 2)));
  }

  @Test
  public void inventoryCannotBecomeNegative() {
    long id = service.save(product(0, "XX", 100, 2));
    assertThrows(IllegalArgumentException.class, () -> service.adjust(id, -3, "Venta"));
    assertEquals(2, db.product(id).stock);
  }

  @Test
  public void adjustmentRequiresReason() {
    long id = service.save(product(0, "XX", 100, 2));
    assertThrows(IllegalArgumentException.class, () -> service.adjust(id, 1, " "));
  }

  @Test
  public void archivePreservesHistory() {
    long id = service.save(product(0, "XX", 100, 2));
    service.archive(id);
    assertEquals(0, service.list("").size());
    assertNotNull(db.product(id));
  }

  @Test
  public void adjustmentAddsStock() {
    long id = service.save(product(0, "XX", 100, 2));
    service.adjust(id, 5, "Ingreso");
    assertEquals(7, db.product(id).stock);
  }
}
