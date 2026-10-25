-- Importar con una cuenta administradora en MySQL 8.0.16 o superior.
-- No borra bases ni tablas existentes.
CREATE DATABASE IF NOT EXISTS raizvolt
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE raizvolt;

CREATE TABLE IF NOT EXISTS productos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  categoria VARCHAR(20) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  existencias INT NOT NULL,
  CONSTRAINT chk_precio CHECK (precio > 0),
  CONSTRAINT chk_existencias CHECK (existencias BETWEEN 0 AND 1000000),
  CONSTRAINT chk_categoria CHECK (categoria IN
    ('PANEL_SOLAR', 'INVERSOR', 'BATERIA', 'KIT_SOLAR', 'ACCESORIO'))
) ENGINE=InnoDB;
