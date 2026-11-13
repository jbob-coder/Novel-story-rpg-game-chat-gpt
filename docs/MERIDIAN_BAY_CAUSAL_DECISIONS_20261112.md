# Meridian Bay — revisión causal de decisiones NPC (D-056, implementación técnica)
Fecha: 2026-11-12.
Rama aislada: `work/meridian-bay-causal-decisions-20261112`.
Base verificada al inicio: `7301f2b511dbb6dfdefe065aa9e9a74c600bbd35`, trabajo D-055 de rutinas.

## Objetivo y criterio crítico
En la rama anterior, una rutina podía recomendarse por hora y recurso, pero el motor todavía no separaba **querer realizar una acción** de **poder realizarla** y **haberla completado**. La sensación de vida requiere decisiones de personas con límites reales. El peligro es inventar una entrega, llegada escolar, conversación o resultado económico únicamente porque un plan existe.

Esta implementación añade una **puerta de adjudicación causal**; no es IA continua ni decide por Jack.

## Implementación
`tools/living_world_decisions.mjs`:
- `assessNPCDecisions(...)`: a partir de la agenda y estado auténtico, produce para cada NPC relevante a lo sumo una evaluación privada; identifica metas, planes, recursos registrados, obstáculos, desconocidos, alternativas y competencia entre responsabilidades. No utiliza porcentajes aleatorios ni horarios inventados.
- Dependencias específicas: el destino/entrega de Darius, llegada a la escuela de Elena y devolución del reloj de Rosa **no** pueden darse por concluidos cuando falta una ubicación o contacto confirmado. Organizar materiales, preparar una visita y revisar encargos no equivalen a completar esas entregas.
- Una obligación bloqueada conserva los obstáculos y no se completa mientras sigan presentes. Que una obligación esté vencida no significa que haya fallado.
- `draftReviewedNPCDecision(...)`: permite diferir o bloquear con razones y, para **progreso, fracaso o finalización**, exige al menos una observación nueva del turno, atribuida y revisada editorialmente. Reproduce y compara la evaluación desde el estado para rechazar evaluaciones alteradas o caducadas. Rechaza efectos cruzados o de XP.
- Los borradores aceptados siguen siendo **provisionales**. Se entregan al coordinador existente, que valida los cambios de estado, construye eventos causales y exige el guardado de cinco archivos con journal para persistir un turno real.
- `tools/living_world_diagnostics.mjs` incorpora las evaluaciones bajo `causalDecisionAssessments`, **solo accesibles al narrador**. El informe seguro para el jugador no revela pensamientos privados, compromisos ni escenas ajenas.

### Ejemplos — no son hechos ocurridos
**Rosa:** el reloj está reparado, pero el vecino y su ubicación permanecen sin confirmar; la entrega no puede registrarse solo por el paso del tiempo.

**Elena:** puede planear revisar materiales y continuar su camino; no se deduce que haya llegado a clase.

**Darius:** existe un paquete pendiente, pero no un destino comprobado; puede gestionar el recorrido, no reclamar una entrega.

**Mara:** no se hereda automáticamente a la mañana siguiente la actividad del cierre de la noche anterior; se requiere disponibilidad y relevancia causal.

## Limitaciones explícitas
1. La evidencia de tipo `current_turn_observation` es una afirmación cuya **verdad debe revisar el narrador**. La validación estructural verifica que hay atribución, origen, fecha relativa y revisión explícita, pero no puede comprobar por sí sola una escena ficticia no guardada. Por eso nunca se activa de forma desatendida.
2. Los metadatos de adjudicación devueltos por `draftReviewedNPCDecision` son provisionales; el coordinador estándar guarda el resultado y los cambios del actor, pero no conserva aún una traza independiente de **todas** las observaciones y alternativas consideradas. Próximo incremento: evidencia compacta persistente asociada al evento y validada por readback.
3. No hay escala de probabilidades, algoritmo psicológico completo, memoria emocional autónoma ni sistema de necesidades persistentes. Los recursos siguen siendo descripciones cualitativas.
4. No se debe marcar `reviewed:true` a un resultado no observado ni resolver retroactivamente asuntos de la historia.
5. No se crean nuevas ubicaciones, NPC, hechos o poderes. El turno 10 no se inicia. Sin journal GitHub duradero, el guardado de turno auténtico sigue bloqueado.
6. La rama depende de D-054 obligaciones y de la rama de rutinas D-055; no mezclar con `main` o el canon por su cuenta.

## QA y continuación por bloques (D-055)
- Pruebas: escenarios de Rosa/Elena/Darius, obligaciones bloqueadas, cierre comercial confirmado, prioridades incompatibles, atribución observacional, edición adversarial de evaluaciones, fallo temporal, prueba sintética de un evento NPC no visible y no mutación del checkpoint.
- Validar suites Node/Python y checkpoint mediante GitHub Actions; registrar ID y resultado **después** de la ejecución.
- Revisar SHA de los cinco archivos canónicos en rama base/nueva antes de dar por completa una fase.
- Próximo bloque técnico: **relaciones y consecuencias inter-NPC** que requieren comunicación y límites de conocimiento. Después: modelado de necesidades y costes cualitativos persistidos, servicios visitables basados en eventos y QA de recuperación.

El porcentaje comunicado al propietario es aproximado y corresponde siempre a un alcance nominal, no es una promesa de ejecución en tiempo real.

## CI oficial y preservación verificados
- GitHub Actions [run #43339476274](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43339476274) sobre el commit técnico `9c1aca3972c6223371b4ba6cfb5695fb6a9ce7da`: **208/208 tests Node.js**, **24/24 Python**, **0 fallos** y `python tools/validate_state.py` **PASS**.
- Comprobación GitHub sobre `work/chat-narrative-foundation`, rama D-055 y esta rama: los blobs SHA de `game/SAVE_MANIFEST.json`, `game/STATE.json`, `chapters/CH-000.md`, `chapters/CH-000.events.json` y `chapters/CH-000.transcript.json` son idénticos.
- La [PR #12](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/12) está **en borrador** sobre `work/meridian-bay-causal-routines-20261112`; no está fusionada. La base temporal `main` solo se usó para activar QA, y después se retiró.
- El turno canónico 10 sigue sin realizarse. El avance de relaciones, consecuencias cualitativas y evidencia persistente continúa pendiente.

## Porcentaje aproximado de expansión (no medición exacta)
Con alcance definido en D-055 (rutinas, adjudicación causal, relaciones, servicios y QA integral), el avance técnico propuesto en ramas de revisión se estima en **~30–40 %**. El bloque de restricciones y revisión causal es funcional y probado, pero no equivale a IA autónoma completa: faltan necesidad/coste persistentes, revisión de interacciones sociales, integración final y prueba real del journal. Cambiar esta cifra cuando nuevas pruebas o deficiencias lo justifiquen.
