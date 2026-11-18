# 05 — Persistencia y bloqueo obligatorio

- [Bloqueo de narración y porcentaje de guardado](../SAVE_BLOCKING_PROTOCOL.md)
- [docs/RECOVERY.md](../RECOVERY.md)
- [docs/FULL_NARRATION_ARCHIVE.md](../FULL_NARRATION_ARCHIVE.md)
- [docs/CHAPTER_PROTOCOL.md](../CHAPTER_PROTOCOL.md)
- [docs/STATE_SCHEMA.md](../STATE_SCHEMA.md)
- [Evidence-linked context and verified remote loader](CONTEXT_MANAGEMENT.md)
- [Manifest coherente del último checkpoint](../../game/SAVE_MANIFEST.json)
- [Estado autoritativo del mundo](../../game/STATE.json)
- [Transcripción completa y literal](../../chapters/CH-000.transcript.json)
- [tools/save_gate.mjs](../../tools/save_gate.mjs)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

## Direct GitHub-only persistence

- [ChatGPT connector-native, no-server journal and five-file save protocol](CHATGPT_GITHUB_NATIVE_SAVE.md)
- [Dated repository persistence checkpoint](../00_start/REPOSITORY_CHECKPOINT_2026-11-17.md)
