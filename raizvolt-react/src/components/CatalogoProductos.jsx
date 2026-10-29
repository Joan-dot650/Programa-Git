import Boton from './Boton.jsx';
import BuscadorProductos from './BuscadorProductos.jsx';
import ResumenInventario from './ResumenInventario.jsx';
import TablaProductos from './TablaProductos.jsx';
import EstadoListado from './EstadoListado.jsx';

export default function CatalogoProductos({ productos, valorInventario, consultaActiva,
  estadoConsulta, errorConsulta, onBuscar, onLimpiar, onNuevoProducto, onEditar, onSolicitarEliminar, onReintentar }) {
  const estado = estadoConsulta !== 'listo' ? estadoConsulta
    : productos.length ? 'listo' : consultaActiva ? 'sinResultados' : 'vacio';
  return <>
    <div className="titulo-vista"><div><p className="ceja">TU INVENTARIO SOLAR</p>
      <h1 tabIndex={-1}>Catálogo de productos</h1><p>Organiza tus soluciones solares y mantén tus existencias al día.</p></div>
      <Boton onClick={onNuevoProducto}><span aria-hidden="true">＋</span> Nuevo producto</Boton></div>
    {estadoConsulta === 'listo' && <ResumenInventario productos={productos} valorInventario={valorInventario} />}
    <section className="panel" aria-label="Consulta del catálogo">
      <div className="panel-encabezado"><div><h2>Tus productos</h2><p>Consulta, actualiza y organiza cada referencia.</p></div>
        {estadoConsulta === 'listo' && <span className="contador">{productos.length} referencias</span>}</div>
      <BuscadorProductos key={consultaActiva} consultaActiva={consultaActiva} onBuscar={onBuscar} onLimpiar={onLimpiar} />
      {consultaActiva && <p className="filtro-activo">Resultados para: <strong>{consultaActiva}</strong></p>}
      {estado === 'listo' ? <TablaProductos productos={productos} onEditar={onEditar} onSolicitarEliminar={onSolicitarEliminar} />
        : <EstadoListado estado={estado} consultaActiva={consultaActiva} mensaje={errorConsulta}
          onReintentar={onReintentar} onLimpiar={onLimpiar} onNuevoProducto={onNuevoProducto} />}
    </section>
  </>;
}
