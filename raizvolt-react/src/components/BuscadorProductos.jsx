import { useState } from 'react';
import Boton from './Boton.jsx';

export default function BuscadorProductos({ consultaActiva, onBuscar, onLimpiar }) {
  const [texto, setTexto] = useState(consultaActiva);
  function enviar(evento) {
    evento.preventDefault();
    onBuscar(texto.trim());
  }
  return <form className="buscador" role="search" onSubmit={enviar}>
    <div className="buscador-campo"><label htmlFor="busqueda">Buscar por nombre o código</label>
      <input id="busqueda" name="q" type="search" maxLength={120} value={texto}
        placeholder="Ejemplo: panel solar o SOL-550" onChange={(evento) => setTexto(evento.target.value)} />
    </div>
    <Boton tipo="submit" variante="secundario">Buscar</Boton>
    {(consultaActiva || texto) && <Boton variante="texto" onClick={() => { setTexto(''); onLimpiar(); }}>Limpiar</Boton>}
  </form>;
}
