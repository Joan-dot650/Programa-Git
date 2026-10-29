# Guía de uso para la evidencia AA4-EV03

## 1. Extraer el proyecto

En Windows, haz clic derecho sobre el ZIP y elige **Extraer todo**. Abre la carpeta
extraída y luego `proyecto`. No ejecutes archivos desde dentro del ZIP.

## 2. Comprobar Java

Abre una terminal (CMD o PowerShell) y escribe:

```text
java -version
```

Debe mostrar Java 17 o una versión superior. Si no se reconoce, instala Temurin
JDK 17 desde https://adoptium.net/temurin/releases/?version=17. Selecciona tu
sistema y arquitectura; para Windows de 64 bits, Windows / x64 / JDK / instalador
MSI. Activa la opción de agregar Java a PATH si aparece. Cierra y vuelve a abrir
la terminal y comprueba nuevamente. Este requisito es para ejecutar el proyecto.

## 3. Abrir RaízVolt

1. Dentro de `proyecto`, haz doble clic en `ejecutar.bat`.
2. Espera a que termine el arranque de Spring Boot; no cierres esa ventana.
3. Abre Chrome o Edge y escribe:

```text
http://localhost:8080/raizvolt/react/index.html
```

La pantalla inicial está vacía para que puedas registrar tus productos. El
proyecto no viene con datos personales ni productos de prueba precargados.

## 4. Recorrer las funciones

### Registrar

Pulsa **Nuevo producto** e introduce:

| Campo | Valor de ejemplo |
| --- | --- |
| Código | SOL-550 |
| Categoría | Panel solar |
| Nombre | Panel solar 550 W |
| Precio unitario | 680000,50 |
| Existencias | 12 |

Pulsa **Guardar producto**. Aparecerá el mensaje de éxito, la fila en la tabla y
el valor del inventario de $ 8.160.006,00 COP para ese único registro.

### Revisar validaciones

- Abre **Nuevo producto** y guarda vacío: se señalan los campos obligatorios.
- Introduce precio `0` o existencias `-1`: debe aparecer el error correspondiente.
- Intenta registrar otra referencia con `SOL-550`: se informa que ya existe y
  permanecen los demás datos del formulario.
- Corrige el campo o usa **Cancelar** para volver sin guardar.

### Buscar y consultar

Escribe `panel` o `sol-550` y pulsa **Buscar** (también puedes presionar Enter).
Los indicadores corresponden a las filas mostradas. Un texto inexistente muestra
el aviso sin coincidencias. **Limpiar** o **Ver todos los productos** restaura la lista.

### Editar

Pulsa **Editar** en la fila. Cambia las existencias de 12 a 2 y guarda. El ID
permanece igual y aparece el aviso de stock bajo porque hay menos de cinco unidades.
Si cambias de idea antes de guardar, pulsa **Cancelar**.

### Eliminar

Pulsa **Eliminar**. Revisa nombre y código. **Cancelar** conserva el producto;
**Confirmar eliminación** lo borra. Para una demostración, crea una referencia
de prueba y elimina solo esa referencia.

### Comprobar persistencia

Con al menos un producto registrado, vuelve a la consola, presiona `Ctrl+C` y
ejecuta otra vez `ejecutar.bat`. Al abrir la dirección, los datos siguen guardados.
No borres `proyecto/ejecutable/datos` si deseas conservarlos.

## 5. Abrir el código en VS Code

Usa **Archivo > Abrir carpeta** y selecciona `proyecto`. Los componentes están en
`raizvolt-react/src`; los servicios Java, en `raizvolt-spring/src/main/java`.
Para editar, instalar dependencias y compilar, sigue `README.md`. Instala Node.js
24 LTS (24.15 o superior de esa rama) desde https://nodejs.org/en/download.
Node.js solo se necesita para desarrollo y pruebas, no para abrir el JAR incluido.

## Problemas frecuentes

| Situación | Solución |
| --- | --- |
| Java no se reconoce. | Instalar Java, habilitar PATH y reabrir la consola. |
| Puerto 8080 ocupado. | Cerrar una ejecución anterior. Alternativa desde `ejecutable`: `java -jar raizvolt-react.jar --server.port=8081`; abrir la misma ruta con puerto 8081. |
| Pantalla vacía al abrir HTML. | Usar la dirección del servidor; no doble clic en HTML ni Live Server. |
| No puede conectar con el servidor. | Comprobar la consola, volver a iniciar y pulsar Reintentar. |
| Se muestra la interfaz anterior. | Abrir `/raizvolt/react/index.html`, no `/raizvolt/productos`. |
| La base está bloqueada. | Detener la otra instancia antes de volver a abrir. No eliminar la base. |
| No aparecen mis datos anteriores. | Usar siempre `ejecutar.bat`/`ejecutar.sh`, que fijan la carpeta de datos. Consultar la migración de AA3 en README. |

## 6. Entregar

Sube el archivo ZIP completo con tu nombre y `AA4_EV03`. Dentro están el código,
el enlace al repositorio, las instrucciones, el ejecutable y la documentación.
La actividad proporcionada solicita ZIP; no exige un video adicional.
