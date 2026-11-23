# Lote 11 — Referencia fijada del conocimiento NPC (turno 9)

**Fecha de extracción:** 2026-11-22. **Estado:** trabajo de integración en rama `work/npc-social-knowledge-anchor-20261122`, apilada sobre [PR #118](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/118). Las PR #108, #98 y #82 son dependencias transitivas; ninguna está fusionada en `main` por este lote.

## Problema auditado

El Lote 10 introdujo una reconstrucción cronológica de conocimiento para testimonios de NPC a través de `allEvents(snapshot)`. Sin embargo, empezaba con `final actor.knowledge` menos las adquisiciones de eventos con `after`; un dato añadido **solo al estado final**, sin ningún evento de adquisición, se interpretaría como conocimiento antiguo. Este es un riesgo de *falsa memoria heredada*: un NPC podría supuestamente saber antes lo que nunca se había documentado.

No se debe remediar reinterpretando eventos heredados sin `after`, inventando la fecha de aprendizaje de cada NPC ni modificando los registros históricos.

## Fuente exacta e identidad

El fichero `tools/living_world_knowledge_anchor.mjs` conserva **29 entradas de conocimiento de siete NPC** registradas en el checkpoint autoritativo en **CH-000 / turno 9 / EV-000029**. La fuente es:

- `main` en commit `019175c6463ff31807a0f7013d91299add94913c`, verificado antes de la extracción.
- `game/STATE.json` Git blob SHA-1 `3f4e9c98a7211068faefd31d0a0acbd4260ef589`; misma huella en la PR #118 de base.
- La referencia incluye los **contenidos exactos** de `world.actors[ID].knowledge` existentes: tanto hechos iniciales como registros de eventos antiguos. **No afirma** que todos se conocieran ya al principio del capítulo.
- `tests/npc_social_knowledge_anchor.test.mjs` recompone de los bytes originales la huella Git (formato `blob <length>\\0<bytes>`) y compara todos los 29 textos, siete propietarios, identificador de evento y número de turno. Esto impide una referencia que accidentalmente difiera del checkpoint leído por la suite.

**Alcance de la palabra “fijada”:** la referencia es un dato versionado y trazable mediante Git con verificación cruzada de contenido. **No** está firmada externamente ni es invulnerable a alguien con permisos para alterar tanto el código de validación como la referencia y sus tests.

## Contrato de recuperación modificado

El verificador `verifySocialKnowledgeChronology` (en `tools/living_world_social.mjs`) se ejecuta dentro de `verifySocialEventHistory` cuando existen eventos sociales y:

1. Rechaza inmediatamente un encuentro social atribuido a `EV-000029` o cualquier evento anterior, **antes** de interpretar la estructura del mensaje, y luego exige que el historial global contenga el evento frontera legítimo. No se pueden añadir encuentros retrospectivos al registro fijado.
2. Inicializa conjuntos/órdenes de conocimiento con la referencia **fija**, no con la memoria final potencialmente adulterada. NPC nuevos no incluidos comienzan sin conocimiento acreditado; requieren una adquisición explícita posterior para poder comunicar información.
3. Reproduce exclusivamente los eventos posteriores a `EV-000029`, en el orden del historial consolidado incluyendo capítulos cerrados. Las adquisiciones `field=knowledge` exigen `after` y correspondencia exacta con `fact`, `source`, propietario del evento y `EV-ID`. Un duplicado idéntico se rechaza.
4. Para cada encuentro social exige que el emisor ya conozca `transfer.known_entry` **antes** del evento emisor. La información atribuida sigue siendo testimonio, no verdad objetiva.
5. Compara al final la memoria de **cada NPC** con la lista ordenada `referencia + adiciones causales posteriores`. Un dato nuevo inyectado, una sustitución antigua, una copia de conocimiento de otro NPC sin evento o una memoria omitida fallan sin exigir cambiar el checkpoint.

Los eventos previos a la frontera siguen custodiados por el historial canónico y los validadores existentes. Como algunos carecen de `after`, su momento real de adquisición no se certifica retroactivamente; la frontera es el **turno 9**, no el inicio del mundo.

## Pruebas de regresión

`tests/npc_social_knowledge_anchor.test.mjs` contiene **ocho pruebas** en memoria: fuente Git/actor/turno exacta; conocimiento falso incorporado al estado final; modificación de conocimiento heredado; adquisición futura legítima y comunicación después; inconsistencia entre evento de adquisición y estado final; copia entre propietarios; encuentro falsificado anterior a la frontera; baseline y borrador intactos. El Lote 10 mantiene seis escenarios de continuidad entre capítulos.

**No son hechos del relato:** los turnos 10/11, intercambios privados y cambios en memoria de estas pruebas existen solo en objetos sintéticos; no se escriben en `chapters/`, `game/` ni en el journal de GitHub. No existe simulación en segundo plano, y pasar un test no autoriza avanzar a Jack.

## Integración, riesgos y siguiente decisión técnica

Para aceptar este lote se requiere QA real Node/Python/validador sobre el **HEAD final** con prueba de exactitud de inventario, enlaces y los cinco blobs canónicos. Registrar el workflow y cerrar la PR temporal de pruebas sin merge.

El diseño deliberadamente es **estricto**: si cambia el checkpoint inicial o se incorporan nuevos NPC que posean conocimientos heredados sin un evento de adquisición, se debe revisar una **migración explícita de referencia**, en vez de aceptar silenciosamente memoria no documentada. La derivación de información desde diálogos del jugador o testigos sin evento todavía no se autoriza. La siguiente tarea después de superar QA es definir criterios de migración del checkpoint de referencia y comprobar efectos de borrado/olvido deliberado solo si se incorporan al motor con cambios causales firmados.

## CI de desarrollo: fallo encontrado y cambio específico

La primera QA-only [#45082641534](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082641534) ejecutó **484 tests JavaScript: 483 PASS, 1 FAIL**, sin llegar a Python/validador. El test nuevo de encuentro antiguo falsificado esperaba el rechazo por **frontera temporal**; el verificador lo rechazó antes por una estructura inválida (`Malformed saved social context`). Este resultado confirmó que la falsificación se bloqueaba, pero también reveló un orden de diagnóstico menos específico del previsto. Se fortaleció `verifySocialEventHistory` para **comprobar primero que el evento social sea posterior a EV-000029** y solo después revisar participantes y mensaje; se mantuvo intacta la prueba y no se redujo ninguna validación. La primera nueva ejecución de CI, [#45082742597](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082742597) sobre HEAD `8373d4ecd4260dbae9e5a216a2139c1b6a9a9cd8`, completó **SUCCESS: 484/484 Node PASS, 47/47 Python PASS, validador canónico PASS**. El test histórico falsificado pasó sin modificar su expectativa original. Dado que esta documentación genera un commit adicional, se repetirá QA sobre el HEAD final antes de cerrar la PR temporal.
