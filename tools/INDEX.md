# Herramientas, validación y control

- [tools/turn_engine.mjs](turn_engine.mjs)
- [Motor de cambios causales de estado (D-040)](state_changes.mjs)
- [tools/narrative_archive.mjs](narrative_archive.mjs)
- [tools/save_gate.mjs](save_gate.mjs)
- [Adaptador real GitHub REST de cinco archivos (D-043)](github_save_adapter.mjs)
- [Transacción de cinco archivos y recuperación (D-042)](save_transaction.mjs)
- [tools/validate_state.py](validate_state.py)
- [Bloqueo de narración y porcentaje de guardado](../docs/SAVE_BLOCKING_PROTOCOL.md)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

## Living World (propuesta, no canon)
- [Disponibilidad y conexiones](living_world_availability.mjs)
- [Rutinas y borradores autónomos](living_world_routines.mjs)
- [Coordinador de turnos revisados y guardado](living_world_coordinator.mjs)
- [Diagnóstico privado y proyección visible para Jack](living_world_diagnostics.mjs)
- [Evidencia de integración](../docs/LIVING_WORLD_COORDINATOR_QA_20261110.md)
