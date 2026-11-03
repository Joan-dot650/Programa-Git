# Pruebas de la API de autenticación - AA5-EV02

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874  
**Programa:** Análisis y Desarrollo de Software · SENA  
**Evidencia:** GA7-220501096-AA5-EV02

## Resultado comprobado el 2 de noviembre de 2026

40 pruebas de integración y 25 solicitudes con 140 verificaciones aprobadas, sin fallos. La API procede de AA5-EV01. Requiere Node.js 24 o posterior.

**Alcance visual:** las capturas y el video muestran la colección de Postman ejecutada. El informe PDF está completo con los resultados disponibles; no contiene espacios de una plantilla vacía.

## Ejecutar en Windows

1. Extrae el ZIP y abre `AA5-EV02`.
2. Haz doble clic en `INICIAR_WINDOWS.bat` y mantén la ventana abierta.
3. Abre http://127.0.0.1:3000. Detén el servidor con Ctrl+C.

También puedes ejecutar `node src/server.js` desde una terminal de VS Code dentro de la carpeta. No necesitas MySQL, XAMPP ni Live Server. La aplicación crea la base SQLite local al iniciarse.

## Repetir las pruebas

En PowerShell:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd test
npm.cmd run test:postman
```

La prueba de la colección crea una API temporal, usa una base en memoria y cierra el servidor al finalizar. No altera las cuentas de tu aplicación. El nuevo reporte se guarda en `resultados/EJECUCION_LOCAL.json`.
## Archivos de entrega

| Archivo o carpeta | Contenido |
|---|---|
| `src/`, `public/`, `tests/` | Código comentado, interfaz y 40 pruebas de integración. |
| `postman/` | Colección v2.1 de 25 casos, entorno y matriz de datos. |
| `documentos/INFORME_PRUEBAS_AA5_EV02.pdf` | Informe actualizado y capturas de potsman. |
| `video/PRUEBAS_POSTMAN_.mp4` | Video complementario de 1:58. |
| `resultados/VERIFICACION_*_2026_11_02.*` | Reportes de la comprobación más reciente. |
| `ENDPOINT.txt` | Métodos, URL, cuerpos y respuestas. |
| `docs/openapi.json` | Contrato OpenAPI 3.1.0. |
| `ENLACE_REPOSITORIO.txt` | Enlace al repositorio y a esta carpeta. |

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/salud` | Consultar disponibilidad. |
| POST | `/api/registro` | Crear una cuenta. |
| POST | `/api/login` | Comprobar credenciales. |
| GET | `/api/openapi.json` | Consultar el contrato. |

La URL base habitual es `http://127.0.0.1:3000`. El servicio verifica las credenciales, pero no genera JWT ni mantiene una sesión. Los datos de prueba son ficticios.


## Versionamiento

Repositorio de referencia: https://github.com/Joan-dot650/Programa-Git


## Referencias

- https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman
- https://learning.postman.com/docs/getting-started/installation/install-app
