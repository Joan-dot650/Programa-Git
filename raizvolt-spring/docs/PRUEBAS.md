# Pruebas y validación

Fecha: 26 de octubre de 2026. Los resultados reales están en `RESULTADOS_PRUEBAS.txt`.

## Pruebas incluidas en el proyecto

Ejecutar `pruebas.bat` en Windows o `sh pruebas.sh` en Linux/macOS. Requiere JDK 17+
y las dependencias de Maven; se descargan la primera vez. `compilar` también ejecuta
las pruebas antes de copiar el JAR. No se usa la carpeta de datos del usuario.

| Conjunto | Casos ejecutados | Cobertura |
| --- | --- | --- |
| `CatalogoWebTest` | 29 | Vistas reales de Thymeleaf, CRUD, normalización, validaciones, duplicados, búsquedas, identificadores, CSRF y escape de HTML. |
| `PersistenciaArchivoTest` | 1 | Crear, cerrar H2, reabrir y comprobar; actualizar, volver a abrir, eliminar y verificar que el esquema no repone datos. |
| **Total JUnit** | **30** | **0 fallos, 0 errores, 0 omitidas.** |

El primer conjunto integra Spring MVC, el servicio y un H2 de prueba; el segundo
usa una carpeta temporal con base en archivo. El informe completo de cada ejecución
se genera en `target/surefire-reports`.

## Verificación adicional del ejecutable

Se ejecutó el JAR empaquetado con Java 17.0.20 y se automatizó su navegación real en
Chromium 142 mediante Playwright. Se usó una base temporal independiente. Las 14
comprobaciones terminaron correctamente:

1. Catálogo vacío accesible desde el servidor integrado.
2. Crear mediante formulario con token CSRF real.
3. Duplicado conserva los campos y muestra el error.
4. Editar precarga y guarda precio y existencias.
5. Buscar sin coincidencias y limpiar el filtro.
6. Cancelar la eliminación conserva el registro.
7. Confirmar la eliminación retira el producto.
8. Vista de escritorio sin desborde horizontal del documento.
9. Vista móvil sin desborde horizontal del documento.
10. Formulario móvil con los cinco campos y ancho adaptable.
11. Página 404 legible y enlace de regreso.
12. POST sin token CSRF rechazado con 403.
13. Detener el proceso Java, iniciarlo otra vez y conservar tres productos.
14. Ausencia de errores de JavaScript de la aplicación.

Se inspeccionaron visualmente el catálogo a 1440 píxeles y las pantallas móviles a
390 píxeles de ancho. La tabla se desplaza dentro de su propio contenedor en móvil.
Estos registros de prueba no se incluyen en la base de la entrega: el catálogo
comienza vacío.

## Prueba manual para el aprendiz

Seguir `GUIA_PASO_A_PASO.md`: registrar SOL-550, buscarlo, editar precio/stock,
cancelar una eliminación, confirmar después y reiniciar para revisar permanencia.
Se deben observar mensajes claros y ausencia de cambios cuando una validación falla.

## Alcance de la verificación

Se comprobó compilación, pruebas, empaquetado, arranque de Maven Wrapper y ejecución
del JAR en Linux con Java 17. Los lanzadores Windows se revisaron como código y se
incluyen para facilitar el inicio; no se ejecutaron en Windows. No se evaluaron
despliegues públicos, autenticación, MySQL ni módulos ajenos al catálogo.
