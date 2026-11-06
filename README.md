# RaízVolt - Integración de módulos web

**Evidencia:** GA8-220501096-AA1-EV01. Desarrollar software a partir de la integración de sus módulos componentes.

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874 · **Programa:** Análisis y Desarrollo de Software · SENA.

Aplicación académica de catálogo solar, autenticación, perfil, inventario, cotizaciones y pedidos. Integra una interfaz web nueva con los servicios Node.js/SQLite de AA5-EV03. El frontend anterior de React/Spring Boot no se reutiliza: esta versión consume el contrato `/api` del backend Node.js. No hay migración automática desde H2 ni pagos reales.

## Abrir la versión compilada en Windows

1. Instala **Node.js 24.x** desde https://nodejs.org/ y comprueba `node --version` en una terminal nueva.
2. Extrae completamente el ZIP; no ejecutes archivos desde dentro de la carpeta comprimida.
3. Abre `PREPARAR_DEMO_WINDOWS.bat`. Crea tres productos ficticios y una cuenta ADMIN con contraseña aleatoria. Guarda las credenciales que aparecen. No se publican contraseñas predefinidas de administración.
4. Abre `INICIAR_WINDOWS.bat` y deja abierta la ventana.
5. Visita **http://127.0.0.1:3000** en tu navegador.
6. En **Ingresar**, utiliza las credenciales generadas para administrar. Para crear un cliente, escribe usuario y contraseña y pulsa **Crear cuenta**; después **Iniciar sesión**.
7. Completa **Mi perfil** con datos ficticios. En el catálogo añade productos, abre **Cotizaciones**, genera una y confirma el pedido. En **Pedidos** consulta o cancela los pendientes. Con ADMIN puedes editar productos, ajustar inventario, despachar y entregar pedidos.
8. Detén el servidor con `Ctrl+C`.

La salida `dist/` ya está incluida. Para ejecutarla no necesitas instalar paquetes npm ni Postman. Requiere Node.js 24.x. Los comandos `.bat` se entregan para Windows; la validación automatizada se ejecutó en Linux.

## Desarrollo en VS Code

Abre esta carpeta con **Archivo > Abrir carpeta**. Usa **Terminal > Nueva terminal**. Ejecuta:

```sh
node --version
npm ci
npm run demo
npm start
```

`npm ci` instala las versiones exactas de `package-lock.json`; solo es necesario para compilar y para las pruebas de navegador. La aplicación y las pruebas de Node no tienen dependencias externas de ejecución.

Abre `src/app.js` para seguir las rutas y `public/app.js` para la navegación. Pon un punto de interrupción en `SalesService.createOrder`, inicia **Ejecutar y depurar > RaizVolt: servidor fuente** (F5) y confirma una cotización desde el navegador. Usa F10 para avanzar, Variables para inspeccionar el contexto y la terminal para leer errores. La configuración F5 usa `data/desarrollo.sqlite`: prepara sus datos con `DB_PATH` según `docs/AMBIENTES.md`.

## Pruebas y compilación

```sh
npm test
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` ejecuta 85 casos: 28 unitarios, 55 de API, 1 recorrido HTTP de la colección (34 solicitudes) y 1 comprobación de entrega de archivos web. El script de colección es un ejecutor limitado en Node, no una ejecución de Postman.

Las pruebas E2E ejecutan la versión `dist/`, crean una base temporal y producen `docs/evidencias/E2E.json` y capturas reales de los recorridos. `CHROME_PATH` permite seleccionar un ejecutable de Chromium cuando el navegador está instalado por otra vía. `TEST_PORT` cambia el puerto de prueba (3487 por defecto).

```sh
npm run demo:dist
npm run start:dist
```

La compilación usa esbuild 0.25.12: transforma y empaqueta JavaScript de servidor y navegador, minifica el frontend e incluye mapas de fuentes. No produce un `.exe`, `.jar` ni binario nativo. `dist/BUILD.json` identifica la salida.

## Estructura

| Ruta | Responsabilidad |
|---|---|
| `public/` | Vistas web, navegación, cliente HTTP, carrito y componentes reutilizables. |
| `src/app.js` | Rutas HTTP, autenticación, autorización y traducción de errores. |
| `src/*-service.js` | Reglas de autenticación, catálogo, inventario y ventas. |
| `src/database.js`, `src/schema.sql` | Acceso SQLite, restricciones y transacciones. |
| `src/validation.js`, `passwords.js`, `rate-limit.js` | Validación, hashes y protección de acceso. |
| `scripts/` | Construcción y preparación de datos locales. |
| `tests/` | Pruebas de API, unitarias, archivos web y navegador. |
| `dist/` | Archivos compilados y empaquetados listos para ejecutar con Node.js. |
| `docs/` | Informe PDF, API, ambientes, diagramas y evidencias. |
| `.vscode/` | Depuración y tareas del IDE. |

## Seguridad y reglas de negocio

El registro crea CLIENTE; solo el comando local crea ADMIN. Contraseñas con scrypt y sal individual. Tokens aleatorios con vencimiento de dos horas; el servidor guarda su hash y el navegador los conserva solo en memoria. Recargar exige iniciar sesión nuevamente. El cierre de sesión revoca el token. No se almacenan credenciales en localStorage ni sessionStorage.

Las escrituras de catálogo/inventario requieren ADMIN. Los documentos se filtran por propietario en el servidor. El servidor valida todos los datos, usa parámetros SQL y calcula el dinero en centavos. Cotizar no reserva stock; confirmar un pedido sí. Una cotización genera como máximo un pedido. Cancelar un pedido pendiente devuelve inventario una sola vez. No se puede cancelar un pedido enviado o entregado.

La aplicación escucha exclusivamente en `127.0.0.1`. Esta entrega demuestra ejecución local; no incluye hosting público, pago, impuestos, fletes, facturación, recuperación de cuenta ni migración de bases anteriores. El repositorio público contiene fuentes y compilados, no una aplicación alojada. Antes de usarla en producción se requiere una revisión y configuración específica.

## URL

Repositorio: https://github.com/Joan-dot650/Programa-Git

Evidencia: https://github.com/Joan-dot650/Programa-Git/tree/evidencia-ga8-aa1-ev01/GA8-AA1-EV01

Interfaz local: http://127.0.0.1:3000

Documentación API local: http://127.0.0.1:3000/documentacion

Contrato OpenAPI: http://127.0.0.1:3000/api/openapi.json

Base previa: https://github.com/Joan-dot650/Programa-Git/tree/1a1ebb54280d66194f28e95194c3491d90bc8162/API-PROYECTO
