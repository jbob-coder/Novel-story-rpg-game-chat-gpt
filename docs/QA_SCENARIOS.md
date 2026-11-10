# Interactive novel continuity and narrative acceptance scenarios (D-036)

These are planned end-to-end tests for real play. Passing the structural validator alone is **not** sufficient.

1. **Cold start after context loss.** In a fresh chat, read `AGENTS.md`, manifest, state, current chapter and events. Recover the current manifest chapter/turn (at D-036: CH-000, turn 6) and pending scene without relying on a chat summary.
2. **Consecutive player turns.** Jack performs an action; log intent, event, qualitative outcome, chapter prose and manifest. Confirm no RPG XP/ranks/levels are newly awarded and that a later session recovers consequences.
3. **Learning from failure.** An instructive failure changes Jack's knowledge or relationships when justified. No numerical XP, ranks or trivial progress farming.
4. **Offscreen NPC agency.** While the player ignores a faction, record a plausible independent NPC decision and later effects without assuming everyone knows it.
5. **Actor knowledge isolation.** A private conversation cannot influence a distant NPC until a documented communication, observation or inference route exists.
6. **Time and shockwave.** Before Day 0 no shockwave powers or wave-created flora/fauna anomalies. On Day 0 the event occurs once; delayed or absent awakening remains possible.
7. **Partial write recovery.** Simulate event-log update without state/manifest update. Validator must flag the mismatch; recover prior coherent checkpoint without duplicate turn or forced rewrite of another contributor's files.
8. **State drift.** A changed manifest, missing chapter or duplicate event ID is detected. Do not narrate from an inconsistent checkpoint.
9. **Player agency.** Free-form actions beyond suggested choices remain accepted. No predetermined villain/hero identity or mandatory awakening.
10. **Privacy and public repo.** Fictional records only; no unapproved real-world private data, credentials or account details.

## Known unverified
By the D-036 checkpoint six story turns and event EV-000021 are recorded. The revised novel-only flow, NPC continuity across future chapters, and interrupted writes still require full end-to-end tests. Prior RPG balancing scenarios are retired. Record actual test outputs and commits in the PR or status document, never label these scenarios passed in advance.


## Guardado bloqueante y organización (D-028/D-029)

11. **Falla remota al 10%:** tras recuperar el HEAD, falla GitHub. El asistente debe informar `🚩 GUARDADO BLOQUEADO — 10% verificado`, no narrar más y esperar `CONTINUAR GUARDADO`.
12. **Commit antes de lectura 100%:** crear un commit y mover la rama no basta. Con cinco archivos sin lectura idéntica, el progreso máximo confirmado es 85% y la historia sigue bloqueada.
13. **Contenido íntegro:** alteración de un carácter en `CH-000.transcript.json` debe impedir desbloquear; resúmenes/eventos no reemplazan texto literal.
14. **Cambio de HEAD:** al reanudar, si otro agente avanzó la rama, detenerse y reconciliar; no hacer force push ni sobreescribir.
15. **Respuesta agotada:** el mensaje puede consumir la respuesta completa para dar estado/porcentaje. Ningún trabajo continúa en segundo plano; el siguiente input reanuda la verificación, no un nuevo turno.
16. **Índices sin enlaces rotos:** todos los 18 índices y sus referencias deben existir. El inventario debe conservar una sola ubicación canónica por recurso.

**Ejecución:** 15 pruebas dinámicas del flujo de bloqueo y narración aprobaron en el entorno JavaScript de esta sesión; 18 índices fueron leídos desde GitHub sin enlaces rotos. Los tests de Python y Node como procesos CLI aún no han sido ejecutados en checkout.

17. **No RPG regression:** ensure the new turn engine rejects any `awards` for player or NPC; legacy progression numbers remain unchanged.
18. **Canon continuity:** ensure the 500+ prior active fictional devices and nine new Café Bruma records are not repeatedly described as mere unverified proposals. No fictitious individual IDs or exact bank balances invented.
19. **Cyber narration:** only depict fictional high-level events and their human consequences, not reproducible compromise, persistence or concealment steps.
