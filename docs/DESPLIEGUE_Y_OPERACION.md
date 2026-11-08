# Manual técnico de despliegue y operación - EV02

## Estado verificado
Compilados Node.js 24 y SQLite ejecutados localmente en Linux. Publicación de fuentes en la rama indicada en ENLACE_REPOSITORIO.txt. No existe una URL pública verificada de la aplicación; localhost solo sirve en el equipo donde se inicia el servidor. GitHub no sustituye al servidor de la API.

## Instalación local en Windows
1. Instalar Node.js 24.x y comprobar `node --version` en una terminal nueva.
2. Descargar la rama EV02 con Code > Download ZIP y extraerla.
3. Abrir `PREPARAR_DEMO_WINDOWS.bat`. Guardar localmente el usuario y contraseña aleatoria mostrados.
4. Abrir `INICIAR_WINDOWS.bat` y conservar la ventana abierta.
5. Navegar a http://127.0.0.1:3000. No abrir index.html con doble clic ni usar Live Server para esta aplicación.
6. ADMIN gestiona productos e inventario. Para probar como cliente, cerrar sesión, crear una cuenta y completar el perfil.

## Ejecución del compilado en Linux/macOS
Desde la raíz de la descarga:
```sh
node --version
node dist/scripts/preparar-demo.js
node dist/src/server.js
```
No requiere npm install para ejecutar dist. La demo añade datos, no borra los existentes. Usar solo una base de demostración.

## Desarrollo y pruebas
```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```
`npm ci` usa el lockfile. `npm start` ejecuta fuentes y `npm run start:dist` ejecuta compilados. Las pruebas Node incluyen el compilado, por eso se construye primero. Si Chromium ya está instalado puede usarse CHROME_PATH. El navegador no se distribuye con el proyecto.

## Variables y servidor
PORT: entero 1-65535, defecto 3000. DB_PATH: ruta de base; defecto data/raizvolt.sqlite en fuentes y dist/data/raizvolt.sqlite en compilados. No se carga .env automáticamente. Host fijo 127.0.0.1. Un proceso Node atiende interfaz y API. Timeout solicitud 15 s; cabeceras 10 s; cuerpo JSON máximo 32768 bytes; acceso limitado a archivos públicos; sin CORS abierto.
PowerShell, base compartida:
```powershell
$env:PORT = "3001"
$env:DB_PATH = "$PWD/data/compartida.sqlite"
node dist/scripts/preparar-demo.js
node dist/src/server.js
```
Abrir http://127.0.0.1:3001. Para volver a valores predeterminados en esa terminal: `Remove-Item Env:PORT, Env:DB_PATH`.

## Base de datos
SQLite embebida, creada automáticamente por Store/schema.sql. Siete tablas STRICT, foreign_keys=ON, journal_mode=WAL, busy_timeout=5000. SQL parametrizado y restricciones CHECK/UNIQUE. Las operaciones de pedido e inventario usan BEGIN IMMEDIATE. No se requiere XAMPP/MySQL. No hay migraciones automáticas desde otros motores; mantener el esquema entregado.

## Respaldo y restauración
1. Detener Node con Ctrl+C y cerrar cualquier proceso que use la base.
2. Copiar la carpeta de datos completa (incluidos WAL/SHM si quedaron) a una carpeta de respaldo privada fechada.
3. Para restaurar, conservar primero una copia de la carpeta actual; restaurar el conjunto completo en una carpeta distinta y configurar DB_PATH hacia ella.
4. Arrancar y verificar salud, acceso, productos y pedidos. R-04 automatiza un respaldo/restauración con cierre limpio y comprueba integridad.
No copiar solamente el archivo SQLite mientras esté abierto con WAL activo. Nunca subir datos de usuarios o sesiones a GitHub.

## Alojamiento remoto: configuración preparada, no ejecutada
Se necesita un servidor que ejecute Node.js 24 como servicio, un volumen persistente SQLite, dominio y proxy HTTPS hacia 127.0.0.1:3000. El administrador del servidor debe seleccionar rutas, certificados, usuario de servicio y respaldos. Se entrega deploy/raizvolt.service como plantilla de systemd: requiere instalar Node en /usr/bin/node, crear usuario raizvolt, copiar dist a /opt/raizvolt/dist y conceder escritura a /var/lib/raizvolt. No contiene credenciales ni dominio real.
Antes de exponer a varios usuarios se debe adaptar y verificar el límite por IP detrás del proxy: la versión actual identifica request.socket.remoteAddress y compartiría el límite para el proxy. No basta con confiar libremente en X-Forwarded-For. Verificar HTTPS, registro/roles, persistencia tras reinicio, restauración y enlaces antes de registrar una URL como desplegada. No usar hosting solo estático para ejecutar Node/SQLite.

## Actualizar y revertir
Detener servicio, respaldar carpeta de datos, conservar dist y registrar commit. Instalar la nueva dist y probar /api/salud y el flujo comercial. Si falla, detener y volver al dist anterior compatible con el esquema. Si el esquema cambió, restaurar el respaldo previo; no mezclar archivos WAL con bases de otra versión. La presente entrega conserva el esquema de EV01.

## Incidentes frecuentes
- Puerto ocupado: detener la otra instancia o cambiar PORT y URL.
- Catálogo vacío: preparar demo en la misma DB_PATH que el servidor.
- node:sqlite no disponible: comprobar Node 24.x.
- 401 tras recargar: iniciar sesión nuevamente; token solo en memoria.
- 403: la cuenta no tiene rol ADMIN. Crear admin desde el comando local.
- 409 al comprar: revisar stock o vencimiento; generar nueva cotización si corresponde.
- Base de solo lectura: revisar permisos del archivo y su carpeta (WAL necesita escritura).
