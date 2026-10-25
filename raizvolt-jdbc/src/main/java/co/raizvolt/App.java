package co.raizvolt;

import co.raizvolt.config.ConexionJdbc;
import co.raizvolt.config.ConfiguracionBaseDatos;
import co.raizvolt.config.InicializadorBaseDatos;
import co.raizvolt.dao.ProductoDaoJdbc;
import co.raizvolt.interfaz.PanelProductos;
import co.raizvolt.servicio.ProductoServicio;
import java.awt.Font;
import java.awt.Dimension;
import javax.swing.JFrame;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.plaf.FontUIResource;

/** Punto de entrada del módulo de productos. */
public final class App {
  private App() {
  }

  public static void main(String[] argumentos) {
    try {
      ConfiguracionBaseDatos configuracion = ConfiguracionBaseDatos.cargar();
      if (configuracion.esH2()) {
        Files.createDirectories(Path.of("datos"));
      }
      ConexionJdbc conexion = new ConexionJdbc(configuracion);
      InicializadorBaseDatos.inicializar(conexion, configuracion.esH2());
      ProductoServicio servicio = new ProductoServicio(new ProductoDaoJdbc(conexion));
      SwingUtilities.invokeLater(() -> {
        configurarFuentes();
        JFrame ventana = new JFrame("RaízVolt | Gestión de productos");
        ventana.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        ventana.setContentPane(new PanelProductos(servicio,
            configuracion.esH2() ? "H2 local" : "MySQL"));
        ventana.setMinimumSize(new Dimension(1080, 700));
        ventana.pack();
        ventana.setLocationRelativeTo(null);
        ventana.setVisible(true);
      });
    } catch (Exception error) {
      String mensaje = "No se pudo iniciar RaízVolt.\n"
          + "Comprueba lib/, la configuración y el servidor de base de datos.\n"
          + "Para MySQL, importa primero database/mysql.sql.\n"
          + "Consulta docs/GUIA_PASO_A_PASO.md.";
      System.err.println(mensaje);
      // No se imprimen URLs, contraseñas ni detalles sensibles del controlador.
      SwingUtilities.invokeLater(() ->
          JOptionPane.showMessageDialog(null, mensaje,
              "Error de conexión", JOptionPane.ERROR_MESSAGE));
    }
  }

  public static void configurarFuentes() {
    FontUIResource fuente = new FontUIResource(Font.SANS_SERIF, Font.PLAIN, 14);
    for (Object clave : UIManager.getDefaults().keySet().toArray()) {
      if (UIManager.get(clave) instanceof FontUIResource) {
        UIManager.put(clave, fuente);
      }
    }
  }
}
