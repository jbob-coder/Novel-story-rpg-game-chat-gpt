# Leer primero — guía de consolidación (19-11-2026)

**Propósito:** saber en menos de un minuto **dónde está el proyecto, qué leer, qué falta y qué no se debe mezclar**. Este archivo es navegación de ingeniería, no canon narrativo ni autorización para adelantar una partida.

## Situación comprobada

- **Proyecto:** Living Superhuman World, novela interactiva jugada en ChatGPT (no RPG con niveles). Repositorio: [jbob-coder/Novel-story-rpg-game-chat-gpt](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt).
- **`main`**: SHA `52fcff9f2a9b`, solo README en la revisión; no contiene el desarrollo activo.
- **Fuente narrativa:** `work/chat-narrative-foundation` @ `0efd2586ac86`, con PR [#2](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/2) abierta y en borrador. Comparación contra `main`: 252 commits por delante, ninguno por detrás, 157 archivos cambiados (comprobación anterior). GitHub reportó que la PR era técnicamente fusionable; eso NO equivale a aprobación funcional.
- **Historia actual:** `CH-000`, turno 9, `EV-000029`, `TXT-000020`, día −29 por la mañana. Jack sigue en su taller. **No jugar turno 10 sin una decisión del jugador.**
- **Admisión de mundo:** 14 ubicaciones más contenedor de Meridian Bay en STATE; journal independiente `verified`, operación `world_admission`, `100%`. No repetir la admisión.
- **CI:** [#44540964561](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44540964561) acabó con `success` en el SHA de la fuente; no acredita las demás 107 ramas.
- **Inventario original:** 108 ramas (work: 63, audit: 4, qa: 32, journal: 5, backup: 3, main: 1); 79 PR. La nueva rama `docs/inventario-ramas-20261119` se cuenta aparte: 109 al crearla.

## Orden corto de lectura

1. [AGENTS.md](../../AGENTS.md) — decisiones y advertencias prioritarias.
2. [INVENTARIO_RAMAS_2026-11-19.md](INVENTARIO_RAMAS_2026-11-19.md) — todas las ramas con estado/PR/base y siguiente acción; [JSON](INVENTARIO_RAMAS_2026-11-19.json) para SHA completos.
3. [AREA_STATUS_AND_TASKS_2026-11-17.md](AREA_STATUS_AND_TASKS_2026-11-17.md) — qué falta por sistema y condiciones de cierre. **Es una instantánea histórica**, no actualiza automáticamente el mundo.
4. [BRANCH_AND_MAP_WORKSTACK_2026-11-17.md](BRANCH_AND_MAP_WORKSTACK_2026-11-17.md) — dependencias de mapas y PR; leer con atención porque PR #33, #78 y #79 ahora están integradas.
5. [STATUS.md](../STATUS.md) y [HANDOFF.md](../HANDOFF.md) — contexto de implementación; para cualquier partida consultar [SAVE_MANIFEST.json](../../game/SAVE_MANIFEST.json), estado, cinco archivos de historia y el journal vivo.

## Trabajo que todavía falta

- **P0, consolidación segura:** preparar PR #2 para `main`, actualizar descripción de estado viejo (turno 6), inspeccionar diff real y hacer pruebas exactas del candidato. No copiar QA ni respaldos.
- **P1, guardado de escena real:** demostrar un turno cambiado con journal y recuperación literal a través del conector, primero con QA aislada y después únicamente cuando exista acción auténtica del jugador.
- **P2, NPC:** decidir qué módulos de necesidades, servicios, relaciones y consecuencias faltan, sin importar dos versiones de la misma lógica.
- **P3, Meridian Bay:** integrar gradualmente diseño de carreteras, frentes urbanos, costa y regiones; no confundir lugar diseñado con visita o servicio probado.
- **P4, higiene del repositorio:** resolver ramas sin PR, redundancias e inventarios antiguos; mantener historial intacto salvo decisión explícita.

## Seguimiento y para qué sirve

La [tabla de las 108 ramas](INVENTARIO_RAMAS_2026-11-19.md) incluye ahora la columna **«Para qué sirve»**, para decidir qué aprovechar y evitar repetir código. Para saber **qué falta y quién debe verificarlo**, utilizar el [registro de seguimiento del desarrollo](SEGUIMIENTO_DEL_DESARROLLO.md); actualizar cada entrada con fuente, SHA, pruebas, bloqueo y siguiente paso. Las descripciones de uso inferidas por nombre son propuestas, no verificaciones de código.

## Precauciones

**Este informe no ejecuta el juego ni valida semánticamente cada archivo de las 108 ramas.** Sus conclusiones por rama usan metadatos de GitHub y, cuando no hay PR, el nombre. Un PR fusionado puede apuntar a una base que no es `main`. Prohibido convertir pruebas sintéticas en la historia, fusionar el journal, cambiar los cinco archivos de partida, avanzar Jack o inventar progreso.

**Última decisión recomendada:** documentar y revisar la base consolidada en una PR a `main`; integrar los borradores restantes por piezas pequeñas, con diffs y CI.
