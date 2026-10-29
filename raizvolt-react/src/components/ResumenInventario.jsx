import { formatearMoneda } from '../utils/productos.js';

/** Los conteos se derivan; el importe exacto lo calcula el servidor con BigDecimal. */
export default function ResumenInventario({ productos, valorInventario }) {
  const resumen = [
    ['Referencias', productos.length, 'En la lista actual'],
    ['Unidades disponibles', productos.reduce((suma, producto) => suma + producto.existencias, 0), 'Existencias de la lista'],
    ['Stock bajo', productos.filter((producto) => producto.existencias < 5).length, 'Menos de 5 unidades'],
  ];
  return <section aria-label="Resumen del inventario" className="resumen">
    <div className="indicadores">{resumen.map(([titulo, valor, detalle]) =>
      <article className="indicador" key={titulo}><h2>{titulo}</h2>
        <strong>{valor.toLocaleString('es-CO')}</strong><p>{detalle}</p></article>)}</div>
    <p className="valor-inventario">Valor de las existencias mostradas <strong>{formatearMoneda(valorInventario)} COP</strong></p>
  </section>;
}
