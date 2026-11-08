# AP-02 - Acta de aplicación de pruebas y aceptación

Proyecto: RaízVolt 2.0.0. Evidencia GA8-220501096-AA1-EV02.
Preparación: 8 de noviembre de 2026. Aprendiz: Jhon Edwards Tineo Landaeta, ficha 3235874.

**Pruebas técnicas realizadas; aceptación de usuario/instructor pendiente de revisión y firma.**

Entorno: Linux, Node.js 24.22.1, SQLite 3.53.4, esbuild 0.25.12, Playwright 1.58.1 y Chromium 153.0.8010.0. Bases temporales y datos ficticios; nunca se usó una base real.
Resultado: 91 pruebas de Node aprobadas, 0 fallos y 0 omitidas; 13 comprobaciones E2E aprobadas y 0 errores JavaScript capturados. Compilación completada. Restauración de respaldo con servidor detenido: integrity_check=ok y foreign_key_check sin filas.
Evidencias: docs/evidencias/PRUEBAS.tap, PRUEBAS.xml, E2E.json, capturas/ y ENTREGA.json. Los números representan casos ejecutados, no porcentaje de cobertura ni pruebas de carga.

Recorrido de aceptación sugerido: crear cliente, completar perfil, buscar producto, cotizar dos unidades, confirmar, revisar inventario; repetir confirmación; cancelar y verificar devolución; ADMIN crea/edita/retira producto, ajusta stock, despacha y entrega otro pedido.

Incidencias observadas en los casos ejecutados: ninguna. Límite: Windows físico, otros navegadores, carga, pentest y hosting público no verificados. Pendientes de entrega institucional: firma de AR-02/AP-02 y URL pública si se exige acceso remoto.

Decisión de aceptación a diligenciar:
[ ] Aceptado [ ] Aceptado con observaciones [ ] No aceptado
Observaciones / compromisos: _________________________________________
____________________________________________________________________
Instructor o representante receptor: __________________________________
Firma: ______________________ Fecha real de aceptación: _______________
Aprendiz, firma: _____________________ Fecha: _________________________

La generación de este documento no supone asistencia, aprobación ni firma de terceros.
