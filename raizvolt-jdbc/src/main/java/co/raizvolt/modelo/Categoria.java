package co.raizvolt.modelo;

/** Categorías del catálogo de soluciones solares. */
public enum Categoria {
  PANEL_SOLAR("Panel solar"),
  INVERSOR("Inversor"),
  BATERIA("Batería"),
  KIT_SOLAR("Kit solar"),
  ACCESORIO("Accesorio");

  private final String descripcion;

  Categoria(String descripcion) {
    this.descripcion = descripcion;
  }

  @Override
  public String toString() {
    return descripcion;
  }
}
