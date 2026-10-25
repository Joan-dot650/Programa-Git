package co.raizvolt.modelo;

import java.math.BigDecimal;

/** Objeto inmutable que representa una fila de la tabla productos. */
public final class Producto {
  private final long id;
  private final String codigo;
  private final String nombre;
  private final Categoria categoria;
  private final BigDecimal precio;
  private final int existencias;

  public Producto(long id, String codigo, String nombre, Categoria categoria,
      BigDecimal precio, int existencias) {
    this.id = id;
    this.codigo = codigo;
    this.nombre = nombre;
    this.categoria = categoria;
    this.precio = precio;
    this.existencias = existencias;
  }

  public long getId() {
    return id;
  }

  public String getCodigo() {
    return codigo;
  }

  public String getNombre() {
    return nombre;
  }

  public Categoria getCategoria() {
    return categoria;
  }

  public BigDecimal getPrecio() {
    return precio;
  }

  public int getExistencias() {
    return existencias;
  }
}
