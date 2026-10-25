<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="Revisar solicitud" />
<%@ include file="cabecera.jspf" %>
<section class="tarjeta confirmacion"><p class="etiqueta">SOLICITUD NO COMPLETADA</p><h1>Vamos a revisarlo</h1><p role="alert"><c:out value="${mensajeError}" default="La página no está disponible o no se pudo completar la operación. Vuelve al catálogo e inténtalo de nuevo." /></p><a class="boton primario" href="<c:out value='${catalogoUrl}' />">Volver al catálogo</a></section>
<%@ include file="pie.jspf" %>
