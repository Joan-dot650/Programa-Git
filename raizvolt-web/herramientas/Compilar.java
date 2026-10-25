import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.jar.Attributes;
import java.util.jar.JarEntry;
import java.util.jar.JarOutputStream;
import java.util.jar.Manifest;
import javax.tools.ToolProvider;

/** Compilador portable: java herramientas/Compilar.java (JDK 17+). */
public class Compilar {
  public static void main(String[] args) throws Exception {
    var compilador = ToolProvider.getSystemJavaCompiler();
    if (compilador == null) {
      throw new IllegalStateException("Instala un JDK 17 o superior para compilar.");
    }
    Path salida = Path.of("build/classes");
    if (Files.exists(Path.of("build"))) {
      try (var rutas = Files.walk(Path.of("build"))) {
        for (Path ruta : rutas.sorted(Comparator.reverseOrder()).toList()) {
          Files.delete(ruta);
        }
      }
    }
    Files.createDirectories(salida);
    Files.createDirectories(Path.of("build/test-classes"));
    Files.createDirectories(Path.of("dist"));
    List<Path> bibliotecas;
    try (var rutas = Files.list(Path.of("lib"))) {
      bibliotecas = rutas.filter(p -> p.toString().endsWith(".jar")).sorted().toList();
    }
    if (bibliotecas.size() < 9) {
      throw new IllegalStateException("Faltan dependencias. Ejecuta descargar_dependencias.");
    }
    String classpath = String.join(File.pathSeparator,
        bibliotecas.stream().map(Path::toString).toList());
    compilar("src/main/java", salida.toString(), classpath);
    try (var recursos = Files.walk(Path.of("src/main/resources"))) {
      for (Path recurso : recursos.filter(Files::isRegularFile).toList()) {
        Path destino = salida.resolve(Path.of("src/main/resources").relativize(recurso));
        Files.createDirectories(destino.getParent());
        Files.copy(recurso, destino);
      }
    }
    compilar("src/test/java", "build/test-classes", salida + File.pathSeparator + classpath);
    Manifest manifiesto = new Manifest();
    manifiesto.getMainAttributes().put(Attributes.Name.MANIFEST_VERSION, "1.0");
    manifiesto.getMainAttributes().put(Attributes.Name.MAIN_CLASS, "co.raizvolt.ServidorWeb");
    try (var jar = new JarOutputStream(Files.newOutputStream(Path.of("dist/raizvolt-web.jar")), manifiesto)) {
      agregarDirectorio(jar, salida, "");
    }
    try (var war = new JarOutputStream(Files.newOutputStream(Path.of("dist/raizvolt.war")) )) {
      agregarDirectorio(war, Path.of("src/main/webapp"), "");
      agregarDirectorio(war, salida, "WEB-INF/classes/");
      for (Path lib : bibliotecas) {
        String nombre = lib.getFileName().toString();
        if (nombre.startsWith("h2-") || nombre.startsWith("mysql-") || nombre.contains("jstl")) {
          war.putNextEntry(new JarEntry("WEB-INF/lib/" + nombre));
          Files.copy(lib, war);
          war.closeEntry();
        }
      }
    }
    System.out.println("Compilación correcta: dist/raizvolt-web.jar y dist/raizvolt.war");
  }

  private static void compilar(String fuentes, String salida, String classpath) throws Exception {
    List<String> opciones = new ArrayList<>(List.of("--release", "17", "-encoding", "UTF-8",
        "-Xlint:all", "-classpath", classpath, "-d", salida));
    try (var archivos = Files.walk(Path.of(fuentes))) {
      opciones.addAll(archivos.filter(p -> p.toString().endsWith(".java"))
          .sorted().map(Path::toString).toList());
    }
    int resultado = ToolProvider.getSystemJavaCompiler()
        .run(null, System.out, System.err, opciones.toArray(String[]::new));
    if (resultado != 0) {
      throw new IllegalStateException("Hay errores de compilación en " + fuentes);
    }
  }

  private static void agregarDirectorio(JarOutputStream jar, Path raiz, String prefijo) throws Exception {
    try (var archivos = Files.walk(raiz)) {
      for (Path archivo : archivos.filter(Files::isRegularFile).sorted().toList()) {
        String nombre = prefijo + raiz.relativize(archivo).toString().replace('\\', '/');
        jar.putNextEntry(new JarEntry(nombre));
        Files.copy(archivo, jar);
        jar.closeEntry();
      }
    }
  }
}
