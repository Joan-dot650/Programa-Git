# Referencias y procedencia

Consulta técnica: 26 de octubre de 2026. Versiones del proyecto fijadas en `pom.xml`.

1. SENA. Instrumento de evaluación GA7-220501096-AA3-EV01, aportado por el aprendiz.
2. Proyecto previo RaízVolt Web, rama y commit verificados:
   https://github.com/Joan-dot650/Programa-Git/tree/e2abeade7eca0afa4719b81058fec204481fce3c/raizvolt-web
3. Spring Boot 4.0.9: requisitos de Java y herramientas de compilación.
   https://docs.spring.io/spring-boot/4.0/system-requirements.html
4. Spring: manejo de formularios con Spring MVC y Thymeleaf.
   https://spring.io/guides/gs/handling-form-submission/
5. Spring Boot: bases SQL, DataSource, JdbcTemplate y configuración.
   https://docs.spring.io/spring-boot/4.0/reference/data/sql.html
6. Spring Boot 4.0.9: anuncio oficial de la versión seleccionada.
   https://spring.io/blog/2026/10/23/spring-boot-4-0-9-available-now

La aplicación reutiliza el dominio, reglas, contrato DAO y diseño visual del proyecto
anterior del aprendiz; el controlador y el DAO Spring se implementan para esta evidencia.
Los valores de demostración son ficticios y no representan precios de mercado.

El JAR de entrega incluye bibliotecas de terceros bajo sus licencias respectivas.
Las dependencias de Spring, Tomcat, H2 y Thymeleaf conservan sus archivos de licencia
y avisos en los JAR anidados de `BOOT-INF/lib`. Maven Wrapper conserva sus cabeceras
de licencia. Consulta `DEPENDENCIAS.txt` para el árbol real usado en la compilación.
