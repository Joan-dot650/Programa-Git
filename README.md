# RaízVolt · Catálogo solar con React

**Evidencia GA7-220501096-AA4-EV03.** Módulo web de registro, consulta,
actualización y eliminación confirmada de productos solares.

Esta versión implementa los 15 componentes definidos en AA4-EV02 y conecta la
interfaz React con una API JSON del proyecto Spring Boot de AA3. Los datos se
guardan en H2 en archivo; se conservan las historias HU-PR01 a HU-PR04.

## Abrir la entrega ZIP

1. Extraer **toda** la carpeta comprimida.
2. Tener Java 17 o superior instalado. Comprobarlo con `java -version`.
3. En Windows, abrir `proyecto/ejecutar.bat` con doble clic. En Linux/macOS,
   ejecutar `sh proyecto/ejecutar.sh`.
4. Esperar el mensaje de arranque de Spring Boot y abrir
   **http://localhost:8080/raizvolt/react/index.html**.
5. Mantener la consola abierta. Detener con `Ctrl+C`.

El ZIP incluye `ejecutable/raizvolt-react.jar`, con el front-end compilado y el
servidor. No requiere Node.js, Maven, MySQL ni Internet para usarlo; sí requiere
Java instalado. La primera apertura muestra un catálogo vacío.

## Trabajar en VS Code

Para compilar desde el repositorio se necesita **JDK 17+**, **Node.js 24.15+ (rama 24)**
y conexión para descargar dependencias. Se verificó con Java 17 y Node 24.
Maven Wrapper está incluido; no es obligatorio instalar Maven por separado.

```bash
node scripts/compilar.mjs
```

Este comando instala las versiones de `package-lock.json`, ejecuta pruebas del
front-end, compila React, copia los recursos al servidor, ejecuta `mvnw clean verify`
y genera `ejecutable/raizvolt-react.jar`. En Windows también se puede usar
`compilar.bat`; en Linux/macOS, `sh compilar.sh`.

Después, para editar con actualización automática:

```bash
npm run dev
```

Abrir la dirección de Vite, normalmente **http://localhost:5173/raizvolt/react/**.
El script inicia también Java en 8080. No ejecutar a la vez `ejecutar.bat`, porque
ambos usarían el mismo puerto. Vite actualiza los componentes al guardar.
Si se modifica Java, detener, recompilar y arrancar otra vez.

**No abrir `index.html` con doble clic ni con Live Server.** La aplicación necesita
Vite para desarrollar o el JAR para ejecutar la versión integrada.

## Organización

| Ruta | Contenido |
| --- | --- |
| `raizvolt-react/src/components/` | 14 componentes; `src/App.jsx` es el componente raíz número 15. |
| `raizvolt-react/src/services/productoApi.js` | Solicitudes JSON, CSRF y errores. |
| `raizvolt-react/src/utils/productos.js` | Validaciones, rutas y formato monetario exacto. |
| `raizvolt-react/tests/` | Pruebas del front-end. |
| `raizvolt-spring/src/main/java/co/raizvolt/api/` | Nueva API REST. |
| `raizvolt-spring/src/main/java/co/raizvolt/` | Modelo, servicio y DAO conservados. |
| `raizvolt-spring/src/test/` | Pruebas de API y regresión. |
| `docs/` | Trazabilidad, contrato, estándar, uso y resultados. |
| `scripts/` | Compilación y desarrollo. |

El repositorio conserva `raizvolt-jdbc` y `raizvolt-web` como antecedentes de AA2.
No son necesarios para ejecutar AA4 y no se duplican en la carpeta de entrega.
Las vistas Thymeleaf de AA3 siguen en `/raizvolt/productos`; la interfaz de esta
evidencia está en `/raizvolt/react/index.html`.

## Datos y alcance

Es un módulo para un operador local, sin inicio de sesión. Los scripts de inicio
guardan la base en `ejecutable/datos/raizvolt.mv.db`. No borrar esa carpeta si se
quiere conservar el inventario. La base no se incluye en Git.

Para continuar con una base de AA3, detener ambas aplicaciones, guardar una copia
de seguridad y copiar su carpeta `datos` a `ejecutable/datos` de esta entrega.
No ejecutar dos procesos sobre el mismo archivo. El esquema se conserva y no
borra registros. No se incluyen compras, pagos ni cuentas de usuario.

## Pruebas

```bash
cd raizvolt-react
npm ci
npm test
npm run build
cd ../raizvolt-spring
./mvnw -B -ntp verify
```

En Windows sustituir `./mvnw` por `.\mvnw.cmd`. Resultados en
`docs/RESULTADOS_PRUEBAS.md`. Java usa una base aislada del inventario.

Después de compilar el JAR, desde la raíz se puede ejecutar
`npm run test:integracion`. Esta prueba usa el React compilado en JSDOM,
solicitudes HTTP al JAR real y una base temporal. No modifica el inventario.

## Fuentes

- Instrumento SENA `IE-GA7-220501096-AA4-EV03.pdf`, adjunto a la actividad.
- Documento `GA7-220501096-AA4-EV02_Jhon_Tineo.pdf`.
- AA3-EV02, commit `ff5b13e578ecf169a93b5cbd473a87aac5f3a65b`.
- React: https://react.dev/learn/creating-a-react-app
- Vite: https://vite.dev/guide/
- Spring Security: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html

Fuentes oficiales consultadas el 29 de octubre de 2026. Versiones exactas:
React 19.3.1, Vite 8.3.5, plugin React 6.1.2 y Spring Boot 4.0.9.
