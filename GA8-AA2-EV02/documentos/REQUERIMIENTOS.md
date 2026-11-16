# Requerimientos, reglas y metodología

El módulo Android atiende al asesor de ventas de RaízVolt que trabaja sin conexión. Conserva los conceptos de producto, inventario, cliente, cotización y pedido del proyecto web GA8-AA1-EV01. No afirma sincronizar sus bases ni reutilizar el backend dentro del APK. Continúa el uso de Java del taller GA8-AA2-EV01, que era una aplicación de saludo.

| ID | Como asesor quiero... | Criterio de aceptación | Verificación |
| --- | --- | --- | --- |
| RF01 | Consultar y buscar catálogo | Nombre, código o categoría; solo productos activos | CatalogTest, DB01-02, UI01/03 |
| RF02 | Crear, editar y retirar productos | Código único, precio positivo, baja lógica con historial | CatalogTest, DB03-04/11 |
| RF03 | Ajustar inventario | Motivo obligatorio y saldo dentro de rango | CatalogTest, DB05 |
| RF04 | Guardar cliente | Validar nombre, teléfono, ciudad y dirección | ProfileTest, UI02/10 |
| RF05 | Construir carrito | Combinar productos, modificar y quitar cantidades | CartTest, UI04/05 |
| RF06 | Guardar cotización | Precio/cliente congelados; no reservar stock | SalesTest, DB06, UI06 |
| RF07 | Confirmar pedido | Vigencia, stock suficiente, reserva única y atómica | SalesTest, DB07-08, UI07 |
| RF08 | Cancelar pendiente | Devolver existencias una sola vez | SalesTest, DB09, UI08/11 |
| RF09 | Registrar envío y entrega | PENDIENTE → ENVIADO → ENTREGADO | SalesTest, UI09 |
| RF10 | Conservar operaciones | Persistencia al reabrir y rollback ante fallo | DB10/12 |

## Validaciones

- Precio: 0,01 a 999.999.999,99 COP, como centavos en `long`, sin `double`. Entrada sin miles; punto o coma decimal, hasta dos decimales. La vista muestra siempre dos decimales.
- Cantidad: 1 a 999 por línea; máximo 100 productos diferentes por carrito.
- Stock: 0 a 1.000.000. Ajuste distinto de cero; motivo de 3 a 100 caracteres.
- Código: 2 a 24 caracteres, A-Z, números, guion y guion bajo. Único incluso entre productos retirados. Nombre: 3 a 80; categoría: 2 a 40.
- Cliente: nombre 3 a 80, ciudad 2 a 60 y dirección 5 a 160 caracteres. Teléfono de 7 a 15 dígitos, con espacios, paréntesis, + o -. No se permiten caracteres de control.
- Cotización válida hasta exactamente siete días desde su creación, usando el reloj local. Antes de confirmar se revisa el stock de todas las líneas; la cotización no reserva antes de confirmar.
- La confirmación repetida devuelve el mismo pedido. La cancelación repetida no suma inventario otra vez. No se puede cancelar después de enviar.
- Un producto retirado no permite cotizarlo ni confirmar cotizaciones todavía pendientes que lo contengan.
- Estado terminal entregado/cancelado no permite avance. Los datos históricos no cambian al editar el catálogo o el cliente actual.

## Metodología

Desarrollo incremental: definir alcance y reglas; construir dominio y repositorio; implementar catálogo/cliente; integrar ventas; ejecutar pruebas y corregir; documentar y versionar. Los criterios anteriores permiten verificar cada incremento. No se atribuyen reuniones, sprints ni aprobaciones a terceros.

## No funcionales

Capas separadas, paquetes claros, modelos inmutables, componentes visuales reutilizables, consultas parametrizadas, transacciones, datos privados y operaciones SQLite fuera del hilo principal. Sin permisos de red, cámara, ubicación o almacenamiento compartido. No se declara auditoría de accesibilidad, carga ni seguridad de producción.
