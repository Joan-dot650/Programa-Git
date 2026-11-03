import { createApplication } from './app.js';
import { databasePath } from './config.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT debe ser un entero entre 1 y 65535.'); process.exit(1);
}
try {
  const server = await createApplication({ databasePath: databasePath() });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? 'Puerto ocupado: cierra la otra API o cambia PORT.' : 'No fue posible iniciar el servicio.');
    process.exitCode = 1;
    server.close();
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`RaízVolt API y documentación: http://127.0.0.1:${port}`);
    console.log('Presiona Ctrl+C para detener. La información se conserva en SQLite.');
  });
  const stop = () => server.close();
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
} catch {
  console.error('Revisa Node.js 24.x, la ruta DB_PATH y los permisos de la carpeta data.'); process.exitCode = 1;
}
