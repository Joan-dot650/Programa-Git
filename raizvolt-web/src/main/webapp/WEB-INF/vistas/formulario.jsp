<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<c:set var="tituloPagina" value="${edicion ? 'Editar producto' : 'Nuevo producto'}" />
<%@ include file="cabecera.jspf" %>
<a class="volver" href="<c:out value='${catalogoUrl}' />">← Volver al catálogo</a>
<section class="encabezado"><div><p class="etiqueta">CATÁLOGO SOLAR</p><h1><c:out value="${tituloPagina}" /></h1><p class="subtitulo">Información clara para una mejor gestión de tu inventario.</p></div></section>
<c:if test="${not empty errorFormulario}"><div class="aviso error" role="alert"><strong>Revisa los datos.</strong> <c:out value="${errorFormulario}" /></div></c:if>
<div class="diseno-formulario">
<section class="tarjeta formulario"><h2>Datos del producto</h2><p class="descripcion-formulario">Todos los campos son obligatorios.</p>
<form method="post" action="<c:out value='${catalogoUrl}' />">
  <input type="hidden" name="accion" value="${edicion ? 'actualizar' : 'crear'}">
  <input type="hidden" name="csrf" value="<c:out value='${sessionScope.csrf}' />">
  <c:if test="${edicion}"><input type="hidden" name="id" value="<c:out value='${datos.id}' />"></c:if>
  <div class="campos">
    <div class="campo"><label for="codigo">Código del producto</label><input id="codigo" name="codigo" type="text" required minlength="3" maxlength="30" pattern="[A-Za-z0-9\-]{3,30}" aria-describedby="ayuda-codigo" placeholder="Ej. PANEL-550" value="<c:out value='${datos.codigo}' />"><small id="ayuda-codigo">De 3 a 30 letras, números o guiones. Debe ser único.</small></div>
    <div class="campo"><label for="categoria">Categoría</label><select id="categoria" name="categoria" required><option value="">Selecciona una categoría</option><c:forEach var="categoria" items="${categorias}"><option value="${categoria.name()}" ${datos.categoria eq categoria.name() ? 'selected' : ''}><c:out value="${categoria}" /></option></c:forEach></select></div>
    <div class="campo ancho"><label for="nombre">Nombre del producto</label><input id="nombre" name="nombre" type="text" required minlength="3" maxlength="120" placeholder="Ej. Panel solar monocristalino 550 W" value="<c:out value='${datos.nombre}' />"></div>
    <div class="campo"><label for="precio">Precio de venta (COP)</label><input id="precio" name="precio" type="text" inputmode="decimal" required maxlength="13" pattern="[0-9]{1,10}([.,][0-9]{1,2})?" aria-describedby="ayuda-precio" placeholder="Ej. 680000.50" value="<c:out value='${datos.precio}' />"><small id="ayuda-precio">Mayor que cero, sin separadores de miles. Hasta 2 decimales.</small></div>
    <div class="campo"><label for="existencias">Existencias</label><input id="existencias" name="existencias" type="number" min="0" max="1000000" step="1" required placeholder="Ej. 12" value="<c:out value='${datos.existencias}' />"><small>Unidades disponibles, de 0 a 1.000.000.</small></div>
  </div>
  <div class="acciones-formulario"><a class="boton secundario" href="<c:out value='${catalogoUrl}' />">Cancelar</a><button class="boton primario" type="submit">${edicion ? 'Guardar cambios' : 'Registrar producto'}</button></div>
</form>
</section>
<aside class="consejo"><span class="consejo-icono" aria-hidden="true">☀</span><h2>Un catálogo que crece contigo</h2><p>Usa nombres fáciles de reconocer y códigos consistentes para encontrar cada producto rápidamente.</p><hr><h3>Antes de guardar</h3><ul><li>Confirma el precio de venta en pesos colombianos.</li><li>Registra las unidades realmente disponibles.</li><li>Selecciona la categoría que corresponda.</li></ul></aside>
</div>
<%@ include file="pie.jspf" %>
