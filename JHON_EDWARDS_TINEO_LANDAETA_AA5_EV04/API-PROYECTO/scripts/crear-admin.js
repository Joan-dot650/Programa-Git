import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { Store } from '../src/database.js';
import { databasePath } from '../src/config.js';
import { createUser } from '../src/auth-service.js';

// Administración local: no existe endpoint para concederse permisos elevados.
let muted = false;
const output = new Writable({ write(chunk, encoding, callback) {
  if (!muted) process.stdout.write(chunk, encoding);
  callback();
} });
const terminal = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
let store;
try {
  const usuario = await terminal.question('Nombre del nuevo administrador: ');
  process.stdout.write('Contraseña (8-128 caracteres, oculta): ');
  muted = true;
  const contrasena = await terminal.question('');
  muted = false; process.stdout.write('\n');
  store = new Store(databasePath());
  await createUser(store, { usuario, contrasena }, 'ADMIN');
  console.log('Administrador creado. Inicia sesión por POST /api/login.');
} catch (error) { muted = false; console.error(error.message); process.exitCode = 1; }
finally { terminal.close(); store?.close(); }
