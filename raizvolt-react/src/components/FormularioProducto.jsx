import { useEffect, useRef, useState } from 'react';
import CampoFormulario from './CampoFormulario.jsx';
import SelectorCategoria from './SelectorCategoria.jsx';
import Boton from './Boton.jsx';
import { FORMULARIO_VACIO, normalizarProducto, validarProducto } from '../utils/productos.js';

export default function FormularioProducto({ modo, productoInicial, guardando, erroresServidor,
  onLimpiarError, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(() => productoInicial ? {
    codigo: productoInicial.codigo, nombre: productoInicial.nombre, categoria: productoInicial.categoria,
    precio: productoInicial.precio, existencias: String(productoInicial.existencias),
  } : { ...FORMULARIO_VACIO });
  const [errores, setErrores] = useState({});
  const formulario = useRef(null);
  const erroresVisibles = { ...errores, ...erroresServidor };

  function enfocarPrimero() {
    requestAnimationFrame(() => formulario.current?.querySelector('[aria-invalid="true"]')?.focus());
  }
  useEffect(() => { if (Object.keys(erroresServidor).length) enfocarPrimero(); }, [erroresServidor]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setValores((actuales) => ({ ...actuales, [name]: value }));
    setErrores((actuales) => ({ ...actuales, [name]: undefined }));
    onLimpiarError(name);
  }

  function enviar(evento) {
    evento.preventDefault();
    if (guardando) return;
    const encontrados = validarProducto(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length) { enfocarPrimero(); return; }
    onGuardar(normalizarProducto(valores));
  }

  return <>
    <div className="titulo-vista"><div><p className="ceja">{modo === 'editar' ? 'ACTUALIZA TU INVENTARIO' : 'AMPLÍA TU CATÁLOGO'}</p>
      <h1 tabIndex={-1}>{modo === 'editar' ? 'Editar producto' : 'Nuevo producto'}</h1>
      <p>{modo === 'editar' ? 'Ajusta la información de esta referencia.' : 'Añade una solución solar a tu inventario.'}</p></div></div>
    <form className="panel panel-formulario" ref={formulario} onSubmit={enviar} noValidate>
      <div className="panel-encabezado"><div><h2>Información del producto</h2><p>Todos los campos marcados con * son obligatorios.</p></div>
        {productoInicial && <span className="contador">ID {productoInicial.id}</span>}</div>
      <fieldset disabled={guardando} className="campos"><legend className="solo-lector">Datos del producto</legend>
        <CampoFormulario nombre="codigo" etiqueta="Código" valor={valores.codigo} error={erroresVisibles.codigo}
          onChange={cambiar} maxLength={30} ayuda="De 3 a 30 letras, números o guiones. Se guarda en mayúsculas." placeholder="SOL-550" autoComplete="off" />
        <SelectorCategoria valor={valores.categoria} error={erroresVisibles.categoria} onChange={cambiar} />
        <CampoFormulario nombre="nombre" etiqueta="Nombre del producto" valor={valores.nombre} error={erroresVisibles.nombre}
          onChange={cambiar} maxLength={120} ayuda="De 3 a 120 caracteres. Puedes usar tildes y ñ." placeholder="Panel solar monocristalino 550 W" autoComplete="off" />
        <CampoFormulario nombre="precio" etiqueta="Precio unitario (COP)" valor={valores.precio} error={erroresVisibles.precio}
          onChange={cambiar} inputMode="decimal" ayuda="Sin separadores de miles. Ejemplo: 680000,50. Máximo 9999999999.99." placeholder="680000,50" />
        <CampoFormulario nombre="existencias" etiqueta="Existencias" valor={valores.existencias} error={erroresVisibles.existencias}
          onChange={cambiar} inputMode="numeric" ayuda="Número entero entre 0 y 1000000. Menos de 5 activa stock bajo." placeholder="12" />
      </fieldset>
      {Object.values(errores).some(Boolean) && <p className="resumen-errores" role="alert">Revisa los campos señalados antes de guardar.</p>}
      <div className="formulario-pie"><p>Los cambios se guardan al confirmar.</p><div className="grupo-botones">
        <Boton variante="secundario" disabled={guardando} onClick={onCancelar}>Cancelar</Boton>
        <Boton tipo="submit" ocupado={guardando}>{guardando ? 'Guardando…' : modo === 'editar' ? 'Guardar cambios' : 'Guardar producto'}</Boton>
      </div></div>
    </form>
  </>;
}
