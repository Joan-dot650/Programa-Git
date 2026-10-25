# Estándar aplicado al módulo Java

## Continuidad con AA1-EV01 y AA1-EV02

Se revisaron el Informe técnico de plan de trabajo (21/10/2026) y el Informe
técnico sobre estándares de codificación (22/10/2026) de Jhon Tineo. Ambos
proponían desarrollo web; esta evidencia pide expresamente JDBC. Se concreta
por ello un módulo Java de escritorio, con separación de interfaz, servicio y
acceso a datos. Se conservan UTF-8, dos espacios, nombres descriptivos y Git.
Las reglas específicas de HTML/CSS/JavaScript se adaptan a Java; Prettier y
ESLint no se presentan como validadores del código Java.

| Elemento | Regla | Ejemplo real |
| --- | --- | --- |
| Paquetes | Minúsculas, dominio invertido y responsabilidad | co.raizvolt.servicio |
| Clases e interfaces | PascalCase, nombre descriptivo | ProductoServicio, ProductoDao |
| Variables y atributos | camelCase | idSeleccionado, existenciasTexto |
| Métodos | camelCase y acción | registrarProducto, buscarPorId |
| Constantes | UPPER_SNAKE_CASE y final | PRECIO_MAXIMO |
| Enumeraciones | Tipo PascalCase; valores UPPER_SNAKE_CASE | Categoria.PANEL_SOLAR |
| Archivos Java | Coinciden con la clase pública | Producto.java |
| SQL | Identificadores en minúscula; separador de palabras con guion bajo | chk_precio |

Los identificadores propios usan español sin tildes; se conservan las API Java
como getId, main, executeUpdate, SQLException y SwingWorker.

## Formato y responsabilidades

- Dos espacios por nivel, UTF-8, llaves en la misma línea y sin tabulaciones.
- Una clase pública por archivo y una responsabilidad principal por clase.
- Métodos cortos; comentarios para explicar decisiones, límites y recursos.
- Longitud orientativa de 80 caracteres; se admite mayor longitud si mejora la lectura.
- .editorconfig conserva el formato y .gitattributes normaliza los finales de línea.
- La interfaz no construye SQL. El servicio valida; el DAO persiste; el modelo
  transporta los valores de un producto.

## Acceso a datos y errores

- PreparedStatement separa instrucciones SQL de valores suministrados.
- try-with-resources cierra Connection, PreparedStatement y ResultSet.
- BigDecimal maneja precios con dos decimales; no se utiliza double para dinero.
- La base también impone PK, código UNIQUE, NOT NULL y restricciones CHECK.
- Las excepciones generan mensajes claros; no se muestran contraseñas ni URL
  de conexión en los diálogos. No existen bloques catch vacíos.
- La configuración real y datos locales están excluidos de Git.
- SwingWorker realiza operaciones fuera del hilo gráfico; la actualización
  de componentes ocurre en el hilo de eventos.

## Verificación y versionamiento

compilar.bat / compilar.sh usan javac --release 17 -encoding UTF-8 -Xlint:all.
pruebas.bat / pruebas.sh verifican JDBC y eventos del formulario.
El desarrollo conserva commits reales. La entrega se publica en la rama
evidencia/aa2-ev01-raizvolt de Programa-Git, en la carpeta raizvolt-jdbc.
El directorio .git del ZIP está en la raíz de la carpeta de entrega, un nivel
por encima del módulo. Revisa git log, git status y git remote -v.
