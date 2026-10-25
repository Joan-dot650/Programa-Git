package co.raizvolt.interfaz;

import java.awt.Component;
import javax.swing.JOptionPane;

/** Diálogos reales utilizados al ejecutar la aplicación de escritorio. */
public final class DialogosSwing implements DialogosUsuario {
  @Override
  public boolean confirmarEliminacion(Component padre, String codigo) {
    Object[] opciones = {"Eliminar", "Cancelar"};
    return JOptionPane.showOptionDialog(padre,
        "Se eliminará " + codigo + ". Esta acción no se puede deshacer.",
        "Confirmar eliminación", JOptionPane.YES_NO_OPTION,
        JOptionPane.WARNING_MESSAGE, null, opciones, opciones[1]) == 0;
  }

  @Override
  public void mostrarError(Component padre, String mensaje) {
    JOptionPane.showMessageDialog(
        padre, mensaje, "Revisa los datos", JOptionPane.WARNING_MESSAGE);
  }
}
