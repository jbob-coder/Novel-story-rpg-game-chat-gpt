# Bounded NPC review with fair rotation — isolated QA

The original offscreen review constructed expensive narrative history packets for every eligible NPC and **then** applied its 20-character limit. It also gave habitual actors priority over newcomers. In a larger simulated city, this can waste work and hide NPCs that never previously acted.

`rankOpenNPCReviewCandidates` now scans only actor metadata to choose a bounded relevant set **before** retrieving histories and creating prompts. Due open commitments are considered first. Equally relevant actors are rotated deterministically in bounded review-sized blocks by the current saved turn rather than fixed alphabetical order. This is selection for possible editorial review, **not** an action scheduler. It neither advances world time nor changes an NPC state, and it never treats past action history as an obligation to act again.

Controlled independent tests cover 80 synthetic actors, 5 selected each turn and 16 successive review windows; the union must cover all 80. Overdue/due commitments retain priority; a prior NPC action does not grant permanent precedence. The real seven-actor checkpoint remains intact and provides its established review context normally.

**Limits:** The rotation assumes the eligible set remains stable during a fair-review window; heavily varying populations need a stronger long-term fairness ledger. The algorithm cannot prove actual NPC intention quality or fairness of narrative outcomes. It is a bounded selection aid, not automatic character decisions.


## Anti-starvation across priority bands (2026-11-24)

The initial deterministic rotation covered actors of **equal** priority,
but an indefinitely overdue group occupying every review slot prevented
lower-priority actors from ever receiving editorial attention. The revised
review allocator guarantees a place for each priority band when capacity
allows and rotates bands across turns when it does not. After that minimum,
remaining capacity still favors overdue commitments. For a single review
slot, bands alternate: it is mathematically impossible to review an urgent
and an ordinary actor simultaneously. Each band rotates by its own actual
selection frequency, avoiding a parity alias that could repeatedly skip
some members.

Three synthetic regressions exercise persistent deadlines with twelve NPCs,
three levels with only two slots, and a single review slot. They establish
**review coverage**, not automatic actions, actor fairness in the story, or
quality of free-form intentions. No event, chapter, time or save is mutated.
