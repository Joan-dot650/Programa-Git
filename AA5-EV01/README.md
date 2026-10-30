# Servicio web de registro e inicio de sesión

**Evidencia:** GA7-220501096-AA5-EV01 · Diseño y desarrollo de servicios web - caso  
**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874  
**Programa:** Análisis y Desarrollo de Software · SENA  
**Fecha:** 30 de octubre de 2026

La API recibe `usuario` y `contrasena`, registra cuentas y verifica sus
credenciales. El registro responde **201**; el ingreso correcto responde **200**
con **“Autenticación satisfactoria”**; los datos de acceso incorrectos responden
**401** con **“Error en la autenticación”**. Los datos inválidos generan **400**
y los usuarios repetidos generan **409**.

## Abrir en Windows, paso a paso

1. Extrae todo el ZIP con **clic derecho → Extraer todo**. No ejecutes archivos
   desde dentro de la ventana del ZIP.
2. Instala **Node.js 24.x** desde https://nodejs.org/en/download. Elige el
   instalador de Windows correspondiente a tu equipo y conserva la opción de
   añadir Node.js al PATH. Si ya tienes esa versión, no necesitas reinstalarla.
3. Abre la carpeta **AA5-EV01**. Haz doble clic en **INICIAR_WINDOWS.bat**.
4. Mantén abierta la terminal. Cuando aparezca “Servicio disponible”, abre
   **http://127.0.0.1:3000** en Chrome o Edge.
5. Para detenerlo, vuelve a la terminal y pulsa **Ctrl+C**.

No necesitas instalar paquetes con `npm install`, configurar MySQL ni usar Live
Server. La pantalla debe abrirse desde la URL del servicio, no con doble clic en
`index.html`.

### Alternativa desde Visual Studio Code

Abre la carpeta **AA5-EV01**, luego **Terminal → Nueva terminal**. Escribe los
comandos uno por uno:

```powershell
node --version
node src/server.js
```

El primer comando debe mostrar `v24.x.x`. El segundo mantiene el servidor abierto.
También puedes usar `npm.cmd start` en Windows; en macOS/Linux usa `npm start`.

## Demostración funcional

Los siguientes son datos ficticios de demostración, no una cuenta precargada:

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | En **Crear cuenta**, escribe `jhon.demo` y `Solar2026!`. | HTTP 201, registro satisfactorio. |
| 2 | Cambia a **Iniciar sesión** y escribe la misma contraseña. | HTTP 200, autenticación satisfactoria. |
| 3 | Prueba `OtraClave2026!`. | HTTP 401, error en la autenticación. |
| 4 | Vuelve a registrar `jhon.demo`. | HTTP 409, usuario ya registrado. |
| 5 | Intenta registrar el usuario `ab` con una contraseña válida. | HTTP 400, datos inválidos. |
| 6 | Detén y vuelve a iniciar el servidor; ingresa con la cuenta creada. | HTTP 200; los datos permanecen en SQLite. |

El navegador valida campos vacíos y longitud de contraseña antes del envío.
Para comprobar directamente las validaciones del servidor utiliza Postman,
`ejemplos/peticiones.http` o las pruebas automatizadas. Después de una respuesta
correcta se borra la contraseña del formulario; vuelve a escribirla para la
siguiente operación.

## Pruebas automáticas

Abre otra terminal en **AA5-EV01** y ejecuta:

```powershell
node --test tests/api.test.js
```

Alternativas: `npm.cmd test` (Windows) o `npm test` (macOS/Linux). No es necesario
tener el servidor de demostración abierto. Las pruebas abren sus propios puertos
y bases temporales y los cierran al terminar; no modifican tus cuentas.

La entrega contiene **40 pruebas automáticas aprobadas**. La salida de ejecución
está en `docs/RESULTADOS_PRUEBAS.txt`; la matriz de verificación está en
`docs/PRUEBAS.md`.

## Probar con Postman o cualquier cliente HTTP

1. Inicia el servicio.
2. En Postman, selecciona **Import** e importa
   `ejemplos/Autenticacion.postman_collection.json`.
3. Ejecuta **01 - Registrar** y luego **02 - Iniciar sesión**.
4. Ejecuta **03 - Contraseña incorrecta** y **04 - Usuario repetido**.
5. La colección genera un usuario de prueba nuevo al ejecutar el primer paso.
   Ejecuta los pasos en orden; no cambies de colección entre ellos.

Contrato completo: `docs/openapi.json`, disponible también en
http://127.0.0.1:3000/api/openapi.json.

Ejemplo de solicitud, con `Content-Type: application/json`:

```http
POST http://127.0.0.1:3000/api/login
Content-Type: application/json

{"usuario":"jhon.demo","contrasena":"Solar2026!"}
```

## Estructura

| Ruta | Contenido |
|---|---|
| `src/` | Código comentado del servidor, reglas, validaciones y persistencia. |
| `public/` | HTML, CSS y JavaScript de la demostración. |
| `tests/` | Pruebas de integración por HTTP. |
| `docs/` | Diseño, contrato OpenAPI, resultados y guía PDF. |
| `ejemplos/` | Colección de Postman y peticiones HTTP. |
| `data/` | Base SQLite generada al iniciar, excluida de Git. |
| `INICIAR_WINDOWS.bat` | Inicio asistido para Windows. |
| `ENLACE_REPOSITORIO.txt` | Enlace al proyecto y al historial remoto. |

## Versionamiento

El código está publicado en la rama `evidencia-aa5-ev01`, carpeta `AA5-EV01`:

https://github.com/Joan-dot650/Programa-Git/tree/evidencia-aa5-ev01/AA5-EV01

El diseño, la implementación y las pruebas/documentación tienen commits
separados. El ZIP incluye además una copia recuperable del historial en
`versionamiento/Programa-Git.bundle` y un listado en
`versionamiento/HISTORIAL_GIT.txt` (junto a la carpeta AA5-EV01).

Para clonar desde GitHub, abre Git Bash en una carpeta nueva:

```bash
git clone --branch evidencia-aa5-ev01 --single-branch https://github.com/Joan-dot650/Programa-Git.git
cd Programa-Git/AA5-EV01
git log --oneline
git status
node src/server.js
```

Para recuperar el historial sin internet, abre Git Bash en la carpeta extraída
que contiene `AA5-EV01` y `versionamiento`:

```bash
git clone --branch evidencia-aa5-ev01 versionamiento/Programa-Git.bundle Proyecto_Git
cd Proyecto_Git/AA5-EV01
git remote set-url origin https://github.com/Joan-dot650/Programa-Git.git
git log --oneline
```

Para registrar y enviar modificaciones propias desde una copia clonada:

```bash
git add .
git commit -m "Actualizar servicio de autenticacion"
git push origin evidencia-aa5-ev01
```

El envío requiere autenticarse con la cuenta propietaria. No incluyas tokens ni
contraseñas reales en el proyecto. También puedes ejecutar el paquete directamente
con las instrucciones del inicio, sin clonar el historial.

## Si aparece un error

| Mensaje o situación | Solución |
|---|---|
| `node` no se reconoce | Instala Node.js 24.x y vuelve a abrir la terminal o VS Code. |
| No se encuentra `node:sqlite` | Comprueba `node --version`; utiliza Node.js 24.x. |
| Puerto ocupado | Cierra la instancia anterior. En PowerShell: `$env:PORT="3001"`, luego `node src/server.js`; abre el puerto 3001. |
| HTTP 409 | Esa cuenta ya existe. Inicia sesión o elige otro nombre. |
| HTTP 401 | Revisa usuario y contraseña, respetando mayúsculas y espacios de la contraseña. |
| HTTP 429 | Espera el tiempo indicado en `Retry-After`; el límite es 20 solicitudes cada 10 minutos por IP. |
| `npm.ps1` bloqueado | Usa `node src/server.js`, `node --test tests/api.test.js` o `npm.cmd`. |

La base se conserva en `data/usuarios.sqlite`. Antes de borrarla, recuerda que
contiene las cuentas creadas: la entrega funciona sin necesidad de eliminarla.

## Alcance

Es una implementación local del caso académico. Comprueba credenciales y devuelve
el mensaje requerido; no emite tokens ni mantiene una sesión autenticada. La
pantalla nunca sustituye al servicio: todas las operaciones usan peticiones HTTP
al servidor y consultas a SQLite. Las decisiones y limitaciones se explican en
`docs/DISENO.md`.

