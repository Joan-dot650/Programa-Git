// src/app.js
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

// src/database.js
import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
var Store = class {
  constructor(path = ":memory:") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.function("minusculas_es", { deterministic: true }, (value) => value.toLocaleLowerCase("es"));
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
    this.db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
  }
  one(sql, ...params) {
    return this.db.prepare(sql).get(...params);
  }
  all(sql, ...params) {
    return this.db.prepare(sql).all(...params);
  }
  run(sql, ...params) {
    return this.db.prepare(sql).run(...params);
  }
  /** Sin await dentro: la reserva de inventario y el pedido son una sola unidad. */
  transaction(work) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  close() {
    this.db.close();
  }
};

// src/errors.js
var ApiError = class extends Error {
  constructor(status, message, details = void 0) {
    super(message);
    this.status = status;
    this.details = details;
  }
};

// src/auth-service.js
import { createHash, randomBytes as randomBytes2 } from "node:crypto";

// src/passwords.js
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
var deriveKey = promisify(scrypt);
var COST = 16384;
var BLOCK_SIZE = 8;
var PARALLELISM = 5;
var KEY_LENGTH = 64;
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: 64 * 1024 * 1024
  });
  return ["scrypt", COST, BLOCK_SIZE, PARALLELISM, salt, key.toString("hex")].join("$");
}
async function verifyPassword(password, encoded) {
  const parts = encoded.split("$");
  const [algorithm, cost, blockSize, parallelism, salt, hash] = parts;
  if (parts.length !== 6 || algorithm !== "scrypt" || Number(cost) !== COST || Number(blockSize) !== BLOCK_SIZE || Number(parallelism) !== PARALLELISM || !/^[0-9a-f]{32}$/.test(salt) || !/^[0-9a-f]{128}$/.test(hash)) {
    return false;
  }
  const actual = await deriveKey(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELISM,
    maxmem: 64 * 1024 * 1024
  });
  return timingSafeEqual(Buffer.from(hash, "hex"), actual);
}

// src/validation.js
var CATEGORIES = ["PANEL_SOLAR", "INVERSOR", "BATERIA", "KIT_SOLAR", "ACCESORIO"];
var MAX_STOCK = 1e6;
function invalid(field, message) {
  throw new ApiError(400, "Datos de entrada inv\xE1lidos.", { [field]: message });
}
function object(body, keys) {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid("cuerpo", "Se requiere un objeto JSON.");
  if (Object.keys(body).some((key) => !keys.includes(key))) invalid("campos", `Solo se admiten: ${keys.join(", ")}.`);
  return body;
}
function text(value, field, min, max) {
  if (typeof value !== "string") invalid(field, "Debe ser texto.");
  const clean = value.trim();
  if (clean.length < min || clean.length > max || /[\u0000-\u001f\u007f]/u.test(clean)) {
    invalid(field, `Usa de ${min} a ${max} caracteres sin saltos de l\xEDnea ni caracteres de control.`);
  }
  return clean;
}
function integer(value, field, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) invalid(field, `Debe ser un n\xFAmero entero de ${min} a ${max}.`);
  return value;
}
function id(value) {
  if (!/^[1-9]\d*$/.test(value)) invalid("id", "Identificador entero positivo.");
  return integer(Number(value), "id", 1, Number.MAX_SAFE_INTEGER);
}
function price(value) {
  if (typeof value !== "string" || !/^\d{1,10}(\.\d{1,2})?$/.test(value)) {
    invalid("precio", 'Usa texto decimal con punto, sin miles, hasta 9999999999.99. Ejemplo: "680000.50".');
  }
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
  if (cents < 1 || cents > 999999999999) invalid("precio", "Debe ser mayor que cero y no superar 9999999999.99.");
  return cents;
}
function money(cents) {
  const amount = BigInt(cents);
  return `${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
}
function credentials(body) {
  object(body, ["usuario", "contrasena"]);
  const username = typeof body.usuario === "string" ? body.usuario.trim().toLowerCase() : "";
  if (!/^[a-z0-9][a-z0-9._-]{2,29}$/.test(username)) invalid("usuario", "Usa 3-30 letras, n\xFAmeros, punto, guion o guion bajo; comienza con letra o n\xFAmero.");
  if (typeof body.contrasena !== "string" || body.contrasena.length < 8 || body.contrasena.length > 128 || !body.contrasena.trim()) {
    invalid("contrasena", "Usa de 8 a 128 caracteres; no puede contener solo espacios.");
  }
  return { username, password: body.contrasena };
}
function product(body, creating) {
  object(body, ["codigo", "nombre", "categoria", "precio", ...creating ? ["existencias"] : []]);
  const code = text(body.codigo, "codigo", 3, 30).toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(code)) invalid("codigo", "Solo letras A-Z, n\xFAmeros y guion.");
  if (!CATEGORIES.includes(body.categoria)) invalid("categoria", `Usa una de: ${CATEGORIES.join(", ")}.`);
  return {
    code,
    name: text(body.nombre, "nombre", 3, 120),
    category: body.categoria,
    cents: price(body.precio),
    stock: creating ? integer(body.existencias, "existencias", 0, MAX_STOCK) : void 0
  };
}
function profile(body) {
  object(body, ["nombre", "telefono", "municipio", "direccion"]);
  const phone = text(body.telefono, "telefono", 7, 20);
  if (!/^\+?[0-9 ()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7) invalid("telefono", "Usa al menos siete d\xEDgitos; admite +, espacios, par\xE9ntesis y guiones.");
  return {
    nombre: text(body.nombre, "nombre", 3, 100),
    telefono: phone,
    municipio: text(body.municipio, "municipio", 3, 80),
    direccion: text(body.direccion, "direccion", 5, 200)
  };
}
function items(body) {
  object(body, ["items"]);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) invalid("items", "Env\xEDa entre 1 y 20 productos diferentes.");
  const unique = /* @__PURE__ */ new Set();
  return body.items.map((item) => {
    object(item, ["productoId", "cantidad"]);
    const productId = integer(item.productoId, "productoId", 1, Number.MAX_SAFE_INTEGER);
    const quantity = integer(item.cantidad, "cantidad", 1, 1e4);
    if (unique.has(productId)) invalid("items", "No repitas un producto; suma su cantidad.");
    unique.add(productId);
    return { productId, quantity };
  });
}
function pagination(params, extra = []) {
  const allowed = ["pagina", "limite", ...extra];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) invalid(key, "Par\xE1metro desconocido o repetido.");
  }
  function number(name, fallback, max) {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^[1-9]\d*$/.test(raw)) invalid(name, "Usa un entero positivo.");
    return integer(Number(raw), name, 1, max);
  }
  const page = number("pagina", 1, 1e6);
  const limit = number("limite", 20, 100);
  return { page, limit, offset: (page - 1) * limit };
}

// src/auth-service.js
var digest = (token) => createHash("sha256").update(token).digest("hex");
var publicUser = (row) => ({
  id: row.id,
  usuario: row.usuario,
  rol: row.rol,
  nombre: row.nombre,
  telefono: row.telefono,
  municipio: row.municipio,
  direccion: row.direccion,
  creadoEn: row.creado_en
});
async function createUser(store, body, role = "CLIENTE") {
  const { username, password } = credentials(body);
  if (store.one("SELECT id FROM usuarios WHERE usuario=?", username)) throw new ApiError(409, "El usuario ya est\xE1 registrado.");
  const encoded = await hashPassword(password);
  try {
    const result = store.run(
      "INSERT INTO usuarios (usuario,password_hash,rol,creado_en) VALUES (?,?,?,?)",
      username,
      encoded,
      role,
      (/* @__PURE__ */ new Date()).toISOString()
    );
    return publicUser(store.one("SELECT * FROM usuarios WHERE id=?", Number(result.lastInsertRowid)));
  } catch (error) {
    if (error.errcode === 2067) throw new ApiError(409, "El usuario ya est\xE1 registrado.");
    throw error;
  }
}
async function createAuthService(store, now = Date.now) {
  const dummy = await hashPassword(randomBytes2(32).toString("hex"));
  return {
    async register(body) {
      return { exito: true, mensaje: "Registro satisfactorio.", usuario: await createUser(store, body) };
    },
    async login(body) {
      const { username, password } = credentials(body);
      const user = store.one("SELECT * FROM usuarios WHERE usuario=?", username);
      const valid = await verifyPassword(password, user?.password_hash ?? dummy);
      if (!user || !valid) throw new ApiError(401, "Error en la autenticaci\xF3n");
      const token = randomBytes2(32).toString("hex");
      const expires = now() + 2 * 60 * 60 * 1e3;
      store.transaction(() => {
        store.run("DELETE FROM sesiones WHERE expira_ms<=?", now());
        store.run("DELETE FROM sesiones WHERE usuario_id=?", user.id);
        store.run("INSERT INTO sesiones (token_hash,usuario_id,expira_ms) VALUES (?,?,?)", digest(token), user.id, expires);
      });
      return {
        exito: true,
        mensaje: "Autenticaci\xF3n satisfactoria",
        token,
        tipo: "Bearer",
        expiraEn: new Date(expires).toISOString(),
        usuario: publicUser(user)
      };
    },
    authenticate(header) {
      if (typeof header !== "string" || !/^Bearer [a-f0-9]{64}$/.test(header)) throw new ApiError(401, "Se requiere un token Bearer v\xE1lido.");
      const tokenHash = digest(header.slice(7));
      const user = store.one(`SELECT u.* FROM usuarios u JOIN sesiones s ON s.usuario_id=u.id
        WHERE s.token_hash=? AND s.expira_ms>?`, tokenHash, now());
      if (!user) throw new ApiError(401, "Sesi\xF3n inv\xE1lida o vencida.");
      return { ...publicUser(user), tokenHash };
    },
    logout(user) {
      store.run("DELETE FROM sesiones WHERE token_hash=?", user.tokenHash);
    },
    getProfile(user) {
      return publicUser(store.one("SELECT * FROM usuarios WHERE id=?", user.id));
    },
    updateProfile(user, body) {
      const data = profile(body);
      store.run(
        "UPDATE usuarios SET nombre=?,telefono=?,municipio=?,direccion=? WHERE id=?",
        data.nombre,
        data.telefono,
        data.municipio,
        data.direccion,
        user.id
      );
      return this.getProfile(user);
    }
  };
}

// src/catalog-service.js
function productOutput(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    precio: money(row.precio_centavos),
    existencias: row.existencias,
    activo: !!row.activo
  };
}
var CatalogService = class {
  constructor(store) {
    this.store = store;
  }
  find(id2) {
    const row = this.store.one("SELECT * FROM productos WHERE id=? AND activo=1", id2);
    if (!row) throw new ApiError(404, "Producto no encontrado.");
    return row;
  }
  list(params) {
    const { page, limit, offset } = pagination(params, ["q", "categoria"]);
    const q = text(params.get("q") ?? "", "q", 0, 120).toLowerCase();
    const category = params.get("categoria") ?? "";
    if (category && !CATEGORIES.includes(category)) invalid("categoria", "Categor\xEDa desconocida.");
    const where = "activo=1 AND (?='' OR instr(minusculas_es(codigo),?)>0 OR instr(minusculas_es(nombre),?)>0) AND (?='' OR categoria=?)";
    const args = [q, q, q, category, category];
    const total = this.store.one(`SELECT count(*) AS n FROM productos WHERE ${where}`, ...args).n;
    const rows = this.store.all(`SELECT * FROM productos WHERE ${where} ORDER BY id LIMIT ? OFFSET ?`, ...args, limit, offset);
    return { productos: rows.map(productOutput), total, pagina: page, limite: limit };
  }
  movement(productId, actorId, delta, balance, reason, orderId = null) {
    this.store.run(
      "INSERT INTO movimientos (producto_id,usuario_id,pedido_id,variacion,saldo,motivo,creado_en) VALUES (?,?,?,?,?,?,?)",
      productId,
      actorId,
      orderId,
      delta,
      balance,
      reason,
      (/* @__PURE__ */ new Date()).toISOString()
    );
  }
  save(body, actor, productId = null) {
    const p = product(body, productId === null);
    if (productId !== null) this.find(productId);
    if (this.store.one("SELECT id FROM productos WHERE codigo=? AND id!=?", p.code, productId ?? 0)) throw new ApiError(409, "El c\xF3digo ya existe, incluso si el producto fue retirado.");
    return this.store.transaction(() => {
      const time = (/* @__PURE__ */ new Date()).toISOString();
      if (productId === null) {
        productId = Number(this.store.run(
          "INSERT INTO productos (codigo,nombre,categoria,precio_centavos,existencias,creado_en,actualizado_en) VALUES (?,?,?,?,?,?,?)",
          p.code,
          p.name,
          p.category,
          p.cents,
          p.stock,
          time,
          time
        ).lastInsertRowid);
        this.movement(productId, actor.id, p.stock, p.stock, "Inventario inicial");
      } else {
        this.store.run(
          "UPDATE productos SET codigo=?,nombre=?,categoria=?,precio_centavos=?,actualizado_en=? WHERE id=?",
          p.code,
          p.name,
          p.category,
          p.cents,
          time,
          productId
        );
      }
      return productOutput(this.find(productId));
    });
  }
  remove(productId) {
    this.find(productId);
    this.store.run("UPDATE productos SET activo=0,actualizado_en=? WHERE id=?", (/* @__PURE__ */ new Date()).toISOString(), productId);
  }
  adjust(productId, body, actor) {
    object(body, ["variacion", "motivo"]);
    const delta = integer(body.variacion, "variacion", -MAX_STOCK, MAX_STOCK);
    if (!delta) invalid("variacion", "Debe ser diferente de cero.");
    const reason = text(body.motivo, "motivo", 5, 200);
    return this.store.transaction(() => {
      const row = this.find(productId);
      const balance = row.existencias + delta;
      if (balance < 0 || balance > MAX_STOCK) throw new ApiError(409, "El ajuste dejar\xEDa existencias fuera del rango 0-1000000.");
      this.store.run("UPDATE productos SET existencias=?,actualizado_en=? WHERE id=?", balance, (/* @__PURE__ */ new Date()).toISOString(), productId);
      this.movement(productId, actor.id, delta, balance, reason);
      return productOutput(this.find(productId));
    });
  }
  summary() {
    const rows = this.store.all("SELECT precio_centavos,existencias FROM productos WHERE activo=1");
    const value = rows.reduce((sum, p) => sum + BigInt(p.precio_centavos) * BigInt(p.existencias), 0n);
    return {
      referencias: rows.length,
      unidades: rows.reduce((sum, p) => sum + p.existencias, 0),
      stockBajo: rows.filter((p) => p.existencias < 5).length,
      valorInventario: money(value),
      moneda: "COP"
    };
  }
  movements(params) {
    const { page, limit, offset } = pagination(params);
    return {
      movimientos: this.store.all(`SELECT m.id, m.producto_id AS productoId, p.codigo,
      m.usuario_id AS usuarioId, m.pedido_id AS pedidoId, m.variacion, m.saldo, m.motivo, m.creado_en AS creadoEn
      FROM movimientos m JOIN productos p ON p.id=m.producto_id ORDER BY m.id DESC LIMIT ? OFFSET ?`, limit, offset),
      total: this.store.one("SELECT count(*) AS n FROM movimientos").n,
      pagina: page,
      limite: limit
    };
  }
};

// src/sales-service.js
var SalesService = class {
  constructor(store, catalog, now = Date.now) {
    this.store = store;
    this.catalog = catalog;
    this.now = now;
  }
  owned(table, resourceId, user) {
    const row = this.store.one(`SELECT * FROM ${table} WHERE id=?`, resourceId);
    if (!row || user.rol !== "ADMIN" && row.usuario_id !== user.id) throw new ApiError(404, "Recurso no encontrado.");
    return row;
  }
  quoteOutput(row) {
    const lines = this.store.all("SELECT * FROM cotizacion_items WHERE cotizacion_id=? ORDER BY producto_id", row.id);
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      total: money(row.total_centavos),
      moneda: "COP",
      creadoEn: row.creado_en,
      venceEn: new Date(row.expira_ms).toISOString(),
      items: lines.map((line) => ({
        productoId: line.producto_id,
        codigo: line.codigo,
        nombre: line.nombre,
        precioUnitario: money(line.precio_centavos),
        cantidad: line.cantidad,
        subtotal: money(BigInt(line.precio_centavos) * BigInt(line.cantidad))
      }))
    };
  }
  quote(id2, user) {
    return this.quoteOutput(this.owned("cotizaciones", id2, user));
  }
  createQuote(body, user) {
    const requested = items(body);
    return this.store.transaction(() => {
      const lines = requested.map((line) => ({ ...line, p: this.catalog.find(line.productId) }));
      const total = lines.reduce((sum, line) => sum + BigInt(line.p.precio_centavos) * BigInt(line.quantity), 0n);
      const quoteId = Number(this.store.run(
        "INSERT INTO cotizaciones (usuario_id,total_centavos,creado_en,expira_ms) VALUES (?,?,?,?)",
        user.id,
        String(total),
        new Date(this.now()).toISOString(),
        this.now() + 7 * 864e5
      ).lastInsertRowid);
      for (const line of lines) this.store.run(
        "INSERT INTO cotizacion_items (cotizacion_id,producto_id,codigo,nombre,precio_centavos,cantidad) VALUES (?,?,?,?,?,?)",
        quoteId,
        line.productId,
        line.p.codigo,
        line.p.nombre,
        line.p.precio_centavos,
        line.quantity
      );
      return this.quote(quoteId, user);
    });
  }
  list(table, params, user) {
    const { page, limit, offset } = pagination(params);
    const where = user.rol === "ADMIN" ? "1=1" : "usuario_id=?";
    const args = user.rol === "ADMIN" ? [] : [user.id];
    const rows = this.store.all(`SELECT * FROM ${table} WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, ...args, limit, offset);
    return {
      [table]: rows.map((row) => table === "cotizaciones" ? this.quoteOutput(row) : this.orderOutput(row)),
      total: this.store.one(`SELECT count(*) AS n FROM ${table} WHERE ${where}`, ...args).n,
      pagina: page,
      limite: limit
    };
  }
  orderOutput(row) {
    const quote = this.store.one("SELECT * FROM cotizaciones WHERE id=?", row.cotizacion_id);
    return {
      id: row.id,
      cotizacionId: row.cotizacion_id,
      usuarioId: row.usuario_id,
      estado: row.estado,
      total: money(row.total_centavos),
      moneda: "COP",
      envio: JSON.parse(row.envio_json),
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
      items: this.quoteOutput(quote).items
    };
  }
  order(id2, user) {
    return this.orderOutput(this.owned("pedidos", id2, user));
  }
  createOrder(body, user) {
    object(body, ["cotizacionId"]);
    const quoteId = integer(body.cotizacionId, "cotizacionId", 1, Number.MAX_SAFE_INTEGER);
    return this.store.transaction(() => {
      const quote = this.store.one("SELECT * FROM cotizaciones WHERE id=? AND usuario_id=?", quoteId, user.id);
      if (!quote) throw new ApiError(404, "Cotizaci\xF3n propia no encontrada.");
      const existing = this.store.one("SELECT * FROM pedidos WHERE cotizacion_id=?", quoteId);
      if (existing) return { created: false, pedido: this.orderOutput(existing) };
      if (quote.expira_ms <= this.now()) throw new ApiError(409, "La cotizaci\xF3n venci\xF3. Genera una nueva.");
      const owner = this.store.one("SELECT * FROM usuarios WHERE id=?", user.id);
      const shipping = profile({ nombre: owner.nombre, telefono: owner.telefono, municipio: owner.municipio, direccion: owner.direccion });
      const lines = this.store.all("SELECT * FROM cotizacion_items WHERE cotizacion_id=?", quoteId);
      for (const line of lines) {
        const p = this.store.one("SELECT * FROM productos WHERE id=?", line.producto_id);
        if (!p?.activo || p.existencias < line.cantidad) throw new ApiError(409, `Producto ${line.codigo} no disponible o sin existencias suficientes.`);
      }
      const time = new Date(this.now()).toISOString();
      const orderId = Number(this.store.run(
        "INSERT INTO pedidos (cotizacion_id,usuario_id,estado,total_centavos,envio_json,creado_en,actualizado_en) VALUES (?,?,'PENDIENTE',?,?,?,?)",
        quoteId,
        user.id,
        quote.total_centavos,
        JSON.stringify(shipping),
        time,
        time
      ).lastInsertRowid);
      for (const line of lines) {
        this.store.run("UPDATE productos SET existencias=existencias-?,actualizado_en=? WHERE id=?", line.cantidad, time, line.producto_id);
        const balance = this.store.one("SELECT existencias FROM productos WHERE id=?", line.producto_id).existencias;
        this.catalog.movement(line.producto_id, user.id, -line.cantidad, balance, "Reserva de pedido", orderId);
      }
      return { created: true, pedido: this.order(orderId, user) };
    });
  }
  changeState(orderId, body, user) {
    object(body, ["estado"]);
    if (!["ENVIADO", "ENTREGADO", "CANCELADO"].includes(body.estado)) invalid("estado", "Usa ENVIADO, ENTREGADO o CANCELADO.");
    return this.store.transaction(() => {
      const order = this.owned("pedidos", orderId, user);
      if (user.rol !== "ADMIN" && body.estado !== "CANCELADO") throw new ApiError(403, "Solo el administrador puede enviar o entregar pedidos.");
      if (order.estado === body.estado) return this.orderOutput(order);
      const allowed = { PENDIENTE: ["ENVIADO", "CANCELADO"], ENVIADO: ["ENTREGADO"], ENTREGADO: [], CANCELADO: [] };
      if (!allowed[order.estado].includes(body.estado)) throw new ApiError(409, "Transici\xF3n de estado no permitida.");
      const time = new Date(this.now()).toISOString();
      if (body.estado === "CANCELADO") {
        const lines = this.store.all("SELECT * FROM cotizacion_items WHERE cotizacion_id=?", order.cotizacion_id);
        for (const line of lines) {
          const p = this.store.one("SELECT * FROM productos WHERE id=?", line.producto_id);
          const balance = p.existencias + line.cantidad;
          if (balance > MAX_STOCK) throw new ApiError(409, "La devoluci\xF3n excede el m\xE1ximo de inventario; solicita al administrador revisar el saldo.");
          this.store.run("UPDATE productos SET existencias=?,actualizado_en=? WHERE id=?", balance, time, line.producto_id);
          this.catalog.movement(line.producto_id, user.id, line.cantidad, balance, "Cancelaci\xF3n de pedido", orderId);
        }
      }
      this.store.run("UPDATE pedidos SET estado=?,actualizado_en=? WHERE id=?", body.estado, time, orderId);
      return this.order(orderId, user);
    });
  }
};

// src/rate-limit.js
function createRateLimiter({ maxAttempts = 20, windowMs = 6e5, now = Date.now } = {}) {
  const clients = /* @__PURE__ */ new Map();
  return function consumeAttempt(ip) {
    const currentTime = now();
    for (const [key, item2] of clients) {
      if (item2.resetAt <= currentTime) clients.delete(key);
    }
    const item = clients.get(ip) ?? { count: 0, resetAt: currentTime + windowMs };
    clients.set(ip, item);
    if (item.count >= maxAttempts) {
      return Math.max(1, Math.ceil((item.resetAt - currentTime) / 1e3));
    }
    item.count += 1;
    return 0;
  };
}

// src/app.js
var STATIC = new Map([
  ["/", ["../public/index.html", "text/html; charset=utf-8"]],
  ["/documentacion", ["../docs/SERVICIOS.html", "text/html; charset=utf-8"]],
  ["/style.css", ["../public/style.css", "text/css; charset=utf-8"]],
  ...["app", "api", "components", "cart", "catalog", "account", "sales", "admin"].map((name) => [`/${name}.js`, [`../public/${name}.js`, "text/javascript; charset=utf-8"]]),
  ["/api/openapi.json", ["../docs/openapi.json", "application/json; charset=utf-8"]]
]);
function json(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(status === 204 ? void 0 : JSON.stringify(body));
}
function readJson(request) {
  if (request.headers["content-type"]?.split(";")[0].trim().toLowerCase() !== "application/json" || request.headers["content-encoding"]) {
    request.resume();
    throw new ApiError(415, "Env\xEDa application/json sin compresi\xF3n.");
  }
  return new Promise((resolve2, reject) => {
    let size = 0;
    let exceeded = false;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 32768) {
        if (!exceeded) reject(new ApiError(413, "El cuerpo supera 32768 bytes."));
        exceeded = true;
        chunks.length = 0;
      } else if (!exceeded) chunks.push(chunk);
    });
    request.on("end", () => {
      if (exceeded) return;
      try {
        resolve2(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))));
      } catch {
        reject(new ApiError(400, "JSON inv\xE1lido."));
      }
    });
    request.on("error", reject);
    request.on("aborted", () => reject(new ApiError(400, "Solicitud interrumpida.")));
  });
}
async function createApplication({ databasePath: databasePath2 = ":memory:", rateLimit, now = Date.now } = {}) {
  const store = new Store(databasePath2);
  let auth;
  try {
    auth = await createAuthService(store, now);
  } catch (error) {
    store.close();
    throw error;
  }
  const catalog = new CatalogService(store);
  const sales = new SalesService(store, catalog, now);
  const consume = createRateLimiter(rateLimit);
  const routes = [];
  function route(method, path, access, body, handler, query = false) {
    routes.push({
      method,
      path,
      access,
      body,
      handler,
      query,
      pattern: new RegExp(`^${path.replace("{id}", "([^/]+)")}$`)
    });
  }
  route("GET", "/api/salud", "PUBLICO", false, () => ({ body: { exito: true, mensaje: "Ra\xEDzVolt API disponible.", version: "2.0.0" } }));
  route("POST", "/api/registro", "PUBLICO", true, async (c) => ({ status: 201, body: await auth.register(c.body) }));
  route("POST", "/api/login", "PUBLICO", true, async (c) => ({ body: await auth.login(c.body) }));
  route("POST", "/api/logout", "USUARIO", false, (c) => {
    auth.logout(c.user);
    return { status: 204 };
  });
  route("GET", "/api/perfil", "USUARIO", false, (c) => ({ body: auth.getProfile(c.user) }));
  route("PUT", "/api/perfil", "USUARIO", true, (c) => ({ body: auth.updateProfile(c.user, c.body) }));
  route("GET", "/api/categorias", "PUBLICO", false, () => ({ body: { categorias: CATEGORIES } }));
  route("GET", "/api/productos", "PUBLICO", false, (c) => ({ body: catalog.list(c.params) }), true);
  route("GET", "/api/productos/{id}", "PUBLICO", false, (c) => ({ body: productOutput(catalog.find(c.id)) }));
  route("POST", "/api/productos", "ADMIN", true, (c) => {
    const p = catalog.save(c.body, c.user);
    return { status: 201, body: p, location: `/api/productos/${p.id}` };
  });
  route("PUT", "/api/productos/{id}", "ADMIN", true, (c) => ({ body: catalog.save(c.body, c.user, c.id) }));
  route("DELETE", "/api/productos/{id}", "ADMIN", false, (c) => {
    catalog.remove(c.id);
    return { status: 204 };
  });
  route("GET", "/api/inventario", "ADMIN", false, () => ({ body: catalog.summary() }));
  route("GET", "/api/inventario/movimientos", "ADMIN", false, (c) => ({ body: catalog.movements(c.params) }), true);
  route("POST", "/api/productos/{id}/inventario", "ADMIN", true, (c) => ({ body: catalog.adjust(c.id, c.body, c.user) }));
  route("POST", "/api/cotizaciones", "USUARIO", true, (c) => {
    const quote = sales.createQuote(c.body, c.user);
    return { status: 201, body: quote, location: `/api/cotizaciones/${quote.id}` };
  });
  route("GET", "/api/cotizaciones", "USUARIO", false, (c) => ({ body: sales.list("cotizaciones", c.params, c.user) }), true);
  route("GET", "/api/cotizaciones/{id}", "USUARIO", false, (c) => ({ body: sales.quote(c.id, c.user) }));
  route("POST", "/api/pedidos", "USUARIO", true, (c) => {
    const result = sales.createOrder(c.body, c.user);
    return { status: result.created ? 201 : 200, body: result.pedido, location: `/api/pedidos/${result.pedido.id}` };
  });
  route("GET", "/api/pedidos", "USUARIO", false, (c) => ({ body: sales.list("pedidos", c.params, c.user) }), true);
  route("GET", "/api/pedidos/{id}", "USUARIO", false, (c) => ({ body: sales.order(c.id, c.user) }));
  route("PATCH", "/api/pedidos/{id}/estado", "USUARIO", true, (c) => ({ body: sales.changeState(c.id, c.body, c.user) }));
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    try {
      let url;
      try {
        url = new URL(request.url, "http://localhost");
      } catch {
        throw new ApiError(400, "URL inv\xE1lida.");
      }
      if (STATIC.has(url.pathname)) {
        if (request.method !== "GET") {
          response.setHeader("Allow", "GET");
          throw new ApiError(405, "M\xE9todo no permitido.");
        }
        if ([...url.searchParams].length) invalid("consulta", "Este recurso no recibe par\xE1metros.");
        const [path, type] = STATIC.get(url.pathname);
        const data = await readFile(new URL(path, import.meta.url)).catch((error) => {
          if (error.code === "ENOENT") throw new ApiError(404, "Archivo no encontrado.");
          throw error;
        });
        response.writeHead(200, { "Content-Type": type });
        response.end(data);
        return;
      }
      const matching = routes.filter((r) => r.pattern.test(url.pathname));
      if (!matching.length) throw new ApiError(404, "Recurso no encontrado.");
      const selected = matching.find((r) => r.method === request.method);
      if (!selected) {
        response.setHeader("Allow", matching.map((r) => r.method).join(", "));
        throw new ApiError(405, "M\xE9todo no permitido.");
      }
      if (!selected.query && [...url.searchParams].length) invalid("consulta", "Este recurso no recibe par\xE1metros.");
      let user;
      if (selected.access !== "PUBLICO") {
        user = auth.authenticate(request.headers.authorization);
        if (selected.access === "ADMIN" && user.rol !== "ADMIN") throw new ApiError(403, "Se requiere el rol ADMIN.");
      }
      if (["/api/registro", "/api/login"].includes(url.pathname)) {
        const wait = consume(request.socket.remoteAddress);
        if (wait) {
          response.setHeader("Retry-After", String(wait));
          throw new ApiError(429, "Demasiados intentos. Espera antes de reintentar.");
        }
      }
      const match = selected.pattern.exec(url.pathname);
      const context = {
        user,
        params: url.searchParams,
        id: match[1] === void 0 ? void 0 : id(match[1]),
        body: selected.body ? await readJson(request) : void 0
      };
      const result = await selected.handler(context);
      if (result.location) response.setHeader("Location", result.location);
      request.resume();
      json(response, result.status ?? 200, result.body);
    } catch (error) {
      request.resume();
      if (response.destroyed || response.headersSent) return;
      const known = error instanceof ApiError;
      if (error.status === 401) response.setHeader("WWW-Authenticate", "Bearer");
      const output = { exito: false, mensaje: known ? error.message : "Error interno del servicio." };
      if (known && error.details) output.errores = error.details;
      if (!known) console.error("Error interno al procesar una solicitud.");
      json(response, known ? error.status : 500, output);
    }
  });
  server.requestTimeout = 15e3;
  server.headersTimeout = 1e4;
  server.on("close", () => store.close());
  return server;
}

// src/config.js
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
var databasePath = () => process.env.DB_PATH ? resolve(process.env.DB_PATH) : fileURLToPath(new URL("../data/raizvolt.sqlite", import.meta.url));

// src/server.js
var port = Number(process.env.PORT ?? 3e3);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT debe ser un entero entre 1 y 65535.");
  process.exit(1);
}
try {
  const server = await createApplication({ databasePath: databasePath() });
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE" ? "Puerto ocupado: cierra la otra API o cambia PORT." : "No fue posible iniciar el servicio.");
    process.exitCode = 1;
    server.close();
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Ra\xEDzVolt web: http://127.0.0.1:${port}`);
    console.log("Presiona Ctrl+C para detener. La informaci\xF3n se conserva en SQLite.");
  });
  const stop = () => server.close();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
} catch {
  console.error("Revisa Node.js 24.x, la ruta DB_PATH y los permisos de la carpeta data.");
  process.exitCode = 1;
}
//# sourceMappingURL=server.js.map
