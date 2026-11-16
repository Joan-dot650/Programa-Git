package com.jhontineo.raizvolt.domain;

import static org.junit.Assert.*;

import org.junit.*;

public class ProfileTest {
  FakeStore db = new FakeStore();
  ProfileService service = new ProfileService(db);

  @Test
  public void validCustomerIsTrimmed() {
    service.save(new Profile(" Cliente Demo ", "3001234567", " Bogotá ", "Calle 10 # 20"));
    assertEquals("Cliente Demo", service.get().name);
  }

  @Test
  public void shortNameRejected() {
    assertThrows(
        IllegalArgumentException.class,
        () -> service.save(new Profile("A", "3001234567", "Bogotá", "Calle 10")));
  }

  @Test
  public void phoneLettersRejected() {
    assertThrows(
        IllegalArgumentException.class,
        () -> service.save(new Profile("Demo", "llamarme", "Bogotá", "Calle 10")));
  }

  @Test
  public void missingAddressRejected() {
    assertThrows(
        IllegalArgumentException.class,
        () -> service.save(new Profile("Demo", "3001234567", "Bogotá", "")));
  }

  @Test
  public void controlCharactersRejected() {
    assertThrows(IllegalArgumentException.class, () -> Rules.text("Hola\nMundo", "Nombre", 3, 80));
  }
}
