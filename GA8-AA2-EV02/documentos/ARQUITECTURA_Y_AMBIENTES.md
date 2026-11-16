# Arquitectura y ambientes

| Paquete | Capa | Responsabilidad |
| --- | --- | --- |
| `com.jhontineo.raizvolt.ui` | Presentación | MainActivity maneja eventos y navegación. Ui reutiliza campos, botones y tarjetas. |
| `com.jhontineo.raizvolt.domain` | Dominio | CatalogService, ProfileService, SalesService, Cart, Rules, modelos y contrato Store. |
| `com.jhontineo.raizvolt.data` | Datos | LocalStore implementa Store con SQLiteOpenHelper. |
| `com.jhontineo.raizvolt` | Ensamblaje | App crea servicios, repositorio y ejecutor serial. |

Repository separa servicios de datos. La inyección por constructor permite usar FakeStore en unitarias. La capa de servicios concentra validaciones y transacciones. Presentación con modelo/vista/controlador ligero; no se denomina MVVM ni Clean Architecture completa. Un ExecutorService mueve SQL fuera del hilo principal y los resultados vuelven a la UI.

Java 17 y Android Views nativas. XML para manifiesto, tema e icono. No se usan librerías externas de presentación. JUnit 4.13.2 solo para pruebas JVM. Gradle 8.11.1 y AGP 8.9.2; SDK/target 35, mínimo 23, Build-Tools 35.0.0. SQLiteOpenHelper se elige para practicar SQL explícito y transacciones; Android recomienda Room como abstracción para aplicaciones que crecen.

## Datos

| Tabla | Propósito |
| --- | --- |
| products | id, sku UNIQUE, nombre, categoría, precio, stock, active |
| profile | Cliente actual; id fijo 1 |
| quotes | Fecha y copia de datos del cliente |
| quote_lines | FK a quote y product; nombre, precio y cantidad congelados; clave compuesta |
| orders | FK única a quote; estado y fecha |
| movements | FK a product; variación, saldo, motivo y fecha |

Base normal: `raizvolt_mobile.db`, versión 1, en el directorio privado `databases` de la aplicación. Claves foráneas habilitadas; SQL con placeholders y ContentValues; transacciones con beginTransaction/setTransactionSuccessful/endTransaction. Baja lógica con active=0. No se incluyen bases de usuario ni claves privadas. Una futura versión de esquema necesita migración explícita; no hay migración desde el sistema web.

## Servidores

No requiere servidor HTTP, puerto, endpoint REST, MySQL, XAMPP ni credenciales. Opera localmente y sin permiso INTERNET. Las URL entregadas corresponden a GitHub y archivos descargables. La sincronización futura requeriría autenticación, contrato y resolución de conflictos; no se declara implementada.

## Ambientes

- Desarrollo reproducible: Android Studio compatible con AGP 8.9.2, JDK 17 y SDK 35.
- Compilación ejecutada: Linux, Azul Zulu 17.0.17, Gradle 8.11.1, Build-Tools 35.0.0.
- Unitarias: JVM/JUnit y FakeStore independiente por caso.
- Integración/aceptación: emulador Android 6.0 API 23 x86_64; bases integration_test.db y acceptance_ui.db; 480 × 900 px, 160 dpi.
- Windows y teléfono físico se documentan para reproducción; no se afirma que se hayan probado aquí. Target 35 no equivale a haber probado todas las versiones.

## Seguridad y datos

Base aislada por Android, sin cifrado propio. Sin permisos peligrosos, sin Internet. La actividad inicial es exportada para que el lanzador la abra. Copias automáticas y transferencia deshabilitadas. Es una herramienta individual sin autenticación propia. APK firmado para depuración académica. Desinstalar o borrar datos elimina los registros; no hay exportación/restauración de datos de usuario. Usar datos ficticios en la demostración.
