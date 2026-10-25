package co.raizvolt;

import java.nio.file.Files;
import java.nio.file.Path;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.startup.Tomcat;

/** Ejecuta la aplicación JSP/Servlet con Tomcat, en el equipo local. */
public final class ServidorWeb implements AutoCloseable {
  private final Tomcat tomcat = new Tomcat();

  public ServidorWeb(Path proyecto, Path temporal, int puerto) throws Exception {
    Path vistas = proyecto.resolve("src/main/webapp").toAbsolutePath();
    if (!Files.isDirectory(vistas)) {
      throw new IllegalArgumentException("Ejecuta desde la carpeta raizvolt-web.");
    }
    Files.createDirectories(temporal);
    tomcat.setBaseDir(temporal.toAbsolutePath().toString());
    tomcat.setPort(puerto);
    tomcat.getConnector().setProperty("address", "127.0.0.1");
    tomcat.getConnector().setURIEncoding("UTF-8");
    tomcat.getConnector().setMaxPostSize(32768);
    Context contexto = tomcat.addWebapp("/raizvolt", vistas.toString());
    contexto.setParentClassLoader(ServidorWeb.class.getClassLoader());
    tomcat.start();
    if (!contexto.getState().isAvailable()) {
      close();
      throw new IllegalStateException("No se pudo iniciar RaízVolt. Revisa el registro.");
    }
  }

  public int getPuerto() {
    return tomcat.getConnector().getLocalPort();
  }

  @Override
  public void close() throws LifecycleException {
    tomcat.stop();
    tomcat.destroy();
  }

  public static void main(String[] argumentos) {
    try {
      int puerto = argumentos.length == 0 ? 8080 : Integer.parseInt(argumentos[0]);
      if (puerto < 1 || puerto > 65535) {
        throw new IllegalArgumentException("El puerto debe estar entre 1 y 65535.");
      }
      Path proyecto = Path.of(".").toAbsolutePath().normalize();
      ServidorWeb servidor = new ServidorWeb(proyecto, proyecto.resolve(".runtime"), puerto);
      Runtime.getRuntime().addShutdownHook(new Thread(() -> {
        try {
          servidor.close();
        } catch (Exception error) {
          System.err.println("No se completó el cierre: " + error.getMessage());
        }
      }));
      System.out.println("\nRAÍZVOLT ESTÁ LISTO\nAbre: http://localhost:"
          + servidor.getPuerto() + "/raizvolt/productos\nPara detener: Ctrl+C\n");
      servidor.tomcat.getServer().await();
    } catch (Exception error) {
      System.err.println("No se pudo iniciar: " + error.getMessage());
      System.err.println("Comprueba Java 17, lib, dist y que el puerto esté libre.");
      System.exit(1);
    }
  }
}
