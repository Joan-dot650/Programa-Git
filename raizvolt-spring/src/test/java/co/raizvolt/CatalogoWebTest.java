package co.raizvolt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasProperty;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Recorre controlador, servicio, SQL y plantillas reales con una base aislada. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogoWebTest {
  @Autowired private MockMvc navegador;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private ProductoServicio servicio;

  @BeforeEach
  void limpiarDatosDePrueba() {
    jdbc.update("DELETE FROM productos");
  }

  @Test
  void muestraEstadoVacioYRecursos() throws Exception {
    navegador.perform(get("/productos")).andExpect(status().isOk())
        .andExpect(content().string(containsString("Tu catálogo empieza aquí")));
    navegador.perform(get("/assets/estilos.css")).andExpect(status().isOk());
    navegador.perform(get("/assets/marca.svg")).andExpect(status().isOk());
  }

  @Test
  void formularioIncluyeCategoriasYTokenCsrf() throws Exception {
    navegador.perform(get("/productos/nuevo")).andExpect(status().isOk())
        .andExpect(content().string(containsString("name=\"_csrf\"")))
        .andExpect(content().string(containsString("PANEL_SOLAR")));
  }

  @Test
  void crearNormalizaYRedirigeSinRepetirInsercion() throws Exception {
    navegador.perform(formulario("/productos", " sol-550 ", " Panel solar 550 W ",
        "PANEL_SOLAR", "680000,50", "12")).andExpect(status().isSeeOther())
        .andExpect(redirectedUrl("/productos"));
    Producto guardado = servicio.consultarProductos("").get(0);
    assertThat(guardado.getCodigo()).isEqualTo("SOL-550");
    assertThat(guardado.getNombre()).isEqualTo("Panel solar 550 W");
    assertThat(guardado.getPrecio()).isEqualByComparingTo("680000.50");
    navegador.perform(get("/productos")).andExpect(status().isOk());
    navegador.perform(get("/productos")).andExpect(status().isOk());
    assertThat(servicio.consultarProductos("")).hasSize(1);
  }

  @ParameterizedTest
  @CsvSource({
      "AA,Panel solar,PANEL_SOLAR,100,1",
      "BAD_CODE,Panel solar,PANEL_SOLAR,100,1",
      "SOL-1,ab,PANEL_SOLAR,100,1",
      "SOL-1,Panel solar,OTRA,100,1",
      "SOL-1,Panel solar,PANEL_SOLAR,0,1",
      "SOL-1,Panel solar,PANEL_SOLAR,-10,1",
      "SOL-1,Panel solar,PANEL_SOLAR,1.234,1",
      "SOL-1,Panel solar,PANEL_SOLAR,10000000000,1",
      "SOL-1,Panel solar,PANEL_SOLAR,NaN,1",
      "SOL-1,Panel solar,PANEL_SOLAR,100,-1",
      "SOL-1,Panel solar,PANEL_SOLAR,100,1.5",
      "SOL-1,Panel solar,PANEL_SOLAR,100,1000001",
      "SOL-1,Panel solar,PANEL_SOLAR,100,999999999999"
  })
  void rechazaDatosInvalidosSinGuardar(String codigo, String nombre, String categoria,
      String precio, String existencias) throws Exception {
    navegador.perform(formulario("/productos", codigo, nombre, categoria, precio, existencias))
        .andExpect(status().isBadRequest()).andExpect(view().name("formulario"))
        .andExpect(model().attributeExists("errorFormulario"));
    assertThat(servicio.consultarProductos("")).isEmpty();
  }

  @Test
  void camposAusentesYNombreDeControlSeRechazan() throws Exception {
    navegador.perform(post("/productos").with(csrf())).andExpect(status().isBadRequest());
    navegador.perform(formulario("/productos", "SOL-1", "Panel\nsolar", "PANEL_SOLAR", "100", "1"))
        .andExpect(status().isBadRequest());
    assertThat(servicio.consultarProductos("")).isEmpty();
  }

  @Test
  void conservaCamposCuandoElCodigoEstaDuplicado() throws Exception {
    producto();
    navegador.perform(formulario("/productos", "SOL-550", "Batería nueva", "BATERIA", "1200000", "4"))
        .andExpect(status().isConflict()).andExpect(view().name("formulario"))
        .andExpect(model().attribute("formulario", hasProperty("nombre", equalTo("Batería nueva"))))
        .andExpect(content().string(containsString("Ya existe un producto")));
    assertThat(servicio.consultarProductos("")).hasSize(1);
  }

  @Test
  void consultaPorNombreCodigoYComodinesLiterales() throws Exception {
    producto();
    servicio.registrarProducto("INV-3000", "Inversor 3000 W", Categoria.INVERSOR, "1500000", "3");
    navegador.perform(get("/productos").param("q", "panel")).andExpect(status().isOk())
        .andExpect(content().string(containsString("SOL-550")))
        .andExpect(content().string(not(containsString("INV-3000"))));
    assertThat(servicio.consultarProductos("sol-550")).hasSize(1);
    assertThat(servicio.consultarProductos("%" )).isEmpty();
    assertThat(servicio.consultarProductos("_" )).isEmpty();
    assertThat(servicio.consultarProductos("' OR 1=1 --")).isEmpty();
  }

  @Test
  void editaElMismoIdYLosIndicadoresSeActualizan() throws Exception {
    Producto producto = producto();
    navegador.perform(get("/productos/" + producto.getId() + "/editar"))
        .andExpect(status().isOk()).andExpect(content().string(containsString("SOL-550")));
    navegador.perform(formulario("/productos/" + producto.getId(), "SOL-550", "Panel actualizado",
        "PANEL_SOLAR", "750000.25", "2")).andExpect(status().isSeeOther());
    Producto cambiado = servicio.buscarProducto(producto.getId());
    assertThat(cambiado.getPrecio()).isEqualByComparingTo("750000.25");
    assertThat(cambiado.getExistencias()).isEqualTo(2);
    assertThat(servicio.consultarProductos("")).hasSize(1);
    navegador.perform(get("/productos")).andExpect(model().attribute("stockBajo", 1L))
        .andExpect(model().attribute("unidades", 2L));
  }

  @Test
  void duplicadoAlEditarNoModificaElRegistroOriginal() throws Exception {
    Producto original = producto();
    Producto otro = servicio.registrarProducto("OTRO-1", "Batería solar", Categoria.BATERIA, "100", "1");
    navegador.perform(formulario("/productos/" + otro.getId(), original.getCodigo(), "Cambio inválido",
        "BATERIA", "150", "5")).andExpect(status().isConflict());
    assertThat(servicio.buscarProducto(otro.getId()).getCodigo()).isEqualTo("OTRO-1");
    assertThat(servicio.buscarProducto(otro.getId()).getNombre()).isEqualTo("Batería solar");
  }

  @Test
  void confirmarYCancelarNoBorranHastaElPost() throws Exception {
    Producto producto = producto();
    String ruta = "/productos/" + producto.getId() + "/eliminar";
    navegador.perform(get(ruta)).andExpect(status().isOk())
        .andExpect(content().string(containsString("Confirmar eliminación")));
    navegador.perform(get("/productos")).andExpect(status().isOk());
    assertThat(servicio.consultarProductos("")).hasSize(1);
    navegador.perform(post(ruta).with(csrf())).andExpect(status().isSeeOther());
    assertThat(servicio.consultarProductos("")).isEmpty();
    navegador.perform(post(ruta).with(csrf())).andExpect(status().isNotFound());
  }

  @Test
  void postSinCsrfNoCreaNiEditaNiElimina() throws Exception {
    Producto producto = producto();
    navegador.perform(post("/productos")).andExpect(status().isForbidden());
    navegador.perform(post("/productos/" + producto.getId())).andExpect(status().isForbidden());
    navegador.perform(post("/productos/" + producto.getId() + "/eliminar"))
        .andExpect(status().isForbidden());
    assertThat(servicio.consultarProductos("")).hasSize(1);
  }

  @ParameterizedTest
  @ValueSource(longs = {-1, 0, 999999999})
  void identificadorInexistenteNoCreaOtroProducto(long id) throws Exception {
    navegador.perform(get("/productos/" + id + "/editar")).andExpect(status().isNotFound());
    navegador.perform(formulario("/productos/" + id, "SOL-999", "Panel", "PANEL_SOLAR", "100", "0"))
        .andExpect(status().isNotFound());
    assertThat(servicio.consultarProductos("")).isEmpty();
  }

  @Test
  void nombreConHtmlSeMuestraComoTexto() throws Exception {
    servicio.registrarProducto("XSS-1", "<script>alert(1)</script>", Categoria.ACCESORIO, "10", "0");
    navegador.perform(get("/productos")).andExpect(status().isOk())
        .andExpect(content().string(containsString("&lt;script&gt;")))
        .andExpect(content().string(not(containsString("<script>alert"))));
  }

  @Test
  void limitesValidosYCampoIdNoAlteranLaIdentidad() throws Exception {
    navegador.perform(formulario("/productos", "MAX-1", "Producto de prueba", "KIT_SOLAR",
        "9999999999.99", "1000000").param("id", "8000000"))
        .andExpect(status().isSeeOther());
    assertThat(servicio.consultarProductos("").get(0).getId()).isNotEqualTo(8000000);
    assertThat(servicio.consultarProductos("").get(0).getExistencias()).isEqualTo(1000000);
  }

  @Test
  void busquedaDemasiadoLargaEsSolicitudInvalida() throws Exception {
    navegador.perform(get("/productos").param("q", "a".repeat(121)))
        .andExpect(status().isBadRequest());
  }

  private Producto producto() {
    return servicio.registrarProducto("SOL-550", "Panel solar 550 W", Categoria.PANEL_SOLAR,
        "680000.50", "12");
  }

  private MockHttpServletRequestBuilder formulario(String ruta, String codigo, String nombre,
      String categoria, String precio, String existencias) {
    return post(ruta).with(csrf()).param("codigo", codigo).param("nombre", nombre)
        .param("categoria", categoria).param("precio", precio).param("existencias", existencias);
  }
}
