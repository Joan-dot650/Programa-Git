# RaízVolt · Catálogo con Spring Boot

**Evidencia:** GA7-220501096-AA3-EV01
**Aprendiz:** Jhon Edwards Tineo Landaeta
**Programa:** Análisis y Desarrollo de Software (ADSO) · Ficha 3235874
**Centro:** Regional Antioquia
**Fecha:** 26 de octubre de 2026

Módulo web para registrar, consultar, actualizar y eliminar productos de un catálogo
de soluciones solares. Continúa `raizvolt-web` (AA2-EV02) con el framework
**Spring Boot 4.0.9**, Spring MVC, Thymeleaf y Spring JDBC. Almacena los datos en H2
en disco. El dinero se representa con `BigDecimal` y `DECIMAL(12,2)`.

## Ejecutar el ZIP en Windows

1. Extraer **toda** la carpeta ZIP antes de abrir los archivos.
2. Tener instalado Java 17 o superior (se recomienda JDK 17 o JDK 21).
3. Abrir esta carpeta `raizvolt-spring` y hacer doble clic en `ejecutar.bat`.
4. Esperar el mensaje `Started RaizVoltAplicacion`.
5. Abrir <http://localhost:8080/raizvolt/productos>.

El ZIP incluye `dist/raizvolt-spring.jar`, con servidor y dependencias. Para ejecutarlo
no se necesitan Maven, XAMPP, MySQL ni conexión a Internet una vez instalado Java.
La base comienza vacía; se crea en `datos/` y conserva los cambios al reiniciar.
Detener con **Ctrl+C**. No abrir la aplicación directamente desde el ZIP.

Linux/macOS: `sh ejecutar.sh`. El JAR es multiplataforma; los lanzadores Windows
se incluyen para facilitar el inicio, aunque las pruebas de ejecución se realizaron
en Linux con Java 17.

## Compilar y probar desde el repositorio

Requiere **JDK 17 o superior** y conexión a Internet la primera vez. Se incluye
Maven Wrapper: no es necesario instalar Maven por separado.

```bat
compilar.bat
ejecutar.bat
```

`compilar.bat` ejecuta `mvnw.cmd clean verify` y copia el JAR a `dist/`.
Para ejecutar solo las pruebas: `pruebas.bat`.
En Linux/macOS: `sh compilar.sh` o `sh pruebas.sh`.
Los resultados de JUnit quedan en `target/surefire-reports/`.

## Funciones y reglas

- Registrar un producto con código único, nombre, categoría, precio y existencias.
- Buscar por código o nombre, sin distinguir mayúsculas.
- Editar sin cambiar el identificador de la fila.
- Mostrar confirmación antes de eliminar; cancelar no modifica los datos.
- Rechazar precios inválidos, stock negativo, códigos repetidos y categorías ajenas al catálogo.
- Conservar la información del formulario cuando se detecta un error.
- Mostrar referencias, unidades, stock bajo y valor de las existencias de la lista filtrada.

## Estructura

| Ruta | Responsabilidad |
| --- | --- |
| `pom.xml` | Framework, dependencias y compilación reproducible con Maven. |
| `src/main/java/co/raizvolt/modelo` | Producto inmutable y categorías heredadas. |
| `src/main/java/co/raizvolt/servicio` | Reglas de negocio heredadas. |
| `src/main/java/co/raizvolt/dao` | Contrato DAO y persistencia con JdbcTemplate. |
| `src/main/java/co/raizvolt/config` | Inyección de dependencias, idioma y CSRF. |
| `src/main/java/co/raizvolt/web` | Controlador MVC, DTO y manejo de errores. |
| `src/main/resources/templates` | Vistas HTML con Thymeleaf. |
| `src/main/resources/static/assets` | Estilos y símbolo visual de AA2-EV02. |
| `src/main/resources/schema.sql` | Creación no destructiva de la tabla. |
| `src/test` | Pruebas del CRUD, validación, seguridad y persistencia. |
| `docs` | Guía, diseño, estándares, pruebas y referencias. |
| `dist` | Ejecutable incluido únicamente en el ZIP. |

## Alcance

Aplicación académica para un operador en su equipo. Escucha en `127.0.0.1`;
no incluye usuarios, autenticación, compras, pagos, cotizaciones ni publicación en Internet.
Spring Security protege los formularios con CSRF; las vistas escapan el HTML y
el DAO usa parámetros SQL. La base de esta entrega es independiente de AA2-EV02;
no importa ni modifica automáticamente sus registros.

## Versionamiento

Repositorio: <https://github.com/Joan-dot650/Programa-Git>.
Rama de esta evidencia: [`evidencia/aa3-ev01-raizvolt-spring`](https://github.com/Joan-dot650/Programa-Git/tree/evidencia/aa3-ev01-raizvolt-spring).

El nuevo módulo está en `raizvolt-spring/`. La rama conserva los módulos anteriores
como antecedente. El ZIP contiene el módulo de esta evidencia, las instrucciones,
el enlace directo y un archivo `repositorio.bundle` con el historial Git.
Los datos locales y los binarios se excluyen del código versionado.

Para obtener el código desde GitHub:

```bash
git clone --branch evidencia/aa3-ev01-raizvolt-spring https://github.com/Joan-dot650/Programa-Git.git
cd Programa-Git/raizvolt-spring
```

Lee primero [la guía de ejecución](docs/GUIA_PASO_A_PASO.md).
