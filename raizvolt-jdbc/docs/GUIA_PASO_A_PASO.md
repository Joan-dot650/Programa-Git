# Guía de ejecución para principiantes

## 1. Preparar Java

Instala **JDK 17 o superior**. El JDK incluye Java y el compilador; el editor por
sí solo no basta. Descarga oficial: https://adoptium.net/temurin/releases/
Selecciona JDK, Windows y la arquitectura de tu equipo (habitualmente x64).
En el instalador, activa la incorporación de Java al PATH. Cierra y abre la
terminal después de instalar.

Comprueba en PowerShell, línea por línea:

```powershell
java -version
javac -version
```

Ambos deben mostrar una versión 17 o superior. Si aparece “no se reconoce”,
revisa la instalación del JDK y PATH. No necesitas pagar para ejecutar este módulo.

## 2. Extraer y abrir

1. Descarga JhonEdwardsTineoLandaeta_AA2_EV01.zip.
2. Clic derecho sobre el ZIP y elige Extraer todo.
3. Entra en la carpeta extraída y luego en raizvolt-jdbc.
4. Haz doble clic en ejecutar.bat. Se abrirá RaízVolt.
5. Al iniciar por primera vez la tabla está vacía. La base se crea automáticamente.

También puedes abrir raizvolt-jdbc con Archivo > Abrir carpeta en Visual Studio
Code. Desde Terminal > Nueva terminal ejecuta:

```powershell
.\ejecutar.bat
```

Esta es una aplicación Java de escritorio: no se abre con Live Server.

## 3. Probar las cuatro operaciones

### Registrar

Escribe estos datos de ejemplo (no son una cotización comercial):

| Campo | Valor |
| --- | --- |
| Código | PAN-550 |
| Nombre | Panel solar 550 W |
| Categoría | Panel solar |
| Precio | 680000 |
| Existencias | 12 |

Pulsa Registrar. Debe aparecer una fila con un ID automático y un mensaje de éxito.
Escribe el precio sin puntos de miles. Para decimales se acepta 680000.50 o 680000,50.

### Consultar

Escribe PAN-550 o solar en el cuadro sobre la tabla y pulsa Buscar. Después pulsa
Mostrar todo. Una búsqueda vacía también muestra el catálogo completo.

### Actualizar

Selecciona la fila, cambia las existencias a 9 y el precio a 700000. Pulsa
Actualizar. La fila debe conservar el ID y mostrar los valores nuevos.

### Eliminar

Selecciona la fila y pulsa Eliminar. Primero prueba Cancelar y comprueba que
el registro sigue. Vuelve a pulsar Eliminar y confirma para borrarlo realmente.

### Validar y comprobar persistencia

- Intenta registrar dos productos con el mismo código: debe rechazarse el segundo.
- Prueba nombre vacío, precio 0 y existencias -1: deben mostrarse mensajes de error.
- Registra un producto válido, cierra la ventana y vuelve a ejecutar: debe seguir ahí.
- La carpeta datos contiene la base local. No la borres si quieres conservar los datos.
- Cierra la aplicación antes de copiar datos como respaldo. Abre una sola instancia.

## 4. Leer, editar y compilar el código

Abre src/main/java/co/raizvolt/App.java para localizar el inicio del programa.
ProductoDaoJdbc.java contiene las sentencias SQL; ProductoServicio.java contiene
las validaciones; PanelProductos.java contiene los eventos del formulario.

Tras editar código, guarda los archivos y ejecuta:

```powershell
.\compilar.bat
.\ejecutar.bat
```

El compilador actualiza dist/raizvolt.jar. Ejecutar sin volver a compilar utiliza
la última versión compilada. No edites los archivos .class ni el JAR directamente.

## 5. Ejecutar pruebas automáticas

```powershell
.\pruebas.bat
```

Resultado esperado: 40 verificaciones JDBC y 10 de interfaz aprobadas. Las pruebas
usan bases temporales y no cambian datos/raizvolt.mv.db. El panel se renderiza en
build/verificacion/interfaz.png con ejemplos de prueba.

En Linux/macOS, los equivalentes son bash compilar.sh, bash pruebas.sh y
bash ejecutar.sh. La ejecución de la ventana necesita un escritorio gráfico.

## 6. Usar MySQL (opcional)

La ruta H2 ya cumple JDBC y permite ejecutar sin servidor. Si vas a trabajar con
MySQL, utiliza una instancia local MySQL 8.0.16 o superior y sigue este orden:

1. Abre MySQL Workbench y conéctate con tu cuenta administradora.
2. Abre database/mysql.sql y ejecuta el archivo completo. Crea raizvolt.productos.
3. Crea un usuario de aplicación con los permisos SELECT, INSERT, UPDATE y DELETE
   sobre raizvolt.*. Puedes usar tu usuario local existente si ya tiene esos permisos.
4. Copia config/database.properties.example y renombra la copia como database.properties.
5. Cambia db.user y db.password por los valores reales de tu servidor local. Comprueba
   host y puerto en db.url (el ejemplo usa localhost:3306).
6. Guarda, cierra la aplicación si estaba abierta y ejecuta nuevamente ejecutar.bat.
7. La cabecera debe mostrar MySQL. Repite Registrar, Consultar, Actualizar y Eliminar.

No compartas database.properties. Está excluido del repositorio. También se
admiten RAIZVOLT_DB_URL, RAIZVOLT_DB_USER y RAIZVOLT_DB_PASSWORD como variables de
entorno; estas tienen prioridad sobre el archivo. Si vuelves a H2, retira el archivo
local de configuración y las variables que hubieras definido. Los registros de
H2 no se transfieren automáticamente a MySQL.

No se ejecutó una prueba contra un servidor MySQL en el entorno de preparación;
esta conexión debe validarse en tu instalación. El esquema, el controlador y la
configuración están incluidos. La verificación automática entregada corresponde a H2.

## 7. Git y repositorio publicado

El código está en el repositorio público Programa-Git de Joan-dot650, rama
evidencia/aa2-ev01-raizvolt, carpeta raizvolt-jdbc:

https://github.com/Joan-dot650/Programa-Git/tree/evidencia/aa2-ev01-raizvolt/raizvolt-jdbc

El ZIP final incluye la copia Git de esta rama. El directorio .git se encuentra
en la carpeta raíz de la entrega, un nivel por encima de raizvolt-jdbc. Los
archivos README.md y kotlin.txt de la raíz pertenecen al ejercicio Git anterior;
el módulo JDBC y su documentación están dentro de raizvolt-jdbc.

Desde la carpeta raizvolt-jdbc, ejecuta cada comando por separado:

```powershell
git status
git log --oneline -8
git remote -v
git branch --show-current
```

La rama debe ser evidencia/aa2-ev01-raizvolt. Para registrar una modificación
que ya probaste y publicarla en esa misma rama:

```powershell
git add src docs
git commit -m "fix: ajustar modulo de productos"
git push origin evidencia/aa2-ev01-raizvolt
```

Git debe estar instalado. Para push necesitas autenticarte con tu cuenta de
GitHub. No escribas contraseñas ni tokens en los archivos del proyecto.
ENLACE_REPOSITORIO.txt contiene el enlace que corresponde a esta evidencia.

## 8. Entregar

Revisa el código, ejecuta el módulo y abre el enlace de ENLACE_REPOSITORIO.txt
para comprobar la carpeta publicada. El archivo a entregar es JhonEdwardsTineoLandaeta_AA2_EV01.zip. La guía de esta actividad
no exige pantallazos; puedes capturarlos en tu equipo si el instructor los solicita.

Si modificas el proyecto, recompila, ejecuta las pruebas, registra el cambio con
Git y vuelve a comprimir la carpeta completa para que el ZIP coincida con tu versión.

## Problemas frecuentes

| Mensaje o situación | Qué revisar |
| --- | --- |
| Java o javac no se reconoce | JDK 17+ y PATH; abre una terminal nueva |
| UnsupportedClassVersionError | Se está usando una versión de Java inferior a 17 |
| No se encontró el controlador / no inicia | Conserva lib/ completo; ejecuta descargar_dependencias.bat |
| La base local está en uso | Cierra otra ventana de RaízVolt antes de abrir esta |
| Error de conexión MySQL | Servicio encendido, esquema importado, host, puerto, usuario y contraseña |
| No aparece el cambio de código | Guarda y ejecuta compilar.bat antes de abrir |
| La tabla está vacía | Registra un producto; los ejemplos de la imagen no se cargan automáticamente |
