package co.raizvolt.config;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

/** Lee configuración local; las variables de entorno tienen prioridad. */
public final class ConfiguracionBaseDatos {
  private final String url;
  private final String usuario;
  private final String contrasena;

  public ConfiguracionBaseDatos(String url, String usuario, String contrasena) {
    if (url == null || !(url.startsWith("jdbc:h2:")
        || url.startsWith("jdbc:mysql:"))) {
      throw new IllegalArgumentException("La URL debe usar JDBC con H2 o MySQL.");
    }
    this.url = url;
    this.usuario = usuario;
    this.contrasena = contrasena;
  }

  public static ConfiguracionBaseDatos cargar() throws IOException {
    Properties propiedades = new Properties();
    Path base = Path.of(System.getProperty("raizvolt.baseDir", "."));
    Path archivo = base.resolve("config/database.properties");
    if (Files.exists(archivo)) {
      try (Reader lector = Files.newBufferedReader(
          archivo, StandardCharsets.UTF_8)) {
        propiedades.load(lector);
      }
    }
    return new ConfiguracionBaseDatos(
        System.getProperty("raizvolt.db.url",
            valor(propiedades, "db.url", "RAIZVOLT_DB_URL",
                "jdbc:h2:" + base.resolve("datos/raizvolt-web").toAbsolutePath()
                    .toString().replace('\\', '/')
                    + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE")),
        valor(propiedades, "db.user", "RAIZVOLT_DB_USER", "sa"),
        valor(propiedades, "db.password", "RAIZVOLT_DB_PASSWORD", ""));
  }

  private static String valor(Properties propiedades, String clave,
      String variable, String predeterminado) {
    String entorno = System.getenv(variable);
    return entorno == null
        ? propiedades.getProperty(clave, predeterminado) : entorno;
  }

  public String getUrl() {
    return url;
  }

  public String getUsuario() {
    return usuario;
  }

  public String getContrasena() {
    return contrasena;
  }

  public boolean esH2() {
    return url.startsWith("jdbc:h2:");
  }
}
