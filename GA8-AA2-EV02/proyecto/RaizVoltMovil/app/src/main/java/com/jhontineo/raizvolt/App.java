package com.jhontineo.raizvolt;

import android.app.Application;
import com.jhontineo.raizvolt.data.LocalStore;
import com.jhontineo.raizvolt.domain.*;
import java.util.concurrent.*;

/** Contenedor de dependencias. Un ejecutor serial evita bloquear la interfaz con SQL. */
public final class App extends Application {
  public LocalStore store;
  public CatalogService catalog;
  public ProfileService profiles;
  public SalesService sales;
  public final Cart cart = new Cart();
  public final ExecutorService io = Executors.newSingleThreadExecutor();

  @Override
  public void onCreate() {
    super.onCreate();
    store = new LocalStore(this);
    catalog = new CatalogService(store);
    profiles = new ProfileService(store);
    sales = new SalesService(store);
  }
}
