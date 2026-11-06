import { build } from 'esbuild';
import { mkdir, rm, cp, writeFile, readFile } from 'node:fs/promises';

// La salida conserva las rutas relativas de SQL, documentación y base de datos.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/public', { recursive: true });
await build({ entryPoints: ['src/server.js', 'scripts/preparar-demo.js', 'scripts/crear-admin.js'], outdir: 'dist', outbase: '.', bundle: true, platform: 'node', format: 'esm', target: 'node24', sourcemap: true });
await build({ entryPoints: ['public/app.js'], outfile: 'dist/public/app.js', bundle: true, minify: true, format: 'esm', target: 'es2022', sourcemap: true });
await cp('src/schema.sql', 'dist/src/schema.sql');
// Los scripts empaquetados resuelven schema.sql desde su propio directorio.
await cp('src/schema.sql', 'dist/scripts/schema.sql');
for (const file of ['index.html', 'style.css']) await cp(`public/${file}`, `dist/public/${file}`);
await cp('docs/openapi.json', 'dist/docs/openapi.json', { recursive: true });
await cp('docs/SERVICIOS.html', 'dist/docs/SERVICIOS.html');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile('dist/package.json', JSON.stringify({ name: pkg.name, version: pkg.version, private: true, type: 'module', engines: pkg.engines, scripts: { start: 'node src/server.js', demo: 'node scripts/preparar-demo.js' } }, null, 2));
await writeFile('dist/BUILD.json', JSON.stringify({ version: pkg.version, node: process.version, esbuild: '0.25.12', target: 'Node.js 24 + navegadores ES2022', generatedAt: new Date().toISOString(), output: 'JavaScript transformado y empaquetado; requiere Node.js, no es un ejecutable .exe.' }, null, 2));
console.log('Build completado: dist/ (servidor y frontend empaquetados + mapas de fuentes).');
