package co.raizvolt.web;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/** Configura UTF-8 antes de leer parámetros y protege la salida HTML. */
public final class FiltroWeb implements Filter {
  @Override
  public void doFilter(ServletRequest solicitud, ServletResponse respuesta,
      FilterChain cadena) throws IOException, ServletException {
    solicitud.setCharacterEncoding("UTF-8");
    respuesta.setCharacterEncoding("UTF-8");
    HttpServletResponse http = (HttpServletResponse) respuesta;
    http.setHeader("X-Content-Type-Options", "nosniff");
    http.setHeader("Referrer-Policy", "same-origin");
    http.setHeader("Cache-Control", "no-store");
    http.setHeader("Content-Security-Policy", "default-src 'self'; "
        + "style-src 'self'; script-src 'self'; img-src 'self'; "
        + "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
    cadena.doFilter(solicitud, respuesta);
  }
}
