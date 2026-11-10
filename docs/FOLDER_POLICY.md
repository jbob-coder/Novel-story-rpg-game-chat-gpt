# Organización estable de carpetas — autoridad única

## Puntos de entrada y árbol
- `INDEX.md` y `AGENTS.md`: inicio y orden de lectura.
- `docs/00_start`, `01_world`, `02_characters`, `03_systems`, `04_story`, `05_persistence`, `06_quality`: índices temáticos.
- `game/characters`, `game/world`, `game/equipment`, `game/saves`: índices de datos; no duplicados canónicos.
- `chapters/CH-NNN/INDEX.md`: identifica los archivos originales `chapters/CH-NNN.md`, `CH-NNN.events.json` y `CH-NNN.transcript.json`; se crea con cada capítulo.
- `tools/INDEX.md` y `tests/INDEX.md`: ayuda y verificación.

## Regla de rutas
Los archivos actuales conservan sus rutas. Los índices son navegación, **no la fuente de verdad**. Cuando un nuevo recurso se añade, actualizar `docs/FILE_INVENTORY.json`, el índice temático y los padres. Antes de commitear, validar enlaces relativos, IDs y que no aparezcan fuentes duplicadas.

## Orden de autoridad
1. Decisiones aprobadas y canon.
2. Transcripción **literal guardada** y eventos causalmente correctos.
3. Estado/manifest coherentes.
4. Prosa del capítulo para lectura.
5. Índices, estado de QA, handoff y contexto conversacional (referencias auxiliares).

Si falta un archivo, la transcripción no coincide con eventos, o los IDs divergen: **GUARDADO BLOQUEADO**. No adivinar ni reconstruir palabras originales.

## Guardados y recuperación
Aplica `docs/SAVE_BLOCKING_PROTOCOL.md`: siete etapas verificables y 100% solo después de leer y comparar cinco archivos del commit remoto. En error, dar porcentaje comprobado, razón y paso pendiente; no emitir nueva escena. Cuando termine el turno de respuesta, solo el siguiente input puede reanudar el proceso, tras verificar HEAD de GitHub. No hay ejecución en segundo plano.

## Nueva sección / capítulo
Para CH-001: crear los tres archivos canónicos, `chapters/CH-001/INDEX.md` y actualizar `chapters/INDEX.md`, inventario y manifiesto en transición validada. Evitar mover historia previa o sobrescribir trabajo de otros agentes. Los archivos actuales del capítulo 0 se mantienen.

## Privacidad
Repositorio público: solo ficción destinada a publicarse. Excluir datos personales reales, credenciales y detalles privados ajenos al juego.
