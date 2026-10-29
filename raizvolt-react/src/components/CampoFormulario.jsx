export default function CampoFormulario({ nombre, etiqueta, valor, ayuda, error, onChange, ...atributos }) {
  return <div className={`campo ${nombre === 'nombre' ? 'campo--ancho' : ''}`}>
    <label htmlFor={nombre}>{etiqueta} <span aria-hidden="true">*</span></label>
    <input id={nombre} name={nombre} value={valor} onChange={onChange} required
      aria-invalid={Boolean(error)} aria-describedby={`${nombre}-ayuda${error ? ` ${nombre}-error` : ''}`} {...atributos} />
    <small id={`${nombre}-ayuda`}>{ayuda}</small>
    {error && <p className="error-campo" id={`${nombre}-error`}>{error}</p>}
  </div>;
}
