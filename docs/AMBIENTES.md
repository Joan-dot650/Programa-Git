# Ambientes de desarrollo y pruebas

## Configuración

| Elemento | Desarrollo | Compilado | Pruebas |
|---|---|---|---|
| Arranque | `node src/server.js` | `node dist/src/server.js` | Servidor temporal de cada prueba; E2E usa `dist/src/server.js`. |
| Runtime | Node.js 24.x | Node.js 24.x | Verificado con Node.js 24.22.1, SQLite 3.53.4. |
| Host | 127.0.0.1 | 127.0.0.1 | 127.0.0.1; puertos efímeros en API y 3487 en E2E. |
| Puerto | `PORT`, por defecto 3000 | Igual | `TEST_PORT` para E2E. |
| Base predeterminada | `data/raizvolt.sqlite` | `dist/data/raizvolt.sqlite` | Memoria o carpeta temporal eliminada al finalizar. |
| Ruta alternativa | `DB_PATH` | `DB_PATH` | Ruta temporal inyectada por el ejecutor. |
| Herramientas | VS Code, Git, npm, esbuild | Solo Node y navegador | node:test, assert/strict, Playwright/Chromium. |

El depurador F5 usa `data/desarrollo.sqlite`. Para crear una demo en esa base desde la terminal PowerShell de VS Code:

```powershell
$env:DB_PATH = "$PWD/data/desarrollo.sqlite"
npm run demo
```

Después detén cualquier servidor que use el puerto 3000 y pulsa F5. Para volver a la ruta predeterminada de una terminal:

```powershell
Remove-Item Env:DB_PATH
```

Para cambiar el puerto y compartir una ruta entre fuentes y compilados:

```powershell
$env:PORT = "3001"
$env:DB_PATH = "$PWD/data/compartida.sqlite"
npm run demo:dist
npm run start:dist
```

Linux/macOS:

```sh
DB_PATH="$PWD/data/compartida.sqlite" node dist/scripts/preparar-demo.js
PORT=3001 DB_PATH="$PWD/data/compartida.sqlite" node dist/src/server.js
```

Abre `http://127.0.0.1:3001`. No se procesa automáticamente un archivo `.env`: las variables se configuran en la terminal o en el depurador.

## Servidor

HTTP nativo `node:http`; JSON UTF-8; límite de cuerpo 32768 bytes; timeout de solicitud 15 s y cabeceras 10 s. Archivos públicos mediante lista cerrada. No expone `data/`, SQL, `.env` ni código de servidor. Sin CORS abierto. Para evitar dos servidores simultáneos, detén la ventana anterior con Ctrl+C. El cierre ordenado cierra SQLite.

## Base de datos

SQLite embebido no necesita MySQL, XAMPP ni un servicio adicional. `Store` crea la carpeta y ejecuta `schema.sql` al iniciar: tablas `usuarios`, `sesiones`, `productos`, `cotizaciones`, `cotizacion_items`, `pedidos`, `movimientos`; claves foráneas activas, WAL, espera de bloqueo de 5000 ms, índices y restricciones CHECK/UNIQUE. Los cambios de pedidos e inventario se agrupan con `BEGIN IMMEDIATE`, COMMIT o ROLLBACK. Se conserva el runtime verificado para reproducir el comportamiento de SQLite.

Fuentes y compilados usan bases distintas por defecto. Usa la misma `DB_PATH` si necesitas compartir datos. No ejecutes datos demo en la base real. La demo añade una cuenta ADMIN aleatoria y productos que no existan; no borra datos.

## Copia de seguridad local

Detén el servidor y los demás procesos que usen la base; copia la carpeta `data/` correspondiente completa, incluidos archivos auxiliares si existen. Restaura la carpeta con el servidor detenido y apunta `DB_PATH` al archivo restaurado. No copies únicamente un archivo SQLite abierto con WAL activo. No incluyas la base, contraseñas, sesiones ni datos personales en Git.

## Alcance de la verificación

La ejecución de Node, la compilación y las pruebas se verificaron en Linux. La interfaz se prueba con Chromium de escritorio y un viewport móvil de 390 × 844. Eso verifica la adaptación del diseño, no todos los dispositivos físicos ni navegadores. Los archivos .bat y la configuración de VS Code se entregan para reproducción en el equipo del aprendiz; no se afirma una prueba física en Windows ni una sesión real del IDE.
