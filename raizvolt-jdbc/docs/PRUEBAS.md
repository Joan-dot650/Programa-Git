# Registro de pruebas de la entrega

Fecha local: 24 de octubre de 2026. Entorno de verificación: Linux,
OpenJDK 17.0.20 y H2 2.5.250. Código compilado para Java 17 con -Xlint:all.

## Resultado

**40 verificaciones JDBC y 10 verificaciones de interfaz aprobadas.**

| Grupo | Qué se comprobó |
| --- | --- |
| CRUD | INSERT con ID automático, consulta por ID/nombre/código, UPDATE del registro elegido y DELETE sin alterar los demás |
| Persistencia | Recuperación de valores después de cerrar conexiones y abrir una nueva instancia; esquema idempotente |
| Integridad | Código único, restricciones de la base, precio decimal exacto, límites de existencias |
| Entradas inválidas | Campos vacíos, categoría ausente, precio no válido y stock negativo, decimal o fuera del rango |
| Consultas seguras | Apóstrofes, comodines literales e intento de inyección tratado como datos |
| Errores | Conexión no disponible, ID ausente y operaciones sin selección |
| Interfaz | Registrar, seleccionar, actualizar, buscar, mostrar todo, cancelar/confirmar eliminación y selección tras ordenar |

Los programas están en src/test/java/co/raizvolt/pruebas. No son capturas
inventadas: ejercitan el servicio, el DAO y los componentes Swing reales.
La salida textual completa está en RESULTADOS_PRUEBAS.txt.

## Límites de la comprobación

- JDBC se ejecutó contra H2 real, con archivo temporal en la prueba de persistencia.
- El panel Swing se probó y renderizó en modo headless (sin pantalla física).
  Las respuestas de los diálogos se simularon para verificar ambas rutas.
- La imagen del panel muestra tres productos ficticios preparados por la prueba.
  La aplicación entregada inicia con el catálogo vacío.
- Los comandos de compilación y las pruebas se ejecutaron en Linux. Los lanzadores
  .bat se revisaron, pero no se ejecutaron en un equipo Windows durante esta preparación.
- Se incluye MySQL Connector/J 9.5.0, configuración y esquema SQL.
- 
## Reproducir

Windows: abrir PowerShell dentro de raizvolt-jdbc y ejecutar .\pruebas.bat.
Linux/macOS: bash pruebas.sh. Se esperan los dos mensajes RESULTADO con 40 y 10.
La prueba de integración elimina únicamente su directorio temporal propio.
La base de uso normal datos/raizvolt.mv.db permanece separada.

## Revisión manual sugerida

Registrar PAN-550, buscarlo, actualizar existencias de 12 a 9, cerrar y abrir,
y finalmente probar Cancelar y Eliminar. La guía contiene los pasos completos.
