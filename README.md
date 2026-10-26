# RaízVolt · Módulo web con servlets y JSP

**Evidencia GA7-220501096-AA2-EV02**  
Aprendiz: Jhon Edwards Tineo Landaeta  
Programa: Análisis y Desarrollo de Software (ADSO) · Ficha 3235874  
Centro Regional Antioquia · 25 de octubre de 2026

Aplicación web académica para registrar, consultar, actualizar y eliminar productos
solares. Continúa el catálogo JDBC de la evidencia EV01 con una interfaz web MVC.

## Empezar

1. Extraer completamente `JhonEdwardsTineoLandaeta_AA2_EV02.zip`.
2. Instalar un **JDK 17 o superior** y entrar en `raizvolt-web`.
3. Abrir `ejecutar.bat` (Windows) o ejecutar `bash ejecutar.sh` (Linux/macOS).
4. Visitar **http://localhost:8080/raizvolt/productos**.

El ZIP incluye código, dependencias y compilados. El repositorio versiona código,
documentación y la lista verificada de dependencias; al clonarlo se deben ejecutar
`descargar_dependencias` y `compilar` antes de `ejecutar`.

## Ubicación de la evidencia

- `raizvolt-web/`: módulo de **esta evidencia EV02**.
- `raizvolt-jdbc/`: código anterior EV01, conservado como antecedente.
- `ENLACE_REPOSITORIO.txt`: enlace directo a esta rama.
- `raizvolt-web/docs/`: manual, trazabilidad, estándares y pruebas.

Repositorio de esta evidencia: https://github.com/Joan-dot650/Programa-Git/tree/evidencia/aa2-ev02-raizvolt-web

Los archivos `raizvolt-jdbc` proceden del repositorio previo y no son el punto de
entrada de la aplicación web.

## Requisitos cubiertos

| Criterio de la guía | Implementación |
| --- | --- |
| Formularios HTML con servlets | Vistas JSP generan `<form>` y envían parámetros a `ProductoServlet`. |
| GET y POST | `doGet` consulta; `doPost` registra, actualiza y elimina. |
| Elementos JSP | Directivas, EL, JSTL, inclusiones y `jsp:forward`. |
| Versionamiento | Git, historial y rama independiente para EV02 en GitHub. |

El término “pos” del instrumento se implementa como **POST**, el método HTTP.
