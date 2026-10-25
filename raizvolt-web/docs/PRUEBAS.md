# Pruebas de la evidencia EV02

Fecha: 25 de octubre de 2026. Entorno ejecutado: Linux, OpenJDK 17.0.20,
Tomcat 10.1.61 y H2 2.5.250. Revisión adicional con Chromium 153 a 1440 px y 390 px.
Los scripts BAT están preparados para Windows; no se ejecutó un sistema Windows.

## Resultado

- Compilación completada sin advertencias del compilador Java.
- 40 verificaciones JDBC aprobadas en PruebasIntegracion.
- 49 verificaciones HTTP/JSP aprobadas en PruebasWeb.
- WAR desplegado de forma independiente: catálogo, formulario y estilos respondieron 200.
- Navegador: alta de cuatro productos, búsqueda, edición y cancelación de eliminación;
  revisión de escritorio y móvil, sin desbordamiento de la página ni errores JavaScript.
- Confirmado UTF-8 en páginas y fragmentos JSP. La tabla móvil tiene desplazamiento interno.

Total automatizado de las dos suites Java: **89 verificaciones aprobadas**.
Salida de cada verificación: RESULTADOS_PRUEBAS.txt.

## Casos relevantes

| Caso | Comprobación y resultado |
| --- | --- |
| Alta válida | POST guarda, devuelve 303 y lista el producto. |
| Consulta por código / nombre | GET lee q y muestra coincidencias. |
| Modificación | POST actualiza precio y existencias conservando el ID. |
| Borrado | GET confirma sin mutar; POST elimina. |
| Cancelación | Regresar al catálogo conserva el producto. |
| Reinicio | Datos creados y eliminados conservan su estado al reiniciar Tomcat. |
| Código duplicado | Rechazado con 409 y mensaje entendible. |
| Precio 0, stock negativo, categoría inválida | Rechazados en el servidor con 400. |
| ID incorrecto / inexistente | Respuesta controlada 400 / 404. |
| Formularios vencidos / manipulados | POST sin token o con token incorrecto devuelve 403. |
| Texto con caracteres HTML | c:out muestra el texto escapado sin ejecutar script. |
| Entrada con texto SQL | Búsqueda parametrizada conserva la estructura de la consulta. |
| JSP interna | Acceso directo bajo WEB-INF devuelve 404. |
| Elementos JSP | Vistas compiladas, EL resuelta y JSTL ejecutada. |
| Codificación | UTF-8 conserva Batería, energía y el pie de página. |
| Reenvío tras operación | Post/Redirect/Get separa escritura y visualización; mensaje de un solo uso. |

## Repetir

En Windows: primero `compilar.bat`; después `pruebas.bat`.
En Linux/macOS: `bash compilar.sh` y `bash pruebas.sh`.
Se requiere JDK 17+. Las dos suites crean bases H2 temporales y las eliminan al
terminar. No acceden a datos/raizvolt-web. PruebasWeb levanta Tomcat en un puerto
local libre, envía solicitudes HTTP reales y compila las JSP mediante Jasper.

La revisión del navegador y la comprobación independiente del WAR se realizaron
como validación adicional del empaquetado. Los precios y nombres usados eran datos
ficticios y no se incluyen como registros iniciales de la base entregada.

MySQL se conserva como alternativa configurable; no se probó contra un servidor
MySQL en esta entrega. No se realizaron pruebas de carga ni de acceso multiusuario.
