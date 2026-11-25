# Bounded NPC review with fair rotation — isolated QA

The original offscreen review constructed expensive narrative history packets for every eligible NPC and **then** applied its 20-character limit. It also gave habitual actors priority over newcomers. In a larger simulated city, this can waste work and hide NPCs that never previously acted.

`rankOpenNPCReviewCandidates` now scans only actor metadata to choose a bounded relevant set **before** retrieving histories and creating prompts. Due open commitments are considered first. Equally relevant actors are rotated deterministically in bounded review-sized blocks by the current saved turn rather than fixed alphabetical order. This is selection for possible editorial review, **not** an action scheduler. It neither advances world time nor changes an NPC state, and it never treats past action history as an obligation to act again.

Controlled independent tests cover 80 synthetic actors, 5 selected each turn and 16 successive review windows; the union must cover all 80. Overdue/due commitments retain priority; a prior NPC action does not grant permanent precedence. The real seven-actor checkpoint remains intact and provides its established review context normally.

**Limits:** The rotation assumes the eligible set remains stable during a fair-review window; heavily varying populations need a stronger long-term fairness ledger. The algorithm cannot prove actual NPC intention quality or fairness of narrative outcomes. It is a bounded selection aid, not automatic character decisions.

## Consolidated band quotas (QA only, 24 November 2026)

The priority-band reservation and rotation algorithm from PR #201 at
`c9db54f13ddff3e45ddefab2fe3bdf386cb492cc` is selectively incorporated into the existing prototype, retaining
explicit null-goal eligibility and the separate experimental aging/receipt helpers.
With sufficient slots every occupied band receives one slot, with remaining
capacity assigned in priority order. At capacity one, bands rotate; at capacity
two, due work keeps one slot and lower bands rotate when three bands exist.
Three original #201 saturation regressions and a no-goal multi-band regression
are retained. Existing saturation assertions were updated to require reserved
ordinary review instead of accepting starvation.

An isolated JavaScript execution of the exact candidate ranking functions
covered 6,578 stable-population/capacity combinations: 0–8 actors per band,
nonempty total, capacity 1–min(10,total), consecutive completed turns, at most
three times the total population in review windows; every case covered all
actors with no duplicate selection or unfilled capacity. This is not the
full Node suite and does not establish fairness under population churn,
variable review cadence, repeated explicit urgent overrides or skipped turns.
The durable aging ledger is still experimental, not a production adapter.
No NPC is compelled to act by review selection. No canonical save is changed.
