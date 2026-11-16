package com.jhontineo.raizvolt.data;

import android.content.*;
import android.database.Cursor;
import android.database.sqlite.*;
import com.jhontineo.raizvolt.domain.*;
import java.util.*;

/** Adaptador SQLite. SQL parametrizado, claves foráneas y transacciones. */
public final class LocalStore extends SQLiteOpenHelper implements Store {
  private final boolean seed;

  public LocalStore(Context context) {
    this(context, "raizvolt_mobile.db", true);
  }

  public LocalStore(Context context, String name, boolean seed) {
    super(context, name, null, 1);
    this.seed = seed;
  }

  @Override
  public void onConfigure(SQLiteDatabase db) {
    db.setForeignKeyConstraintsEnabled(true);
  }

  @Override
  public void onCreate(SQLiteDatabase db) {
    db.execSQL(
        "CREATE TABLE products(id INTEGER PRIMARY KEY,sku TEXT UNIQUE NOT NULL,name TEXT NOT"
            + " NULL,category TEXT NOT NULL,price INTEGER NOT NULL CHECK(price>0),stock INTEGER NOT"
            + " NULL CHECK(stock BETWEEN 0 AND 1000000),active INTEGER NOT NULL DEFAULT 1)");
    db.execSQL(
        "CREATE TABLE profile(id INTEGER PRIMARY KEY CHECK(id=1),name TEXT NOT NULL,phone TEXT NOT"
            + " NULL,city TEXT NOT NULL,address TEXT NOT NULL)");
    db.execSQL(
        "CREATE TABLE quotes(id INTEGER PRIMARY KEY,created_at INTEGER NOT NULL,name TEXT NOT"
            + " NULL,phone TEXT NOT NULL,city TEXT NOT NULL,address TEXT NOT NULL)");
    db.execSQL(
        "CREATE TABLE quote_lines(quote_id INTEGER REFERENCES quotes(id),product_id INTEGER"
            + " REFERENCES products(id),name TEXT NOT NULL,price INTEGER NOT NULL"
            + " CHECK(price>0),quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 999),PRIMARY"
            + " KEY(quote_id,product_id))");
    db.execSQL(
        "CREATE TABLE orders(id INTEGER PRIMARY KEY,quote_id INTEGER UNIQUE NOT NULL REFERENCES"
            + " quotes(id),created_at INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN"
            + " ('PENDIENTE','ENVIADO','ENTREGADO','CANCELADO')))");
    db.execSQL(
        "CREATE TABLE movements(id INTEGER PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES"
            + " products(id),delta INTEGER NOT NULL,balance INTEGER NOT NULL,reason TEXT NOT"
            + " NULL,created_at INTEGER NOT NULL)");
    if (seed) {
      db.execSQL(
          "INSERT INTO products VALUES(1,'PANEL-550','Panel solar 550 W','Paneles',68000000,20,1)");
      db.execSQL(
          "INSERT INTO products VALUES(2,'INV-3000','Inversor híbrido 3000"
              + " W','Inversores',145000000,8,1)");
      db.execSQL(
          "INSERT INTO products VALUES(3,'BAT-100','Batería de litio 100"
              + " Ah','Baterías',198000000,12,1)");
      db.execSQL(
          "INSERT INTO movements(product_id,delta,balance,reason,created_at) SELECT"
              + " id,stock,stock,'Inventario de demostración',0 FROM products");
    }
  }

  @Override
  public void onUpgrade(SQLiteDatabase db, int from, int to) {
    throw new IllegalStateException("Migración no definida: " + from + " a " + to);
  }

  @Override
  public synchronized <T> T transaction(Work<T> work) {
    SQLiteDatabase db = getWritableDatabase();
    db.beginTransaction();
    try {
      T result = work.run();
      db.setTransactionSuccessful();
      return result;
    } finally {
      db.endTransaction();
    }
  }

  private Product readProduct(Cursor c) {
    return new Product(
        c.getLong(0),
        c.getString(1),
        c.getString(2),
        c.getString(3),
        c.getLong(4),
        c.getInt(5),
        c.getInt(6) == 1);
  }

  @Override
  public List<Product> products(String query) {
    List<Product> out = new ArrayList<>();
    String term = "%" + query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    try (Cursor c =
        getReadableDatabase()
            .rawQuery(
                "SELECT * FROM products WHERE active=1 AND (name LIKE ? ESCAPE '\\' OR sku LIKE ?"
                    + " ESCAPE '\\' OR category LIKE ? ESCAPE '\\') ORDER BY id",
                new String[] {term, term, term})) {
      while (c.moveToNext()) out.add(readProduct(c));
    }
    return out;
  }

  @Override
  public Product product(long id) {
    try (Cursor c =
        getReadableDatabase()
            .rawQuery("SELECT * FROM products WHERE id=?", new String[] {"" + id})) {
      return c.moveToFirst() ? readProduct(c) : null;
    }
  }

  @Override
  public long saveProduct(Product p) {
    ContentValues v = new ContentValues();
    v.put("sku", p.sku);
    v.put("name", p.name);
    v.put("category", p.category);
    v.put("price", p.price);
    v.put("stock", p.stock);
    v.put("active", p.active ? 1 : 0);
    try {
      if (p.id == 0) {
        long id = getWritableDatabase().insertOrThrow("products", null, v);
        movement(id, p.stock, p.stock, "Inventario inicial");
        return id;
      }
      getWritableDatabase().update("products", v, "id=?", new String[] {"" + p.id});
      return p.id;
    } catch (SQLiteConstraintException e) {
      throw new IllegalArgumentException(
          "El código del producto ya existe o los datos son inválidos.");
    }
  }

  private void movement(long id, int delta, int balance, String reason) {
    ContentValues v = new ContentValues();
    v.put("product_id", id);
    v.put("delta", delta);
    v.put("balance", balance);
    v.put("reason", reason);
    v.put("created_at", System.currentTimeMillis());
    getWritableDatabase().insertOrThrow("movements", null, v);
  }

  @Override
  public void setStock(long id, int stock, String reason) {
    Product old = product(id);
    ContentValues v = new ContentValues();
    v.put("stock", stock);
    getWritableDatabase().update("products", v, "id=?", new String[] {"" + id});
    movement(id, stock - old.stock, stock, reason);
  }

  @Override
  public void archive(long id) {
    ContentValues v = new ContentValues();
    v.put("active", 0);
    getWritableDatabase().update("products", v, "id=?", new String[] {"" + id});
  }

  @Override
  public Profile profile() {
    try (Cursor c =
        getReadableDatabase()
            .rawQuery("SELECT name,phone,city,address FROM profile WHERE id=1", null)) {
      return c.moveToFirst()
          ? new Profile(c.getString(0), c.getString(1), c.getString(2), c.getString(3))
          : null;
    }
  }

  private ContentValues profileValues(Profile p) {
    ContentValues v = new ContentValues();
    v.put("name", p.name);
    v.put("phone", p.phone);
    v.put("city", p.city);
    v.put("address", p.address);
    return v;
  }

  @Override
  public void saveProfile(Profile p) {
    ContentValues v = profileValues(p);
    v.put("id", 1);
    getWritableDatabase().insertWithOnConflict("profile", null, v, SQLiteDatabase.CONFLICT_REPLACE);
  }

  @Override
  public long saveQuote(Quote q) {
    ContentValues v = profileValues(q.customer);
    v.put("created_at", q.createdAt);
    long id = getWritableDatabase().insertOrThrow("quotes", null, v);
    for (Line l : q.lines) {
      ContentValues line = new ContentValues();
      line.put("quote_id", id);
      line.put("product_id", l.productId);
      line.put("name", l.name);
      line.put("price", l.price);
      line.put("quantity", l.quantity);
      getWritableDatabase().insertOrThrow("quote_lines", null, line);
    }
    return id;
  }

  @Override
  public Quote quote(long id) {
    try (Cursor c =
        getReadableDatabase()
            .rawQuery(
                "SELECT created_at,name,phone,city,address FROM quotes WHERE id=?",
                new String[] {"" + id})) {
      if (!c.moveToFirst()) return null;
      List<Line> lines = new ArrayList<>();
      try (Cursor l =
          getReadableDatabase()
              .rawQuery(
                  "SELECT product_id,name,price,quantity FROM quote_lines WHERE quote_id=? ORDER BY"
                      + " product_id",
                  new String[] {"" + id})) {
        while (l.moveToNext())
          lines.add(new Line(l.getLong(0), l.getString(1), l.getLong(2), l.getInt(3)));
      }
      return new Quote(
          id,
          c.getLong(0),
          new Profile(c.getString(1), c.getString(2), c.getString(3), c.getString(4)),
          lines);
    }
  }

  @Override
  public List<Quote> quotes() {
    List<Quote> out = new ArrayList<>();
    try (Cursor c =
        getReadableDatabase().rawQuery("SELECT id FROM quotes ORDER BY id DESC", null)) {
      while (c.moveToNext()) out.add(quote(c.getLong(0)));
    }
    return out;
  }

  private Order readOrder(Cursor c) {
    return new Order(c.getLong(0), c.getLong(1), c.getLong(2), c.getString(3));
  }

  @Override
  public Order order(long id) {
    try (Cursor c =
        getReadableDatabase().rawQuery("SELECT * FROM orders WHERE id=?", new String[] {"" + id})) {
      return c.moveToFirst() ? readOrder(c) : null;
    }
  }

  @Override
  public Order orderForQuote(long id) {
    try (Cursor c =
        getReadableDatabase()
            .rawQuery("SELECT * FROM orders WHERE quote_id=?", new String[] {"" + id})) {
      return c.moveToFirst() ? readOrder(c) : null;
    }
  }

  @Override
  public long saveOrder(long id, long time) {
    ContentValues v = new ContentValues();
    v.put("quote_id", id);
    v.put("created_at", time);
    v.put("status", Order.PENDING);
    return getWritableDatabase().insertOrThrow("orders", null, v);
  }

  @Override
  public void setStatus(long id, String status) {
    ContentValues v = new ContentValues();
    v.put("status", status);
    getWritableDatabase().update("orders", v, "id=?", new String[] {"" + id});
  }

  @Override
  public List<Order> orders() {
    List<Order> out = new ArrayList<>();
    try (Cursor c = getReadableDatabase().rawQuery("SELECT * FROM orders ORDER BY id DESC", null)) {
      while (c.moveToNext()) out.add(readOrder(c));
    }
    return out;
  }
}
