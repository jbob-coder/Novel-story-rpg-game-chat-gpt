# Owner-authorized story revisions — exceptional workflow

**Default:** Played transcripts, events, and state checkpoints are immutable history. Never silently rewrite earlier dialogue or outcomes.

## When the owner explicitly asks to redo a played scene
- Confirm whether the request changes only literary presentation or also the **canonical outcome**.
- Verify the latest committed state, chapter, transcript and last event. Only rewrite a **last completed turn with no later played turn**, unless the user expressly authorizes a larger, fully reconciled history rebuild.
- Preserve the player's original action literally.
- Before replacement, write a revision audit file into `chapters/revisions/`: prior verified commit, original complete narrator message, original event records and relevant former state fields. Git history is additional proof, not the sole archive.
- Update the active transcript entry and event causality, inventory, NPC knowledge, relationships, time, consequences and state **as a single coherent revision**. Never append another player-action turn or award XP for a repeated action. New NPC events in the *same turn* may be recorded if the replacement result logically requires them.
- Write a stable revision ID in the revised transcript and history and a public decision in `docs/DECISIONS.md`. Ensure revision indexes and file inventory reference the archived copy.
- Validate before Git commit. Commit **all five canonical checkpoint files together** (transcript, events, chapter Markdown, state, manifest) with revision documentation, even when some are byte-identical; update branch with expected-HEAD protection.
- Read back the exact five files and compare the committed blob SHA hashes and structural counters. **Never show the revised story as verified before 100%.**

A revision does **not** advance calendar time or create a new player turn. If verification fails, use `docs/SAVE_BLOCKING_PROTOCOL.md` and halt story progression until fully recovered.

## Current revision
- `REV-CH000-0001`: owner-requested rewrite of *El precio de una señal*, CH-000 turn 2.
- Historical canonical parent for the superseded version: `c21185335ffb51c26ef54c5fd9b36d51c40ca35d`.
- Earlier version saved in [revision archive](../chapters/revisions/REV-CH000-0001.json).
- New version: two fictional balance readings and a coffee-shop register incident with Mara Reyes. **Two turns remain played**; no third turn was created.
