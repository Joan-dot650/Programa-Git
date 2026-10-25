# Guía para ejecutar y demostrar RaízVolt Web

## 1. Preparar Java

Abre Inicio, escribe `cmd`, abre Símbolo del sistema y ejecuta:

```bat
java -version
```

Debe informar versión 17 o superior. Si no está instalado, visita
https://adoptium.net/temurin/releases/?version=17 y elige JDK para tu sistema. Para
Windows x64, el instalador MSI permite agregar Java al PATH. Conserva esa opción,
termina la instalación y abre una nueva ventana CMD. Verifica también `javac -version`
si vas a editar y compilar. El JDK se instala por separado; no está dentro del ZIP.

## 2. Extraer y abrir

1. Descarga el ZIP de esta evidencia.
2. Clic derecho sobre él > Extraer todo > Extraer.
3. Abre la carpeta extraída `JhonEdwardsTineoLandaeta_AA2_EV02`.
4. Entra en `raizvolt-web`.
5. Doble clic en `ejecutar.bat`. Deja abierta la consola.
6. Espera el mensaje `RAÍZVOLT ESTÁ LISTO`.
7. Abre Chrome, Edge o Firefox y escribe `http://localhost:8080/raizvolt/productos`.

Tomcat y H2 están incluidos. Esta ruta no requiere XAMPP, Maven ni instalar un
servidor Tomcat independiente. JSP se procesa en Java: no abrir los archivos JSP
con doble clic ni usar Live Server. El primer acceso puede tardar mientras se
compilan las vistas.

## 3. Demostrar los cuatro casos

Datos ficticios únicamente para practicar, no cotizaciones comerciales:

| Campo | Ejemplo |
| --- | --- |
| Código | PANEL-550 |
| Nombre | Panel solar monocristalino 550 W |
| Categoría | Panel solar |
| Precio (COP) | 680000.50 |
| Existencias | 12 |

1. **Registrar:** Nuevo producto > completar campos > Registrar producto.
2. **Consultar:** escribir `PANEL-550` en el buscador > Buscar. La dirección muestra
   `accion=buscar` y `q=PANEL-550`: son parámetros enviados por GET.
3. **Editar:** Editar > cambiar las existencias a `15` > Guardar cambios.
4. **Validar:** intentar crear otro producto con el mismo código. Aparece un mensaje
   y se conservan los datos del formulario. Probar también un precio `0`.
5. **Cancelar eliminación:** Eliminar > Cancelar. El registro permanece.
6. **Eliminar:** Eliminar > Sí, eliminar producto. El registro desaparece.
7. **Persistencia:** registrar otro producto, detener con Ctrl+C y abrir ejecutar.bat
   otra vez. El producto permanece porque se guardó en H2.

Para observar POST: abre F12 > Red/Network, envía el formulario y revisa la petición
`productos`. En Encabezados figura POST; en Carga útil/Payload aparecen los campos.
En el código, `doPost` decide crear/actualizar/eliminar por el parámetro `accion`.

## 4. Editar el código

Abre Visual Studio Code > Archivo > Abrir carpeta > raizvolt-web. Los Java están en
`src/main/java`; las páginas, en `src/main/webapp`. Detén la aplicación, edita,
ejecuta `compilar.bat` y vuelve a abrir `ejecutar.bat`. Para demostrar las pruebas,
ejecuta primero `compilar.bat` y luego `pruebas.bat`. Las pruebas usan bases temporales.

## 5. Verificar Git

Abre Git Bash en la carpeta principal extraída, donde está README.md:

```bash
git status
git branch --show-current
git log -5 --oneline
git remote -v
```

La rama de EV02 es `evidencia/aa2-ev02-raizvolt-web`. La carpeta `.git` suele estar
oculta en el explorador; no hay que borrarla. Si cambias archivos del módulo:

```bash
git add raizvolt-web
git commit -m "Ajustar modulo web RaizVolt"
git push origin evidencia/aa2-ev02-raizvolt-web
```

El push requiere autenticar tu propia cuenta GitHub si Git lo solicita. El proyecto
entregado ya tiene el código publicado; esos comandos se usan para tus cambios.

## 6. Si algo no abre

| Síntoma | Solución |
| --- | --- |
| java no se reconoce | Instalar JDK y habilitar PATH; abrir consola nueva. |
| Versión de Java no compatible | Revisar java -version y usar 17 o superior. |
| La página no responde | Dejar la consola abierta y esperar el mensaje de inicio. |
| Puerto 8080 ocupado | Desde CMD en raizvolt-web: ejecutar.bat 8081; abrir localhost:8081/raizvolt/productos. |
| Falta una biblioteca | Ejecutar descargar_dependencias.bat con Internet y luego compilar.bat. |
| No se encontró la clase principal | Confirmar que se extrajo todo; ejecutar compilar.bat si falta dist. |
| Formulario vencido | Volver al catálogo y abrir de nuevo el formulario. |
| Base bloqueada | Cerrar otras ejecuciones que utilicen la misma carpeta de datos. |
| Error después de configurar MySQL | Verificar servidor, esquema y credenciales; para H2 quitar la configuración opcional y variables RAIZVOLT_DB_*. |

En Linux/macOS: usar `bash ejecutar.sh`, `bash compilar.sh` y `bash pruebas.sh`.
En el ZIP se entrega también el WAR estándar para despliegue opcional; ver README.
