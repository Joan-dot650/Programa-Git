package co.raizvolt.dao;

/** Error del acceso a datos con un mensaje seguro para la interfaz. */
public final class ErrorPersistencia extends RuntimeException {
  private static final long serialVersionUID = 1L;

  public ErrorPersistencia(String mensaje, Throwable causa) {
    super(mensaje, causa);
  }
}
