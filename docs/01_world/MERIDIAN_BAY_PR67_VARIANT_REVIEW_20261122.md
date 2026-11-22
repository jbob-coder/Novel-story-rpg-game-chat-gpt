# PR #67 — auditoría de la variante costera 01 (2026-11-22)

**Ámbito:** verificación documental y gráfica de una propuesta física **no canónica**. No admite accesos, no altera `game/`, `chapters/`, diarios, decisiones, rutas ni el checkpoint de CH-000.

## Fuente y dependencias

- Repositorio: `jbob-coder/Novel-story-rpg-game-chat-gpt`; `main`: `019175c6463ff31807a0f7013d91299add94913c` al revisar.
- Rama de trabajo aislada: `work/harbor-coast-pr67-svg-review-20261122` desde PR #87 `3a923dab989c046b186370d2f441ad4a545c6c2f`; PR #87 depende de PR #86, así que **no fusionar esta rama independientemente**.
- Histórico PR #67, HEAD `8bdf34c5eddf4e12e34352018b2a893cb9a14056`: JSON Coast 01 `SOURCE_PR67_COAST_01_20261120.json`, blob `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7`.
- PR #66 Coast 01: JSON `81ef8da51951205394ba050fe6f867bfc00d7244`; SVG `56e6ba7a830fdc53e6dcff205871b3af57e7c04e`. PR #86 variante: JSON `dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9`.
- Las fuentes se conservan sin cambios. No se duplica el JSON histórico de PR #67.

## Diferencias exactas de PR #67 respecto a PR #66

| Dato de geometría hipotética | PR #66 | PR #67 |
| --- | ---: | ---: |
| `HC-Z-FREIGHT.polygon[3].x` | 72.5 | 72.25 |
| `HC-A-OLD.points[3].y` | 39.1 | 39.95 |
| `HC-A-OLD.points[4].y` | 38.9 | 39.3 |

| Variante | Conflictos costa/agua | Hallazgos calle/edificio |
| --- | ---: | ---: |
| PR #66 | 1 o más | 3 |
| PR #86 | 0 | 3 |
| PR #67 | 0 | 0 |

Conclusión técnica: la propuesta PR #67 elimina los dos tipos de incompatibilidad **del dibujo**, con solo tres cambios escalares. **No constituye aprobación de urbanismo, navegación ni paso físico.** La costa no está medida y la unión a Coast 02 `(75.1,42)` es un empalme entre bocetos.

## Artefactos y comprobaciones

- `MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_PR67_VARIANT_20261122.svg`: derivado determinísticamente del SVG original PR #66 y del JSON archivado PR #67, sin cambiar las fuentes.
- `node tools/render_harbor_coast_pr67_variant_svg.mjs --check`: confirma igualdad exacta del SVG derivado.
- `node --test tests/harbor_coast_pr67_variant.test.mjs`: valida blobs de fuente, tres cambios, conflictos, 11 polígonos, 7 polilíneas y límites del estado guardado.
- La PR #44 y la #58 siguen siendo diseños alternativos para Market–Harbor. La ruta #56 Plaza–Harbor sigue atravesando dos bordes del edificio candidato `HC-B-01`; no se ha seleccionado ninguna de ellas. Véase `MERIDIAN_BAY_THREE_REGION_SEAM_AUDIT_20261120.md`.

## Riesgos y criterios pendientes

Ejecutar Node, Python, integridad de inventario y validador del checkpoint **sobre HEAD final**; comparar los cinco blobs narrativos contra PR #87 y `main`. Mantener el PR en **draft**; no aplicar ni reemplazar PR #86 hasta revisión editorial explícita. La geometría no establece propiedades, accesos, desplazamientos, acciones NPC ni tiempo transcurrido.
