# Pruebas y gates de calidad

- [tests/save_gate.test.mjs](save_gate.test.mjs)
- [Pruebas del adaptador HTTP GitHub (D-043)](github_save_adapter.test.mjs)
- [Pruebas integrales de guardado y recuperación (D-042)](save_transaction.test.mjs)
- [tests/turn_engine.test.mjs](turn_engine.test.mjs)
- [Pruebas de efectos causales (D-040)](state_changes.test.mjs)
- [tests/test_backstory_aster.py](test_backstory_aster.py)
- [tests/test_character_profile.py](test_character_profile.py)
- [tests/test_starting_checkpoint.py](test_starting_checkpoint.py)
- [tests/index_paths.test.mjs](index_paths.test.mjs)
- [tests/test_literal_archive_validator.py](test_literal_archive_validator.py)
- [docs/QA_SCENARIOS.md](../docs/QA_SCENARIOS.md)
- [docs/TURN_TESTING.md](../docs/TURN_TESTING.md)

- [Pruebas de consecuencias](consequences.test.mjs)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

- [Consecuencias narrativas del turno 9: mochila, reloj y Aster](test_turn9_consequences.py)

## Living World (rama de revisión)
- [Disponibilidad y rutas](living_world_availability.test.mjs)
- [Rutinas autónomas](living_world_routines.test.mjs)
- [Integración con acontecimientos y cinco archivos](living_world_coordinator.test.mjs)
- [Diagnóstico y privacidad](living_world_diagnostics.test.mjs)
- [Trayectos contextuales, referencias y recuperación literal](living_world_travel.test.mjs)
- [Capítulos e identificadores globales](chapter_management.test.mjs)
- [Transición transaccional y recuperación interrumpida](chapter_save_transaction.test.mjs)
- [Validación Python de varios capítulos](test_multichapter_validator.py)
- [Planes condicionales y obligaciones](world_plans.test.mjs)
- [Piloto sintético completo de Rosa entre capítulos](world_plan_pilot.test.mjs)
- [Informe de resultados y límites](../docs/LIVING_WORLD_COORDINATOR_QA_20261110.md)
