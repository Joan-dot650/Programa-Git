package co.raizvolt.api;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

/** Respuestas JSON estables; no se exponen sentencias SQL ni trazas al navegador. */
@RestControllerAdvice(assignableTypes = ProductoApiControlador.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ManejadorErroresApi {
  private static final Logger REGISTRO = LoggerFactory.getLogger(ManejadorErroresApi.class);

  @ExceptionHandler(ValidacionApiException.class)
  public ResponseEntity<?> validacion(ValidacionApiException error) {
    return ResponseEntity.badRequest().body(Map.of("mensaje", error.getMessage(), "errores", error.getErrores()));
  }

  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<?> duplicado(DuplicateKeyException error) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
        "mensaje", "Ya existe un producto con ese código.",
        "errores", Map.of("codigo", "Este código ya está registrado. Utiliza otro.")));
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<?> estado(ResponseStatusException error) {
    return ResponseEntity.status(error.getStatusCode()).body(Map.of("mensaje",
        error.getReason() == null ? "No fue posible completar la solicitud." : error.getReason()));
  }

  @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class,
      MethodArgumentTypeMismatchException.class})
  public ResponseEntity<?> entradaIncorrecta(Exception error) {
    return ResponseEntity.badRequest().body(Map.of("mensaje", "Los datos enviados no tienen el formato requerido."));
  }

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<?> baseNoDisponible(DataAccessException error) {
    REGISTRO.error("Fallo de acceso al catálogo", error);
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
        "mensaje", "La base de datos no está disponible. Inténtalo de nuevo más tarde."));
  }
}
