# Meridian Bay — Harbor Coast fragment 01: source-preserved geometric repair (2026-11-20)

**Branch:** `work/harbor-coast-fragment-review-20261120`. **Source baseline:** `main` @ `019175c6463ff31807a0f7013d91299add94913c`. **Status:** detached spatial review, **not** an admitted, playable or fully surveyed area.

## Provenance and isolation

- Source [historical draft PR #66](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/66): `work/meridian-bay-harbor-coast-fragment-20261117` @ `d5f8af27779aa49ecfa082e091f6bb57308a146a`. The original `MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json` has Git blob SHA `81ef8da51951205394ba050fe6f867bfc00d7244`, independently fetched and **copied byte-identically** in this branch.
- The historical source PR #66 depends on historical clinic PR #64, which depends on grocery PR #62 and older, unmerged drawing branches. This port **does not** copy those dependencies, rewrite the saved graph, add character activity or choose between competing corridors.
- A second file, `MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json`, is an editable **review variant**, not a replacement of the original. Its `review_2026_11_20` object records the source HEAD/blob, main baseline, geometry changes and route-tail conflicts.

## Verified physical inconsistency and reversible repair

The source drew an irregular shoreline with **16** vertices, a provisional **4-zone** land-use layout, **6** candidate building footprints and **6** proposed street alignments. Polygon `HC-Z-FREIGHT` intersects the fragment's *own proposed coastline* at **two strict edge crossings**, even though the polygon is intended as land use. This is a **topology error internal to a provisional illustration**, not a claim that the actual Meridian Bay coastline is known.

- Unchanged source: freight boundary segment `(71.9,33.8) → (72.5,35.6)` cuts the draft coast twice.
- Revised **only this polygon** by inserting landward controls `(71.8,34.6)` and `(72.02,35.1)`. The patch grows from **7 to 9 vertices**.
- Computed topology: original **2** strict line crossings; corrected **0**. All land-use/footprint/street vertices remain inside the study box and on the draft land side of the proposed coast; corrected polygon does not self-intersect. All other source JSON objects remain identical by structural comparison.
- **No real-world survey, verified road, pier, port gate or new building is authorized.** Review can be reversed without modifying the immutable historical snapshot.

## Critical separation: saved edges vs provisional geometry

`game/STATE.json` already has reciprocal `LOC-COMMERCIAL-DISTRICT` ↔ `LOC-HARBOR-WALK` and `LOC-CROSSWATER-PLAZA` ↔ `LOC-HARBOR-WALK` graph edges. The revised draft keeps Harbor Walk's provisional city-scale reference **(71,37)**.

But `HC-A-MARKET` starts at **(69.5,36.7)** from the conflicting/unmerged Market–Harbor corridor design **#58**; `HC-A-PLAZA` starts at **(70.1,37.85)** from unmerged draft **#56**. These drawing tails are **not surveyed approaches** and are not evidence that either variant was chosen. An existing saved link proves neither route geometry nor walkability of the illustrated tail, nor travel minutes.

**Visualización histórica y revisada:** el [SVG original](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.svg) permanece **idéntico** a la fuente de PR #66 (blob `56e6ba7a830fdc53e6dcff205871b3af57e7c04e`) y muestra el diseño anterior. El [SVG revisado](MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.svg) es un archivo **diferente**, generado a partir del JSON corregido. El generador determinista `tools/render_harbor_coast_svg.mjs` compara las 11 geometrías poligonales y 7 polilíneas históricas con la fuente y vuelve a dibujar esos 18 elementos con coordenadas del JSON revisado; `tests/harbor_coast_svg_sync.test.mjs` contrasta **cada vértice en píxeles** con el JSON (máxima diferencia 0.051 px por redondeo a una decimal) y el contenido SVG completo contra una regeneración independiente. El SVG no acredita topografía real, acceso, ruta ni canon.

## Code and tests

`tools/meridian_bay_harbor_coast_review.mjs` is a pure read-only inspector:
- `validateHarborCoastFragment({state})` verifies the current authored city-scale plan, Harbor/Market/Plaza identities and reciprocal graph links, archived Git blob, exact provenance, intended scope, 16-vertex monotonic coast, study box, candidate footprints, open seams, non-self-intersecting polygons, and shoreline intersection count.
- `countHarborShorelineIntersections(fragment)` exposes a pure **strict** line-intersection audit on candidate shapes. It intentionally does **not** certify real land, traffic, navigability, precision, complete overlap geometry or all accessibility conditions.
- `inspectHarborCoastFragment({state,includeDraftGeometry=false})` exposes a safe private summary; raw unadmitted geometry is opt-in and returned as a detached clone.
- `previewHarborCoastSavedTail({state,fromId})` can only inspect the two existing graph edges. No action, time change, player movement, NPC movement, discovery, route authorization or new locations are created.

`tests/meridian_bay_harbor_coast_review.test.mjs` adds **15** regression cases: immutable archived Git blob, exact two-crossing reproduction, corrected zero-crossing model, only two new vertices, source/variant semantics, detachable geometry, existing graph tail boundaries, unknown destinations, broken or duplicate reciprocal links, missing world/player, no service/ownership assertions, original SVG caution, and no save/turn changes.

**QA gate:** report the exact PR HEAD and completed Node + Python + checkpoint workflow **only after** the run finishes. Las ocho pruebas nuevas de sincronización SVG/JSON forman parte de la ejecución Node. Independently compare all five narrative Git blobs and the repository inventory; preserve `CH-000` turn 9.

## Open issues and next work

Physical road, sidewalk, seawall and accessibility geometry remain hypotheses. The draft does not solve potential overlaps between provisional land-use patches, resolve #44 against #58, or establish shoreline orientation or an actual city boundary.

La representación revisada ya se reproduce con `node tools/render_harbor_coast_svg.mjs --write` y tiene una suite de equivalencia visual/JSON. Una revisión futura deberá validar gráficamente el ensamblaje con fragmentos vecinos y resolver el trazado directo #44/#58 antes de cualquier aceptación cartográfica. No utilizar el SVG histórico como si fuese el dibujo revisado.
