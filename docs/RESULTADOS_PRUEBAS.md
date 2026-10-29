# Resultados de verificación · AA4-EV03

Fecha: 29 de octubre de 2026. Entorno de ejecución: Linux, Java 17.0.20,
Node.js 24.22.1, React 19.3.1 y Spring Boot 4.0.9.

## Pruebas automáticas ejecutadas

| Grupo | Resultado real |
| --- | --- |
| Validación, formato monetario y rutas JS | 32 pruebas aprobadas, 0 fallos, 0 omitidas. |
| Pruebas Java heredadas de AA3 | 63 aprobadas: 33 de límites, 29 de web y 1 de persistencia. |
| API JSON nueva | 33 aprobadas, 0 fallos. |
| Total Java de `clean verify` | 96 aprobadas, 0 errores, 0 omitidas; BUILD SUCCESS. |
| Integración React compilado + HTTP real + H2 | 11 escenarios aprobados; Node informa 12 pruebas incluyendo la envolvente. |
| Compilación React | `vite build` completado correctamente. |
| Empaquetado Java | JAR ejecutable generado por Maven/Spring Boot y utilizado en la prueba de integración. |

La integración evalúa el JavaScript compilado en JSDOM (simulación de DOM, no un
navegador completo). Sus solicitudes van al JAR real, con cookie y token CSRF,
y una base H2 temporal distinta del inventario del usuario. El escenario de
reinicio detiene y vuelve a iniciar Java para comprobar el archivo persistente.

Escenarios de integración:

1. El JAR sirve HTML, JS y CSS; el catálogo arranca vacío.
2. Campos obligatorios y foco en el primer error.
3. Registro real, coma decimal, normalización y resumen.
4. Duplicado 409, conservación de valores y corrección posterior.
5. Búsqueda por código, resumen filtrado y estado sin coincidencias.
6. Edición precargada, mismo ID y actualización de precio/existencias.
7. Cancelación y confirmación de eliminación de una única referencia.
8. Fallo de consulta y recuperación con Reintentar.
9. Escritura guardada seguida de fallo de consulta: mensaje que distingue ambos resultados.
10. Ruta desconocida y retorno al catálogo.
11. Persistencia después de reiniciar el JAR.

Las pruebas Java incluyen límites, caracteres de control, tildes, categorías,
duplicados, comodines literales, ID inexistente, JSON malformado, CSRF real y
bloqueo de escrituras sin token. El importe máximo conserva los centavos.

## Inspección visual realizada

Se abrió el front-end compilado en Chrome y se revisaron el formulario de
registro en escritorio, errores obligatorios, foco y navegación al registro.
Se inspeccionó también el formulario en un marco de 390 × 844 píxeles, incluido
su extremo inferior: campos en una columna y botones sin superposición.

Límite de esta verificación: la infraestructura de vista previa no pudo arrancar
Java (biblioteca `libjli.so` no disponible para ese proceso). Por eso la revisión
visual usó los recursos estáticos y permitió comprobar el estado de error de
consulta. El CRUD completo se verificó mediante JSDOM y HTTP al servidor real;
no se afirma haber recorrido ese CRUD en el navegador visual. La ejecución y
las pruebas de Maven/Java fuera de esa vista previa finalizaron correctamente.

La aplicación se entrega para uso local. No se realizaron pruebas de carga,
usuarios simultáneos ni una auditoría completa de accesibilidad.

## Reproducir

- `cd raizvolt-react` y `npm test`: reglas y rutas.
- `cd raizvolt-spring` y `./mvnw -B -ntp verify` (Windows: `.\mvnw.cmd`): Java.
- Desde la raíz, tras compilar, `npm run test:integracion`: 11 escenarios.
- `node scripts/compilar.mjs`: instalación, pruebas, compilación e integración de recursos.

Los registros resumidos de ejecución están en `docs/resultados/`.
