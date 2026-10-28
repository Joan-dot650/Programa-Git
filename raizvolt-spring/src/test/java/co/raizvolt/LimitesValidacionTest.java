package co.raizvolt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import co.raizvolt.servicio.ProductoServicio;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/** Casos adicionales de AA3-EV02 derivados del diccionario y las historias HU-PR01 a HU-PR03. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LimitesValidacionTest {
  @Autowired private MockMvc navegador;
  @Autowired private JdbcTemplate jdbc;
  @Autowired private ProductoServicio servicio;

  @BeforeEach
  void aislarCadaCaso() {
    jdbc.update("DELETE FROM productos");
  }

  static Stream<Arguments> limites() {
    return Stream.of(
        Arguments.of("L01", "codigo", "AB", 400),
        Arguments.of("L02", "codigo", "ABC", 303),
        Arguments.of("L03", "codigo", "A".repeat(30), 303),
        Arguments.of("L04", "codigo", "A".repeat(31), 400),
        Arguments.of("L05", "nombre", "ab", 400),
        Arguments.of("L06", "nombre", "Sol", 303),
        Arguments.of("L07", "nombre", "N".repeat(120), 303),
        Arguments.of("L08", "nombre", "N".repeat(121), 400),
        Arguments.of("L09", "precio", "0.01", 303),
        Arguments.of("L10", "precio", "9999999999.99", 303),
        Arguments.of("L11", "precio", "10000000000.00", 400),
        Arguments.of("L12", "precio", "0.00", 400),
        Arguments.of("L13", "precio", "1e3", 400),
        Arguments.of("L14", "precio", "1,234.56", 400),
        Arguments.of("L15", "existencias", "0", 303),
        Arguments.of("L16", "existencias", "1000000", 303),
        Arguments.of("L17", "existencias", "1000001", 400),
        Arguments.of("L18", "existencias", "abc", 400),
        Arguments.of("L19", "codigo", "SOL@1", 400),
        Arguments.of("L20", "nombre", "Panel\tsolar", 400),
        Arguments.of("L21", "nombre", "Batería Ñandú & soporte +", 303));
  }

  @ParameterizedTest(name = "{0} {1} HTTP {3}")
  @MethodSource("limites")
  void respetaLimitesYNoGuardaErrores(String caso, String campo, String valor,
      int esperado) throws Exception {
    Map<String, String> datos = validos();
    datos.put(campo, valor);
    enviar("/productos", datos, esperado);
    assertThat(servicio.consultarProductos("")).hasSize(esperado == 303 ? 1 : 0);
  }

  @ParameterizedTest
  @ValueSource(strings = {"codigo", "nombre", "categoria", "precio", "existencias"})
  void cadaCampoEsObligatorio(String campo) throws Exception {
    Map<String, String> datos = validos();
    datos.remove(campo);
    enviar("/productos", datos, 400);
    assertThat(servicio.consultarProductos("")).isEmpty();
  }

  @ParameterizedTest
  @ValueSource(strings = {"PANEL_SOLAR", "INVERSOR", "BATERIA", "KIT_SOLAR", "ACCESORIO"})
  void aceptaLasCincoCategoriasDefinidas(String categoria) throws Exception {
    Map<String, String> datos = validos();
    datos.put("categoria", categoria);
    enviar("/productos", datos, 303);
    assertThat(servicio.consultarProductos("").get(0).getCategoria().name()).isEqualTo(categoria);
  }

  @Test
  void edicionInvalidaConservaTodosLosDatos() throws Exception {
    enviar("/productos", validos(), 303);
    var original = servicio.consultarProductos("").get(0);
    Map<String, String> datos = validos();
    datos.put("nombre", "No debe guardarse");
    datos.put("precio", "0");
    enviar("/productos/" + original.getId(), datos, 400);
    var posterior = servicio.buscarProducto(original.getId());
    assertThat(posterior.getNombre()).isEqualTo(original.getNombre());
    assertThat(posterior.getPrecio()).isEqualByComparingTo(original.getPrecio());
    assertThat(posterior.getExistencias()).isEqualTo(original.getExistencias());
  }

  @Test
  void busquedaAceptaCientoVeinteYRechazaCientoVeintiuno() throws Exception {
    navegador.perform(get("/productos").param("q", "x".repeat(120)))
        .andExpect(status().isOk());
    navegador.perform(get("/productos").param("q", "x".repeat(121)))
        .andExpect(status().isBadRequest());
  }

  private Map<String, String> validos() {
    var datos = new LinkedHashMap<String, String>();
    datos.put("codigo", "EV2-001");
    datos.put("nombre", "Panel de prueba");
    datos.put("categoria", "PANEL_SOLAR");
    datos.put("precio", "680000.50");
    datos.put("existencias", "12");
    return datos;
  }

  private void enviar(String ruta, Map<String, String> datos, int esperado) throws Exception {
    var solicitud = post(ruta).with(csrf());
    datos.forEach((campo, valor) -> solicitud.param(campo, valor));
    navegador.perform(solicitud).andExpect(status().is(esperado));
  }
}
