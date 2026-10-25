package co.raizvolt.interfaz;

import co.raizvolt.modelo.Categoria;
import co.raizvolt.modelo.Producto;
import co.raizvolt.servicio.ProductoServicio;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.function.Consumer;
import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.SwingConstants;
import javax.swing.SwingWorker;
import javax.swing.table.DefaultTableCellRenderer;

/** Interfaz Swing. Las consultas se ejecutan fuera del hilo de dibujo. */
public final class PanelProductos extends JPanel {
  private static final long serialVersionUID = 1L;
  private static final Color VERDE = new Color(27, 105, 67);
  private static final Color OSCURO = new Color(20, 59, 42);
  private static final Color FONDO = new Color(241, 246, 243);
  private static final Color BORDE = new Color(218, 229, 222);
  private final ProductoServicio servicio;
  private final DialogosUsuario dialogos;
  private final JTextField codigo = campo("codigo");
  private final JTextField nombre = campo("nombre");
  private final JComboBox<Categoria> categoria =
      new JComboBox<>(Categoria.values());
  private final JTextField precio = campo("precio");
  private final JTextField existencias = campo("existencias");
  private final JTextField busqueda = campo("busqueda");
  private final JLabel tituloFormulario = new JLabel("Nuevo producto");
  private final JLabel estado = new JLabel("Conectando con el catálogo...");
  private final JLabel resultados = new JLabel("0 productos");
  private final TablaProductos modeloTabla = new TablaProductos();
  private final JTable tabla = new JTable(modeloTabla);
  private final JButton registrar = boton("Registrar", "registrar");
  private final JButton actualizar = boton("Actualizar", "actualizar");
  private final JButton eliminar = boton("Eliminar", "eliminar");
  private final JButton nuevo = boton("Nuevo / limpiar", "nuevo");
  private final JButton buscar = boton("Buscar", "buscar");
  private final JButton mostrarTodos = boton("Mostrar todo", "mostrarTodos");
  private long idSeleccionado;
  private boolean ocupado;

  public PanelProductos(ProductoServicio servicio, String motor) {
    this(servicio, motor, new DialogosSwing());
  }

  public PanelProductos(ProductoServicio servicio, String motor,
      DialogosUsuario dialogos) {
    super(new BorderLayout());
    this.servicio = servicio;
    this.dialogos = dialogos;
    setPreferredSize(new Dimension(1180, 710));
    JPanel principal = new JPanel(new BorderLayout(0, 18));
    principal.setBackground(FONDO);
    principal.add(crearCabecera(motor), BorderLayout.NORTH);
    JPanel centro = new JPanel(new BorderLayout(18, 0));
    centro.setOpaque(false);
    centro.setBorder(BorderFactory.createEmptyBorder(0, 22, 0, 22));
    centro.add(crearFormulario(), BorderLayout.WEST);
    centro.add(crearCatalogo(), BorderLayout.CENTER);
    principal.add(centro, BorderLayout.CENTER);
    estado.setName("estado");
    estado.setBorder(BorderFactory.createEmptyBorder(0, 24, 18, 24));
    principal.add(estado, BorderLayout.SOUTH);
    add(principal, BorderLayout.CENTER);
    conectarEventos();
    limpiarFormulario();
    cargarProductos("");
  }

  private JPanel crearCabecera(String motor) {
    JPanel cabecera = new JPanel(new BorderLayout(24, 0));
    cabecera.setBackground(OSCURO);
    cabecera.setBorder(BorderFactory.createEmptyBorder(22, 26, 22, 26));
    JPanel marca = new JPanel(new GridLayout(2, 1, 0, 4));
    marca.setOpaque(false);
    JLabel titulo = new JLabel("RAÍZVOLT");
    titulo.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 28));
    titulo.setForeground(Color.WHITE);
    JLabel subtitulo = new JLabel("Energía solar · Gestión de productos");
    subtitulo.setForeground(new Color(208, 232, 216));
    marca.add(titulo);
    marca.add(subtitulo);
    JLabel conexion = new JLabel("JDBC  /  " + motor);
    conexion.setForeground(Color.WHITE);
    cabecera.add(marca, BorderLayout.WEST);
    cabecera.add(conexion, BorderLayout.EAST);
    return cabecera;
  }

  private JPanel crearFormulario() {
    JPanel formulario = tarjeta();
    formulario.setPreferredSize(new Dimension(310, 530));
    formulario.setLayout(new BoxLayout(formulario, BoxLayout.Y_AXIS));
    tituloFormulario.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 19));
    tituloFormulario.setForeground(OSCURO);
    tituloFormulario.setAlignmentX(LEFT_ALIGNMENT);
    formulario.add(tituloFormulario);
    formulario.add(Box.createVerticalStrut(16));
    agregarCampo(formulario, "Código", codigo);
    agregarCampo(formulario, "Nombre del producto", nombre);
    categoria.setName("categoria");
    agregarCampo(formulario, "Categoría", categoria);
    agregarCampo(formulario, "Precio unitario (COP)", precio);
    agregarCampo(formulario, "Existencias (unidades)", existencias);
    JLabel ayuda = new JLabel("Precio sin puntos de miles: 680000.50");
    ayuda.setFont(ayuda.getFont().deriveFont(12f));
    ayuda.setAlignmentX(LEFT_ALIGNMENT);
    formulario.add(ayuda);
    formulario.add(Box.createVerticalStrut(18));
    JPanel acciones = new JPanel(new GridLayout(2, 2, 8, 8));
    acciones.setOpaque(false);
    acciones.setAlignmentX(LEFT_ALIGNMENT);
    acciones.setMaximumSize(new Dimension(Integer.MAX_VALUE, 86));
    acciones.add(registrar);
    acciones.add(actualizar);
    acciones.add(nuevo);
    acciones.add(eliminar);
    registrar.setBackground(VERDE);
    registrar.setForeground(Color.WHITE);
    eliminar.setForeground(new Color(158, 43, 43));
    formulario.add(acciones);
    formulario.add(Box.createVerticalGlue());
    return formulario;
  }

  private JPanel crearCatalogo() {
    JPanel catalogo = tarjeta();
    catalogo.setLayout(new BorderLayout(0, 16));
    JPanel superior = new JPanel(new BorderLayout(0, 14));
    superior.setOpaque(false);
    JPanel titulos = new JPanel(new BorderLayout());
    titulos.setOpaque(false);
    JLabel titulo = new JLabel("Catálogo de productos");
    titulo.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 21));
    titulo.setForeground(OSCURO);
    resultados.setName("resultados");
    titulos.add(titulo, BorderLayout.WEST);
    titulos.add(resultados, BorderLayout.EAST);
    superior.add(titulos, BorderLayout.NORTH);
    JPanel filtro = new JPanel(new BorderLayout(8, 0));
    filtro.setOpaque(false);
    busqueda.setToolTipText("Buscar por código o nombre. Vacío muestra todo.");
    busqueda.getAccessibleContext().setAccessibleName("Buscar por código o nombre");
    JPanel botones = new JPanel(new GridLayout(1, 2, 8, 0));
    botones.setOpaque(false);
    botones.add(buscar);
    botones.add(mostrarTodos);
    filtro.add(busqueda, BorderLayout.CENTER);
    filtro.add(botones, BorderLayout.EAST);
    superior.add(filtro, BorderLayout.CENTER);
    catalogo.add(superior, BorderLayout.NORTH);
    tabla.setName("tablaProductos");
    tabla.setRowHeight(40);
    tabla.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
    tabla.setAutoCreateRowSorter(true);
    tabla.setFillsViewportHeight(true);
    tabla.setGridColor(BORDE);
    tabla.setShowVerticalLines(false);
    tabla.setSelectionBackground(new Color(218, 239, 225));
    tabla.setSelectionForeground(OSCURO);
    tabla.getTableHeader().setReorderingAllowed(false);
    tabla.getTableHeader().setPreferredSize(new Dimension(0, 38));
    int[] anchos = {40, 105, 215, 95, 125, 50};
    for (int indice = 0; indice < anchos.length; indice++) {
      tabla.getColumnModel().getColumn(indice).setPreferredWidth(anchos[indice]);
    }
    NumberFormat moneda = NumberFormat.getCurrencyInstance(
        Locale.forLanguageTag("es-CO"));
    tabla.setDefaultRenderer(BigDecimal.class, new DefaultTableCellRenderer() {
      private static final long serialVersionUID = 1L;

      @Override
      protected void setValue(Object valor) {
        setHorizontalAlignment(SwingConstants.RIGHT);
        setText(moneda.format(valor));
      }
    });
    JScrollPane desplazamiento = new JScrollPane(tabla);
    desplazamiento.setColumnHeaderView(tabla.getTableHeader());
    catalogo.add(desplazamiento, BorderLayout.CENTER);
    JLabel ayuda = new JLabel(
        "Selecciona una fila para editar o eliminar. Usa Nuevo para registrar.");
    ayuda.setFont(ayuda.getFont().deriveFont(12f));
    catalogo.add(ayuda, BorderLayout.SOUTH);
    return catalogo;
  }

  private void conectarEventos() {
    registrar.addActionListener(evento -> guardarProducto(false));
    actualizar.addActionListener(evento -> guardarProducto(true));
    nuevo.addActionListener(evento -> {
      limpiarFormulario();
      informar("Completa los campos y pulsa Registrar.", false);
      codigo.requestFocusInWindow();
    });
    buscar.addActionListener(evento -> cargarProductos(busqueda.getText()));
    busqueda.addActionListener(evento -> cargarProductos(busqueda.getText()));
    mostrarTodos.addActionListener(evento -> {
      busqueda.setText("");
      cargarProductos("");
    });
    eliminar.addActionListener(evento -> eliminarSeleccionado());
    tabla.getSelectionModel().addListSelectionListener(evento -> {
      if (!evento.getValueIsAdjusting() && tabla.getSelectedRow() >= 0) {
        int fila = tabla.convertRowIndexToModel(tabla.getSelectedRow());
        mostrarProducto(modeloTabla.obtenerProducto(fila));
      }
    });
  }

  private void guardarProducto(boolean esActualizacion) {
    long id = idSeleccionado;
    String codigoTexto = codigo.getText();
    String nombreTexto = nombre.getText();
    Categoria categoriaElegida = (Categoria) categoria.getSelectedItem();
    String precioTexto = precio.getText();
    String existenciasTexto = existencias.getText();
    ejecutarTarea("Guardando producto...", () -> {
      if (esActualizacion) {
        servicio.actualizarProducto(id, codigoTexto, nombreTexto,
            categoriaElegida, precioTexto, existenciasTexto);
      } else {
        servicio.registrarProducto(codigoTexto, nombreTexto,
            categoriaElegida, precioTexto, existenciasTexto);
      }
      return servicio.consultarProductos("");
    }, productos -> {
      reemplazarLista(productos);
      busqueda.setText("");
      informar(esActualizacion
          ? "Producto actualizado correctamente."
          : "Producto registrado correctamente.", false);
    });
  }

  private void eliminarSeleccionado() {
    if (idSeleccionado <= 0 || ocupado) {
      return;
    }
    long id = idSeleccionado;
    if (!dialogos.confirmarEliminacion(this, codigo.getText())) {
      informar("Eliminación cancelada. El producto se conserva.", false);
      return;
    }
    ejecutarTarea("Eliminando producto...", () -> {
      servicio.eliminarProducto(id);
      return servicio.consultarProductos("");
    }, productos -> {
      reemplazarLista(productos);
      busqueda.setText("");
      informar("Producto eliminado correctamente.", false);
    });
  }

  private void cargarProductos(String texto) {
    ejecutarTarea("Consultando productos...",
        () -> servicio.consultarProductos(texto), productos -> {
          reemplazarLista(productos);
          informar(productos.isEmpty()
              ? "No hay resultados. Puedes registrar un producto o cambiar la búsqueda."
              : "Consulta completada. Selecciona una fila para editar.", false);
        });
  }

  private void reemplazarLista(List<Producto> productos) {
    limpiarFormulario();
    modeloTabla.establecerProductos(productos);
    resultados.setText(productos.size() + " productos");
  }

  private void mostrarProducto(Producto producto) {
    idSeleccionado = producto.getId();
    tituloFormulario.setText("Editar producto #" + idSeleccionado);
    codigo.setText(producto.getCodigo());
    nombre.setText(producto.getNombre());
    categoria.setSelectedItem(producto.getCategoria());
    precio.setText(producto.getPrecio().toPlainString());
    existencias.setText(Integer.toString(producto.getExistencias()));
    habilitarControles();
  }

  private void limpiarFormulario() {
    tabla.clearSelection();
    idSeleccionado = 0;
    tituloFormulario.setText("Nuevo producto");
    codigo.setText("");
    nombre.setText("");
    categoria.setSelectedIndex(0);
    precio.setText("");
    existencias.setText("");
    habilitarControles();
  }

  private <T> void ejecutarTarea(String mensaje, Callable<T> tarea,
      Consumer<T> alCompletar) {
    if (ocupado) {
      return;
    }
    ocupado = true;
    habilitarControles();
    informar(mensaje, false);
    new SwingWorker<T, Void>() {
      @Override
      protected T doInBackground() throws Exception {
        return tarea.call();
      }

      @Override
      protected void done() {
        try {
          alCompletar.accept(get());
        } catch (InterruptedException error) {
          Thread.currentThread().interrupt();
          mostrarError("La operación se interrumpió.");
        } catch (ExecutionException error) {
          Throwable causa = error.getCause();
          mostrarError(causa.getMessage() == null
              ? "No se pudo completar la operación." : causa.getMessage());
        } finally {
          ocupado = false;
          habilitarControles();
        }
      }
    }.execute();
  }

  private void habilitarControles() {
    for (JComponent componente : List.of(codigo, nombre, categoria, precio,
        existencias, busqueda, buscar, mostrarTodos, nuevo, tabla)) {
      componente.setEnabled(!ocupado);
    }
    registrar.setEnabled(!ocupado && idSeleccionado == 0);
    actualizar.setEnabled(!ocupado && idSeleccionado > 0);
    eliminar.setEnabled(!ocupado && idSeleccionado > 0);
  }

  private void informar(String mensaje, boolean esError) {
    estado.setText(mensaje);
    estado.setForeground(esError ? new Color(158, 43, 43) : OSCURO);
  }

  private void mostrarError(String mensaje) {
    informar(mensaje, true);
    dialogos.mostrarError(this, mensaje);
  }

  private static JPanel tarjeta() {
    JPanel panel = new JPanel();
    panel.setBackground(Color.WHITE);
    panel.setBorder(BorderFactory.createCompoundBorder(
        BorderFactory.createLineBorder(BORDE),
        BorderFactory.createEmptyBorder(20, 18, 20, 18)));
    return panel;
  }

  private static JTextField campo(String identificador) {
    JTextField campo = new JTextField();
    campo.setName(identificador);
    return campo;
  }

  private static JButton boton(String texto, String identificador) {
    JButton boton = new JButton(texto);
    boton.setName(identificador);
    boton.setFocusPainted(true);
    boton.setMargin(new java.awt.Insets(8, 10, 8, 10));
    return boton;
  }

  private void agregarCampo(JPanel panel, String texto, JComponent campo) {
    JLabel etiqueta = new JLabel(texto);
    etiqueta.setLabelFor(campo);
    etiqueta.setAlignmentX(LEFT_ALIGNMENT);
    campo.getAccessibleContext().setAccessibleName(texto);
    campo.setAlignmentX(LEFT_ALIGNMENT);
    campo.setMaximumSize(new Dimension(Integer.MAX_VALUE, 34));
    campo.setPreferredSize(new Dimension(270, 34));
    panel.add(etiqueta);
    panel.add(Box.createVerticalStrut(5));
    panel.add(campo);
    panel.add(Box.createVerticalStrut(12));
  }
}
