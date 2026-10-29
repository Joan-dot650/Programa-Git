import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// Ejecuta los dos procesos de desarrollo y los cierra juntos al salir.
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const servidor = spawn('java', ['-jar', resolve(raiz, 'ejecutable/raizvolt-react.jar')], {
  cwd: resolve(raiz, 'ejecutable'), stdio: 'inherit',
});
const vite = spawn(process.execPath, [resolve(raiz, 'raizvolt-react/node_modules/vite/bin/vite.js'),
  '--host', '0.0.0.0', ...process.argv.slice(2)], { cwd: resolve(raiz, 'raizvolt-react'), stdio: 'inherit' });
let cerrando = false;
function cerrar(codigo = 0) {
  if (cerrando) return;
  cerrando = true;
  servidor.kill(); vite.kill();
  process.exitCode = codigo;
}
servidor.on('error', (error) => { console.error(error.message); cerrar(1); });
vite.on('error', (error) => { console.error(error.message); cerrar(1); });
servidor.on('exit', (codigo) => cerrar(codigo || 0));
vite.on('exit', (codigo) => cerrar(codigo || 0));
process.on('SIGTERM', () => cerrar());
process.on('SIGINT', () => cerrar());
