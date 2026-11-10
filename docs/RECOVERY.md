# Context loss, interrupted writes and continuity recovery

A long game can exceed chat context, switch devices or lose tool access. **Conversation memory is not durable evidence.** Repository checkpoints are the recoverable source, but only after consistency checks.

## Recovery workflow (required on resumption)
1. Read `AGENTS.md`. Confirm repo, branch, open PRs and whether the desired save is still on that branch. Do **not** assume `main` includes a draft PR.
2. Fetch `game/SAVE_MANIFEST.json`, `game/STATE.json`, the referenced chapter file and its event log, plus CANON and DECISIONS. Read `docs/NARRATIVE_CONTRACT.md`, `docs/NARRATOR_RULES.md`, `docs/STATE_SCHEMA.md` and `docs/HANDOFF.md` for relevant rules. A quick handoff is never sufficient by itself.
3. Verify saved turn, chapter ID, schema versions, last event ID and sequence, chronology, no premature awakenings, archival consistency of old RPG fields (never award new XP), actor IDs, knowledge and unresolved threads. Run `python tools/validate_state.py` when a repository checkout with Python is available; its checks are necessary but not sufficient for narrative consistency.
4. Rebuild the situation: where/when the player is, what they just did, what happened elsewhere, NPC goals, secrets known to each actor, active tensions and precisely which player input is pending.
5. Resume from that point. If documents conflict, **do not roll forward from a guess**. Identify the last consistent saved commit and affected files, reconcile event and state from that commit, then resume. Ask the owner only if the conflict would change canonical outcomes.

## Crash-safe write discipline
- Work on the authorized branch. Prepare the complete next event, chapter text, state and optional handoff **before writing**.
- Verify current file SHAs/head to avoid overwriting parallel edits. Each update uses the SHA obtained from that branch.
- Write event log, chapter prose and state; validate them. Write `game/SAVE_MANIFEST.json` **last**, fetch it back, and verify all files align with it. Then announce the saved turn.
- GitHub Contents API updates are separate commits: this procedure does **not** provide an atomic transaction. A crash between writes may leave partial changes. The old manifest remains the last completion marker.
- On partial write, do **not** trust the new HEAD merely because it exists. Inspect history for the last commit at which the manifest and its dependent files all matched. Recover that coherent checkpoint on a new branch or by safe forward repair after inspection; do not force-push, silently reset or erase other agents' work.
- If a coherent snapshot cannot be proven, stop and say exactly which actions/events are unverified. Never duplicate a played turn or invent an event to close a gap.

## Lightweight post-session handoff
Update `docs/HANDOFF.md` with date, branch, manifest turn/event ID, chapter/day, current scene, important NPC and faction developments, open player choice, changed files, tests, uncertainties, and next task. Distinguish **confirmed saved** from **planned** or **chat-only**. Keep handoff short; canonical facts stay in their primary files.

## Limits
No real-time background simulation when the assistant is not running. Each new response can advance in-game offscreen activity based on elapsed fictional time. A public repo must contain only intentionally public fictional story data.


## Preferred atomic save path

If GitHub Git Data API access permits, prepare all changed files including `game/SAVE_MANIFEST.json` in **one new Git tree and one commit**, then update the branch ref with an expected-head check (non-force). The branch ref update makes the complete snapshot visible atomically and is preferable to the older separate-Contents-API manifest-last method. If that API is unavailable, use the staged manifest-last fallback and strict recovery checks. Never claim either path was used without verifying the new commit and reading back authoritative files.


## Literal transcript recovery gate

Read `chapters/CH-NNN.transcript.json` for the current and any past played chapters. Verify exact sequential `TXT-` IDs and that `manifest.last_transcript_sequence`, `manifest.last_transcript_id`, and `state.history.last_transcript_sequence` match. Every played turn needs the player's full message and at least one entire assistant response. A transcript with missing entries or event links is not a coherent checkpoint. **Never reconstruct missing dialogue or paragraphs from summaries, chat memory or intuition**; report that exact words are unavailable. La referencia antigua al capítulo vacío describe un estado previo. El checkpoint del 2026-11-10 contiene seis turnos, 21 eventos y 14 entradas literales. Comprobar siempre el manifest actual; no usar esta fecha como garantía de un estado futuro.


## HARD STOP PRIORITY — overrides permissive fallback (D-028)

If ANY save step fails or an attempt is incomplete, **do not advance or display the next story scene**. Use the seven evidence-backed percentages in `docs/SAVE_BLOCKING_PROTOCOL.md`. Do not claim time-dependent progress. Show blocked percentage with exact cause and pending stage; stop for this response if necessary. On next user input `CONTINUAR GUARDADO`, retrieve the branch HEAD and artifacts and reconcile an unverified commit before completing or retrying. If the original full text was lost, ask user to recover it rather than guess. Never accept new story actions until five-file readback has finished at 100%. On unresolvable conflict, preserve the last coherent commit and report blockage.

## Distinción entre guardado y entrega (D-038)
Un commit con cinco archivos leídos idénticos demuestra persistencia remota pero no prueba que la interfaz entregó el texto. Ante una entrega perdida o interrumpida **no crear nuevos eventos**: recuperar la narración literal ya archivada y emitir la misma escena. Si el usuario responde a esa escena, no exigir un acuse adicional. Esto no debilita el bloqueo D-028 ante una falla de guardado.

## D-036/D-037 override

The active project is an **interactive novel**, not an RPG. Frozen legacy XP/attribute records must not drive results; update story capabilities qualitatively. Jack's owner-established active network of 500+ preexisting devices and nine later Café Bruma devices are fictional canon regardless of missing individual index rows. Do not treat outdated setup notes as live checkpoints. Apply [NARRATIVE_CONTRACT.md](NARRATIVE_CONTRACT.md) during recovery.


## D-042 — ensayo de recuperación integral sin avanzar la novela

`tools/save_transaction.mjs` implementa la secuencia de cinco archivos mediante un adaptador remoto inyectado: recuperar HEAD y checkpoint, validar, construir **una** continuación, validar prosa/eventos/estado, crear un commit Git atómico, actualizar la rama con comprobación de HEAD y releer exactamente los cinco archivos. Solo el resultado `status=verified` al 100% autoriza entregar la escena.

La transacción devuelve `status=blocked` con etapa y evidencia ante falla. `recoverFiveFileSave` utiliza **el mismo commit SHA y los mismos textos exactos**; nunca vuelve a ejecutar el generador de escena, ni crea un segundo turno. Si cambió el HEAD por otro escritor, falta el SHA o se perdió el texto, se detiene; no hace force-push ni inventa narración. El resultado bloqueado **debe conservarse externamente** para recuperación futura: la librería no guarda por sí sola un diario persistente ni se conecta a GitHub. El adaptador real debe efectuar un commit con un solo árbol de cinco archivos y un cambio de rama protegido.

`tests/save_transaction.test.mjs` simula el repositorio, una caída después del ref, una caída entre commit/ref, conflictos, alteración de bytes y repetición. Es una prueba sintética, **no** un turno jugado, ni prueba una escritura real end-to-end en GitHub. El bloque D-028 sigue vigente si una escritura auténtica falla.


## D-043 — GitHub real, prueba aislada, y adaptador sin secretos (2026-11-10)

**Crítica del enfoque previo:** hasta D-042 los tests solo usaban un Git simulado. No demostraban que GitHub conservaría un commit de cinco archivos después de interrumpirse el proceso, ni existía adaptador REST reutilizable. Tampoco el resultado de una suite técnica mide la calidad literaria de la escena.

**Prueba REMOTA de recuperación completada:** rama **exclusiva de QA** `qa/story-save-recovery-d043-20261110`, creada desde `96b9d73b7945686cac4a9090d0a759d8ecd3d3d2`. Se preparó un turno **sintético/no canónico** en cinco archivos con commit `d637304e2665828e5c53cb76fd40e0e4a6ade7ec`; se detuvo el procedimiento después de crear el commit y **antes de mover la rama**, se verificaron remotamente sus cinco archivos por SHA, se reanudó en una operación diferente, se aplicó actualización no forzada con HEAD esperado y se leyó literalmente de nuevo la rama. **No se creó un segundo commit** ni se afectó la rama narrativa. Ese turno 7 de QA **no es una acción del propietario**, jamás usarlo como checkpoint de juego.

**Implementación:** `tools/github_save_adapter.mjs` aporta las operaciones reales `readHead`, `readFiles`, `createCommit` y `updateHead` por API GitHub REST para `tools/save_transaction.mjs`, con credenciales externas y cinco blobs en un solo árbol. `tests/github_save_adapter.test.mjs` prueba lectura, escritura, errores HTTP, colisiones y recuperación con transporte HTTP simulado (sin usar ni exponer un token real). El adaptador **no se ejecutó directamente con token real** en la prueba remota: se verificaron las mismas primitivas Git mediante el conector autorizado. GitHub REST dispone de *read-then-update* y *non-force fast-forward*, pero **no de CAS atómico con expected SHA**. No prometer bloqueo perfecto ante carreras arbitrarias.

**Evidencia de CI:** [GitHub Actions #42912600548](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/42912600548) para `ca414ffe56d8faff9dae739046d3a5d4bb525c8e`: **75/75 JavaScript**, **20/20 Python** y `python tools/validate_state.py` PASS. El primer CI detectó identificadores falsos de longitud inválida y ruta `../repo` no rechazada; corregidos antes de aprobar. La continuidad narrativa todavía requiere revisión editorial y el próximo turno auténtico del lector no se ha jugado.

**Canon protegido:** rama `work/chat-narrative-foundation` y PR #2 conservan **CH-000, Día −30, turno 6, EV-000021 y TXT-000014**. Los cinco blobs del checkpoint no se tocaron. Jack continúa en el taller con Elena esperando una respuesta sobre una USB. Mantener la PR en borrador; no fusionar ni reutilizar `qa/*` como fuente narrativa.

