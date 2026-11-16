import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewPrebuiltMeridianRoute}
 from '../tools/meridian_bay_prebuilt_routes.mjs';
import {prepareMeridianBayWorld,admitMeridianBayWorld,meridianBayDesign} from '../tools/meridian_bay_locations.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
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
 assert.equal(r.graphSource,'draft_design_preview');
 assert.equal(r.travelAuthorized,false);
 assert.equal(r.openNow,'unknown');
 assert.deepEqual(r.route,[home,'LOC-WILSON-APARTMENT',rail,market,noah]);
 assert.equal(r.destinationWorldDesignId,'MB-PREBUILT-20261112-V2');
 assert.equal(r.preexistsPlayerObservation,true);
 assert.equal(r.publicAccessInDesign,true);
 assert.equal(r.playerPublicObservationRecorded,null);
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
 for(const dest of ['LOC-SCHOOL-UNMAPPED','LOC-FAKE-SHOP','CITY-MERIDIAN-BAY',
  'MB-DES-MARKET-02','MB-REG-NORTH']){
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

test('route preview at the origin does not invent a move or duration',()=>{
 const original=state(),before=JSON.stringify(original);
 const route=previewPrebuiltMeridianRoute({state:original,destinationId:home});
 assert.equal(route.status,'route_available');
 assert.deepEqual(route.route,[home]);
 assert.deepEqual(route.segments,[]);
 assert.equal(route.estimateMinutes,null);
 assert.equal(route.characterMoved,false);
 assert.equal(route.fictionalTimeAdvanced,false);
 assert.equal(route.actionCompleted,false);
 assert.equal(JSON.stringify(original),before);
});

test('existing directed links remain valid without inventing their reverse',()=>{
 const s=state(),plaza='LOC-CROSSWATER-PLAZA';
 s.world.locations[plaza].connected_ids=s.world.locations[plaza].connected_ids.filter(id=>id!==market);
 const before=JSON.stringify(s);
 const route=previewPrebuiltMeridianRoute({state:s,fromId:market,destinationId:plaza});
 assert.deepEqual(route.route,[market,plaza]);
 assert.equal(route.travelAuthorized,false);
 assert.ok(!s.world.locations[plaza].connected_ids.includes(market));
 assert.equal(JSON.stringify(s),before);
});

test('a graph already in the supplied world still grants no travel or availability',()=>{
 const s=prepareMeridianBayWorld({state:state()});
 const route=previewPrebuiltMeridianRoute({state:s,destinationId:noah});
 assert.equal(route.graphSource,'draft_design_preview');
 assert.equal(route.travelAuthorized,false);
 assert.equal(route.openNow,'unknown');
 assert.equal(route.playerPublicObservationRecorded,null);
 assert.equal(route.actionCompleted,false);
});

test('only a validated editorial admission labels the route graph admitted',()=>{
 const sha='a'.repeat(40);
 const s=admitMeridianBayWorld({state:state(),observedHead:sha,nextTurn:10,designReview:{
  reviewed:true,design_id:meridianBayDesign().world_design_id,source_commit:sha,
  reason:'Synthetic reviewed world admission for route QA.'}});
 assert.equal(previewPrebuiltMeridianRoute({state:s,destinationId:noah}).graphSource,'admitted_world');
 s.world.prebuilt_design_review.reviewed=false;
 assert.throws(()=>previewPrebuiltMeridianRoute({state:s,destinationId:noah}),/admission required/);
});

test('a state-only route preview never authenticates discovery from a knowledge string',()=>{
 const s=state();
 s.player.knowledge.push('Observed public access at '+noah+' (source: unverified text)');
 assert.equal(previewPrebuiltMeridianRoute({state:s,destinationId:noah}).playerPublicObservationRecorded,null);
});
