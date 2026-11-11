# Living World — coordinador y diagnóstico: QA de integración (2026-11-10)

**Alcance:** rama de revisión `work/living-world-design-review-20261110`, novela interactiva dirigida por ChatGPT. Los módulos son ayudas deterministas; **no ejecutan una IA aparte ni generan acontecimientos durante la inactividad**. No se integran automáticamente en la rama narrativa.

## Entregables
- `tools/living_world_coordinator.mjs`: recibe una acción libre ya narrada y acontecimientos autónomos **explícitamente resueltos/revisados**. Rechaza agendas sin resolver, mutaciones cruzadas, filtración implícita de información privada y aportes directos `offscreen` no controlados. Genera un candidato con `stageNarrativeTurn`; usa `saveFiveFileTurn` para solicitar un único guardado de cinco archivos y lectura de vuelta.
- `tools/living_world_diagnostics.mjs`: diagnóstico privado del narrador con checkpoint, conocimiento del jugador, hilos sin resolver, disponibilidad (incluyendo `unknown`) y candidatos de rutinas. `playerVisibleDiagnostic` solo devuelve hechos visibles para Jack, sin exportar propuestas privadas.
- `tests/living_world_coordinator.test.mjs` y `tests/living_world_diagnostics.test.mjs`: 18 pruebas nuevas, incluidas integridad de estado, efectos de NPC, confidencialidad y un guardado sintético mediante adaptador Git simulado.

## Evidencia ejecutada
1. Se recuperaron 15 fuentes vigentes directamente de GitHub y se ejecutaron **23 comprobaciones funcionales: 23 aprobadas, 0 fallidas**. Incluyen verificación del checkpoint CH-000, escenario con Rosa aún sin devolver el reloj, avance narrativo aproximado, rechazo de cambios arbitrarios y transacción atómica simulada con lectura exacta de cinco archivos.
2. Se recuperaron 17 fuentes, incluyendo los dos archivos de pruebas nuevos, y se ejecutaron sus definiciones en un *harness V8* que adapta imports del entorno Node.js: **18 aprobadas, 0 fallidas**.
3. **Límite de evidencia:** esto NO equivale a una corrida oficial `node --test`, a una ejecución de CI, a una revisión literaria humana o a un commit de guardado real de un turno. La comprobación de GitHub Actions asociada al último commit no mostró resultados al consultarla. Ejecutar en un checkout de Node.js con acceso al repositorio sigue pendiente.

## Invariantes verificadas
- `game/SAVE_MANIFEST.json`: CH-000, turno 9, EV-000029, TXT-000020, blob `897ec2e77ece4f8edf506c7058552a5dd3cdb320`.
- El manifiesto de la rama narrativa `work/chat-narrative-foundation` tenía el mismo SHA cuando fue consultado.
- La prueba sintética no modificó el checkpoint real. Las propuestas no crean eventos automáticamente ni fuerzan asistencia escolar; la llegada de Elena sigue no confirmada.
- Los horarios faltantes permanecen `unknown`; la rutina de Rosa **no** registra entrega del reloj sin resolución causal.

## Trabajo pendiente antes de activar el flujo real
1. Ejecutar `node --test tests/living_world_availability.test.mjs tests/living_world_routines.test.mjs tests/living_world_coordinator.test.mjs tests/living_world_diagnostics.test.mjs` desde un checkout verificado; después ejecutar la suite existente y `python tools/validate_state.py`.
2. Ensayar fallos de guardado/ref/readback con el adaptador remoto real en **rama QA aislada** (sin narración canónica) y revisar los límites de carreras de GitHub.
3. Realizar revisión editorial de una escena ficticia de ensayo: causalidad, límites de conocimiento, libertad de Jack y prosa natural.
4. Revisar el diff con el propietario antes de integrar en `work/chat-narrative-foundation`; no fusionar con `main` sin autorización expresa.

**Estado:** componentes y pruebas guardados; comprobaciones V8 aprobadas; integración canónica, Node CI y validación GitHub remota pendientes. No declarar el sistema activo todavía.
