// scripts/preparar-demo.js
import { randomBytes as randomBytes2 } from "node:crypto";

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

// src/config.js
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
var databasePath = () => process.env.DB_PATH ? resolve(process.env.DB_PATH) : fileURLToPath(new URL("../data/raizvolt.sqlite", import.meta.url));

// src/errors.js
var ApiError = class extends Error {
  constructor(status, message, details = void 0) {
    super(message);
    this.status = status;
    this.details = details;
  }
};

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
async function createUser(store2, body, role = "CLIENTE") {
  const { username, password } = credentials(body);
  if (store2.one("SELECT id FROM usuarios WHERE usuario=?", username)) throw new ApiError(409, "El usuario ya est\xE1 registrado.");
  const encoded = await hashPassword(password);
  try {
    const result = store2.run(
      "INSERT INTO usuarios (usuario,password_hash,rol,creado_en) VALUES (?,?,?,?)",
      username,
      encoded,
      role,
      (/* @__PURE__ */ new Date()).toISOString()
    );
    return publicUser(store2.one("SELECT * FROM usuarios WHERE id=?", Number(result.lastInsertRowid)));
  } catch (error) {
    if (error.errcode === 2067) throw new ApiError(409, "El usuario ya est\xE1 registrado.");
    throw error;
  }
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
  constructor(store2) {
    this.store = store2;
  }
  find(id) {
    const row = this.store.one("SELECT * FROM productos WHERE id=? AND activo=1", id);
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

// scripts/preparar-demo.js
var store = new Store(databasePath());
try {
  const username = `admin.demo.${randomBytes2(4).toString("hex")}`;
  const password = `Solar-${randomBytes2(12).toString("base64url")}!`;
  const admin = await createUser(store, { usuario: username, contrasena: password }, "ADMIN");
  const catalog = new CatalogService(store);
  const examples = [
    { codigo: "SOL-550", nombre: "Panel solar 550 W", categoria: "PANEL_SOLAR", precio: "680000.50", existencias: 20 },
    { codigo: "INV-3000", nombre: "Inversor 3000 W", categoria: "INVERSOR", precio: "1250000.00", existencias: 10 },
    { codigo: "BAT-100", nombre: "Bater\xEDa 100 Ah", categoria: "BATERIA", precio: "950000.00", existencias: 8 }
  ];
  for (const product2 of examples) {
    if (!store.one("SELECT id FROM productos WHERE codigo=?", product2.codigo)) catalog.save(product2, admin);
  }
  console.log("Datos ficticios listos. Guarda estas credenciales para iniciar como ADMIN:");
  console.log(`Usuario: ${username}
Contrase\xF1a: ${password}`);
  console.log("Abre http://127.0.0.1:3000, pulsa Ingresar y usa estos valores.");
  console.log("Los precios son de prueba; no constituyen una cotizaci\xF3n comercial.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  store.close();
}
//# sourceMappingURL=preparar-demo.js.map
