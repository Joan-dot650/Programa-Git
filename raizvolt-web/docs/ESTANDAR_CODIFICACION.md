# Estándar de codificación aplicado

Continuidad con el estándar documentado en EV01.

| Elemento | Regla | Ejemplo |
| --- | --- | --- |
| Paquetes | Minúsculas, separados por responsabilidad | co.raizvolt.web |
| Clases / interfaces | PascalCase | ProductoServlet, ProductoDao |
| Variables / métodos | camelCase, nombres descriptivos | productoServicio, consultarProductos |
| Constantes | MAYUSCULAS_CON_GUIONES | PRECIO_MAXIMO |
| Archivos | UTF-8; Java coincide con su clase pública | ProductoServlet.java |
| Sangría | 2 espacios en Java | .editorconfig |
| Dinero | BigDecimal y DECIMAL | precio |
| Recursos JDBC | try-with-resources | Connection, PreparedStatement, ResultSet |
| SQL | Valores mediante parámetros ? | Sin concatenar entrada del formulario |
| Vistas | Presentación en JSP; reglas en el servicio | c:out, c:forEach, EL |
| Comentarios | Explican decisiones relevantes | Separación GET/POST y PRG |
| Excepciones | Mensaje útil; registro técnico en servidor | ErrorPersistencia |

Se conserva el contrato DAO de EV01 y se añade el paquete web. Los servlets no
guardan campos de formulario en atributos de instancia. Cada operación JDBC
abre/cierra una conexión; el objeto Producto es inmutable. Las credenciales locales,
las bases de datos y los archivos compilados están excluidos de Git.
