package com.jhontineo.raizvolt.domain;

public final class ProfileService {
  private final Store store;

  public ProfileService(Store store) {
    this.store = store;
  }

  public Profile get() {
    return store.profile();
  }

  public void save(Profile p) {
    store.saveProfile(Rules.profile(p));
  }
}
