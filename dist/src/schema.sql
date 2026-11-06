-- El catálogo mantiene código, nombre, categoría, precio y existencias de AA4.
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('CLIENTE', 'ADMIN')),
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  municipio TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  creado_en TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  expira_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('PANEL_SOLAR','INVERSOR','BATERIA','KIT_SOLAR','ACCESORIO')),
  precio_centavos INTEGER NOT NULL CHECK (precio_centavos BETWEEN 1 AND 999999999999),
  existencias INTEGER NOT NULL CHECK (existencias BETWEEN 0 AND 1000000),
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  creado_en TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS cotizaciones (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  total_centavos TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  expira_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_cotizaciones_usuario ON cotizaciones(usuario_id);
-- Se conserva una copia del nombre y precio al cotizar: cambios posteriores no alteran el documento.
CREATE TABLE IF NOT EXISTS cotizacion_items (
  cotizacion_id INTEGER NOT NULL REFERENCES cotizaciones(id),
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  precio_centavos INTEGER NOT NULL CHECK (precio_centavos > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad BETWEEN 1 AND 10000),
  PRIMARY KEY (cotizacion_id, producto_id)
) STRICT;
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY,
  cotizacion_id INTEGER NOT NULL UNIQUE REFERENCES cotizaciones(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE','ENVIADO','ENTREGADO','CANCELADO')),
  total_centavos TEXT NOT NULL,
  envio_json TEXT NOT NULL,
  creado_en TEXT NOT NULL,
  actualizado_en TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  pedido_id INTEGER REFERENCES pedidos(id),
  variacion INTEGER NOT NULL,
  saldo INTEGER NOT NULL CHECK (saldo BETWEEN 0 AND 1000000),
  motivo TEXT NOT NULL,
  creado_en TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON movimientos(producto_id);
