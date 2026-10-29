/** Botón nativo común: evita envíos accidentales y expresa operaciones pendientes. */
export default function Boton({ children, tipo = 'button', variante = 'principal', ocupado = false,
  disabled = false, className = '', ...props }) {
  return <button type={tipo} className={`boton boton--${variante} ${className}`}
    disabled={disabled || ocupado} aria-busy={ocupado || undefined} {...props}>{children}</button>;
}
