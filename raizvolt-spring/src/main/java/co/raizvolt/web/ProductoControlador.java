package co.raizvolt.web;

import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import jakarta.servlet.http.HttpServletResponse;
import java.math.BigDecimal;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.server.ResponseStatusException;

/** Controlador MVC: GET consulta; POST modifica; Thymeleaf presenta los resultados. */
@Controller
public class ProductoControlador {
  private final ProductoServicio productoServicio;

  public ProductoControlador(ProductoServicio productoServicio) {
    this.productoServicio = productoServicio;
  }

  @InitBinder("formulario")
  public void limitarCampos(WebDataBinder binder) {
    // El ID procede de la ruta: un formulario no puede modificarlo por asignación masiva.
    binder.setAllowedFields("codigo", "nombre", "categoria", "precio", "existencias");
  }

  @ModelAttribute("categorias")
  public Categoria[] categorias() {
    return Categoria.values();
  }

  @GetMapping("/")
  public String inicio() {
    return "redirect:/productos";
  }

  @GetMapping("/productos")
  public String listar(@RequestParam(defaultValue = "") String q, Model modelo) {
    if (q.length() > 120) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La búsqueda es demasiado larga.");
    }
    var productos = productoServicio.consultarProductos(q);
    modelo.addAttribute("productos", productos);
    modelo.addAttribute("q", q);
    modelo.addAttribute("unidades", productos.stream().mapToLong(Producto::getExistencias).sum());
    modelo.addAttribute("stockBajo", productos.stream().filter(p -> p.getExistencias() < 5).count());
    modelo.addAttribute("valorInventario", productos.stream().map(p -> p.getPrecio()
        .multiply(BigDecimal.valueOf(p.getExistencias()))).reduce(BigDecimal.ZERO, BigDecimal::add));
    return "productos";
  }

  @GetMapping("/productos/nuevo")
  public String nuevo(Model modelo) {
    modelo.addAttribute("formulario", new FormularioProducto());
    return prepararFormulario(null, modelo);
  }

  @GetMapping("/productos/{id}/editar")
  public String editar(@PathVariable long id, Model modelo) {
    modelo.addAttribute("formulario", FormularioProducto.desde(buscarExistente(id)));
    return prepararFormulario(id, modelo);
  }

  @PostMapping("/productos")
  public Object crear(@ModelAttribute("formulario") FormularioProducto formulario,
      Model modelo, HttpServletResponse respuesta, RedirectAttributes atributos) {
    return guardar(null, formulario, modelo, respuesta, atributos);
  }

  @PostMapping("/productos/{id}")
  public Object actualizar(@PathVariable long id,
      @ModelAttribute("formulario") FormularioProducto formulario,
      Model modelo, HttpServletResponse respuesta, RedirectAttributes atributos) {
    buscarExistente(id);
    return guardar(id, formulario, modelo, respuesta, atributos);
  }

  private Object guardar(Long id, FormularioProducto formulario, Model modelo,
      HttpServletResponse respuesta, RedirectAttributes atributos) {
    try {
      Categoria categoria;
      try {
        categoria = Categoria.valueOf(formulario.getCategoria() == null ? "" : formulario.getCategoria());
      } catch (IllegalArgumentException error) {
        throw new IllegalArgumentException("Selecciona una categoría válida.");
      }
      if (id == null) {
        productoServicio.registrarProducto(formulario.getCodigo(), formulario.getNombre(),
            categoria, formulario.getPrecio(), formulario.getExistencias());
      } else {
        productoServicio.actualizarProducto(id, formulario.getCodigo(), formulario.getNombre(),
            categoria, formulario.getPrecio(), formulario.getExistencias());
      }
      atributos.addFlashAttribute("mensaje", id == null
          ? "Producto registrado correctamente." : "Producto actualizado correctamente.");
      return volverAlCatalogo();
    } catch (DuplicateKeyException error) {
      respuesta.setStatus(HttpStatus.CONFLICT.value());
      modelo.addAttribute("errorFormulario", "Ya existe un producto con ese código. Utiliza otro.");
    } catch (IllegalArgumentException error) {
      respuesta.setStatus(HttpStatus.BAD_REQUEST.value());
      modelo.addAttribute("errorFormulario", error.getMessage());
    }
    return prepararFormulario(id, modelo);
  }

  @GetMapping("/productos/{id}/eliminar")
  public String confirmar(@PathVariable long id, Model modelo) {
    modelo.addAttribute("producto", buscarExistente(id));
    return "confirmar";
  }

  @PostMapping("/productos/{id}/eliminar")
  public RedirectView eliminar(@PathVariable long id, RedirectAttributes atributos) {
    buscarExistente(id);
    try {
      productoServicio.eliminarProducto(id);
    } catch (IllegalArgumentException error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    }
    atributos.addFlashAttribute("mensaje", "Producto eliminado correctamente.");
    return volverAlCatalogo();
  }

  private Producto buscarExistente(long id) {
    try {
      return productoServicio.buscarProducto(id);
    } catch (IllegalArgumentException error) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "El producto no existe.");
    }
  }

  private String prepararFormulario(Long id, Model modelo) {
    modelo.addAttribute("productoId", id);
    modelo.addAttribute("titulo", id == null ? "Nuevo producto" : "Editar producto");
    return "formulario";
  }

  private RedirectView volverAlCatalogo() {
    // PRG evita repetir la escritura cuando se actualiza la página de resultados.
    var redireccion = new RedirectView("/productos", true);
    redireccion.setStatusCode(HttpStatus.SEE_OTHER);
    return redireccion;
  }
}
