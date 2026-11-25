# Preparación para jugar

## Reanudar en el taller

El punto de entrada es el manifiesto de `work/chat-narrative-foundation`. En la comprobación del 24 de noviembre de 2026 indicaba CH-000, turno 9, Día −29 por la mañana. Jack estaba en el taller y los actuadores del primer brazo de Aster seguían desconectados. Cada sesión debe recuperar el manifiesto y el diario vigentes antes de aceptar la siguiente acción. [Protocolo de guardado en ChatGPT](05_persistence/CHATGPT_GITHUB_NATIVE_SAVE.md)

Se guardaron dos continuaciones ficticias en ramas de pruebas a partir de los mismos cinco archivos. En una Jack examinó el codo a mano. En la otra visitó a Noah, el collar reprodujo la pregunta escrita y Jack pudo examinar el casquillo sin comprarlo. El estado de cada rama conserva su ubicación, sus pertenencias y lo que pudo averiguar. El texto del mensajero quedó en sus propios eventos. [Escena en el taller](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/commit/d2f30236a3743daeac43111c4116f308c2edd683) · [Escena en el comercio](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/commit/3cbcc3fc787c0b346dd73181ed2b46955a4bfc95)

El conector de GitHub releyó los cinco archivos. Un proceso nuevo recuperó la visita tras la interrupción anterior a la actualización de la rama. Para comprobar la última parte de la experiencia de lectura, otra conversación auténtica de ChatGPT debe recuperar la última narración de una rama de QA usando exclusivamente su referencia y el diario de QA. La escena de la partida real espera la acción del jugador. [Diario aislado de los ensayos](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/tree/journal/qa-ordinary-morning-20261124)

En las dos ramas se guardó después la misma entrada, «Espero un momento». Cada proceso cargó únicamente su propio estado. La visita continuó ante el mostrador y la otra escena continuó en el taller. En esta última se cortó deliberadamente la operación después de mover la rama y antes de releer los archivos. El diario permitió verificar y entregar el mismo texto. [Continuación en el comercio](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/commit/0acc5af90a054823448650c99d9bb0f712f1cf2a) · [Continuación en el taller](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/commit/ac2c2282250e3cd798005d6cb91dc9ceba8f4607)

## Continuar la campaña

La prueba de varios días lleva ambas decisiones a un cambio editorial de capítulo, al Día 0 antes de la llegada, a la llegada y al día posterior. Comprueba la ubicación de Jack, la custodia del paquete y el conocimiento individual tras recuperar un guardado interrumpido. Las veintiocho jornadas omitidas en el ensayo sirven para alcanzar el intervalo de prueba. La calidad de veintiocho jornadas de juego efectivo sigue abierta. [Ensayo de continuidad](../tests/chapter_save_transaction.test.mjs)

Las transacciones entre compradores y negocios, la evolución de organizaciones y las manifestaciones individuales siguen requiriendo sus propias pruebas de campaña. Los expedientes públicos conservan los secretos para el narrador dentro de la ficción. La llegada de la onda por sí sola deja abiertas su causa y la experiencia concreta de cada personaje.

<details>
<summary>Informe histórico de noviembre de 2026</summary>

> **Actualización D-036/D-037 — 2026-11-10:** este informe de preparación fue una estimación **histórica** de la fase RPG, no una evaluación actual. El formato vigente es una novela interactiva SIN XP/atributos/niveles; la fila «Habilidades y progreso» ya no es aplicable. La partida se encuentra en CH-000, turno 6 (EV-000021), no en turno 0. La red activa 500+ anterior y las nueve incorporaciones de Café Bruma son canon de la ficción. Ver `docs/NARRATIVE_CONTRACT.md` y `game/SAVE_MANIFEST.json`. Los porcentajes debajo NO deben reutilizarse como estado actual.

# Preparación de juego — estado verificable (2026-11-10)

**Inicio de CH-000: ~88% preparado.**  
**Campaña prolongada hasta/post Día 0: ~70% preparada.**

**Importante:** porcentajes **estimados**, no métricas medidas automáticamente. Son medias simples de las áreas evaluadas; no representan calidad demostrada por una partida real. Las seis primeras áreas se usan para el porcentaje de inicio; las nueve para la campaña completa.

| Factor | Estimación | Evidencia / límite |
| --- | ---: | --- |
| Canon y escena inicial | 95% | Confirmados Tierra alternativa, Day -30, Meridian Bay y Crosswater Plaza. |
| Personaje, familia y recursos | 96% | Jack, Elena 17, padres fallecidos en incendio, hacking pasado, dinero, voz y gadgets guardados. |
| NPC y entorno inicial | 90% | Seis NPC con objetivos; algunas interacciones no probadas en juego. |
| Narración y libre decisión | 85% | Reglas de agencia y consecuencias documentadas, aún sin turno real. |
| Habilidades y progreso | 80% | XP provisional y validación estructural, sin balance largo. |
| Persistencia y recuperación | 80% | Turnos hipotéticos y commit independiente probados; falta recuperación de turno real. |
| Transiciones entre capítulos | 40% | Motor limitado a CH-000; cronología completa pendiente. |
| Evento y simulación del Día 0 | 30% | Evento establecido en canon pero falta manejo probado de transición. |
| Fabricación/evolución de Aster | 30% | Ficha técnica narrativa definida; sistema de construcción y pruebas no implementado. |

## Decisiones de mundo/personaje
- La identidad de Jack, sus relaciones, pasado del incendio, moralidad instrumental y origen de los ahorros están establecidos en `game/STATE.json` y `game/CHARACTER_JACK.md`.
- Los datos creativos delegados son revisables; faltan solo matices no bloqueantes como calendario civil exacto, cuantía del dinero y causa técnica específica del incendio.
- **Aster no es funcional.** `game/ASTER_SPEC.md` registra diseño y requisitos, no hardware probado. «UMP resistant» está sin resolver y se interpreta **tentativamente** como posible EMP; no debe considerarse protección efectiva.
- No es necesario pedir nuevas decisiones personales para narrar la primera escena: queda pendiente **la próxima acción libre de Jack**.

## Verificación real
- GitHub commit de actualización de personaje `97e97a7f499ecab5e580f3163b398bdb42e727d6`: **22/22** comprobaciones directas de estado/refs/continuidad posteriores al guardado.
- Turno de prueba histórico: **19** pruebas en entorno JS y guardado recuperado exactamente desde un commit desprendido, **no** progreso de Jack.
- **Pendiente:** ejecutar pruebas de Python y Node en checkout, realizar y recuperar un turno real, gestionar transición CH-000 a siguiente capítulo y Día 0.
- PR #2 permanece en borrador; `main` intacta. La partida de Jack sigue **Día −30, turno 0, cero eventos**.

## Política de inicio
Se puede comenzar el capítulo introductorio sin esperar una enciclopedia del mundo, pero no declarar que las mecánicas de una campaña larga o que Aster funciona. Antes de cruzar Día 0, completar su transición y validación. No avanzar ni simular turnos sin aportación del jugador.


### Actualización de integridad tras el informe

Se añadió el bloqueo explícito de guardado con porcentajes por evidencia, índices temáticos en subcarpetas y validación del archivo literal. La preparación global sigue siendo **una estimación**, no un porcentaje medido. Aún faltan pruebas CLI completas, un turno de juego auténtico recuperado entre chats, transición de capítulo y Día 0. No convertir este progreso de ingeniería en un evento de juego.

</details>
