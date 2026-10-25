<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="Productos" />
<%@ include file="cabecera.jspf" %>
<section class="encabezado"><div><p class="etiqueta">TU NEGOCIO, CON MÁS ENERGÍA</p><h1>Productos</h1><p class="subtitulo">Todo tu catálogo solar, en un solo lugar.</p></div><a class="boton primario" href="<c:out value='${nuevoUrl}' />"><span aria-hidden="true">+</span> Nuevo producto</a></section>
<c:if test="${not empty mensaje}"><div class="aviso exito" role="status"><span aria-hidden="true">✓</span> <c:out value="${mensaje}" /></div></c:if>
<div class="metricas" aria-label="Resumen de los productos mostrados">
  <section class="metrica"><span>Productos en esta vista</span><strong><c:out value="${cantidad}" /></strong><small>Referencias de tu catálogo</small></section>
  <section class="metrica"><span>Unidades disponibles</span><strong><fmt:formatNumber value="${unidades}" /></strong><small>Existencias en esta vista</small></section>
  <section class="metrica"><span>Stock por revisar</span><strong><c:out value="${stockBajo}" /></strong><small>Productos con 5 unidades o menos</small></section>
</div>
<section class="tarjeta catalogo" aria-labelledby="titulo-catalogo">
  <div class="titulo-tarjeta"><div><h2 id="titulo-catalogo">Catálogo solar</h2><p>Consulta y administra tus productos.</p></div><span class="contador"><c:out value="${cantidad}" /> resultados</span></div>
  <form class="busqueda" method="get" action="<c:out value='${catalogoUrl}' />" role="search">
    <input type="hidden" name="accion" value="buscar">
    <div class="campo-busqueda"><label class="solo-lectores" for="q">Buscar por nombre o código</label><input type="search" id="q" name="q" maxlength="120" placeholder="Buscar por nombre o código…" value="<c:out value='${consulta}' />"></div>
    <button class="boton secundario" type="submit">Buscar</button>
    <c:if test="${not empty consulta}"><a class="enlace" href="<c:out value='${catalogoUrl}' />">Ver todos</a></c:if>
  </form>
  <c:choose><c:when test="${empty productos}">
    <div class="vacio"><div class="vacio-icono" aria-hidden="true">☀</div>
      <c:choose><c:when test="${empty consulta}"><h3>Tu catálogo empieza aquí</h3><p>Registra tu primer panel, inversor, batería o kit solar.</p><a class="boton primario" href="<c:out value='${nuevoUrl}' />">Agregar primer producto</a></c:when>
      <c:otherwise><h3>No encontramos coincidencias</h3><p>Prueba con otro nombre o código de producto.</p><a class="boton secundario" href="<c:out value='${catalogoUrl}' />">Mostrar catálogo completo</a></c:otherwise></c:choose>
    </div>
  </c:when><c:otherwise>
    <p class="ayuda-tabla">Desliza la tabla para ver precios y acciones →</p>
    <div class="tabla-contenedor" tabindex="0" role="region" aria-label="Productos. Desplázate horizontalmente para ver todas las columnas.">
    <table><caption class="solo-lectores">Productos de RaízVolt</caption><thead><tr><th scope="col">Producto</th><th scope="col">Categoría</th><th scope="col" class="numero">Precio (COP)</th><th scope="col" class="numero">Existencias</th><th scope="col" class="acciones-titulo">Acciones</th></tr></thead><tbody>
    <c:forEach var="producto" items="${productos}">
      <c:url var="editarUrl" value="/productos"><c:param name="accion" value="editar" /><c:param name="id" value="${producto.id}" /></c:url>
      <c:url var="eliminarUrl" value="/productos"><c:param name="accion" value="confirmar" /><c:param name="id" value="${producto.id}" /></c:url>
      <tr><td><strong class="nombre-producto"><c:out value="${producto.nombre}" /></strong><span class="codigo-producto"><c:out value="${producto.codigo}" /></span></td><td><span class="categoria"><c:out value="${producto.categoria}" /></span></td><td class="numero precio"><fmt:formatNumber value="${producto.precio}" type="number" minFractionDigits="2" maxFractionDigits="2" /></td><td class="numero"><span class="stock ${producto.existencias le 5 ? 'stock-bajo' : ''}"><c:out value="${producto.existencias}" /></span><c:if test="${producto.existencias le 5}"><span class="stock-nota">Stock bajo</span></c:if></td><td class="acciones"><a href="<c:out value='${editarUrl}' />" aria-label="Editar <c:out value='${producto.nombre}' />">Editar</a><a class="accion-eliminar" href="<c:out value='${eliminarUrl}' />" aria-label="Eliminar <c:out value='${producto.nombre}' />">Eliminar</a></td></tr>
    </c:forEach>
    </tbody></table></div>
    <div class="resumen-tabla">Valor de las existencias en esta vista <strong>COP <fmt:formatNumber value="${valorInventario}" minFractionDigits="2" maxFractionDigits="2" /></strong></div>
  </c:otherwise></c:choose>
</section>
<p class="nota-pagina">Un catálogo actualizado te ayuda a planear tu próxima venta.</p>
<%@ include file="pie.jspf" %>
