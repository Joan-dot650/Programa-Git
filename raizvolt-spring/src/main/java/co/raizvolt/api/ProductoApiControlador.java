package co.raizvolt.api;

import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import co.raizvolt.web.FormularioProducto;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Adaptador JSON para React; conserva el servicio, el DAO y la base de AA3. */
@RestController
@RequestMapping("/api")
public class ProductoApiControlador {
  private final ProductoServicio servicio;

  public ProductoApiControlador(ProductoServicio servicio) {
    this.servicio = servicio;
  }

  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    // Acceder al token materializa la sesión diferida de Spring Security.
    return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
  }

  @GetMapping("/productos")
  public Map<String, Object> consultar(@RequestParam(defaultValue = "") String q) {
    if (q.length() > 120) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La búsqueda admite hasta 120 caracteres.");
    }
    List<Producto> productos = servicio.consultarProductos(q);
    BigDecimal valor = productos.stream().map(p -> p.getPrecio()
        .multiply(BigDecimal.valueOf(p.getExistencias()))).reduce(BigDecimal.ZERO, BigDecimal::add);
    // Los importes son texto decimal para no perder precisión al convertir JSON.
    return Map.of("productos", productos.stream().map(this::representar).toList(),
        "valorInventario", valor.setScale(2).toPlainString());
  }

  @GetMapping("/productos/{id}")
  public Map<String, Object> buscar(@PathVariable long id) {
    return representar(buscarExistente(id));
  }

  @PostMapping("/productos")
  public ResponseEntity<Map<String, Object>> registrar(@RequestBody FormularioProducto formulario) {
    validarEntrada(formulario);
    Producto producto = servicio.registrarProducto(formulario.getCodigo(), formulario.getNombre(),
        Categoria.valueOf(formulario.getCategoria()), formulario.getPrecio(), formulario.getExistencias());
    return ResponseEntity.status(HttpStatus.CREATED).body(representar(producto));
  }

  @PutMapping("/productos/{id}")
  public Map<String, Object> actualizar(@PathVariable long id,
      @RequestBody FormularioProducto formulario) {
    buscarExistente(id);
    validarEntrada(formulario);
    // El ID procede de la ruta; el DTO no admite cambiar la identidad.
    servicio.actualizarProducto(id, formulario.getCodigo(), formulario.getNombre(),
        Categoria.valueOf(formulario.getCategoria()), formulario.getPrecio(), formulario.getExistencias());
    return representar(buscarExistente(id));
  }

  @DeleteMapping("/productos/{id}")
  public ResponseEntity<Void> eliminar(@PathVariable long id) {
    buscarExistente(id);
    try {
      servicio.eliminarProducto(id);
    } catch (IllegalArgumentException error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto ya no existe.");
    }
    return ResponseEntity.noContent().build();
  }

  private Producto buscarExistente(long id) {
    try {
      return servicio.buscarProducto(id);
    } catch (IllegalArgumentException error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto ya no existe. Regresa al catálogo.");
    }
  }

  private Map<String, Object> representar(Producto producto) {
    return Map.of("id", producto.getId(), "codigo", producto.getCodigo(),
        "nombre", producto.getNombre(), "categoria", producto.getCategoria().name(),
        "precio", producto.getPrecio().toPlainString(), "existencias", producto.getExistencias());
  }

  private void validarEntrada(FormularioProducto f) {
    // Se reúnen errores por campo; el servicio vuelve a comprobar las reglas antes del SQL.
    Map<String, String> errores = new LinkedHashMap<>();
    String codigo = limpiar(f.getCodigo()).toUpperCase(Locale.ROOT);
    String nombre = limpiar(f.getNombre());
    String precio = limpiar(f.getPrecio());
    String existencias = limpiar(f.getExistencias());
    if (!codigo.matches("[A-Z0-9-]{3,30}")) {
      errores.put("codigo", "Escribe de 3 a 30 letras, números o guiones.");
    }
    if (nombre.length() < 3 || nombre.length() > 120
        || nombre.chars().anyMatch(Character::isISOControl)) {
      errores.put("nombre", "Escribe de 3 a 120 caracteres en una sola línea.");
    }
    try {
      Categoria.valueOf(limpiar(f.getCategoria()));
    } catch (IllegalArgumentException error) {
      errores.put("categoria", "Selecciona una categoría válida.");
    }
    if (!precio.matches("[0-9]{1,10}([.,][0-9]{1,2})?")
        || !precio.matches(".*[1-9].*")) {
      errores.put("precio", "Ingresa un precio mayor que 0, máximo 9999999999.99 y hasta 2 decimales.");
    }
    if (!existencias.matches("[0-9]+") || existencias.length() > 10
        || new BigDecimal(existencias).compareTo(new BigDecimal("1000000")) > 0) {
      errores.put("existencias", "Escribe un número entero entre 0 y 1000000.");
    }
    if (!errores.isEmpty()) throw new ValidacionApiException(errores);
  }

  private String limpiar(String texto) {
    return texto == null ? "" : texto.strip();
  }
}
