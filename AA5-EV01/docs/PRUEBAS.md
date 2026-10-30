# Registro de verificación

**Fecha:** 30 de octubre de 2026.  
**Entorno ejecutado:** Node.js v24.22.1 sobre Linux.  
**Comando:** `node --test tests/api.test.js` (equivalente a `npm test`).  
**Resultado:** 40 pruebas aprobadas; 0 fallidas, canceladas u omitidas.

Son pruebas de integración: se inicia un servidor real en un puerto libre y se
envían solicitudes HTTP mediante `fetch`. Se utilizan bases SQLite temporales.
Las pruebas no dependen de una cuenta precargada y no tocan `data/usuarios.sqlite`.
La salida completa está en `RESULTADOS_PRUEBAS.txt`.

## Matriz de trazabilidad

| Indicador del instrumento SENA | Implementación | Verificación |
|---|---|---|
| Servicio para registro | `POST /api/registro`, `auth-service.js` y `user-repository.js` | Alta 201, duplicados 409, dos solicitudes simultáneas crean una sola cuenta. |
| Servicio para inicio de sesión | `POST /api/login` y `passwords.js` | Credenciales correctas 200; usuario inexistente o contraseña incorrecta 401. |
| Validaciones de verificación | `validation.js`, `app.js` y `rate-limit.js` | Tipos, caracteres, longitudes, cuerpo, método, formato y límites comprobados. |
| Herramientas de versionamiento | Git y GitHub; rama `evidencia-aa5-ev01` | Diseño, implementación y pruebas/documentación registrados en commits publicados. |

## Escenarios ejecutados

| Grupo | Casos comprobados |
|---|---|
| Operaciones principales | Registro, autenticación correcta, contraseña incorrecta, cuenta inexistente, usuario duplicado y normalización del nombre. |
| Entradas inválidas | Campos ausentes, usuario vacío/corto/largo/no textual/con espacios internos/con inicio inválido, intento de inyección SQL, contraseña corta/larga/en blanco/no textual, campo adicional, objeto nulo y arreglo. Cada uno se prueba en ambas rutas. |
| Límites y exactitud | Longitudes mínima y máxima, caracteres especiales y conservación de espacios y mayúsculas de la contraseña. |
| Persistencia y concurrencia | Dos registros simultáneos, hashes distintos para una contraseña igual y autenticación después de reabrir la base. |
| Protocolo HTTP | JSON mal formado, UTF-8 inválido, tipo de contenido incorrecto, compresión no admitida, cuerpo excesivo, método incorrecto y ruta inexistente. |
| Recursos y protección | Base y fuentes no expuestas, recursos del cliente disponibles, cabeceras de seguridad y contrato OpenAPI servido. |
| Control de intentos | Se bloquea la solicitud 21 y se admiten intentos nuevos cuando vence la ventana. |

## Repetición manual

Sigue la tabla de demostración de `README.md`. También puedes importar la
colección Postman y ejecutar sus cinco solicitudes en orden. La colección trae
aserciones del código HTTP y el mensaje esperado.

El script de inicio para Windows se entrega para facilitar la ejecución; las
pruebas automatizadas se ejecutaron en Linux, no en un equipo Windows. Las rutas
del código se construyen con APIs portables de Node.js.
