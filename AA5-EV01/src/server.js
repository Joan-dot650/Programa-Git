import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApplication } from './app.js';

// El directorio de datos es relativo al proyecto, no al terminal que lo ejecuta.
const databasePath = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : fileURLToPath(new URL('../data/usuarios.sqlite', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT debe ser un número entero entre 1 y 65535.');
  process.exit(1);
}

try {
  const server = await createApplication({ databasePath });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE'
      ? 'El puerto está ocupado. Cierra la otra instancia o cambia PORT.'
      : 'No fue posible iniciar el servicio.');
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Servicio disponible en http://127.0.0.1:${port}`);
    console.log('Usa Ctrl+C para detenerlo. Las cuentas permanecen guardadas.');
  });

  // El cierre espera las solicitudes activas antes de liberar la base de datos.
  const shutdown = () => server.close();
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch {
  console.error('No fue posible abrir el servicio. Verifica Node.js 24.x y los permisos de la carpeta de datos.');
  process.exit(1);
}
