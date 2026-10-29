import FilaProducto from './FilaProducto.jsx';

export default function TablaProductos({ productos, onEditar, onSolicitarEliminar }) {
  return <div className="tabla-contenedor" tabIndex={0} role="region" aria-label="Productos: tabla desplazable">
    <table><caption className="solo-lector">Productos del catálogo. Los precios están expresados en pesos colombianos.</caption>
      <thead><tr>{['Producto', 'Categoría', 'Precio unitario', 'Existencias', 'Acciones'].map((titulo) =>
        <th scope="col" key={titulo}>{titulo}</th>)}</tr></thead>
      <tbody>{productos.map((producto) => <FilaProducto key={producto.id} producto={producto}
        onEditar={onEditar} onSolicitarEliminar={onSolicitarEliminar} />)}</tbody>
    </table>
  </div>;
}
