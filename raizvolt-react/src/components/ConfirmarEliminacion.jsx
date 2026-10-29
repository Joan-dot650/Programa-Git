import Boton from './Boton.jsx';
import { CATEGORIAS, formatearMoneda } from '../utils/productos.js';

export default function ConfirmarEliminacion({ producto, eliminando, onConfirmar, onCancelar }) {
  return <>
    <div className="titulo-vista"><div><p className="ceja">REVISA ANTES DE CONTINUAR</p>
      <h1 tabIndex={-1}>Confirmar eliminación</h1><p>Verifica que seleccionaste el producto correcto.</p></div></div>
    <section className="panel confirmacion" aria-label="Producto seleccionado">
      <span className="alerta-icono" aria-hidden="true">!</span><h2>{producto.nombre}</h2><p className="codigo">{producto.codigo}</p>
      <dl><div><dt>Categoría</dt><dd>{CATEGORIAS[producto.categoria]}</dd></div>
        <div><dt>Precio unitario</dt><dd>{formatearMoneda(producto.precio)} COP</dd></div>
        <div><dt>Existencias</dt><dd>{producto.existencias}</dd></div></dl>
      <p className="advertencia">Esta acción eliminará el producto del catálogo. No se puede deshacer.</p>
      <div className="grupo-botones"><Boton variante="secundario" disabled={eliminando} onClick={onCancelar}>Cancelar</Boton>
        <Boton variante="peligro" ocupado={eliminando} onClick={onConfirmar}>{eliminando ? 'Eliminando…' : 'Confirmar eliminación'}</Boton></div>
    </section>
  </>;
}
