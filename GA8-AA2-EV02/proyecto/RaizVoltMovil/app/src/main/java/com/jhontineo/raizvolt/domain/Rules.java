package com.jhontineo.raizvolt.domain;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/** Validación común y cálculos exactos, sin double para representar dinero. */
public final class Rules {
  private Rules() {}

  public static String text(String value, String label, int min, int max) {
    String s = value == null ? "" : value.trim();
    if (s.length() < min || s.length() > max || s.matches("(?s).*\\p{Cntrl}.*"))
      throw new IllegalArgumentException(
          label + ": entre " + min + " y " + max + " caracteres, sin controles.");
    return s;
  }

  public static long money(String input) {
    if (input == null || !input.matches("[0-9]{1,9}([.,][0-9]{1,2})?"))
      throw new IllegalArgumentException("Precio: positivo, sin miles y con máximo 2 decimales.");
    long cents = new BigDecimal(input.replace(',', '.')).movePointRight(2).longValueExact();
    if (cents <= 0 || cents > 99999999999L)
      throw new IllegalArgumentException("Precio fuera de rango.");
    return cents;
  }

  public static String cop(long cents) {
    NumberFormat f = NumberFormat.getCurrencyInstance(new Locale("es", "CO"));
    f.setMinimumFractionDigits(2);
    f.setMaximumFractionDigits(2);
    return f.format(BigDecimal.valueOf(cents, 2)) + " COP";
  }

  public static int integer(String value, int min, int max, String label) {
    try {
      int n = Integer.parseInt(value.trim());
      if (n >= min && n <= max) return n;
    } catch (Exception ignored) {
    }
    throw new IllegalArgumentException(label + ": entero entre " + min + " y " + max + ".");
  }

  public static Profile profile(Profile p) {
    String name = text(p.name, "Nombre", 3, 80),
        phone = text(p.phone, "Teléfono", 7, 20),
        city = text(p.city, "Ciudad", 2, 60),
        address = text(p.address, "Dirección", 5, 160);
    if (!phone.matches("[+0-9 ()-]+") || !phone.replaceAll("[^0-9]", "").matches("[0-9]{7,15}"))
      throw new IllegalArgumentException("Teléfono: entre 7 y 15 dígitos.");
    return new Profile(name, phone, city, address);
  }
}
