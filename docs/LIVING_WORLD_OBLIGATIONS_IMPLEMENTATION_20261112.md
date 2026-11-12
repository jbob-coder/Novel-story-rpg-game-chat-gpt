# D-054 (propuesta técnica) — obligaciones persistentes de NPC, sin alterar canon
Fecha: 2026-11-12. Rama aislada: `work/living-world-persistent-commitments-20261112`.
Base inspeccionada: `b096f84dca1ec4e01f1a2742a67ae41688bd11d6` en `work/chat-narrative-foundation`.

## Motivo y límites
El diagnóstico anterior recibía `commitments=[]` del llamador y por defecto solo consideraba proximidad al protagonista. Las obligaciones no vivían en el checkpoint ni tenían verificación causal de cambios entre turnos. Por ello, una tarea podía desaparecer entre sesiones o ser completada sin prueba de que el NPC realmente la llevó a cabo.

Esta rama implementa una **primera capa de persistencia**, no una IA autónoma continua. **No avanza CH-000, no modifica `game/STATE.json` ni `chapters/`, no añade cronología retrospectiva, no decide por Jack, no activa poderes antes del Día 0.**

## Esquema de obligación (solo NPC)
Campo opcional `world.actors[NPC-ID].commitments`, ausente por defecto hasta existir un evento futuro auténtico que lo introduzca. Cada elemento requiere:
- `id`: ID estable `OBL-...` sin duplicados; `summary`: responsabilidad concreta y verificable.
- `source_event_id`: evento que **creó** la obligación; no puede reescribirse.
- `due_day`: día narrativo entero confirmado, o **null** si no hay prueba de plazo. No se genera reloj exacto ni weekday.
- `status`: `pending`, `blocked`, `resolved` o `cancelled`.
- `priority`: `normal`, `important`, `urgent`; clasificación privada de atención narrativa, no atributo RPG.
- `blockers`: lista de obstáculos narrados; `blocked` requiere al menos uno.
- `last_change_event_id`: evento propio del NPC que modificó el elemento.
- `resolution` y `resolution_event_id`: solo para `resolved/cancelled`, con fundamento en evento de resolución; ambos `null` mientras siga abierto.

Los cambios se realizan mediante `{field:'commitments',before:[...],after:[...]}` en el evento revisado **del mismo NPC**. `tools/state_changes.mjs` protege las precondiciones y aplica lotes atómicamente; `verifyStateChanges` coteja la historia con el estado materializado y valida referencias a eventos existentes. No se pueden crear tareas ya resueltas, reabrir cierres ni borrar silenciosamente obligaciones históricas.

## Integración real
- `tools/living_world_obligations.mjs`: validador estructural y de transiciones.
- `tools/state_changes.mjs`: campo de cambio causal nuevo y verificación en readback.
- `tools/living_world_routines.mjs`: permite este efecto solo tras revisión de `stageNPCResolution`.
- `tools/living_world_commitments.mjs`: lee **automáticamente** obligaciones persistidas, permite entradas sintéticas externas para compatibilidad de pruebas y selecciona NPC por obligaciones vencidas/bloqueadas incluso a distancia. Los candidatos siguen siendo *narrator_private*, no hechos ejecutados.
- `tools/living_world_diagnostics.mjs`: ya llama a `reviewNPCCommitments`; recibe el conjunto persistido sin cambiar su interfaz pública segura.
- `tests/living_world_obligations.test.mjs`: creación, persistencia y cierre sintéticos; validación de bloqueo, fecha desconocida, no reescritura, atomicidad y confidencialidad.

## Revisión crítica y riesgos
1. Los NPC **todavía no seleccionan automáticamente un resultado** por motivación, recursos y obstáculos. Esta entrega establece memoria verificable y selección de atención; una futura capa de intención debe basarse en necesidades, logística, disponibilidad y conocimiento.
2. Los siete NPC canónicos mantienen sus planes descriptivos anteriores, **sin crear ahora nuevas obligaciones retroactivas**. Un futuro turno genuino puede registrar obligaciones causales si la escena las justifica. La urgencia clasifica revisiones pero no garantiza ejecución ni impone que aparezcan en escena.
3. Los plazos son días, no horas; la exactitud horaria y calendarios siguen desconocidos.
4. La revisión editorial sigue siendo obligatoria: un cambio estructural válido no prueba la calidad de la escena ni evita paráfrasis que filtren secretos.
5. El journal GitHub real requiere credenciales externas seguras y prueba remota aislada. Este cambio no configura ni desactiva la puerta de guardado D-052.

## QA y habilitación
- Ejecutar `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v` y `python tools/validate_state.py` en una rama de QA aislada o CI.
- Verificar cinco blobs del checkpoint contra la base antes de integrar.
- Integrar solo con comparación revisada, sin merge implícito a `main` ni avance del turno 10.
- **Próxima tarea de autonomía:** planificador causal acotado que elija 0–N intenciones basadas en obligaciones persistidas, metas, recursos, obstáculos y tiempo, sin resultados deterministas injustificados; generar propuestas privadas y requerir adjudicación literaria antes de guardar.

Estado de este documento: implementación en revisión; resultados de CI deben añadirse después de ejecutarse, no asumirse.

## Evidencia verificada de QA
GitHub Actions [run #43325927852](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43325927852) ejecutó contra el commit técnico `54132fd52b3238ff2e808656742cf48c83d998f3`:
- **182/182** pruebas Node.js, **24/24** Python, **0 fallos**.
- `python tools/validate_state.py`: **PASS**.
- Comparación remota de las dos ramas: los cinco blobs canónicos de continuidad tienen SHA idénticos.
- La ejecución de CI fue activada mediante una PR temporal en borrador con base `main` porque el workflow escucha solo PR hacia `main`; se retargetea a la rama narrativa para revisión. Ningún merge queda autorizado.

Limitación: los tests sintetizan cambios de NPC y guardado; no prueban un journal autenticado en GitHub ni la calidad literaria de una escena auténtica.
