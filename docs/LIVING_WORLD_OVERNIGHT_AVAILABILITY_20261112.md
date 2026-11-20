# Living World: horarios nocturnos y conexión a Café Bruma (propuesta)
Fecha: 2026-11-12. Rama: `work/living-world-overnight-availability-20261112`.

## Problema
`availability()` solamente admitía franjas dentro del mismo día. Por tanto, un turno confirmado que continuara después de medianoche se rechazaba como horario inválido. Además, la tabla auxiliar de conexiones no contenía Market Row ↔ Café Bruma, aunque ya figura en el estado del mundo.

## Corrección
- Una franja empieza en el minuto local 0–1439 del día de la semana (0 domingo, 6 sábado). El final es **exclusivo**; valores del final entre 1441 y un máximo de 24 horas después del inicio representan una extensión explícita al día siguiente. Ejemplo de hipótesis técnica: `[1320,1560]` representa 22:00–02:00. El ejemplo no establece el horario oficial de ningún negocio.
- Al evaluar hoy se consultan tanto las franjas de hoy como los remanentes del día anterior, incluido sábado/domingo. Sin ambas jornadas documentadas se devuelve `unknown` para cualquier cierre que dependa del día anterior; jamás se supone que falta de horario significa cerrado.
- Las franjas inversas `[1000,500]` siguen inválidas: no se interpretan silenciosamente como turnos nocturnos. No se permiten turnos de más de 24 horas en una sola franja.
- `LINKS` ahora incluye la conexión ya establecida Market Row ↔ Café Bruma. No se han añadido locales ni distancias inventadas.

## Contrato
Estos son componentes de consulta y planificación, no horas canónicas. El checkpoint real mantiene `clock_time=null` y `calendar_date=null`; **nadie puede concluir que Café Bruma u otro negocio está abierto o cerrado actualmente** a partir de un calendario no confirmado. Ningún NPC se desplaza por sí solo mientras el chat está inactivo. La novela no avanza con este cambio.

## QA
Pruebas nuevas: arrastre de medianoche, sábado-domingo, frontera exacta, faltante día anterior, invalidaciones, geografía del café y ausencia de datos canónicos. Antes de activar horarios concretos, documentar y confirmar el horario y el día/hora ficticios por evento narrativo. Resultado de CI: [GitHub Actions run 43313742280](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/43313742280), Node **143/143**, Python **24/24**, validador del checkpoint **PASS**. Pruebas ejecutadas sobre el commit de código `1ff06d950d4f5c2e51de2b906ef6f5bb76e4aa44` más workflow de QA en rama aislada. PR QA #5 cerrada sin fusión; el workflow no se incorpora a la rama narrativa.
