# Secuencia por turnos de NPC — decisión del propietario y ensayo aislado

**Criterio aclarado:** un NPC evalúa **una** acción concreta al avanzar un turno narrativo autorizado. El narrador resuelve esa acción y guarda su resultado. El turno siguiente vuelve a evaluar al actor **desde el resultado efectivamente persistido**, su nueva memoria, circunstancias y plan. No redactar ni ejecutar resultados de turnos futuros antes de que ocurran. Varios NPC pueden tomar decisiones distintas en un mismo turno; cada uno como máximo tiene un resultado admitido, salvo un mecanismo posterior explícitamente diseñado y probado.

### Contrato del prototipo

- `inspectNPCNextTurn` carga el último evento del propio actor y comprueba la referencia `last_resolved_action`. Ofrece **un foco de revisión**, sin elegir una acción ni afirmar resultados. Nunca permite usar el conocimiento secreto de otro actor.
- `draftReviewedNPCNextTurn` acepta una intención y resultado **revisados por el narrador**, exige una referencia causal vigente y crea un borrador compatible con el coordinador existente. Solo `stageLivingWorldTurn` más el protocolo transaccional puede producir un turno guardado.
- `prepareLivingWorldTurn` ya rechaza dos resoluciones distintas para el mismo actor en un único turno. Se conserva esa restricción existente.
- Cada turno posterior recupera el guardado anterior y cita el evento recién verificado, en lugar de anticipar una cadena preparada. Se permite replantear, abandonar, posponer o elegir otra acción cuando la nueva situación lo justifica.

### Ensayo de regresión

Tres turnos secuenciales **sintéticos**, todos para Rosa Wilson; cada decisión cita el resultado privado del turno anterior. El plan se actualiza con una consecuencia limitada, sin afirmar que se entregó el despertador, que el vecino estuvo presente o que Jack conoció asuntos privados. Se realiza una codificación y lectura de los cinco archivos de cada checkpoint simulado. Se rechazan contexto obsoleto, referencia inventada y dos resultados simultáneos del mismo NPC.

**Límites:** se generan argumentos y acciones de prueba de manera editorial; esta solución demuestra el *encadenamiento causal*, no que un agente inteligente genere deseos o acciones convincentes de manera independiente. Sin ejecución de fondo ni avance del CH-000 auténtico. La PR queda en revisión hasta evaluar la iniciativa abierta en decisiones no predefinidas.

**Base:** `game/STATE.json` / CH-000 turno 9, `docs/NPC_RULES.md` y `docs/01_world/NPC_OPEN_CAUSAL_CONTINUATIONS_20261122.md`.
