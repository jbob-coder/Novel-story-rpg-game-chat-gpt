import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewPrebuiltMeridianRoute}
 from '../tools/meridian_bay_prebuilt_routes.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic}
 from '../tools/living_world_diagnostics.mjs';
import {prepareMeridianBayWorld} from '../tools/meridian_bay_locations.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const snapshot=()=>({
 state:state(),
 manifest:read('../game/SAVE_MANIFEST.json'),
 events:read('../chapters/CH-000.events.json'),
 transcript:read('../chapters/CH-000.transcript.json'),
 chapter:readFileSync(new URL('../chapters/CH-000.md',import.meta.url),'utf8')
});
const home='LOC-WILSON-WORKSHOP';
const rail='LOC-RAILGARDEN-RESIDENTIAL';
const market='LOC-COMMERCIAL-DISTRICT';
const noah='LOC-MARKET-NOAH-REPAIR';
const grocery='LOC-RAILGARDEN-ABARROTES';
const clinic='LOC-RAILGARDEN-CLINIC';

test('narrator knows a route to prebuilt Noah shop before Jack observes it',()=>{
 const s=state(),before=JSON.stringify(s);
 const r=previewPrebuiltMeridianRoute({state:s,destinationId:noah});
 assert.equal(r.classification,'narrator_private_route_preview');
 assert.equal(r.status,'route_available');
 assert.deepEqual(r.route,[home,'LOC-WILSON-APARTMENT',rail,market,noah]);
 assert.equal(r.destinationWorldDesignId,'MB-PREBUILT-20261112-V2');
 assert.equal(r.preexistsPlayerObservation,true);
 assert.equal(r.publicAccessInDesign,true);
 assert.equal(r.playerPublicObservationRecorded,false);
 assert.equal(r.playerKnowledgeOtherwise,'not_determined');
 assert.equal(r.actionCompleted,false);
 assert.equal(r.characterMoved,false);
 assert.equal(r.fictionalTimeAdvanced,false);
 assert.equal(r.estimateMinutes,null);
 assert.equal(s.world.locations[noah],undefined);
 assert.equal(JSON.stringify(s),before);
});
test('both Railgarden sites are reachable without new streets',()=>{
 for(const id of [grocery,clinic]){
  const r=previewPrebuiltMeridianRoute({state:state(),destinationId:id});
  assert.equal(r.status,'route_available');
  assert.deepEqual(r.route,[home,'LOC-WILSON-APARTMENT',rail,id]);
  assert.ok(r.segments.every(x=>x.connection==='verified_in_prepared_graph'));
  assert.equal(r.segments.at(-1).toPrebuiltDesignId,'MB-PREBUILT-20261112-V2');
 }
});
test('waypoints preserve player-specified routing and allow backtracking',()=>{
 const r=previewPrebuiltMeridianRoute({state:state(),destinationId:clinic,
  waypoints:[noah,'LOC-CROSSWATER-PLAZA',grocery]});
 assert.deepEqual(r.waypoints,[noah,'LOC-CROSSWATER-PLAZA',grocery]);
 assert.deepEqual(r.route,[home,'LOC-WILSON-APARTMENT',rail,market,noah,
  market,'LOC-CROSSWATER-PLAZA',market,rail,grocery,rail,clinic]);
 assert.ok(r.segments.every(s=>s.approximateMinutes===null&&s.openingHours===null));
 assert.equal(r.possibleNpcEncounters.length,0);
});
test('no fabricated routes to school, missing places or CITY container',()=>{
 const s=state();
 for(const dest of ['LOC-SCHOOL-UNMAPPED','LOC-FAKE-SHOP','CITY-MERIDIAN-BAY']){
  const r=previewPrebuiltMeridianRoute({state:s,destinationId:dest});
  assert.equal(r.status,'unreachable');
  assert.equal(r.route,null);
  assert.deepEqual(r.segments,[]);
 }
 const blocked=previewPrebuiltMeridianRoute({state:s,destinationId:noah,
  waypoints:['LOC-FAKE-SHOP']});
 assert.equal(blocked.status,'unreachable');
 assert.equal(blocked.actionCompleted,false);
});
test('invalid input fails before a route can be fabricated',()=>{
 const s=state();
 assert.throws(()=>previewPrebuiltMeridianRoute({state:{},destinationId:noah}),
  /Verified saved world/);
 assert.throws(()=>previewPrebuiltMeridianRoute({state:s}),/Destination ID required/);
 assert.throws(()=>previewPrebuiltMeridianRoute({state:s,destinationId:noah,
  waypoints:'LOC-HARBOR-WALK'}),/Invalid route waypoints/);
 assert.throws(()=>previewPrebuiltMeridianRoute({state:s,destinationId:noah,
  waypoints:Array(9).fill(market)}),/Invalid route waypoints/);
 assert.throws(()=>previewPrebuiltMeridianRoute({state:s,destinationId:noah,
  fromId:'CITY-MERIDIAN-BAY'}),/Invalid starting location/);
});
test('narrator-only diagnostics expose prebuilt places but player-safe projection does not',()=>{
 const snap=snapshot(),before=JSON.stringify(snap);
 const d=inspectLivingWorld({snapshot:snap,actorIds:['NPC-006'],elapsedMinutes:20});
 assert.equal(d.prebuiltPublicPlaces.length,6);
 assert.equal(d.observedPublicPlaces.length,0);
 assert.ok(d.prebuiltPublicPlaces.every(x=>x.preexistsPlayerObservation));
 assert.ok(d.prebuiltPublicPlaces.every(x=>x.route?.at(-1)===x.locationId));
 const safe=playerVisibleDiagnostic(d);
 assert.equal('prebuiltPublicPlaces' in safe,false);
 assert.equal('meridianBay' in safe,false);
 assert.equal('observedPublicPlaces' in safe,false);
 assert.equal(JSON.stringify(snap),before);
});
test('read-only preview does not change established actors or the underlying materialized graph',()=>{
 const s=state(),prepared=prepareMeridianBayWorld({state:s});
 const before=JSON.stringify(prepared);
 const first=previewPrebuiltMeridianRoute({state:prepared,destinationId:noah});
 const second=previewPrebuiltMeridianRoute({state:prepared,
  fromId:noah,destinationId:grocery});
 assert.deepEqual(second.route,[noah,market,rail,grocery]);
 assert.equal(first.segments.length,4);
 assert.equal(prepared.player.location_id,home);
 assert.equal(JSON.stringify(prepared),before);
 assert.equal(s.world.locations[noah],undefined);
});
