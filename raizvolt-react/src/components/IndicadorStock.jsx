export default function IndicadorStock({ existencias }) {
  const bajo = existencias < 5;
  return <span className={`stock ${bajo ? 'stock--bajo' : ''}`}>
    <strong>{existencias.toLocaleString('es-CO')}</strong>
    <span>{bajo ? 'Stock bajo' : 'Disponible'}</span>
  </span>;
}
