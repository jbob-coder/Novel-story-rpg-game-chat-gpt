# Cierre de verificación de ramas — PR #150, #152 y #154 (22-11-2026)

**Alcance cerrado de esta ficha:** revisar las últimas tres PR de trabajo que no estaban incluidas en el lote 12; comprobar sus tres espejos QA, sus HEAD exactos, registros de Actions, diferencias exclusivas, inventarios, cinco archivos narrativos protegidos y el estado del conector. No fusiona ninguna rama ni amplía la novela.

Repositorio: `jbob-coder/Novel-story-rpg-game-chat-gpt`. Auditoría basada en la PR #148 (`e4461c0eda4cfe7415935c9bb39a5859c67d5939`). `main` observado: `019175c6463ff31807a0f7013d91299add94913c`. Motor establecido: **novela interactiva solo dentro de ChatGPT**. Herramientas Node/Python son soporte de integridad/estado, NO otro motor narrativo.

## Tres ramas pendientes, verificadas individualmente

| PR de trabajo | Base de desarrollo | CI oficial exacto | Árbol e inventario | Conclusión |
| --- | --- | --- | --- | --- |
| [#150](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/150) `8737f29e45bd74cc8c29f6289d6df251922ffd9e` | #132 `07c1e099...` | [45084135573](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45084135573): **555/555 Node; 47/47 Python; checkpoint PASS** | **236/236**; 5 añadidos, 4 modificados, 0 borrados | M2/M3/P2 estudiados; 18 accesos físicos sin confirmar; no se admitió carretera |
| [#152](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/152) `8d5b323897770d098699279fd232564a160118ec` | #142 `ef6c3340...` | [45084194123](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45084194123): **589/589 Node; 47/47 Python; checkpoint PASS** | **244/244**; 4 añadidos, 4 modificados, 0 borrados | Franja M1 hipotética cotejada con huellas dibujadas; sin certificación física |
| [#154](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/154) `5221300eacee3d0c71dd48be2b41800149097ba1` | #138 `e9ff3c74...` | [45084569977](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45084569977): **516/516 Node; 47/47 Python; checkpoint PASS** | **210/210**; 3 añadidos, 9 modificados, 0 borrados | Admisión de identidad NPC causal probada sintéticamente; no se ha aplicado a la partida |

Las PR espejo #151, #153 y #155 apuntaron **al mismo commit** de su PR respectiva para activar el workflow con base en main. Están **cerradas sin fusionar**. No representan otros tres motores ni otros tres cambios de juego. Cada una de las tres pruebas CI es independiente y no acredita compatibilidad de un merge de las ramas.

Los registros oficiales de cada ejecución muestran `conclusion=success`, `fail 0`, `skipped 0`, las 47 pruebas Python y validador de checkpoint PASS. Se compararon por separado las cabezas con sus padres Git: 0 archivos suprimidos en todas, y el inventario contiene exactamente las rutas del árbol (sin faltantes ni sobrantes). Los cinco Git blobs de `game/SAVE_MANIFEST.json`, `game/STATE.json`, `chapters/CH-000.md`, `chapters/CH-000.events.json`, `chapters/CH-000.transcript.json` coinciden con main en las tres ramas.

**Conflicto de integración documentado:** las tres ramas cambian `docs/01_world/INDEX.md`, `docs/FILE_INVENTORY.json`, `tests/INDEX.md` y `tools/INDEX.md`, además de sus archivos exclusivos. Una sustitución completa de un índice por el de otro agente perdería registros. Si algún día se autoriza un merge, requerirá reconciliación de índices y CI independiente sobre el SHA combinado; este cierre **no autoriza ese merge**.

## Validación adicional del conector — cinco archivos con bytes modificados

Se realizó una prueba propia del conector GitHub en las ramas aisladas `qa/chatgpt-fivefile-delta-recovery-20261122` y `journal/qa-chatgpt-fivefile-delta-20261122`, sin alterar el journal auténtico. Origen autorizado `work/chat-narrative-foundation` @ `2820cca1bd5140ef8a9f2c94cf986feef0ef19cc`.

1. Se obtuvo el HEAD y los cinco blobs originales, y se prepararon cinco nuevas versiones cuya **única diferencia es un salto de línea final**. Los cuatro JSON mantienen exactamente sus valores; el Markdown conserva el relato literal.
2. Se creó el árbol de prueba `8289cc2b013eb467b801afd92dc2050588b2b0e2` con cinco blobs distintos; se grabó y releyó un journal QA en estado `blocked` **antes del commit**.
3. Se creó el commit separado `cd61b86496a7d2d8e81bc70e9cedabe07f610784`, se registró y releyó en el journal QA mientras la rama de prueba seguía en el HEAD original. Se dejó una frontera real entre llamadas para simular recuperación de una interrupción.
4. Una nueva lectura del journal localizó el commit sin depender de memoria conversacional; se actualizó solo la referencia QA de forma no forzada contra el HEAD esperado, se releyeron los **cinco archivos** y se comprobó contenido exacto y hash Git por archivo.
5. Se escribió el marcador final **QA-only verified** en un journal QA diferente al de producción, commit `79de5c8b86c65a068d5011b43ccb372ee06596f7`, y se releyó. `main`, rama de narración y journal real conservaron exactamente sus SHA anteriores.

**Conclusión de esa prueba: PASS de transporte con cinco bytes distintos y recuperación después de interrupción; NO prueba que un turno 10 válido se haya escrito ni que la respuesta se haya entregado al lector.** Otra PR concurrente, [#156](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/156), contiene un experimento sintético diferente; su propio CI y su journal deben verificarse por separado antes de declararlo PASS. Este cierre no depende de mezclarlo ni avalarlo.

## Estado narrativo autorizado y límites del cierre

En `work/chat-narrative-foundation` se comprobó la coincidencia literal de cinco blobs con main: CH-000, turno 9, día −29 por la mañana, `EV-000029`, `TXT-000020`, Jack en `LOC-WILSON-WORKSHOP`, `pending.type=await_player_action`. El journal de producción sigue `verified` únicamente para la operación anterior `world_admission`; **no registra turno 10**.

**Terminado para este chat:** recuento de ramas originales y revisión funcional documentados en lotes 01–06; cadena de dependencias y revisiones posteriores documentadas en lotes 07–12; PR #150/#152/#154 verificadas en este cierre; transporte y recuperación de cinco archivos cambiados validado de modo no canónico. No hay que seguir ampliando mapa o sistemas de NPC para finalizar este encargo.

**Fuera de alcance o no probado:** combinar o fusionar todas las ramas; juego independiente/Android/Godot; autorizar geometría física; aplicar NPC nuevos en canon; autorizar jugador turno 10 sin acción expresa; probar entrega visual de un texto; guardado real de un turno elegido por el usuario. Esas acciones no deben simularse como terminadas.

Ver la [matriz de evidencias](BRANCH_CLOSEOUT_PR150_154_2026-11-22.json) y la [entrega para abrir un chat nuevo](CHATGPT_ONLY_HANDOFF_2026-11-22.md).
