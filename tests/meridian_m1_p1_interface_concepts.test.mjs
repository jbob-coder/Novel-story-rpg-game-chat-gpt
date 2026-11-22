import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 deriveM1P1InterfaceConcepts,validateM1P1InterfaceConcepts,
 inspectM1P1InterfaceConcepts
} from '../tools/meridian_m1_p1_interface_concepts.mjs';

const raw=path=>readFileSync(new URL(path,import.meta.url));
const parse=path=>JSON.parse(raw(path));
const saved=()=>parse('../game/STATE.json');
const report=()=>parse('../docs/01_world/MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json');
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');

test('public-realm concept report equals source-derived evidence, without editing state',()=>{
 const s=saved(),before=JSON.stringify(s);
 assert.deepEqual(deriveM1P1InterfaceConcepts({state:s}),report());
 assert.equal(validateM1P1InterfaceConcepts({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});

test('all three immediate source files are byte-identical to pinned Git blobs',()=>{
 const expected={
  'MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json':
   'c4fb60f05c605e031a753b7f5cfc6a2c89d495bb',
  'MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json':
   'a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b',
  'MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json':
   '464bb09f77c4c01b3c75ee2dccfc13b0b2dfafba'
 };
 for(const [path,hash] of Object.entries(expected)){
  assert.equal(blob(raw('../docs/01_world/'+path)),hash,path);
 }
});

test('exactly two independent hypotheses exist per original M1/P1 study section',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 assert.deepEqual(r.alternatives.map(a=>a.id),['M1-A','M1-B','P1-A','P1-B']);
 assert.deepEqual(r.alternatives.map(a=>a.studySection),
  ['MB-04-M1','MB-04-M1','MB-04-P1','MB-04-P1']);
 assert.deepEqual(r.reviewOrder,['M1-A','P1-A','M1-B','P1-B']);
 assert.equal(r.reviewOrderDoesNotSelectConstruction,true);
});

test('options anchor exact unchanged historical points but never fix new street geometry',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 for(const a of r.alternatives){
  if(a.studySection==='MB-04-M1'){
   assert.deepEqual(a.sourceLineFrom,{x:58.869565,y:42});
   assert.deepEqual(a.sourceLineTo,{x:60,y:40.7});
  } else {
   assert.deepEqual(a.sourceLineFrom,{x:65,y:42});
   assert.deepEqual(a.sourceLineTo,{x:66.9,y:40.6});
  }
  assert.equal(a.fixedGeometry,null);
  assert.equal(a.polygon,null);
  assert.equal(a.relativeSideOrientation,'unfixed');
  assert.equal(a.studyWindowOnlyNotPublicLand,true);
 }
});

test('M1 frontage-first proposal separates cafés, deliveries and potential footway',()=>{
 const m=inspectM1P1InterfaceConcepts({state:saved()}).alternatives[0];
 assert.equal(m.layoutName,'commercial_frontage_separated_public_walk');
 assert.deepEqual(m.conceptualRelativeLayers,[
  'existing_market_saved_graph_area','unverified_shop_door_and_delivery_interface',
  'proposed_public_pedestrian_clear_strip','proposed_delivery_conflict_buffer',
  'unmapped_M1_study_continuation'
 ]);
 assert.equal(m.firstToInvestigate,true);
 assert.ok(m.reviewFocus.includes('M1-BUILDINGS'));
 assert.ok(!m.conceptualRelativeLayers.includes('existing_market_public_place'));
});

test('M1 bypass remains a separate hypothesis, not a route via a private café',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 const m=r.alternatives[1];
 assert.equal(m.layoutName,'commercial_perimeter_bypass');
 assert.equal(m.firstToInvestigate,false);
 assert.ok(m.conceptualRelativeLayers.includes('unverified_public_perimeter_exit'));
 assert.ok(m.reviewFocus.includes('M1-PARCEL-RIGHTS'));
 assert.ok(!m.conceptualRelativeLayers.some(x=>x.includes('cafe_internal')));
});

test('P1 perimeter concept explicitly separates pedestrians and terminal operations',()=>{
 const p=inspectM1P1InterfaceConcepts({state:saved()}).alternatives[2];
 assert.equal(p.layoutName,'plaza_perimeter_non_terminal_exit');
 assert.deepEqual(p.conceptualRelativeLayers,[
  'existing_crosswater_public_plaza','unverified_public_plaza_outer_edge',
  'proposed_terminal_operations_separation','proposed_pedestrian_clear_strip',
  'unmapped_P1_study_continuation'
 ]);
 assert.ok(p.reviewFocus.includes('P1-TERMINAL-BOUNDARY'));
 assert.equal(p.firstToInvestigate,true);
});

test('P1 crossing is only an optional safety study, not an existing crossing',()=>{
 const p=inspectM1P1InterfaceConcepts({state:saved()}).alternatives[3];
 assert.equal(p.layoutName,'segregated_plaza_crossing');
 assert.ok(p.conceptualRelativeLayers.includes('unverified_crossing_location'));
 assert.ok(p.reviewFocus.includes('P1-CROSSING'));
 assert.equal(p.crossingDesigned,false);
 assert.equal(p.unrestrictedPublicAccessVerified,false);
});

test('every physical alternative depends on all six existing evidence gates',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 const historical=parse('../docs/01_world/MERIDIAN_BAY_M1_P1_HISTORICAL_EXIT_GATES_20261122.json');
 for(const a of r.alternatives){
  const original=historical.checks.find(x=>'MB-04-'+x.sectionId===a.studySection);
  assert.deepEqual(a.evidenceRequired,original.requirements.map(x=>x.requirementId));
  assert.ok(a.reviewFocus.every(x=>a.evidenceRequired.includes(x)));
  assert.equal(original.requirements.every(x=>x.status==='missing'),true);
  assert.equal(a.requiresNewLegalAccessEvidence,true);
 }
});

test('no candidate can be presented with measured dimensions, time or verified ownership',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 for(const a of r.alternatives){
  assert.equal(a.measuredWidthMeters,null);
  assert.equal(a.pathDistanceKm,null);
  assert.equal(a.walkingTimeMinutes,null);
  assert.equal(a.parcelOwnerKnown,false);
  assert.equal(a.accessibilityVerified,false);
  assert.equal(a.selectedForBuild,false);
  assert.equal(a.canNavigate,false);
 }
 assert.equal(r.physicalSurfaceApproval,null);
 assert.equal(r.selectedMarketExit,null);
 assert.equal(r.selectedPlazaExit,null);
});

test('other three Section04 parts are left unmapped and no route is authorized',()=>{
 const r=inspectM1P1InterfaceConcepts({state:saved()});
 assert.deepEqual(r.section04RemainingUnknown,
  ['MB-04-M2','MB-04-P2','MB-04-M3']);
 assert.deepEqual(r.newPublicRoads,[]);
 assert.deepEqual(r.newBuildings,[]);
 assert.deepEqual(r.newLocationIds,[]);
 assert.equal(r.hasMappedCrossSection,false);
});

test('forged building approval, land ownership and public access are rejected',()=>{
 const s=saved();
 const a=report();a.alternatives[0].physicallyLocated=true;
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:a}),
  /concept altered/);
 const b=report();b.alternatives[2].unrestrictedPublicAccessVerified=true;
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:b}),
  /concept altered/);
 const c=report();c.alternatives[3].selectedForBuild=true;
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:c}),
  /concept altered/);
});

test('false precise sidewalk width or route swap are also rejected',()=>{
 const s=saved();
 const a=report();a.alternatives[0].measuredWidthMeters=2;
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:a}),
  /concept altered/);
 const b=report();b.alternatives[1].studySection='MB-04-P1';
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:b}),
  /concept altered/);
 const c=report();c.alternatives[2].fixedGeometry=[{x:65,y:42}];
 assert.throws(()=>validateM1P1InterfaceConcepts({state:s,candidate:c}),
  /concept altered/);
});

test('missing saved-world authority or altered existing Harbor graph halts options',()=>{
 assert.throws(()=>inspectM1P1InterfaceConcepts({state:{}}));
 const s=saved();
 s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.filter(
   x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>inspectM1P1InterfaceConcepts({state:s}));
});

test('returned review is a defensive copy; no player, NPC or time changes',()=>{
 const s=saved(),before=JSON.stringify(s);
 const x=inspectM1P1InterfaceConcepts({state:s});
 x.alternatives[0].canNavigate=true;
 x.reviewOrder.push('SHADOW');
 const y=inspectM1P1InterfaceConcepts({state:s});
 assert.equal(y.alternatives[0].canNavigate,false);
 assert.equal(y.reviewOrder.length,4);
 assert.equal(y.originalSavedGraphUnchanged,true);
 assert.equal(y.noPlayerAction,true);
 assert.equal(y.noNpcAction,true);
 assert.equal(y.noFictionalTimeElapsed,true);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});

test('all five canonical story files still have exact original main Git blob hashes',()=>{
 const fixed={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [path,sha] of Object.entries(fixed))assert.equal(blob(raw(path)),sha,path);
});
