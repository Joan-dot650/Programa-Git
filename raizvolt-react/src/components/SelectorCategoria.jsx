import { CATEGORIAS } from '../utils/productos.js';

export default function SelectorCategoria({ valor, error, onChange }) {
  return <div className="campo"><label htmlFor="categoria">Categoría <span aria-hidden="true">*</span></label>
    <select id="categoria" name="categoria" value={valor} required onChange={onChange}
      aria-invalid={Boolean(error)} aria-describedby={`categoria-ayuda${error ? ' categoria-error' : ''}`}>
      <option value="">Selecciona una categoría</option>
      {Object.entries(CATEGORIAS).map(([codigo, nombre]) => <option value={codigo} key={codigo}>{nombre}</option>)}
    </select><small id="categoria-ayuda">Clasifica el producto dentro del catálogo solar.</small>
    {error && <p className="error-campo" id="categoria-error">{error}</p>}
  </div>;
}
