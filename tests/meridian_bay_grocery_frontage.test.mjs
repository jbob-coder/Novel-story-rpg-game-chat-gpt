import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preAdmissionStateForQA} from './helpers/meridian_bay_fixture.mjs';
import {validateRailgardenGroceryFrontage,previewRailgardenGroceryFrontage}
 from '../tools/meridian_bay_grocery_frontage.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_FRONTAGE_REVIEW_20261120.json');
const rail='LOC-RAILGARDEN-RESIDENTIAL';
const grocery='LOC-RAILGARDEN-ABARROTES';
const start='MB-RG-N0',bend='MB-RG-N1',finish='MB-RG-N2';

test('old grocery frontage is adapted only for the verified admitted site',()=>{
 const s=state(),before=JSON.stringify(s),p=plan();
 assert.equal(Object.keys(s.world.locations).length,15);
 assert.equal(s.world.locations[grocery].access_status,'public_confirmed');
 assert.equal(validateRailgardenGroceryFrontage({state:s}),true);
 assert.equal(p.provenance.historical_head,
  '3bad47131f631d7edb472ef57dc8495226a22835');
 assert.equal(p.provenance.historical_plan_blob_sha,
  'c2c4881a2432f4be447200d9305ae375b8545ee1');
 assert.equal(JSON.stringify(s),before);
});
test('two legs and three points match the unchanged source canvas coordinates',()=>{
 const p=plan(),canvas=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const refs=Object.fromEntries(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(p.nodes.map(x=>x.xy),[refs[rail],{x:47.72,y:44.15},refs[grocery]]);
 assert.deepEqual(p.links.map(x=>[x.from,x.to]),[[start,bend],[bend,finish]]);
 assert.deepEqual(p.bands.map(x=>x.id),['MB-RG-B1','MB-RG-B2']);
 assert.ok(p.bands.every(x=>x.footprints_verified===false));
 assert.ok(p.links.every(x=>x.approximate_minutes===null));
});
test('private forwards and backwards previews preserve order but cannot play travel',()=>{
 const s=state(),before=JSON.stringify(s);
 const forward=previewRailgardenGroceryFrontage({state:s,fromId:start,toId:finish});
 const backward=previewRailgardenGroceryFrontage({state:s,fromId:finish,toId:start});
 assert.equal(forward.status,'draft_segment_sequence');
 assert.deepEqual(forward.nodeIds,[start,bend,finish]);
 assert.deepEqual(forward.linkIds,['MB-RG-L1','MB-RG-L2']);
 assert.deepEqual(forward.frontageBandIds,['MB-RG-B1','MB-RG-B2']);
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(backward.frontageBandIds,[...forward.frontageBandIds].reverse());
 for(const x of [forward,backward]){
  assert.equal(x.classification,'narrator_private_grocery_frontage_review');
  assert.equal(x.savedWorldLocationAdmitted,true);
  assert.equal(x.canonicalNavigationAuthorized,false);
  assert.equal(x.actionCompleted,false);
  assert.equal(x.requiresPlayerAction,true);
  assert.equal(x.travelMinutes,null);
  assert.equal(x.playerMoved,false);
  assert.equal(x.npcMoved,false);
  assert.equal(x.fictionalTimeAdvanced,false);
 }
 assert.equal(JSON.stringify(s),before);
});
test('public access is not proof of a staffed, open, stocked or previously visited shop',()=>{
 const p=previewRailgardenGroceryFrontage({state:state(),fromId:start,toId:finish});
 assert.equal(p.publicAccessConfirmed,true);
 assert.equal(p.openNow,'unknown');
 assert.equal(p.openingEvidenceSource,'no_recorded_location_state');
 assert.equal(p.staffNow,'unknown');
 assert.equal(p.inventoryNow,'unknown');
 assert.equal(p.playerDiscoveryConfirmed,null);
 assert.equal(p.visitRecorded,null);
});
test('synthetic event-linked closure is reported as closed rather than invented opening',()=>{
 const s=state(),saved=JSON.stringify(s);
 s.world.location_states??={};
 s.world.location_states[grocery]={
  operating_status:'temporarily_closed',physical_condition:'unknown',
  opening_hours:null,note:'Synthetic test-only closure state, not an actual narrative event.',
  last_change_event_id:'EV-000029'
 };
 const p=previewRailgardenGroceryFrontage({state:s,fromId:start,toId:finish});
 assert.equal(p.openNow,'closed');
 assert.equal(p.openingEvidenceSource,'recorded_location_closure');
 assert.equal(p.staffNow,'unknown');
 assert.equal(p.canonicalNavigationAuthorized,false);
 assert.notEqual(JSON.stringify(s),saved); // Only synthetic setup differs; preview did not add state.
 const beforePreview=JSON.stringify(s);
 previewRailgardenGroceryFrontage({state:s,fromId:start,toId:finish});
 assert.equal(JSON.stringify(s),beforePreview);
});
test('unknown node IDs cannot become new locations, shortcuts or player actions',()=>{
 const s=state(),before=JSON.stringify(s);
 for(const id of ['LOC-RAILGARDEN-CLINIC','LOC-WILSON-WORKSHOP','MB-RG-N999']){
  const r=previewRailgardenGroceryFrontage({state:s,fromId:bend,toId:id});
  assert.equal(r.status,'outside_this_frontage');
  assert.equal(r.nodeIds,null);
  assert.equal(r.linkIds,null);
  assert.equal(r.actionCompleted,false);
 }
 const noSelection=previewRailgardenGroceryFrontage({state:s});
 assert.equal(noSelection.status,'outside_this_frontage');
 const stationary=previewRailgardenGroceryFrontage({state:s,fromId:bend,toId:bend});
 assert.deepEqual(stationary.nodeIds,[bend]);
 assert.deepEqual(stationary.linkIds,[]);
 assert.equal(JSON.stringify(s),before);
});
test('pre-admission fixture is refused, not silently admitted by the preview',()=>{
 const detached=preAdmissionStateForQA(state()),before=JSON.stringify(detached);
 assert.equal(detached.world.locations[grocery],undefined);
 assert.throws(()=>validateRailgardenGroceryFrontage({state:detached}),
  /admitted city design and reviewed world checkpoint/);
 assert.equal(JSON.stringify(detached),before);
});
test('fake admission review and invalid grocery identity fail closed',()=>{
 const s=state();s.world.prebuilt_design_review.reviewed=false;
 assert.throws(()=>validateRailgardenGroceryFrontage({state:s}),
  /admitted city design and reviewed world checkpoint/);
 const t=state();t.world.locations[grocery].name='A newly invented grocery';
 assert.throws(()=>validateRailgardenGroceryFrontage({state:t}),
  /Incomplete or altered authored location/);
});
test('removing or duplicating the original grocery link is rejected',()=>{
 const a=state();a.world.locations[rail].connected_ids=
  a.world.locations[rail].connected_ids.filter(id=>id!==grocery);
 assert.throws(()=>validateRailgardenGroceryFrontage({state:a}),
  /Missing or duplicated district connection/);
 const b=state();b.world.locations[rail].connected_ids.push(grocery);
 assert.throws(()=>validateRailgardenGroceryFrontage({state:b}),
  /Missing or duplicated district connection/);
});
test('breaking household link to Railgarden or its indoor workshop is rejected',()=>{
 const a=state();a.world.locations['LOC-WILSON-APARTMENT'].connected_ids=
  a.world.locations['LOC-WILSON-APARTMENT'].connected_ids.filter(id=>id!==rail);
 assert.throws(()=>validateRailgardenGroceryFrontage({state:a}),
  /Missing or duplicated saved district/);
 const b=state();b.world.locations['LOC-WILSON-APARTMENT'].connected_ids=
  b.world.locations['LOC-WILSON-APARTMENT'].connected_ids.filter(id=>id!=='LOC-WILSON-WORKSHOP');
 assert.throws(()=>validateRailgardenGroceryFrontage({state:b}),
  /Missing or duplicated saved district/);
});
test('a hypothetical design waypoint cannot be promoted to a saved-world location',()=>{
 const s=state();s.world.locations[bend]={
  id:bend, name:'Fabricated shortcut',parent_id:rail,connected_ids:[rail]
 };
 assert.throws(()=>validateRailgardenGroceryFrontage({state:s}),
  /Draft waypoint cannot be admitted as a street location/);
});
test('source review cannot be used as alternate world admission or scene execution',()=>{
 const s=state(),before=JSON.stringify(s),p=plan();
 assert.deepEqual(Object.values(p.limits),Array(12).fill(false));
 assert.equal(p.status,'private_spatial_draft_not_story_canon');
 assert.equal(p.endpoints.saved_world_admission_required,true);
 const a=previewRailgardenGroceryFrontage({state:s,fromId:start,toId:finish});
 assert.equal(a.graphSource,'admitted_world_link_draft_waypoints');
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});
