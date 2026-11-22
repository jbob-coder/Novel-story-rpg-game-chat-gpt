# Meridian Bay — revisión de contactos de corredores candidatos (2026-11-22)

**Estado:** QA cartográfica privada y reversible. **No** se elige una ruta física, no se modifica la costa ni se admite infraestructura en `game/STATE.json`.  
**Rama:** `work/meridian-corridor-contact-audit-20261122` derivada del HEAD `964d84698f65db0ea41d7617bf5b9f22dd85db8f` de [PR #89](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/89). Esta PR **depende** de #89 → #87 → #86, no de `main` directamente.  
**Autoridad narrativa:** `main@019175c6463ff31807a0f7013d91299add94913c`, sin modificar. Todas las posiciones usan el lienzo ilustrativo `100×80`, **sin escala geográfica real, orientación certificada ni tiempo de recorrido**.

## Alcance y fuentes inmóviles

El validador `tools/meridian_corridor_contact_audit.mjs` lee y verifica el Git blob SHA-1 de cada fuente antes de analizarla. No copia archivos de estados de PR antiguas ni importa motores obsoletos.

| Fuente | Git blob fijado | Propósito |
| --- | --- | --- |
| Candidato Coast 01 de [PR #89](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/89) | `139c3687c98285aff886d28422544d082768217d` | Usar las correcciones mínimas documentadas de PR #67; dibujo todavía no canónico |
| Corredor directo [PR #44](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/44) | `e8efe8e5f6a746ab4e628f76a9deb5f71061010d` | Market Row → Harbor Walk, 5 puntos |
| Corredor directo [PR #58](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/58) | `280a444f6eed99a33027aea2edb48af70cc67bd0` | Market Row → Harbor Walk, 6 puntos |
| Corredor de plaza [PR #56](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/56) | `a5ac772922b4717797118b15f182207be1d1a7fb` | Crosswater Plaza → Harbor Walk, 5 puntos |

El análisis exige que el mundo guardado conserve los enlaces de lugares originales; reusa `validatePr67CoastCandidate` y coteja cada cruce estricto contra el inspector histórico `candidateRouteCrossings`. Además amplía el caso que antes podía pasar inadvertido: **contactos tangenciales, coincidencia de tramos y puntos de ruta dentro de polígonos**. Los tests sintéticos comprueban esos casos, pero no los convierten en obstáculos aprobados de la ciudad.

## Resultados geométricos por segmento y coordenada

Las siguientes coordenadas se derivaron de la intersección de segmentos de las fuentes documentales. **Son puntos del boceto, no coordenadas del mundo físico ni rutas transitables.**

| Alternativa | Tramo de ruta (índice 0) | Entidad / arista (índice 0) | Punto del boceto de contacto | Dictamen |
| --- | ---: | --- | --- | --- |
| #44 Market–Harbor | 3 | `HC-A-OLDTRACE` / 1 | **(69.8598, 36.9620)** | Cruce estricto con traza antigua catalogada como bloqueada, no prueba de cierre legal |
| #58 Market–Harbor | 4 | `HC-A-OLDTRACE` / 1 | **(70.0464, 36.8093)** | Cruce estricto con la misma traza, en otro lugar; no demuestra mayor seguridad |
| #56 Plaza–Harbor | 2 | `HC-B-01` / 2 | **(69.0377, 39.0008)** | Entrada por borde de huella de edificio candidato |
| #56 Plaza–Harbor | 2 | `HC-B-01` / 1 | **(69.4756, 38.5264)** | Salida por borde de la misma huella |

El recorrido directo de #44 **no** coincide con la cola `HC-A-MARKET` de la costa propuesta; el de #58 **sí**, porque la costa original se dibujó tomando esa propuesta. Coincidencia heredada **no constituye prueba independiente de viabilidad**. #56 coincide con `HC-A-PLAZA` al final, pero colisiona con la huella de edificio candidata. De los cuatro contactos detectados, dos son de edificio y dos de traza bloqueada; ninguno se considera un hecho físico canónico.

**No escoger por cantidad de puntos:** cinco frente a seis puntos indica granularidad de boceto, no calidad del acceso, longitud verificada ni validez urbana. Tampoco bloquear una conexión del grafo existente porque un polígono no aprobado se superpone en un plano.

## Contrato y regresiones

- `segmentContact`: devuelve `strict_cross`, `boundary_touch`, `collinear_overlap` o `null`, con coordenadas redondeadas a cuatro decimales en el lienzo de diseño. Rechaza segmentos nulos y coordenadas no finitas.
- `strictlyInsidePolygon`: identifica interior estricto y excluye frontera; no convierte tangencias en paso a través del edificio.
- `inspectRouteContacts`: analiza aristas de edificios candidatos y trazas bloqueadas, incluso cuando el segmento empieza/termina dentro del edificio sin cruce de borde.
- `inspectMeridianCorridorContacts`: valida fuente, conectividad ilustrativa, endpoints del grafo guardado, comparador histórico, número esperado de conflictos y ausencia de tiempos de viaje o aprobación. Retorna una copia privada, no escribe nada.
- `tests/meridian_corridor_contact_audit.test.mjs`: 12 pruebas de procedencia, referencias, puntos, paridad histórica, tangencias, segmento compartido, interior completo, datos inválidos, protección de estado, ausencia de acciones y no mutación.

## Riesgos, decisiones y próximo trabajo

**Enlace guardado ≠ carretera físicamente dibujada.** Los enlaces Market–Harbor y Plaza–Harbor continúan siendo los ya existentes en el grafo. La prueba cartográfica no establece vías públicas, obstáculos reales, accesibilidad para silla de ruedas, restricciones portuarias, grades, propiedad, tiempo de movimiento, presencia NPC ni descubrimientos.

**Propuesta técnica:** mantener #44 y #58 como alternativas abiertas hasta establecer continuidad y restricciones de la franja entre los barrios, especialmente el tramo final. De ser necesario, diseñar una tercera variante reversible con puntos de entrada verificados mediante revisión local, pero solo como hipótesis. Para #56, priorizar la inspección del edificio candidato `HC-B-01` y el acceso desde la plaza antes de modificar la traza. La otra opción es revisar las huellas de edificios, con justificación de procedencia, sin alterar rutas guardadas.

**Puerta de aceptación:** ejecutar el Node suite completo, pruebas Python y validación del checkpoint en el **HEAD final** de este cambio; confirmar inventario y cinco blobs narrativos respecto a `main`. Hasta ello, una PR abierta no equivale a código integrado, y tampoco un `success` de sus dependencias. No fusionar el stack #86/#87/#89 sin resolver las dependencias y las decisiones físicas.
