# Seguimiento del desarrollo — Living Superhuman World

**Fecha de base:** 2026-11-19. **Repositorio:** [jbob-coder/Novel-story-rpg-game-chat-gpt](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt). **Fuente de código narrativo:** `work/chat-narrative-foundation` @ `0efd2586ac8647faae10eb84695437dca430df04`. **Esta tabla es un registro de coordinación**, no un segundo almacén de estado narrativo. Los datos de la partida y el journal prevalecen.

## Para qué sirve y cómo usarlo

Se emplea para **consolidar** versiones compatibles en `main` y **seguir el progreso** sin reabrir constantemente 108 ramas. Cada entrada identifica una función, su utilidad, qué se observó, qué falta, la evidencia necesaria y el siguiente paso. Antes de implementar hay que comparar archivos y revisar pruebas; después, registrar el nuevo SHA y resultado. Si no hay evidencia nueva, conservar el estado anterior, no marcar «completo».

## Panel de trabajo (no representa porcentaje global)

| ID y prioridad | Función / para qué sirve | Estado comprobado | Falta / riesgo | Siguiente comprobación | Referencia |
| --- | --- | --- | --- | --- | --- |
| INT-01 · **integrado** | **Base narrativa a `main`:** disponer de un punto consolidado de código/estado existente. | PR #2 fusionada; `main` @ `7c45dc46f265`, 163/163 blobs iguales a fuente narrativa `2820cca1bd51`. | No prueba el primer turno real con el conector ni integra las demás ramas antiguas. | Continuar con PR #80, QA de módulos por función y contratos de journal; no cambiar el origen operativo de la historia. | [PR #2](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/2), [informe](MAIN_CONSOLIDATION_2026-11-20.md) |
| SAVE-01 · P0 | **Recuperación segura:** preservar texto literal y partida sin duplicar turnos ante fallas. | Journal independiente verifica `world_admission` al 100 %; el turno 9 sigue guardado. | No se ha demostrado completamente un turno nuevo y cambiado por el conector de ChatGPT en una sesión real. | QA aislada de escritura nueva/interrupción/recuperación, luego validación de una acción real del jugador. | [Protocolo de guardado](../05_persistence/CHATGPT_GITHUB_NATIVE_SAVE.md) |
| WORLD-01 · P1 | **Lugares admitidos:** mantener una ciudad con ubicaciones preexistentes y estados mutables sin inventar visitas. | 14 LOC + contenedor de Meridian Bay; PR #33, #78 y #79 ya incorporadas a rama narrativa. | Integración de servicios, acceso, hechos civiles y más geografía física por revisar. | Comparar módulos propuestos con código vigente; pruebas de accesibilidad/privacidad. **No repetir admisión**. | [Admisión y ubicación](../01_world/WORLD_ADMISSION_AND_LOCATION_STATE.md) |
| NPC-01 · P1 | **Autonomía social causal:** necesidades, relaciones y obligaciones persistentes de NPC. | Código básico y pruebas de rutinas/planes en rama narrativa; existen PR de propuestas de necesidades y servicio. | Ramas con dependencias y riesgo de duplicar versiones o filtrar conocimiento privado. | Seleccionar diff de cada PR, revisar actor propietario, privacidad, eventos y regresiones. | [PR #27](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/27), [tablero por áreas](AREA_STATUS_AND_TASKS_2026-11-17.md) |
| MAP-01 · P2 | **Ciudad física coherente:** calles, accesos y bloques que conecten los lugares de forma creíble. | Numerosas PR de mapa y costa abiertas en borrador; no equivalen a una ciudad completa jugable. | Rutas paralelas/superpuestas, accesos y límites sin reconciliar. | Auditar orden de dependencias y ensamblar fragmentos sin modificar el estado narrativo por una imagen o JSON. | [Mapa de ramas](BRANCH_AND_MAP_WORKSTACK_2026-11-17.md) |
| BR-01 · P2 | **Inventario de ramas:** localizar cambios no integrados, históricos y redundantes. | 108 ramas originales y 79 PR relacionadas registradas con SHA; doble comprobación de integridad de metadatos anterior superada. | Falta revisión de contenido, diffs y tests de cada rama; una PR fusionada puede haberlo hecho en una base distinta de `main`. | Seleccionar ramas por relevancia; verificar si tienen cambios únicos y documentar decisión. | [Inventario con uso breve](INVENTARIO_RAMAS_2026-11-19.md), [datos JSON](INVENTARIO_RAMAS_2026-11-19.json) |
| BR-02 · P1 | **Brechas de código y compatibilidad:** aislar módulos de NPC y planos de Meridian Bay no presentes en la rama narrativa. | Comparación estática de 108 árboles frente a 157 archivos: 28 rutas `tools/` y 34 `tests/` ausentes en la fuente; 22 grupos con HEAD compartido. | Las rutas ausentes no prueban funcionalidad; los tests de agenda antigua esperan 9 ubicaciones, la fuente tiene 15. | Seleccionar un módulo por dependencia, adaptar fixtures, ejecutar Node/Python/validador sobre una rama aislada; no arrastrar `game/STATE.json`. | [Matriz de brechas](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.md) |

## Registro de cada actualización

Al completar trabajo, añadir una fila o actualizar el registro correspondiente en una PR revisable. **Campos mínimos:** fecha, ID, rama, SHA de origen, archivos realmente revisados, cambio hecho, prueba ejecutada con enlace y resultado, impacto sobre canon/guardado, estado (**propuesto**, **en revisión**, **integrado**, **verificado**, **bloqueado**), responsable si está definido y siguiente acción. **No usar «verificado» sin evidencias**, no asignar propietario inventado y no convertir pruebas QA en hechos de la historia.

## Reglas de consolidación

1. Consultar primero [AGENTS.md](../../AGENTS.md), [guía breve](LEER_PRIMERO_RAMAS_2026-11-19.md), manifest/journal vivo y SHA actual; la memoria de conversación no basta.
2. Comparar la rama a integrar con la base narrativa en sus HEAD actuales. Registrar archivos exclusivos y dependencias; evitar duplicados de PR ya fusionadas.
3. Integrar cambios de código pequeños y reversibles. Excluir `qa/`, `journal/`, `backup/` y estados sintéticos; no fusionar todos los 108 árboles a la vez.
4. Ejecutar Node, Python, validador y controles relevantes. Informar el SHA probado y qué quedó sin probar.
5. Actualizar este panel y el inventario solo después de confirmar el estado real. Los archivos de partida no se tocan sin acción genuina y guardado protegido.

**Criterio de cierre:** una función solo está **integrada** cuando su código existe en la rama de destino; solo está **verificada** cuando la versión integrada pasa pruebas relevantes y no viola continuidad. El porcentaje general del proyecto no se conoce todavía.

## Auditoría complementaria — 2026-11-19

Se publicó la [matriz de comparación de código para las 108 ramas](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.md) y sus [datos JSON](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.json). La matriz valida presencia de rutas y SHA de blobs, no ejecución funcional. Las pruebas aún pendientes permanecen **sin ejecutar**; no avanzar la partida ni fusionar ramas QA.

## Rectificación tras nuevo HEAD — 2026-11-20

La rama narrativa avanzó a `2820cca1bd5140ef8a9f2c94cf986feef0ef19cc` e integró necesidades cualitativas y servicios civiles; las filas fechadas el 19-11 son históricas. En el corte nuevo quedan 26 rutas distintas de herramientas y 32 de tests ausentes (frente a 28 y 34). [Informe actualizado](CURRENT_STATE_RECHECK_2026-11-20.md). No reimportar las versiones anteriores de necesidades/servicios ni alterar el turno 9.

## Consolidación efectiva en main — 2026-11-20

PR #2 **fusionada** y comparada: `main` @ `7c45dc46f2651d8d4375435af704b71643ebdae5` recibió exactamente los 163 archivos de la fuente `2820cca1` sin diferencia blob. El guardado canónico sigue en `work/chat-narrative-foundation`. Ver [acta de integración](MAIN_CONSOLIDATION_2026-11-20.md); las filas del 19-11 son históricas.


## Verificación en vivo de cada rama — 2026-11-20 (BR-03)

Se reconsultaron los HEAD de las 108 ramas del inventario: 108 presentes, **106 SHA estables**, dos avances legítimos (`main` y `work/chat-narrative-foundation`). Además existen cinco ramas creadas después del inventario, sin incluir la rama independiente de esta auditoría. Se cotejaron sus registros de rutas y blobs frente a `main` @ `019175c6463f`: **26** nombres de `tools/` y **32** de `tests/` ausentes en el consolidado (diferencias de archivo, no pruebas de implementación). Se preservan las 108 fichas originales como instantánea inmutable; la comparación actualizada y el dictamen individual de las 113 ramas están en [informe](BRANCH_LIVE_VERIFICATION_2026-11-20.md) y [JSON](BRANCH_LIVE_VERIFICATION_2026-11-20.json).

La revisión detallada de código se concentró en la cola diferida, PR #11 (agendas), #12 (decisiones) y #13 (relaciones); siguen pendientes integración y pruebas por SHA cuando corresponda. Los estados en vivo de PR #10–#15, #27, #33, #78–#80 y #82 fueron reconsultados. **La verificación completa funcional por rama NO está terminada.** La nueva documentación se mantiene en rama/PR aislada, sin alterar canon ni los cinco archivos de checkpoint. La CI exacta de esta rama debe anotarse tras ejecutarse.

**Próximo paso:** completar revisión funcional de decisiones/social/deferred, luego ramas cartográficas por dependencias y finalmente custodia de QA/journal/backup; documentar para cada HEAD archivos, contratos, riesgos, test y decisión de integración.

### Lote de inspección funcional 01 (2026-11-20)

Revisión estática de `work/meridian-bay-causal-routines-20261112`, `work/meridian-bay-causal-decisions-20261112`, `work/meridian-bay-social-relations-20261112` y `work/living-world-between-turns-20261112`. Se inspeccionaron módulos, importaciones, hooks de coordinador y suites históricas (13 casos para decisiones, 14 para relaciones). **Incompatibilidades confirmadas por lectura:** `review_metadata` y `social_context` no se transportan por el coordinador `main`; los hooks de cola diferida no están integrados; la agenda sigue como PR #82 borrador. **No se ejecutaron tests de los HEAD antiguos.** [Ver evidencia y dictamen por rama](BRANCH_FUNCTIONAL_AUDIT_LOT_01_2026-11-20.md).
