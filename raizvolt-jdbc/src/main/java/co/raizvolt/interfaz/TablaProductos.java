package co.raizvolt.interfaz;

import co.raizvolt.modelo.Producto;
import java.math.BigDecimal;
import java.util.List;
import javax.swing.table.AbstractTableModel;

/** Modelo de tabla no editable: los cambios pasan por el formulario. */
public final class TablaProductos extends AbstractTableModel {
  private static final long serialVersionUID = 1L;
  private static final String[] COLUMNAS = {
      "ID", "Código", "Nombre", "Categoría", "Precio (COP)", "Stock"};
  private List<Producto> productos = List.of();

  public void establecerProductos(List<Producto> nuevosProductos) {
    productos = List.copyOf(nuevosProductos);
    fireTableDataChanged();
  }

  public Producto obtenerProducto(int fila) {
    return productos.get(fila);
  }

  @Override
  public int getRowCount() {
    return productos.size();
  }

  @Override
  public int getColumnCount() {
    return COLUMNAS.length;
  }

  @Override
  public String getColumnName(int columna) {
    return COLUMNAS[columna];
  }

  @Override
  public Class<?> getColumnClass(int columna) {
    return switch (columna) {
      case 0 -> Long.class;
      case 4 -> BigDecimal.class;
      case 5 -> Integer.class;
      default -> String.class;
    };
  }

  @Override
  public Object getValueAt(int fila, int columna) {
    Producto producto = productos.get(fila);
    return switch (columna) {
      case 0 -> producto.getId();
      case 1 -> producto.getCodigo();
      case 2 -> producto.getNombre();
      case 3 -> producto.getCategoria().toString();
      case 4 -> producto.getPrecio();
      case 5 -> producto.getExistencias();
      default -> throw new IndexOutOfBoundsException("Columna no válida.");
    };
  }
}
