# Narrative save attempt journal branch

This is a **separate, noncanonical** Git branch reserved for the durable
per-turn save-attempt ledger. It is not a source for narration and must NEVER
be merged into `work/chat-narrative-foundation` or `main`.

The main story is still CH-000 turn 9. At creation, **no** save attempt is
active and no turn-10 fixture has been written here.

When configured with a scoped GitHub token, `tools/github_save_journal.mjs`
stores an attempt's state under `.narrative-save-attempts/`. The coordinator
stops without a journal on the canonical narrative branch.

Only persist confirmed story text intended for this repository. Never commit
tokens or personal secrets. If a journal entry reports `blocked`, recover the
existing commit and original narration before any new player action.
