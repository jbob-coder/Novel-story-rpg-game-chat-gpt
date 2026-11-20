# Living World — corrección de privacidad fuera de escena (D-049, 2026-11-10)

**Resultado:** el capítulo Markdown ya no incorpora automáticamente los resultados privados de eventos de NPC; esos resultados permanecen en `chapters/CH-000.events.json` y `game/STATE.json`. La narración visible sigue siendo la secuencia literal de `turn.narration_messages`, limitada a la información que Jack puede conocer. El cambio es **solo hacia adelante**; los capítulos ya guardados no se reescribieron.

## Evidencia verificable
- Rama de implementación aislada `work/living-world-private-chapter-20261110`; commit `bcfd86fe5ca5cd8598d6e3e9969221c5697a98be`.
- Modificados exclusivamente: `tools/turn_engine.mjs`, `tests/turn_engine.test.mjs` y `tests/living_world_coordinator.test.mjs`. La mutación elimina la línea que insertaba `Independent event` y `off.outcome` en el texto del capítulo.
- Dos pruebas nuevas: el resultado confidencial sigue registrado en eventos/estado, pero **no** aparece en prosa del capítulo ni en texto de transcripción visible; la validación del turno sintético también pasa.
- GitHub Actions `42953180071`: **135/135** Node PASS, **24/24** Python PASS y `python tools/validate_state.py` PASS. La suite de Node se corrió en la rama QA `qa/living-world-private-chapter-20261110`; PR #4 solo QA (NO fusionar).
- La comparación antes del avance a `work/chat-narrative-foundation` mostró exactamente tres cambios de herramientas/pruebas, **ningún archivo del capítulo, estado, manifiesto o canon**. El fast-forward esperado/no forzado llevó la rama narrativa del commit `02cb3bc1a83449bb02cf3844dcc0659d777d4b98` al commit probado `bcfd86fe5ca5cd8598d6e3e9969221c5697a98be`.

## Límites y siguiente uso
No existe simulación en tiempo real ni ejecución de NPC en segundo plano. El coordinador requiere el juicio causal del narrador y el acto libre del jugador. `clock_time` sigue sin definirse, por lo que los calendarios tentativos NO pueden convertirse en hechos. El módulo aún no está cableado para invocarse automáticamente desde ChatGPT. El próximo turno real solo puede generarse tras el mensaje libre del usuario, revisando escena, conocimiento y cinco archivos de guardado conforme a D-028.

La redacción histórica de escenas anteriores **no se modificó retroactivamente**. Si se entrega el capítulo completo como texto a un lector, revisar previamente las secciones antiguas por posibles spoilers. No usar la rama de ensayo sintético de turno 10 como canon. 
