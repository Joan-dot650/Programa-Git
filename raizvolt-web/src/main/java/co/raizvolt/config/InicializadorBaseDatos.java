package co.raizvolt.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

/** Crea la tabla local una sola vez, sin borrar ni reponer datos del usuario. */
public final class InicializadorBaseDatos {
  private InicializadorBaseDatos() {
  }

  public static void inicializar(ConexionBaseDatos conexion,
      boolean crearEsquemaLocal) throws SQLException, IOException {
    try (Connection baseDatos = conexion.abrir();
        Statement sentencia = baseDatos.createStatement()) {
      if (crearEsquemaLocal) {
        try (InputStream recurso = InicializadorBaseDatos.class
            .getResourceAsStream("/sql/esquema.sql")) {
          if (recurso == null) {
            throw new IOException("No se encontró el recurso sql/esquema.sql.");
          }
          String sql = new String(
              recurso.readAllBytes(), StandardCharsets.UTF_8);
          sentencia.executeUpdate(sql);
        }
      } else {
        // En MySQL el administrador importa primero database/mysql.sql.
        try (var resultado = sentencia.executeQuery(
            "SELECT id FROM productos WHERE 1 = 0")) {
          resultado.getMetaData();
        }
      }
    }
  }
}
