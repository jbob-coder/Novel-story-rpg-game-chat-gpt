# Meridian Bay — rutinas civiles, relaciones y expansión gradual
Fecha: 2026-11-12. Rama `work/meridian-bay-causal-routines-20261112`.
Trabajo técnico y diseño revisable; **no es un turno narrativo ni agrega hechos ya ocurridos**.

## Evaluación crítica
Fortaleza: siete NPC con metas, recursos y conocimiento; nueve localizaciones persistidas; eventos, tiempo, privacidad y guardado con verificadores. Déficit: los personajes se limitaban a una rutina genérica sin alternativas causales; faltaban servicios disponibles para anclar sus conflictos ordinarios. Una lista de negocios sin metas ni consecuencias agravaría el problema de un mundo decorativo.

Prioridad escogida: convertir metas y recursos **ya confirmados** en alternativas de agenda, y representar infraestructura urbana como oportunidades que todavía necesitan establecerse en escena. No dar horarios, recorridos o personajes nuevos por hechos sin evidencia.

## Cambios implementados
- `tools/living_world_agenda.mjs`: 15 acciones civiles sugeridas a partir de metas/planes y recursos del checkpoint; 2 de Lena, 2 de Sora, 2 de Darius, 3 de Elena, 2 de Rosa, 2 de Noah, 2 de Mara.
- `planNPCAgendas`: chequea avance temporal coherente, revisa compromisos existentes hacia el día destino, ordena obligaciones antes que rutinas, limita el trabajo por NPC y devuelve **solo propuestas privadas**. Un bloqueo permite reconsiderar, aplazar, fallar o cancelar con fundamento, pero nunca completa automáticamente una entrega.
- `previewNearbyNPCContacts`: propone encuentros posibles solo cuando dos NPC ya comparten ubicación registrada, sin atribuir diálogos, nuevas relaciones ni conocimiento.
- `tools/meridian_bay_city.mjs`: catálogo de **18 oportunidades** en 6 anclas verificadas (Railgarden, Market Row, Crosswater Plaza, Harbor Walk, Café Bruma y terminal). Todos los servicios nuevos tienen `status:'proposed_not_canon'`, `locationId:null`, `openingHours:null`, `travelMinutes:null`.
- `tools/living_world_commitments.mjs`: `targetDay` opcional; una obligación vencida se revisa con el día ficticio al que efectivamente avanzaría el turno, sin inventar la hora exacta.
- `tools/living_world_diagnostics.mjs`: expone `causalAgenda`, `possibleNPCContacts` y `meridianBay` **solo en el informe del narrador**. `playerVisibleDiagnostic` mantiene una proyección reducida.

## Fases territoriales
| Zona existente | Función humana | Posibles nuevos servicios, no canónicos |
| --- | --- | --- |
| Railgarden | Vida residencial, escuela de Elena, vecinos de Rosa | comercio alimentario, acceso escolar sin campus fijado, devolución vecinal, atención sanitaria |
| Market Row | Comerciantes, suministros, repartidores | proveedor de repuestos, receptor de mensajería, intercambio cultural, servicios de empresa |
| Crosswater Plaza | Movilidad, atención de usuarios, mantenimiento | atención de pasajeros, circuito de mantenimiento, puestos, transbordos |
| Harbor Walk | Paseo marítimo y actividad económica local | espacio común, empleo portuario, cuidado de infraestructura |
| Café Bruma | Trabajo, cobros y clientela | revisión de registros, atención cotidiana |
| Terminal | Despacho de transporte | coordinación de salidas |

**No se crean ubicaciones `LOC-*` adicionales en `game/STATE.json`**. Las anclas son reales en la ficción, las oportunidades son candidatas que el narrador podría establecer mediante hechos futuros. Se preservan los enlaces oficiales del mapa; horarios y tiempos de viaje siguen desconocidos.

## Ritmo social recomendado
1. **Primera capa, actores próximos:** al avanzar un turno, revisar entre 0 y 3 candidatos por personaje relevante. Jack no controla sus acciones y no recibe automáticamente detalles fuera de su percepción.
2. **Segunda capa, personas conocidas lejanas:** revisar compromisos urgentes incluso si no están cerca de Jack. Los cambios pueden registrarse en privado y llegar al lector solo mediante observación o comunicación plausible.
3. **Tercera capa, ciudad amplia:** mantener instituciones y otros ciudadanos como agregados funcionales hasta que la narración o la historia exijan personas identificables. No almacenar miles de NPC decorativos.
4. **Vida cotidiana:** oportunidades de amistad, aprendizaje, reparación, compra, tránsito, ocio, frustración, enfermedad o demoras deben surgir de tiempo, relaciones y recursos; no añadir peligro artificial a cada escena.
5. **Fase tecnológica:** coexistencia con la red de Jack y Aster como elementos de suspenso; jamás regalar conocimiento privado a otros NPC ni otorgar poderes antes de Día 0.

## Ejemplos de revisión, NO hechos del capítulo
- Elena aún está en Railgarden; tiene materiales en su mochila. La agenda puede sugerir preparar su trabajo o continuar su camino, pero no decidir que llegó a una escuela todavía sin ubicación.
- Rosa conserva la reparación terminada; puede plantearse coordinar la devolución o postergarla por motivos observados, sin inventar que el vecino estaba en casa.
- Darius tiene un encargo; se puede valorar ruta, retrasos y un posible fracaso, sin atribuir una dirección o destinatario desconocidos.
- Mara tiene anotaciones de caja por resolver. El plan nocturno previo puede haber quedado obsoleto; una propuesta para revisar su estado no demuestra que siga trabajando a la mañana siguiente.
- Darius y Noah aparecen ambos en Market Row en el checkpoint, por lo que *podrían* cruzarse, pero no se registra una conversación.

## Límites aún abiertos
- El planificador ofrece **alternativas fundamentadas, no resultados autónomos persistidos**. La adjudicación de éxito/fallo, las motivaciones más profundas, los costes concretos y los cambios de relación requieren una capa de decisión causal y eventos revisados.
- No existe reloj exacto, día semanal, calendario nacional, escuela concreta ni horarios comerciales confirmados; cualquier evaluación de apertura sigue `unknown` sin prueba.
- `ROUTINE_PROPOSALS` y las 15 alternativas nuevas son guías de inspección, **no un servicio de simulación continua**. No existe un worker tras cerrar el chat.
- La rama de obligaciones persistentes D-054 no está aún integrada en el canon y esta rama se basa en ella. No actualizar `main` ni el checkpoint mediante merge automático.
- Las pruebas estructurales no garantizan voz propia, calidad literaria ni que el narrador elija siempre las mejores consecuencias. Se requiere ensayo editorial con escenas sintéticas.

## Siguiente implementación recomendada
1. Motor acotado de necesidades, motivaciones y compromisos contrapuestos con precondiciones verificables, evitando reglas omniscientes o probabilidades arbitrarias.
2. Convertir algunas oportunidades de zona en lugares **confirmados** únicamente cuando se establezcan causalmente; añadir entonces rutas con accesos, distancia aproximada y reglas de horario evidenciadas.
3. Trabajar en relaciones inter-NPC mediante decisiones y comunicaciones explícitas, sin inventar información retrospectiva.
4. Simular 3-5 turnos con salto de día, fracasos, compromisos bloqueados y conocimiento privado; revisar efectos narrativos y readback de cinco archivos en QA aislada.
5. Probar la ejecución autenticada del journal GitHub con estado sintético antes de cualquier turno real.

## QA
Comandos de aceptación: `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v`, `python tools/validate_state.py`. Registrar CI y comparación de SHA después de ejecutarlos, sin anticipar éxito.

## Selección conservadora de intención (revisión adicional)
`recommendNPCIntentReviews` elige como máximo **una intención candidata por NPC**. Primero considera obligaciones pendientes o bloqueadas; después, rutinas compatibles con el período narrativo sugerido, el acceso de ruta y la disponibilidad. Una clausura confirmada o una actividad fuera del período sugerido no produce una acción ordinaria forzada. Las obligaciones reales aún pueden necesitar revisión para reprogramarlas aunque no haya turno laboral. La salida es **privada, pendiente de adjudicación causal y no persistida**; incluye posibilidad de aplazamiento, fracaso o cambio de planes. `inspectLivingWorld` la expone como `recommendedNPCIntents` sin alterar `playerVisibleDiagnostic`.

Esta es una priorización de intención, **no una simulación automática de resultados** ni una licencia para narrar conocimiento que Jack no tiene. El siguiente incremento deberá transformar decisiones revisadas en eventos con consecuencias, no repetir propuestas indefinidamente.

## Resultados de pruebas confirmados (GitHub Actions)
El flujo oficial de QA [#43328634421](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43328634421) se ejecutó tras añadir `recommendNPCIntentReviews` y sus tres pruebas de regresión, con **195/195 Node.js**, **24/24 Python**, **0 fallos** y validador del checkpoint **PASS**. Los cambios posteriores son exclusivamente documentos e índices.

La PR de revisión [#11](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/11) permanece en borrador y dependiente de la rama D-054; el workflow escucha PR hacia `main`, así que se utilizó temporalmente esa base solo para QA y se restauró la base correcta. Ningún merge a `main`, ningún turno 10 y ninguna prueba de calidad literaria auténtica se reivindican.

## Cadencia de desarrollo aprobada por el propietario — D-055

El desarrollo de Meridian Bay **se hará por incrementos entre mensajes del chat**. No es necesario completar rutinas, relaciones, instituciones y expansión en una sola respuesta. Cada bloque debe dejar código o documentación verificables, pruebas pertinentes, alcance y pendientes. Si la actividad no se concluye, informar un porcentaje **aproximado** respecto al bloque de trabajo nombrado, con fundamento en criterios observables y sin presentarlo como una medición exacta. No estimar horas de ejecución futura ni afirmar trabajo en segundo plano: cada nueva sesión se reanuda con una nueva intervención del propietario.

**Orden de incrementos sugerido (no son hechos de ficción):**
1. Rutinas y candidatas de intención de NPC, pruebas de cronología y privacidad — implementadas en rama técnica, todavía sin integrar.
2. Decisiones causales con necesidades, conflictos entre responsabilidades, límites de tiempo, recursos y resultados como éxito/fracaso — pendiente.
3. Relaciones entre NPC con cambios solo por encuentros/comunicaciones fundados — pendiente.
4. Servicios funcionales, ubicaciones visitables y tránsito entre barrios con la evidencia necesaria — pendiente.
5. Ensayo sintético integral, revisión literaria, persistencia remota y validación de integración — pendiente.

**Diferencia entre turnos:** un *mensaje futuro del propietario* puede reactivar desarrollo técnico. Un *turno ficticio de Jack* solo avanza cuando el jugador realiza una acción auténtica, y las actividades de NPC se resuelven dentro del intervalo narrativo justificado; no ocurren automáticamente mientras el chat está inactivo. El turno real 10 se preserva.
