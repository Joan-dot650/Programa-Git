package co.raizvolt.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Presenta errores de base de datos sin exponer SQL o detalles internos al usuario. */
@ControllerAdvice
public class ManejadorErrores {
  private static final Logger REGISTRO = LoggerFactory.getLogger(ManejadorErrores.class);

  @ExceptionHandler(DataAccessException.class)
  @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
  public String errorDatos(DataAccessException error, Model modelo) {
    REGISTRO.error("Fallo de acceso al catálogo", error);
    modelo.addAttribute("status", 503);
    return "error";
  }
}
