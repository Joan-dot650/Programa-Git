package com.jhontineo.raizvolt;

import android.app.*;
import android.content.*;
import android.graphics.Bitmap;
import android.os.*;
import android.view.*;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.*;
import com.jhontineo.raizvolt.data.LocalStore;
import com.jhontineo.raizvolt.domain.*;
import com.jhontineo.raizvolt.ui.MainActivity;
import java.io.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

/** Integración y aceptación reales. Solo elimina sus propias bases de prueba. */
public final class AcceptanceRunner extends Instrumentation {
  private final StringBuilder report = new StringBuilder();
  private int count;
  private MainActivity activity;

  @Override
  public void onCreate(Bundle args) {
    super.onCreate(args);
    start();
  }

  private void check(boolean condition, String label) {
    if (!condition) throw new AssertionError(label);
    report.append("APROBADO: ").append(label).append('\n');
    count++;
    Bundle progress = new Bundle();
    progress.putString("stream", "APROBADO: " + label + "\n");
    sendStatus(1, progress);
  }

  private void rejects(Runnable r, String label) {
    boolean rejected = false;
    try {
      r.run();
    } catch (IllegalArgumentException e) {
      rejected = true;
    }
    check(rejected, label);
  }

  @Override
  public void onStart() {
    Bundle result = new Bundle();
    try {
      integration();
      App app = (App) getTargetContext().getApplicationContext();
      app.io
          .submit(
              () -> {
                app.store.close();
                getTargetContext().deleteDatabase("acceptance_ui.db");
                app.store = new LocalStore(getTargetContext(), "acceptance_ui.db", true);
                app.catalog = new CatalogService(app.store);
                app.profiles = new ProfileService(app.store);
                app.sales = new SalesService(app.store);
                app.cart.clear();
              })
          .get();
      Intent intent = new Intent(getTargetContext(), MainActivity.class);
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      activity = (MainActivity) startActivitySync(intent);
      idle();
      check(hasText("Panel solar 550 W"), "UI01 Catálogo inicial nativo");
      capture("01_catalogo.png");
      click("tab-4");
      set("profile-name", "Cliente Demo");
      set("profile-phone", "3001234567");
      set("profile-city", "Bogotá");
      set("profile-address", "Calle 10 # 20-30");
      click("save-profile");
      check(hasText("Datos del cliente guardados"), "UI02 Guardado del cliente");
      capture("02_cliente.png");
      click("tab-0");
      set("search", "Batería");
      click("search-button");
      check(
          hasText("Batería de litio 100 Ah") && !hasText("Panel solar 550 W"),
          "UI03 Búsqueda del catálogo");
      set("search", "");
      click("search-button");
      click("add-1");
      click("add-1");
      click("tab-1");
      check(app.cart.count() == 2, "UI04 Carrito combina cantidades");
      capture("03_carrito.png");
      // Esperar la nueva instancia reanudada, nunca reutilizar la actividad destruida.
      MainActivity before = activity;
      AtomicReference<MainActivity> resumed = new AtomicReference<>();
      Application.ActivityLifecycleCallbacks callback =
          new Application.ActivityLifecycleCallbacks() {
            public void onActivityCreated(Activity a, Bundle b) {}

            public void onActivityStarted(Activity a) {}

            public void onActivityResumed(Activity a) {
              if (a instanceof MainActivity && a != before) resumed.set((MainActivity) a);
            }

            public void onActivityPaused(Activity a) {}

            public void onActivityStopped(Activity a) {}

            public void onActivitySaveInstanceState(Activity a, Bundle b) {}

            public void onActivityDestroyed(Activity a) {}
          };
      app.registerActivityLifecycleCallbacks(callback);
      runOnMainSync(before::recreate);
      long deadline = System.currentTimeMillis() + 30000;
      while (resumed.get() == null && System.currentTimeMillis() < deadline) {
        Thread.sleep(100);
        waitForIdleSync();
      }
      app.unregisterActivityLifecycleCallbacks(callback);
      if (resumed.get() == null) throw new AssertionError("No se recreó la actividad");
      activity = resumed.get();
      idle();
      check(
          app.cart.count() == 2 && hasText("Guardar cotización"),
          "UI05 Recreación conserva carrito y pantalla");
      click("save-quote");
      click("tab-2");
      check(hasText("Cotización C-1"), "UI06 Cotización creada desde la interfaz");
      capture("04_cotizacion.png");
      click("confirm-1");
      confirmDialog();
      click("tab-3");
      check(hasText("Pedido P-1  ·  PENDIENTE"), "UI07 Pedido e inventario confirmados");
      capture("05_pedido.png");
      click("cancel-1");
      confirmDialog();
      check(hasText("Pedido P-1  ·  CANCELADO"), "UI08 Cancelación desde la interfaz");
      click("tab-0");
      click("add-2");
      click("tab-1");
      click("save-quote");
      click("tab-2");
      click("confirm-2");
      confirmDialog();
      click("tab-3");
      click("advance-2");
      confirmDialog();
      click("advance-2");
      confirmDialog();
      check(hasText("Pedido P-2  ·  ENTREGADO"), "UI09 Envío y entrega secuenciales");
      capture("06_entregado.png");
      click("tab-4");
      set("profile-phone", "12");
      click("save-profile");
      check(hasText("Teléfono:"), "UI10 Validación visible del cliente");
      capture("07_validacion.png");
      check(
          app.io.submit(() -> app.store.product(1).stock).get() == 20,
          "UI11 Cancelación devuelve el stock original");
      report.append("TOTAL: ").append(count).append(" comprobaciones aprobadas; 0 fallos.\n");
      result.putString("stream", "\n" + report);
      finish(Activity.RESULT_OK, result);
    } catch (Throwable e) {
      StringWriter trace = new StringWriter();
      e.printStackTrace(new PrintWriter(trace));
      result.putString("stream", "\n" + report + "FALLO: " + trace);
      finish(Activity.RESULT_CANCELED, result);
    }
  }

  private void integration() {
    Context c = getTargetContext();
    c.deleteDatabase("integration_test.db");
    LocalStore db = new LocalStore(c, "integration_test.db", true);
    CatalogService catalog = new CatalogService(db);
    SalesService sales = new SalesService(db);
    ProfileService profiles = new ProfileService(db);
    check(db.products("").size() == 3, "DB01 Semilla de productos");
    check(db.products("%' OR 1=1 --").isEmpty(), "DB02 Consulta parametrizada ante entrada SQL");
    long id = catalog.save(new Product(0, "TEST-1", "Producto prueba", "Pruebas", 12345, 5, true));
    catalog.save(new Product(id, "TEST-1", "Producto editado", "Pruebas", 15001, 999, true));
    check(
        db.product(id).stock == 5 && db.product(id).price == 15001, "DB03 Crear y editar producto");
    rejects(
        () -> catalog.save(new Product(0, "TEST-1", "Duplicado", "Pruebas", 100, 1, true)),
        "DB04 Código único");
    catalog.adjust(id, 3, "Recepción");
    check(db.product(id).stock == 8, "DB05 Ajuste de inventario");
    profiles.save(new Profile("Cliente Demo", "3001234567", "Bogotá", "Calle 10 # 20"));
    Map<Long, Integer> cart = new LinkedHashMap<>();
    cart.put(1L, 2);
    cart.put(2L, 1);
    long now = System.currentTimeMillis();
    long q = sales.quote(cart, now);
    check(db.quote(q).total() == 281000000, "DB06 Total exacto y cotización persistida");
    long o = sales.confirm(q, now);
    check(db.product(1).stock == 18 && db.product(2).stock == 7, "DB07 Reserva transaccional");
    check(sales.confirm(q, now) == o && db.orders().size() == 1, "DB08 Confirmación idempotente");
    sales.cancel(o);
    sales.cancel(o);
    check(db.product(1).stock == 20 && db.product(2).stock == 8, "DB09 Devolución una sola vez");
    try {
      db.transaction(
          () -> {
            db.setStock(1, 0, "Fallo forzado");
            throw new IllegalStateException("Fallo de prueba");
          });
    } catch (IllegalStateException expected) {
    }
    check(db.product(1).stock == 20, "DB10 Rollback real de SQLite");
    catalog.archive(id);
    check(
        db.product(id) != null && !db.product(id).active, "DB11 Baja lógica conserva referencias");
    db.close();
    LocalStore reopened = new LocalStore(c, "integration_test.db", false);
    check(
        reopened.quote(q).customer.name.equals("Cliente Demo")
            && reopened.order(o).status.equals(Order.CANCELLED),
        "DB12 Persistencia después de cerrar y abrir");
    reopened.close();
  }

  private void idle() throws Exception {
    waitForIdleSync();
    long end = System.currentTimeMillis() + 30000;
    while (activity != null && activity.busy && System.currentTimeMillis() < end) {
      Thread.sleep(50);
      waitForIdleSync();
    }
    if (activity != null && activity.busy)
      throw new AssertionError(
          "Operación pendiente; actividad destruida=" + activity.isDestroyed());
    Thread.sleep(100);
  }

  private View find(String tag) {
    return activity.getWindow().getDecorView().findViewWithTag(tag);
  }

  private void click(String tag) throws Exception {
    runOnMainSync(
        () -> {
          View v = find(tag);
          if (v == null) throw new AssertionError("No existe " + tag);
          v.performClick();
        });
    idle();
  }

  private void set(String tag, String text) {
    runOnMainSync(
        () -> {
          EditText v = (EditText) find(tag);
          if (v == null) throw new AssertionError(tag);
          v.setText(text);
        });
  }

  private boolean hasText(String text) {
    final boolean[] found = {false};
    runOnMainSync(() -> found[0] = contains(activity.getWindow().getDecorView(), text));
    return found[0];
  }

  private boolean contains(View v, String text) {
    if (v instanceof TextView && ((TextView) v).getText().toString().contains(text)) return true;
    if (v instanceof ViewGroup) {
      ViewGroup group = (ViewGroup) v;
      for (int i = 0; i < group.getChildCount(); i++)
        if (contains(group.getChildAt(i), text)) return true;
    }
    return false;
  }

  private void confirmDialog() throws Exception {
    AccessibilityNodeInfo root = getUiAutomation().getRootInActiveWindow();
    if (root == null) throw new AssertionError("Diálogo no disponible");
    boolean clicked = false;
    for (AccessibilityNodeInfo node : root.findAccessibilityNodeInfosByText("Confirmar")) {
      if (node.getText() != null
          && "Confirmar".equalsIgnoreCase(node.getText().toString())
          && node.isClickable()) {
        clicked = node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        break;
      }
    }
    if (!clicked) throw new AssertionError("Confirmación no encontrada");
    Thread.sleep(200);
    idle();
  }

  private void capture(String name) throws Exception {
    Thread.sleep(250);
    Bitmap bitmap = getUiAutomation().takeScreenshot();
    if (bitmap == null) throw new AssertionError("Sin captura");
    File folder = new File(getTargetContext().getFilesDir(), "evidencias");
    folder.mkdirs();
    try (FileOutputStream out = new FileOutputStream(new File(folder, name))) {
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, out);
    }
    bitmap.recycle();
  }
}
