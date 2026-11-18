# No-server ChatGPT Plus + GitHub story persistence

## Authority and cost boundary

The repository is the **one authoritative save**. ChatGPT is the narrator.
Use an already-authorized GitHub connector in the ChatGPT session. No Codex,
custom MCP, external server, paid hosting, SQLite or extra API credential is
required for the connector-native path. Code stored in GitHub does not itself
connect ChatGPT or execute continuously. Existing token-based Node adapters
remain optional for external runtimes.

Authorized narrative branch: work/chat-narrative-foundation.
Journal branch: journal/living-world-save-attempts (never merge into story).
Five canonical files per atomic turn:
- chapters/CH-NNN.transcript.json
- chapters/CH-NNN.events.json
- chapters/CH-NNN.md
- game/STATE.json
- game/SAVE_MANIFEST.json

The transcript stores literal player and narrator text, events store causes,
STATE stores materialized world facts, and the manifest identifies the coherent
turn. Character relationships, equipment, inventories, obligations and secrets
remain in the existing state/events system, not a second worldstate database.
Legacy RPG progression is frozen; the current project is an interactive novel.

## Safe journal baseline for an already existing story

Before this integration the canonical branch had CH-000 turn 9 but the journal
file was absent. Never fabricate a "verified" journal entry for an old turn.

Journal file path on the journal branch:
.narrative-save-attempts/d29yay9jaGF0LW5hcnJhdGl2ZS1mb3VuZGF0aW9u.json

After a fresh read of branch HEAD, manifest, five files, chapter history and
validation, and *only if no entry exists*, write a ready baseline. Example
using the inspected November 17 checkpoint (refresh the SHA/IDs before use):

    {
      "status": "ready",
      "branch": "work/chat-narrative-foundation",
      "baselineHead": "e503029c96444ce9273f64dbaade4f904412b2a6",
      "chapterId": "CH-000",
      "turn": 9,
      "lastEventId": "EV-000029",
      "lastTranscriptId": "TXT-000020"
    }

Ready means original pre-journal evidence was identified. It is NOT a completed
new save, verified narration delivery or approval to advance the fictional day.
The ready record is one-time only and must NEVER overwrite a blocked or verified
attempt. The code checks byte equality with baseline when documentation-only
commits have advanced HEAD. A different canonical story requires investigation.

## Connector-native save protocol

1. Read authoritative ref and journal, then manifest and all five files at a
   single immutable Git commit. Include closed-chapter history. Validate and
   reread HEAD. Block on unresolved attempts or inconsistent anchors.
2. Use the existing verified context loader for a bounded working context.
   Retrieve relevant events, NPCs, facts and documents by IDs on demand;
   summaries are navigation aids, not canon.
3. Only after the owner makes an actual free-form story choice, prepare the
   exact literary reply and complete structured changes; review visibility,
   chronology, NPC knowledge, causal effects and original text.
4. Validate the proposed full checkpoint. Write a durable blocked journal entry
   on the journal branch with source HEAD and exact candidate bytes BEFORE any
   canonical story commit. Read the journal back. Use GitHub create/update file
   with observed blob SHA to avoid overwriting a concurrent journal writer.
5. Create ONE Git tree with all five files based on the observed story tree;
   create ONE commit parented to original HEAD. Record its detached commit SHA
   in the journal BEFORE moving story ref.
6. Update story HEAD via non-force expected-SHA GitHub connector operation;
   reread all five exact bytes, validate state/events/manifest and confirm ref.
7. Write verified journal record with no staged duplicate copy and reread.
   Only then display the literal saved narration, not a regenerated paraphrase.

Never individually update the five canonical files with separate contents API
commits. GitHub Git-object tools and the authorized connector can perform the
operations without a custom MCP or repository PAT. A repository script cannot
automatically call ChatGPT tools; future sessions must execute this protocol
using their live authorized connector. Git ref operations are not a general
multi-writer database transaction; reject conflicts and do not force push.

If a write fails, keep the blocked record, recover original stored bytes/commit
and preserve the exact turn. A QA fixture, documentation update or read-only
query is not a player turn.

## How to reduce development time safely

- Read only the checkpoint, small context packet and relevant source IDs first.
  Do not reread an entire city/world bible for each small decision.
- Reuse existing context_manager, verified_context_loader, event history,
  turn engine, world-plan tools and tests before creating a new subsystem.
- Group small validated changes into one task-specific branch and PR.
  Run focused tests plus the current Node, Python and manifest validators.
- Keep known facts, rumors, proposals and private NPC intentions distinct.
  Do not treat unverified worldbuilding as established canon.
- Preserve other agents' branches and all five story files during development.
- No background narrative simulation. Time advances only with justified
  in-fiction turns based on actual player actions.

## Evidence required before claiming full live repair

The storage-level baseline may be initialized and read back independently.
This alone does not prove a ChatGPT session can complete journal-backed turns.
Test the *actual connector path* on separate QA branches first:
blocked -> detached commit -> ref -> exact five-file readback -> verified,
then recovery from a deliberate interruption, without canonical story writes.
