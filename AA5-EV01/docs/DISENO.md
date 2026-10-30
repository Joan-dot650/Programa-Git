# Diseño del servicio web de autenticación

**Aprendiz:** Jhon Edwards Tineo Landaeta  
**Programa:** Análisis y Desarrollo de Software (SENA)  
**Ficha:** 3235874  
**Evidencia:** GA7-220501096-AA5-EV01  
**Fecha:** 30 de octubre de 2026

## Introducción y objetivo

Se implementa un servicio HTTP que recibe un usuario y una contraseña, permite
registrar una cuenta y comprueba posteriormente sus credenciales. Los clientes
intercambian mensajes JSON, por lo que los métodos pueden reutilizarse desde una
aplicación web, móvil o una herramienta de pruebas. La pantalla incluida es un
cliente de demostración de esos mismos métodos.

El objetivo es diseñar, codificar, validar y versionar un servicio que responda
con autenticación satisfactoria o con un error de autenticación según el caso.

## Alcance y criterios de aceptación

| Requisito | Comportamiento verificable |
|---|---|
| RF01. Registrar | Un usuario nuevo y una contraseña válida producen HTTP 201. |
| RF02. Autenticar | Las credenciales registradas producen HTTP 200 y “Autenticación satisfactoria”. |
| RF03. Rechazar | Usuario inexistente o contraseña incorrecta producen HTTP 401 y “Error en la autenticación”. |
| RF04. Validar | Datos inválidos producen HTTP 400; usuario repetido produce HTTP 409. |
| RF05. Persistir | La cuenta permanece disponible después de reiniciar el proceso. |
| RF06. Versionar | Código y documentación registrados mediante Git y publicados en GitHub. |

## Contrato HTTP

URL local: `http://127.0.0.1:3000`. Ambas operaciones reciben
`Content-Type: application/json` y un objeto con exactamente dos campos:

```json
{"usuario":"jhon.demo","contrasena":"Solar2026!"}
```

| Método y recurso | Resultado |
|---|---|
| `POST /api/registro` | 201: cuenta creada; 409: nombre ocupado. |
| `POST /api/login` | 200: credenciales correctas; 401: credenciales incorrectas. |
| `GET /api/salud` | 200: servicio disponible. |
| `GET /api/openapi.json` | Contrato OpenAPI del servicio. |

También se contemplan 400 (entrada o JSON inválidos), 404 (ruta inexistente),
405 (método no permitido), 413 (cuerpo demasiado grande), 415 (tipo de contenido
incorrecto), 429 (demasiados intentos) y 500 (error interno sin detalles sensibles).

## Validaciones

- Usuario: texto de 3 a 30 caracteres. Se quitan espacios de los extremos y se
  convierte a minúsculas. Debe comenzar con letra ASCII o número; el resto admite
  letras ASCII, números, punto, guion y guion bajo. La normalización se aplica al
  registro y al inicio de sesión: `JHON.demo` y `jhon.demo` son la misma cuenta.
- Contraseña: texto de 8 a 128 unidades UTF-16, con al menos un carácter distinto
  de espacio. Se conserva exactamente como fue recibida: no se recorta ni se
  convierte a minúsculas. Se permiten espacios internos y caracteres especiales.
- Se rechazan campos ausentes, tipos incorrectos, propiedades adicionales,
  arreglos y JSON mal formado. El límite del cuerpo es 4096 bytes.
- La unicidad se exige también en SQLite, para evitar duplicados simultáneos.
- Se admiten 20 solicitudes de autenticación por dirección IP en una ventana de
  10 minutos. Registro e inicio de sesión comparten ese contador.

## Componentes y responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `src/server.js` | Configura puerto, base de datos y cierre del proceso. |
| `src/app.js` | Recibe HTTP, enruta, valida el formato y devuelve JSON. |
| `src/validation.js` | Valida y normaliza las credenciales. |
| `src/auth-service.js` | Ejecuta las reglas de registro e inicio de sesión. |
| `src/passwords.js` | Calcula y verifica hashes de contraseña. |
| `src/user-repository.js` | Crea el esquema y ejecuta consultas parametrizadas. |
| `src/rate-limit.js` | Limita intentos en memoria por IP. |
| `public/` | Formularios accesibles que consumen la API con `fetch`. |
| `tests/api.test.js` | Pruebas por HTTP sobre un servidor y bases temporales reales. |

Flujo de registro: cliente → ruta HTTP → validación → hash → inserción en SQLite
→ respuesta 201. Flujo de ingreso: cliente → ruta HTTP → validación → consulta
por usuario → comparación del hash → respuesta 200 o 401.

## Modelo de datos

Tabla `usuarios`:

| Campo | Tipo / restricción | Uso |
|---|---|---|
| `id` | INTEGER, clave primaria | Identificador interno. |
| `usuario` | TEXT, UNIQUE, NOT NULL | Nombre normalizado. |
| `password_hash` | TEXT, NOT NULL | Algoritmo, parámetros, sal y hash. |
| `creado_en` | TEXT, NOT NULL | Fecha y hora UTC en formato ISO 8601. |

El archivo `data/usuarios.sqlite` se crea al iniciar. No se incluyen cuentas
precargadas, bases de datos de pruebas ni contraseñas reales en la entrega.

## Decisiones técnicas y seguridad

Se utiliza Node.js 24.x, con HTTP, SQLite, criptografía y pruebas de su biblioteca
estándar. No hay paquetes externos que instalar. SQLite permite persistencia
local sin configurar un servidor de base de datos.

Las contraseñas se guardan mediante scrypt (N=16384, r=8, p=5), una sal aleatoria
de 16 bytes y una clave derivada de 64 bytes. La verificación compara buffers de
igual longitud mediante `timingSafeEqual`. Para usuarios inexistentes también
se ejecuta una derivación, y el mensaje de fallo es el mismo que para una
contraseña incorrecta. Nunca se devuelve el hash ni la contraseña al cliente.

Las consultas usan parámetros; las rutas de archivos son una lista explícita;
las respuestas incluyen cabeceras de seguridad y no se permite CORS abierto.
El servidor escucha únicamente en `127.0.0.1` y no registra cuerpos de petición.

Este ejercicio verifica credenciales y devuelve el mensaje requerido. No crea
una sesión persistente ni emite un token de acceso. El limitador es local al
proceso y se reinicia al detenerlo. Para un sistema desplegado se requeriría
adaptar sesiones o tokens, HTTPS, límites compartidos y gestión operativa.

## Referencias técnicas

- Node.js, HTTP: https://nodejs.org/docs/latest-v24.x/api/http.html
- Node.js, SQLite: https://nodejs.org/docs/latest-v24.x/api/sqlite.html
- Node.js, Crypto: https://nodejs.org/docs/latest-v24.x/api/crypto.html
- Node.js, Test runner: https://nodejs.org/docs/latest-v24.x/api/test.html
- Git: https://git-scm.com/docs
- SENA: instrumento de evaluación IE-GA7-220501096-AA5-EV01 suministrado.
