package co.raizvolt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Verifica el nuevo contrato JSON contra el servicio y la base H2 reales. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProductoApiTest {
  @Autowired private MockMvc navegador;
  @Autowired private ProductoServicio servicio;
  @Autowired private JdbcTemplate jdbc;

  @BeforeEach
  void aislarDatos() { jdbc.update("DELETE FROM productos"); }

  @Test
  void catalogoVacioEImporteComoTexto() throws Exception {
    navegador.perform(get("/api/productos")).andExpect(status().isOk())
        .andExpect(jsonPath("$.productos.length()").value(0))
        .andExpect(jsonPath("$.valorInventario").value("0.00"));
  }

  @Test
  void registroConNormalizacionYPrecioDecimal() throws Exception {
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos(" sol-550 ", " Panel solar 550 W ", "PANEL_SOLAR", "680000,50", "12")))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.codigo").value("SOL-550"))
        .andExpect(jsonPath("$.nombre").value("Panel solar 550 W"))
        .andExpect(jsonPath("$.precio").value("680000.50"));
    navegador.perform(get("/api/productos")).andExpect(jsonPath("$.valorInventario").value("8160006.00"));
  }

  @ParameterizedTest
  @CsvSource({
      "codigo,AB,Panel,PANEL_SOLAR,100,1",
      "codigo,BAD_CODE,Panel,PANEL_SOLAR,100,1",
      "nombre,SOL-1,ab,PANEL_SOLAR,100,1",
      "categoria,SOL-1,Panel,OTRA,100,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,0,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,-1,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,1.234,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,1e3,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,NaN,1",
      "precio,SOL-1,Panel,PANEL_SOLAR,10000000000,1",
      "existencias,SOL-1,Panel,PANEL_SOLAR,100,-1",
      "existencias,SOL-1,Panel,PANEL_SOLAR,100,1.5",
      "existencias,SOL-1,Panel,PANEL_SOLAR,100,1e3",
      "existencias,SOL-1,Panel,PANEL_SOLAR,100,1000001"
  })
  void validacionesDevuelvenCampoSinEscribir(String campo, String codigo, String nombre,
      String categoria, String precio, String existencias) throws Exception {
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos(codigo, nombre, categoria, precio, existencias)))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errores." + campo).isString());
    assertThat(servicio.consultarProductos("")).isEmpty();
  }

  @Test
  void camposAusentesYLongitudesExcesivas() throws Exception {
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errores.codigo").exists())
        .andExpect(jsonPath("$.errores.precio").exists()).andExpect(jsonPath("$.errores.existencias").exists());
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("A".repeat(31), "ñ".repeat(121), "PANEL_SOLAR", "10", "0")))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errores.codigo").exists())
        .andExpect(jsonPath("$.errores.nombre").exists());
  }

  @Test
  void nombreConSaltoSeRechazaYTildesSeConservan() throws Exception {
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("SOL-1", "Panel\\nsolar", "PANEL_SOLAR", "10", "0")))
        .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errores.nombre").exists());
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("BAT-1", "Batería pequeña", "BATERIA", "0.01", "0")))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.nombre").value("Batería pequeña"));
  }

  @Test
  void duplicadosDevuelven409YNoAlteranElOriginal() throws Exception {
    Producto original = producto();
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("sol-550", "Duplicado", "BATERIA", "10", "0")))
        .andExpect(status().isConflict()).andExpect(jsonPath("$.errores.codigo").exists());
    assertThat(servicio.buscarProducto(original.getId()).getNombre()).isEqualTo("Panel solar 550 W");
  }

  @ParameterizedTest
  @ValueSource(strings = {"pAnEl", "sol-550", "550"})
  void busquedaParcialPorCodigoONombre(String texto) throws Exception {
    producto();
    servicio.registrarProducto("INV-1", "Inversor", Categoria.INVERSOR, "10", "1");
    navegador.perform(get("/api/productos").param("q", texto))
        .andExpect(jsonPath("$.productos.length()").value(1))
        .andExpect(jsonPath("$.productos[0].codigo").value("SOL-550"))
        .andExpect(jsonPath("$.valorInventario").value("8160006.00"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"%", "_", "' OR 1=1 --", "inexistente"})
  void busquedaLiteralSinCoincidencias(String texto) throws Exception {
    producto();
    navegador.perform(get("/api/productos").param("q", texto))
        .andExpect(jsonPath("$.productos.length()").value(0));
  }

  @Test
  void edicionConservaIdYActualizaResumen() throws Exception {
    Producto original = producto();
    navegador.perform(get("/api/productos/" + original.getId())).andExpect(jsonPath("$.precio").value("680000.50"));
    navegador.perform(put("/api/productos/" + original.getId()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("SOL-550", "Panel actualizado", "PANEL_SOLAR", "750000.25", "2")))
        .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(original.getId()))
        .andExpect(jsonPath("$.existencias").value(2));
    navegador.perform(get("/api/productos")).andExpect(jsonPath("$.valorInventario").value("1500000.50"));
    assertThat(servicio.consultarProductos("")).hasSize(1);
  }

  @Test
  void edicionInvalidaODuplicadaNoCambiaElRegistro() throws Exception {
    Producto original = producto();
    servicio.registrarProducto("OTRO-1", "Otro panel", Categoria.PANEL_SOLAR, "10", "1");
    navegador.perform(put("/api/productos/" + original.getId()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("OTRO-1", "Cambio", "PANEL_SOLAR", "10", "0"))).andExpect(status().isConflict());
    navegador.perform(put("/api/productos/" + original.getId()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("SOL-550", "Cambio", "PANEL_SOLAR", "0", "0"))).andExpect(status().isBadRequest());
    assertThat(servicio.buscarProducto(original.getId()).getNombre()).isEqualTo("Panel solar 550 W");
  }

  @Test
  void lecturaNoEliminaYDeleteEliminaSoloElElegido() throws Exception {
    Producto original = producto();
    servicio.registrarProducto("OTRO-1", "Otro panel", Categoria.PANEL_SOLAR, "10", "1");
    navegador.perform(get("/api/productos/" + original.getId())).andExpect(status().isOk());
    assertThat(servicio.consultarProductos("")).hasSize(2);
    navegador.perform(delete("/api/productos/" + original.getId()).with(csrf())).andExpect(status().isNoContent());
    assertThat(servicio.consultarProductos("")).hasSize(1);
    navegador.perform(get("/api/productos/" + original.getId())).andExpect(status().isNotFound());
  }

  @Test
  void tokenRealObtenidoPorGetPermiteLaEscritura() throws Exception {
    var respuesta = navegador.perform(get("/api/csrf")).andExpect(status().isOk())
        .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
        .andExpect(jsonPath("$.token").isNotEmpty()).andReturn();
    var token = (CsrfToken) respuesta.getRequest().getAttribute(CsrfToken.class.getName());
    var sesion = (MockHttpSession) respuesta.getRequest().getSession(false);
    navegador.perform(post("/api/productos").session(sesion).header(token.getHeaderName(), token.getToken())
        .contentType(MediaType.APPLICATION_JSON).content(datos("SOL-1", "Panel", "PANEL_SOLAR", "100", "1")))
        .andExpect(status().isCreated());
  }

  @Test
  void escriturasSinCsrfSeBloquean() throws Exception {
    Producto p = producto();
    navegador.perform(post("/api/productos").contentType(MediaType.APPLICATION_JSON)
        .content(datos("SOL-2", "Panel", "PANEL_SOLAR", "100", "1"))).andExpect(status().isForbidden());
    navegador.perform(put("/api/productos/" + p.getId()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("SOL-2", "Panel", "PANEL_SOLAR", "100", "1"))).andExpect(status().isForbidden());
    navegador.perform(delete("/api/productos/" + p.getId())).andExpect(status().isForbidden());
    assertThat(servicio.consultarProductos("")).hasSize(1);
  }

  @Test
  void maximosMantienenCentavosSinRedondear() throws Exception {
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON)
        .content(datos("MAX-1", "Máximo", "KIT_SOLAR", "9999999999.99", "1000000")))
        .andExpect(status().isCreated()).andExpect(jsonPath("$.precio").value("9999999999.99"));
    navegador.perform(get("/api/productos")).andExpect(jsonPath("$.valorInventario").value("9999999999990000.00"));
  }

  @Test
  void idsInvalidosJsonMalformadoYBusquedaLarga() throws Exception {
    navegador.perform(get("/api/productos/999999")).andExpect(status().isNotFound());
    navegador.perform(get("/api/productos/-1")).andExpect(status().isNotFound());
    navegador.perform(get("/api/productos/no-numero")).andExpect(status().isBadRequest());
    navegador.perform(get("/api/productos").param("q", "x".repeat(121))).andExpect(status().isBadRequest());
    navegador.perform(post("/api/productos").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{mal"))
        .andExpect(status().isBadRequest());
  }

  private Producto producto() {
    return servicio.registrarProducto("SOL-550", "Panel solar 550 W", Categoria.PANEL_SOLAR, "680000.50", "12");
  }

  private String datos(String codigo, String nombre, String categoria, String precio, String existencias) {
    return String.format("{\"codigo\":\"%s\",\"nombre\":\"%s\",\"categoria\":\"%s\",\"precio\":\"%s\",\"existencias\":\"%s\"}",
        codigo, nombre, categoria, precio, existencias);
  }
}
