# Meridian Bay — auditoría cruzada de rutas Harbor (2026-11-22)

**Clasificación:** informe de ingeniería privado, comparador de borradores, **NO mapa canónico**, sin autorización de movimiento, NPC, tiempo ni modificaciones de la partida.

## Procedencia y topología de ramas

Rama `audit/harbor-route-alternatives-20261122`, basada en el commit exacto `070f36dac9fe63603a3fd7dcacf3f6cceb569b69` (PR #94). Esta es una pila de auditorías #94 → #87 → #86, cada una **sin fusionar**. La rama de esta auditoría no debe fusionarse directamente a `main` ni heredar decisiones ficticias de un borrador histórico.

Las fuentes JSON son las archivadas desde las PR históricas y se verifican con identidad Git antes de su uso. Se cotejaron además con los archivos originales de sus HEAD históricos (noviembre 22 de 2026):

| PR | HEAD original consultado | Fuente conservada (Git blob SHA-1) |
| --- | --- | --- |
| [#44](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/44) | `1b51a0050deb95309b4380768cb13a3139019dbc` | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` |
| [#58](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/58) | `b11332aa53796717cf299bebccf043d72620220e` | `280a444f6eed99a33027aea2edb48af70cc67bd0` |
| [#56](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/56) | `199b3843085d8b4b2ab92739357263d598757331` | `a5ac772922b4717797118b15f182207be1d1a7fb` |
| [#67](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/67) | `8bdf34c5eddf4e12e34352018b2a893cb9a14056` | `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7` |

Ninguna fuente se mueve ni altera. Los tramos #44 y #58 representan **dos alternativas para la misma conexión de grafo Market Row–Harbor Walk**, no dos calles definitivamente existentes. Plaza–Harbor es otra conexión de grafo que se conserva independientemente.

## Resultados reproducibles de intersección

La inspección se realiza **solo contra el Coast 01 alternativo de PR #67**, que sigue siendo un boceto no aprobado. Los índices de tramo y de arista de este informe comienzan en 0 en el código.

| Diseño | Nodos / tramos | Cruces estrictos | Segmento afectado (0-based) | Longitud en unidades del lienzo |
| --- | --- | --- | --- | ---: |
| #44 Market–Harbor A | 5 / 4 | 1 cruce con `HC-A-OLDTRACE` (traza hipotéticamente bloqueada), segmento 1 de la traza | 3 | 14.996483 |
| #58 Market–Harbor B | 6 / 5 | 1 cruce con `HC-A-OLDTRACE` (traza hipotéticamente bloqueada), segmento 1 de la traza | 4 | 15.758878 |
| #56 Plaza–Harbor | 5 / 4 | 2 cruces con `HC-B-01`, aristas 1 y 2 | 2 | 7.837531 |

La ruta #44 mide **4.84% menos unidades de lienzo** que #58 según estos puntos aproximados (diferencia ~0.762395 unidades); eso **no representa distancias de calles reales**, preferencias de viaje, seguridad, accesibilidad ni aprobación de la ruta. Ni siquiera la longitud en pantalla puede usarse para fijar kilómetros o minutos.

Los cruces con `HC-A-OLDTRACE` no significan automáticamente calle cortada: la traza, su estado de bloqueo y ambas rutas son supuestos no admitidos. Los dos cruces de #56 contra `HC-B-01` son inconsistencias de dos propuestas de trazado, no evidencia de una edificación física confirmada.

## Cobertura y decisiones no tomadas

- `tools/meridian_bay_harbor_route_comparison.mjs` verifica la procedencia por SHA, los anclajes y conexiones reales, la continuidad de cada ruta, los cruces estrictos entre segmentos, los puntos internos de edificios y los contactos de borde. Rechaza segmentos de longitud cero y coordenadas inválidas.
- `tests/meridian_bay_harbor_route_comparison.test.mjs` comprueba cada hallazgo por tramo/arista y casos sintéticos de ruta contenida, tangencia, traza bloqueada y alteración del estado guardado.
- El inspector no crea caminos, accesos al puerto, edificaciones, derechos de paso, nueva ubicación, distancias reales, minutos de viaje ni resultados narrativos. La longitud se presenta solo para contrastar las geometrías abstractas.
- Los contactos geométricos no certifican restricciones físicas: faltan medidas, topografía, anchos de acera, accesibilidad, barreras reales, propiedad y autoridad editorial.
- **Decisión no tomada:** escoger #44 frente a #58, adoptar #56, o mover/eliminar el edificio candidato `HC-B-01`. Son propuestas incompatibles que requieren revisión del plano local. No modificar automáticamente su geometría.

## Siguiente comprobación

Ejecutar Node, Python, verificador del checkpoint e inventario completo en **HEAD exacto** de la nueva rama, y comparar los cinco blobs narrativos contra PR #94 y `main`. Mantener la PR de trabajo en **draft**. El siguiente diseño comparativo debe revisar una alternativa de alineación Plaza–Harbor o de huella `HC-B-01`, con cambios reversibles y fuentes preservadas, antes de discutir aprobación física.
