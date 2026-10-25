<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="Eliminar producto" />
<%@ include file="cabecera.jspf" %>
<a class="volver" href="<c:out value='${catalogoUrl}' />">← Volver al catálogo</a>
<section class="tarjeta confirmacion"><p class="etiqueta">CONFIRMACIÓN</p><h1>¿Eliminar este producto?</h1><p>Se retirará del catálogo. Esta acción no se puede deshacer desde la aplicación.</p><div class="producto-confirmacion"><strong><c:out value="${producto.nombre}" /></strong><span><c:out value="${producto.codigo}" /> · <c:out value="${producto.categoria}" /></span><span>COP <fmt:formatNumber value="${producto.precio}" minFractionDigits="2" maxFractionDigits="2" /> · <c:out value="${producto.existencias}" /> unidades</span></div>
<form method="post" action="<c:out value='${catalogoUrl}' />"><input type="hidden" name="accion" value="eliminar"><input type="hidden" name="id" value="<c:out value='${producto.id}' />"><input type="hidden" name="csrf" value="<c:out value='${sessionScope.csrf}' />"><div class="acciones-formulario"><a class="boton secundario" href="<c:out value='${catalogoUrl}' />">Cancelar</a><button type="submit" class="boton peligro">Sí, eliminar producto</button></div></form></section>
<%@ include file="pie.jspf" %>
