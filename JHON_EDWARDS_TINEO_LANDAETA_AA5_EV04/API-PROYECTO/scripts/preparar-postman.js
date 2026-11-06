import { randomBytes } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Store } from '../src/database.js';
import { createUser } from '../src/auth-service.js';
import { databasePath } from '../src/config.js';

// Solo crea un administrador ficticio en la base local. No borra datos existentes.
const destination = resolve(process.argv[2] ?? '../postman/entorno.local.json');
const store = new Store(databasePath());
try {
  const usuario = `admin.ev04.${randomBytes(4).toString('hex')}`;
  const contrasena = `Prueba-${randomBytes(16).toString('base64url')}!`;
  await createUser(store, { usuario, contrasena }, 'ADMIN');
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify({
    name: 'RaizVolt LOCAL - AA5 EV04',
    values: [
      { key: 'base_url', value: `http://127.0.0.1:${process.env.PORT ?? 3000}`, enabled: true },
      { key: 'admin_usuario', value: usuario, enabled: true },
      { key: 'admin_contrasena', value: contrasena, enabled: true, type: 'secret' },
    ],
    _postman_variable_scope: 'environment',
  }, null, 2) + '\n', { mode: 0o600 });
  console.log('Administrador ficticio y entorno de Postman preparados.');
  console.log(`Importa en Postman: ${destination}`);
  console.log('No publiques el entorno local ni la base de datos.');
} finally { store.close(); }
