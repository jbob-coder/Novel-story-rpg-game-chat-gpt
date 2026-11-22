# Lote 11 — Comparación M1/P1: PR #132 frente a PR #136 (2026-11-22)

**Objeto:** revisión independiente de dos ramas concurrentes sobre accesos urbanos M1/P1 y de sus espejos QA. Esta auditoría parte del HEAD comprobado de [PR #134](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/134) `bf5112753d0bf46b3a77d57c3323f992ca9c9a74`. Su [matriz por SHA](BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.json) registra cabezas, bases, cambios exclusivos y ejecución histórica. [Regresiones de custodia](../../tests/branch_m1p1_comparison_lot11.test.mjs). **No se fusiona, no se modifica el mundo jugable y no se fabrica un mapa físico.**

## Qué pertenece a cada rama

| PR | Base exacta | Propósito y material exclusivo | QA sobre el HEAD |
| --- | --- | --- | --- |
| [#132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132) `07c1e099a83b22cdb5d993876d2ad284e08652b6` | [#122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) `1daa0e8de0859bbab03361342908a265d309b86a` | Herramienta y **14 regresiones** para contrastar siete archivos por blob; evidencia JSON M1/P1, límites narrativos y **SVG** de líneas de estudio sin calles aprobadas. Nueve rutas exclusivas respecto a su base. | [#45083183247](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083183247): **535/535 Node**, **47/47 Python**, checkpoint PASS (espejo QA [#133](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/133), cerrado sin merge). |
| [#136](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/136) `3a38d41d745075373170b790c1aab92cf8da4785` | [#126](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/126) `8659fbdfec0e87bdaa2990254468f4a154d37d91` | Conserva fuentes antiguas #40 Market–Crosswater y #54 Plaza–Terminal, coteja #44/#56, deriva una matriz de **12 requisitos de salida sin comprobar** (6 M1 y 6 P1), herramienta y 16 regresiones. Diez rutas exclusivas respecto a su base. | [#45083180688](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45083180688): **553/553 Node**, **47/47 Python**, checkpoint PASS (espejo [#137](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/137), cerrado sin merge). |

**Topología correcta:** #132 es una rama **hermana** de #126, porque ambas nacen de #122; #136 es **descendiente de #126**, no de #132. Las dos cabezas pueden funcionar individualmente y dar resultado de CI exitoso sin que exista una integración probada de sus cambios.

## Superposición comprobada de archivos

Las dos ramas modifican exactamente estas cuatro rutas compartidas frente a sus respectivas bases:

- `docs/01_world/INDEX.md`
- `docs/FILE_INVENTORY.json`
- `tests/INDEX.md`
- `tools/INDEX.md`

Los módulos, archivos JSON, SVG, informes particulares y pruebas de ambas ramas están en **rutas separadas**. Esto permite conservar sus aportaciones sin pisar código de implementación, pero **no garantiza** un merge limpio o semánticamente consistente. En particular, importar la documentación de #132 sobre #136 sin reconciliar los índices puede perder la procedencia histórica de #40/#54; importar #136 sobre #132 puede omitir el SVG y sus pruebas.

## Coincidencias y evidencia ausente

Ambas parten del estudio no canónico de la Sección 04, sin alterar los puntos M1 `(58.869565,42)→(60,40.7)` y P1 `(65,42)→(66.9,40.6)` del boceto. La PR #132 agrega contexto literario verificable (llegada a Café Bruma y observación del resplandor de terminal desde allí), referencias de grafo y un SVG. #136 conserva como evidencia archivada los trazados de las PR históricas #40 y #54, separados de las propuestas directas #44 y #56. **Una línea narrativa, una posición aproximada y una conexión entre lugares no certifican una acera pública.**

La matriz controlada en #136 deja los doce requisitos `status: missing` y `authoritativeProofRef: null`: salidas públicas precisas, puerta/fachada de café, bordes de plaza y terminal, servidumbres, cruces, anchura y pendientes. El dictamen correcto es **`BLOCKED_PHYSICAL_EXIT_NOT_ESTABLISHED`**, no que una calle exista o haya sido refutada físicamente. El JSON de #132 mantiene `canNavigate: false` y las huellas y derechos no documentados como `null`. Ambas decisiones deben mantenerse hasta que se incorporen fuentes urbanas nuevas debidamente revisadas.

## Defecto documental verificado — PR #132

En `docs/01_world/MERIDIAN_BAY_SECTION04_M1P1_ENTRY_EVIDENCE_20261122.md`, el Git blob para `game/STATE.json` aparece como:

- **Transcrito incorrectamente:** `3f4e9c98a7211068faafd31d0a0acbd4260ef589`.
- **Valor comprobado en `main`, árbol Git de #132 y código validador de #132:** `3f4e9c98a7211068faefd31d0a0acbd4260ef589`.

El código y el JSON generado de #132 usan el valor **correcto**; el problema identificado corresponde únicamente a la **cita en el informe**, no a una mutación de `STATE.json`. Se [registró comentario en PR #132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132) con ID `7087596687`, solicitando corrección en la rama propietaria y nueva prueba sobre el HEAD actualizado. **No se editó** la rama del otro agente.

## Puertas de integración sugeridas

1. Revisar en conjunto las propuestas originales de #122 y sus descendientes: #122 → #126 → #136 como cadena de custodia de fuentes físicas, con #132 como desarrollo hermano que ofrece un artefacto visual y contexto literario adicional. Es una **preferencia de revisión**, no selección irreversible ni autorización de fusión.
2. Preservar el JSON y SVG de #132, y el archivo de fuentes y matriz de bloqueos de #136; comparar las pruebas no redundantes y reconciliar de manera aditiva los cuatro archivos de índices/inventario.
3. Corregir antes la cita de SHA de #132 y exigir CI completa para **el nuevo SHA combinado**, sin reutilizar automáticamente el éxito de los dos HEAD individuales.
4. Mantener como bloqueados los doce requisitos y `canNavigate:false` hasta contar con autoridad de diseño físico y permiso editorial. No inventar parcelas, cruces, puertas, anchos, tiempos ni ruta accesible a Harbor Walk.
5. Conservar CH-000 turno 9, cinco Git blobs protegidos, journal y adyacencias guardadas. Los árboles completos de #132 y #136 se revisaron con `truncated=false`, con los mismos cinco hashes canónicos que `main@019175c6463f`.

**Estado:** dos PR de trabajo abiertas como borradores; dos QA espejo ya cerradas sin merge; CI individual verificada en cada SHA. **No existe en este corte evidencia de CI sobre la unión #132 + #136.** Esta comparación documenta qué integrar y qué no, sin crear una nueva ruta jugable.
