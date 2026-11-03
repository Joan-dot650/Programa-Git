# Verificación de la API RaízVolt

**Resultado:** 56 pruebas aprobadas, 0 fallidas, 0 omitidas.

Ejecución: 2 de noviembre de 2026 (Colombia). Entorno: Linux, Node.js 24.22.1.
Se utilizaron puertos efímeros y bases SQLite temporales. No se usaron cuentas
reales ni se alteró la base del usuario. El registro completo está en
`RESULTADOS_PRUEBAS.txt` (formato TAP).

## Repetir la ejecución

Desde API-PROYECTO:

```text
node --test tests/api.test.js tests/coleccion.test.js
```

No es necesario mantener otra instancia del servidor abierta. Cada prueba HTTP
utiliza un servidor real de la aplicación; no simula las respuestas del backend.

## Cobertura funcional

| Área | Comprobaciones |
|---|---|
| Registro | Normalización, duplicados, concurrencia, tipos, límites y rechazo de escalamiento a ADMIN. |
| Login y sesión | Credenciales erróneas, tokens, almacenamiento de hash, revocación, expiración y límite de intentos. |
| Perfil | Datos propios, teléfono, tildes y campos prohibidos. |
| Productos | CRUD, baja lógica, código único, precios, cantidades, categoría y caracteres. |
| Consulta | Filtros literales, tildes, paginación, parámetros duplicados y métodos HTTP. |
| Inventario | Ajustes, saldo no negativo, auditoría y totales superiores al entero seguro de JavaScript. |
| Cotizaciones | Precio del servidor, conservación de precios, cantidades, repetidos, propiedad y vigencia. |
| Pedidos | Perfil completo, reserva atómica, reintento idempotente, concurrencia y última unidad disponible. |
| Estados | Permisos, transiciones, devolución única y rollback de cancelación multiartículo. |
| Historial | Dirección preservada, producto retirado y persistencia tras reinicio. |
| Protocolo | JSON/UTF-8 inválidos, tipo de contenido, compresión, cuerpo grande y cabeceras de seguridad. |
| Documentación | Coincidencia de las 23 operaciones OpenAPI con las rutas y entrega HTTP del manual. |
| Colección | Recorrido completo de las 34 solicitudes incluidas, en orden, con aserciones de estado HTTP. |

`api.test.js` aporta 55 pruebas. `coleccion.test.js` aporta una prueba de recorrido
que verifica los 34 estados esperados. No se suman esas 34 comprobaciones como
34 pruebas independientes al total de 56.

## Alcance de la comprobación de Postman

La colección se reprodujo mediante HTTP con Node.js. El adaptador del test
implementa únicamente el pequeño subconjunto de `pm` usado por los scripts de
esta colección. No se ejecutó la aplicación Postman en este entorno y no se
presentan capturas ni un video como si se hubiera ejecutado allí. Para usar
Postman, seguir README.md, importar la colección y ejecutarla en orden.

La actividad recibida solicita proyecto, documentación y enlace del repositorio;
no solicita video. Se incluye la colección como apoyo para consumo y revisión.

## Límites de la validación

Las pruebas comprueban la funcionalidad local especificada, no certifican
seguridad de producción, carga masiva, infraestructura pública ni integración
con la interfaz React/H2 anterior. Los scripts .bat se proporcionan para Windows;
la ejecución automatizada registrada se realizó en Linux.
