import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { Store } from '../src/database.js';
import { createUser } from '../src/auth-service.js';
import { CatalogService } from '../src/catalog-service.js';

// Recorre la aplicación compilada con datos ficticios en una base temporal.
const directory = await mkdtemp(join(tmpdir(), 'raizvolt-web-'));
const databasePath = join(directory, 'e2e.sqlite');
const store = new Store(databasePath);
const password = 'Solar-Prueba2026!';
const admin = await createUser(store, { usuario: 'admin.e2e', contrasena: password }, 'ADMIN');
const catalog = new CatalogService(store);
for (const product of [
  { codigo: 'SOL-550', nombre: 'Panel solar 550 W', categoria: 'PANEL_SOLAR', precio: '680000.50', existencias: 20 },
  { codigo: 'INV-3000', nombre: 'Inversor 3000 W', categoria: 'INVERSOR', precio: '1250000.00', existencias: 10 },
  { codigo: 'BAT-100', nombre: 'Batería 100 Ah', categoria: 'BATERIA', precio: '950000.00', existencias: 8 },
]) catalog.save(product, admin);
store.close();
const port = process.env.TEST_PORT ?? '3487'; const base = `http://127.0.0.1:${port}`;
const processServer = spawn(process.execPath, ['dist/src/server.js'], { env: { ...process.env, PORT: port, DB_PATH: databasePath }, stdio: 'pipe' });
let serverOutput = ''; processServer.stderr.on('data', (chunk) => { serverOutput += chunk; });
const results = []; const errors = []; let browser;
const out = 'docs/evidencias'; await mkdir(`${out}/capturas`, { recursive: true });
const check = (name) => { results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); };
const waitNotice = async (page, text) => { await page.waitForFunction((value) => document.querySelector('#notice').textContent.includes(value), text); };
const screenshot = async (page, name) => { await page.screenshot({ path: `${out}/capturas/${name}.png`, fullPage: true }); };
async function login(page, user) {
  await page.goto(`${base}/#cuenta`); await page.locator('#usuario').fill(user); await page.locator('#contrasena').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(); await page.getByRole('heading', { name: 'Catálogo de productos' }).waitFor();
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/api/salud`)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `No inició el servidor: ${serverOutput}`);
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}), args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'es-CO' });
  const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message)); page.on('dialog', (dialog) => dialog.accept());
  await page.goto(base); await page.getByRole('heading', { name: 'Catálogo de productos' }).waitFor();
  assert.equal(await page.locator('.card').count(), 3); await screenshot(page, '01_catalogo');
  await page.locator('#q').fill('Batería'); await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.card').length === 1); check('E-01 Catálogo y filtro de búsqueda');
  await page.getByRole('link', { name: 'Ingresar', exact: true }).click();
  await page.locator('#usuario').fill('cliente.e2e'); await page.locator('#contrasena').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click(); await waitNotice(page, 'Cuenta creada');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(); await page.getByRole('heading', { name: 'Catálogo de productos' }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Administración', exact: true }).count(), 0); check('E-02 Registro e inicio de sesión de cliente');
  await page.getByRole('link', { name: 'Mi perfil', exact: true }).click();
  for (const [key, value] of Object.entries({ nombre: 'Cliente de demostración', telefono: '3000000000', municipio: 'Bogotá', direccion: 'Calle ficticia 10-20' })) await page.locator(`#${key}`).fill(value);
  await page.getByRole('button', { name: 'Guardar perfil' }).click(); await waitNotice(page, 'Perfil guardado'); await screenshot(page, '02_perfil'); check('E-03 Guardado del perfil y datos de entrega');
  async function quoteAndOrder() {
    await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
    await page.locator('#quantity-1').fill('2'); await page.locator('[data-add="1"]').click();
    await page.getByRole('link', { name: 'Cotizaciones', exact: true }).click();
    await page.getByRole('button', { name: 'Generar cotización', exact: true }).click(); await waitNotice(page, 'creada con precios');
    await screenshot(page, '03_cotizacion');
    await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).first().click();
    await page.getByRole('heading', { name: 'Mis pedidos', exact: true }).waitFor();
  }
  await quoteAndOrder(); assert.equal((await (await fetch(`${base}/api/productos/1`)).json()).existencias, 18);
  await screenshot(page, '04_pedido'); check('E-04 Cotización y pedido descuentan exactamente dos unidades');
  await page.getByRole('link', { name: 'Cotizaciones', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar pedido', exact: true }).click();
  await page.getByRole('heading', { name: 'Mis pedidos', exact: true }).waitFor();
  assert.equal((await (await fetch(`${base}/api/productos/1`)).json()).existencias, 18);
  assert.equal(await page.locator('article.panel').count(), 1); check('E-05 Repetir confirmación no duplica pedido ni descuento');
  await page.getByRole('button', { name: 'Cancelar pedido' }).click(); await waitNotice(page, 'Estado del pedido actualizado');
  assert.equal((await (await fetch(`${base}/api/productos/1`)).json()).existencias, 20); check('E-06 Cancelación devuelve inventario');
  await page.evaluate(() => { location.hash = 'admin'; }); await page.getByText('Se requiere el rol ADMIN.', { exact: true }).first().waitFor(); check('E-07 Ruta de administración rechazada para cliente');
  await quoteAndOrder();
  const adminContext = await browser.newContext({ viewport: { width: 1366, height: 1000 }, locale: 'es-CO' });
  const adminPage = await adminContext.newPage(); adminPage.on('pageerror', (error) => errors.push(error.message)); adminPage.on('dialog', (dialog) => dialog.accept());
  await login(adminPage, 'admin.e2e'); await adminPage.getByRole('link', { name: 'Administración', exact: true }).click();
  await adminPage.getByRole('button', { name: 'Nuevo producto', exact: true }).click();
  for (const [key, value] of Object.entries({ codigo: 'KIT-E2E', nombre: 'Kit solar de prueba', precio: '2000000.00', existencias: '5' })) await adminPage.locator(`#${key}`).fill(value);
  await adminPage.locator('#categoria').selectOption('KIT_SOLAR'); await adminPage.getByRole('button', { name: 'Guardar producto' }).click(); await waitNotice(adminPage, 'Producto guardado');
  await adminPage.locator('[data-edit="4"]').click(); await adminPage.locator('#nombre').fill('Kit solar actualizado');
  await adminPage.getByRole('button', { name: 'Guardar producto' }).click(); await adminPage.getByText('Kit solar actualizado', { exact: false }).first().waitFor();
  await adminPage.locator('[data-stock="4"]').click(); await adminPage.locator('#variacion').fill('3'); await adminPage.locator('#motivo').fill('Ingreso de prueba E2E');
  await adminPage.getByRole('button', { name: 'Guardar ajuste' }).click(); await waitNotice(adminPage, 'Inventario ajustado');
  assert.equal((await (await fetch(`${base}/api/productos/4`)).json()).existencias, 8);
  await screenshot(adminPage, '05_administracion'); check('E-08 Administrador crea, edita y ajusta inventario');
  await adminPage.locator('[data-delete="4"]').click(); await waitNotice(adminPage, 'Producto retirado');
  assert.equal((await fetch(`${base}/api/productos/4`)).status, 404); check('E-09 Baja lógica retira el producto del catálogo');
  await adminPage.getByRole('link', { name: 'Pedidos', exact: true }).click();
  await adminPage.getByRole('button', { name: 'Marcar enviado', exact: true }).click(); await adminPage.getByRole('button', { name: 'Marcar entregado', exact: true }).click();
  await adminPage.getByText('ENTREGADO', { exact: true }).waitFor(); await screenshot(adminPage, '06_pedido_entregado'); check('E-10 Despacho y entrega con rol administrador');
  const mobile = await context.newPage(); await mobile.setViewportSize({ width: 390, height: 844 }); await mobile.goto(base);
  await mobile.getByRole('heading', { name: 'Catálogo de productos' }).waitFor();
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); await screenshot(mobile, '07_movil'); check('E-11 Catálogo móvil sin desbordamiento horizontal');
  await page.reload(); await page.getByRole('heading', { name: 'Bienvenido', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0); check('E-12 Recarga elimina sesión de memoria; no hay tokens en almacenamiento web');
  assert.deepEqual(errors, []); check('E-13 Sin errores JavaScript en los recorridos');
} catch (error) {
  results.push({ name: 'Recorrido interrumpido', status: 'FAIL', error: error.stack }); console.error(error); process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  processServer.kill('SIGTERM'); await new Promise((resolve) => processServer.once('exit', resolve));
  await rm(directory, { recursive: true, force: true });
  await writeFile(`${out}/E2E.json`, JSON.stringify({ executedAt: new Date().toISOString(), node: process.version, target: 'dist/ - aplicación compilada', results, browserErrors: errors }, null, 2));
}
