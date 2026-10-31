# Testing de la API - AA5-EV02

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874
**Programa:** Análisis y Desarrollo de Software · SENA
**Evidencia:** GA7-220501096-AA5-EV02

Se prueba la API de registro e inicio de sesión construida en AA5-EV01. El proyecto acepta **Node.js 24 o superior**, sin límite máximo. Se verificó con Node.js 24.22.1 y 26.13.0.

**Alcance de la evidencia incluida:** las pruebas, capturas y el video corresponden a **Newman 6.2.1**, el ejecutor local de colecciones de Postman. No son capturas ni una grabación de la interfaz de Postman de escritorio. Para completar ese formato solicitado por la guía, usa **GUIA_POSTMAN_WINDOWS.md**, importa la colección, toma las capturas y graba tu ejecución en Postman.

## Abrir la aplicación en Windows

1. Extrae todo el ZIP. Abre la carpeta **AA5-EV02**.
2. Haz doble clic en **INICIAR_WINDOWS.bat**. Node.js 26 está permitido.
3. Mantén la ventana abierta y visita **http://127.0.0.1:3000**.
4. Para detener el servidor, pulsa **Ctrl+C** en esa ventana.

También puedes ejecutar desde la terminal de VS Code, dentro de esta carpeta:

```powershell
node --version
node src/server.js
```

La API no necesita instalar paquetes, MySQL, XAMPP ni Live Server. SQLite guarda las cuentas en `data/usuarios.sqlite`, que se crea automáticamente. Los datos de las pruebas incluidas son ficticios.

## Repetir las pruebas de la colección automáticamente

Haz doble clic en **EJECUTAR_PRUEBAS_NEWMAN.bat**. La primera vez instala Newman desde el archivo de dependencias; requiere internet para esa instalación. La ejecución de las pruebas usa una API local y una base temporal propia, sin cambiar las cuentas de la aplicación.

Alternativa en PowerShell:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run test:postman
```

Resultado esperado: **25 solicitudes, 140 verificaciones y 0 fallos**. La nueva ejecución se guarda en **resultados/EJECUCION_LOCAL.json**. Los resultados de la entrega permanecen en **POSTMAN_NEWMAN.json** y **POSTMAN_NEWMAN.txt**.

Para repetir las 40 pruebas de integración del proyecto:

```powershell
node --test tests/api.test.js
```

## Repetirlas en Postman de escritorio

1. Instala Postman desde https://www.postman.com/downloads/.
2. Importa los archivos `postman/AA5_EV02.postman_collection.json` y `postman/Local.postman_environment.json`.
3. Selecciona el entorno local y comprueba `baseUrl = http://127.0.0.1:3000`.
4. Inicia el servidor y ejecuta CP01 a CP25, una vez cada uno, en orden.
5. Revisa el estado HTTP, el JSON y **Test Results**. Toma las capturas y graba el video siguiendo **GUIA_POSTMAN_WINDOWS.md**.

Antes de cada repetición completa, reinicia el servidor. La API permite 20 intentos de autenticación por IP en 10 minutos. CP25 comprueba el bloqueo del intento 21; no envíes otros POST durante la ejecución. Reiniciar la API reinicia el contador, sin borrar las cuentas. La variable opcional `modoVideo=true` solo añade una pausa para leer los resultados al grabar.

## Archivos de la evidencia

| Archivo o carpeta | Contenido |
|---|---|
| `src/`, `public/`, `tests/` | Proyecto comentado, interfaz y 40 pruebas de integración. |
| `postman/` | Colección de 25 casos, entorno y matriz de datos. |
| `documentos/INFORME_PRUEBAS_AA5_EV02.pdf` | Informe con resultados y capturas de consola. |
| `documentos/INFORME_PRUEBAS_AA5_EV02.md` | Texto editable del informe. |
| `documentos/capturas/` | Capturas reales de la ejecución con Newman. |
| `video/PRUEBAS_POSTMAN_NEWMAN.mp4` | Grabación de pantalla de la ejecución; sin voz. |
| `resultados/` | Reportes originales y verificación en Node.js 24 y 26. |
| `ENDPOINT.txt` | Métodos, URL, solicitudes y respuestas. |
| `docs/openapi.json` | Contrato OpenAPI 3.1.0. |
| `ENLACE_REPOSITORIO.txt` | Enlace al código y al historial. |
| `GUIA_POSTMAN_WINDOWS.md` | Instalación, importación, capturas y guion del video en escritorio. |

Los errores HTTP esperados, como 400, 401 o 429, se consideran casos aprobados cuando coinciden con el resultado definido en la colección.

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/salud` | Consultar disponibilidad. |
| POST | `/api/registro` | Crear una cuenta. |
| POST | `/api/login` | Verificar usuario y contraseña. |
| GET | `/api/openapi.json` | Consultar el contrato de la API. |

El servicio verifica credenciales y devuelve el mensaje solicitado. No emite JWT ni mantiene una sesión autenticada. Las pruebas presentadas verifican los casos descritos; no constituyen una prueba de carga ni una auditoría completa de seguridad.

## Versionamiento

Repositorio: https://github.com/Joan-dot650/Programa-Git
Rama de esta evidencia: `evidencia-aa5-ev02`
Carpeta: `AA5-EV02`

```bash
git clone --branch evidencia-aa5-ev02 --single-branch https://github.com/Joan-dot650/Programa-Git.git
cd Programa-Git/AA5-EV02
git log --oneline
node src/server.js
```

El ZIP incluye una copia recuperable del historial en `versionamiento/Programa-Git.bundle`. Desde la carpeta principal extraída:

```bash
git clone --branch evidencia-aa5-ev02 versionamiento/Programa-Git.bundle Proyecto_Git
cd Proyecto_Git/AA5-EV02
git remote set-url origin https://github.com/Joan-dot650/Programa-Git.git
```

## Fuentes

- Postman: https://learning.postman.com/docs/getting-started/installation/install-app
- Newman: https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman
- Colecciones: https://learning.postman.com/docs/collections/using-collections/
- Scripts de pruebas: https://learning.postman.com/docs/tests-and-scripts/write-scripts/test-scripts/
