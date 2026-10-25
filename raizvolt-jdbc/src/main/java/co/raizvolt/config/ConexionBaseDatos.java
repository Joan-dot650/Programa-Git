package co.raizvolt.config;

import java.sql.Connection;
import java.sql.SQLException;

/** Permite cambiar el motor sin modificar el DAO. */
@FunctionalInterface
public interface ConexionBaseDatos {
  Connection abrir() throws SQLException;
}
