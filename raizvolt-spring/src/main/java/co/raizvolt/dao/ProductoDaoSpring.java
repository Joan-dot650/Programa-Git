package co.raizvolt.dao;

import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

/** Implementa el contrato DAO de AA2 mediante la plantilla JDBC de Spring. */
@Repository
public class ProductoDaoSpring implements ProductoDao {
  private static final String COLUMNAS = "id, codigo, nombre, categoria, precio, existencias";
  private static final RowMapper<Producto> MAPEAR_PRODUCTO = (fila, numeroFila) ->
      new Producto(fila.getLong("id"), fila.getString("codigo"), fila.getString("nombre"),
          Categoria.valueOf(fila.getString("categoria")), fila.getBigDecimal("precio"),
          fila.getInt("existencias"));
  private final JdbcTemplate jdbcTemplate;

  public ProductoDaoSpring(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public Producto insertar(Producto producto) {
    var claveGenerada = new GeneratedKeyHolder();
    jdbcTemplate.update(conexion -> {
      // Los parámetros evitan convertir los datos del formulario en instrucciones SQL.
      PreparedStatement sentencia = conexion.prepareStatement(
          "INSERT INTO productos (codigo, nombre, categoria, precio, existencias) "
              + "VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
      sentencia.setString(1, producto.getCodigo());
      sentencia.setString(2, producto.getNombre());
      sentencia.setString(3, producto.getCategoria().name());
      sentencia.setBigDecimal(4, producto.getPrecio());
      sentencia.setInt(5, producto.getExistencias());
      return sentencia;
    }, claveGenerada);
    Number id = claveGenerada.getKey();
    if (id == null) {
      throw new IllegalStateException("No se recuperó el identificador del producto.");
    }
    return new Producto(id.longValue(), producto.getCodigo(), producto.getNombre(),
        producto.getCategoria(), producto.getPrecio(), producto.getExistencias());
  }

  @Override
  public List<Producto> consultar(String texto) {
    // Escapamos comodines para que buscar '%' o '_' tenga significado literal.
    String termino = texto.toLowerCase(Locale.ROOT).replace("!", "!!")
        .replace("%", "!%").replace("_", "!_");
    String patron = "%" + termino + "%";
    return jdbcTemplate.query("SELECT " + COLUMNAS + " FROM productos "
        + "WHERE LOWER(codigo) LIKE ? ESCAPE '!' OR LOWER(nombre) LIKE ? ESCAPE '!' "
        + "ORDER BY id DESC", MAPEAR_PRODUCTO, patron, patron);
  }

  @Override
  public Optional<Producto> buscarPorId(long id) {
    return jdbcTemplate.query("SELECT " + COLUMNAS + " FROM productos WHERE id = ?",
        MAPEAR_PRODUCTO, id).stream().findFirst();
  }

  @Override
  public boolean actualizar(Producto producto) {
    return jdbcTemplate.update("UPDATE productos SET codigo = ?, nombre = ?, "
        + "categoria = ?, precio = ?, existencias = ? WHERE id = ?",
        producto.getCodigo(), producto.getNombre(), producto.getCategoria().name(),
        producto.getPrecio(), producto.getExistencias(), producto.getId()) == 1;
  }

  @Override
  public boolean eliminar(long id) {
    return jdbcTemplate.update("DELETE FROM productos WHERE id = ?", id) == 1;
  }
}
