# Living World — integración gradual y puerta de activación (D-048)

**Decisión:** incorporar los módulos revisados a la rama narrativa, sin activar generación de sucesos automática ni adelantar la historia. La única fuente narrativa es el guardado de `work/chat-narrative-foundation` (CH-000, turno 9, día −29, EV-000029/TXT-000020). Revisión base 2026-11-10.

## Resultado realizado
- Integración de código, pruebas, guías y QA mediante avance protegido no forzado de `work/chat-narrative-foundation` desde HEAD `1994eb47121046742196c2b924a047441dee11ed` a `068a2bf25dd3fa3552f16fde45a87f0eabcac13f`. Comparación previa: 23 commits por delante, 0 detrás; **solo** ficheros bajo docs/, tests/ y tools/. Sin cambios de canon, capítulos, estado o manifiesto.
- Lectura remota posterior: SHA de `game/SAVE_MANIFEST.json` `897ec2e77ece4f8edf506c7058552a5dd3cdb320`, `game/STATE.json` `0320a93ebf4a944da97b65dffa6d281acce46d94`; `chapters/CH-000.md` `e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4`, eventos `1f40c724e44f70c9b45814dc11ff1f73262c5a5`, transcripción `1350916ead7fb1f2f15fdd635dda42e69a0a3fed`. Ningún archivo fue alterado respecto a antes de la incorporación.
- Pruebas independientes originales: GitHub Actions run `42952186293`, 133/133 Node y 24/24 Python, validador PASS; escenario QA remoto de cinco archivos recuperado; sintético NO CANÓNICO. Las mismas SHA de módulos y pruebas quedaron recuperadas de la rama narrativa tras la integración. Se conservaron las bases de la novela; **no se ejecutó una nueva suite después del fast-forward**, y no se afirma lo contrario.

## Revisión crítica para próxima fase
1. **Privacidad:** `tools/turn_engine.mjs` todavía incluye `Independent event ...` con resultados completos de NPC fuera de escena en el capítulo Markdown. Es apropiado registrar acontecimientos privados en `events.json`, pero es un riesgo de spoilers si se envía/lee `CH-000.md` como texto para el jugador. El texto visible se compone de `turn.narration_messages` y debe seguir limitado a lo que Jack puede conocer. No activar volcado de actividad independiente hasta corregir y probar la separación.
2. **Tiempo:** el dato `clock_time=null` y el día relativo -29 no establecen hora exacta o weekday. No convertir horarios tentativos en canon.
3. **Arquitectura:** ChatGPT narra. El diagnóstico es privado y read-only; un candidato no es un evento jugado ni un guardado. El guardado real requiere consentimiento contextual del jugador para la acción, revisión literaria, commit de los cinco archivos y lectura remota exacta.
4. **Recuperación:** la rama QA `qa/living-world-integration-20261110` contiene CH-000 turno 10 sintético y nunca debe usarse para reanudar ni fusionarse con la narrativa. PR QA #3 cerrada sin merge.

## Puerta de activación
- [x] Módulos y pruebas disponibles en rama narrativa sin modificar historia.
- [x] Pruebas Node y Python y guardado remoto completadas previamente sobre los mismos artefactos.
- [ ] Corregir filtración de resultados privados del capítulo para salida pública y añadir pruebas de no-spoilers.
- [ ] Validar un escenario de narración con autonomía selectiva sin forzar eventos ni opciones, bajo un nuevo checkout/suite.
- [ ] Usar el coordinador en un **turno real solicitado por el jugador**, con cinco artefactos y readback remoto, sin reescribir CH-000 pasado.

**No activar de forma automática** ni prometer simulación en segundo plano. Hasta entonces, la narración tradicional y el save gate D-028 mantienen autoridad.
