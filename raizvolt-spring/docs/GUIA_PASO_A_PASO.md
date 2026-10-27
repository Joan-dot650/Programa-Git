# Guía de ejecución y demostración

**Jhon Edwards Tineo Landaeta · Ficha 3235874 · GA7-220501096-AA3-EV01**

## 1. Extraer e iniciar

1. Descarga el ZIP de la evidencia.
2. En Windows, clic derecho sobre el ZIP y selecciona **Extraer todo**.
3. Abre la carpeta extraída y después `raizvolt-spring`.
4. Para comprobar Java, abre una terminal y escribe `java -version`. Debe indicar
   versión 17 o superior. Para compilar también necesitas `javac -version`.
5. Haz doble clic en `ejecutar.bat`. Mantén abierta esa ventana.
6. Cuando aparezca `Started RaizVoltAplicacion`, abre el navegador en:
   **http://localhost:8080/raizvolt/productos**.

El ZIP ya trae el JAR compilado. No abras las plantillas HTML con doble clic:
necesitan que Spring procese sus datos y formularios.

## 2. Registrar el primer producto

Pulsa **Nuevo producto** y escribe este ejemplo académico (no es una cotización):

| Campo | Valor |
| --- | --- |
| Código | SOL-550 |
| Categoría | Panel solar |
| Nombre | Panel solar monocristalino 550 W |
| Precio unitario | 680000.50 |
| Existencias | 12 |

Pulsa **Guardar producto**. Debes ver el mensaje de registro correcto y el producto
en la tabla. El precio se presenta con el formato colombiano, pero se ingresa sin
separadores de miles. Puedes usar coma o punto para los decimales.

## 3. Consultar, editar y eliminar

1. En la búsqueda escribe `SOL-550` o `panel` y pulsa **Buscar**.
2. Pulsa **Editar**. Cambia el precio a `720000` y las existencias a `3`.
3. Pulsa **Guardar cambios**. La referencia debe mostrar el nuevo precio y stock bajo.
4. Pulsa **Eliminar**. Primero aparece la confirmación: pulsa **Cancelar** y verifica
   que el producto permanece.
5. Entra de nuevo en **Eliminar** y pulsa **Confirmar eliminación** para retirarlo.

## 4. Comprobar validaciones y permanencia

- Intenta registrar dos productos con el mismo código. El segundo se rechaza y
  conserva los campos para corregirlos.
- Prueba un precio cero o stock negativo. La aplicación debe indicar el error.
- Crea un producto, detén el programa con **Ctrl+C**, vuelve a ejecutar y abre el
  catálogo. El registro debe seguir allí.
- Los archivos de `datos/` contienen tus registros. No borres esa carpeta si quieres
  conservarlos y no la agregues al repositorio.

## 5. Abrir y modificar el código en Visual Studio Code

1. Selecciona **Archivo > Abrir carpeta** y abre `raizvolt-spring`.
2. Revisa `pom.xml` para ver los módulos de Spring usados.
3. Abre `ProductoControlador.java`, `ProductoServicio.java` y `ProductoDaoSpring.java`
   para recorrer la solicitud desde el navegador hasta la base de datos.
4. Las pantallas están en `src/main/resources/templates` y el CSS en
   `src/main/resources/static/assets`.
5. Después de modificar, detén la aplicación y ejecuta `compilar.bat`. Este comando
   compila, ejecuta las pruebas y actualiza el JAR de `dist/`.
6. Si la compilación termina correctamente, vuelve a ejecutar `ejecutar.bat`.

Para compilar se necesita un **JDK**, no solo el entorno de ejecución Java. Maven
Wrapper descarga Maven y las dependencias la primera vez.

## 6. Revisar el versionamiento

Abre el enlace de `ENLACE_REPOSITORIO.txt` para consultar la rama de esta evidencia.
Entra en `raizvolt-spring` para ver el código, las pruebas y la documentación.
El historial de commits muestra la evolución desde los módulos anteriores.

Para descargar el código con Git Bash desde una carpeta nueva:

```bash
git clone --branch evidencia/aa3-ev01-raizvolt-spring https://github.com/Joan-dot650/Programa-Git.git
cd Programa-Git/raizvolt-spring
git status
git log --oneline -5
```

El ZIP también incluye `repositorio.bundle`, una copia del historial que se puede
recuperar sin Internet. Desde la carpeta donde está ese archivo:

```bash
git clone --branch evidencia/aa3-ev01-raizvolt-spring repositorio.bundle Programa-Git-local
```

El módulo puede ejecutarse sin recuperar Git: basta con la carpeta
`raizvolt-spring` que ya viene en el ZIP.

## 7. Solución de problemas

| Situación | Qué hacer |
| --- | --- |
| Java no se reconoce | Instalar JDK 17/21, activar su opción PATH y abrir una terminal nueva. Descarga oficial: https://adoptium.net/temurin/releases/ |
| El navegador no conecta | Esperar el mensaje de inicio; comprobar que la consola siga abierta y usar la URL completa. |
| Puerto 8080 ocupado | Cerrar la otra instancia. También puedes ejecutar `java -jar dist/raizvolt-spring.jar --server.port=8081` desde esta carpeta y abrir el puerto 8081. |
| Base bloqueada | Mantener solo una instancia del módulo abierta; cerrarla con Ctrl+C antes de reiniciar. |
| Falta el JAR | Ejecutar `compilar.bat` con JDK e Internet; comprobar que termine con BUILD SUCCESS. |
| Error 403 al enviar | Volver al catálogo y abrir un formulario nuevo para renovar el token. |
| Cambié el código pero sigo viendo lo mismo | Detener, ejecutar `compilar.bat` y volver a iniciar. |

## 8. Entregar

El archivo a subir es **JHON_EDWARDS_TINEO_LANDAETA_AA3_EV01.zip**. Contiene los
archivos del proyecto, el ejecutable, la documentación, las pruebas, el historial
Git y el archivo con el enlace directo al repositorio de esta evidencia.
Revisa la ejecución en tu equipo y familiarízate con el código antes de sustentarlo.
