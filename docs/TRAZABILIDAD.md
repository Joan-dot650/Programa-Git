# Requisitos e integración

Los identificadores HU-PR01 a HU-PR04 y HU-API01 a HU-API05 provienen de la documentación de la API anterior. Las historias API fueron propuestas en aquella entrega; no se atribuye aprobación al instructor. Los criterios UI de esta tabla concretan su integración en GA8.

| Requisito | Historia / caso | Implementación y criterio de aceptación | Prueba |
|---|---|---|---|
| RF01 | Registro e inicio de sesión AA5-EV01; HU-API01 | Cliente se registra, accede, guarda perfil y sale; sin hashes en respuestas; cuenta pública nunca ADMIN. | U-A01 a U-A06; E-02/E-03/E-12; API autenticación. |
| RF02 | HU-PR02: consultar catálogo | Visitante busca por código/nombre, filtra categoría y pagina; detalle y existencias proceden del servidor. | U-C01; E-01/E-11; API filtros y paginación. |
| RF03 | HU-PR01: crear producto | ADMIN crea código único, precio válido y stock entero. | U-V05; E-08; API alta y duplicados. |
| RF04 | HU-PR03: editar producto | ADMIN cambia datos; el stock cambia mediante ajuste con motivo. | U-C03; E-08; API edición. |
| RF05 | HU-PR04: retirar producto | Baja lógica excluye del catálogo sin borrar historia. | E-09; API baja y conservación. |
| RF06 | HU-API02: inventario | ADMIN registra variación y motivo; saldo no negativo; resumen exacto y movimientos. | U-C02/U-C03; E-08; API movimientos. |
| RF07 | HU-API03: cotización | Cliente selecciona 1-20 productos; precio del servidor; vigencia de 7 días; sin reserva. | U-S04/U-V06/U-F01 a U-F03; E-04. |
| RF08 | HU-API04: pedido | Perfil completo, cotización propia vigente y stock; transacción atómica; repetición sin descuento doble. | U-S01/U-S05/U-D01; E-04/E-05; API rollback. |
| RF09 | HU-API05: estados | PENDIENTE a ENVIADO a ENTREGADO por ADMIN; cancelación de PENDIENTE por propietario o ADMIN devuelve stock una vez. | U-S02/U-S03; E-06/E-10; API transiciones. |
| RNF01 | Seguridad | Servidor comprueba roles y propiedad, valida campos, cifra derivación de contraseña, limita intentos; UI escapa datos. | U-A01 a U-A06/U-F04; E-07; API permisos. |
| RNF02 | Mantenibilidad | Módulos ES, nombres claros, capas, componentes de formularios, tablas y paginación reutilizables; build reproducible. | Compilación, pruebas unitarias y configuración IDE. |
| RNF03 | Persistencia y uso web | SQLite persistente, interfaz adaptable, sesión solo en memoria. | API reinicio; E-11/E-12. |

## Casos de uso integrados

**CU01 - Cotizar y confirmar pedido.** Actor: cliente autenticado. Precondiciones: perfil completo, producto activo y cotización vigente. Flujo: catálogo > añadir > cotizaciones > generar > confirmar > pedido pendiente. El servidor vuelve a comprobar stock, graba pedido, resta existencias y registra movimientos en una sola transacción. Si una línea falla, no se conserva ningún descuento parcial. La cotización conserva el precio original aun si después cambia el catálogo.

**CU02 - Administrar catálogo e inventario.** Actor: ADMIN creado localmente. Flujo: Administración > nuevo/editar/retirar; ajuste de stock exige variación y motivo. Excepciones: código repetido 409, dato inválido 400, sin token 401 o rol incorrecto 403. La interfaz no sustituye los permisos del servidor.

**CU03 - Cancelar o despachar.** Cliente solo cancela su pedido pendiente; ADMIN además despacha y entrega. Las transiciones no permitidas responden 409. Repetir la misma cancelación no devuelve stock por segunda vez.

## Metodología aplicada

Trabajo incremental con tablero Kanban local propuesto: Pendiente > En desarrollo > En prueba > Terminado. Incremento 1: recuperar contrato y requisitos; incremento 2: implementar vistas y componentes reutilizables; incremento 3: conectar reglas y verificar integración; incremento 4: compilar, documentar y versionar. Criterio de terminado: historia con implementación, prueba aprobada, documentación y cambio registrado. No se inventan reuniones, duración de sprints ni aprobaciones de un equipo externo.
