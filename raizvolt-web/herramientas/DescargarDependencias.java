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

/** Recupera las versiones fijadas y comprueba SHA-256 antes de utilizarlas. */
public class DescargarDependencias {
  public static void main(String[] args) throws Exception {
    Files.createDirectories(Path.of("lib"));
    var cliente = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    for (String linea : Files.readAllLines(Path.of("dependencias.tsv"))) {
      if (linea.isBlank()) continue;
      String[] datos = linea.split("\t");
      Path destino = Path.of("lib", datos[0]);
      if (Files.exists(destino) && hash(Files.readAllBytes(destino)).equals(datos[2])) {
        System.out.println("Verificado: " + datos[0]);
        continue;
      }
      System.out.println("Descargando: " + datos[0]);
      var respuesta = cliente.send(HttpRequest.newBuilder(URI.create(datos[1]))
          .timeout(Duration.ofSeconds(60)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
      if (respuesta.statusCode() != 200 || !hash(respuesta.body()).equals(datos[2])) {
        throw new IllegalStateException("La descarga no pasó la verificación: " + datos[0]);
      }
      Path temporal = Path.of(destino + ".tmp");
      Files.write(temporal, respuesta.body());
      Files.move(temporal, destino, StandardCopyOption.REPLACE_EXISTING);
    }
    System.out.println("Dependencias listas. Ejecuta compilar.");
  }

  private static String hash(byte[] bytes) throws Exception {
    return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
  }
}
