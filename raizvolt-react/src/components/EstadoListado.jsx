import Boton from './Boton.jsx';

export default function EstadoListado({ estado, consultaActiva = '', mensaje,
  onReintentar, onLimpiar, onNuevoProducto }) {
  const titulos = { cargando: 'Consultando el catálogo…', error: 'No pudimos cargar los productos',
    vacio: 'Tu catálogo empieza aquí', sinResultados: 'No encontramos coincidencias' };
  return <div className={`estado-listado estado-listado--${estado}`} role={estado === 'error' ? 'alert' : 'status'}>
    <span className="estado-icono" aria-hidden="true">{estado === 'error' ? '!' : '▦'}</span>
    <h2>{titulos[estado]}</h2>
    <p>{estado === 'error' ? mensaje : estado === 'vacio' ? 'Registra tu primer producto solar para organizar sus existencias.'
      : estado === 'sinResultados' ? `No hay productos para «${consultaActiva}». Prueba otro nombre o código.`
        : 'Estamos recuperando la información guardada.'}</p>
    {estado === 'error' && <Boton variante="secundario" onClick={onReintentar}>Reintentar</Boton>}
    {estado === 'vacio' && <Boton onClick={onNuevoProducto}>Registrar primer producto</Boton>}
    {estado === 'sinResultados' && <Boton variante="secundario" onClick={onLimpiar}>Ver todos los productos</Boton>}
  </div>;
}
