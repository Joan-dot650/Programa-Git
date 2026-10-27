package co.raizvolt;

import static org.assertj.core.api.Assertions.assertThat;

import co.raizvolt.dao.ProductoDaoSpring;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.servicio.ProductoServicio;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/** Cierra la base en disco, vuelve a abrirla y verifica que no se pierde el CRUD. */
class PersistenciaArchivoTest {
  @TempDir Path carpeta;

  @Test
  void datosPersistenYElEsquemaNoReiniciaElCatalogo() {
    String url = "jdbc:h2:file:" + carpeta.resolve("catalogo").toAbsolutePath();
    var primeraConexion = new DriverManagerDataSource(url, "sa", "");
    var esquema = new ResourceDatabasePopulator(new ClassPathResource("schema.sql"));
    esquema.execute(primeraConexion);
    var primerServicio = new ProductoServicio(new ProductoDaoSpring(new JdbcTemplate(primeraConexion)));
    var producto = primerServicio.registrarProducto("SOL-1", "Panel persistente", Categoria.PANEL_SOLAR,
        "1000.25", "4");
    new JdbcTemplate(primeraConexion).execute("SHUTDOWN");

    var segundaConexion = new DriverManagerDataSource(url, "sa", "");
    esquema.execute(segundaConexion);
    var segundoServicio = new ProductoServicio(new ProductoDaoSpring(new JdbcTemplate(segundaConexion)));
    assertThat(segundoServicio.buscarProducto(producto.getId()).getPrecio())
        .isEqualByComparingTo("1000.25");
    segundoServicio.actualizarProducto(producto.getId(), "SOL-1", "Panel actualizado",
        Categoria.PANEL_SOLAR, "1500", "2");
    new JdbcTemplate(segundaConexion).execute("SHUTDOWN");

    var terceraConexion = new DriverManagerDataSource(url, "sa", "");
    var tercerServicio = new ProductoServicio(new ProductoDaoSpring(new JdbcTemplate(terceraConexion)));
    assertThat(tercerServicio.buscarProducto(producto.getId()).getExistencias()).isEqualTo(2);
    tercerServicio.eliminarProducto(producto.getId());
    new JdbcTemplate(terceraConexion).execute("SHUTDOWN");
    esquema.execute(terceraConexion);
    assertThat(tercerServicio.consultarProductos("")).isEmpty();
    new JdbcTemplate(terceraConexion).execute("SHUTDOWN");
  }
}
