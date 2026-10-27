# Estándar de codificación

Se mantiene el estándar del módulo anterior y se aplica a la adaptación con Spring.

| Elemento | Convención aplicada | Ejemplo |
| --- | --- | --- |
| Paquetes | Minúsculas y responsabilidad separada | `co.raizvolt.servicio` |
| Clases e interfaces | PascalCase, una clase pública por archivo | `ProductoControlador`, `ProductoDao` |
| Variables y métodos | camelCase y nombre descriptivo | `productoServicio`, `registrarProducto` |
| Constantes | Mayúsculas separadas por guion bajo | `PRECIO_MAXIMO`, `COLUMNAS` |
| Formato | UTF-8, sangría de 2 espacios, fin de línea controlado | `.editorconfig`, `.gitattributes` |
| Comentarios | Javadoc de responsabilidad y explicación de decisiones | CSRF, PRG, inyección de dependencias y SQL parametrizado. |
| Capas | Controlador recibe; servicio valida; DAO persiste; vista presenta | Sin SQL en HTML y sin HTML en el DAO. |
| Dependencias | Constructor o bean explícito | `ProductoDaoSpring(JdbcTemplate jdbcTemplate)` |
| Dinero | BigDecimal y DECIMAL, sin double | `Producto.precio` |
| SQL | Parámetros para valores; restricciones de integridad | `WHERE id = ?`, `UNIQUE(codigo)` |
| Datos de entrada | DTO limitado, normalización y validación de servidor | `FormularioProducto`, `setAllowedFields` |
| HTML | Texto escapado, etiquetas y ayudas asociadas | `th:text`, `label for`, `aria-describedby` |
| Errores | Mensajes útiles sin mostrar SQL al navegador | `ManejadorErrores` |
| Git | Cambios descriptivos y exclusión de datos generados | `feat: ...`, `docs: ...`, `.gitignore` |

Spring JDBC administra la apertura y cierre de recursos. Las operaciones de este
módulo modifican una sola fila por sentencia, de forma atómica. No se implementan
transacciones de ventas o pedidos, pues quedan fuera del alcance de esta evidencia.

Las validaciones de HTML ayudan al usuario; las reglas del servicio se ejecutan
también cuando una petición no procede del navegador. El código se puede ejecutar
sin JavaScript y sin dependencias visuales descargadas desde un CDN.
