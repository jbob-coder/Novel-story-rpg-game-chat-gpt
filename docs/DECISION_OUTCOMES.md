**Override vigente D-036/D-037:** esta obra es una **novela interactiva**, no un RPG. No XP, niveles, atributos numéricos ni recompensas de progreso; las consecuencias y capacidades son cualitativas. Véase [NARRATIVE_CONTRACT.md](NARRATIVE_CONTRACT.md).

# Consecuencias, ramificaciones y desenlaces — modelo narrativo

## Regla del propietario
**Cada decisión de Jack puede alterar la historia.** No hay un final obligatorio ni una ruta secreta predeterminada que fuerce resultados. El narrador interpreta consecuencias plausibles que dependen del contexto, las capacidades del personaje, las acciones de NPC y lo ocurrido antes. Una elección no es garantía de éxito; evitar un conflicto también puede tener resultados a largo plazo.

## Nuevo estilo de narración
- **Novela interactiva de suspense urbano**, en tercera persona limitada, próxima a lo que Jack puede percibir. Prosa concreta, diálogo natural, ritmos distintos (momentos tranquilos y tensión), sin resúmenes mecánicos entre cada gesto.
- **Mostrar antes que explicar:** una mirada, un silencio, un tren retrasado o el trabajo de alguien revelan tanto como la exposición. No hay opciones ni menús al cierre salvo que el usuario los pida expresamente.
- **Jack pertenece al jugador:** nunca escribir pensamientos internos obligatorios, mensajes que no haya tecleado, discursos en el collar ni acciones que no decidió. Narrar qué percibe, no imponer qué siente.
- **Los NPC no existen para provocar misiones:** continúan sus objetivos según tiempo, conocimiento y recursos, y pueden actuar sin conocer el plan de Jack.

## Tres niveles de consecuencias
1. **Inmediatas:** un objeto cambia de dueño, alguien responde, pasa tiempo, hay oportunidad o fracaso. Deben quedar en un evento y estado del turno.
2. **Persistentes:** sospechas justificadas, reputación, relaciones, recursos, deudas, recuerdos, salud, planes NPC y oportunidades nuevas. Guardar el hecho causal, quién lo conoce y el capítulo.
3. **Desenlaces:** situaciones que se abren con un evento, se desarrollan por acciones posteriores y terminan de maneras justificadas. Pueden resolverse favorablemente, con pérdida, por negociación, abandono, terceros o combinación, sin una lista limitada de finales.

## Registro de hilos narrativos
`game/STATE.json.narrative_threads` contiene una lista de asuntos **abiertos por acciones realmente adjudicadas**, con `THREAD-000001`, actor responsable, pregunta pendiente, alcance, estado `open/resolved`, evento de origen, evento de resolución o `null`, e historial de eventos. `tools/consequences.mjs` valida y actualiza estas relaciones por turnos. Cada actualización incluye `event_id` del turno actual, `op` (`open/develop/resolve`), resumen real y visibilidad `hidden/known`; lo que un personaje no sabe NO se revela como información del jugador.

**No se crean hilos por posibilidades o elecciones sugeridas antes de que Jack actúe.** La afirmación histórica «turno 0, cero eventos» ya no describe el checkpoint actual. Revisar el manifiesto, los eventos y los hilos activos antes de adjudicar consecuencias. `stageNarrativeTurn` puede aceptar `consequence_updates` solo después de crear un evento y los integra en el checkpoint. No preasignar éxitos, finales, poderes o reputación.

## Libertad sin menú (D-031)
Terminar en una situación real de la ficción, sin ofrecer opciones numeradas ni estrategias a elegir. Jack puede actuar libremente. No prometer resultados futuros ni asignar un desenlace sin un evento real.

## Registro completo
La transcripción literal mantiene la escena y cada respuesta. El log de eventos guarda las causas y el estado guarda qué cambió. Antes de narrar un nuevo desenlace, recuperar hilos y eventos relacionados. La puerta D-028 bloquea el avance hasta verificar el commit y los cinco archivos. No reescribir transcript previos para acomodar decisiones nuevas.

## Precauciones de alcance
El modelo implementa el **registro estructurado de hilos**. No genera automáticamente una campaña completa ni simula personajes en segundo plano. Rollover de capítulos y evento cósmico del Día 0 aún requieren implementación y pruebas.
