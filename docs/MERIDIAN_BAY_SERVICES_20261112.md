# Meridian Bay — primeros tres servicios civiles con casos persistentes (D-059)
Fecha: 2026-11-12. Rama aislada `work/meridian-bay-services-20261112`.
Base inspeccionada `b38c0139bf29c6d49bd90f19a2c896f92edbb5bc` (D-058).

## Alcance y decisión de arquitectura
El propietario pidió avanzar la expansión de la ciudad y las rutinas por bloques entre mensajes. Los lugares nuevos todavía no son hechos de la novela: no se conocen las horas de operación ni la dirección de la escuela o el vecino; tampoco hay verificación de que una caja averiada esté reparada.

Se eligió la opción de **operativizar tres funciones ya documentadas en tres anclas canónicas**, en lugar de convertir propuestas en tiendas, turnos, propietarios o direcciones falsos:

| Servicio de trabajo | Lugar canónico | NPC responsable | Recurso registrado | Límite |
| --- | --- | --- | --- | --- |
| Revisión de salidas de transporte | `LOC-TRANSIT-TERMINAL` | `NPC-001` Lena Ortiz | `work_authority` | Revisar notas no implica que el tren ya salió ni un nuevo horario |
| Mantenimiento y notas del panel | `LOC-CROSSWATER-PLAZA` | `NPC-002` Sora Venn | `work_order` | El fallo de un panel previamente examinado no se repara automáticamente |
| Conciliación de anotaciones manuales | `LOC-CAFE-BRUMA` | `NPC-007` Mara Reyes | `register` | Cuadrar una anotación no prueba que la caja registradora se arregló |

Son tres **flujos civiles funcionales**, NO tres edificios recién establecidos. El estatus de atención actual sigue `unknown` sin horarios o excepciones confirmados; no se inventan horas ni personal en servicio.

## Motor y conexión
Nuevo `tools/meridian_bay_services.mjs`:
- `inspectEstablishedServices` expone localización, actor, función confirmada, disponibilidad `open|closed|unknown` según evidencia, ruta existente si la hay, casos registrados y necesidades relacionadas. `openingHours`, `travelMinutes` y `verifiedActiveNow` permanecen `null/null/false`.
- `draftReviewedServiceOpening` permite crear un caso `CASE-...` solo cuando el NPC correcto tiene el recurso registrado, está en el ancla y hay una observación del **nuevo turno**, expresamente revisada. Una nueva ficha inicia abierta, con historial vacío, sin resolver de inmediato.
- `draftReviewedServiceStep` añade **un paso causal** por evento: acción, resultado, evidencia, bloqueos o resolución. Una ficha resuelta o cancelada no se borra ni reabre; la resolución necesita el evento actual y un resultado justificado.
- `reviewServiceCases` propone una revisión privada de casos pendientes, bloqueados o vencidos en el día ficticio seleccionado. Un retraso no determina por sí solo fracaso ni éxito.
- `validateNPCServiceCases` y `validateNPCServiceCaseChange` prueban estructura, identidad, secuencia de pasos, origen de eventos, bloqueos y necesidades de ese mismo NPC. Ninguna actividad se asigna por error a otro actor.

Integración:
- `tools/state_changes.mjs`: campo opcional `world.actors[NPC-ID].service_cases` con `before/after`, validación atómica y readback contra el historial de eventos. Compara IDs únicos a escala de todos los NPC.
- `tools/living_world_routines.mjs`: admite únicamente cambios declarados en eventos propios del NPC.
- `tools/living_world_commitments.mjs`: los casos urgentes, bloqueados o vencidos pueden justificar revisión incluso si el personaje está lejos del protagonista.
- `tools/living_world_decisions.mjs`: `competingServiceCases` aparece en la evaluación de compromisos/decisiones; no adjudica resultados.
- `tools/living_world_diagnostics.mjs`: `establishedServices` y `serviceCaseReview` permanecen **en el informe privado del narrador**. No alteran `playerVisibleDiagnostic`.
- `tools/meridian_bay_city.mjs` y las 18 oportunidades futuras no se modifican: una función laboral conocida no legitima crear ubicaciones de escuela, tiendas o vecinos.

## Pruebas sintéticas — NO son historia
Se preparan tres casos en un futuro turno **sintético**. En uno posterior la inspección de Sora puede quedar bloqueada; Mara puede revisar una anotación manual sin arreglar la caja; Lena puede revisar notas a lo largo de turnos sucesivos sin afirmar que hubo salida de tren. Los casos perduran por eventos propios, con originales y pasos inmutables. Ningún test autoriza jugar el turno real 10.

El origen de las acciones nuevas no se deriva de la existencia de un trabajo: **el narrador debe establecer y revisar en el turno auténtico** el contacto, la actividad y las consecuencias; un test puede probar el formato y la coherencia, no la verdad literaria de una observación.

## Limitaciones y trabajo posterior
1. El estado canónico actual no tiene `service_cases`; los procesos se vuelven persistentes únicamente cuando una acción real y revisada los registra. La prueba sintética no se fusiona con el checkpoint.
2. Una ubicación de distrito puede estar establecida sin que el mostrador preciso lo esté. Por eso la expansión detallada de Market Row, proveedores, vecinos y escuela queda propuesta.
3. La confirmación de apertura requiere un horario o excepción verdaderamente sustentados; `unknown` nunca equivale a abierto ni cerrado. Aun con acceso abierto, el resultado es una decisión causal, no un efecto automático.
4. El cambio de recursos de una caja o el estado de mantenimiento real debe tener su propio evento de recurso; cerrar la **revisión** no significa reparar un dispositivo.
5. La API de bajo nivel de estado conserva compatibilidad con registros previos; mejoras futuras deberán relacionar políticas de acceso, pruebas físicas y casos sociales con el flujo de guardado canónico.
6. Siguen sin probarse de extremo a extremo el journal GitHub autenticado y la recuperación durante un turno auténtico. Respetar las cinco fuentes del save.
7. Esta rama técnica depende de PR #14, a su vez dependiente de #13/#12/#11/#10. No fusionar automáticamente.
8. Este módulo no crea bots corriendo mientras el chat está cerrado, ni atribuye nueva conversación o información a Jack.

## QA y continuidad
Comandos oficiales `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v`, `python tools/validate_state.py`. Validar en GitHub Actions; comparar SHA de los cinco archivos canónicos entre ramas y anotar IDs de CI antes de cerrar la tarea.

Siguiente fase prioritaria: adjudicación editorial de situaciones urbanas reales, primera ubicación secundaria precisa por evento justificado y simulación sintética de jornada/horarios sin inventar el reloj o weekday. Después: consolidación de ramas, prueba autenticada del journal de guardado y recuperación.
