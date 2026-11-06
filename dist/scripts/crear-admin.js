// scripts/crear-admin.js
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

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
function invalid(field, message) {
  throw new ApiError(400, "Datos de entrada inv\xE1lidos.", { [field]: message });
}
function object(body, keys) {
  if (!body || typeof body !== "object" || Array.isArray(body)) invalid("cuerpo", "Se requiere un objeto JSON.");
  if (Object.keys(body).some((key) => !keys.includes(key))) invalid("campos", `Solo se admiten: ${keys.join(", ")}.`);
  return body;
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

// scripts/crear-admin.js
var muted = false;
var output = new Writable({ write(chunk, encoding, callback) {
  if (!muted) process.stdout.write(chunk, encoding);
  callback();
} });
var terminal = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
var store;
try {
  const usuario = await terminal.question("Nombre del nuevo administrador: ");
  process.stdout.write("Contrase\xF1a (8-128 caracteres, oculta): ");
  muted = true;
  const contrasena = await terminal.question("");
  muted = false;
  process.stdout.write("\n");
  store = new Store(databasePath());
  await createUser(store, { usuario, contrasena }, "ADMIN");
  console.log("Administrador creado. Inicia sesi\xF3n por POST /api/login.");
} catch (error) {
  muted = false;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  terminal.close();
  store?.close();
}
//# sourceMappingURL=crear-admin.js.map
