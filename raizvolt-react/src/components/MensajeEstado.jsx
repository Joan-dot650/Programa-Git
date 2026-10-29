/** El texto y el rol transmiten el resultado sin depender únicamente del color. */
export default function MensajeEstado({ tipo = 'exito', texto }) {
  if (!texto) return null;
  return <div className={`mensaje mensaje--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
    <span aria-hidden="true">{tipo === 'error' ? '!' : '✓'}</span><span>{texto}</span>
  </div>;
}
