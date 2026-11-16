package com.jhontineo.raizvolt.ui;

import android.app.*;
import android.os.*;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import com.jhontineo.raizvolt.App;
import com.jhontineo.raizvolt.R;
import com.jhontineo.raizvolt.domain.*;
import java.text.SimpleDateFormat;
import java.util.*;

/** Presentación nativa: delega reglas a servicios y toda operación SQLite al ejecutor. */
public final class MainActivity extends Activity {
  private App app;
  private Ui ui;
  private LinearLayout root, content, nav;
  private TextView status;
  private int tab;
  private String query = "", message = "Listo para trabajar sin conexión";
  private boolean error;
  public volatile boolean busy = true;
  private long generation;
  private final String[] tabs = {"Catálogo", "Carrito", "Cotizaciones", "Pedidos", "Cliente"};

  private interface Action {
    String run();
  }

  private static final class State {
    List<Product> products;
    List<Quote> quotes;
    List<Order> orders;
    List<Line> lines;
    Profile profile;
    String cartError;
    int count;
  }

  @Override
  public void onCreate(Bundle saved) {
    super.onCreate(saved);
    app = (App) getApplication();
    ui = new Ui(this);
    if (saved != null) {
      tab = saved.getInt("tab");
      query = saved.getString("query", "");
      long[] ids = saved.getLongArray("cartIds");
      int[] qty = saved.getIntArray("cartQty");
      if (ids != null && qty != null) {
        app.cart.clear();
        for (int i = 0; i < ids.length; i++) app.cart.set(ids[i], qty[i]);
      }
    }
    root = ui.column();
    root.setBackgroundColor(Ui.BG);
    setContentView(root);
    root.setOnApplyWindowInsetsListener(
        (v, insets) -> {
          v.setPadding(
              insets.getSystemWindowInsetLeft(),
              insets.getSystemWindowInsetTop(),
              insets.getSystemWindowInsetRight(),
              insets.getSystemWindowInsetBottom());
          return insets;
        });
    LinearLayout header = ui.column();
    header.setPadding(ui.dp(20), ui.dp(14), ui.dp(20), ui.dp(10));
    header.setBackgroundColor(Ui.GREEN);
    header.addView(ui.text("RAÍZVOLT", 25, 0xffffffff, true));
    header.addView(ui.text("Ventas móviles  /  Modo local", 13, 0xffe1ecbb, false));
    root.addView(header);
    status = ui.text(message, 13, Ui.MUTED, false);
    status.setPadding(ui.dp(20), ui.dp(8), ui.dp(20), ui.dp(8));
    status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
    root.addView(status);
    ScrollView scroll = new ScrollView(this);
    scroll.setFillViewport(true);
    content = ui.column();
    content.setPadding(ui.dp(16), 0, ui.dp(16), ui.dp(16));
    scroll.addView(content);
    root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
    nav = ui.row();
    nav.setBackgroundColor(0xffffffff);
    root.addView(nav);
    reload();
  }

  @Override
  protected void onSaveInstanceState(Bundle out) {
    super.onSaveInstanceState(out);
    out.putInt("tab", tab);
    out.putString("query", query);
    Map<Long, Integer> snapshot = app.cart.snapshot();
    long[] ids = new long[snapshot.size()];
    int[] qty = new int[ids.length];
    int i = 0;
    for (Map.Entry<Long, Integer> e : snapshot.entrySet()) {
      ids[i] = e.getKey();
      qty[i++] = e.getValue();
    }
    out.putLongArray("cartIds", ids);
    out.putIntArray("cartQty", qty);
  }

  private void reload() {
    final long request = ++generation;
    final String search = query;
    busy = true;
    status.setText(R.string.loading);
    app.io.execute(
        () -> {
          try {
            State s = new State();
            s.products = app.catalog.list(search);
            s.quotes = app.store.quotes();
            s.orders = app.store.orders();
            s.profile = app.profiles.get();
            s.count = app.cart.count();
            try {
              s.lines = app.sales.lines(app.cart.snapshot());
            } catch (IllegalArgumentException e) {
              s.lines = new ArrayList<>();
              s.cartError = e.getMessage();
            }
            runOnUiThread(
                () -> {
                  if (isDestroyed() || request != generation) return;
                  busy = false;
                  render(s);
                });
          } catch (Exception e) {
            runOnUiThread(
                () -> {
                  if (isDestroyed() || request != generation) return;
                  busy = false;
                  showError(e);
                });
          }
        });
  }

  private void perform(Action action) {
    if (busy) return;
    busy = true;
    status.setText(R.string.saving);
    app.io.execute(
        () -> {
          try {
            String result = action.run();
            runOnUiThread(
                () -> {
                  if (isDestroyed()) return;
                  message = result;
                  error = false;
                  reload();
                });
          } catch (Exception e) {
            runOnUiThread(
                () -> {
                  if (isDestroyed()) return;
                  busy = false;
                  showError(e);
                });
          }
        });
  }

  private void showError(Exception e) {
    error = true;
    message =
        e instanceof IllegalArgumentException
            ? e.getMessage()
            : "No se pudo completar la operación. Revisa el espacio disponible e inténtalo de"
                  + " nuevo.";
    status.setText(message);
    status.setTextColor(0xff9d302b);
  }

  private void render(State s) {
    status.setText(message);
    status.setTextColor(error ? 0xff9d302b : Ui.MUTED);
    content.removeAllViews();
    nav.removeAllViews();
    for (int i = 0; i < tabs.length; i++) {
      final int index = i;
      String label = i == 1 ? tabs[i] + " (" + s.count + ")" : tabs[i];
      Button b =
          ui.button(
              label,
              "tab-" + i,
              () -> {
                if (!busy) {
                  tab = index;
                  error = false;
                  message = "Datos guardados en este dispositivo";
                  reload();
                }
              });
      b.setTextSize(10);
      b.setPadding(0, 0, 0, 0);
      b.setMaxLines(2);
      if (i == tab) b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xffe2edcf));
      ui.weighted(nav, b);
    }
    content.addView(ui.text(tabs[tab], 26, Ui.INK, true));
    switch (tab) {
      case 0:
        catalog(s);
        break;
      case 1:
        cart(s);
        break;
      case 2:
        quotes(s);
        break;
      case 3:
        orders(s);
        break;
      default:
        profile(s);
    }
  }

  private void catalog(State s) {
    content.addView(ui.text("Productos solares · precios de demostración", 13, Ui.MUTED, false));
    LinearLayout search = ui.row();
    EditText input = new EditText(this);
    input.setHint("Nombre, código o categoría");
    input.setContentDescription("Buscar en catálogo");
    input.setSingleLine();
    input.setText(query);
    input.setTextSize(14);
    input.setTag("search");
    ui.weighted(search, input);
    search.addView(
        ui.button(
            "Buscar",
            "search-button",
            () -> {
              query = input.getText().toString();
              reload();
            }));
    content.addView(search);
    content.addView(ui.button("+ Nuevo producto", "new-product", () -> editProduct(null)));
    if (s.products.isEmpty())
      content.addView(ui.text("No hay productos para esta búsqueda.", 16, Ui.MUTED, false));
    for (Product p : s.products) {
      LinearLayout c = ui.card();
      c.addView(ui.text(p.category.toUpperCase(new Locale("es", "CO")), 11, Ui.GREEN, true));
      c.addView(ui.text(p.name, 20, Ui.INK, true));
      c.addView(ui.text(p.sku + "  ·  " + p.stock + " disponibles", 13, Ui.MUTED, false));
      c.addView(ui.text(Rules.cop(p.price), 20, Ui.GREEN, true));
      LinearLayout buttons = ui.row();
      ui.weighted(
          buttons,
          ui.primary(
              "Añadir",
              "add-" + p.id,
              () ->
                  perform(
                      () -> {
                        Integer quantity = app.cart.snapshot().get(p.id);
                        int qty = quantity == null ? 0 : quantity;
                        Product current = app.store.product(p.id);
                        if (qty >= current.stock)
                          throw new IllegalArgumentException("No hay más existencias disponibles.");
                        app.cart.add(p.id);
                        return "Producto añadido al carrito";
                      })));
      ui.weighted(buttons, ui.button("Gestionar", "edit-" + p.id, () -> editProduct(p)));
      c.addView(buttons);
      content.addView(c);
    }
  }

  private void cart(State s) {
    content.addView(
        ui.text("El inventario se reserva al confirmar el pedido.", 14, Ui.MUTED, false));
    if (s.cartError != null) {
      content.addView(ui.text(s.cartError, 16, 0xff9d302b, true));
      content.addView(
          ui.button(
              "Vaciar carrito",
              "clear-cart",
              () ->
                  perform(
                      () -> {
                        app.cart.clear();
                        return "Carrito vacío";
                      })));
      return;
    }
    if (s.lines.isEmpty()) {
      content.addView(ui.text("Añade productos desde el catálogo.", 17, Ui.MUTED, false));
      return;
    }
    long total = 0;
    for (Line line : s.lines) {
      total += line.total();
      LinearLayout c = ui.card();
      c.addView(ui.text(line.name, 19, Ui.INK, true));
      c.addView(ui.text(line.quantity + " × " + Rules.cop(line.price), 15, Ui.MUTED, false));
      c.addView(ui.text(Rules.cop(line.total()), 19, Ui.GREEN, true));
      LinearLayout row = ui.row();
      ui.weighted(
          row,
          ui.button(
              "−",
              "minus-" + line.productId,
              () ->
                  perform(
                      () -> {
                        app.cart.set(line.productId, line.quantity - 1);
                        return "Cantidad actualizada";
                      })));
      ui.weighted(
          row,
          ui.button(
              "+",
              "plus-" + line.productId,
              () ->
                  perform(
                      () -> {
                        Product p = app.store.product(line.productId);
                        if (line.quantity >= p.stock)
                          throw new IllegalArgumentException("Existencias insuficientes.");
                        app.cart.set(line.productId, line.quantity + 1);
                        return "Cantidad actualizada";
                      })));
      ui.weighted(
          row,
          ui.button(
              "Quitar",
              "remove-" + line.productId,
              () ->
                  perform(
                      () -> {
                        app.cart.set(line.productId, 0);
                        return "Producto retirado del carrito";
                      })));
      c.addView(row);
      content.addView(c);
    }
    content.addView(ui.text("Total  " + Rules.cop(total), 22, Ui.GREEN, true));
    content.addView(
        ui.primary(
            "Guardar cotización",
            "save-quote",
            () ->
                perform(
                    () -> {
                      long id = app.sales.quote(app.cart.snapshot(), System.currentTimeMillis());
                      app.cart.clear();
                      return "Cotización C-" + id + " guardada. Ábrela en Cotizaciones.";
                    })));
    content.addView(
        ui.text("Vigencia: 7 días. Sin cobro ni pago electrónico.", 13, Ui.MUTED, false));
  }

  private String date(long time) {
    return new SimpleDateFormat("dd/MM/yyyy HH:mm", new Locale("es", "CO")).format(new Date(time));
  }

  private void quoteDetails(LinearLayout c, Quote q) {
    c.addView(ui.text(q.customer.name + " · " + q.customer.city, 15, Ui.INK, false));
    c.addView(ui.text(date(q.createdAt), 12, Ui.MUTED, false));
    for (Line l : q.lines) c.addView(ui.text(l.quantity + " × " + l.name, 14, Ui.MUTED, false));
    c.addView(ui.text(Rules.cop(q.total()), 21, Ui.GREEN, true));
  }

  private void quotes(State s) {
    if (s.quotes.isEmpty())
      content.addView(ui.text("Tus cotizaciones aparecerán aquí.", 17, Ui.MUTED, false));
    for (Quote q : s.quotes) {
      LinearLayout c = ui.card();
      c.addView(ui.text("Cotización C-" + q.id, 20, Ui.INK, true));
      quoteDetails(c, q);
      Order order = null;
      for (Order o : s.orders) if (o.quoteId == q.id) order = o;
      if (order == null)
        c.addView(
            ui.primary(
                "Confirmar pedido",
                "confirm-" + q.id,
                () ->
                    confirm(
                        "Confirmar cotización",
                        "Se descontará el inventario de esta cotización.",
                        () ->
                            perform(
                                () ->
                                    "Pedido P-"
                                        + app.sales.confirm(q.id, System.currentTimeMillis())
                                        + " registrado"))));
      else c.addView(ui.text("Pedido P-" + order.id + " · " + order.status, 14, Ui.GREEN, true));
      content.addView(c);
    }
  }

  private void orders(State s) {
    if (s.orders.isEmpty())
      content.addView(
          ui.text("Confirma una cotización para crear un pedido.", 17, Ui.MUTED, false));
    for (Order o : s.orders) {
      Quote q = null;
      for (Quote candidate : s.quotes) if (candidate.id == o.quoteId) q = candidate;
      if (q == null) continue;
      LinearLayout c = ui.card();
      c.addView(ui.text("Pedido P-" + o.id + "  ·  " + o.status, 18, Ui.INK, true));
      quoteDetails(c, q);
      c.addView(ui.text(q.customer.address + "\nTel. " + q.customer.phone, 13, Ui.MUTED, false));
      if (Order.PENDING.equals(o.status)) {
        c.addView(
            ui.primary(
                "Registrar envío",
                "advance-" + o.id,
                () ->
                    confirm(
                        "Registrar envío",
                        "Confirma que el pedido fue enviado.",
                        () ->
                            perform(
                                () -> {
                                  app.sales.advance(o.id);
                                  return "Pedido marcado como enviado";
                                }))));
        c.addView(
            ui.button(
                "Cancelar pedido",
                "cancel-" + o.id,
                () ->
                    confirm(
                        "Cancelar pedido",
                        "Se devolverán las unidades al inventario.",
                        () ->
                            perform(
                                () -> {
                                  app.sales.cancel(o.id);
                                  return "Pedido cancelado; inventario devuelto";
                                }))));
      } else if (Order.SENT.equals(o.status))
        c.addView(
            ui.primary(
                "Registrar entrega",
                "advance-" + o.id,
                () ->
                    confirm(
                        "Registrar entrega",
                        "Confirma que el cliente recibió el pedido.",
                        () ->
                            perform(
                                () -> {
                                  app.sales.advance(o.id);
                                  return "Pedido marcado como entregado";
                                }))));
      content.addView(c);
    }
  }

  private void profile(State s) {
    content.addView(
        ui.text(
            "Datos del cliente para la próxima cotización. Los pedidos anteriores conservan sus"
                + " datos originales.",
            14,
            Ui.MUTED,
            false));
    Profile p = s.profile == null ? new Profile("", "", "", "") : s.profile;
    LinearLayout c = ui.card();
    EditText
        name =
            ui.field(
                c,
                "Nombre completo",
                p.name,
                "profile-name",
                InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS,
                80),
        phone = ui.field(c, "Teléfono", p.phone, "profile-phone", InputType.TYPE_CLASS_PHONE, 20),
        city =
            ui.field(
                c,
                "Ciudad",
                p.city,
                "profile-city",
                InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS,
                60),
        address =
            ui.field(
                c,
                "Dirección",
                p.address,
                "profile-address",
                InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_POSTAL_ADDRESS,
                160);
    c.addView(
        ui.primary(
            "Guardar cliente",
            "save-profile",
            () -> {
              Profile next =
                  new Profile(
                      name.getText().toString(),
                      phone.getText().toString(),
                      city.getText().toString(),
                      address.getText().toString());
              perform(
                  () -> {
                    app.profiles.save(next);
                    return "Datos del cliente guardados";
                  });
            }));
    content.addView(c);
    content.addView(
        ui.text(
            "Uso individual del asesor. Los datos permanecen en este teléfono; esta versión no"
                + " sincroniza con la web.",
            13,
            Ui.MUTED,
            false));
  }

  private void confirm(String title, String detail, Runnable action) {
    if (busy) return;
    new AlertDialog.Builder(this)
        .setTitle(title)
        .setMessage(detail)
        .setNegativeButton("Volver", null)
        .setPositiveButton("Confirmar", (d, w) -> action.run())
        .show();
  }

  private void editProduct(Product p) {
    if (busy) return;
    LinearLayout form = ui.column();
    form.setPadding(ui.dp(20), ui.dp(4), ui.dp(20), ui.dp(8));
    ScrollView scroll = new ScrollView(this);
    scroll.addView(form);
    EditText
        sku =
            ui.field(
                form,
                "Código",
                p == null ? "" : p.sku,
                "product-sku",
                InputType.TYPE_CLASS_TEXT,
                24),
        name =
            ui.field(
                form,
                "Nombre",
                p == null ? "" : p.name,
                "product-name",
                InputType.TYPE_CLASS_TEXT,
                80),
        category =
            ui.field(
                form,
                "Categoría",
                p == null ? "" : p.category,
                "product-category",
                InputType.TYPE_CLASS_TEXT,
                40),
        price =
            ui.field(
                form,
                "Precio COP (sin separador de miles)",
                p == null ? "" : java.math.BigDecimal.valueOf(p.price, 2).toPlainString(),
                "product-price",
                InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL,
                12);
    EditText stock =
        p == null
            ? ui.field(
                form, "Existencias iniciales", "0", "product-stock", InputType.TYPE_CLASS_NUMBER, 7)
            : null;
    AlertDialog dialog =
        new AlertDialog.Builder(this)
            .setTitle(p == null ? "Nuevo producto" : "Gestionar producto")
            .setView(scroll)
            .setNegativeButton("Cerrar", null)
            .setPositiveButton("Guardar", null)
            .create();
    if (p != null) {
      form.addView(
          ui.button(
              "Ajustar inventario",
              "stock-adjust",
              () -> {
                dialog.dismiss();
                adjust(p);
              }));
      form.addView(
          ui.button(
              "Retirar del catálogo",
              "archive-product",
              () -> {
                dialog.dismiss();
                confirm(
                    "Retirar producto",
                    "Se conserva el historial de ventas.",
                    () ->
                        perform(
                            () -> {
                              app.catalog.archive(p.id);
                              return "Producto retirado";
                            }));
              }));
    }
    dialog.setOnShowListener(
        v ->
            dialog
                .getButton(AlertDialog.BUTTON_POSITIVE)
                .setOnClickListener(
                    w -> {
                      try {
                        Product next =
                            new Product(
                                p == null ? 0 : p.id,
                                sku.getText().toString(),
                                name.getText().toString(),
                                category.getText().toString(),
                                Rules.money(price.getText().toString()),
                                p == null
                                    ? Rules.integer(
                                        stock.getText().toString(), 0, 1000000, "Existencias")
                                    : p.stock,
                                true);
                        perform(
                            () -> {
                              app.catalog.save(next);
                              return "Producto guardado";
                            });
                        dialog.dismiss();
                      } catch (IllegalArgumentException e) {
                        price.setError(e.getMessage());
                      }
                    }));
    dialog.show();
  }

  private void adjust(Product p) {
    LinearLayout f = ui.column();
    f.setPadding(ui.dp(20), 0, ui.dp(20), 0);
    EditText
        delta =
            ui.field(
                f,
                "Unidades (+ entrada / - salida)",
                "",
                "stock-delta",
                InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_SIGNED,
                8),
        reason =
            ui.field(f, "Motivo del ajuste", "", "stock-reason", InputType.TYPE_CLASS_TEXT, 100);
    AlertDialog d =
        new AlertDialog.Builder(this)
            .setTitle("Inventario: " + p.stock)
            .setView(f)
            .setNegativeButton("Volver", null)
            .setPositiveButton("Guardar", null)
            .create();
    d.setOnShowListener(
        v ->
            d.getButton(AlertDialog.BUTTON_POSITIVE)
                .setOnClickListener(
                    w -> {
                      try {
                        int n =
                            Rules.integer(delta.getText().toString(), -1000000, 1000000, "Ajuste");
                        String why = reason.getText().toString();
                        perform(
                            () -> {
                              app.catalog.adjust(p.id, n, why);
                              return "Inventario actualizado";
                            });
                        d.dismiss();
                      } catch (IllegalArgumentException e) {
                        delta.setError(e.getMessage());
                      }
                    }));
    d.show();
  }
}
