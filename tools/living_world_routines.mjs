// Independent NPC routine planning: read-only proposals and event staging only.
// Do NOT call stageNPCResolution as a completed turn; the canonical save gate
// must validate/apply effects and atomically commit the five narrative files.
import { availability } from './living_world_availability.mjs';

export const ROUTINE_PROPOSALS = Object.freeze([
  {actorId:'NPC-001', activity:'transit_operations', periods:['morning','afternoon','evening','night'], destination:'LOC-TRANSIT-TERMINAL'},
  {actorId:'NPC-002', activity:'maintenance_circuit', periods:['morning','afternoon','evening','night'], destination:'LOC-CROSSWATER-PLAZA'},
  {actorId:'NPC-003', activity:'courier_work', periods:['morning','afternoon','evening'], destination:'LOC-COMMERCIAL-DISTRICT'},
  {actorId:'NPC-004', activity:'school_and_illustration', periods:['morning','afternoon'], destination:null}, // School not in established map.
  {actorId:'NPC-005', activity:'neighbor_repairs', periods:['morning','afternoon'], destination:null}, // Neighbor's home not mapped.
  {actorId:'NPC-006', activity:'shop_and_suppliers', periods:['morning','afternoon','evening'], destination:'LOC-COMMERCIAL-DISTRICT'},
  {actorId:'NPC-007', activity:'cafe_shift', periods:['evening','night'], destination:'LOC-CAFE-BRUMA'}
]);

const copy = value => JSON.parse(JSON.stringify(value));
const actorAt = (state, id) => state?.world?.actors?.[id];
const validActorId = id => typeof id === 'string' && /^NPC-\d{3,}$/.test(id);
const supportedChanges = new Set(['location_id','inventory_item','relationship','conditions','knowledge','resources','independent_plan']);

// Travel must follow actual saved location graph; CITY-* grouping is never a shortcut.
// Directed adjacency matches tools/state_changes.mjs; unknown destination -> null.
export function worldRoute(state, start, end) {
  const places = state?.world?.locations;
  if (!places || typeof start !== 'string' || typeof end !== 'string' ||
      !start.startsWith('LOC-') || !end.startsWith('LOC-') ||
      !Object.hasOwn(places,start) || !Object.hasOwn(places,end)) return null;
  if (start === end) return [start];
  const queue = [[start]], seen = new Set([start]);
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i], id = path.at(-1);
    const adjacent = places[id]?.connected_ids;
    for (const next of Array.isArray(adjacent) ? adjacent : []) {
      if (typeof next !== 'string' || !next.startsWith('LOC-') ||
          !Object.hasOwn(places,next) || seen.has(next)) continue;
      if (next === end) return [...path,next];
      seen.add(next); queue.push([...path,next]);
    }
  }
  return null;
}

// These are ONLY private planning candidates. They neither cause time to pass
// nor establish attendance, a completed delivery, or an NPC encounter.
export function previewNPCRoutines({state, actorIds=[], elapsedMinutes=0, weekday=null,
  minute=null, schedules={}, exceptions={}, proposals=ROUTINE_PROPOSALS}={}) {
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes <= 0 ||
      !Array.isArray(actorIds) || actorIds.length > 100 || !Array.isArray(proposals)) return [];
  const selected = new Set(actorIds);
  const period = state?.time?.time_of_day;
  return proposals.flatMap(p => {
    if (!p || !selected.has(p.actorId)) return [];
    const actor = actorAt(state,p.actorId);
    if (!actor || !validActorId(p.actorId) || !actor.goal || !actor.independent_plan) return [];
    const window = availability({schedule:schedules?.[p.actorId], exception:exceptions?.[p.actorId], weekday, minute});
    return [{actorId:p.actorId, activity:p.activity, kind:'unresolved_proposal',
      visibility:'narrator_private', timing:Array.isArray(p.periods) && p.periods.includes(period) ? 'suggested_period':'outside_suggested_period',
      availability:window.status, availabilitySource:window.source,
      route:p.destination ? worldRoute(state,actor.location_id,p.destination) : null,
      destination:p.destination ?? null, requiresCausalResolution:true}];
  });
}

// Return an in-memory event draft, compatible with turn.offscreen[].changes.
// The actual actor changes must be applied by tools/state_changes.mjs *after*
// a narrated causal outcome, followed by the five-file save protocol.
export function stageNPCResolution({state, actorId, eventId, turn, day, outcome,
  changes=[], disclosures=[]}={}) {
  if (!validActorId(actorId) || !actorAt(state,actorId)) throw new Error('Unknown NPC');
  if (typeof eventId !== 'string' || !/^EV-\d{6,}$/.test(eventId) ||
      !Number.isInteger(turn) || turn < 1 || !Number.isInteger(day) ||
        typeof outcome !== 'string' || outcome.trim().length < 5) throw new Error('Invalid event context');
  if (!Array.isArray(changes) || changes.length > 40 || !Array.isArray(disclosures)) throw new Error('Invalid event data');
  for (const change of changes) {
    if (!change || typeof change !== 'object' || Array.isArray(change) ||
        !supportedChanges.has(change.field) ||
        (change.actor_id !== undefined && change.actor_id !== actorId)) throw new Error('Cross-actor or invalid effect');
  }
  for (const entry of disclosures) {
    if (!entry || typeof entry.fact !== 'string' || entry.fact.trim().length < 5 ||
        !Array.isArray(entry.viewerIds) || !entry.viewerIds.length ||
        !entry.viewerIds.every(id => id === state?.player?.id || Object.hasOwn(state?.world?.actors??{},id)))
      throw new Error('Disclosure requires explicit known viewer');
  }
  return {
    event:{id:eventId, chapter_id:state.chapter?.id, turn, day, actor_ids:[actorId],
      kind:'npc_independent_action', outcome, known_to:[actorId], caused_by:[], state_changes:[], progression_awards:[]},
    changeDrafts:copy(changes), disclosures:copy(disclosures),
    status:'staged_only', persistRequired:true
  };
}

// Facts are viewer-specific. Never expose a draft's full private event/outcome.
export function visibleFacts(staged, viewerId) {
  if (!staged || !Array.isArray(staged.disclosures) || typeof viewerId !== 'string') return [];
  return staged.disclosures.filter(d => Array.isArray(d.viewerIds) && d.viewerIds.includes(viewerId))
    .map(d => d.fact);
}
