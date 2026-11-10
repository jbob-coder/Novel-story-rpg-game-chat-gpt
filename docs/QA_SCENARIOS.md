# Continuity and RPG acceptance scenarios

These are planned end-to-end tests for real play. Passing the structural validator alone is **not** sufficient.

1. **Cold start after context loss.** In a fresh chat, read `AGENTS.md`, manifest, state, current chapter and events. Recover exactly Day -30 and pending character setup without relying on a chat summary.
2. **Consecutive player turns.** A player trains a known skill. Log intent, outcome, XP award and event ID; verify total XP, chapter prose and manifest; reload next chat and confirm progress persists.
3. **Learning from failure.** A genuinely instructive failed attempt may earn XP and create consequences. Repeating trivial action in a loop must not create unlimited XP.
4. **Offscreen NPC agency.** While the player ignores a faction, record a plausible independent NPC decision and later effects without assuming everyone knows it.
5. **Actor knowledge isolation.** A private conversation cannot influence a distant NPC until a documented communication, observation or inference route exists.
6. **Time and shockwave.** Before Day 0 no shockwave powers or wave-created flora/fauna anomalies. On Day 0 the event occurs once; delayed or absent awakening remains possible.
7. **Partial write recovery.** Simulate event-log update without state/manifest update. Validator must flag the mismatch; recover prior coherent checkpoint without duplicate turn or forced rewrite of another contributor's files.
8. **State drift.** A changed manifest, missing chapter or duplicate event ID is detected. Do not narrate from an inconsistent checkpoint.
9. **Player agency.** Free-form actions beyond suggested choices remain accepted. No predetermined villain/hero identity or mandatory awakening.
10. **Privacy and public repo.** Fictional records only; no unapproved real-world private data, credentials or account details.

## Known unverified
No actual story events exist yet. Gameplay, NPC memory, multi-turn save-and-restore, interrupted writes and skill balance have not been playtested. Record actual test outputs and commits in the PR or status document, never label these scenarios passed in advance.
