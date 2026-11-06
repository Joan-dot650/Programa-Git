# Documentación de servicios · RaízVolt

Jhon Edwards Tineo Landaeta · Ficha 3235874 · Análisis y Desarrollo de Software · SENA

Base local: `http://127.0.0.1:3000`. Fecha: 2 de noviembre de 2026 (Colombia).

Hay 23 operaciones HTTP documentadas: 22 de funcionamiento y una que entrega OpenAPI.
La página `/` presenta este manual. No es un front-end comercial.

## Convenciones comunes

- En solicitudes con cuerpo: `Content-Type: application/json`. Máximo 32768 bytes, UTF-8 y sin compresión.
- Rutas protegidas: `Authorization: Bearer <token obtenido al iniciar sesión>`.
- ADMIN puede administrar catálogo e inventario. CLIENTE puede consultar catálogo y gestionar sus cotizaciones/pedidos.
- Una sesión por usuario, vigencia de 2 horas. Un nuevo login revoca la anterior. Logout la elimina.
- Registro/login comparten 20 solicitudes por IP cada 10 minutos; HTTP 429 incluye `Retry-After`.
- No se aceptan campos desconocidos, identificadores arbitrarios de propietario ni parámetros duplicados.
- Los listados usan `pagina` (1-1000000, defecto 1) y `limite` (1-100, defecto 20).
- Precios COP como texto con punto decimal. Se guardan centavos enteros; las sumas usan BigInt.
- Los textos se recortan y no admiten caracteres de control. La contraseña conserva sus espacios.
- Fechas del servidor en ISO 8601 UTC; no se reciben fechas del cliente.
- Los ejemplos son ficticios y muestran el formato, no capturas de ejecuciones. El token de ceros no sirve para acceder.
- `total` en cotizaciones/pedidos es el valor de los productos; no se calculan impuestos ni flete y no representa un pago.
- Para cliente, un recurso de otro usuario responde 404. ADMIN puede consultar todos los pedidos/cotizaciones, pero solo convertir sus propias cotizaciones.
- HTTP 204 no contiene cuerpo. Otros errores tienen `exito:false`, `mensaje` y opcionalmente `errores` por campo.

## Índice de servicios

| ID | Método y ruta | Acceso | Propósito |
|---|---|---|---|
| S01 | `GET /api/salud` | PUBLICO | Comprobar disponibilidad |
| S02 | `POST /api/registro` | PUBLICO | Registrar cliente |
| S03 | `POST /api/login` | PUBLICO | Iniciar sesión |
| S04 | `POST /api/logout` | USUARIO | Cerrar sesión |
| S05 | `GET /api/perfil` | USUARIO | Consultar perfil propio |
| S06 | `PUT /api/perfil` | USUARIO | Completar o actualizar perfil |
| S07 | `GET /api/categorias` | PUBLICO | Consultar categorías |
| S08 | `GET /api/productos` | PUBLICO | Listar y buscar productos |
| S09 | `GET /api/productos/{id}` | PUBLICO | Consultar producto |
| S10 | `POST /api/productos` | ADMIN | Registrar producto |
| S11 | `PUT /api/productos/{id}` | ADMIN | Actualizar producto |
| S12 | `DELETE /api/productos/{id}` | ADMIN | Retirar producto |
| S13 | `GET /api/inventario` | ADMIN | Consultar resumen de inventario |
| S14 | `GET /api/inventario/movimientos` | ADMIN | Consultar movimientos |
| S15 | `POST /api/productos/{id}/inventario` | ADMIN | Ajustar existencias |
| S16 | `POST /api/cotizaciones` | USUARIO | Crear cotización |
| S17 | `GET /api/cotizaciones` | USUARIO | Listar cotizaciones |
| S18 | `GET /api/cotizaciones/{id}` | USUARIO | Consultar cotización |
| S19 | `POST /api/pedidos` | USUARIO | Confirmar pedido |
| S20 | `GET /api/pedidos` | USUARIO | Listar pedidos |
| S21 | `GET /api/pedidos/{id}` | USUARIO | Consultar pedido |
| S22 | `PATCH /api/pedidos/{id}/estado` | USUARIO | Cambiar estado del pedido |
| S23 | `GET /api/openapi.json` | PUBLICO | Descargar contrato OpenAPI |

## S01 · Comprobar disponibilidad

`GET /api/salud` · Acceso: **PUBLICO**

Comprueba que el proceso HTTP responde. No prueba servicios externos.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "exito": true,
  "mensaje": "RaízVolt API disponible.",
  "version": "1.0.0"
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S02 · Registrar cliente

`POST /api/registro` · Acceso: **PUBLICO**

Crea una cuenta CLIENTE. No inicia sesión. Para ADMIN se usa un comando local.

Cuerpo JSON de ejemplo:

```json
{
  "usuario": "cliente.demo",
  "contrasena": "ClaveDemo2026!"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `usuario` | string. Se quitan espacios externos y se convierte a minúsculas. Luego debe cumplir ^[a-z0-9][a-z0-9._-]{2,29}$. minLength=3; maxLength=30 |
| `contrasena` | string. No se recorta ni normaliza. No se admiten solo espacios. minLength=8; maxLength=128 |

Respuesta correcta: **HTTP 201**.

```json
{
  "exito": true,
  "mensaje": "Registro satisfactorio.",
  "usuario": {
    "id": 2,
    "usuario": "cliente.demo",
    "rol": "CLIENTE",
    "nombre": "",
    "telefono": "",
    "municipio": "",
    "direccion": "",
    "creadoEn": "2026-11-03T01:00:00.000Z"
  }
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 405 | Método no permitido para este recurso. |
| 409 | El nombre de usuario ya existe. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 429 | Se superaron 20 solicitudes de registro/login por IP en 10 minutos. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S03 · Iniciar sesión

`POST /api/login` · Acceso: **PUBLICO**

Verifica la contraseña y entrega un token aleatorio de 2 horas. Invalida la sesión anterior de la misma cuenta.

Cuerpo JSON de ejemplo:

```json
{
  "usuario": "cliente.demo",
  "contrasena": "ClaveDemo2026!"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `usuario` | string. Se quitan espacios externos y se convierte a minúsculas. Luego debe cumplir ^[a-z0-9][a-z0-9._-]{2,29}$. minLength=3; maxLength=30 |
| `contrasena` | string. No se recorta ni normaliza. No se admiten solo espacios. minLength=8; maxLength=128 |

Respuesta correcta: **HTTP 200**.

```json
{
  "exito": true,
  "mensaje": "Autenticación satisfactoria",
  "token": "0000000000000000000000000000000000000000000000000000000000000000",
  "tipo": "Bearer",
  "expiraEn": "2026-11-03T03:00:00.000Z",
  "usuario": {
    "id": 2,
    "usuario": "cliente.demo",
    "rol": "CLIENTE",
    "nombre": "Cliente de demostración",
    "telefono": "+57 300 000 0000",
    "municipio": "Zipaquirá",
    "direccion": "Calle de prueba 10-20",
    "creadoEn": "2026-11-03T01:00:00.000Z"
  }
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Credenciales incorrectas. |
| 405 | Método no permitido para este recurso. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 429 | Se superaron 20 solicitudes de registro/login por IP en 10 minutos. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S04 · Cerrar sesión

`POST /api/logout` · Acceso: **USUARIO**

Revoca el token utilizado. La solicitud no requiere cuerpo.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 204**.

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S05 · Consultar perfil propio

`GET /api/perfil` · Acceso: **USUARIO**

Entrega solo los datos de la cuenta autenticada.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 2,
  "usuario": "cliente.demo",
  "rol": "CLIENTE",
  "nombre": "Cliente de demostración",
  "telefono": "+57 300 000 0000",
  "municipio": "Zipaquirá",
  "direccion": "Calle de prueba 10-20",
  "creadoEn": "2026-11-03T01:00:00.000Z"
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S06 · Completar o actualizar perfil

`PUT /api/perfil` · Acceso: **USUARIO**

Reemplaza los cuatro campos de contacto. El perfil debe estar completo para confirmar un pedido. No modifica usuario ni rol.

Cuerpo JSON de ejemplo:

```json
{
  "nombre": "Cliente de demostración",
  "telefono": "+57 300 000 0000",
  "municipio": "Zipaquirá",
  "direccion": "Calle de prueba 10-20"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `nombre` | string.  minLength=3; maxLength=100 |
| `telefono` | string. Al menos siete dígitos. Admite + inicial, espacios, paréntesis y guiones. minLength=7; maxLength=20 |
| `municipio` | string.  minLength=3; maxLength=80 |
| `direccion` | string.  minLength=5; maxLength=200 |

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 2,
  "usuario": "cliente.demo",
  "rol": "CLIENTE",
  "nombre": "Cliente de demostración",
  "telefono": "+57 300 000 0000",
  "municipio": "Zipaquirá",
  "direccion": "Calle de prueba 10-20",
  "creadoEn": "2026-11-03T01:00:00.000Z"
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 405 | Método no permitido para este recurso. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S07 · Consultar categorías

`GET /api/categorias` · Acceso: **PUBLICO**

Devuelve las cinco categorías del modelo de RaízVolt.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "categorias": [
    "PANEL_SOLAR",
    "INVERSOR",
    "BATERIA",
    "KIT_SOLAR",
    "ACCESORIO"
  ]
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S08 · Listar y buscar productos

`GET /api/productos` · Acceso: **PUBLICO**

Solo lista productos activos. q busca coincidencia literal parcial en código o nombre sin distinguir mayúsculas, incluidas tildes. total cuenta todos los resultados del filtro.

Consulta: `pagina=1&limite=20`. Límites: página 1-1000000; tamaño 1-100.

Filtros opcionales: `q` (0-120 caracteres) y `categoria` (una de las cinco categorías). Ejemplo: `/api/productos?q=panel&categoria=PANEL_SOLAR&pagina=1&limite=20`.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "productos": [
    {
      "id": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "categoria": "PANEL_SOLAR",
      "precio": "680000.50",
      "existencias": 20,
      "activo": true
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 20
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S09 · Consultar producto

`GET /api/productos/{id}` · Acceso: **PUBLICO**

Consulta por identificador; los retirados no están disponibles.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": 20,
  "activo": true
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 404 | Producto inexistente o retirado. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S10 · Registrar producto

`POST /api/productos` · Acceso: **ADMIN**

Crea producto y registra el movimiento inicial de inventario en una transacción. Devuelve Location.

Cuerpo JSON de ejemplo:

```json
{
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": 20
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `codigo` | string. Se recorta y convierte a mayúsculas. Solo A-Z, 0-9 y guion; único incluso después de retirar el producto. minLength=3; maxLength=30 |
| `nombre` | string.  minLength=3; maxLength=120 |
| `categoria` | string.  enum=['PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO'] |
| `precio` | string. Importe COP mayor que 0 y hasta 9999999999.99. Texto con punto decimal y sin separador de miles.  |
| `existencias` | integer.  minimum=0; maximum=1000000 |

Respuesta correcta: **HTTP 201**.

```json
{
  "id": 1,
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": 20,
  "activo": true
}
```

Cabecera `Location`: ruta del recurso creado.

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 405 | Método no permitido para este recurso. |
| 409 | Código repetido, incluso si fue retirado. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S11 · Actualizar producto

`PUT /api/productos/{id}` · Acceso: **ADMIN**

Reemplaza código, nombre, categoría y precio. No recibe existencias: se ajustan mediante el servicio de inventario.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo JSON de ejemplo:

```json
{
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `codigo` | string. Se recorta y convierte a mayúsculas. Solo A-Z, 0-9 y guion; único incluso después de retirar el producto. minLength=3; maxLength=30 |
| `nombre` | string.  minLength=3; maxLength=120 |
| `categoria` | string.  enum=['PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO'] |
| `precio` | string. Importe COP mayor que 0 y hasta 9999999999.99. Texto con punto decimal y sin separador de miles.  |

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": 20,
  "activo": true
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 404 | Producto inexistente o retirado. |
| 405 | Método no permitido para este recurso. |
| 409 | Código repetido. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S12 · Retirar producto

`DELETE /api/productos/{id}` · Acceso: **ADMIN**

Realiza baja lógica; conserva pedidos, cotizaciones, movimientos y el código único. Impide nuevas ventas. Sin cuerpo de respuesta.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 204**.

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 404 | Producto inexistente o ya retirado. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S13 · Consultar resumen de inventario

`GET /api/inventario` · Acceso: **ADMIN**

Resume referencias activas, unidades disponibles, referencias con menos de cinco unidades y valor exacto en COP. Los pedidos ya reservados no cuentan como stock disponible.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "referencias": 1,
  "unidades": 20,
  "stockBajo": 0,
  "valorInventario": "13600010.00",
  "moneda": "COP"
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S14 · Consultar movimientos

`GET /api/inventario/movimientos` · Acceso: **ADMIN**

Lista movimientos más recientes primero, incluidos los de productos retirados. Incluye actor, variación, saldo, motivo y pedido relacionado.

Consulta: `pagina=1&limite=20`. Límites: página 1-1000000; tamaño 1-100.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "movimientos": [
    {
      "id": 1,
      "productoId": 1,
      "codigo": "SOL-550",
      "usuarioId": 1,
      "pedidoId": null,
      "variacion": 20,
      "saldo": 20,
      "motivo": "Inventario inicial",
      "creadoEn": "2026-11-03T01:00:00.000Z"
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 20
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S15 · Ajustar existencias

`POST /api/productos/{id}/inventario` · Acceso: **ADMIN**

Suma o resta variacion; exige motivo. Registra el movimiento y actualiza saldo en la misma transacción.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo JSON de ejemplo:

```json
{
  "variacion": 5,
  "motivo": "Ingreso de mercancía de prueba"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `variacion` | integer. Debe ser diferente de cero; el saldo final queda entre 0 y 1000000. minimum=-1000000; maximum=1000000 |
| `motivo` | string.  minLength=5; maxLength=200 |

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": 20,
  "activo": true
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | Se requiere rol ADMIN. |
| 404 | Producto inexistente o retirado. |
| 405 | Método no permitido para este recurso. |
| 409 | Saldo final negativo o superior a 1000000. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S16 · Crear cotización

`POST /api/cotizaciones` · Acceso: **USUARIO**

Obtiene precios del servidor y congela código, nombre y precio. Vigencia: 7 días. No reserva stock; se puede cotizar sin existencias. total suma productos: no incluye flete ni cálculo tributario.

Cuerpo JSON de ejemplo:

```json
{
  "items": [
    {
      "productoId": 1,
      "cantidad": 2
    }
  ]
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `items` | array. No se admiten productoId repetidos. El servidor obtiene los precios del catálogo. minItems=1; maxItems=20 |

Respuesta correcta: **HTTP 201**.

```json
{
  "id": 1,
  "usuarioId": 2,
  "total": "1360001.00",
  "moneda": "COP",
  "creadoEn": "2026-11-03T01:00:00.000Z",
  "venceEn": "2026-11-10T01:00:00.000Z",
  "items": [
    {
      "productoId": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "precioUnitario": "680000.50",
      "cantidad": 2,
      "subtotal": "1360001.00"
    }
  ]
}
```

Cabecera `Location`: ruta del recurso creado.

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 404 | Un producto no existe o está retirado. |
| 405 | Método no permitido para este recurso. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

Cada línea contiene `productoId` entero positivo y `cantidad` entera 1-10000. No se aceptan IDs repetidos, precios ni totales enviados por el cliente.

## S17 · Listar cotizaciones

`GET /api/cotizaciones` · Acceso: **USUARIO**

CLIENTE ve únicamente las propias; ADMIN ve todas. Orden descendente por ID.

Consulta: `pagina=1&limite=20`. Límites: página 1-1000000; tamaño 1-100.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "cotizaciones": [
    {
      "id": 1,
      "usuarioId": 2,
      "total": "1360001.00",
      "moneda": "COP",
      "creadoEn": "2026-11-03T01:00:00.000Z",
      "venceEn": "2026-11-10T01:00:00.000Z",
      "items": [
        {
          "productoId": 1,
          "codigo": "SOL-550",
          "nombre": "Panel solar 550 W",
          "precioUnitario": "680000.50",
          "cantidad": 2,
          "subtotal": "1360001.00"
        }
      ]
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 20
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S18 · Consultar cotización

`GET /api/cotizaciones/{id}` · Acceso: **USUARIO**

Consulta las líneas y los precios guardados. No cambia por ediciones posteriores del producto.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "usuarioId": 2,
  "total": "1360001.00",
  "moneda": "COP",
  "creadoEn": "2026-11-03T01:00:00.000Z",
  "venceEn": "2026-11-10T01:00:00.000Z",
  "items": [
    {
      "productoId": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "precioUnitario": "680000.50",
      "cantidad": 2,
      "subtotal": "1360001.00"
    }
  ]
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 404 | No existe o no pertenece al cliente. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S19 · Confirmar pedido

`POST /api/pedidos` · Acceso: **USUARIO**

Solo permite convertir una cotización propia vigente y con stock. Exige perfil completo. Guarda dirección y reserva todas las líneas de forma atómica. Una cotización admite un solo pedido: reintentar devuelve ese pedido (200), incluso cancelado, sin otra reserva. Para comprar otra vez se crea una cotización nueva.

Cuerpo JSON de ejemplo:

```json
{
  "cotizacionId": 1
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `cotizacionId` | integer.  minimum=1; maximum=9007199254740991 |

Respuesta correcta: **HTTP 201** (201 al crear; 200 al repetir la misma cotización).

```json
{
  "id": 1,
  "cotizacionId": 1,
  "usuarioId": 2,
  "estado": "PENDIENTE",
  "total": "1360001.00",
  "moneda": "COP",
  "envio": {
    "nombre": "Cliente de demostración",
    "telefono": "+57 300 000 0000",
    "municipio": "Zipaquirá",
    "direccion": "Calle de prueba 10-20"
  },
  "creadoEn": "2026-11-03T01:00:00.000Z",
  "actualizadoEn": "2026-11-03T01:00:00.000Z",
  "items": [
    {
      "productoId": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "precioUnitario": "680000.50",
      "cantidad": 2,
      "subtotal": "1360001.00"
    }
  ]
}
```

Cabecera `Location`: ruta del recurso creado.

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 404 | No existe una cotización propia con ese ID. |
| 405 | Método no permitido para este recurso. |
| 409 | Cotización vencida, producto retirado o existencias insuficientes. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S20 · Listar pedidos

`GET /api/pedidos` · Acceso: **USUARIO**

CLIENTE ve sus pedidos; ADMIN ve todos. La dirección es la copia guardada al confirmar.

Consulta: `pagina=1&limite=20`. Límites: página 1-1000000; tamaño 1-100.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "pedidos": [
    {
      "id": 1,
      "cotizacionId": 1,
      "usuarioId": 2,
      "estado": "PENDIENTE",
      "total": "1360001.00",
      "moneda": "COP",
      "envio": {
        "nombre": "Cliente de demostración",
        "telefono": "+57 300 000 0000",
        "municipio": "Zipaquirá",
        "direccion": "Calle de prueba 10-20"
      },
      "creadoEn": "2026-11-03T01:00:00.000Z",
      "actualizadoEn": "2026-11-03T01:00:00.000Z",
      "items": [
        {
          "productoId": 1,
          "codigo": "SOL-550",
          "nombre": "Panel solar 550 W",
          "precioUnitario": "680000.50",
          "cantidad": 2,
          "subtotal": "1360001.00"
        }
      ]
    }
  ],
  "total": 1,
  "pagina": 1,
  "limite": 20
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S21 · Consultar pedido

`GET /api/pedidos/{id}` · Acceso: **USUARIO**

Devuelve estado, líneas, total y dirección preservada.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "cotizacionId": 1,
  "usuarioId": 2,
  "estado": "PENDIENTE",
  "total": "1360001.00",
  "moneda": "COP",
  "envio": {
    "nombre": "Cliente de demostración",
    "telefono": "+57 300 000 0000",
    "municipio": "Zipaquirá",
    "direccion": "Calle de prueba 10-20"
  },
  "creadoEn": "2026-11-03T01:00:00.000Z",
  "actualizadoEn": "2026-11-03T01:00:00.000Z",
  "items": [
    {
      "productoId": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "precioUnitario": "680000.50",
      "cantidad": 2,
      "subtotal": "1360001.00"
    }
  ]
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 404 | No existe o no pertenece al cliente. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S22 · Cambiar estado del pedido

`PATCH /api/pedidos/{id}/estado` · Acceso: **USUARIO**

ADMIN: PENDIENTE a ENVIADO y ENVIADO a ENTREGADO. El propietario o ADMIN puede cancelar solo PENDIENTE, devolviendo existencias una vez. Repetir el estado actual devuelve 200 sin nuevos movimientos. CANCELADO y ENTREGADO son finales.

Parámetro de ruta `id`: entero positivo, máximo 9007199254740991.

Cuerpo JSON de ejemplo:

```json
{
  "estado": "CANCELADO"
}
```

Campos de entrada (todos obligatorios):

| Campo | Tipo y regla |
|---|---|
| `estado` | string.  enum=['ENVIADO', 'ENTREGADO', 'CANCELADO'] |

Respuesta correcta: **HTTP 200**.

```json
{
  "id": 1,
  "cotizacionId": 1,
  "usuarioId": 2,
  "estado": "PENDIENTE",
  "total": "1360001.00",
  "moneda": "COP",
  "envio": {
    "nombre": "Cliente de demostración",
    "telefono": "+57 300 000 0000",
    "municipio": "Zipaquirá",
    "direccion": "Calle de prueba 10-20"
  },
  "creadoEn": "2026-11-03T01:00:00.000Z",
  "actualizadoEn": "2026-11-03T01:00:00.000Z",
  "items": [
    {
      "productoId": 1,
      "codigo": "SOL-550",
      "nombre": "Panel solar 550 W",
      "precioUnitario": "680000.50",
      "cantidad": 2,
      "subtotal": "1360001.00"
    }
  ]
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 401 | Token ausente, inválido, revocado o vencido. |
| 403 | El cliente intentó enviar o entregar. |
| 404 | No existe o no pertenece al cliente. |
| 405 | Método no permitido para este recurso. |
| 409 | Transición inválida o devolución que supera 1000000 unidades. |
| 413 | Cuerpo superior a 32768 bytes. |
| 415 | Se requiere application/json sin compresión. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |

## S23 · Descargar contrato OpenAPI

`GET /api/openapi.json` · Acceso: **PUBLICO**

Entrega la especificación completa de los servicios, entradas, respuestas, errores y autenticación.

Cuerpo de solicitud: no se requiere.

Respuesta correcta: **HTTP 200**.

```json
{
  "openapi": "3.1.1",
  "info": {
    "title": "RaízVolt API",
    "version": "1.0.0"
  },
  "paths": {}
}
```

Errores:

| HTTP | Causa |
|---|---|
| 400 | Datos, identificador o parámetros de consulta inválidos. |
| 405 | Método no permitido para este recurso. |
| 500 | Error interno; no se exponen trazas ni consultas SQL. |
