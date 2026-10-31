import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import newman from 'newman';
import { createApplication } from '../src/app.js';

// Usa una base temporal en memoria y un puerto libre; no altera las cuentas del aprendiz.
const collectionPath = fileURLToPath(new URL('../postman/AA5_EV02.postman_collection.json', import.meta.url));
const resultsDirectory = new URL('../resultados/', import.meta.url);
await mkdir(resultsDirectory, { recursive: true });
const server = await createApplication({ databasePath: ':memory:' });
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  console.log(`API temporal disponible en ${baseUrl}`);
  console.log(`Node.js ${process.version} | Colección Postman ejecutada con Newman`);
  // El reporte JSON conserva todas las verificaciones; se muestra un resumen legible.
  const summary = await new Promise((resolve, reject) => {
    newman.run({
      collection: collectionPath,
      envVar: [{ key: 'baseUrl', value: baseUrl }],
      reporters: ['json'],
      reporter: { json: { export: fileURLToPath(new URL('EJECUCION_LOCAL.json', resultsDirectory)) } },
      timeoutRequest: 10000,
    }, (error, result) => error ? reject(error) : resolve(result))
      .on('request', (error, event) => {
        console.log(`${event.item.name}: ${error ? error.message : 'HTTP ' + event.response.code}`);
      });
  });
  const failures = summary.run.failures.length;
  console.log(`\nRESUMEN FINAL: ${summary.run.stats.requests.total} solicitudes, ` +
    `${summary.run.stats.assertions.total} verificaciones, ${failures} fallos.`);
  console.log('Reporte completo: resultados/EJECUCION_LOCAL.json');
  for (const failure of summary.run.failures) console.error(failure.error.message);
  process.exitCode = failures ? 1 : 0;
} catch (error) {
  console.error('No fue posible completar las pruebas:', error.message);
  process.exitCode = 1;
} finally {
  // La instancia se cierra incluso cuando falla una comprobación.
  if (server.listening) await new Promise(resolve => server.close(resolve));
}
