# Lote 10 — PR #126–#131: custodia, memoria NPC y evidencia de accesos (2026-11-22)

**Alcance:** auditoría por SHA de seis PR, incluidos tres espejos temporales de QA. Trabajo en rama independiente desde [PR #124](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/124) @ `4f76f51becbd7af8ebe6c281d0e85dbfca3bfaf6`. Fuentes: `get_pr_info`, comparaciones Git, árbol completo, archivos originales y GitHub Actions. La [matriz estructurada](BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.json) y los [tests locales](../../tests/branch_security_access_lot10.test.mjs) permiten comprobar la consistencia del corte. **No se fusiona, no se autoriza narrar ni se certifica una calle.**

**Main comprobado:** `019175c6463ff31807a0f7013d91299add94913c`. CH-000 turno 9. El código nuevo de las PR revisadas es independiente del checkpoint guardado.

## Revisión de las tres aportaciones

| PR | HEAD exacto y base | Dif exclusivo | Resultado CI de ese HEAD |
| --- | --- | ---: | --- |
| [#126](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/126), análisis de accesos M1/P1 | `8659fbdfec0e87bdaa2990254468f4a154d37d91` sobre [#122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) `1daa0e8de0859bbab03361342908a265d309b86a` | 8 archivos | [45082626318](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082626318): **537/537 Node**, **47/47 Python**, checkpoint PASS |
| [#127](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/127), referencia del conocimiento NPC | `ae42f871e3ef336dc69a23dca1ba8e861b30cc8d` sobre [#118](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/118) `414896744036731949aab7ee2a687d29efb80f9a` | 8 archivos | [45082823222](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082823222): **484/484 Node**, **47/47 Python**, checkpoint PASS |
| [#130](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/130), comparador Plaza–Coast 01 | `34898eb209472ad4f429c06e6d2b3df6c67f2d55` sobre [#114](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/114) `26560ccc1fb859cc7372967b54d7354c854fc92a` | 7 archivos | [45082859326](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45082859326): **514/514 Node**, **47/47 Python**, checkpoint PASS |

Los espejos QA [#128](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/128) → #126, [#129](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/129) → #127 y [#131](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/131) → #130 coinciden exactamente por **SHA del commit** con su PR fuente. Cada pareja tiene **una sola ejecución distinta**; no contar pruebas duplicadas como suites independientes. Las tres ejecuciones estaban en estado `completed/success` al consultarlas. #128 y #129 estaban cerradas sin fusión; #131 seguía abierta, a cargo de la rama correspondiente, pese a tener CI aprobada.

## Hallazgo funcional prioritario: memoria NPC no documentada

En la cadena [#82](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/82) → [#98](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/98) → [#108](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/108) → [#118](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/118) → **#127**, la versión previa de reconstrucción social tomaba la lista de conocimiento **final** y restaba las adquisiciones posteriores. Por eso, un dato insertado únicamente en el estado final podía pasar por conocimiento antiguo sin evento de adquisición.

#127 introduce `tools/living_world_knowledge_anchor.mjs`: **29 entradas exactas de siete NPC** del `game/STATE.json` histórico, blob `3f4e9c98a7211068faefd31d0a0acbd4260ef589`, en CH-000 turno 9, EV-000029. El verificador reproduce adiciones posteriores desde el ancla, exige fuente y evento y rechaza sustituciones, transferencias sin evento y contactos atribuidos antes de la frontera. Ocho pruebas nuevas ejercitan ese límite de forma sintética. Su CI final aprobó todas las suites. **No se afirma que se conozca el día en que cada NPC adquirió sus hechos anteriores al turno 9**, ni que la referencia Git sea una firma externa independiente. Ningún turno sintético fue persistido.

**Puerta de aceptación:** exigir que el ancla histórica permanezca ligada al blob real, preservar la política de migración explícita si cambian NPC o memorias y comprobar la cadena NPC integrada sobre un nuevo SHA combinado. El éxito de CI de #127 solo prueba esa rama.

## Auditoría de accesos físicos: no admitir trayectos inexistentes

**#126:** fuente #122 divide la cobertura faltante en M1, M2, M3, P1 y P2. #126 comprueba referencias de Market/Café Bruma y Crosswater Plaza/terminal, con radios de incertidumbre en un lienzo ficticio, no mediciones urbanísticas. Cercanía o acceso público a un **lugar** no garantizan acceso al **corredor**. M1 carece de salida física pública verificada; P1 coincide en dibujo con trazos de plaza/terminal sin certificar un derecho de paso.

**#130:** la rama hermana del corredor Plaza compara las rutas propuestas de #106 y #103 a partir de #114. Ambas parten del segmento ilustrativo `(65,42) → (66.9,40.6)` de longitud **2.360085 unidades de lienzo**, íntegramente sin detalle geométrico. La longitud sin detalle de #106 es **3.638721**, frente a **4.611400** para #103. Son cifras de bocetos, no metros, duración ni evidencia de que se puede caminar. Los datos históricos están fijados por blob. No se elige una variante física por su menor vacío documental.

## Dependencias que permanecen pendientes

1. **Geografía principal:** #86 → #87 → #89 → #103 → #112 → #122 → #126. La alternativa #110 parte también de #103 y modifica el mismo informe de cobertura que #112 con bytes distintos; **no fusionar ambas sin reconciliación**. La cadena de Plaza es #86 → #87 → #94 → #101 → #106 → #114 → #130; no es una continuación de #103.
2. **Origen de #122:** el HEAD/base real de su PR madre #112 es `f2e71276be59fd09ea6684ef4e80232ed2f71f17`; su reporte aún cita `616c6155a279bf0126f07ccc46536665179731b5` como «Base Git». La nota [de auditoría en PR #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) (comentario 7087441989) pide aclarar revisión histórica frente a base actual. Es inconsistencia documental, no prueba de corrupción del guardado.
3. **Integración documental:** #83 → #92 → #99 → #116 → #124 → este lote. Las PR han sido tratadas como borradores apilados; cada HEAD y base debe releerse antes de integrar. Las rutas compartidas `docs/FILE_INVENTORY.json`, `docs/01_world/INDEX.md` y `tests/INDEX.md` necesitan reconciliación aditiva y pruebas combinadas.
4. **Protección:** no cambiar `game/`, `chapters/`, journal, vínculos canónicos ni el tiempo del mundo. Los cinco Git blob SHA del guardado son exigidos por pruebas independientes del lote, en la rama documental y mediante checkout de CI.

**Dictamen:** las tres PR de trabajo tienen ejecución satisfactoria sobre su **HEAD exacto**, con condiciones de integración pendientes. La matriz es una fotografía fechada; nuevos commits o PR posteriores requieren otra consulta. Las pruebas del lote revisan consistencia de esta captura, no un monitor de GitHub en tiempo real.
