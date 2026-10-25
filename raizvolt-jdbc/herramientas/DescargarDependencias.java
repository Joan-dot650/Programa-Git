import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

/** Herramienta independiente: java herramientas/DescargarDependencias.java. */
public class DescargarDependencias {
  private record Dependencia(String archivo, String ruta, String sha256) {
  }

  public static void main(String[] argumentos) throws Exception {
    Dependencia[] dependencias = {
        new Dependencia("h2-2.5.250.jar",
            "com/h2database/h2/2.5.250/h2-2.5.250.jar",
            "82a80a2ac06901b03cdb233c663d21c4f49c884bf6d0cf85022729e8db9ab86f"),
        new Dependencia("mysql-connector-j-9.5.0.jar",
            "com/mysql/mysql-connector-j/9.5.0/mysql-connector-j-9.5.0.jar",
            "f2ca3dfaf00d4aa311470db7ea3051962944ba0cb60005a2f75467549c39f425")
    };
    Files.createDirectories(Path.of("lib"));
    HttpClient cliente = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20)).build();
    for (Dependencia dependencia : dependencias) {
      Path destino = Path.of("lib", dependencia.archivo());
      if (Files.exists(destino)
          && calcularHash(destino).equals(dependencia.sha256())) {
        System.out.println("Verificado: " + dependencia.archivo());
        continue;
      }
      Path temporal = Files.createTempFile(Path.of("lib"), "descarga-", ".tmp");
      try {
        HttpRequest solicitud = HttpRequest.newBuilder(URI.create(
            "https://repo.maven.apache.org/maven2/" + dependencia.ruta()))
            .timeout(Duration.ofSeconds(60)).GET().build();
        HttpResponse<Path> respuesta =
            cliente.send(solicitud, HttpResponse.BodyHandlers.ofFile(temporal));
        if (respuesta.statusCode() != 200
            || !calcularHash(temporal).equals(dependencia.sha256())) {
          throw new IllegalStateException(
              "La descarga no superó la verificación: " + dependencia.archivo());
        }
        Files.move(temporal, destino, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("Descargado y verificado: " + dependencia.archivo());
      } finally {
        Files.deleteIfExists(temporal);
      }
    }
  }

  private static String calcularHash(Path archivo) throws Exception {
    byte[] resumen = MessageDigest.getInstance("SHA-256")
        .digest(Files.readAllBytes(archivo));
    return HexFormat.of().formatHex(resumen);
  }
}
