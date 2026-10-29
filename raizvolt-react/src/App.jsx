import { useEffect, useRef, useState } from 'react';
import Encabezado from './components/Encabezado.jsx';
import CatalogoProductos from './components/CatalogoProductos.jsx';
import FormularioProducto from './components/FormularioProducto.jsx';
import ConfirmarEliminacion from './components/ConfirmarEliminacion.jsx';
import EstadoListado from './components/EstadoListado.jsx';
import MensajeEstado from './components/MensajeEstado.jsx';
import Boton from './components/Boton.jsx';
import { productoApi } from './services/productoApi.js';
import { leerRuta } from './utils/productos.js';

/** Raíz del módulo: coordina navegación, consultas cancelables y escrituras explícitas. */
export default function App() {
  const [ruta, setRuta] = useState(leerRuta);
  const [revision, setRevision] = useState(0);
  const [listado, setListado] = useState({ estado: 'cargando', productos: [], valorInventario: '0.00' });
  const [detalle, setDetalle] = useState({ estado: 'cargando' });
  const [mensaje, setMensaje] = useState(null);
  const [erroresServidor, setErroresServidor] = useState({});
  const [ocupado, setOcupado] = useState(false);
  const bloqueo = useRef(false);
  const guardadoConfirmado = useRef(false);
  const ultimaConsulta = useRef(ruta.consulta || '');
  const consulta = ruta.consulta || '';
  const claveDetalle = `${ruta.vista}-${ruta.id || ''}`;

  useEffect(() => {
    const alCambiar = () => { setRuta(leerRuta()); setErroresServidor({}); };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  useEffect(() => {
    if (ruta.vista !== 'catalogo') return;
    ultimaConsulta.current = consulta;
    const controlador = new AbortController();
    setListado({ estado: 'cargando', productos: [], valorInventario: '0.00' });
    productoApi.consultar(consulta, controlador.signal).then((datos) => {
      if (controlador.signal.aborted) return;
      setListado({ ...datos, estado: 'listo' });
      guardadoConfirmado.current = false;
    }).catch((error) => {
      if (controlador.signal.aborted) return;
      const aviso = guardadoConfirmado.current
        ? 'La operación ya se guardó, pero no pudimos actualizar la lista. Pulsa Reintentar para consultar los datos.'
        : error.message;
      setListado({ estado: 'error', productos: [], valorInventario: '0.00', error: aviso });
    });
    // Las respuestas anteriores no pueden reemplazar una búsqueda más reciente.
    return () => controlador.abort();
  }, [ruta.vista, consulta, revision]);

  useEffect(() => {
    if (!['editar', 'eliminar'].includes(ruta.vista)) return;
    const controlador = new AbortController();
    setDetalle({ estado: 'cargando', clave: claveDetalle });
    productoApi.buscar(ruta.id, controlador.signal).then((producto) => {
      if (!controlador.signal.aborted) setDetalle({ estado: 'listo', producto, clave: claveDetalle });
    }).catch((error) => {
      if (!controlador.signal.aborted) setDetalle({ estado: 'error', error: error.message, clave: claveDetalle });
    });
    return () => controlador.abort();
  }, [ruta.vista, ruta.id, claveDetalle, revision]);

  useEffect(() => {
    const titulos = { catalogo: 'Catálogo de productos', nuevo: 'Nuevo producto', editar: 'Editar producto', eliminar: 'Confirmar eliminación' };
    document.title = `${titulos[ruta.vista] || 'Página no encontrada'} | RaízVolt`;
    document.querySelector('main h1')?.focus();
  }, [ruta.vista, detalle.estado]);

  function navegar(destino, conservarMensaje = false) {
    if (!conservarMensaje) setMensaje(null);
    setErroresServidor({});
    window.location.hash = destino;
  }

  function verCatalogo() {
    navegar(`/productos${ultimaConsulta.current ? `?q=${encodeURIComponent(ultimaConsulta.current)}` : ''}`);
  }

  function buscar(texto) {
    navegar(`/productos${texto ? `?q=${encodeURIComponent(texto)}` : ''}`);
    // Repetir la misma búsqueda también permite actualizar sus resultados.
    if (texto === consulta) setRevision((valor) => valor + 1);
  }

  async function ejecutarEscritura(operacion, textoExito) {
    // El ref bloquea incluso dos clics antes de que React vuelva a renderizar.
    if (bloqueo.current) return;
    bloqueo.current = true;
    setOcupado(true);
    setMensaje(null);
    setErroresServidor({});
    try {
      await operacion();
      guardadoConfirmado.current = true;
      setMensaje({ tipo: 'exito', texto: textoExito });
      ultimaConsulta.current = '';
      navegar('/productos', true);
      setRevision((valor) => valor + 1);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
      setErroresServidor(error.errores || {});
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }

  const detalleActual = detalle.clave === claveDetalle ? detalle : { estado: 'cargando' };
  let contenido;
  if (ruta.vista === 'catalogo') {
    contenido = <CatalogoProductos productos={listado.productos} valorInventario={listado.valorInventario}
      estadoConsulta={listado.estado} errorConsulta={listado.error} consultaActiva={consulta}
      onBuscar={buscar} onLimpiar={() => buscar('')} onNuevoProducto={() => navegar('/productos/nuevo')}
      onEditar={(id) => navegar(`/productos/${id}/editar`)} onSolicitarEliminar={(id) => navegar(`/productos/${id}/eliminar`)}
      onReintentar={() => setRevision((valor) => valor + 1)} />;
  } else if (ruta.vista === 'nuevo' || (ruta.vista === 'editar' && detalleActual.estado === 'listo')) {
    contenido = <FormularioProducto key={claveDetalle} modo={ruta.vista} productoInicial={ruta.vista === 'editar' ? detalleActual.producto : null}
      guardando={ocupado} erroresServidor={erroresServidor} onCancelar={verCatalogo}
      onLimpiarError={(campo) => setErroresServidor((anteriores) => { const siguientes = { ...anteriores }; delete siguientes[campo]; return siguientes; })}
      onGuardar={(producto) => ejecutarEscritura(() => ruta.vista === 'nuevo' ? productoApi.registrar(producto)
        : productoApi.actualizar(ruta.id, producto), ruta.vista === 'nuevo' ? 'Producto registrado correctamente.' : 'Producto actualizado correctamente.')} />;
  } else if (ruta.vista === 'eliminar' && detalleActual.estado === 'listo') {
    contenido = <ConfirmarEliminacion producto={detalleActual.producto} eliminando={ocupado}
      onCancelar={verCatalogo} onConfirmar={() => ejecutarEscritura(() => productoApi.eliminar(ruta.id), 'Producto eliminado correctamente.')} />;
  } else if (ruta.vista === 'desconocida') {
    contenido = <section className="panel estado-listado"><h1 tabIndex={-1}>Página no encontrada</h1>
      <p>La dirección no corresponde a una pantalla del catálogo.</p><Boton onClick={verCatalogo}>Volver al catálogo</Boton></section>;
  } else {
    contenido = <><h1 tabIndex={-1}>{ruta.vista === 'editar' ? 'Editar producto' : 'Confirmar eliminación'}</h1>
      <section className="panel"><EstadoListado estado={detalleActual.estado} mensaje={detalleActual.error}
        onReintentar={() => setRevision((valor) => valor + 1)} /></section>
      <Boton variante="texto" onClick={verCatalogo}>Volver al catálogo</Boton></>;
  }

  return <>
    <a className="saltar" href="#contenido" onClick={(evento) => { evento.preventDefault(); document.getElementById('contenido').focus(); }}>Saltar al contenido</a>
    <Encabezado vistaActiva={ruta.vista} ocupado={ocupado} onVerCatalogo={verCatalogo} onNuevoProducto={() => navegar('/productos/nuevo')} />
    <div className="area-principal"><div className="barra-superior"><p>RaízVolt <span>/</span> Gestión de productos</p>
      <span className="sello">Energía solar · Colombia</span></div>
      <main id="contenido" tabIndex={-1} aria-busy={ocupado}>
        {mensaje && <MensajeEstado {...mensaje} />}{contenido}
      </main><footer className="pie-pagina">RaízVolt <span>Catálogo de soluciones solares</span></footer>
    </div>
  </>;
}
