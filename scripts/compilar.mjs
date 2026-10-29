import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(raiz, 'raizvolt-react');
const backend = resolve(raiz, 'raizvolt-spring');
const windows = process.platform === 'win32';
function ejecutar(comando, argumentos, cwd) {
  const resultado = spawnSync(comando, argumentos, { cwd, stdio: 'inherit', shell: windows });
  if (resultado.error) throw resultado.error;
  if (resultado.status !== 0) process.exit(resultado.status || 1);
}
// package-lock.json fija exactamente las dependencias de esta evidencia.
ejecutar(windows ? 'npm.cmd' : 'npm', ['ci', '--no-audit', '--no-fund'], frontend);
ejecutar(windows ? 'npm.cmd' : 'npm', ['test'], frontend);
ejecutar(windows ? 'npm.cmd' : 'npm', ['run', 'build'], frontend);
const destino = resolve(backend, 'src/main/resources/static/react');
rmSync(destino, { recursive: true, force: true });
cpSync(resolve(frontend, 'dist'), destino, { recursive: true });
ejecutar(windows ? 'mvnw.cmd' : './mvnw', ['-B', '-ntp', 'clean', 'verify'], backend);
mkdirSync(resolve(raiz, 'ejecutable'), { recursive: true });
cpSync(resolve(backend, 'target/raizvolt-spring.jar'), resolve(raiz, 'ejecutable/raizvolt-react.jar'));
console.log('Compilación completa: ejecutable/raizvolt-react.jar');
