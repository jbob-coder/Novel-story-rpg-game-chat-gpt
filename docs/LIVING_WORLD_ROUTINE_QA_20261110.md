# Verificación de rutinas autónomas — 2026-11-10
**Alcance:** implementación de diseño aislada en `work/living-world-design-review-20261110`. NO canon nuevo; NO cambio de la historia.

## Resultado ejecutado
- Entorno local: Node.js v22.16.0.
- Comando reproducible: `node --test tests/living_world_availability.test.mjs tests/living_world_routines.test.mjs`
- **38 pruebas PASS, 0 FAIL, 0 SKIP**. Incluye 18 pruebas de disponibilidad/rutas y 20 de propuestas de rutinas, rutas derivadas del estado, confidencialidad y borradores de eventos.
- Defecto hallado antes del cierre: variable `oday` no definida en `stageNPCResolution`, corregida a `day`. También se reparó un defecto de codificación durante la subida inicial del módulo. Las pruebas de 38 casos se ejecutaron **después de ambas correcciones**.

## Identidad exacta de código ensayado
Las SHA Git blob de los cuatro archivos ejecutados localmente con `git hash-object` coincidieron con las leídas de GitHub en esta rama:
- `tools/living_world_routines.mjs`: `5c1e24617eb6c20632fae6eacf6f40f46663ae64`
- `tests/living_world_routines.test.mjs`: `0f2d1b8a89e1adf65484e9501506c8297ccca529`
- `tools/living_world_availability.mjs`: `0d87ebe336ff8aebacdc30345b497ac4d42e0abf`
- `tests/living_world_availability.test.mjs`: `aedc5d6aab7edb553da42a8ee86832d2a933bcee`

## Límites y próximo paso
`previewNPCRoutines` devuelve **candidatos privados**, no resultados de eventos. `stageNPCResolution` produce un borrador que **no modifica el estado** ni ha sido integrado en el orquestador de cinco archivos. Requiere resolución causal, validación de cambios del actor mediante `tools/state_changes.mjs`, revisión narrativa, persistencia transaccional y readback de todos los archivos antes de avanzar un turno real. Los horarios y la ubicación de la escuela/vecino siguen desconocidos. Ninguna prueba ejecutó el flujo real del narrador ni el guardado remoto.

`game/SAVE_MANIFEST.json` se releyó después de los commits: capítulo `CH-000`, turno `9`, `EV-000029`, `TXT-000020`; blob SHA sin cambios `897ec2e77ece4f8edf506c7058552a5dd3cdb320`.

**No fusionar automáticamente**; revisar integración antes de operar sobre la partida.
