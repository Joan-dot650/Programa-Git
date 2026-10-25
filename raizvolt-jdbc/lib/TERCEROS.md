# Dependencias fijadas

La entrega ZIP incluye los controladores sin modificar. En un clon de GitHub,
ejecuta descargar_dependencias.bat (Windows) o bash descargar_dependencias.sh.
La herramienta obtiene los artefactos de Maven Central y verifica SHA-256.

| Componente | Versión | Finalidad | Archivo de licencia |
| --- | --- | --- | --- |
| H2 Database Engine | 2.5.250 | Motor local y controlador JDBC | licencias/H2_LICENSE.txt |
| MySQL Connector/J | 9.5.0 | Conexión JDBC clásica con MySQL | licencias/MYSQL_LICENSE.txt |

Fuentes de los artefactos:

- https://repo.maven.apache.org/maven2/com/h2database/h2/2.5.250/
- https://repo.maven.apache.org/maven2/com/mysql/mysql-connector-j/9.5.0/

Código fuente y licencias de las versiones usadas:

- https://github.com/h2database/h2database/tree/version-2.5.250
- https://github.com/mysql/mysql-connector-j/tree/9.5.0

El proyecto usa la API JDBC clásica. No implementa funciones X DevAPI.
Los derechos sobre estas dependencias pertenecen a sus respectivos autores.
