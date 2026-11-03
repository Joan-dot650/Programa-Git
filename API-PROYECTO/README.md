# RaízVolt · API del proyecto formativo

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874  
**Programa:** Análisis y Desarrollo de Software · SENA, Regional Antioquia  
**Actividad:** Diseño y codificación de las API del proyecto · AA5  
**Fecha:** 2 de noviembre de 2026

Servicios REST para registrar clientes, iniciar sesión, administrar un catálogo
solar e inventario, elaborar cotizaciones y confirmar pedidos. Se utiliza
**Node.js 24.x, JavaScript y SQLite**, sin dependencias de npm.

## Empezar en Windows

1. Extrae **todo** el ZIP con clic derecho → Extraer todo.
2. Instala Node.js **24.x** si no lo tienes: https://nodejs.org/en/download.
   En una terminal, `node --version` debe mostrar `v24.x.x`.
3. Abre la carpeta **API-PROYECTO**. Ejecuta **PREPARAR_DEMO_WINDOWS.bat**.
   Se crean tres productos ficticios y una cuenta ADMIN con contraseña aleatoria.
   Copia el usuario y la contraseña que aparecen; no son una cuenta de GitHub.
4. Ejecuta **INICIAR_WINDOWS.bat** y deja la consola abierta.
5. Abre **http://127.0.0.1:3000** para leer la documentación de los servicios.
6. En Postman, importa **ejemplos/RaizVolt.postman_collection.json**. Abre las
   variables de la colección y completa `admin_usuario` y `admin_contrasena`
   con las credenciales del paso 3. `base_url` queda en `http://127.0.0.1:3000`.
7. Ejecuta las solicitudes en orden, desde **01 - Salud** hasta **34 - Cerrar
   sesión admin**, o ejecuta la colección completa con Collection Runner.
8. Para detener la API, regresa a la terminal y presiona **Ctrl+C**.

El navegador muestra documentación; Postman consume los servicios. No uses
Live Server para arrancar esta API. No necesitas MySQL, Maven ni `npm install`.
La colección genera una cuenta CLIENTE y referencias nuevas en cada recorrido.
No exportes la colección después con contraseñas o tokens reales guardados.

### Alternativa en Visual Studio Code

Abre **API-PROYECTO** y selecciona **Terminal → Nueva terminal**. Ejecuta,
uno por uno:

```text
node --version
node scripts/preparar-demo.js
node src/server.js
```

El último comando mantiene la terminal ocupada mientras funciona el servidor.
Para crear una cuenta ADMIN con un nombre y una contraseña propios, usa en otra
terminal `node scripts/crear-admin.js`. La contraseña se introduce oculta.
La API pública solo registra cuentas CLIENTE.

## Servicios y documentación

| Archivo | Para qué sirve |
|---|---|
| `docs/DISENO_Y_GUIA.pdf` | Informe de diseño, modelo, alcance y guía de ejecución. |
| `docs/SERVICIOS.html` | Manual de cada servicio, consultable sin internet. |
| `docs/SERVICIOS.md` | El mismo manual en texto editable. |
| `docs/openapi.json` | Contrato OpenAPI 3.1.1 para importar en clientes HTTP. |
| `ENDPOINTS.txt` | Lista de las 23 operaciones HTTP. |
| `docs/DISENO.md` | Arquitectura, reglas, modelo y trazabilidad. |
| `docs/PRUEBAS.md` | Qué se comprobó y cómo repetirlo. |
| `docs/RESULTADOS_PRUEBAS.txt` | Salida real de las pruebas automatizadas. |
| `ejemplos/` | Colección Postman y solicitudes para REST Client. |
| `ENLACE_REPOSITORIO.txt` | Repositorio, rama y carpeta de esta entrega. |

Los módulos cubren autenticación, perfil del cliente, categorías, productos,
inventario, cotizaciones y pedidos. Hay 22 operaciones funcionales y una para
descargar el contrato. El catálogo tiene acceso público; las escrituras de
productos/inventario requieren ADMIN. Cada cliente accede a sus documentos.

## Verificar el proyecto

En una terminal dentro de API-PROYECTO:

```text
node --test tests/api.test.js tests/coleccion.test.js
```

También puedes abrir **PROBAR_WINDOWS.bat**. Las pruebas crean bases temporales
y puertos libres; no requieren arrancar la API de demostración y no modifican
sus usuarios o inventario. Consulta los resultados y la cobertura funcional en
`docs/PRUEBAS.md`. Las pruebas automáticas usan el cliente HTTP de Node.js; la
colección Postman queda preparada para su ejecución manual.

## Datos y configuración

La base se crea en `data/raizvolt.sqlite`, junto con sus posibles archivos WAL/SHM.
Los datos permanecen al reiniciar. No se incluye una base con cuentas ni tokens
en el ZIP o en Git. El comando de demostración no borra datos existentes: crea
otro ADMIN y agrega únicamente los productos de ejemplo que faltan.

`PORT` permite elegir un puerto distinto. Si la API de AA5-EV01 ya está usando
3000, ciérrala o ejecuta en PowerShell:

```powershell
$env:PORT="3001"
node src/server.js
```

Después abre http://127.0.0.1:3001 y cambia `base_url` en Postman.
`DB_PATH` permite elegir otra base; usa el mismo valor al crear administradores,
preparar datos y arrancar el servidor. La nueva base debe tener el esquema de
esta entrega: no apuntes DB_PATH al archivo de usuarios de AA5-EV01 ni a H2.
Para respaldo, detén la API y copia la carpeta `data` completa.

## Versionamiento

El código y la documentación de esta entrega están publicados en:

https://github.com/Joan-dot650/Programa-Git/tree/evidencia-aa5-api-proyecto/API-PROYECTO

Repositorio: https://github.com/Joan-dot650/Programa-Git  
Rama: `evidencia-aa5-api-proyecto`  
Carpeta: `API-PROYECTO`

Para descargar una copia con Git:

```bash
git clone --branch evidencia-aa5-api-proyecto --single-branch https://github.com/Joan-dot650/Programa-Git.git
cd Programa-Git/API-PROYECTO
git log --oneline -- .
git status
node --test tests/api.test.js tests/coleccion.test.js
```

El ZIP conserva también el historial local de preparación en
`versionamiento/RaizVolt.bundle`, fuera de API-PROYECTO. Para recuperarlo sin
internet, abre Git Bash en la carpeta que contiene API-PROYECTO y versionamiento:

```bash
git clone --branch evidencia-aa5-api-proyecto versionamiento/RaizVolt.bundle Proyecto_Git
cd Proyecto_Git/API-PROYECTO
git log --oneline -- .
```

`VERSIONAMIENTO.txt` del ZIP identifica el commit remoto publicado y el commit
local del bundle. Ambos contienen los mismos archivos finales de API-PROYECTO;
las identidades de commit difieren porque la publicación conserva como padre
la última revisión remota del ejercicio de autenticación.

La carpeta API-PROYECTO es autónoma; no necesitas ejecutar las carpetas históricas.
Para guardar y publicar modificaciones propias desde una copia clonada de GitHub:

```bash
git add .
git commit -m "Actualizar servicios de RaizVolt"
git push origin evidencia-aa5-api-proyecto
```

## Relación con las evidencias anteriores

Se reutilizan los auxiliares de contraseñas, errores y limitación de intentos
de AA5-EV01 y se amplía el inicio de sesión con tokens y roles. Del catálogo
AA4-EV03 se mantienen los campos del producto, las cinco categorías y los casos
de registrar, consultar, actualizar y retirar productos.

Esta API tiene persistencia SQLite independiente. No migra automáticamente la
base H2 ni sustituye el servidor Spring Boot del front-end React anterior. El
formato y la autenticación cambian; la futura integración React requiere adaptar
su cliente HTTP. El alcance exacto y sus diferencias constan en `docs/DISENO.md`.

## Alcance académico

Implementación local del catálogo y flujo de venta de RaízVolt. Los precios y
contactos de ejemplo son ficticios. El total suma productos; no calcula impuestos,
flete, pagos, facturación electrónica ni trámites aduaneros. El estado ENVIADO lo
registra el administrador; no conecta con una transportadora. No es una tienda
publicada en internet. Escucha únicamente en `127.0.0.1`.

## Numeración de la entrega

El texto recibido solicita nombrar el ZIP **NOMBRE_APELLIDO_AA5_EV01**; por eso
se usa `JHON_EDWARDS_TINEO_LANDAETA_AA5_EV01.zip`. El adjunto se anunció como
`IE-GA7-220501096-AA5-EV03.pdf`, pero no estuvo disponible para lectura. Esta
es una entrega nueva, independiente del ejercicio anterior de autenticación.
Si el instructor confirma EV03, basta renombrar el ZIP y la carpeta contenedora
a `JHON_EDWARDS_TINEO_LANDAETA_AA5_EV03`; el código y sus rutas no cambian.
