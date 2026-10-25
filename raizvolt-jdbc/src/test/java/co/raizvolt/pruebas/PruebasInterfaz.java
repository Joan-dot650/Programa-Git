package co.raizvolt.pruebas;

import co.raizvolt.App;
import co.raizvolt.config.ConexionJdbc;
import co.raizvolt.config.ConfiguracionBaseDatos;
import co.raizvolt.config.InicializadorBaseDatos;
import co.raizvolt.dao.ProductoDaoJdbc;
import co.raizvolt.interfaz.DialogosUsuario;
import co.raizvolt.interfaz.PanelProductos;
import co.raizvolt.modelo.Categoria;
import co.raizvolt.servicio.ProductoServicio;
import java.awt.Component;
import java.awt.Container;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.imageio.ImageIO;
import javax.swing.JButton;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;

/** Acciones del panel real en modo sin pantalla; diálogos con respuesta simulada. */
public final class PruebasInterfaz {
  private static PanelProductos panel;
  private static int verificaciones;
  private static final DialogosPrueba DIALOGOS = new DialogosPrueba();

  private PruebasInterfaz() {
  }

  public static void main(String[] argumentos) throws Exception {
    ConexionJdbc conexion = new ConexionJdbc(new ConfiguracionBaseDatos(
        "jdbc:h2:mem:interfaz;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", ""));
    InicializadorBaseDatos.inicializar(conexion, true);
    ProductoServicio servicio = new ProductoServicio(new ProductoDaoJdbc(conexion));
    SwingUtilities.invokeAndWait(() -> {
      App.configurarFuentes();
      panel = new PanelProductos(servicio, "H2 local", DIALOGOS);
    });
    esperarDisponible();
    verificar(servicio.consultarProductos("").isEmpty(), "pantalla inicial vacía");
    accion(() -> boton("registrar").doClick());
    esperarDisponible();
    verificar(DIALOGOS.ultimoError != null
        && servicio.consultarProductos("").isEmpty(),
        "formulario vacío informa error sin insertar");

    accion(() -> {
      campo("codigo").setText("PAN-550");
      campo("nombre").setText("Panel solar 550 W");
      campo("precio").setText("680000");
      campo("existencias").setText("12");
      boton("registrar").doClick();
    });
    esperarDisponible();
    verificar(servicio.consultarProductos("").size() == 1,
        "botón Registrar guarda en JDBC");
    long id = servicio.consultarProductos("").get(0).getId();
    accion(() -> {
      tabla().setRowSelectionInterval(0, 0);
      campo("precio").setText("700000");
      campo("existencias").setText("9");
      boton("actualizar").doClick();
    });
    esperarDisponible();
    verificar(servicio.buscarProducto(id).getExistencias() == 9,
        "selección y botón Actualizar");
    accion(() -> {
      campo("busqueda").setText("no-existe");
      boton("buscar").doClick();
    });
    esperarDisponible();
    accion(() -> verificar(tabla().getRowCount() == 0,
        "búsqueda sin resultados en tabla"));
    accion(() -> boton("mostrarTodos").doClick());
    esperarDisponible();
    accion(() -> verificar(tabla().getRowCount() == 1,
        "Mostrar todo restaura la consulta"));

    DIALOGOS.confirmar = false;
    accion(() -> {
      tabla().setRowSelectionInterval(0, 0);
      boton("eliminar").doClick();
    });
    verificar(servicio.consultarProductos("").size() == 1,
        "cancelar eliminación conserva la fila");
    DIALOGOS.confirmar = true;
    accion(() -> boton("eliminar").doClick());
    esperarDisponible();
    verificar(servicio.consultarProductos("").isEmpty(),
        "confirmar eliminación borra la fila seleccionada");

    servicio.registrarProducto("PAN-550", "Panel solar 550 W",
        Categoria.PANEL_SOLAR, "680000", "12");
    servicio.registrarProducto("INV-3000", "Inversor híbrido 3000 W",
        Categoria.INVERSOR, "2350000", "4");
    servicio.registrarProducto("BAT-100", "Batería de litio 100 Ah",
        Categoria.BATERIA, "1850000", "6");
    accion(() -> boton("mostrarTodos").doClick());
    esperarDisponible();
    accion(() -> {
      tabla().getRowSorter().toggleSortOrder(1);
      tabla().setRowSelectionInterval(0, 0);
      verificar(campo("codigo").getText().equals(
          tabla().getValueAt(0, 1).toString()),
          "selección correcta después de ordenar la tabla");
      boton("nuevo").doClick();
    });
    accion(() -> verificar(boton("registrar").isEnabled()
        && !boton("actualizar").isEnabled() && !boton("eliminar").isEnabled(),
        "Nuevo limpia selección y habilita acciones correctas"));
    generarImagen();
    System.out.println("RESULTADO: " + verificaciones
        + " verificaciones de interfaz aprobadas.");
    System.out.println("Imagen del panel real: build/verificacion/interfaz.png");
  }

  private static void generarImagen() throws Exception {
    Path destino = Path.of("build", "verificacion", "interfaz.png");
    Files.createDirectories(destino.getParent());
    BufferedImage imagen = new BufferedImage(1180, 710, BufferedImage.TYPE_INT_RGB);
    accion(() -> {
      panel.setSize(1180, 710);
      distribuir(panel);
      Graphics2D grafico = imagen.createGraphics();
      grafico.setRenderingHint(java.awt.RenderingHints.KEY_TEXT_ANTIALIASING,
          java.awt.RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
      panel.printAll(grafico);
      grafico.dispose();
    });
    ImageIO.write(imagen, "png", destino.toFile());
  }

  private static void distribuir(Container contenedor) {
    contenedor.doLayout();
    for (Component componente : contenedor.getComponents()) {
      if (componente instanceof Container hijo) {
        distribuir(hijo);
      }
    }
  }

  private static void esperarDisponible() throws Exception {
    for (int intento = 0; intento < 200; intento++) {
      AtomicBoolean listo = new AtomicBoolean();
      accion(() -> listo.set(boton("nuevo").isEnabled()));
      if (listo.get()) {
        return;
      }
      Thread.sleep(25);
    }
    throw new AssertionError("La interfaz no terminó la operación en 5 segundos.");
  }

  private static void accion(Runnable accion) throws Exception {
    SwingUtilities.invokeAndWait(accion);
  }

  private static Component buscar(Container padre, String nombre) {
    for (Component componente : padre.getComponents()) {
      if (nombre.equals(componente.getName())) {
        return componente;
      }
      if (componente instanceof Container contenedor) {
        Component encontrado = buscar(contenedor, nombre);
        if (encontrado != null) {
          return encontrado;
        }
      }
    }
    return null;
  }

  private static JTextField campo(String nombre) {
    return (JTextField) buscar(panel, nombre);
  }

  private static JButton boton(String nombre) {
    return (JButton) buscar(panel, nombre);
  }

  private static JTable tabla() {
    return (JTable) buscar(panel, "tablaProductos");
  }

  private static void verificar(boolean condicion, String descripcion) {
    if (!condicion) {
      throw new AssertionError(descripcion);
    }
    verificaciones++;
    System.out.println("OK UI " + verificaciones + " - " + descripcion);
  }

  private static final class DialogosPrueba implements DialogosUsuario {
    private boolean confirmar;
    private String ultimoError;

    @Override
    public boolean confirmarEliminacion(Component padre, String codigo) {
      return confirmar;
    }

    @Override
    public void mostrarError(Component padre, String mensaje) {
      ultimoError = mensaje;
    }
  }
}
