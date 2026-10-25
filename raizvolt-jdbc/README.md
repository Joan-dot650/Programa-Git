# RaízVolt · Módulo de productos con JDBC

**Evidencia:** GA7-220501096-AA2-EV01

**Aprendiz:** Jhon Edwards Tineo Landaeta

**Programa:** Análisis y Desarrollo de Software · Ficha 3235874 · Regional Antioquia

**Fecha:** 24 de octubre de 2026

Aplicación de escritorio en Java 17 para administrar productos de energía solar:
registrar, consultar por código o nombre, actualizar y eliminar con confirmación.
Los datos se guardan realmente mediante JDBC. H2 local es el modo predeterminado;
se incluye el esquema y la configuración opcional para MySQL.

## Inicio en Windows

1. Extrae el ZIP completo. No ejecutes archivos dentro de la vista comprimida.
2. Instala **JDK 17 o superior**, si aún no lo tienes.
3. Abre la carpeta **raizvolt-jdbc** y haz doble clic en **ejecutar.bat**.
4. Completa el formulario y pulsa **Registrar**. La tabla empieza vacía.

El ZIP incluye el JAR compilado y los dos controladores. No requiere Maven,
XAMPP ni un servidor para usar H2. Los datos se crean en datos/raizvolt.mv.db.
Abre una sola instancia del programa para trabajar con esta base local.

En una copia solo con el código fuente, ejecutar.bat compila y descarga las dependencias faltantes;
la primera preparación necesita Internet. Las descargas se verifican con SHA-256.

## Compilar y probar

En PowerShell, dentro de raizvolt-jdbc, ejecuta cada línea por separado:

```powershell
java -version
javac -version
.\compilar.bat
.\pruebas.bat
.\ejecutar.bat
```

En Linux o macOS: bash compilar.sh, bash pruebas.sh y bash ejecutar.sh.
Para iniciar la ventana se necesita una sesión de escritorio. Las pruebas
funcionan sin pantalla y utilizan bases independientes de los datos del usuario.

## Organización

| Ruta | Contenido |
| --- | --- |
| src/main/java/co/raizvolt/modelo | Producto y categorías |
| src/main/java/co/raizvolt/config | Configuración, conexión e inicialización |
| src/main/java/co/raizvolt/dao | Sentencias SQL de las cuatro operaciones CRUD |
| src/main/java/co/raizvolt/servicio | Validaciones y reglas del módulo |
| src/main/java/co/raizvolt/interfaz | Formulario, tabla y diálogos Swing |
| src/main/resources/sql | Esquema H2, creado automáticamente |
| src/test/java | Pruebas de integración e interfaz |
| database/mysql.sql | Esquema opcional MySQL |
| config/database.properties.example | Plantilla para MySQL, sin credenciales reales |
| lib | Controladores y licencias de terceros |
| docs | Guía, diseño, estándar, trazabilidad y resultados |

## Documentación

- [Guía paso a paso](docs/GUIA_PASO_A_PASO.md)
- [Diseño y trazabilidad](docs/DISENO_Y_TRAZABILIDAD.md)
- [Estándar de código Java](docs/ESTANDAR_CODIFICACION.md)
- [Pruebas y alcance de la verificación](docs/PRUEBAS.md)
- [Dependencias y licencias](lib/TERCEROS.md)

## Alcance

Módulo académico de un solo catálogo. No incluye autenticación, cotizaciones,
ventas, importaciones, proveedores ni operación de varios usuarios sobre H2.
Cambiar de H2 a MySQL cambia la base utilizada; no migra automáticamente los datos.
La integración con MySQL requiere un servidor configurado por el usuario.

## Repositorio de la evidencia

[Código publicado en GitHub](https://github.com/Joan-dot650/Programa-Git/tree/evidencia/aa2-ev01-raizvolt/raizvolt-jdbc)

Rama: evidencia/aa2-ev01-raizvolt. Carpeta: raizvolt-jdbc.
El ZIP final conserva la copia Git de esta rama en su carpeta raíz y añade el
JAR compilado y los controladores para facilitar la ejecución.
