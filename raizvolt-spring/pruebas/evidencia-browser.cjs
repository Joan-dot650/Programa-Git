/* Recorrido reproducible de AA3-EV02. Usa datos y base H2 temporales. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert/strict');
const { spawn } = require('child_process');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.EVIDENCIA_SALIDA || path.join(root, 'evidencia-generada'));
const jar = path.resolve(process.env.RAIZVOLT_JAR || path.join(root, 'target/raizvolt-spring.jar'));
const base = 'http://127.0.0.1:8093/raizvolt';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'raizvolt-ev02-'));
const recording = process.env.GRABAR === '1';
const pause = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(path.join(out, 'capturas'), { recursive: true });
fs.mkdirSync(path.join(out, 'video-original'), { recursive: true });
const results = [], chapters = [];
let server, browser, context, page, video, started = 0;
const log = fs.openSync(path.join(out, 'servidor.log'), 'w');

async function startServer() {
  server = spawn('java', ['-jar', jar, '--server.port=8093',
    '--spring.datasource.url=jdbc:h2:file:' + path.join(temp, 'catalogo') + ';DB_CLOSE_ON_EXIT=FALSE'],
    { cwd: temp, stdio: ['ignore', log, log] });
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(base + '/productos')).ok) return; } catch (_) {}
    await pause(250);
  }
  throw new Error('La aplicación no inició. Revisar servidor.log.');
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  await new Promise(resolve => { server.once('exit', resolve); server.kill('SIGTERM'); });
}

async function chapter(title, subtitle, hold = 4) {
  chapters.push({ start: (Date.now() - started) / 1000, title, subtitle });
  if (recording) await pause(hold * 1000);
}

async function shot(name, fullPage = false) {
  await page.screenshot({ path: path.join(out, 'capturas', name + '.png'), fullPage });
}

function ok(id, requisito, detalle, esperado, obtenido) {
  results.push({ id, requisito, detalle, esperado, obtenido, resultado: 'APROBADO' });
  console.log(id + ' APROBADO ' + detalle);
}

async function fill(changes = {}) {
  const values = { codigo: 'SOL-550', nombre: 'Panel solar 550 W', categoria: 'PANEL_SOLAR',
    precio: '680000,50', existencias: '12', ...changes };
  for (const [field, value] of Object.entries(values)) {
    if (field === 'categoria') await page.locator('#categoria').selectOption(value);
    else await page.locator('#' + field).fill(value);
  }
}

async function submit(expected) {
  const response = page.waitForResponse(r => r.request().method() === 'POST');
  await page.locator('button[type=submit]').click();
  const r = await response;
  assert.equal(r.status(), expected);
  await page.waitForLoadState('networkidle');
  return r;
}

async function nativeCase(id, field, value, flag, text, image) {
  await page.goto(base + '/productos/nuevo');
  await fill({ [field]: value });
  const validity = await page.locator('#' + field).evaluate((el, name) => ({
    invalid: !el.checkValidity(), flag: el.validity[name], message: el.validationMessage
  }), flag);
  assert.ok(validity.invalid && validity.flag, JSON.stringify(validity));
  await page.locator('button[type=submit]').click();
  assert.ok(page.url().endsWith('/nuevo'));
  await chapter(text, 'El navegador bloquea el envío y conserva los datos.', 3);
  if (image) await shot(image);
  ok(id, 'Validación HTML', text, flag + ' y envío bloqueado', validity.message);
}

async function serverCase(id, changes, text, image) {
  await page.goto(base + '/productos/nuevo');
  await fill();
  await page.locator('form.formulario').evaluate((form, values) => {
    form.noValidate = true;
    for (const [key, value] of Object.entries(values)) {
      const el = form.elements.namedItem(key);
      if (el.tagName === 'SELECT') el.add(new Option(value, value));
      el.value = value;
    }
  }, changes);
  await submit(400);
  const message = await page.locator('[role=alert]').innerText();
  await chapter(text, 'Prueba directa del servidor con controles HTML omitidos: HTTP 400.', 4);
  if (image) await shot(image);
  ok(id, 'Validación servidor', text, 'HTTP 400 sin guardar', message);
}

(async () => {
  try {
    await startServer();
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
      headless: true, args: ['--no-sandbox', '--no-zygote', '--single-process', '--disable-gpu'] });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-CO',
      ...(recording ? { recordVideo: { dir: path.join(out, 'video-original'), size: { width: 1280, height: 800 } } } : {}) });
    page = await context.newPage();
    video = page.video();
    started = Date.now();
    await page.goto(base + '/productos');
    assert.ok(await page.getByText('Tu catálogo empieza aquí').isVisible());
    await chapter('RaízVolt | Pruebas del módulo de productos',
      'GA7-220501096-AA3-EV02 | Recorrido real con datos de prueba', 7);
    await shot('01_catalogo_vacio');
    ok('UI01', 'HU-PR02', 'Catálogo vacío', 'Mensaje sin productos', 'Mensaje visible');

    await page.getByRole('link', { name: 'Nuevo producto', exact: true }).click();
    await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('form.formulario :invalid').count(), 5);
    await chapter('Campos obligatorios', 'Los cinco campos requieren información antes de guardar.', 5);
    await shot('02_obligatorios');
    ok('UI02', 'HU-PR01', 'Cinco campos vacíos', 'Envío bloqueado', '5 campos inválidos');

    await fill({ codigo: 'sol-550' });
    await chapter('HU-PR01 | Registrar producto', 'Código sol-550, panel solar, precio 680000,50 COP y 12 unidades.', 7);
    await shot('03_registro_formulario');
    await submit(303);
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.equal(await page.locator('.codigo-producto').innerText(), 'SOL-550');
    assert.ok((await page.locator('.precio').innerText()).includes('680.000,50'));
    await chapter('Registro exitoso', 'El código queda en mayúsculas y el precio conserva sus dos decimales.', 5);
    await shot('04_registro_exitoso');
    ok('UI03', 'HU-PR01', 'Registro y normalización', '303, SOL-550 y precio 680000.50', 'Fila creada con valores correctos');
    await page.reload();
    assert.equal(await page.locator('tbody tr').count(), 1);
    ok('UI04', 'HU-PR01', 'Recargar después de guardar', 'Una sola fila', '1 fila');

    await page.goto(base + '/productos/nuevo');
    await fill({ nombre: 'Batería duplicada', categoria: 'BATERIA' });
    await submit(409);
    assert.ok((await page.locator('[role=alert]').innerText()).includes('Ya existe'));
    assert.equal(await page.locator('#nombre').inputValue(), 'Batería duplicada');
    await chapter('Código duplicado', 'HTTP 409. Se conserva el formulario y se solicita otro código.', 7);
    await shot('05_codigo_duplicado');
    ok('UI05', 'HU-PR01', 'Código duplicado', '409 sin nueva fila y datos conservados', '409, mensaje y nombre conservado');

    await nativeCase('UI06', 'codigo', 'BAD_CODE', 'patternMismatch', 'Código con carácter no permitido', '06_codigo_invalido_html');
    await nativeCase('UI07', 'nombre', 'ab', 'tooShort', 'Nombre de dos caracteres', '07_nombre_corto_html');
    await page.locator('#nombre').fill('N'.repeat(121));
    assert.equal((await page.locator('#nombre').inputValue()).length, 120);
    ok('UI08', 'HU-PR01', 'Máximo del nombre en interfaz', 'Limitar a 120 caracteres', '120 caracteres');
    await page.locator('#codigo').fill('A'.repeat(31));
    assert.equal((await page.locator('#codigo').inputValue()).length, 30);
    ok('UI09', 'HU-PR01', 'Máximo del código en interfaz', 'Limitar a 30 caracteres', '30 caracteres');
    await chapter('Longitudes de los textos', 'La interfaz limita el código a 30 caracteres y el nombre a 120.', 5);
    await shot('08_longitudes_html');
    await nativeCase('UI10', 'precio', 'texto', 'patternMismatch', 'Precio con texto', '09_precio_texto_html');
    await nativeCase('UI11', 'precio', '10.123', 'patternMismatch', 'Precio con tres decimales');
    await nativeCase('UI12', 'existencias', '-1', 'rangeUnderflow', 'Existencias negativas', '10_stock_negativo_html');
    await nativeCase('UI13', 'existencias', '1.5', 'stepMismatch', 'Existencias con decimales');
    await nativeCase('UI14', 'existencias', '1000001', 'rangeOverflow', 'Existencias superiores al máximo');

    await serverCase('UI15', { codigo: 'SOL@1' }, 'Servidor | Caracteres especiales en el código', '11_codigo_servidor');
    await serverCase('UI16', { nombre: 'N'.repeat(121), codigo: 'VAL-001' }, 'Servidor | Nombre de 121 caracteres', '12_nombre_largo_servidor');
    await serverCase('UI17', { precio: '0', codigo: 'VAL-001' }, 'Servidor | El precio debe ser mayor que cero', '13_precio_cero_servidor');
    await serverCase('UI18', { categoria: 'OTRA', codigo: 'VAL-001' }, 'Servidor | Categoría fuera del catálogo', '14_categoria_servidor');
    await serverCase('UI19', { existencias: '1000001', codigo: 'VAL-001' }, 'Servidor | Máximo de un millón de unidades', '15_stock_servidor');
    await page.goto(base + '/productos');
    assert.equal(await page.locator('tbody tr').count(), 1);
    ok('UI20', 'HU-PR01', 'Integridad tras entradas inválidas', 'Conservar una sola referencia', '1 referencia sin cambios');

    await page.goto(base + '/productos/nuevo');
    await fill({ codigo: 'INV-3000', nombre: 'Inversor híbrido 3000 W', categoria: 'INVERSOR', precio: '1500000', existencias: '3' });
    await submit(303);
    assert.deepEqual(await page.locator('.metrica strong').allTextContents(), ['2', '15', '1']);
    await chapter('Indicadores del catálogo', 'Dos referencias, 15 unidades y una referencia con stock bajo.', 5);
    await shot('16_catalogo_indicadores');
    ok('UI21', 'HU-PR02', 'Indicadores y stock menor que cinco', '2 referencias, 15 unidades, 1 stock bajo', '2 / 15 / 1');

    for (const [id, query, expectedCode, title, image] of [
      ['UI22', 'panel', 'SOL-550', 'Búsqueda parcial por nombre', '17_busqueda_nombre'],
      ['UI23', 'inv-3000', 'INV-3000', 'Búsqueda por código sin distinguir mayúsculas', '18_busqueda_codigo']]) {
      await page.locator('#q').fill(query);
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      assert.deepEqual(await page.locator('.codigo-producto').allTextContents(), [expectedCode]);
      await chapter('HU-PR02 | ' + title, 'La lista y sus indicadores corresponden a la búsqueda.', 5);
      await shot(image);
      ok(id, 'HU-PR02', title, 'Solo ' + expectedCode, expectedCode);
    }
    for (const [id, query] of [['UI24', 'SIN-RESULTADO'], ['UI25', '%']]) {
      await page.locator('#q').fill(query);
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      assert.ok(await page.getByText('No encontramos coincidencias').isVisible());
      ok(id, 'HU-PR02', 'Búsqueda literal ' + query, 'Sin coincidencias', 'Estado sin coincidencias');
    }
    await chapter('Búsqueda sin coincidencias', 'El símbolo % se busca como texto; no devuelve todos los registros.', 5);
    await shot('19_sin_coincidencias');
    await page.getByRole('link', { name: 'Ver todo el catálogo' }).click();

    await page.getByRole('link', { name: 'Editar SOL-550', exact: true }).click();
    const editUrl = page.url();
    assert.equal(await page.locator('#nombre').inputValue(), 'Panel solar 550 W');
    await fill({ nombre: 'Panel solar 550 W actualizado', precio: '750000.25', existencias: '2' });
    await chapter('HU-PR03 | Editar producto', 'El formulario carga los datos del mismo ID. Cambiamos precio y existencias.', 7);
    await shot('20_edicion_formulario');
    await submit(303);
    const row = page.locator('tbody tr').filter({ hasText: 'SOL-550' });
    assert.ok((await row.innerText()).includes('750.000,25'));
    assert.equal(await row.locator('.stock').innerText(), '2');
    assert.equal(await page.locator('tbody tr').count(), 2);
    await shot('21_edicion_exitosa');
    ok('UI26', 'HU-PR03', 'Precarga y edición de precio y stock', 'Mismo ID, 2 filas y nuevos valores', 'Precio 750000.25 y 2 unidades');
    await page.goto(editUrl);
    await page.locator('#precio').fill('0');
    await submit(400);
    await chapter('Edición inválida', 'El precio cero se rechaza; el registro conserva el precio anterior.', 5);
    await shot('22_edicion_invalida');
    await page.goto(editUrl);
    assert.equal(await page.locator('#precio').inputValue(), '750000.25');
    ok('UI27', 'HU-PR03', 'Edición inválida no altera el registro', '400 y precio original', '400; conserva 750000.25');

    await page.goto(base + '/productos');
    await page.getByRole('link', { name: 'Eliminar INV-3000', exact: true }).click();
    await chapter('HU-PR04 | Confirmar o cancelar', 'Abrir la confirmación no elimina. Primero comprobamos Cancelar.', 7);
    await shot('23_confirmacion_eliminar');
    await page.getByRole('link', { name: 'Cancelar', exact: true }).click();
    assert.equal(await page.locator('tbody tr').count(), 2);
    await shot('24_cancelacion_conserva');
    ok('UI28', 'HU-PR04', 'Cancelar eliminación', 'Dos filas conservadas', '2 filas');
    await page.getByRole('link', { name: 'Eliminar INV-3000', exact: true }).click();
    await submit(303);
    assert.deepEqual(await page.locator('.codigo-producto').allTextContents(), ['SOL-550']);
    await chapter('Eliminación confirmada', 'Se elimina únicamente INV-3000. SOL-550 continúa en el catálogo.', 6);
    await shot('25_eliminacion_exitosa');
    ok('UI29', 'HU-PR04', 'Eliminar una referencia', '303, solo SOL-550', '303, solo SOL-550');

    await chapter('Persistencia después de reiniciar', 'Se detiene y se inicia el servidor usando el mismo archivo H2.', 4);
    await stopServer();
    await startServer();
    await page.reload();
    assert.deepEqual(await page.locator('.codigo-producto').allTextContents(), ['SOL-550']);
    assert.equal(await page.locator('.stock').innerText(), '2');
    await chapter('Los cambios permanecen guardados', 'La edición y la eliminación se conservan después del reinicio.', 5);
    await shot('26_persistencia');
    ok('UI30', 'Persistencia', 'Reinicio real del proceso Java', 'Mismo registro editado; eliminado ausente', 'SOL-550, 2 unidades; INV-3000 ausente');

    const missing = await page.goto(base + '/productos/999999999/editar');
    assert.equal(missing.status(), 404);
    await chapter('Identificador inexistente', 'HTTP 404: el sistema informa que el recurso no está disponible.', 4);
    await shot('27_no_encontrado');
    ok('UI31', 'Rutas', 'Producto inexistente', 'HTTP 404', 'HTTP 404');
    await page.goto(base + '/productos/nuevo');
    await fill({ codigo: 'CSRF-001' });
    await page.locator('input[name=_csrf]').evaluate(el => el.remove());
    await submit(403);
    await chapter('Protección del formulario', 'Prueba controlada sin token CSRF: HTTP 403 y ninguna escritura.', 4);
    await shot('28_csrf');
    ok('UI32', 'Seguridad', 'Envío sin token CSRF', 'HTTP 403', 'HTTP 403');

    await page.goto(base + '/productos/nuevo');
    await fill({ codigo: 'TXT-001', nombre: '<b>Batería Ñandú & soporte</b>', categoria: 'ACCESORIO', precio: '99.50', existencias: '0' });
    await submit(303);
    const txtRow = page.locator('tbody tr').filter({ hasText: 'TXT-001' });
    assert.equal(await txtRow.locator('.nombre-producto').innerText(), '<b>Batería Ñandú & soporte</b>');
    assert.equal(await txtRow.locator('.nombre-producto b').count(), 0);
    await chapter('Textos y caracteres especiales', 'Se conservan tildes, ñ y &. Las etiquetas HTML se muestran como texto.', 6);
    await shot('29_texto_escapado');
    ok('UI33', 'HU-PR01', 'Texto con tildes, ñ, & y HTML', 'Texto literal, sin etiqueta ejecutada', 'Texto íntegro; cero elementos b');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/productos/nuevo');
    await fill({ codigo: 'MOV-001', nombre: 'Panel móvil de prueba' });
    assert.ok(await page.locator('#codigo').isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await chapter('Vista móvil de la misma aplicación web', 'Formulario a 390 píxeles, sin desbordamiento horizontal de la página.', 6);
    await shot('30_formulario_movil', true);
    ok('UI34', 'Interfaz adaptable', 'Formulario en 390 × 844', 'Campos visibles y sin desbordamiento', 'Comprobado');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(base + '/productos');
    await chapter('Resultado del recorrido', '34 comprobaciones aprobadas. El módulo no contiene campos de fecha.', 8);
    await shot('31_cierre');

    const report = { fecha: new Date().toISOString(), zona: 'America/Bogota', navegador: await browser.version(),
      viewport: '1280x800 y 390x844', total: results.length, aprobadas: results.length, fallidas: 0,
      baseAislada: true, casos: results };
    fs.writeFileSync(path.join(out, 'resultados-navegador.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(out, 'capitulos.json'), JSON.stringify(chapters, null, 2));
    await context.close();
    if (video) fs.writeFileSync(path.join(out, 'video-ruta.txt'), await video.path());
    await browser.close();
    await stopServer();
    console.log('TOTAL ' + results.length + ' APROBADAS');
  } catch (error) {
    fs.writeFileSync(path.join(out, 'fallo.txt'), error.stack || String(error));
    fs.writeFileSync(path.join(out, 'resultados-parciales.json'), JSON.stringify(results, null, 2));
    try { if (page) await shot('fallo'); } catch (_) {}
    try { if (context) await context.close(); } catch (_) {}
    try { if (browser) await browser.close(); } catch (_) {}
    await stopServer();
    console.error(error);
    process.exitCode = 1;
  }
})();
