# Pruebas de la API de autenticación - AA5-EV02

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874  
**Programa:** Análisis y Desarrollo de Software · SENA  
**Evidencia:** GA7-220501096-AA5-EV02

## Resultado comprobado el 1 de noviembre de 2026

40 pruebas de integración y 25 solicitudes con 140 verificaciones aprobadas, sin fallos. La API procede de AA5-EV01. Requiere Node.js 24 o posterior; se volvió a comprobar con Node.js 24.22.1.

**Alcance visual:** las capturas y el video muestran la colección de Postman ejecutada mediante Newman 6.2.1 en consola. Falta añadir las capturas y la grabación de Postman de escritorio requeridas por la guía. El informe PDF y Word está completo con los resultados disponibles; no contiene espacios de una plantilla vacía.

## Ejecutar en Windows

1. Extrae el ZIP y abre `AA5-EV02`.
2. Haz doble clic en `INICIAR_WINDOWS.bat` y mantén la ventana abierta.
3. Abre http://127.0.0.1:3000. Detén el servidor con Ctrl+C.

También puedes ejecutar `node src/server.js` desde una terminal de VS Code dentro de la carpeta. No necesitas MySQL, XAMPP ni Live Server. La aplicación crea la base SQLite local al iniciarse. Las cuentas reales de tu copia no se incluyen en esta entrega.

## Repetir las pruebas

En PowerShell:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd test
npm.cmd run test:postman
```

La prueba de la colección crea una API temporal, usa una base en memoria y cierra el servidor al finalizar. No altera las cuentas de tu aplicación. El nuevo reporte se guarda en `resultados/EJECUCION_LOCAL.json`. También puedes usar `EJECUTAR_PRUEBAS_NEWMAN.bat`.

## Archivos de entrega

| Archivo o carpeta | Contenido |
|---|---|
| `src/`, `public/`, `tests/` | Código comentado, interfaz y 40 pruebas de integración. |
| `postman/` | Colección v2.1 de 25 casos, entorno y matriz de datos. |
| `documentos/INFORME_PRUEBAS_AA5_EV02.pdf` | Informe actualizado y capturas de consola. |
| `documentos/INFORME_PRUEBAS_AA5_EV02.docx` | El mismo informe completo y editable en Word. |
| `documentos/capturas/` | Capturas conservadas de la ejecución con Newman. |
| `video/PRUEBAS_POSTMAN_NEWMAN.mp4` | Video complementario de 2:59.8, sin audio. |
| `resultados/VERIFICACION_*_2026_11_01.*` | Reportes de la comprobación más reciente. |
| `ENDPOINT.txt` | Métodos, URL, cuerpos y respuestas. |
| `docs/openapi.json` | Contrato OpenAPI 3.1.0. |
| `ENLACE_REPOSITORIO.txt` | Enlace al repositorio y a esta carpeta. |
| `GUIA_POSTMAN_WINDOWS.md` | Instalación, importación, capturas y guion de grabación. |

## Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/api/salud` | Consultar disponibilidad. |
| POST | `/api/registro` | Crear una cuenta. |
| POST | `/api/login` | Comprobar credenciales. |
| GET | `/api/openapi.json` | Consultar el contrato. |

La URL base habitual es `http://127.0.0.1:3000`. El servicio verifica las credenciales, pero no genera JWT ni mantiene una sesión. Los datos de prueba son ficticios.

## Repetir en Postman de escritorio

Sigue `GUIA_POSTMAN_WINDOWS.md`: inicia la API, importa la colección y el entorno, selecciona `baseUrl`, ejecuta CP01 a CP25 en orden y conserva las respuestas para capturarlas. Antes de cada ejecución completa reinicia la API. CP25 debe devolver HTTP 429: corresponde al intento 21 de autenticación desde una IP dentro de 10 minutos. No envíes otros POST durante esa secuencia.

La colección entregada usa JSON v2.1, compatible con Newman 6.2.1. Conserva este archivo original si tu versión de Postman convierte las colecciones a otro formato.

## Versionamiento

Repositorio de referencia: https://github.com/Joan-dot650/Programa-Git

**Publicación pendiente.** Los archivos nuevos están preparados localmente para la rama `evidencia-aa5-ev02`, carpeta `AA5-EV02`. La revisión automática de aprobación bloqueó su publicación. El ZIP incluye el código completo, `versionamiento/Programa-Git.bundle` y el historial de commits.

## Referencias

- https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman
- https://learning.postman.com/docs/getting-started/installation/install-app
