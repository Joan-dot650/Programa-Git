# RaízVolt Web

Catálogo solar con Java 17, Servlet 6.0, JSP 3.1, JSTL 3.0, Tomcat 10.1.61 y H2
2.5.250. Persistencia JDBC reutilizada de EV01. Precios de demostración en COP.

## Ejecución rápida con el ZIP

Windows: doble clic en `ejecutar.bat`. Linux/macOS: `bash ejecutar.sh`.
Abrir `http://localhost:8080/raizvolt/productos`. Se requiere Java 17 o superior.
La base de datos comienza vacía, se crea automáticamente y persiste en `datos/`.

La aplicación integrada escucha en **127.0.0.1** y no requiere Internet para
funcionar una vez disponibles Java y las bibliotecas incluidas. Los formularios
funcionan sin JavaScript. El archivo `.bat` mantiene visible la consola.

## Preparar desde un clon Git

Se necesita JDK 17+ y acceso a Maven Central para descargar las dependencias.

```bat
descargar_dependencias.bat
compilar.bat
pruebas.bat
ejecutar.bat
```

En Linux/macOS sustituir cada comando por `bash nombre.sh`.
`dependencias.tsv` fija URL y SHA-256. El descargador omite archivos ya verificados.
`Compilar.java` usa el compilador del JDK y genera el JAR y el WAR sin Maven.

## Organización

| Ruta | Contenido |
| --- | --- |
| `src/main/java/co/raizvolt/web` | Servlet, filtro UTF-8 y listener de inicio. |
| `src/main/java/co/raizvolt/modelo` | Producto y Categoria. |
| `src/main/java/co/raizvolt/servicio` | Reglas y validación. |
| `src/main/java/co/raizvolt/dao` | CRUD con PreparedStatement. |
| `src/main/java/co/raizvolt/config` | Configuración y conexión JDBC. |
| `src/main/webapp/WEB-INF/vistas` | Listado, formulario, confirmación y errores JSP. |
| `src/main/webapp/WEB-INF/web.xml` | Mapeo `/productos`, filtro y listener. |
| `src/main/resources/sql/esquema.sql` | Tabla local H2. |
| `src/test/java` | Pruebas JDBC y pruebas HTTP con Tomcat real. |
| `lib` y `dist` | Bibliotecas y compilados incluidos en el ZIP. |
| `docs` | Guía, trazabilidad, pruebas y fuentes. |

## WAR opcional

`compilar` también genera `dist/raizvolt.war`, compatible con Tomcat 10.1.x y JDK 17+.
Copiarlo en `webapps` de ese Tomcat y abrir `/raizvolt/productos`. El WAR contiene
las clases de aplicación, las JSP, H2, MySQL y JSTL; utiliza las API del contenedor.
Para fijar configuración y datos en otra carpeta, iniciar el servidor con
`-Draizvolt.baseDir=RUTA_ABSOLUTA`. Por defecto se usa el directorio de trabajo del
servidor. La opción integrada con `ejecutar` resulta más sencilla para esta entrega.
No usar Tomcat 9: este código importa `jakarta.servlet`.

## Base de datos opcional MySQL

H2 es la opción predeterminada y probada. Se conserva de EV01 el soporte para
MySQL: importar `database/mysql.sql`, crear una copia local de
`config/database.properties.example` como `config/database.properties` y completar
las credenciales locales. Este archivo privado está ignorado por Git. Las variables
`RAIZVOLT_DB_URL`, `RAIZVOLT_DB_USER` y `RAIZVOLT_DB_PASSWORD` tienen prioridad sobre
el archivo. MySQL no se ejecutó en la validación de EV02.

La propiedad `raizvolt.db.url` permite a las pruebas usar H2 temporal sin tocar los
datos de la aplicación. No existe migración automática desde la base de EV01.

## Alcance

Módulo académico para un operador local; no incluye autenticación, ventas o pagos.
Incluye validación HTML y de servidor, escape de salida con `c:out`, consultas
parametrizadas, CSRF y Post/Redirect/Get. Cada operación abre y cierra su propia
conexión. El stock bajo es un aviso con umbral de 5 unidades.
