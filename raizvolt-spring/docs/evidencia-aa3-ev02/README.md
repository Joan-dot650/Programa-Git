# Evidencia GA7-220501096-AA3-EV02

Fecha de ejecución: 28 de octubre de 2026 (America/Bogota).

## Alcance y resultado

Se probó el catálogo web de RaízVolt desarrollado en AA3-EV01, historias
HU-PR01 a HU-PR04. Se ejecutaron 63 pruebas JUnit (30 previas y 33 adicionales)
y 34 comprobaciones en Chromium: 0 fallos, 0 errores y 0 omisiones.

La versión base es 5ac608df1266d1b0c03f77b049de51f230b88034. No se modificaron
las reglas funcionales ni el código de producción. Se incorporaron pruebas,
el recorrido reproducible y los resultados de AA3-EV02.

El módulo no contiene campos de fecha: esa validación no aplica. La vista
móvil corresponde al mismo módulo web con diseño adaptable; no es una app nativa.

## Correspondencia

| Historia | Aceptación | Comprobaciones |
| --- | --- | --- |
| HU-PR01 / CU-01 | Alta válida, código único, mensajes y conservación de campos | UI02 a UI20, UI33 |
| HU-PR02 / CU-02 | Consulta por nombre/código y estado sin coincidencias | UI01, UI21 a UI25 |
| HU-PR03 / CU-03 | Precarga, edición del mismo ID e integridad ante errores | UI26, UI27 |
| HU-PR04 / CU-04 | Confirmar, cancelar y eliminar solo una referencia | UI28, UI29 |
| Transversales | Persistencia, 404, CSRF y vista móvil | UI30 a UI32, UI34 |

## Evidencia de ejecución

`resultados-junit.json` enumera los 63 casos y las tres clases de pruebas.
`resultados-navegador.json` registra entradas, criterios y resultados UI01 a UI34.
`../../pruebas/README.md` explica cómo repetir el recorrido con una base temporal.
El ZIP incluye además 31 capturas, informes Surefire, documento Word y video MP4
con rótulos explicativos. No incluye datos reales ni requiere una cuenta remota.

JAR compilado y probado, SHA-256:
`7e4e166fa838bbb5e51b3888f9614ea418b07449fb5ec78000212e9ed64546d7`

Comando Java ejecutado: `./mvnw verify`. Herramientas: Java 17.0.20, Spring Boot
4.0.9, Maven 3.9.11, Playwright 1.62.1 y Chromium 141.0.7390.37.

Los casos de servidor UI15 a UI19 omiten controles HTML deliberadamente y UI32
retira el token CSRF del formulario de prueba. Los rechazos observados son HTTP
400, 409, 404 y 403 según el escenario. Las escrituras correctas usan HTTP 303.
El script detiene e inicia Java para verificar la persistencia real del archivo H2.

No se observaron fallos funcionales en las ejecuciones registradas. El alcance
no incluye carga, concurrencia ni compatibilidad con otros motores de navegador.
