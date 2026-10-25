package co.raizvolt.dao;

import co.raizvolt.config.ConexionBaseDatos;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Implementación JDBC con parámetros y cierre automático de recursos. */
public final class ProductoDaoJdbc implements ProductoDao {
  private static final String COLUMNAS =
      "id, codigo, nombre, categoria, precio, existencias";
  private final ConexionBaseDatos conexion;

  public ProductoDaoJdbc(ConexionBaseDatos conexion) {
    this.conexion = conexion;
  }

  @Override
  public Producto insertar(Producto producto) {
    String sql = "INSERT INTO productos "
        + "(codigo, nombre, categoria, precio, existencias) "
        + "VALUES (?, ?, ?, ?, ?)";
    try (Connection baseDatos = conexion.abrir();
        PreparedStatement sentencia = baseDatos.prepareStatement(
            sql, Statement.RETURN_GENERATED_KEYS)) {
      asignarParametros(sentencia, producto);
      if (sentencia.executeUpdate() != 1) {
        throw new SQLException("No se insertó el producto.");
      }
      try (ResultSet claves = sentencia.getGeneratedKeys()) {
        if (!claves.next()) {
          throw new SQLException("No se recibió el identificador generado.");
        }
        return new Producto(claves.getLong(1), producto.getCodigo(),
            producto.getNombre(), producto.getCategoria(),
            producto.getPrecio(), producto.getExistencias());
      }
    } catch (SQLException error) {
      throw traducirError(error);
    }
  }

  @Override
  public List<Producto> consultar(String texto) {
    String sql = "SELECT " + COLUMNAS + " FROM productos "
        + "WHERE UPPER(codigo) LIKE ? ESCAPE '!' "
        + "OR UPPER(nombre) LIKE ? ESCAPE '!' ORDER BY id DESC";
    // Los comodines se tratan como texto literal escrito por el usuario.
    String patron = "%" + texto.toUpperCase(Locale.ROOT)
        .replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    List<Producto> productos = new ArrayList<>();
    try (Connection baseDatos = conexion.abrir();
        PreparedStatement sentencia = baseDatos.prepareStatement(sql)) {
      sentencia.setString(1, patron);
      sentencia.setString(2, patron);
      try (ResultSet resultado = sentencia.executeQuery()) {
        while (resultado.next()) {
          productos.add(leerProducto(resultado));
        }
      }
      return productos;
    } catch (SQLException error) {
      throw traducirError(error);
    }
  }

  @Override
  public Optional<Producto> buscarPorId(long id) {
    String sql = "SELECT " + COLUMNAS + " FROM productos WHERE id = ?";
    try (Connection baseDatos = conexion.abrir();
        PreparedStatement sentencia = baseDatos.prepareStatement(sql)) {
      sentencia.setLong(1, id);
      try (ResultSet resultado = sentencia.executeQuery()) {
        return resultado.next()
            ? Optional.of(leerProducto(resultado)) : Optional.empty();
      }
    } catch (SQLException error) {
      throw traducirError(error);
    }
  }

  @Override
  public boolean actualizar(Producto producto) {
    String sql = "UPDATE productos SET codigo = ?, nombre = ?, "
        + "categoria = ?, precio = ?, existencias = ? WHERE id = ?";
    try (Connection baseDatos = conexion.abrir();
        PreparedStatement sentencia = baseDatos.prepareStatement(sql)) {
      asignarParametros(sentencia, producto);
      sentencia.setLong(6, producto.getId());
      return sentencia.executeUpdate() == 1;
    } catch (SQLException error) {
      throw traducirError(error);
    }
  }

  @Override
  public boolean eliminar(long id) {
    try (Connection baseDatos = conexion.abrir();
        PreparedStatement sentencia = baseDatos.prepareStatement(
            "DELETE FROM productos WHERE id = ?")) {
      sentencia.setLong(1, id);
      return sentencia.executeUpdate() == 1;
    } catch (SQLException error) {
      throw traducirError(error);
    }
  }

  private void asignarParametros(PreparedStatement sentencia,
      Producto producto) throws SQLException {
    sentencia.setString(1, producto.getCodigo());
    sentencia.setString(2, producto.getNombre());
    sentencia.setString(3, producto.getCategoria().name());
    sentencia.setBigDecimal(4, producto.getPrecio());
    sentencia.setInt(5, producto.getExistencias());
  }

  private Producto leerProducto(ResultSet resultado) throws SQLException {
    return new Producto(resultado.getLong("id"),
        resultado.getString("codigo"), resultado.getString("nombre"),
        Categoria.valueOf(resultado.getString("categoria")),
        resultado.getBigDecimal("precio"), resultado.getInt("existencias"));
  }

  private ErrorPersistencia traducirError(SQLException error) {
    String mensaje;
    if ("23505".equals(error.getSQLState()) || error.getErrorCode() == 1062) {
      mensaje = "Ya existe un producto con ese código. Usa otro código.";
    } else if (error.getSQLState() != null
        && error.getSQLState().startsWith("08")) {
      mensaje = "No se pudo conectar con la base de datos. "
          + "Revisa el servidor y config/database.properties.";
    } else {
      mensaje = "No se pudo completar la operación en la base de datos. "
          + "Revisa la configuración y el esquema.";
    }
    return new ErrorPersistencia(mensaje, error);
  }
}
