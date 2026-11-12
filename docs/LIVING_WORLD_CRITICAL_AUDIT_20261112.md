# D-051 — Auditoría crítica de Living World (12 nov. 2026)

**Estado:** auditoría y propuesta; NO es canon, NO altera la novela, NO afirma ejecución de pruebas nuevas.
**Fuente:** `work/chat-narrative-foundation`, HEAD inspeccionado `c65db9bdd7920adbdbafd69498d2c38e99db83db`. Manifest real: CH-000, turno 9, día -29 por la mañana, EV-000029, TXT-000020. Cinco archivos de partida intactos tras D-050.
**Evidencia de QA anterior:** run `43313742280`, 143 Node, 24 Python y validador PASS, relativo a la corrección de horarios y rutas; estas pruebas **no acreditan una novela autónoma ya operativa**.

## Dictamen

La ingeniería de continuidad y pruebas básicas es buena, pero existe una brecha funcional entre un **simulador de propuestas** y una **novela con población autónoma**. Los módulos actuales **no se ejecutan solos, ni en tiempo real, ni durante el silencio de ChatGPT**, como exige el contrato narrativo; eso es correcto. El problema es que tampoco hay todavía un planificador causal reproducible suficientemente conectado al narrador cuando avanza el tiempo ficticio. La calidad literaria no está medida por 143 pruebas técnicas.

## Hallazgos prioritarios

### P0 — Integridad temporal (código comprobado; defecto potencial a cubrir con tests)
`tools/living_world_coordinator.mjs`: `turn.elapsed_days` y `turn.elapsed_minutes` se validan **independientemente**, y `next_time_of_day` puede avanzar sin relación causal medida con los minutos. Ejemplos de entrada admitida por las comprobaciones actuales: `elapsed_days:1, elapsed_minutes:0`; `elapsed_days:0, elapsed_minutes:1500`; `next_time_of_day:'night', elapsed_minutes:1` tras `morning`. No se ha ejecutado una prueba aislada de estos ejemplos en esta auditoría. Aunque la cronología `day` se valida como no decreciente, la coexistencia de unidades incoherentes permite romper agendas, aperturas y viajes.

**Cambio:** introducir un único `NarrativeTimeSpan` coherente con el reloj aproximado y la franja; agregar validación de congruencia, política de transiciones de medianoche y casos de incertidumbre temporal. No inventar `calendar_date` ni `clock_time` para el turno 9: establecerlos mediante futura evidencia narrativa o ancla de calendario declarada y aprobada.

### P0 — Guardado pendiente sin bitácora durable
`tools/save_transaction.mjs` contiene `recoverFiveFileSave()`, que necesita `blocked`, `commitHead` y `expectedFiles`; si se pierde esa estructura durante una interrupción de sesión, la recuperación no puede deducir automáticamente los bytes del intento. `prepareLivingWorldTurn()` asigna `previous_attempt:null` y no reconsulta un diario persistido. Existe riesgo de iniciar una acción nueva aunque un intento anterior no esté documentado como resuelto. El contrato D-028 lo prohíbe.

**Cambio:** bitácora de intento/pending por rama y turno con SHA, no mezclarla con los cinco archivos de partida; bloqueo obligatorio al recuperar la sesión, resolución idempotente y limpieza solo tras lectura remota. Tests de sesión perdida, commit huérfano, rama divergente y entrega de narración interrumpida. Nunca imprimir secretos o tokens.

### P1 — Estado de NPC estancado tras salto de noche
`game/STATE.json` está en día -29 `morning` y 889 minutos aproximados desde apertura. Sin embargo, Lena sigue atendiendo un servicio de **evening**; Darius aún quiere completar un paquete con plazo; Sora quiere terminar la inspección de su turno; Mara permanece en Café Bruma con plan de terminar el turno **nocturno**. Esto no demuestra que sea imposible que sigan allí, pero sí que faltan **resoluciones o incertidumbre explícita** para más de una jornada ficticia. Las rutinas solo generan candidatos, no cierran compromisos.

**Cambio:** seguimiento de compromisos con fecha/hora aproximada, estado `active/pending/overdue/unknown/resolved`, causa, restricciones, y relevancia para la escena; conciliar al siguiente paso temporal sin retconear el checkpoint ni asignar éxitos automáticos.

### P1 — Autonomía únicamente candidata; ninguna selección causal de acción
`tools/living_world_routines.mjs` define **7 plantillas**, devuelve `unresolved_proposal`; `living_world_coordinator.mjs` requiere un `reviewed/resolved` manual. No hay selector por necesidad/prioridad/plazo/recursos, ni cola de compromisos, ni obstáculos, ni relación entre NPC e instituciones. El resultado es que ChatGPT debe decidir casi todo de nuevo y el mundo puede parecer reactivo a Jack en lugar de tener trayectoria propia.

**Cambio:** planificador limitado activado al **avanzar tiempo narrativo**, que entregue 0–N candidatos basados en planes, recursos, lugar, horarios y hechos del registro; revisión causal obligatoria antes de persistir. Incluir fracaso/cancelación/aplazamiento, no solo movimiento o completado. Los NPC no deben actuar en tiempo real fuera del chat.

### P1 — Calendario y localizaciones insuficientes para exploración funcional
Existen **9 localizaciones** en `STATE.json`; escuela, vecindario del reloj, ferretería y universidad de Jack no están definidos como lugares concretos. `clock_time` y `calendar_date` son null. El algoritmo de horarios nocturnos ahora funciona, pero no existen horarios canónicos suficientes para aplicarlo al día actual. `tools/living_world_availability.mjs` tiene un grafo auxiliar `LINKS`; `worldRoute()` usa el grafo de `STATE.json`, creando dos fuentes de adyacencia susceptibles a divergencia.

**Cambio:** única fuente de conexiones basada en estado/mapa y exportación para vistas; agregar gradualmente fichas de servicios `established/proposed/unknown`, límites de acceso (público/privado), distancias orientativas e intervalos de horario como propuestas. Definir escuela/ferretería/universidad solamente mediante decisión explícita o introducción narrativa, sin falsa precisión.

### P1 — Separación de información privada todavía depende de la redacción
El parche D-049 dejó de agregar automáticamente `offscreen.outcome` a `CH-000.md`, pero `turn_engine.mjs` aún incluye `turn.outcome` en una sección legible **Outcome**, y acepta `turn.narration_messages` sin un verificador semántico de quién puede conocer cada hecho. El test con marcadores sintéticos prueba que el valor privado de `offscreen` no se copia automáticamente, **no** que cualquier escena propuesta sea libre de spoilers.

**Cambio:** una salida `reader_scene` separada de `private_resolution` y un paso editorial de validación de perspectiva. Las revelaciones deben ser eventos causales explícitos; no presentar el log completo ni el Markdown técnico al lector por error. Tests de información oculta enviada desde distintos campos.

### P2 — Calidad narrativa e instituciones sin pruebas de experiencia
`docs/SCENE_CRAFT.md` reconoce la prosa de informe como defecto anterior. Pruebas Node/Python acreditan estructura, no ritmo, voces, suspenso o variedad real. El mapa y la plantilla de reparto todavía ofrecen pocas oportunidades sociales fuera del taller/cafetería. No hay un flujo probado de **escena libre real + NPC independiente relevante + texto literario + commit de cinco archivos + entrega recuperable**.

**Cambio:** ensayo editorial **sintético y no canónico** de tres escenas: (1) trabajo rutinario de Aster con Rosa cerca; (2) visita diurna a Market Row con horario incierto y NPC con objetivo propio; (3) una exploración nocturna con acceso incierto a un negocio. Verificar conocimiento, razones, consecuencias, longitud natural, continuidad, agencia de Jack y guardado. Después aplicar al primer turno auténtico que el propietario decida.

## Secuencia recomendada de trabajo

1. **P0 técnico:** tiempo narrativo coherente y diario durable de guardado pendiente, con pruebas de regresión; ramas separadas, sin modificar los cinco archivos.
2. **P1 simulación:** sistema de compromisos, eventos pendientes y resolución selectiva para los 7 NPC existentes; reconciliar estado obsoleto al avanzar historia sin retcon. Integrar disponibilidad con el estado, no con relojes inventados.
3. **P1 mundo/experiencia:** fichas jugables de Railgarden, Market Row, Crosswater y servicios realmente conocidos; definir horarios confirmados solo cuando estén establecidos. Aumentar gradualmente NPC e instituciones relevantes, evitando fichas masivas.
4. **P1 contrato de lectura:** visibilidad causal y salida literaria separada de resúmenes técnicos, con pruebas de filtración.
5. **P2 QA integral:** escena de ensayo + cinco archivos en rama QA aislada + reporte editorial; abrir la primera escena real solo mediante acción libre del jugador.

## Criterios de aceptación mínimos

- Una secuencia de 3 escenas sintéticas de 1 día ficticio no contradice `day`, `time_of_day` y minutos de reloj aproximados.
- El mismo NPC no puede cumplir obligaciones incompatibles simultáneamente; un encargo vencido queda `overdue/unknown` o se resuelve causalmente.
- Dos NPC relevantes pueden producir acciones no dependientes de Jack sin obligar a introducir amenazas ni forzar encuentros.
- El lector **no** recibe información de una escena fuera de cámara sin observación, comunicación o deducción justificada.
- Un fallo de guardado no puede permitir un nuevo turno, incluso después de perder contexto de conversación.
- Las acciones originales de Jack y la narración visible sobreviven textualmente en los cinco archivos, con commit y lectura remota.
- Ninguna prueba artificial toca `work/chat-narrative-foundation` en sus cinco archivos canónicos, ni `main`.

**Regla de decisión:** no añadir decenas de personajes ni redactar capítulos antes de arreglar causalidad y continuidad. Evitar modificar hechos jugados. El éxito técnico no equivale a que el mundo ya se sienta vivo.
