# Módulos, componentes y contratos de entrada/salida

Se conserva la aplicación Node.js/SQLite de EV01. La API y la interfaz comparten origen. Los datos de prueba son ficticios. La especificación completa se conserva en SERVICIOS.md y openapi.json.

| Módulo | Entrada | Salida | Persistencia / componentes |
|---|---|---|---|
| Acceso | usuario 3-30 caracteres; contrasena 8-128; token Bearer al salir | Registro 201; login 200 con token, tipo, expiraEn y usuario; logout 204 | usuarios y sesiones; account.js, auth-service.js, passwords.js |
| Perfil | nombre 3-100, telefono 7-20, municipio 3-80, direccion 5-200; sesión | Perfil propio actualizado 200, sin password_hash | usuarios; account.js, auth-service.js |
| Catálogo | filtros q/categoria/pagina/limite; ID; para ADMIN codigo, nombre, categoria, precio decimal en texto y existencias al crear | Producto o lista paginada; 201 creación, 200 edición, 204 baja lógica | productos; catalog.js, admin.js, catalog-service.js |
| Inventario | ID, variacion entero distinto de cero y motivo; ADMIN | Saldo actualizado, resumen e historial de movimientos | productos/movimientos; admin.js, catalog-service.js |
| Carrito | ID y cantidad 1-10000; hasta 20 referencias | items con productoId/cantidad para cotizar | Solo memoria; cart.js |
| Cotizaciones | items de 1-20 referencias sin repetir; sesión | ID, items con precios del servidor, total COP y venceEn a 7 días | cotizaciones/cotizacion_items; sales.js, sales-service.js |
| Pedidos | cotizacionId propio y perfil completo; estado objetivo | Pedido, estado, copia de entrega, items y total; 201 nuevo/200 reintento | pedidos y movimientos; sales.js, sales-service.js |

## Componentes compartidos

| Archivo | Entrada | Salida / responsabilidad |
|---|---|---|
| public/app.js | hash de ruta y sesión en memoria | Vista activa, menú según rol y cierre de sesión |
| public/api.js | ruta relativa, método, cuerpo | Promesa JSON o error; añade Bearer y maneja 401 |
| public/components.js | texto, importe o función de evento | HTML escapado, formato COP, mensajes y acción protegida |
| public/cart.js | producto y cantidad | lista de items o error de límites |
| src/app.js | solicitud HTTP | HTTP/JSON; permisos, cuerpo máximo, errores y archivos públicos |
| src/validation.js | objetos de petición | valores normalizados o ApiError 400 |
| src/passwords.js | contraseña; hash para verificar | hash scrypt con sal o booleano; comparación de tiempo constante |
| src/rate-limit.js | IP y reloj | segundos de espera o 0; máximo 20 accesos/10 min |
| src/database.js | ruta DB y SQL parametrizado | filas/resultados; transacción con COMMIT o ROLLBACK |
| src/config.js | DB_PATH opcional | ruta absoluta SQLite según fuente o compilado |
| src/errors.js | estado, mensaje y detalles | ApiError controlado; no expone errores SQL internos |
| scripts/build.js | fuentes y lockfile | dist/ y BUILD.json |
| scripts/preparar-demo.js | ruta de BD local | productos ficticios y administrador con contraseña aleatoria |
| scripts/crear-admin.js | usuario y contraseña local | cuenta ADMIN; nunca se concede rol desde registro web |

## Integración de venta

Catálogo -> carrito -> cotización -> perfil completo -> pedido -> inventario. Cotizar no reserva. Confirmar abre BEGIN IMMEDIATE, valida todas las líneas, crea un único pedido por cotización y registra los descuentos; un fallo revierte todo. Repetir la confirmación devuelve el mismo pedido. Cancelar PENDIENTE devuelve stock una sola vez. ADMIN envía y entrega; no se retrocede de ENTREGADO. Los documentos se filtran por propietario, excepto consultas administrativas.

## Errores y formato

JSON UTF-8. Dinero como texto decimal, por ejemplo "680000.50". HTTP 400 datos inválidos; 401 falta/sesión vencida; 403 rol; 404 recurso ausente o ajeno; 409 conflicto; 413 cuerpo excesivo; 415 tipo; 429 límite; 500 error interno genérico. Nunca registrar tokens ni contraseñas en documentos públicos.
