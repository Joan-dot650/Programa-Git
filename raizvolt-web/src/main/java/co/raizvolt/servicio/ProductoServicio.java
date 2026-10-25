package co.raizvolt.servicio;

import co.raizvolt.dao.ProductoDao;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;

/** Valida las reglas antes de entregar los datos al DAO. */
public final class ProductoServicio {
  private static final BigDecimal PRECIO_MAXIMO =
      new BigDecimal("9999999999.99");
  private static final int EXISTENCIAS_MAXIMAS = 1000000;
  private final ProductoDao productoDao;

  public ProductoServicio(ProductoDao productoDao) {
    this.productoDao = productoDao;
  }

  public Producto registrarProducto(String codigo, String nombre,
      Categoria categoria, String precio, String existencias) {
    return productoDao.insertar(validar(
        0, codigo, nombre, categoria, precio, existencias));
  }

  public List<Producto> consultarProductos(String texto) {
    return productoDao.consultar(texto == null ? "" : texto.strip());
  }

  public Producto buscarProducto(long id) {
    validarId(id);
    return productoDao.buscarPorId(id).orElseThrow(() ->
        new IllegalArgumentException("El producto ya no existe. Actualiza la lista."));
  }

  public void actualizarProducto(long id, String codigo, String nombre,
      Categoria categoria, String precio, String existencias) {
    validarId(id);
    Producto producto = validar(id, codigo, nombre, categoria, precio, existencias);
    if (!productoDao.actualizar(producto)) {
      throw new IllegalArgumentException(
          "El producto ya no existe. Actualiza la lista.");
    }
  }

  public void eliminarProducto(long id) {
    validarId(id);
    if (!productoDao.eliminar(id)) {
      throw new IllegalArgumentException(
          "El producto ya no existe. Actualiza la lista.");
    }
  }

  private void validarId(long id) {
    if (id <= 0) {
      throw new IllegalArgumentException("Selecciona un producto de la tabla.");
    }
  }

  private Producto validar(long id, String codigo, String nombre,
      Categoria categoria, String precioTexto, String existenciasTexto) {
    String codigoLimpio = codigo == null
        ? "" : codigo.strip().toUpperCase(Locale.ROOT);
    String nombreLimpio = nombre == null ? "" : nombre.strip();
    if (!codigoLimpio.matches("[A-Z0-9-]{3,30}")) {
      throw new IllegalArgumentException(
          "El código debe tener de 3 a 30 letras, números o guiones.");
    }
    if (nombreLimpio.length() < 3 || nombreLimpio.length() > 120
        || nombreLimpio.chars().anyMatch(Character::isISOControl)) {
      throw new IllegalArgumentException(
          "El nombre debe tener de 3 a 120 caracteres y una sola línea.");
    }
    if (categoria == null) {
      throw new IllegalArgumentException("Selecciona una categoría.");
    }
    String precioLimpio = precioTexto == null ? "" : precioTexto.strip();
    if (!precioLimpio.matches("[0-9]{1,10}([.,][0-9]{1,2})?")) {
      throw new IllegalArgumentException(
          "Escribe el precio sin separadores de miles; ejemplo: 680000.50.");
    }
    BigDecimal precio = new BigDecimal(precioLimpio.replace(',', '.'))
        .setScale(2, RoundingMode.UNNECESSARY);
    if (precio.signum() <= 0 || precio.compareTo(PRECIO_MAXIMO) > 0) {
      throw new IllegalArgumentException(
          "El precio debe ser mayor que cero y máximo 9999999999.99.");
    }
    int existencias;
    try {
      existencias = Integer.parseInt(
          existenciasTexto == null ? "" : existenciasTexto.strip());
    } catch (NumberFormatException error) {
      throw new IllegalArgumentException(
          "Las existencias deben ser un número entero entre 0 y 1000000.");
    }
    if (existencias < 0 || existencias > EXISTENCIAS_MAXIMAS) {
      throw new IllegalArgumentException(
          "Las existencias deben estar entre 0 y 1000000.");
    }
    return new Producto(id, codigoLimpio, nombreLimpio, categoria, precio, existencias);
  }
}
