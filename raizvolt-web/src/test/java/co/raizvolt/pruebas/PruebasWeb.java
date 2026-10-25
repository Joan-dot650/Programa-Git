package co.raizvolt.pruebas;

import co.raizvolt.ServidorWeb;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

/** Tomcat, JSP y JDBC reales. Cada ejecución utiliza una base temporal independiente. */
public final class PruebasWeb {
  private static int verificaciones;
  private static String base;
  private static final HttpClient CLIENTE = HttpClient.newBuilder()
      .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
      .followRedirects(HttpClient.Redirect.NEVER).connectTimeout(Duration.ofSeconds(10)).build();

  private PruebasWeb() {
  }

  public static void main(String[] args) throws Exception {
    Path temporal = Files.createTempDirectory("raizvolt-web-pruebas-");
    String anterior = System.getProperty("raizvolt.db.url");
    System.setProperty("raizvolt.db.url", "jdbc:h2:"
        + temporal.resolve("catalogo").toString().replace('\\', '/')
        + ";MODE=MySQL;DATABASE_TO_LOWER=TRUE");
    try {
      try (ServidorWeb servidor = new ServidorWeb(Path.of("."), temporal.resolve("tomcat-1"), 0)) {
        base = "http://127.0.0.1:" + servidor.getPuerto() + "/raizvolt";
        ejecutar();
      }
      try (ServidorWeb servidor = new ServidorWeb(Path.of("."), temporal.resolve("tomcat-2"), 0)) {
        base = "http://127.0.0.1:" + servidor.getPuerto() + "/raizvolt";
        var recarga = get("/productos");
        verificar(recarga.statusCode() == 200 && recarga.body().contains("PERSISTENTE-1"),
            "datos persistentes tras reiniciar Tomcat");
        verificar(!recarga.body().contains("WEB-001"), "eliminación persistente tras reiniciar");
      }
      System.out.println("RESULTADO: " + verificaciones + " verificaciones HTTP/JSP aprobadas.");
    } finally {
      if (anterior == null) System.clearProperty("raizvolt.db.url");
      else System.setProperty("raizvolt.db.url", anterior);
      try (var rutas = Files.walk(temporal)) {
        for (Path ruta : rutas.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(ruta);
      }
    }
  }

  private static void ejecutar() throws Exception {
    var inicio = get("/");
    verificar(inicio.statusCode() == 200, "inicio mediante jsp:forward");
    verificar(inicio.body().contains("Tu catálogo empieza aquí"), "catálogo vacío");
    verificar(!inicio.body().contains("${"), "JSP y EL procesadas en servidor");
    verificar(inicio.body().contains("Soluciones de energía solar · Colombia"),
        "fragmento JSP del pie conserva UTF-8");
    verificar(inicio.headers().firstValue("Content-Type").orElse("").contains("charset=UTF-8"), "UTF-8");
    verificar(inicio.headers().firstValue("Content-Security-Policy").isPresent(), "política de contenido");
    verificar(get("/assets/estilos.css").statusCode() == 200, "CSS disponible");
    verificar(get("/WEB-INF/vistas/formulario.jsp").statusCode() == 404, "JSP protegida de acceso directo");
    var nuevo = get("/productos?accion=nuevo");
    verificar(nuevo.statusCode() == 200 && nuevo.body().contains("method=\"post\""), "formulario HTML POST");
    String csrf = extraer(nuevo.body(), "name=\"csrf\" value=\"([^\"]+)\"");
    verificar(!csrf.isBlank(), "token de sesión");
    Map<String, String> datos = producto(csrf, "WEB-001", "Panel solar de prueba", "680000,50", "12");
    var sinToken = new LinkedHashMap<>(datos);
    sinToken.remove("csrf");
    verificar(post(sinToken).statusCode() == 403, "POST sin token rechazado");
    sinToken.put("csrf", "incorrecto");
    verificar(post(sinToken).statusCode() == 403, "token incorrecto rechazado");
    datos.put("precio", "0");
    var invalido = post(datos);
    verificar(invalido.statusCode() == 400, "validación de precio en servidor");
    verificar(invalido.body().contains("Panel solar de prueba"), "datos conservados tras error");
    datos.put("precio", "680000,50");
    datos.put("categoria", "NO_EXISTE");
    verificar(post(datos).statusCode() == 400, "categoría inválida rechazada");
    datos.put("categoria", "PANEL_SOLAR");
    datos.put("existencias", "-1");
    verificar(post(datos).statusCode() == 400, "stock negativo rechazado");
    datos.put("existencias", "12");
    datos.put("codigo", "  web-001  ");
    var guardado = post(datos);
    verificar(guardado.statusCode() == 303, "alta POST redirige con 303");
    verificar(guardado.headers().firstValue("Location").orElse("").equals("/raizvolt/productos"), "redirección al catálogo");
    var lista = get("/productos");
    verificar(lista.statusCode() == 200 && lista.body().contains("WEB-001"), "alta y código normalizado");
    verificar(lista.body().contains("registrado correctamente"), "confirmación de éxito");
    verificar(lista.body().contains("method=\"get\""), "formulario HTML GET");
    verificar(!get("/productos").body().contains("registrado correctamente"), "mensaje de un solo uso");
    String id = extraer(lista.body(), "accion=editar(?:&amp;|&)id=([0-9]+)");
    verificar(post(datos).statusCode() == 409, "código duplicado rechazado");
    verificar(get("/productos?accion=buscar&q=web-001").body().contains("Panel solar de prueba"), "GET recibe código de búsqueda");
    verificar(get("/productos?accion=buscar&q=noexiste").body().contains("No encontramos coincidencias"), "búsqueda vacía");
    verificar(get("/productos?accion=buscar&q=" + codificar("' OR 1=1 --")).body()
        .contains("No encontramos coincidencias"), "consulta parametrizada ante texto SQL");
    verificar(get("/productos?accion=buscar&q=" + "x".repeat(121)).statusCode() == 400, "longitud de búsqueda limitada");
    verificar(get("/productos?accion=editar&id=no").statusCode() == 400, "ID no numérico controlado");
    verificar(get("/productos?accion=editar&id=-1").statusCode() == 400, "ID negativo controlado");
    verificar(get("/productos?accion=editar&id=9999999").statusCode() == 404, "producto inexistente controlado");
    var edicion = get("/productos?accion=editar&id=" + id);
    verificar(edicion.statusCode() == 200 && edicion.body().contains("Panel solar de prueba"), "edición precargada");
    verificar(get("/productos?accion=eliminar&id=" + id).statusCode() == 400, "GET no elimina");
    verificar(get("/productos").body().contains("WEB-001"), "GET conserva los datos");
    datos.put("codigo", "WEB-001");
    datos.put("accion", "actualizar");
    datos.put("id", id);
    datos.put("nombre", "Batería & energía <script>alert(1)</script>");
    datos.put("categoria", "BATERIA");
    datos.put("precio", "750000.75");
    datos.put("existencias", "3");
    verificar(post(datos).statusCode() == 303, "actualización POST");
    String actualizado = get("/productos").body();
    verificar(actualizado.contains("Batería &amp; energía &lt;script&gt;"), "HTML escapado y acentos conservados");
    verificar(!actualizado.contains("<script>alert(1)</script>"), "entrada sin ejecución de script");
    verificar(actualizado.contains("750.000,75"), "precio exacto y formato COP");
    verificar(actualizado.contains("Stock bajo"), "aviso de stock bajo");
    verificar(get("/productos?accion=editar&id=" + id).body().contains("value=\"3\""), "stock actualizado");
    var confirmar = get("/productos?accion=confirmar&id=" + id);
    verificar(confirmar.statusCode() == 200 && confirmar.body().contains("Sí, eliminar producto"), "confirmación explícita");
    verificar(!confirmar.body().contains("<script>alert(1)</script>"), "confirmación escapa HTML");
    verificar(get("/productos").body().contains("WEB-001"), "cancelar conserva el registro");
    var eliminar = Map.of("accion", "eliminar", "id", id, "csrf", csrf);
    verificar(post(eliminar).statusCode() == 303, "eliminación POST");
    verificar(!get("/productos").body().contains("WEB-001"), "eliminación reflejada en lista");
    verificar(post(eliminar).statusCode() == 400, "repetir eliminación no muestra éxito falso");
    verificar(post(Map.of("accion", "otra", "csrf", csrf)).statusCode() == 400, "acción POST desconocida controlada");
    verificar(post(producto(csrf, "PERSISTENTE-1", "Batería persistente", "2300000.00", "7"))
        .statusCode() == 303, "alta para prueba de reinicio");
  }

  private static Map<String, String> producto(String csrf, String codigo, String nombre, String precio, String stock) {
    return new LinkedHashMap<>(Map.of("accion", "crear", "csrf", csrf, "codigo", codigo,
        "nombre", nombre, "categoria", "PANEL_SOLAR", "precio", precio, "existencias", stock));
  }

  private static HttpResponse<String> get(String ruta) throws Exception {
    return CLIENTE.send(HttpRequest.newBuilder(URI.create(base + ruta)).GET()
        .timeout(Duration.ofSeconds(40)).build(), HttpResponse.BodyHandlers.ofString());
  }

  private static HttpResponse<String> post(Map<String, String> datos) throws Exception {
    String cuerpo = String.join("&", datos.entrySet().stream()
        .map(e -> codificar(e.getKey()) + "=" + codificar(e.getValue())).toList());
    return CLIENTE.send(HttpRequest.newBuilder(URI.create(base + "/productos"))
        .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
        .timeout(Duration.ofSeconds(40)).POST(HttpRequest.BodyPublishers.ofString(cuerpo)).build(),
        HttpResponse.BodyHandlers.ofString());
  }

  private static String codificar(String valor) {
    return URLEncoder.encode(valor, StandardCharsets.UTF_8);
  }

  private static String extraer(String html, String patron) {
    var resultado = Pattern.compile(patron).matcher(html);
    if (!resultado.find()) throw new AssertionError("No se encontró: " + patron);
    return resultado.group(1);
  }

  private static void verificar(boolean resultado, String caso) {
    if (!resultado) throw new AssertionError("FALLÓ: " + caso);
    verificaciones++;
    System.out.println("OK " + verificaciones + " - " + caso);
  }
}
