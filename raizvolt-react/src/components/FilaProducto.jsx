import Boton from './Boton.jsx';
import IndicadorStock from './IndicadorStock.jsx';
import { CATEGORIAS, formatearMoneda } from '../utils/productos.js';

/** React escapa nombre y código al mostrarlos; nunca se inserta HTML del usuario. */
export default function FilaProducto({ producto, onEditar, onSolicitarEliminar }) {
  return <tr>
    <th scope="row"><strong>{producto.nombre}</strong><span className="codigo">{producto.codigo}</span></th>
    <td><span className="categoria">{CATEGORIAS[producto.categoria]}</span></td>
    <td className="precio">{formatearMoneda(producto.precio)}</td>
    <td><IndicadorStock existencias={producto.existencias} /></td>
    <td><div className="acciones-fila">
      <Boton variante="texto" aria-label={`Editar ${producto.codigo}`} onClick={() => onEditar(producto.id)}>Editar</Boton>
      <Boton variante="peligro-texto" aria-label={`Eliminar ${producto.codigo}`}
        onClick={() => onSolicitarEliminar(producto.id)}>Eliminar</Boton>
    </div></td>
  </tr>;
}
