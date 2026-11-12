# Living World — verificación final aislada (10 nov. 2026, Puerto Rico)

**Dictamen:** QA de integración aprobada; la novela REAL no avanza ni se activa automáticamente. El coordinador y diagnóstico siguen en la rama de revisión `work/living-world-design-review-20261110`, separados de `work/chat-narrative-foundation`.

## 1. Ejecución oficial Node.js y Python
Se creó la rama aislada `qa/living-world-integration-20261110` para ejecutar un workflow reproducible con GitHub Actions (` .github/workflows/living-world-integration-qa.yml `, solo QA).

**Ejecución confirmada:** GitHub Actions run **42952186293**, trabajo **130298812510**, estado **completed/success**. Registros verificados:
- `node --test tests/living_world_availability.test.mjs tests/living_world_routines.test.mjs tests/living_world_coordinator.test.mjs tests/living_world_diagnostics.test.mjs`: **56 PASS / 0 FAIL**.
- `node --test tests/*.test.mjs`: **133 PASS / 0 FAIL** (incluye los 56 casos anteriores, no sumarlos como exclusivos).
- `python tools/validate_state.py`: **PASS**, checkpoint, eventos, cronología y campos RPG heredados coherentes.
- `python -m unittest discover -s tests -p 'test_*.py'`: **24 PASS / 0 FAIL**.
- Advertencias observadas: deprecación de Node 20 en las acciones del runner y aviso `punycode` deprecado. No causaron fallas de las suites. Versiones declaradas en workflow: Node 22, Python 3.13.

**PR de seguimiento QA, no destinado a fusionarse:** https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/3

## 2. GitHub real: guardado atómico y recuperación interrumpida
**Rama exclusiva QA**, no canónica: `qa/living-world-integration-20261110`.

- Origen antes del ensayo: commit `69edaeed3f09caa0a23818e55db43cd21dc306ac` con CH-000 turno 9.
- El coordinador real preparó en memoria un turno 10 **sintético** con evento del jugador y evento independiente de Rosa, 15 minutos ficticios, sin XP ni poderes.
- Con GitHub Git Data API se creó un árbol para **los cinco archivos** y un commit separado `56d946a3e3a56c2ddce1c87e70f798c2937f4778`; se **interrumpió deliberadamente antes de actualizar la rama**.
- Se recuperaron los cinco archivos desde el commit separado, se validaron sus contadores y contenido, los 29 eventos previos y 20 entradas literales previas intactos, estado de Aster, ubicación de Jack y plan causal de Rosa.
- Se reanudó en una operación posterior mediante actualización **no forzada** de la rama QA con HEAD esperado; lectura por ref confirmó los mismos cinco SHA que en el commit separado:
  - transcript `3af552dd542bbcb8e4fa7b6c52e3a3672c1c42b5`
  - eventos `ace1b040c0bec1faab0a5cc50ce160332ea571ff`
  - capítulo `2eb4bf37ad65d2c195838387d198eca10e4bf007`
  - estado `87471821dca6feef1c8a3b62a2070e47cdfbe446`
  - manifest `b4a495b16d1805bb69deaa210eedffc133211199`.
- **Solo QA:** tras la prueba CH-000 turno 10, EV-000031, TXT-000022. Esa continuación es sintética y jamás debe reanudarse como historia auténtica.

Esta prueba verifica el camino real GitHub de cinco archivos y recuperación del mismo commit. No equivale a garantizar que la interfaz del usuario recibió texto narrativo, ni prueba la ausencia de todas las posibles condiciones de carrera en la API de GitHub.

## 3. Escena de integración y revisión literaria
Texto sintético: revisión de Jack de la mesa de trabajo; brazo de Aster permanece físicamente montado pero sin actuadores conectados. Rosa prepara una posible devolución del reloj fuera de escena, que **no se muestra como hecho conocido por Jack**. Comprobación editorial:
- Continuidad y causalidad: **PASS**, conserva Día -29 y primer brazo no operativo.
- Agencia: **PASS**, no se adjudica a Jack una decisión real; la acción solo es un fixture QA explícitamente rotulado.
- Conocimiento privado: **PASS**, la escena muestra únicamente percepciones de Jack y no revela el plan de Rosa.
- Prosa: **PASS editorial preliminar**, breve escena sensorial, sin menú ni amenaza obligatoria. La calidad literaria a escala de una novela completa sigue requiriendo evaluación durante narrativa real.
- Guardado: **PASS remoto**, cinco archivos recuperables coherentes.

## 4. Canon protegido y decisiones
El manifiesto de `work/chat-narrative-foundation` se verificó separado con SHA `897ec2e77ece4f8edf506c7058552a5dd3cdb320`: **CH-000, turno 9, EV-000029, TXT-000020**. No se cambió ninguna escena, evento ni guardado auténtico. No fusionar la rama QA o su turno sintético a ninguna rama narrativa.

**Resultado:** las tres verificaciones pendientes (Node oficial, GitHub remoto en rama aislada, escena sintética integral) se realizaron y pasaron. **Activación en la novela aún pendiente de revisión de integración**: el coordinador no está conectado automáticamente a cada turno conversacional. Recomendado: revisar los límites del modelo temporal y la separación de información, integrar únicamente los módulos aprobados (nunca archivos sintéticos) cuando corresponda, y ejecutar un primer turno real bajo el protocolo de cinco archivos.
