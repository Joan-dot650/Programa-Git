# Contrato JSON

Base: `http://localhost:8080/raizvolt/api`. La interfaz compilada comparte origen.
En desarrollo Vite reenvía esta ruta al servidor Java; no se habilita CORS global.

| Método | Ruta | Respuesta correcta |
| --- | --- | --- |
| GET | `/csrf` | 200: `headerName` y `token`. |
| GET | `/productos?q=panel` | 200: productos y `valorInventario` exacto como texto. Búsqueda de hasta 120 caracteres. |
| GET | `/productos/{id}` | 200: producto. |
| POST | `/productos` | 201: producto creado con ID generado. |
| PUT | `/productos/{id}` | 200: producto actualizado. |
| DELETE | `/productos/{id}` | 204: sin contenido. |

Entrada de registro o edición:

```json
{
  "codigo": "SOL-550",
  "nombre": "Panel solar 550 W",
  "categoria": "PANEL_SOLAR",
  "precio": "680000.50",
  "existencias": "12"
}
```

Salida de consulta:

```json
{
  "productos": [
    { "id": 1, "codigo": "SOL-550", "nombre": "Panel solar 550 W",
      "categoria": "PANEL_SOLAR", "precio": "680000.50", "existencias": 12 }
  ],
  "valorInventario": "8160006.00"
}
```

Precio y valor se devuelven como cadenas para conservar centavos. React usa
`BigInt` para agrupar la parte entera al presentar importes grandes.

| Error | Significado |
| --- | --- |
| 400 | Campos inválidos, JSON incorrecto, ID no numérico o búsqueda larga. |
| 403 | CSRF ausente/inválido; la siguiente escritura pide un nuevo token. |
| 404 | Producto inexistente. |
| 409 | Código repetido. |
| 503 | Base de datos no disponible. |

```json
{
  "mensaje": "Ya existe un producto con ese código.",
  "errores": { "codigo": "Este código ya está registrado. Utiliza otro." }
}
```

Los errores de campo mantienen el formulario. Los fallos generales muestran un
aviso. CSRF puede responder fuera del controlador; el cliente maneja también
un cuerpo que no sea JSON.

Antes de POST, PUT o DELETE, el cliente consulta `/csrf`, conserva la cookie de
sesión y envía el token en la cabecera indicada por `headerName`. No se desactiva
la protección ni se publican tokens o contraseñas en Git.
