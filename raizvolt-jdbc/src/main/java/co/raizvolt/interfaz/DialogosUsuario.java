package co.raizvolt.interfaz;

import java.awt.Component;

/** Separa los diálogos para probar las acciones sin una pantalla física. */
public interface DialogosUsuario {
  boolean confirmarEliminacion(Component padre, String codigo);
  void mostrarError(Component padre, String mensaje);
}
