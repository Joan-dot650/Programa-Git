package co.raizvolt.web;

import co.raizvolt.config.ConexionJdbc;
import co.raizvolt.config.ConfiguracionBaseDatos;
import co.raizvolt.config.InicializadorBaseDatos;
import co.raizvolt.dao.ProductoDaoJdbc;
import co.raizvolt.servicio.ProductoServicio;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;

/** Construye las dependencias una vez; cada operación abre su conexión JDBC. */
public final class InicioAplicacion implements ServletContextListener {
  @Override
  public void contextInitialized(ServletContextEvent evento) {
    try {
      ConfiguracionBaseDatos configuracion = ConfiguracionBaseDatos.cargar();
      Class.forName(configuracion.esH2() ? "org.h2.Driver" : "com.mysql.cj.jdbc.Driver");
      ConexionJdbc conexion = new ConexionJdbc(configuracion);
      InicializadorBaseDatos.inicializar(conexion, configuracion.esH2());
      evento.getServletContext().setAttribute("productoServicio",
          new ProductoServicio(new ProductoDaoJdbc(conexion)));
    } catch (Exception error) {
      throw new IllegalStateException("No se pudo preparar la base de datos.", error);
    }
  }
}
