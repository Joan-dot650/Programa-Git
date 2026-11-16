# RaízVolt Móvil - GA8-220501096-AA2-EV02

**Aprendiz:** Jhon Edwards Tineo Landaeta. **Ficha:** 3235874. **Programa:** Análisis y Desarrollo de Software. SENA, Regional Antioquia. **Fecha:** 16 de noviembre de 2026.

Aplicación Android nativa para un asesor individual de ventas de sistemas solares. Administra catálogo, inventario, cliente, carrito, cotizaciones y pedidos sin conexión. Conserva los conceptos del proyecto RaízVolt; su base móvil es independiente de la aplicación web anterior.

## Instalar y utilizar

1. Extraer completamente el ZIP.
2. Copiar `apk/RaizVoltMovil-debug.apk` a un teléfono Android 6.0 o superior.
3. Abrirlo. Si Android lo solicita, autorizar la instalación para la aplicación desde la que se abrió el APK.
4. Abrir **RaízVolt Móvil**. Los tres productos iniciales y sus precios son datos de demostración.
5. En **Cliente**, guardar nombre, teléfono, ciudad y dirección ficticios.
6. En **Catálogo**, añadir productos. En **Carrito**, modificar cantidades y guardar una cotización.
7. En **Cotizaciones**, confirmar el pedido; se descuenta inventario una sola vez.
8. En **Pedidos**, registrar envío y entrega, o cancelar mientras está pendiente. La cancelación devuelve las unidades.
9. Para administrar productos, usar **Nuevo producto** o **Gestionar**: editar, ajustar inventario con motivo y retirar del catálogo.

No se necesita usuario, contraseña, Internet, XAMPP ni servidor. El APK de pruebas no es necesario para usar la aplicación. No hay pagos ni envío real; el asesor registra manualmente los estados.

## Abrir en Android Studio

1. Instalar Android Studio desde https://developer.android.com/studio y preparar JDK 17.
2. En SDK Manager instalar Android SDK Platform 35, Build-Tools 35.0.0 y Platform-Tools. Instalar Emulator y una imagen del sistema si se usará un dispositivo virtual.
3. Elegir **Open** y abrir `proyecto/RaizVoltMovil`, donde está `settings.gradle`.
4. Configurar JDK 17 como Gradle JDK. Esperar la sincronización; se necesita Internet para descargar dependencias la primera vez.
5. El IDE crea `local.properties` con la ruta del SDK. No copiar rutas de otra computadora.
6. En Device Manager iniciar un emulador API 23 o superior, o conectar un teléfono con depuración USB.
7. Seleccionar `app` y pulsar **Run**.

En la terminal de Android Studio, Windows PowerShell:

```powershell
.\gradlew.bat testDebugUnitTest assembleDebug assembleDebugAndroidTest lintDebug
```

En Linux/macOS usar `./gradlew`. APK generado: `app/build/outputs/apk/debug/app-debug.apk`.

Para depurar, poner un breakpoint en `SalesService.confirm`, iniciar **Debug**, confirmar una cotización e inspeccionar sus líneas y stock. La entrega demuestra compilación por terminal y ejecución en emulador; el aprendiz debe repetir el manejo del IDE cuando lo solicite el instructor.

## Repetir las pruebas Android

Desde la carpeta del proyecto, con un emulador o teléfono conectado:

```powershell
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -r -w com.jhontineo.raizvolt.test/com.jhontineo.raizvolt.AcceptanceRunner
```

El runner propio usa bases aisladas `integration_test.db` y `acceptance_ui.db`. No elimina `raizvolt_mobile.db`. Tras instrumentar, cerrar la aplicación y abrirla normalmente para regresar a la base habitual. `TOTAL: 23 comprobaciones aprobadas; 0 fallos` e `INSTRUMENTATION_CODE: -1` indican éxito (Activity.RESULT_OK); código 0 indica fallo. La salida incluye estados individuales y un resumen; no contar ambos como pruebas distintas. No es el runner AndroidX JUnit.

Las pruebas unitarias JUnit se ubican en `app/src/test/`; el runner nativo, en `app/src/androidTest/`. Resultados y capturas reales en `evidencias/`.

## Contenido

| Ruta | Contenido |
| --- | --- |
| `proyecto/RaizVoltMovil/` | Fuente Java, recursos, Gradle Wrapper y pruebas |
| `apk/` | Aplicación compilada y APK separado de instrumentación |
| `documentos/` | Informe PDF y especificaciones editables |
| `documentos/diagramas/` | Clases, paquetes, componentes y navegación: PNG, SVG y DOT |
| `evidencias/` | JUnit XML, lint, logs y capturas |
| `URL_REPOSITORIO.txt` | URL pública de la evidencia |
| `SHA256SUMS.txt` | Huellas de integridad |

## Límites

- Un asesor y un dispositivo; no hay sincronización web, roles, autenticación remota ni pagos.
- La base es privada dentro de Android, sin cifrado adicional propio. Cualquier persona con el teléfono desbloqueado puede usar la app.
- Desinstalar o borrar datos elimina registros. No se implementa exportación/restauración de datos de usuario.
- El carrito se conserva al recrear la actividad con estado guardado. Los formularios sin guardar deben completarse otra vez si se abandona la pantalla.
- Una cotización confirmada no origina un segundo pedido, incluso después de cancelarlo: crear otra cotización.
- APK con firma de depuración para evaluación; no es una publicación en Google Play. La ejecución verificada es Android 6.0 API 23, no todos los modelos/versiones.

Repositorio: https://github.com/Joan-dot650/Programa-Git/tree/main/GA8-AA2-EV02
