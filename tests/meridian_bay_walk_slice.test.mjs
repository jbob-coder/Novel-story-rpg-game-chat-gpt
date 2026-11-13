import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewMeridianBayWalk} from '../tools/meridian_bay_walk_slice.mjs';

const checkpoint=()=>JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
const expectedRoute=['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
  'LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA'];

test('the initial route uses only verified direct connections, not a CITY shortcut',()=>{
  const state=checkpoint(),p=previewMeridianBayWalk({state});
  assert.deepEqual(p.route,expectedRoute);
  assert.equal(p.segments.length,4);
  for(const e of p.segments) assert.ok(state.world.locations[e.from].connected_ids.includes(e.to));
  assert.equal(p.route.some(id=>id.startsWith('CITY-')),false);
});
test('three optional activities, not completed tasks or mapped interiors',()=>{
  const p=previewMeridianBayWalk({state:checkpoint()});
  assert.deepEqual(p.activities.map(a=>a.locationId),[
    'LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA']);
  assert.ok(p.activities.every(a=>a.status==='optional_not_performed'&&!a.interiorMapped));
});
test('two NPCs remain checkpoint candidates, never proven future encounters',()=>{
  const p=previewMeridianBayWalk({state:checkpoint()});
  assert.deepEqual(p.npcCandidates.map(n=>n.actorId),['NPC-003','NPC-002']);
  assert.ok(p.npcCandidates.every(n=>n.coLocatedAtSavedCheckpoint &&
    n.requiresFreshObservation && !n.encounterOccurred && n.visibility==='narrator_private'));
});
test('soft estimates do not add fictional clock time or establish fixed schedules',()=>{
  const s=checkpoint(),before=JSON.stringify(s),p=previewMeridianBayWalk({state:s});
  assert.deepEqual([p.estimatedWalkingMinutes.min,p.estimatedWalkingMinutes.max],[18,44]);
  assert.equal(p.estimatedWalkingMinutes.certainty,'rough_proposal_not_canon');
  assert.equal(p.actionCompleted,false);
  assert.equal(JSON.stringify(s),before);
});
test('all stops are gated on player choice and no traversal is auto-resolved',()=>{
  const p=previewMeridianBayWalk({state:checkpoint()});
  assert.ok(p.requiresPlayerAction);
  assert.ok(p.segments.every(s=>s.traversed===false&&s.requiresPlayerAction));
  assert.ok(p.activities.every(a=>a.requiresPlayerAction));
});
test('alternative path without known edge duration leaves estimate unknown',()=>{
  const p=previewMeridianBayWalk({state:checkpoint(),destinationId:'LOC-CAFE-BRUMA'});
  assert.equal(p.status,'route_available');
  assert.equal(p.route.at(-1),'LOC-CAFE-BRUMA');
  assert.equal(p.estimatedWalkingMinutes,null);
});
test('invalid city destination is not traversable and does not create a location',()=>{
  const s=checkpoint(),before=JSON.stringify(s);
  const p=previewMeridianBayWalk({state:s,destinationId:'CITY-MERIDIAN-BAY'});
  assert.equal(p.status,'unreachable');
  assert.equal(p.route,null);
  assert.equal(JSON.stringify(s),before);
});
test('unknown destination cannot fabricate a route',()=>{
  const p=previewMeridianBayWalk({state:checkpoint(),destinationId:'LOC-SCHOOL-UNMAPPED'});
  assert.equal(p.status,'unreachable');assert.deepEqual(p.activities,[]);
});
test('current location is read from saved checkpoint; no arbitrary teleport',()=>{
  const s=checkpoint();s.player.location_id='LOC-COMMERCIAL-DISTRICT';
  const p=previewMeridianBayWalk({state:s});
  assert.deepEqual(p.route,['LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA']);
  assert.equal(p.estimatedWalkingMinutes.min,5);
});
test('missing saved world is rejected',()=>{
  assert.throws(()=>previewMeridianBayWalk({state:{}}),/Saved world/);
});
