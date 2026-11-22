# Lote 12 — Migración revisada de referencias de conocimiento NPC

**Fecha:** 2026-11-22. **Estado:** implementación técnica en rama `work/npc-knowledge-anchor-migration-20261122`, **no** cambio de canon ni promoción automática. **Base exacta:** [PR #127](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/127) `ae42f871e3ef336dc69a23dca1ba8e861b30cc8d`; dependencia de PR #118 → #108 → #98 → #82. `main` sigue siendo fuente de la partida (CH-000, turno 9), sin fusionar las ramas experimentales.

## Hallazgo y decisión arquitectónica

La referencia del Lote 11 fija **29 conocimientos de siete NPC** al checkpoint `EV-000029`. El siguiente paso no puede consistir en copiar indiscriminadamente el `STATE.json` futuro al módulo de referencia: un checkpoint posterior podría contener conocimientos falsos, NPC introducidos sin eventos de creación, borrados sin historia o un archivo distinto del que se supone verificado.

**Decisión:** separar **preparar una propuesta auditable** de **autorizar/aplicar una migración**. Esta implementación solo hace lo primero. No escribe `game/`, `chapters/`, el journal ni `tools/living_world_knowledge_anchor.mjs`, ni puede modificar una rama de otro agente.

## Interfaces verificables

`tools/living_world_knowledge_migration.mjs` introduce:

- `assessNPCKnowledgeAnchorMigration({snapshot,sourceFiles,observedHead,operation,reviewed,reason,actorId,entry})`: insumo de un snapshot narrativo completo y los **cinco archivos de fuente** crudos, extraídos de la misma versión, más el commit observado y justificación editorial. Ejecuta `verifyNarrativeSnapshot`, exige igualdad exacta del contenido semántico del JSON y **literal** del capítulo visible, calcula Git blob SHA-1 de cada archivo y revisa el conocimiento de NPC mediante la referencia fija.
- `verifyNPCKnowledgeAnchorMigrationProposal({proposal,...inputs})`: reconstruye el informe de forma determinista y rechaza cambios en campos, destinatarios, tipo de operación, contenido o huella. El `proposalDigest` SHA-256 es **una comprobación de integridad local, no una firma ni aprobación del propietario**.
- `tools/living_world_social.mjs` exporta `verifySealedNPCKnowledge`, reutilizando la reconstrucción histórica que ya emplea el verificador social. Ahora rechaza divergencias del registro de actores frente a la referencia; la existencia de nuevos NPC exige un protocolo de ciclo de vida explícito, no un bypass del historial.

El informe clasifica `status: blocked` o `candidate_only_requires_external_review`, con `applied: false`, `verifiedRemoteCommit: false` y `ownerApproved: false` **siempre**. No hay función que reescriba la referencia vigente.

## Operaciones y guardas

| Operación | Resultado del Lote 12 | Justificación |
|---|---|---|
| `promote_checkpoint` del turno 9 a sí mismo | **blocked** | No cambia el punto de referencia ni hay evento posterior. |
| `promote_checkpoint` de turno posterior, con estado validado, sin cambios de roster y revisión explícita | **candidate_only_requires_external_review** | Es un candidato para aprobación y comprobación remota de que el commit realmente contiene los blobs. **No se promueve solo.** |
| `register_npc` | **blocked** | Todavía no hay contrato de creación de actor con causalidad, esquema de conocimiento inicial ni migración revisada de identidad. |
| `forget` | **blocked** | El motor de `knowledge` actual es aditivo: no dispone de operación causal de olvido con reconstrucción y trazabilidad. |
| Pérdida/sustitución de hechos, memoria sin evento, actor diferente, archivo crudo no coincidente o referencia de fuente inválida | **rechazo** | La verificación de evento/estado y de bytes es obligatoria. |

El chequeo de `observedHead` valida **formato y consistencia de entrada**, no prueba pertenencia al árbol del repositorio. La autenticidad del commit debe confirmarla un verificador remoto independiente que lea ref, árbol y blobs, y después obtener la aprobación explícita del propietario para publicar un nuevo anchor. Si la rama de fuente avanza mientras tanto, el candidato queda obsoleto. El mecanismo de migración real deberá usar un guard de comparación de HEAD / write journal y comprobar readback completo: **fuera de alcance de este lote**.

## Pruebas y límites de alcance

`tests/npc_knowledge_anchor_migration.test.mjs` añade **14 pruebas**, todas sintéticas, que cubren bloqueo del mismo checkpoint, promoción solo candidata, cinco hashes calculados sobre bytes, revisión incompleta, fuente faltante/corrupta, HEAD inválido, operaciones no soportadas, modificación de propuesta, conocimiento nuevo legítimo con evento y rechazo de memoria inventada, incorporación de un actor no registrado y olvido no documentado.

**No hay turno 10 real:** los candidatos que contienen turno 10 solo viven en memoria durante QA. La referencia original sigue en `STATE.json` blob `3f4e9c98a7211068faefd31d0a0acbd4260ef589`, CH-000, turno 9, EV-000029.

**Criterio de aceptación:** suite JavaScript/Python completa y `tools/validate_state.py` PASS en el HEAD exacto, inventario/índices completos, cinco blobs canónicos inalterados, branch aislada y PR draft; una PR temporal QA-only contra main se cerrará **sin merge**.

## Siguiente trabajo

Establecer un contrato autoritativo de **admisión de actores** con identidad estable, evento de creación, conocimiento inicial trazable y posibilidad de rectificación causal, antes de admitir un NPC nuevo con memoria heredada. Diseñar por separado una operación de olvido voluntario/accidental que registre origen, motivo y evento sin borrar el historial de que el personaje anteriormente poseía ese conocimiento. No sustituir la referencia por heurísticas de memoria final.

## Historial de QA

La ejecución inicial [#45083270859](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083270859) se completó correctamente sobre el primer commit funcional `82dbae8e83cf7f88fbcfe996554bc7ad31157d71`: **496/496 JavaScript PASS, 47/47 Python PASS y validador canónico PASS**. Se añadieron después dos regresiones adversariales (roster de NPC sin evento y borrado de memoria), llevando la suite nueva a **14 casos**. Este registro **no** certifica el HEAD modificado: es obligatorio volver a ejecutar CI y registrar la corrida exacta. Los cinco archivos narrativos no se tocaron.


### QA del código ampliado: dos regresiones adversariales adicionales

La ejecución [#45083375037](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083375037) terminó **SUCCESS** en el commit `9a1230125ac5494e4aa745ff996498f3fb8fcb88`: **498/498 JavaScript PASS, 47/47 Python PASS**, `python tools/validate_state.py`: **PASS**. Se comprobó el rechazo de un nuevo actor introducido sin historial, así como del borrado de conocimiento sin evento. La rama conserva el inventario de archivos sin modificaciones canónicas.

**Precisión de certificación:** esta anotación crea un commit documental nuevo, por lo que el resultado anterior acredita solo el commit indicado. Se realizará otra ejecución exacta de QA sobre el HEAD final antes de cerrar el disparador temporal. La PR de desarrollo seguirá en borrador; un éxito del simulador no autoriza promover la referencia ni avanzar la historia.
