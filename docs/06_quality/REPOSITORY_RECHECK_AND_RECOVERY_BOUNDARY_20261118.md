# D-061 — Independent repository recheck and recovery-boundary security audit

**Local audit date:** November 18, 2026 (America/Puerto_Rico).
**Project:** Living Superhuman World, `jbob-coder/Novel-story-rpg-game-chat-gpt`.
**Authoritative source at audit start:** `work/chat-narrative-foundation` @ `a10e049cedf662f2d9d7be0fefdba853035ebdbc`.
**Audit branch:** `audit/recovery-edge-cases-and-checkpoint-crosscheck-20261118`, PR #77.
**Nature:** source verification and QA hardening. **Not** a narrated turn, canonical world edit, map integration, or a release.

## 1. Time-of-day and saved continuity: verified

The original literal CH-000 opening transcript reads "*Día −30, noche*" at Crosswater. Current `game/STATE.json` reads `day=-29`, `time_of_day=morning`, no exact date/clock; the pending scene explicitly says "*media mañana*". The manifest gives `CH-000`, turn 9, `EV-000029`, `TXT-000020`. The latest chapter event also belongs to Day −29. These two times refer to **different fictional days** and are consistent. Describing the **current** scene as "evening" is wrong; describing the **opening** as night is right.

Jack remains in the Wilson workshop; Aster's first arm has mechanical assembly only and no powered motion, autonomy or load test. Elena has left with backpack/USB *toward* school, not arrived; Rosa has a repaired alarm clock awaiting return. Seven named saved NPCs, one transit faction, eight LOC places plus the CITY container. Day 0 shockwave has not occurred, no CH-001 and no turn 10. No RPG XP/levels as active mechanics.

## 2. Repeated integrity review

- Reread canonical ref and separate `journal/living-world-save-attempts` record; canonical journal remains `ready`, anchored at `d1218c16f3b141816267b4daa33d8a9f8ef495b6`, CH-000 turn 9 / EV-000029 / TXT-000020.
- Independently compared the five exact original Git blob SHA IDs at that journal baseline and the most recent pre-audit authoritative branch: **all identical**, not inferred from text summaries.
- Current original checkpoint had 135 tracked paths, all indexed, 18 detailed area sections A00–A17; the immutable Nov 17 source snapshot remains pinned to its original 129 blobs, not silently refreshed or rewritten.
- The earlier independent audit CI tested every tracked JSON file, all internal Markdown file paths, the immutable source blob map, literal timeline, and future CH-001 compatibility. No broken local paths or malformed tracked JSON were found at that point. This repeat inspection also verified the authoritative repository remains distinct from `main`.
- The three reviewed Meridian Bay **draft** regional fragments and the defined 8/13 known draft exterior links remain separate from the saved story. None constitutes a complete city, active business or traversable new map. Earlier physical fragment validation did not authorize a city merge.
- All tests cited below are scoped to their actual code/fixture environments; a passing CI pipeline does not test visual map completeness, literary quality, reader delivery or user-chosen turn 10.

## 3. New root-cause defect discovered and repaired

**Problem:** the exported lower-level `recoverFiveFileSave` originally returned the caller's object immediately when `blocked.status === 'verified'`. No remote ref, exact five-file blob, complete phase history, or narration-readback check occurred. A caller-supplied forged `verified` record could therefore appear accepted. Additionally, calling this exported recovery API directly for the canonical branch did not require matching evidence from the independent durable journal, bypassing the stricter `recoverJournaledSave` entry point.

**Correction:** direct verified recovery now validates the entire stage/evidence list, source/commit identity, exact immutable five-file content and current ref, then returns original literal narration. A direct canonical recovery now requires an exactly matching separately stored journal record. Invalid targets `main`, `journal/*`, and `backup/*` block before ref changes. Malformed forged records block cleanly rather than raising a secondary exception while downgrading the result.

**New regression cases (5):** forged verified record rejected; modified stored chapter detected; valid verified readback returns unchanged literal text; canonical recovery refuses absent/mismatched journal; prohibited recovery targets rejected. Historical write-transaction and seven-stage validations remain intact. **No alternative authoritative save or new hosted service was created.**

## 4. Evidence and remaining gates

The code/test checkpoint on PR #77, SHA `3e488a9946487c23f434df5f73731c1317f4466d`, passed [GitHub Actions #44237350733](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44237350733): **320 Node tests passed, 0 failed; 45 Python tests passed; canonical save validator passed**. The final report+index commit requires fresh CI at its own SHA before integration; retain the exact checked commit in the handoff.

**Not independently completed:** a full valid *changed* turn using the in-chat GitHub connector and journaled five-file save/recovery; evidence that the literal narration actually reached the player; full Meridian Bay physical admission, advanced NPC society mechanics, Day 0, or a real chapter rollover. Earlier token-backed Node changed-turn QA and connector no-op transport QA are not the same thing as a live in-chat owner turn.

GitHub's non-force ref update is still not database-grade atomic CAS across independent writers; concurrent saves require a single authoritative narrator/lease or explicit conflict resolution. Do not force push. The original repository is public, so do not commit real secrets.

## 5. Follow-up workflow

Start with actual GitHub HEAD, journal and manifest, then the [Nov 17 immutable-source checkpoint](../00_start/REPOSITORY_CHECKPOINT_2026-11-17.md), [A00–A17 area board](../00_start/AREA_STATUS_AND_TASKS_2026-11-17.md), [first independent audit](REPOSITORY_CHECKPOINT_INDEPENDENT_AUDIT_20261117.md) and [current direct connector protocol](../05_persistence/CHATGPT_GITHUB_NATIVE_SAVE.md). For each new code change, record source SHA, test evidence, what was *not* tested, and any unresolved owner decisions.

**Priority:** one valid changed-turn, connector-native QA on isolated test branches, with no canonical play, plus continued conservative Meridian Bay/needs integration. Only the player's actual free-form action may initiate CH-000 turn 10, and literal narration must be durably saved/read back before delivery.

**Conclusion:** the timeline and tracked checkpoint state were consistent. This second audit discovered and fixed an additional real direct-recovery trust boundary. The historical checkpoint is preserved; unverified production behaviors remain explicitly open.
