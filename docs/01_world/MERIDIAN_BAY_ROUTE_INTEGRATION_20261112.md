# Integración del atlas y las rutas preconstruidas de Meridian Bay

**Fecha de diseño:** 2026-11-12. **Estado:** propuesta técnica independiente; no juega el turno 10 ni modifica el guardado canónico.

## Regla adoptada
La existencia de un lugar, que Jack conozca su ubicación y que Jack lo visite son **tres cuestiones distintas**. La ciudad y sus accesos se preparan antes de que Jack actúe. El narrador puede consultar su cartografía privada y solo atribuye conocimiento o una visita real cuando la historia ofrece una causa verificable y una decisión autorizada por el lector.

Los seis lugares preconstruidos del catálogo `game/MERIDIAN_BAY_PREBUILT.json` se encuentran en Railgarden (2) y Market Row (4). La nueva consulta `previewPrebuiltMeridianRoute` conecta ambos conjuntos con el mapa existente mediante rutas de grafo, acepta paradas explícitas y devuelve `unreachable` cuando una ubicación todavía no existe en el diseño. No avanza tiempo, mueve personajes, ejecuta encuentros, autoriza compras ni calcula minutos desconocidos. El diagnóstico privado `inspectLivingWorld` muestra las seis ubicaciones preconstruidas, pero `playerVisibleDiagnostic` no revela ese catálogo.

## Comparación con las trece fichas anteriores del atlas

**Documento de conciliación:** [MERIDIAN_BAY_ATLAS_PREBUILT_CROSSWALK_20261112.json](MERIDIAN_BAY_ATLAS_PREBUILT_CROSSWALK_20261112.json). Fuente histórica de diseño: `work/meridian-bay-district-blueprint-20261112`, blob `f30efb2ef27469d3375d693db2f1b48849de4fac` (PR #20).

- **2 equivalencias de diseño:** los Abarrotes de Railgarden (`MB-DES-RAIL-02`) y el negocio de Noah (`MB-DES-MARKET-01`) se relacionan de forma explícita con sus registros `LOC-*` preconstruidos. Son equivalencias entre *documentos de diseño*, no evidencia de visita ni modificación del checkpoint.
- **1 coincidencia temática, no identidad:** el patio de entregas `MB-DES-MARKET-02` y el punto de recepción `LOC-MARKET-DELIVERY-POINT` tienen funciones relacionadas, pero no está establecido que sean la misma instalación. **No se fusionan ni se crea un alias automático.**
- **10 referencias sin identidad de lugar preconstruido:** siete hipótesis aún sin aprobar, dos elementos existentes de Crosswater que no son inmuebles nuevos y la referencia escolar todavía sin dirección.
- **4 registros preconstruidos sin equivalente de identidad en el atlas anterior:** centro de atención de Railgarden, punto de recepción de Market Row, pasaje creativo y galería de servicios. El punto de recepción está relacionado temáticamente con el patio propuesto pero **no se ha identificado como el mismo lugar**.

Estas clasificaciones no establecen calles, horarios, interior de edificios, turnos de trabajo, conversaciones ni conocimiento nuevo de Jack. Las propuestas pendientes tampoco se vuelven rutas por aparecer en el atlas.

## Cómo se usa durante una escena
Si Jack decide dirigirse al negocio de Noah, el narrador consulta el catálogo preexistente y puede recuperar una cadena de conexiones válida desde el taller Wilson, por el hogar y Railgarden, hasta Market Row y la entrada pública del negocio. El tiempo de viaje sigue siendo aproximado y debe narrarse según las circunstancias, sin convertir una estimación en medida canónica. El negocio puede existir sin estar abierto y la tienda puede tener una entrada sin que Noah esté trabajando allí. Una escena posterior podrá establecer conocimiento, actividad y resultados a través de sus eventos, sin crear el local por primera vez.

## Estado de QA y próximos cambios
- Pruebas de ruta: acceso a Railgarden y Market Row, paradas en orden, regreso por enlaces existentes, lugares desconocidos, privacidad y ausencia de movimientos automáticos.
- Pruebas de conciliación: trece referencias exclusivas, dos identidades respaldadas por diseño, una asociación **no equivalente**, diez referencias pendientes/no nuevas, y ausencia de alteraciones de la partida.
- **QA oficial comprobado:** [GitHub Actions run 43360570281](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43360570281), código `41506d3865402645279b97192ad8b2e6e59ec828`: **272/272 pruebas Node.js**, **24/24 Python**, validador del checkpoint **PASS**, **0 fallos**. Esta edición documental posterior no modifica el código sometido a la prueba.
- **Integridad narrativa verificada:** los cinco blobs de `game/SAVE_MANIFEST.json`, `game/STATE.json`, `chapters/CH-000.md`, `chapters/CH-000.events.json` y `chapters/CH-000.transcript.json` coinciden uno a uno con la rama narrativa `work/chat-narrative-foundation`. Jack sigue en su taller, CH-000 turno 9, día −29 por la mañana.
- **Pendiente:** la integración editorial final con PR #20, validación de nombres y accesos antes de su elevación a canon, y prueba auténtica del guardado de cinco archivos cuando el lector actúe. No fusionar automáticamente PR #20, #21, #22 ni las ramas de otros agentes.

El checkpoint original del capítulo `CH-000` debe conservar exactamente los cinco blobs del turno 9. La preparación del mapa es un cambio de código/diseño **fuera del tiempo narrativo**, no actividad de los NPC mientras el chat está cerrado.
