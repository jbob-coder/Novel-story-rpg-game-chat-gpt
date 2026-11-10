// D-040: typed, event-backed qualitative state changes. No numerical RPG progression.
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

function applyStateChanges(state, record, changes = []) {
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
    } else if (field === 'independent_plan') {
      requireFact(actorId !== state.player.id && typeof change.after === 'string' && change.after.trim(), 'Only NPC plans may change');
      requireFact(actor.independent_plan === change.before, 'Stale NPC plan');
      actor.independent_plan = change.after;
      record.state_changes.push({actor_id: actorId, field, before: change.before, after: change.after});
    } else {
      throw new Error(`${String(field)}`);
    }
  }
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
  // Legacy events before D-040 are archived and not retroactively reinterpreted.
  for (const event of snapshot.events.events) {
    if (event.turn <= 6) continue;
    for (const change of event.state_changes) {
      const actor = actorAt(state, change.actor_id);
      requireFact(actor && change.actor_id === event.actor_ids[0], 'Change actor differs from event actor');
      const field = change.field;
      requireFact(['location_id','inventory_item','relationship','conditions','knowledge','independent_plan','last_resolved_action'].includes(field), 'Unknown tracked change field');
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
    if (field === 'inventory_item') actual = itemAt(actor, extra);
    else if (field === 'relationship') actual = actor.relationships?.[extra] ?? null;
    else actual = actor[field] ?? null;
    requireFact(equal(actual, expected), `Saved state differs from recorded ${field} effect`);
  }
  return true;
}

export { applyStateChanges, verifyStateChanges };
