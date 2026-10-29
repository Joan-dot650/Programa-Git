import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from '../raizvolt-react/node_modules/jsdom/lib/api.js';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const puerto = 18081;
const base = `http://127.0.0.1:${puerto}`;
const api = `${base}/raizvolt/api`;
const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/** Espera una condición observable, con límite; no depende de pausas arbitrarias. */
async function esperar(condicion, descripcion, limite = 10000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limite) {
    if (await condicion()) return;
    await pausa(25);
  }
  throw new Error(`No se cumplió: ${descripcion}`);
}

test('integración del React compilado, API real, CSRF, archivo H2 y reinicio', { timeout: 120000 }, async (t) => {
  const carpeta = mkdtempSync(resolve(tmpdir(), 'raizvolt-aa4-'));
  let servidor;
  let log = '';
  let dom;
  async function iniciar() {
    servidor = spawn('java', ['-jar', resolve(raiz, 'ejecutable/raizvolt-react.jar'), `--server.port=${puerto}`],
      { cwd: carpeta, stdio: ['ignore', 'pipe', 'pipe'] });
    servidor.stdout.on('data', (dato) => { log += dato; });
    servidor.stderr.on('data', (dato) => { log += dato; });
    await esperar(async () => {
      if (servidor.exitCode !== null) throw new Error(log);
      try { return (await fetch(`${api}/productos`)).ok; } catch { return false; }
    }, 'arranque del JAR', 30000);
  }
  async function detener() {
    if (!servidor || servidor.exitCode !== null) return;
    const salida = new Promise((resolver) => servidor.once('exit', resolver));
    servidor.kill('SIGTERM');
    await salida;
  }

  try {
    await iniciar();
    const html = await (await fetch(`${base}/raizvolt/react/index.html`)).text();
    const scriptPath = html.match(/src="([^"]+\.js)"/)[1];
    const script = await (await fetch(`${base}${scriptPath}`)).text();
    assert.ok(script.includes('Catálogo de productos'));
    const errores = [];
    const consola = new VirtualConsole();
    consola.on('jsdomError', (error) => errores.push(error.message));
    dom = new JSDOM(html, { url: `${base}/raizvolt/react/index.html`, runScripts: 'outside-only',
      pretendToBeVisual: true, virtualConsole: consola });
    const { window: ventana } = dom;
    const documento = ventana.document;
    let cookie = '';
    let fallarConsulta = false;
    // JSDOM no implementa fetch; se adapta al servidor real y a su cookie de sesión.
    ventana.fetch = async (ruta, opciones = {}) => {
      if (fallarConsulta && String(ruta).includes('/productos?')) throw new TypeError('Fallo de red de prueba');
      const respuesta = await fetch(new URL(ruta, base), {
        ...opciones, headers: { ...opciones.headers, ...(cookie ? { Cookie: cookie } : {}) },
      });
      const nuevaCookie = respuesta.headers.get('set-cookie');
      if (nuevaCookie) cookie = nuevaCookie.split(';')[0];
      return respuesta;
    };
    ventana.AbortController = AbortController;
    ventana.eval(script);
    const texto = () => documento.body.textContent;
    const boton = (nombre) => [...documento.querySelectorAll('button')].find((b) =>
      b.textContent.trim().replace(/^[＋▦]\s*/, '') === nombre);
    async function pulsar(nombre) {
      assert.ok(boton(nombre), `Existe el botón ${nombre}`);
      boton(nombre).click();
      await pausa(30);
    }
    async function llenar(id, valor) {
      const elemento = documento.getElementById(id);
      assert.ok(elemento, `Existe ${id}`);
      const prototipo = elemento.tagName === 'SELECT' ? ventana.HTMLSelectElement.prototype : ventana.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototipo, 'value').set.call(elemento, valor);
      elemento.dispatchEvent(new ventana.Event(elemento.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
      await pausa(10);
    }
    async function formulario(codigo, nombre, categoria, precio, existencias) {
      for (const [id, valor] of Object.entries({ codigo, nombre, categoria, precio, existencias })) await llenar(id, valor);
    }
    await t.test('JAR sirve los recursos y el catálogo inicia vacío', async () => {
      await esperar(() => texto().includes('Tu catálogo empieza aquí'), 'catálogo vacío');
      const css = html.match(/href="([^"]+\.css)"/)[1];
      assert.equal((await fetch(`${base}${css}`)).status, 200);
    });
    await t.test('obligatorios muestran errores y enfocan código', async () => {
      await pulsar('Nuevo producto');
      await pulsar('Guardar producto');
      assert.equal(documento.querySelectorAll('[aria-invalid="true"]').length, 5);
      await esperar(() => documento.activeElement.id === 'codigo', 'foco en primer error');
    });
    await t.test('registro real con coma decimal y normalización', async () => {
      await formulario(' sol-550 ', 'Panel solar 550 W', 'PANEL_SOLAR', '680000,50', '12');
      await pulsar('Guardar producto');
      await esperar(() => texto().includes('Producto registrado correctamente.') && documento.querySelector('table'), 'alta y tabla');
      assert.ok(texto().includes('SOL-550'));
      assert.ok(texto().includes('8.160.006,00'));
    });
    await t.test('código duplicado conserva formulario y enfoca el error del servidor', async () => {
      await pulsar('Nuevo producto');
      await formulario('SOL-550', 'Batería pequeña', 'BATERIA', '100', '3');
      await pulsar('Guardar producto');
      await esperar(() => texto().includes('Este código ya está registrado'), 'error 409');
      assert.equal(documento.getElementById('nombre').value, 'Batería pequeña');
      await esperar(() => documento.activeElement.id === 'codigo', 'foco en duplicado');
      await llenar('codigo', 'BAT-1');
      await pulsar('Guardar producto');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 2, 'segundo registro');
      assert.ok(texto().includes('Stock bajo'));
    });
    await t.test('búsqueda por código, resumen filtrado y estado sin resultados', async () => {
      await llenar('busqueda', 'sol-550');
      await pulsar('Buscar');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 1, 'búsqueda');
      assert.ok(texto().includes('8.160.006,00'));
      await llenar('busqueda', 'sin-coincidencias');
      await pulsar('Buscar');
      await esperar(() => texto().includes('No encontramos coincidencias'), 'sin coincidencias');
      await pulsar('Ver todos los productos');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 2, 'limpieza del filtro');
    });
    await t.test('editar precarga y conserva el ID', async () => {
      documento.querySelector('[aria-label="Editar SOL-550"]').click();
      await esperar(() => documento.getElementById('precio')?.value === '680000.50', 'precarga');
      const hash = ventana.location.hash;
      await llenar('precio', '750000.25');
      await llenar('existencias', '2');
      await pulsar('Guardar cambios');
      await esperar(() => texto().includes('Producto actualizado correctamente.') && documento.querySelector('table'), 'edición');
      const datos = await (await fetch(`${api}/productos?q=SOL-550`)).json();
      assert.ok(hash.includes(`/${datos.productos[0].id}/editar`));
      assert.equal(datos.productos[0].existencias, 2);
      assert.equal(datos.valorInventario, '1500000.50');
    });
    await t.test('cancelar eliminación conserva; confirmar elimina solo el elegido', async () => {
      documento.querySelector('[aria-label="Eliminar BAT-1"]').click();
      await esperar(() => boton('Confirmar eliminación'), 'confirmación');
      await pulsar('Cancelar');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 2, 'cancelación');
      documento.querySelector('[aria-label="Eliminar BAT-1"]').click();
      await esperar(() => boton('Confirmar eliminación'), 'segunda confirmación');
      await pulsar('Confirmar eliminación');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 1, 'eliminación');
      assert.ok(!texto().includes('BAT-1'));
    });
    await t.test('error de consulta recuperable con Reintentar', async () => {
      fallarConsulta = true;
      await pulsar('Buscar');
      await esperar(() => texto().includes('No pudimos cargar los productos'), 'error de conexión');
      fallarConsulta = false;
      await pulsar('Reintentar');
      await esperar(() => documento.querySelectorAll('tbody tr').length === 1, 'recuperación');
    });
    await t.test('si falla consulta tras guardar, informa que ya quedó guardado', async () => {
      documento.querySelector('[aria-label="Editar SOL-550"]').click();
      await esperar(() => documento.getElementById('precio'), 'edición');
      await llenar('existencias', '5');
      fallarConsulta = true;
      await pulsar('Guardar cambios');
      await esperar(() => texto().includes('La operación ya se guardó'), 'escritura confirmada');
      fallarConsulta = false;
      await pulsar('Reintentar');
      await esperar(() => documento.querySelector('table'), 'recarga de cambio guardado');
    });
    await t.test('ruta desconocida vuelve al catálogo sin perder datos', async () => {
      ventana.location.hash = '/ruta-inexistente';
      await esperar(() => texto().includes('Página no encontrada'), 'ruta inválida');
      await pulsar('Volver al catálogo');
      await esperar(() => documento.querySelector('table'), 'retorno al catálogo');
    });
    await t.test('reiniciar el JAR conserva el producto en H2', async () => {
      await detener();
      await iniciar();
      const datos = await (await fetch(`${api}/productos`)).json();
      assert.equal(datos.productos.length, 1);
      assert.equal(datos.productos[0].codigo, 'SOL-550');
      assert.equal(datos.productos[0].existencias, 5);
    });
    assert.deepEqual(errores, []);
  } finally {
    dom?.window.close();
    await detener();
    rmSync(carpeta, { recursive: true, force: true });
  }
});
