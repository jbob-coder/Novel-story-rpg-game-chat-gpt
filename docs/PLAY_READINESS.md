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
