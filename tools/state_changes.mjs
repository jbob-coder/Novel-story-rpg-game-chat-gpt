// D-040: typed, event-backed qualitative state changes. No numerical RPG progression.
import {validateNPCCommitments,validateNPCCommitmentChange} from './living_world_obligations.mjs';
import {validateNPCNeeds,validateNPCNeedChange} from './living_world_needs.mjs';
import {validateNPCServiceCases,validateNPCServiceCaseChange} from './meridian_bay_services.mjs';
const requireFact = (ok, message) => { if (!ok) throw new Error(message); };
const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
const equal = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((key, i) => key === kb[i] && equal(a[key], b[key]));
};
const actorAt = (state, actorId) => actorId === state.player.id ? state.player : state.world.actors[actorId];
const itemAt = (actor, id) => (actor.inventory ?? []).find(item => item.id === id) ?? null;
const knownLocation = (state, id) => typeof id === 'string' && Object.hasOwn(state.world.locations, id);
const stringList = value => Array.isArray(value) && value.every(x => typeof x === 'string' && x.trim()) && new Set(value).size === value.length;
const actorIds = state => new Set([state.player.id, ...Object.keys(state.world.actors)]);

function applyStateChangesUnchecked(state, record, changes = []) {
  requireFact(Array.isArray(changes) && changes.length <= 40, 'State changes must be a bounded array');
  const actorId = record.actor_ids[0], actor = actorAt(state, actorId);
  requireFact(actor && typeof record.id === 'string' && Array.isArray(record.state_changes), 'Missing event actor or change log');
  const ids = actorIds(state);
  for (const change of changes) {
    requireFact(change && typeof change === 'object' && !Array.isArray(change), 'Invalid state change');
    // Only the actor responsible for this event can have its state changed here.
    requireFact(change.actor_id === undefined || change.actor_id === actorId, 'Cross-actor effect requires its own event');
    const field = change.field;
    if (field === 'location_id') {
      const before = actor.location_id, after = change.after;
      requireFact(change.before === before, 'Stale actor location');
      requireFact(knownLocation(state, after), 'Unknown destination');
      const route = change.route ?? [before, after];
      requireFact(Array.isArray(route) && route.length >= 2 && route[0] === before && route.at(-1) === after, 'Invalid travel route');
      requireFact(route.every(loc => knownLocation(state, loc)) && route.slice(1).every((loc, i) => state.world.locations[route[i]].connected_ids.includes(loc)), 'Nonadjacent travel without route');
      actor.location_id = after;
      record.state_changes.push({actor_id: actorId, field, before, after, route: copy(route)});
      for (const item of actor.inventory ?? []) {
        if (!item.carried) continue;
        const oldItem = copy(item);
        item.location_id = after;
        record.state_changes.push({actor_id: actorId, field: 'inventory_item', item_id: item.id, before: oldItem, after: copy(item), automatic_carry: true});
      }
    } else if (field === 'inventory_item') {
      const id = change.item_id, before = itemAt(actor, id), after = change.after;
      requireFact(typeof id === 'string' && id.trim(), 'Item ID required');
      requireFact(Object.hasOwn(change, 'before') && Object.hasOwn(change, 'after') && equal(before, change.before), 'Stale inventory item');
      requireFact(after === null || (after && typeof after === 'object' && !Array.isArray(after) && after.id === id && typeof after.name === 'string' && after.name.trim() && typeof after.carried === 'boolean' && knownLocation(state, after.location_id)), 'Invalid inventory item');
      requireFact(after === null || !after.carried || after.location_id === actor.location_id, 'Carried item must follow actor');
      if (!Array.isArray(actor.inventory)) actor.inventory = [];
      actor.inventory = actor.inventory.filter(item => item.id !== id);
      if (after !== null) actor.inventory.push(copy(after));
      record.state_changes.push({actor_id: actorId, field, item_id: id, before: copy(before), after: copy(after)});
    } else if (field === 'relationship') {
      const target = change.target_actor_id;
      requireFact(ids.has(target) && target !== actorId, 'Invalid relationship target');
      const before = actor.relationships?.[target] ?? null;
      requireFact(Object.hasOwn(change, 'before') && equal(before, change.before), 'Stale relationship');
      const after = change.after;
      requireFact(after === null || (after && typeof after === 'object' && !Array.isArray(after) && Object.keys(after).length > 0), 'Invalid relationship');
      actor.relationships ??= {};
      if (after === null) delete actor.relationships[target]; else actor.relationships[target] = copy(after);
      record.state_changes.push({actor_id: actorId, field, target_actor_id: target, before: copy(before), after: copy(after)});
    } else if (field === 'conditions') {
      requireFact(stringList(change.before) && stringList(change.after), 'Conditions must be unique nonempty strings');
      requireFact(equal(actor.conditions ?? [], change.before), 'Stale conditions');
      actor.conditions = copy(change.after);
      record.state_changes.push({actor_id: actorId, field, before: copy(change.before), after: copy(change.after)});
    } else if (field === 'knowledge') {
      requireFact(typeof change.fact === 'string' && change.fact.trim().length >= 5 && typeof change.source === 'string' && change.source.trim().length >= 5, 'Knowledge requires fact and source');
      actor.knowledge ??= [];
      const entry = `${change.fact} (source: ${change.source}; ${record.id})`;
      requireFact(!actor.knowledge.includes(entry), 'Duplicate knowledge');
      actor.knowledge.push(entry);
      record.state_changes.push({actor_id: actorId, field, fact: change.fact, source: change.source, after: entry});
    } else if (field === 'resources') {
      requireFact(change.before && change.after && typeof change.before === 'object' &&
        typeof change.after === 'object' && !Array.isArray(change.before) &&
        !Array.isArray(change.after), 'Resources must be objects');
      requireFact(equal(actor.resources ?? {}, change.before), 'Stale actor resources');
      actor.resources = copy(change.after);
      record.state_changes.push({actor_id: actorId, field, before: copy(change.before), after: copy(change.after)});
    } else if (field === 'commitments') {
      requireFact(actorId !== state.player.id && Array.isArray(change.before) &&
        Array.isArray(change.after), 'Only NPC commitments can change');
      requireFact(equal(actor.commitments ?? [], change.before), 'Stale NPC commitments');
      validateNPCCommitmentChange({before:change.before,after:change.after,eventId:record.id});
      actor.commitments = copy(change.after);
      record.state_changes.push({actor_id: actorId, field, before: copy(change.before), after: copy(change.after)});
    } else if (field === 'needs') {
      requireFact(actorId !== state.player.id && Array.isArray(change.before) &&
        Array.isArray(change.after), 'Only NPC needs may change');
      requireFact(equal(actor.needs ?? [], change.before), 'Stale NPC needs');
      validateNPCNeedChange({before:change.before,after:change.after,eventId:record.id});
      actor.needs = copy(change.after);
      record.state_changes.push({actor_id: actorId,field,before:copy(change.before),after:copy(change.after)});
    } else if (field === 'service_cases') {
      requireFact(actorId !== state.player.id && Array.isArray(change.before)&&
        Array.isArray(change.after),'Only NPC service cases may change');
      requireFact(equal(actor.service_cases??[],change.before),'Stale NPC service cases');
      validateNPCServiceCaseChange({before:change.before,after:change.after,
        actorId,locations:state.world.locations,needs:actor.needs??[],eventId:record.id});
      actor.service_cases=copy(change.after);
      record.state_changes.push({actor_id:actorId,field,before:copy(change.before),after:copy(change.after)});
    } else if (field === 'independent_plan') {
      requireFact(actorId !== state.player.id && typeof change.after === 'string' && change.after.trim(), 'Only NPC plans may change');
      requireFact(actor.independent_plan === change.before, 'Stale NPC plan');
      actor.independent_plan = change.after;
      record.state_changes.push({actor_id: actorId, field, before: change.before, after: change.after});
    } else {
      throw new Error(`Unsupported state change: ${String(field)}`);
    }
  }
  return state;
}

// Validate a batch on an isolated actor copy. A failed later change must not
// leave earlier effects applied or append an incomplete causal event log.
function applyStateChanges(state, record, changes = []) {
  requireFact(Array.isArray(changes) && changes.length <= 40, 'State changes must be a bounded array');
  requireFact(record && Array.isArray(record.actor_ids) && record.actor_ids.length === 1 &&
    typeof record.id === 'string' && Array.isArray(record.state_changes), 'Missing event actor or change log');
  const actorId = record.actor_ids[0];
  const original = actorAt(state, actorId);
  requireFact(original, 'Missing event actor or change log');
  if (changes.length === 0) return state;
  const draftActor = copy(original);
  const draftState = actorId === state.player.id
    ? {...state, player: draftActor}
    : {...state, world: {...state.world, actors: {...state.world.actors, [actorId]: draftActor}}};
  const draftRecord = {...record, state_changes: []};
  applyStateChangesUnchecked(draftState, draftRecord, changes);
  if (actorId === state.player.id) state.player = draftActor;
  else state.world.actors[actorId] = draftActor;
  record.state_changes.push(...draftRecord.state_changes);
  return state;
}

function verifyStateChanges(snapshot) {
  const state = snapshot.state, seen = new Map(), ids = new Set();
  for (const actor of [state.player, ...Object.values(state.world.actors)]) {
    for (const item of actor.inventory ?? []) {
      requireFact(!ids.has(item.id), 'Duplicate inventory ID across actors');
      ids.add(item.id);
      requireFact(knownLocation(state, item.location_id), 'Item has unknown location');
      requireFact(!item.carried || item.location_id === actor.location_id, 'Carried item disagrees with actor location');
    }
  }
  const validEventIds = new Set(snapshot.events.events.map(event=>event.id));
  const commitmentIds = new Set();
  for(const actor of Object.values(state.world.actors)){
    if(actor.commitments === undefined)continue;
    validateNPCCommitments(actor.commitments,{eventIds:validEventIds});
    for(const obligation of actor.commitments){
      requireFact(!commitmentIds.has(obligation.id),'Duplicate obligation id across NPCs');
      commitmentIds.add(obligation.id);
    }
  }
  const needIds=new Set();
  for(const actor of Object.values(state.world.actors)){
    if(actor.needs === undefined)continue;
    validateNPCNeeds(actor.needs,{eventIds:validEventIds});
    for(const need of actor.needs){
      requireFact(!needIds.has(need.id),'Duplicate NPC need ID across actors');
      needIds.add(need.id);
    }
  }
  const serviceIds=new Set();
  for(const [id,actor] of Object.entries(state.world.actors)){
    if(actor.service_cases===undefined)continue;
    validateNPCServiceCases(actor.service_cases,{actorId:id,
      locations:state.world.locations,needs:actor.needs??[],eventIds:validEventIds});
    for(const item of actor.service_cases){
      requireFact(!serviceIds.has(item.id),'Duplicate service case ID across NPCs');
      serviceIds.add(item.id);
    }
  }
  // Legacy events before D-040 are archived and not retroactively reinterpreted.
  for (const event of snapshot.events.events) {
    if (event.turn <= 6) continue;
    for (const change of event.state_changes) {
      const actor = actorAt(state, change.actor_id);
      requireFact(actor && change.actor_id === event.actor_ids[0], 'Change actor differs from event actor');
      const field = change.field;
      requireFact(['location_id','inventory_item','relationship','conditions','knowledge','independent_plan','last_resolved_action','resources','commitments','needs','service_cases','world_location','world_location_link'].includes(field), 'Unknown tracked change field');
      if(field==='world_location'||field==='world_location_link'){
        requireFact(event.kind==='player_action'&&change.actor_id===state.player.id,
          'Only observed player-scene events can establish world places');
        const placeId=field==='world_location'?change.location_id:change.anchor_id;
        requireFact(typeof placeId==='string'&&Object.hasOwn(state.world.locations,placeId)&&
          Object.hasOwn(change,'before')&&Object.hasOwn(change,'after'),
          'World location effect requires an established place and before/after');
        if(field==='world_location')
          requireFact(change.before===null&&change.after?.id===placeId&&
            change.after?.established_event_id===event.id,
            'New place requires exact creation event');
        else requireFact(Array.isArray(change.before)&&Array.isArray(change.after)&&
          change.after.length===change.before.length+1&&
          change.after.slice(0,-1).every((v,i)=>v===change.before[i]),
          'World connection changes must append exactly one reviewed link');
        const key=`WORLD|${field}|${placeId}`;
        if(seen.has(key))
          requireFact(equal(seen.get(key),change.before),
            'World location history precondition mismatch');
        seen.set(key,copy(change.after));
        continue;
      }
      if (field === 'knowledge') {
        requireFact((actor.knowledge ?? []).includes(change.after), 'Recorded knowledge not retained');
        continue;
      }
      const key = `${change.actor_id}|${field}|${change.item_id ?? change.target_actor_id ?? ''}`;
      if (seen.has(key)) requireFact(equal(seen.get(key), change.before), 'State change history precondition mismatch');
      else requireFact(Object.hasOwn(change, 'before'), 'Recorded change has no precondition');
      seen.set(key, copy(change.after));
    }
  }
  for (const [key, expected] of seen) {
    const [actorId, field, extra] = key.split('|'), actor = actorAt(state, actorId);
    let actual;
    if (actorId === 'WORLD' && field === 'world_location')
      actual = state.world.locations[extra]??null;
    else if (actorId === 'WORLD' && field === 'world_location_link')
      actual = state.world.locations[extra]?.connected_ids??null;
    else if (field === 'inventory_item') actual = itemAt(actor, extra);
    else if (field === 'relationship') actual = actor.relationships?.[extra] ?? null;
    else actual = actor[field] ?? null;
    requireFact(equal(actual, expected), `Saved state differs from recorded ${field} effect`);
  }
  return true;
}

export { applyStateChanges, verifyStateChanges };
