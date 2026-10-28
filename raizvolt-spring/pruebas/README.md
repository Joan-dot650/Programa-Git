# Pruebas de navegador de AA3-EV02

El script ejecuta el JAR con una base H2 temporal independiente. Registra los
resultados de UI01 a UI34 y genera capturas reales. La base del usuario no se
utiliza. Debe estar disponible el puerto local 8093.

## Preparación

Requisitos: JDK 17, Node.js 20 o superior y conexión para la primera instalación.
Desde `raizvolt-spring`, compilar con `mvnw.cmd verify` en Windows o
`./mvnw verify` en Linux/macOS. Después:

```text
cd pruebas
npm install
npx playwright install chromium
npm test
```

La salida queda en `raizvolt-spring/evidencia-generada`. Incluye el JSON de
resultados, las capturas y el log del servidor. Un fallo hace terminar el script
con código distinto de cero y produce `fallo.txt` y una captura de diagnóstico.

## Grabación opcional

En PowerShell, antes de `npm test`:

```powershell
$env:GRABAR = "1"
npm test
```

En Linux/macOS:

```sh
GRABAR=1 npm test
```

La grabación original WebM y `capitulos.json` permiten preparar un video con
rótulos. El MP4 de la entrega se grabó con Chromium 141.0.7390.37, Playwright
1.62.1 y Java 17.0.20 el 28 de octubre de 2026. La revisión automatizada de Java
incluye 63 pruebas. La primera versión de AA3-EV01 tenía 30; AA3-EV02 añade 33.

Variables opcionales: `RAIZVOLT_JAR` para elegir un JAR, `EVIDENCIA_SALIDA` para
elegir la carpeta de resultados y `CHROMIUM_PATH` para un navegador local.
`CODEX_PRIMARY_RUNTIME_NODE_MODULES` solo se usa cuando el entorno de ejecución
ya proporciona Playwright; una instalación normal utiliza `node_modules`.

Los controles HTML se omiten únicamente en los casos UI15 a UI19, de forma
controlada, para probar las validaciones del servidor. UI32 retira el token CSRF
de un formulario de prueba para comprobar el rechazo HTTP 403. El resto del
recorrido utiliza los controles de la interfaz. El video tiene rótulos
explicativos y no incluye narración de voz.
