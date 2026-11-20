# Meridian Bay Phase 2 — NPC needs and established work

This increment connects qualitative NPC needs and service case history to the
admitted city, existing turn coordinator, chapter history and save journal.
It selectively adapts the needs module from PR #27 (`b08bf14d`) and the service
module from PR #15 (`59bf58cf`). It does not import their older engine branches,
city proposals, social-decision modules or synthetic story events.

## Scope

The existing job functions supported by this slice are Lena's terminal dispatch
review, Sora's Crosswater maintenance review and Mara's handwritten sales
reconciliation at Café Bruma. They identify work that a narrator can resolve;
they do not assert current attendance, opening hours, completed departures,
repairs or financial transactions. The six admitted establishments keep their
existing identities; no staff, prices or new services are inferred for them.

An NPC can acquire a need, weigh an alternative, encounter an obstacle, continue
work and record a resolution. Each actual change requires its own causal event
within an authorized fictional interval. Elapsed time alone never consumes
health, rest or money, completes work, or determines an NPC's decision.

## Needs

Optional `world.actors[NPC-*].needs` records have qualitative domains, priorities
and statuses (`active`, `blocked`, `resolved`, `cancelled`). They retain an
explicit or unknown deadline, resource references, blockers, creation/latest
event IDs, append-only observed tradeoffs and any resolution. Closed needs
cannot reopen or disappear; a later distinct need uses a new ID.

`draftReviewedNeedIntroduction` and `draftReviewedNeedTradeoff` prepare typed
changes. Their attributed observation is stored as `change.review`, including
the observing actor, factual observation and causal source. Direct application
and historical replay validate the same evidence; a caller cannot bypass it
by constructing a raw `needs` change. New resource references must exist when
recorded. Historical references remain valid after later resource consumption.

The private diagnostic reviews all saved NPC needs during a positive fictional
interval, including distant actors excluded from the routine proximity list.
It returns questions requiring resolution, not predetermined actions.

## Service cases

Optional `world.actors[NPC-*].service_cases` records bind a unique case to one
established actor, service function, location and resource. A case can link to
an existing need owned by that actor. It starts open with no fabricated past
steps; subsequent changes append one reviewed step. Status is `open`, `blocked`,
`resolved` or `cancelled`. Identity, need linkage, prior steps and terminal
results cannot be silently rewritten.

`draftReviewedServiceOpening` and `draftReviewedServiceStep` preserve a reviewed
observation and explicit work duration. Actual work requires the actor at the
service anchor, a recorded usable resource, and no recorded location closure.
An unknown schedule stays unknown: a current reviewed observation establishes
only that particular action. A blocked or cancelled record may document an
interruption without claiming that the unavailable work was performed.

Work and travel share the actor's fictional turn budget. Multiple changes or
events cannot each spend the entire interval independently. Replay reconstructs
the location, resources, needs and building conditions at each historical
change, across closed and current chapters. A later move or closure therefore
does not invalidate legitimate earlier work.

Resolving a review case does not repair a register, move a passenger, restore
stock, transfer ownership, change a relationship or alter a balance. Any such
consequence needs its own supported, reviewed state change. Needs, cases and
building conditions share the existing atomic event-change batch.

## Privacy and persistence

Need and service diagnostics are narrator-private. The player projection does
not include them. Lexical guards reject copying private summaries, blockers,
steps or resolutions into newly staged visible prose. These guards do not
prove that a paraphrase preserves knowledge boundaries; literary review and
a justified information source remain necessary before disclosure.

The normal coordinator, five-file transaction, durable journal and chapter
transition retain these optional actor fields. There is no second authoritative
database, periodic timer or background simulation. The current real checkpoint
does not gain synthetic needs or cases when this implementation is integrated.

## Verification and remaining work

- [Needs and plan integration](../../tests/integration_npc_needs_plans.test.mjs)
  checks event ownership, resource references, tradeoffs and private review.
- [Service constraints](../../tests/meridian_bay_services.test.mjs) checks direct
  application, closures, actor presence, evidence, time and historical replay.
- [Cross-chapter workflow](../../tests/meridian_bay_phase2_integration.test.mjs)
  uses the admitted map: Mara's private sales review is blocked, survives a
  chapter boundary, later resolves and recovers the same interrupted commit.
  The fixture preserves the real five checkpoint files and does not repair
  equipment or disclose private information to Jack.

Social encounter validation, richer relationship development, staffing,
inventory, purchases and broader civilian event chains remain separate
increments. This slice supplies tested needs and work history, not a complete
city economy or an automatic narrator.
