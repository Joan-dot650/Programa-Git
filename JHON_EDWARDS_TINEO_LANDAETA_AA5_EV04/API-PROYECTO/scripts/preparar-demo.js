import { randomBytes } from 'node:crypto';
import { Store } from '../src/database.js';
import { databasePath } from '../src/config.js';
import { createUser } from '../src/auth-service.js';
import { CatalogService } from '../src/catalog-service.js';

// Genera datos ficticios; no elimina ni reemplaza cuentas, productos o pedidos existentes.
const store = new Store(databasePath());
try {
  const username = `admin.demo.${randomBytes(4).toString('hex')}`;
  const password = `Solar-${randomBytes(12).toString('base64url')}!`;
  const admin = await createUser(store, { usuario: username, contrasena: password }, 'ADMIN');
  const catalog = new CatalogService(store);
  const examples = [
    { codigo: 'SOL-550', nombre: 'Panel solar 550 W', categoria: 'PANEL_SOLAR', precio: '680000.50', existencias: 20 },
    { codigo: 'INV-3000', nombre: 'Inversor 3000 W', categoria: 'INVERSOR', precio: '1250000.00', existencias: 10 },
    { codigo: 'BAT-100', nombre: 'Batería 100 Ah', categoria: 'BATERIA', precio: '950000.00', existencias: 8 },
  ];
  for (const product of examples) {
    if (!store.one('SELECT id FROM productos WHERE codigo=?', product.codigo)) catalog.save(product, admin);
  }
  console.log('Datos ficticios listos. Guarda estas credenciales para iniciar como ADMIN:');
  console.log(`Usuario: ${username}\nContraseña: ${password}`);
  console.log('En Postman asigna admin_usuario y admin_contrasena a estos valores.');
  console.log('Los precios son de prueba; no constituyen una cotización comercial.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { store.close(); }
