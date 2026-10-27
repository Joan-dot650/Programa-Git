package co.raizvolt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Arranca Spring, el servidor web integrado y las dependencias del catálogo. */
@SpringBootApplication
public class RaizVoltAplicacion {
  public static void main(String[] args) {
    SpringApplication.run(RaizVoltAplicacion.class, args);
  }
}
