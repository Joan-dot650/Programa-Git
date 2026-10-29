import Boton from './Boton.jsx';

/** Navegación compartida: permanece disponible en cada pantalla. */
export default function Encabezado({ vistaActiva, ocupado, onVerCatalogo, onNuevoProducto }) {
  return <aside className="lateral">
    <header className="marca"><img src={`${import.meta.env.BASE_URL}marca.svg`} alt="" />
      <div><strong>RaízVolt</strong><span>ENERGÍA QUE CONECTA</span></div></header>
    <nav aria-label="Navegación principal">
      <p className="etiqueta-menu">ADMINISTRACIÓN</p>
      <Boton variante="nav" aria-current={vistaActiva === 'catalogo' ? 'page' : undefined}
        disabled={ocupado} onClick={onVerCatalogo}>
        <span aria-hidden="true">▦</span> Catálogo de productos</Boton>
      <Boton variante="nav" aria-current={vistaActiva === 'nuevo' ? 'page' : undefined}
        disabled={ocupado} onClick={onNuevoProducto}>
        <span aria-hidden="true">＋</span> Registrar producto</Boton>
    </nav>
    <div className="lateral-pie"><span className="punto" /> Gestión del inventario
      <p>Soluciones solares<br />para Colombia.</p></div>
  </aside>;
}
