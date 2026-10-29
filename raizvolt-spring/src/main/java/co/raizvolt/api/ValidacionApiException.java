package co.raizvolt.api;

import java.util.Map;

/** Transporta errores de campos sin modificar los valores enviados por el usuario. */
public final class ValidacionApiException extends RuntimeException {
  private final Map<String, String> errores;

  public ValidacionApiException(Map<String, String> errores) {
    super("Revisa los campos señalados.");
    this.errores = Map.copyOf(errores);
  }

  public Map<String, String> getErrores() {
    return errores;
  }
}
