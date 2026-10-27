package co.raizvolt.web;

import co.raizvolt.modelo.Producto;

/** DTO de entrada: conserva el texto original cuando el servidor rechaza un dato. */
public class FormularioProducto {
  private String codigo = "";
  private String nombre = "";
  private String categoria = "";
  private String precio = "";
  private String existencias = "";

  public static FormularioProducto desde(Producto producto) {
    var formulario = new FormularioProducto();
    formulario.setCodigo(producto.getCodigo());
    formulario.setNombre(producto.getNombre());
    formulario.setCategoria(producto.getCategoria().name());
    formulario.setPrecio(producto.getPrecio().toPlainString());
    formulario.setExistencias(Integer.toString(producto.getExistencias()));
    return formulario;
  }

  public String getCodigo() { return codigo; }
  public void setCodigo(String codigo) { this.codigo = codigo; }
  public String getNombre() { return nombre; }
  public void setNombre(String nombre) { this.nombre = nombre; }
  public String getCategoria() { return categoria; }
  public void setCategoria(String categoria) { this.categoria = categoria; }
  public String getPrecio() { return precio; }
  public void setPrecio(String precio) { this.precio = precio; }
  public String getExistencias() { return existencias; }
  public void setExistencias(String existencias) { this.existencias = existencias; }
}
