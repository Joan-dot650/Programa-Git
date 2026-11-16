package com.jhontineo.raizvolt.domain;

/** Cliente actual; la cotización conserva una copia histórica. */
public final class Profile {
  public final String name, phone, city, address;

  public Profile(String name, String phone, String city, String address) {
    this.name = name;
    this.phone = phone;
    this.city = city;
    this.address = address;
  }
}
