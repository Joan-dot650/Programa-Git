package co.raizvolt.pruebas;

import co.raizvolt.config.ConexionBaseDatos;
import co.raizvolt.config.ConexionJdbc;
import co.raizvolt.config.ConfiguracionBaseDatos;
import co.raizvolt.config.InicializadorBaseDatos;
import co.raizvolt.dao.ErrorPersistencia;
import co.raizvolt.dao.ProductoDaoJdbc;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.Comparator;

/** Pruebas con una base H2 temporal real, sin tocar datos de la aplicación. */
public final class PruebasIntegracion {
  private static int verificaciones;

  private PruebasIntegracion() {
  }

  public static void main(String[] argumentos) throws Exception {
    Path temporal = Files.createTempDirectory("raizvolt-pruebas-");
    try {
      ejecutar(temporal);
      System.out.println("RESULTADO: " + verificaciones
          + " verificaciones JDBC aprobadas.");
    } finally {
      try (var archivos = Files.walk(temporal)) {
        for (Path archivo : archivos.sorted(Comparator.reverseOrder()).toList()) {
          Files.deleteIfExists(archivo);
        }
      }
    }
  }

  private static void ejecutar(Path temporal) throws Exception {
    String url = "jdbc:h2:" + temporal.resolve("catalogo").toAbsolutePath()
        .toString().replace('\\', '/') + ";MODE=MySQL";
    ConexionJdbc conexion = new ConexionJdbc(
        new ConfiguracionBaseDatos(url, "sa", ""));
    InicializadorBaseDatos.inicializar(conexion, true);
    ProductoDaoJdbc dao = new ProductoDaoJdbc(conexion);
    ProductoServicio servicio = new ProductoServicio(dao);
    verificar(servicio.consultarProductos("").isEmpty(), "base nueva vacía");

    Producto panel = servicio.registrarProducto("  panel-550  ",
        " Panel solar 550 W ", Categoria.PANEL_SOLAR, "680000,50", "12");
    verificar(panel.getId() > 0, "inserción con ID generado");
    Producto leido = servicio.buscarProducto(panel.getId());
    verificar(leido.getCodigo().equals("PANEL-550"), "normalización de código");
    verificar(leido.getNombre().equals("Panel solar 550 W"), "consulta por ID");
    verificar(leido.getPrecio().equals(new BigDecimal("680000.50")),
        "precio decimal exacto en JDBC");
    verificar(servicio.consultarProductos("solar").size() == 1,
        "consulta parcial por nombre");
    verificar(servicio.consultarProductos("panel-550").size() == 1,
        "consulta por código sin distinguir mayúsculas");
    rechazar(() -> servicio.registrarProducto("panel-550", "Otro panel",
        Categoria.PANEL_SOLAR, "20", "1"), "duplicado rechazado");
    verificar(servicio.consultarProductos("").size() == 1,
        "duplicado no crea una fila adicional");

    Producto bateria = servicio.registrarProducto("BAT-100",
        "Batería O'Brien 100%_!", Categoria.BATERIA, "1500000", "5");
    verificar(servicio.consultarProductos("O'Brien").size() == 1,
        "apóstrofe almacenado con parámetros");
    verificar(servicio.consultarProductos("%_!").size() == 1,
        "comodines de búsqueda tratados como texto");
    verificar(servicio.consultarProductos("' OR 1=1 --").isEmpty(),
        "intento de inyección tratado como texto");
    rechazar(() -> servicio.actualizarProducto(bateria.getId(), "PANEL-550",
        "Batería", Categoria.BATERIA, "2", "1"), "duplicado en actualización");
    verificar(servicio.buscarProducto(bateria.getId()).getCodigo().equals("BAT-100"),
        "actualización fallida conserva el registro original");

    servicio.actualizarProducto(panel.getId(), "PANEL-560", "Panel solar 560 W",
        Categoria.PANEL_SOLAR, "700000.25", "9");
    Producto actualizado = servicio.buscarProducto(panel.getId());
    verificar(actualizado.getId() == panel.getId()
        && actualizado.getCodigo().equals("PANEL-560")
        && actualizado.getExistencias() == 9
        && actualizado.getPrecio().equals(new BigDecimal("700000.25")),
        "actualización persiste todos los cambios");
    verificar(servicio.buscarProducto(bateria.getId()).getExistencias() == 5,
        "actualización no modifica otro producto");

    // Cada DAO cerró su conexión; una nueva instancia debe recuperar el disco.
    ConexionJdbc reabierta = new ConexionJdbc(
        new ConfiguracionBaseDatos(url, "sa", ""));
    InicializadorBaseDatos.inicializar(reabierta, true);
    ProductoServicio reiniciado =
        new ProductoServicio(new ProductoDaoJdbc(reabierta));
    verificar(reiniciado.consultarProductos("").size() == 2
        && reiniciado.buscarProducto(panel.getId()).getExistencias() == 9,
        "persistencia al cerrar y reabrir conexiones / esquema idempotente");

    rechazar(() -> servicio.registrarProducto("", "Panel", Categoria.PANEL_SOLAR,
        "20", "1"), "código vacío");
    rechazar(() -> servicio.registrarProducto("OK-1", " ", Categoria.PANEL_SOLAR,
        "20", "1"), "nombre vacío");
    rechazar(() -> servicio.registrarProducto("OK-1", "Panel", null, "20", "1"),
        "categoría obligatoria");
    for (String precio : new String[] {"0", "-1", "abc", "1.234",
        "1.000.000", "1e3", "10000000000.00"}) {
      rechazar(() -> servicio.registrarProducto("OK-1", "Panel",
          Categoria.PANEL_SOLAR, precio, "1"), "precio inválido: " + precio);
    }
    for (String stock : new String[] {"-1", "1.5", "abc", "1000001", "999999999999"}) {
      rechazar(() -> servicio.registrarProducto("OK-1", "Panel",
          Categoria.PANEL_SOLAR, "10", stock), "existencias inválidas: " + stock);
    }
    Producto limite = servicio.registrarProducto("LIM-1", "Kit de prueba",
        Categoria.KIT_SOLAR, "9999999999.99", "0");
    verificar(limite.getExistencias() == 0
        && servicio.buscarProducto(limite.getId()).getPrecio()
            .equals(new BigDecimal("9999999999.99")),
        "límites válidos de precio y existencias");
    rechazar(() -> servicio.actualizarProducto(999999, "OK-1", "Panel",
        Categoria.PANEL_SOLAR, "20", "1"), "actualización de ID inexistente");
    rechazar(() -> servicio.eliminarProducto(0), "eliminación sin selección");
    rechazar(() -> dao.insertar(new Producto(0, "BAD-1", "Panel",
        Categoria.PANEL_SOLAR, new BigDecimal("-1"), 0)),
        "CHECK de la base rechaza precio negativo aun sin servicio");

    ConexionBaseDatos sinConexion = () -> {
      throw new SQLException("Servidor no disponible", "08001");
    };
    rechazar(() -> new ProductoDaoJdbc(sinConexion).consultar(""),
        "error de conexión controlado");
    servicio.eliminarProducto(panel.getId());
    verificar(dao.buscarPorId(panel.getId()).isEmpty(), "DELETE elimina el ID elegido");
    verificar(servicio.consultarProductos("").size() == 2,
        "DELETE conserva los demás productos");
    rechazar(() -> servicio.eliminarProducto(panel.getId()),
        "no se informa éxito al eliminar un ID ausente");
  }

  private static void rechazar(Runnable accion, String descripcion) {
    try {
      accion.run();
    } catch (IllegalArgumentException | ErrorPersistencia esperado) {
      verificar(true, descripcion);
      return;
    }
    throw new AssertionError("No se rechazó: " + descripcion);
  }

  private static void verificar(boolean condicion, String descripcion) {
    if (!condicion) {
      throw new AssertionError(descripcion);
    }
    verificaciones++;
    System.out.println("OK " + verificaciones + " - " + descripcion);
  }
}
