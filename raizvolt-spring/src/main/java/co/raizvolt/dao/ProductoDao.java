package co.raizvolt.dao;

import co.raizvolt.modelo.Producto;
import java.util.List;
import java.util.Optional;

/** Contrato CRUD del catálogo. */
public interface ProductoDao {
  Producto insertar(Producto producto);
  List<Producto> consultar(String texto);
  Optional<Producto> buscarPorId(long id);
  boolean actualizar(Producto producto);
  boolean eliminar(long id);
}
