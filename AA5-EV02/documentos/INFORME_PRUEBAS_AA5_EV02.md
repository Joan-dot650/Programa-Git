# Pruebas de la API de autenticación

**Aprendiz:** Jhon Edwards Tineo Landaeta · **Ficha:** 3235874

**Evidencia:** GA7-220501096-AA5-EV02 · **Actualización:** 1 de noviembre de 2026

La colección de Postman se ejecutó con Newman 6.2.1. Aprobaron 25 solicitudes, 140 verificaciones y 40 pruebas de integración. Las capturas y el video son de consola; queda pendiente la evidencia visual de Postman de escritorio.

## Introducción y objetivo

Verificar por HTTP el registro, el inicio de sesión, las validaciones y los errores de la API construida en AA5-EV01, con datos ficticios y una base temporal.

## Procedimiento y resultados

Se ejecutaron `npm test` y `npm run test:postman` con Node.js 24.22.1. Los reportes completos están en `resultados/VERIFICACION_*_2026_11_01.*`. Las capturas conservadas corresponden a la ejecución anterior con Node.js 26.13.0.

### CP01 Servicio disponible

Consultar el estado del servidor antes de enviar credenciales.

`GET /api/salud` · Esperado: 200 · Obtenido: 200 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP01](capturas/CP01.png)

### CP02 Registro satisfactorio

Registrar un usuario nuevo con una contraseña válida. Debe devolver un identificador, sin contraseña ni hash.

`POST /api/registro` · Esperado: 201 · Obtenido: 201 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP02](capturas/CP02.png)

### CP03 Autenticación satisfactoria

Ingresar con la cuenta creada en CP02 y la misma contraseña.

`POST /api/login` · Esperado: 200 · Obtenido: 200 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP03](capturas/CP03.png)

### CP04 Contraseña incorrecta

Cambiar únicamente la contraseña por otra de longitud válida.

`POST /api/login` · Esperado: 401 · Obtenido: 401 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP04](capturas/CP04.png)

### CP05 Usuario inexistente

Usar un nombre que no fue registrado. El mensaje debe ser el mismo que para una contraseña incorrecta.

`POST /api/login` · Esperado: 401 · Obtenido: 401 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP05](capturas/CP05.png)

### CP06 Registro duplicado

Repetir el registro de la cuenta creada en CP02.

`POST /api/registro` · Esperado: 409 · Obtenido: 409 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP06](capturas/CP06.png)

### CP07 Campos obligatorios ausentes

Enviar un objeto vacío; el servidor debe identificar los dos campos obligatorios.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 7 aprobadas.

![Captura de consola Newman CP07](capturas/CP07.png)

### CP08 Usuario demasiado corto

Enviar un nombre de dos caracteres; el mínimo es tres.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP08](capturas/CP08.png)

### CP09 Contraseña demasiado corta

Enviar una contraseña de siete caracteres; el mínimo es ocho.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP09](capturas/CP09.png)

### CP10 Usuario demasiado largo

Enviar un nombre de 31 caracteres; el máximo es 30.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP10](capturas/CP10.png)

### CP11 Contraseña demasiado larga

Enviar una contraseña de 129 caracteres; el máximo es 128.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP11](capturas/CP11.png)

### CP12 Tipo de usuario incorrecto

Enviar el usuario como número JSON; se exige una cadena de texto.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP12](capturas/CP12.png)

### CP13 Caracteres no permitidos

Enviar texto con comilla, espacios y operadores; debe rechazarse por el formato permitido del usuario.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP13](capturas/CP13.png)

### CP14 Propiedad adicional

Añadir administrador: true. Solo se admiten usuario y contrasena.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP14](capturas/CP14.png)

### CP15 JSON mal formado

Enviar un cuerpo incompleto con Content-Type application/json.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP15](capturas/CP15.png)

### CP16 Tipo de contenido incorrecto

Enviar el objeto como text/plain; el servidor exige application/json.

`POST /api/registro` · Esperado: 415 · Obtenido: 415 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP16](capturas/CP16.png)

### CP17 Cuerpo mayor de 4096 bytes

Enviar un nombre de 5000 caracteres para superar el tamaño máximo del cuerpo HTTP.

`POST /api/registro` · Esperado: 413 · Obtenido: 413 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP17](capturas/CP17.png)

### CP18 Método no permitido

Usar GET en el inicio de sesión. Debe informar Allow: POST.

`GET /api/login` · Esperado: 405 · Obtenido: 405 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP18](capturas/CP18.png)

### CP19 Ruta inexistente

Solicitar una ruta que la API no define.

`GET /api/no-existe` · Esperado: 404 · Obtenido: 404 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP19](capturas/CP19.png)

### CP20 Contrato OpenAPI

Consultar la definición OpenAPI y verificar las operaciones de registro e inicio de sesión.

`GET /api/openapi.json` · Esperado: 200 · Obtenido: 200 · Verificaciones: 4 aprobadas.

![Captura de consola Newman CP20](capturas/CP20.png)

### CP21 Normalización del usuario

Usar mayúsculas y espacios al principio y al final del usuario registrado. La API normaliza solo el usuario.

`POST /api/login` · Esperado: 200 · Obtenido: 200 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP21](capturas/CP21.png)

### CP22 Contraseña con espacios distintos

Añadir espacios a la contraseña válida. La contraseña se conserva exactamente y la autenticación debe fallar.

`POST /api/login` · Esperado: 401 · Obtenido: 401 · Verificaciones: 5 aprobadas.

![Captura de consola Newman CP22](capturas/CP22.png)

### CP23 Tipo de contraseña incorrecto

Enviar una contraseña numérica; se exige texto.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP23](capturas/CP23.png)

### CP24 Contraseña solo con espacios

Enviar ocho espacios. Aunque tiene ocho caracteres, debe rechazarse por estar en blanco.

`POST /api/registro` · Esperado: 400 · Obtenido: 400 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP24](capturas/CP24.png)

### CP25 Límite de intentos

Esta es la solicitud de autenticación número 21 desde el inicio de la ejecución. Debe rechazarse e incluir Retry-After.

`POST /api/login` · Esperado: 429 · Obtenido: 429 · Verificaciones: 6 aprobadas.

![Captura de consola Newman CP25](capturas/CP25.png)

## Conclusión

Los casos ejecutados coinciden con el resultado esperado; no se detectaron fallos. La evaluación no incluye carga ni una auditoría integral de seguridad. Falta incorporar las capturas y la grabación de Postman de escritorio para completar ese formato de presentación.

## Versionamiento

Repositorio de referencia: https://github.com/Joan-dot650/Programa-Git

La publicación de los archivos nuevos de AA5-EV02 está pendiente. El ZIP conserva el código y el historial local en versionamiento/Programa-Git.bundle.

## Referencias

- Postman, Newman: https://learning.postman.com/docs/collections/using-newman-cli/installing-running-newman
- Postman, instalación: https://learning.postman.com/docs/getting-started/installation/install-app
