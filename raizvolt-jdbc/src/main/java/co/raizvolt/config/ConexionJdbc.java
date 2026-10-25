package co.raizvolt.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/** Abre conexiones reales JDBC; nunca conserva una conexión global. */
public final class ConexionJdbc implements ConexionBaseDatos {
  private final ConfiguracionBaseDatos configuracion;

  public ConexionJdbc(ConfiguracionBaseDatos configuracion) {
    this.configuracion = configuracion;
  }

  @Override
  public Connection abrir() throws SQLException {
    return DriverManager.getConnection(configuracion.getUrl(),
        configuracion.getUsuario(), configuracion.getContrasena());
  }
}
