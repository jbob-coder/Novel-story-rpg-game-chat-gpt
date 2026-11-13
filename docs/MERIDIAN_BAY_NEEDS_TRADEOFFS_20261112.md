# Meridian Bay — necesidades, restricciones y costes de decisión (D-058)
Fecha: 2026-11-12. Trabajo técnico en rama aislada `work/meridian-bay-needs-tradeoffs-20261112`.
Punto de partida inspeccionado: `cc1fbdf149fc6ae2ad4703fc4ed14e70a77ec226` (D-057).
**No se han creado necesidades retrospectivas ni alterado los cinco archivos de partida.**

## Razón y alcance
D-054 conserva obligaciones; D-055 ofrece agendas y oportunidades locales; D-056 evalúa si una acción es posible; D-057 conserva relaciones e información social. Falta que la vida de un NPC pueda generar **costes persistentes por elegir una prioridad y aplazar otra**. No basta con ejecutar una rutina: una persona debe poder reconsiderar una visita, pedir ayuda, posponer un encargo o reservar tiempo personal cuando existan hechos que lo justifiquen.

Esta entrega añade una capa *cualitativa y causal*, no recursos numéricos ni necesidades inventadas por la edad o profesión. No altera eventos históricos de ningún NPC, no concede poderes y no ejecuta procesos desatendidos.

## Esquema de necesidad — solo NPC
Campo opcional `world.actors[NPC-ID].needs`; ausente en el checkpoint original.
Por cada necesidad revisada:
- `id` estable `NEED-...`, `domain` entre livelihood/family/rest/health/education/supplies/social/safety/personal/mobility; `summary` fundamentado y `priority` cualitativo.
- `status`: active / blocked / resolved / cancelled. Un bloqueo requiere obstáculos explícitos; una necesidad cerrada no se reabre ni borra.
- `due_day` entero narrativo confirmado o null si se desconoce; **no se inventan reloj, día de semana ni plazos**.
- `resource_keys` opcionales refieren a recursos materiales existentes; no son saldo inventado.
- `source_event_id`, `last_change_event_id`, `resolution` y `resolution_event_id` guardan origen y cierre.
- `tradeoffs` es una lista acotada de decisiones efectivamente observadas: `{event_id,decision,foregone,cost,evidence}`. La alternativa no tomada y el coste deben ser descritos cualitativamente, con observación causal. Ninguna lista se rellena por tiempo transcurrido.

## Código
- `tools/living_world_needs.mjs`: `validateNPCNeeds`, `validateNPCNeedChange`, `reviewNPCNeeds`, `draftReviewedNeedIntroduction`, `draftReviewedNeedTradeoff`. Los borradores requieren observación del turno actual y revisión; el cierre requiere evento y motivo. Una necesidad antigua no se puede crear con un ID de evento histórico.
- `tools/state_changes.mjs`: añade `field:'needs'` con precondición de estado, validación atómica y comprobación por readback de referencias y de identificadores únicos entre NPC.
- `tools/living_world_routines.mjs`: permite el nuevo cambio exclusivamente en el evento del NPC correspondiente, después de revisión editorial.
- `tools/living_world_commitments.mjs`: prioriza en el diagnóstico a NPC con necesidades explícitas urgentes o bloqueadas, incluso cuando están alejados de Jack. No inventa conductas ni suprime NPC por distancia.
- `tools/living_world_decisions.mjs`: incorpora `competingNeeds` a una evaluación causal, sin transformar una necesidad en un bloqueo automático de cualquier acción. Las tensiones de atención requieren decisión del narrador.
- `tools/living_world_diagnostics.mjs`: incorpora `qualitativeNeeds` en el diagnóstico **privado**; `playerVisibleDiagnostic` no muestra información fuera del conocimiento legítimo de Jack.

## Prueba sintética — NO CANÓNICA
Se ensaya un futuro turno donde Rosa expresa una nueva necesidad de organizar la entrega del reloj reparado. En un segundo turno de QA, prepara el reloj y decide aplazar otro encargo, dejando un coste cualitativo persistido. En un tercer turno, **se resuelve únicamente la coordinación**, no la entrega física del reloj, conservando el historial completo de decisiones. Todo se prueba en memoria; los cinco archivos originales permanecen sin modificar.

## Límites y riesgos
1. Un `current_turn_observation` es una afirmación revisada por el narrador; el código no puede comprobar una escena que todavía no ocurrió. No se debe fabricar una observación para desbloquear un cambio.
2. Un coste cualitativo representa una consecuencia concreta y verificada, no una deducción mecánica (fatiga, hambre, enfermedad, pobreza o sanción). Un coste potencial no se registra como sucedido.
3. Las prioridades internas ayudan a seleccionar atención narrativa, no son niveles, XP ni atributos RPG visibles.
4. Este módulo es una infraestructura nueva: **la partida original no contiene necesidades D-058 y ninguna se registra hasta un turno auténtico con fundamento**.
5. Una necesidad resuelta permanece en su historial; para un nuevo episodio relacionado se crea una nueva necesidad y evento, nunca se reescribe una resolución.
6. Una futura capa podría modelar horarios y duración de actividades, pero las horas exactas y las instalaciones civiles aún no están establecidas.
7. Aún falta verificar extremo a extremo el adaptador GitHub autenticado del journal para operaciones reales; nunca se puede saltar el bloqueo del guardado.
8. Esta rama depende de PR #13, a su vez dependiente de D-054/D-055/D-056. No fusionar automáticamente con `main`.

## Criterios de aceptación y siguiente tarea
- Suite `tests/living_world_needs.test.mjs`: introducción, persistencia, tradeoff, resolución a través de tres turnos **sintéticos**, conflictos con obligaciones, caducidad, coherencia de eventos, privacidad y rechazo de efectos ajenos.
- Suite completa `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v` y `python tools/validate_state.py`; ejecutar en GitHub Actions e inspeccionar logs antes de declarar pruebas aprobadas.
- Comprobar SHA de los cinco archivos de partida y documentar PR/HEAD tras pruebas.
- Próxima mejora: vincular necesidades con decisiones sociales adversas y planes de servicio reales de Meridian Bay; empezar solo por 2–3 lugares funcionales, con rutas y horarios cuando sean establecidos narrativamente.

**Cadencia D-055:** entregar cambios completos por mensaje con porcentaje aproximado del plan global; no prometer ejecución en tiempo real ni narrar turnos de Jack sin su acción.
