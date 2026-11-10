# Herramientas, validación y control

- [tools/turn_engine.mjs](turn_engine.mjs)
- [tools/narrative_archive.mjs](narrative_archive.mjs)
- [tools/save_gate.mjs](save_gate.mjs)
- [tools/validate_state.py](validate_state.py)
- [Bloqueo de narración y porcentaje de guardado](../docs/SAVE_BLOCKING_PROTOCOL.md)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.
