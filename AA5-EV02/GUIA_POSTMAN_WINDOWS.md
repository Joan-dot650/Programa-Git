# Repetir la evidencia en Postman de escritorio

La ejecución incluida en este paquete usa **Newman**, el ejecutor local de colecciones de Postman. Las capturas y el video identifican esa herramienta. Para mostrar la interfaz de Postman de escritorio solicitada por la guía, sigue estos pasos y graba la pantalla de tu computador.

## 1. Abrir la API

1. Extrae todo el ZIP. Abre la carpeta **AA5-EV02**.
2. Tu **Node.js 26 sirve**. El proyecto acepta **Node.js 24 o superior**, sin límite máximo.
3. Haz doble clic en **INICIAR_WINDOWS.bat** y deja la ventana abierta.
4. Debe aparecer `Servicio disponible en http://127.0.0.1:3000`.
5. Si no abre, en VS Code abre esa carpeta y ejecuta en la terminal:

```powershell
node --version
node src/server.js
```

No necesitas MySQL, XAMPP ni Live Server. Para ejecutar la API no se requiere `npm install`.

## 2. Instalar Postman

1. Abre https://www.postman.com/downloads/.
2. Descarga la aplicación de escritorio para tu Windows y ejecuta el instalador.
3. Abre Postman. Para organizar/importar colecciones, inicia sesión si la aplicación lo solicita.
4. Toma una captura con Postman abierto. No muestres contraseñas ni datos de tu cuenta.

## 3. Importar la colección

1. Selecciona **Import**.
2. Selecciona **postman/AA5_EV02.postman_collection.json** dentro de la carpeta extraída.
3. Importa también **postman/Local.postman_environment.json** y selecciona el entorno **AA5-EV02 - Local**.
4. Comprueba que `baseUrl` sea `http://127.0.0.1:3000`.
5. Abre la colección **AA5-EV02 - Testing API de autenticación**. Debe contener CP01 a CP25.

Si tu versión de Postman no permite importar colecciones sin iniciar sesión, puedes usar tu cuenta o crear las solicitudes manualmente a partir de ENDPOINT.txt. Para ejecutar esta colección completa y sus scripts utiliza la opción de colecciones disponible en tu cuenta.

## 4. Ejecutar los 25 casos

**Antes de cada ejecución completa:** detén el servidor con Ctrl+C y vuelve a iniciarlo. Esto reinicia el contador de intentos sin borrar las cuentas. No envíes otras solicitudes de registro o login durante esta ejecución.

1. En CP01 pulsa **Send**. Su script crea un nombre de usuario nuevo para esta ejecución.
2. Ejecuta CP02, CP03 y los demás **en orden**, una sola vez cada uno.
3. En cada caso muestra el método, URL, Body cuando exista, el código HTTP y el JSON de respuesta. Abre **Test Results** para ver las verificaciones.
4. Toma una captura por caso con **Windows + Mayús + S** y guárdala con el identificador (por ejemplo CP02_POSTMAN.png).
5. CP25 debe devolver **429**: es el intento número 21 de autenticación. Los GET no consumen ese contador.
6. Para otra ejecución automatizada: reinicia el servidor y usa **Run collection**, una iteración, todos los casos en orden. Deben pasar **25 solicitudes y 140 verificaciones**.

Las respuestas 400, 401, 404, 405, 409, 413, 415 y 429 son resultados correctos cuando el caso está diseñado para provocarlas. No son fallos de la prueba si coinciden con lo esperado.

## 5. Grabar el video

Abre una herramienta de grabación de pantalla que ya tengas disponible. En Windows puedes usar la grabación de pantalla de Recortes si tu versión la incluye o Xbox Game Bar con Windows + G y la opción de grabar la aplicación.

Guion sugerido (6 a 8 minutos):

1. “Mi nombre es Jhon Edwards Tineo Landaeta, ficha 3235874. Presento las pruebas de la API de registro e inicio de sesión, evidencia GA7-220501096-AA5-EV02”.
2. Muestra `node --version`, la terminal del servidor y Postman abierto.
3. Muestra los cuatro endpoints y explica que las solicitudes POST usan JSON.
4. Ejecuta CP01 a CP06: salud, registro, login correcto, contraseña incorrecta, usuario inexistente y duplicado.
5. Ejecuta CP07 a CP17: campos, longitudes, tipos de dato, caracteres, JSON inválido, formato y tamaño.
6. Ejecuta CP18 a CP25: método, ruta, contrato, normalización, espacios, tipos y límite de intentos. En CP25 muestra también Retry-After.
7. Concluye mostrando Test Results y el enlace del repositorio.
8. Guarda la grabación como **PRUEBAS_POSTMAN_ESCRITORIO.mp4** en la carpeta **video**.

El video incluido de Newman es una demostración técnica complementaria. No afirma que se haya grabado la interfaz de Postman de escritorio ni la voz del aprendiz.

## 6. Completar la entrega en escritorio

Agrega al documento las capturas que tomaste en Postman y añade tu grabación de escritorio al ZIP. Conserva los archivos del proyecto, ENDPOINT.txt y ENLACE_REPOSITORIO.txt. El archivo final debe llamarse **JHON_EDWARDS_TINEO_LANDAETA_AA5_EV02.zip**.

## Si aparece un problema

| Situación | Qué hacer |
|---|---|
| `ECONNREFUSED` | Inicia el servidor y revisa el puerto de baseUrl. |
| 409 al repetir CP02 | Repite toda la secuencia desde CP01 para generar otro usuario. |
| 429 antes de CP25 | Reinicia el servidor y repite los casos en orden, sin enviar otros POST. |
| CP25 no da 429 | Falta algún POST anterior o reiniciaste el servidor a mitad de la secuencia. |
| `npm.ps1` bloqueado | Usa `npm.cmd` en PowerShell. |
| Puerto 3000 ocupado | Cierra la instancia anterior; o cambia PORT y el valor baseUrl al mismo puerto. |

Fuentes: documentación oficial de instalación y colecciones de Postman; enlaces en el informe.
