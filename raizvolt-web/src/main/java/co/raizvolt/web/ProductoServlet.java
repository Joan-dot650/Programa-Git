package co.raizvolt.web;

import co.raizvolt.dao.ErrorPersistencia;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.sql.SQLException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Controlador MVC. GET consulta; POST crea, actualiza o elimina. */
public final class ProductoServlet extends HttpServlet {
  private static final long serialVersionUID = 1L;
  private ProductoServicio servicio;

  @Override
  public void init() throws ServletException {
    servicio = (ProductoServicio) getServletContext().getAttribute("productoServicio");
    if (servicio == null) {
      throw new ServletException("El servicio de productos no está disponible.");
    }
  }

  @Override
  protected void doGet(HttpServletRequest solicitud, HttpServletResponse respuesta)
      throws ServletException, IOException {
    asegurarToken(solicitud.getSession());
    String accion = parametro(solicitud, "accion", "listar");
    try {
      switch (accion) {
        case "listar", "buscar" -> listar(solicitud, respuesta);
        case "nuevo" -> formulario(solicitud, respuesta, Map.of(), false);
        case "editar", "confirmar" -> {
          long id = leerId(solicitud);
          Producto producto;
          try {
            producto = servicio.buscarProducto(id);
          } catch (IllegalArgumentException error) {
            mostrarError(solicitud, respuesta, 404, "El producto no existe.");
            return;
          }
          if (accion.equals("editar")) {
            formulario(solicitud, respuesta, datosProducto(producto), true);
          } else {
            solicitud.setAttribute("producto", producto);
            vista(solicitud, respuesta, "confirmar");
          }
        }
        default -> mostrarError(solicitud, respuesta, 400,
            "La acción solicitada no está disponible mediante GET.");
      }
    } catch (IllegalArgumentException error) {
      mostrarError(solicitud, respuesta, 400, error.getMessage());
    } catch (ErrorPersistencia error) {
      getServletContext().log("Error JDBC en GET", error);
      mostrarError(solicitud, respuesta, 503, error.getMessage());
    }
  }

  @Override
  protected void doPost(HttpServletRequest solicitud, HttpServletResponse respuesta)
      throws ServletException, IOException {
    if (!tokenValido(solicitud)) {
      mostrarError(solicitud, respuesta, 403,
          "El formulario venció o no es válido. Vuelve al catálogo e inténtalo de nuevo.");
      return;
    }
    String accion = parametro(solicitud, "accion", "");
    if (!List.of("crear", "actualizar", "eliminar").contains(accion)) {
      mostrarError(solicitud, respuesta, 400, "La acción solicitada no es válida.");
      return;
    }
    Map<String, String> datos = leerFormulario(solicitud);
    try {
      String mensaje;
      if (accion.equals("eliminar")) {
        servicio.eliminarProducto(leerId(solicitud));
        mensaje = "Producto eliminado correctamente.";
      } else {
        Categoria categoria;
        try {
          categoria = Categoria.valueOf(datos.get("categoria"));
        } catch (IllegalArgumentException error) {
          throw new IllegalArgumentException("Selecciona una categoría válida.");
        }
        if (accion.equals("crear")) {
          servicio.registrarProducto(datos.get("codigo"), datos.get("nombre"),
              categoria, datos.get("precio"), datos.get("existencias"));
          mensaje = "Producto registrado correctamente.";
        } else {
          servicio.actualizarProducto(leerId(solicitud), datos.get("codigo"),
              datos.get("nombre"), categoria, datos.get("precio"), datos.get("existencias"));
          mensaje = "Producto actualizado correctamente.";
        }
      }
      // Post/Redirect/Get: recargar la lista no repite la operación de escritura.
      solicitud.getSession().setAttribute("mensaje", mensaje);
      respuesta.setStatus(HttpServletResponse.SC_SEE_OTHER);
      respuesta.setHeader("Location", solicitud.getContextPath() + "/productos");
    } catch (IllegalArgumentException | ErrorPersistencia error) {
      int estado = 400;
      if (error instanceof ErrorPersistencia) {
        getServletContext().log("Error JDBC en POST", error);
        Throwable causa = error.getCause();
        estado = causa instanceof SQLException sql
            && ("23505".equals(sql.getSQLState()) || sql.getErrorCode() == 1062) ? 409 : 503;
      }
      respuesta.setStatus(estado);
      if (accion.equals("eliminar")) {
        mostrarError(solicitud, respuesta, estado, error.getMessage());
      } else {
        solicitud.setAttribute("errorFormulario", error.getMessage());
        formulario(solicitud, respuesta, datos, accion.equals("actualizar"));
      }
    }
  }

  private void listar(HttpServletRequest solicitud, HttpServletResponse respuesta)
      throws ServletException, IOException {
    String consulta = parametro(solicitud, "q", "").strip();
    if (consulta.length() > 120) {
      throw new IllegalArgumentException("La búsqueda admite hasta 120 caracteres.");
    }
    List<Producto> productos = servicio.consultarProductos(consulta);
    solicitud.setAttribute("productos", productos);
    solicitud.setAttribute("consulta", consulta);
    solicitud.setAttribute("cantidad", productos.size());
    solicitud.setAttribute("unidades", productos.stream()
        .mapToLong(Producto::getExistencias).sum());
    solicitud.setAttribute("stockBajo", productos.stream()
        .filter(producto -> producto.getExistencias() <= 5).count());
    BigDecimal valor = productos.stream().map(producto -> producto.getPrecio()
        .multiply(BigDecimal.valueOf(producto.getExistencias())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    solicitud.setAttribute("valorInventario", valor);
    HttpSession sesion = solicitud.getSession();
    solicitud.setAttribute("mensaje", sesion.getAttribute("mensaje"));
    sesion.removeAttribute("mensaje");
    vista(solicitud, respuesta, "productos");
  }

  private void formulario(HttpServletRequest solicitud, HttpServletResponse respuesta,
      Map<String, String> datos, boolean edicion) throws ServletException, IOException {
    solicitud.setAttribute("datos", datos);
    solicitud.setAttribute("edicion", edicion);
    solicitud.setAttribute("categorias", Categoria.values());
    vista(solicitud, respuesta, "formulario");
  }

  private Map<String, String> leerFormulario(HttpServletRequest solicitud) {
    Map<String, String> datos = new LinkedHashMap<>();
    for (String clave : List.of("id", "codigo", "nombre", "categoria", "precio", "existencias")) {
      datos.put(clave, parametro(solicitud, clave, ""));
    }
    return datos;
  }

  private Map<String, String> datosProducto(Producto producto) {
    return Map.of("id", Long.toString(producto.getId()), "codigo", producto.getCodigo(),
        "nombre", producto.getNombre(), "categoria", producto.getCategoria().name(),
        "precio", producto.getPrecio().toPlainString(),
        "existencias", Integer.toString(producto.getExistencias()));
  }

  private long leerId(HttpServletRequest solicitud) {
    try {
      long id = Long.parseLong(parametro(solicitud, "id", ""));
      if (id > 0) {
        return id;
      }
    } catch (NumberFormatException error) {
      // Se informa el mismo mensaje para un ID ausente, fuera de rango o no numérico.
    }
    throw new IllegalArgumentException("El identificador del producto no es válido.");
  }

  private String parametro(HttpServletRequest solicitud, String nombre, String defecto) {
    String valor = solicitud.getParameter(nombre);
    return valor == null ? defecto : valor;
  }

  private void asegurarToken(HttpSession sesion) {
    synchronized (sesion) {
      if (sesion.getAttribute("csrf") == null) {
        byte[] aleatorio = new byte[32];
        new SecureRandom().nextBytes(aleatorio);
        sesion.setAttribute("csrf", Base64.getUrlEncoder().withoutPadding()
            .encodeToString(aleatorio));
      }
    }
  }

  private boolean tokenValido(HttpServletRequest solicitud) {
    HttpSession sesion = solicitud.getSession(false);
    String enviado = solicitud.getParameter("csrf");
    if (sesion == null || enviado == null || !(sesion.getAttribute("csrf") instanceof String esperado)) {
      return false;
    }
    return MessageDigest.isEqual(esperado.getBytes(StandardCharsets.UTF_8),
        enviado.getBytes(StandardCharsets.UTF_8));
  }

  private void mostrarError(HttpServletRequest solicitud, HttpServletResponse respuesta,
      int estado, String mensaje) throws ServletException, IOException {
    respuesta.setStatus(estado);
    solicitud.setAttribute("estadoError", estado);
    solicitud.setAttribute("mensajeError", mensaje);
    vista(solicitud, respuesta, "error");
  }

  private void vista(HttpServletRequest solicitud, HttpServletResponse respuesta,
      String nombre) throws ServletException, IOException {
    solicitud.getRequestDispatcher("/WEB-INF/vistas/" + nombre + ".jsp")
        .forward(solicitud, respuesta);
  }
}
