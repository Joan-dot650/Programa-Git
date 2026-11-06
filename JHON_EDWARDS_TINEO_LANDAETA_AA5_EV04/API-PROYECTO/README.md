# RaízVolt API del proyecto

Servicios REST en Node.js 24.x y SQLite, sin dependencias npm. Incluye autenticación, perfil, catálogo, inventario, cotizaciones y pedidos. Código base de AA5-EV03; pruebas de AA5-EV04 en la carpeta superior.

## Inicio

Desde la carpeta superior ejecuta `PREPARAR_POSTMAN_WINDOWS.bat` y `INICIAR_API_WINDOWS.bat`. Importa la colección y el entorno generados según `../documentacion/GUIA_POSTMAN_LOCAL.md`.

Desde una terminal situada aquí puedes ejecutar:

```text
node scripts/preparar-postman.js
node src/server.js
```

En otra terminal puedes comprobar el proyecto con:

```text
node --test tests/api.test.js tests/coleccion.test.js
```

La colección original de 34 solicitudes permanece en `ejemplos`. La colección ampliada de 56 solicitudes de AA5-EV04 está en `../postman`. Las pruebas Node no sustituyen el recorrido de Postman; ambos resultados se documentan por separado.

## Documentación

- `ENDPOINTS.txt`: 23 operaciones HTTP.
- `docs/openapi.json`: contrato OpenAPI 3.1.1.
- `docs/SERVICIOS.html`: documentación de cada servicio.
- `docs/DISENO.md` y el PDF de diseño en `docs`: documentos de AA5-EV03 recuperados de la revisión remota vigente.
- `../documentacion/INFORME_PRUEBAS_AA5_EV04.pdf`: resultados de esta entrega.

`DB_PATH` configura el archivo SQLite y `PORT` el puerto (3000 por defecto). Usa los mismos valores al preparar usuarios y arrancar la API. No uses Live Server para iniciar este servidor. No se incluyen cuentas, bases SQLite ni tokens activos en la entrega.

Consulta el README de la carpeta superior para el alcance y las limitaciones de la evidencia audiovisual. Las imágenes del registro CLI no se presentan como capturas de la aplicación de escritorio.
