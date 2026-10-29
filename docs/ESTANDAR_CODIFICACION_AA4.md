# Estándar de codificación

| Aspecto | Aplicación |
| --- | --- |
| Componentes | PascalCase: `FormularioProducto.jsx`; una responsabilidad por componente. |
| Funciones/variables | camelCase en español: `validarProducto`, `erroresServidor`. |
| Constantes | MAYÚSCULAS_CON_GUION_BAJO: `CATEGORIAS`, `BASE_API`. |
| Java | Clases PascalCase, métodos camelCase y paquetes en minúsculas bajo `co.raizvolt`. |
| Capas | Componentes presentan; servicio JS comunica; controlador adapta; servicio Java valida; DAO persiste. |
| Formato | UTF-8, dos espacios, punto y coma; comillas simples en JS y dobles en JSX. |
| Estado | Setters y cambios inmutables; props de solo lectura; conteos derivados. |
| Listas | Clave estable `producto.id`, sin índices como identidad. |
| Eventos | Callbacks explícitos; `type` de botón; escrituras desde acciones del usuario. |
| Comentarios | Explican precisión, CSRF, cancelación de consultas y bloqueo de doble envío. |
| Errores | Mensajes legibles sin SQL ni trazas; se conserva el formulario. |
| Seguridad | SQL parametrizado, CSRF, validación en servidor y escape de texto de React. |
| Versionamiento | Versiones fijadas; datos, compilados y secretos fuera de Git. |

No se usa `dangerouslySetInnerHTML`, `eval` ni almacenamiento del inventario en
el navegador. El formato monetario conserva centavos sin cálculos en flotantes.
El CSS mantiene la paleta del prototipo anterior.
