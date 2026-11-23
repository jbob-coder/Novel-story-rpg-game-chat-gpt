# Estado reconciliado tras nuevo HEAD narrativo — 2026-11-20

Fuente verificada: `work/chat-narrative-foundation` @ `2820cca1bd5140ef8a9f2c94cf986feef0ef19cc`. La captura histórica del 19-11 tenía como fuente `0efd2586ac8647faae10eb84695437dca430df04`.

## Diferencia importante

El último HEAD de la fuente añadió un incremento para necesidades cualitativas de NPC y servicios establecidos de Meridian Bay. El commit `2820cca1bd5140ef8a9f2c94cf986feef0ef19cc` incorporó `tools/living_world_needs.mjs`, `tools/meridian_bay_services.mjs`, pruebas de integración y validadores; fue confirmado como `success` por [CI #44754070198](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44754070198) y [CI #44753956402](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44753956402). Ya no deben volver a portarse ciegamente esos módulos desde los PR históricos #14, #15 o #27.

**El árbol vigente tiene 163 archivos, antes 157.** Recomparando las mismas 108 capturas históricas con las rutas del árbol vigente, hay **26 nombres de archivos `tools/`** no presentes en la fuente (antes 28), y **32 nombres `tests/`** no presentes (antes 34). No son 26 funciones aprobadas ni 32 suites ejecutadas. La matriz de 19-11 sigue siendo una instantánea histórica y no se reescribe.

## Reconciliación de la PR documental

La rama documental tenía 25 archivos nuevos de auditoría. Se propone incorporarlos sobre el árbol más reciente junto con este informe y solo actualizar índices e inventario. Resultado esperado: **189 archivos versionados** (163 existentes + 26 documentales). Deben conservarse los blobs de `game/`, `chapters/`, `tools/` y `tests/` exactamente como están en el nuevo HEAD narrativo.

La fuente mantiene `CH-000`, turno **9**, `EV-000029`, `TXT-000020`; no se ejecutó ningún turno ni admisión nueva. La CI confirma las suites de ese commit, **no** la verificación funcional de las 108 ramas.

## Próximas piezas

Revisar decisiones causales, encuentros sociales y planificación de NPC en pequeños incrementos contra el nuevo motor; después, mapas de Meridian Bay por secciones. No fusionar ramas de pruebas, diarios ni respaldos. Conservar el diseño narrativo y pedir verificación de CI para cada candidato.

**Pendiente de esta operación:** validar el árbol fusionado, el inventario, los enlaces y la CI exacta de PR #80 antes de marcar la reconciliación como terminada.
