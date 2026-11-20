import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preAdmissionStateForQA} from './helpers/meridian_bay_fixture.mjs';
import {validateRailgardenClinicFrontage,previewRailgardenClinicFrontage}
 from '../tools/meridian_bay_clinic_frontage.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_CLINIC_FRONTAGE_REVIEW_20261120.json');
const rail='LOC-RAILGARDEN-RESIDENTIAL',clinic='LOC-RAILGARDEN-CLINIC';
const grocery='LOC-RAILGARDEN-ABARROTES',home='LOC-WILSON-APARTMENT';
const market='LOC-COMMERCIAL-DISTRICT',workshop='LOC-WILSON-WORKSHOP';
const a='MB-RC-N0',b='MB-RC-N1',c='MB-RC-N2';

test('historical clinic is adapted only to the actual reviewed 15-location checkpoint',()=>{
 const s=state(),before=JSON.stringify(s),p=plan();
 assert.equal(Object.keys(s.world.locations).length,15);
 assert.equal(s.world.prebuilt_design_review.operation,'world_admission');
 assert.equal(s.world.locations[clinic].access_status,'public_confirmed');
 assert.equal(validateRailgardenClinicFrontage({state:s}),true);
 assert.equal(p.provenance.historical_head,
  '3a359a171ecf31d3e7492e600b1cbae3e2aec426');
 assert.equal(p.provenance.historical_plan_blob_sha,
  '5e8442b4baec74e646b79148d09d11ed6d113acb');
 assert.equal(p.provenance.historical_tool_blob_sha,
  '43ddfce346bf939ae669fde53ca73c2042c39eff');
 assert.equal(JSON.stringify(s),before);
});

test('two independent frontage stretches preserve original waypoints and unsurveyed sides',()=>{
 const p=plan(),canvas=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const refs=Object.fromEntries(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(p.nodes.map(x=>x.xy),[refs[rail],{x:48.55,y:44.28},refs[clinic]]);
 assert.deepEqual(p.links.map(x=>[x.from,x.to]),[[a,b],[b,c]]);
 assert.deepEqual(p.bands.map(x=>x.link_id),p.links.map(x=>x.id));
 assert.ok(p.bands.every(x=>x.footprints_verified===false));
 assert.ok(p.links.every(x=>x.travel_minutes===null&&x.traffic_flow==='unknown'));
 assert.equal(p.endpoints.parent_segment,'MB-WEB-004');
});

test('clinic draft is reversible without moving Jack or committing an event',()=>{
 const s=state(),before=JSON.stringify(s);
 const forward=previewRailgardenClinicFrontage({state:s,fromId:a,toId:c});
 const backward=previewRailgardenClinicFrontage({state:s,fromId:c,toId:a});
 assert.equal(forward.status,'draft_segment_sequence');
 assert.deepEqual(forward.nodeIds,[a,b,c]);
 assert.deepEqual(forward.linkIds,['MB-RC-L1','MB-RC-L2']);
 assert.deepEqual(forward.frontageBands,['MB-RC-B1','MB-RC-B2']);
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(backward.frontageBands,[...forward.frontageBands].reverse());
 for(const v of [forward,backward]){
  assert.equal(v.classification,'narrator_private_admitted_clinic_frontage_draft');
  assert.equal(v.savedWorldLocationAdmitted,true);
  assert.equal(v.graphSource,'admitted_world_link_draft_waypoints');
  assert.equal(v.canonicalNavigationAuthorized,false);
  assert.equal(v.actionCompleted,false);
  assert.equal(v.requiresPlayerAction,true);
  assert.equal(v.playerMoved,false);
  assert.equal(v.npcMoved,false);
  assert.equal(v.fictionalTimeAdvanced,false);
  assert.equal(v.travelMinutes,null);
 }
 assert.equal(JSON.stringify(s),before);
});

test('public health center access cannot assert accessible doorway, operating hours or clinical services',()=>{
 const p=previewRailgardenClinicFrontage({state:state(),fromId:a,toId:c});
 assert.equal(p.publicAccessInDesign,true);
 assert.equal(p.actualAccessibleEntranceConfirmed,false);
 assert.equal(p.openNow,'unknown');
 assert.equal(p.openingEvidenceSource,'no_recorded_location_state');
 assert.equal(p.staffNow,'unknown');
 assert.equal(p.servicesNow,'unknown');
 assert.equal(p.emergencyCapacity,'unknown');
 assert.equal(p.playerDiscoveryConfirmed,null);
 assert.equal(p.visitRecorded,null);
 assert.equal(p.travelMinutes,null);
});

test('synthetic location closure is visible but never attributed to real canonical events',()=>{
 const s=state();
 s.world.location_states??={};
 s.world.location_states[clinic]={
  operating_status:'temporarily_closed',physical_condition:'unknown',
  opening_hours:null,
  note:'Detached test-only clinic closure, never added to the saved chapter.',
  last_change_event_id:'EV-000029'
 };
 const before=JSON.stringify(s);
 const p=previewRailgardenClinicFrontage({state:s,fromId:a,toId:c});
 assert.equal(p.openNow,'closed');
 assert.equal(p.openingEvidenceSource,'recorded_location_closure');
 assert.equal(p.actualAccessibleEntranceConfirmed,false);
 assert.equal(p.staffNow,'unknown');
 assert.equal(p.servicesNow,'unknown');
 assert.equal(JSON.stringify(s),before);
});

test('out-of-corridor clinic requests do not invent a crossing or a new action',()=>{
 const s=state(),before=JSON.stringify(s);
 for(const out of [grocery,home,workshop,market,'LOC-ELENA-SCHOOL-UNMAPPED','MB-RC-N999']){
  const p=previewRailgardenClinicFrontage({state:s,fromId:b,toId:out});
  assert.equal(p.status,'outside_this_frontage');
  assert.equal(p.nodeIds,null);
  assert.equal(p.linkIds,null);
  assert.equal(p.actionCompleted,false);
 }
 const noSelection=previewRailgardenClinicFrontage({state:s});
 assert.equal(noSelection.status,'outside_this_frontage');
 const stationary=previewRailgardenClinicFrontage({state:s,fromId:b,toId:b});
 assert.deepEqual(stationary.nodeIds,[b]);
 assert.deepEqual(stationary.linkIds,[]);
 assert.equal(JSON.stringify(s),before);
});

test('synthetic pre-admission fixture is explicitly refused',()=>{
 const s=preAdmissionStateForQA(state()),before=JSON.stringify(s);
 assert.equal(s.world.locations[clinic],undefined);
 assert.throws(()=>validateRailgardenClinicFrontage({state:s}),
  /actual reviewed admission, not an old design fixture/);
 assert.equal(JSON.stringify(s),before);
});

test('fake admitted-world approval or modified clinic name cannot pass',()=>{
 const s=state();s.world.prebuilt_design_review.reviewed=false;
 assert.throws(()=>validateRailgardenClinicFrontage({state:s}),
  /actual reviewed admission/);
 const t=state();t.world.locations[clinic].name='Invented walk-in emergency hospital';
 assert.throws(()=>validateRailgardenClinicFrontage({state:t}),
  /Incomplete or altered authored location/);
});

test('removing or duplicating either side of the clinic graph connection fails closed',()=>{
 for(const [from,to] of [[rail,clinic],[clinic,rail]]){
  const s=state();s.world.locations[from].connected_ids=
   s.world.locations[from].connected_ids.filter(id=>id!==to);
  assert.throws(()=>validateRailgardenClinicFrontage({state:s}),
   /Missing or duplicated (?:original )?district|Incomplete or altered authored location/);
  const t=state();t.world.locations[from].connected_ids.push(to);
  assert.throws(()=>validateRailgardenClinicFrontage({state:t}),
   /Missing or duplicated (?:original )?district|Incomplete or altered authored location/);
 }
});

test('clinic review cannot remove grocery, market or household connections',()=>{
 for(const [from,to] of [[rail,grocery],[rail,market],[rail,home],[home,workshop]]){
  const s=state();s.world.locations[from].connected_ids=
   s.world.locations[from].connected_ids.filter(id=>id!==to);
  assert.throws(()=>validateRailgardenClinicFrontage({state:s}),
   /Missing or duplicated (?:original )?district|Incomplete or altered authored location/);
 }
});

test('unapproved planning waypoint cannot be promoted into a saved-world location',()=>{
 const s=state();
 s.world.locations[b]={id:b,name:'Invented clinic alley',parent_id:rail,connected_ids:[rail]};
 assert.throws(()=>validateRailgardenClinicFrontage({state:s}),
  /fictional clinic waypoint cannot become a saved location/);
});

test('clinic planning keeps accessibility, survey, ambulance and passage claims unverified',()=>{
 const p=plan();
 for(const key of ['accessible_route_certified','verified_crosswalk',
  'parking_or_ambulance_access_certified','vehicle_route_certified',
  'unreviewed_shortcuts_permitted','home_workshop_as_street_vertex',
  'grocery_connection_replaced'])assert.equal(p.spatial_policy[key],false,key);
 assert.equal(p.review_gate.no_canonical_save_writes,true);
 assert.equal(p.review_gate.no_automatic_admission,true);
 assert.equal(p.review_gate.no_story_actions,true);
 assert.equal(p.review_gate.must_validate_admitted_saved_world,true);
});

test('validation is fail-closed for missing state, unknown player location and real narrative position',()=>{
 assert.throws(()=>validateRailgardenClinicFrontage({}),
  /Saved world and player location required/);
 const invalid=state();invalid.player.location_id='LOC-UNKNOWN-PLAYED';
 assert.throws(()=>validateRailgardenClinicFrontage({state:invalid}),
  /Unknown saved player location/);
 const current=state(),before=JSON.stringify(current);
 const v=previewRailgardenClinicFrontage({state:current,fromId:a,toId:c});
 assert.equal(current.player.location_id,workshop);
 assert.equal(current.pending.type,'await_player_action');
 assert.equal(v.actionCompleted,false);
 assert.equal(JSON.stringify(current),before);
});

test('a synthetic explicit schedule is contextual, not adopted as a canonical clinic schedule',()=>{
 const s=state();
 s.world.location_states??={};
 s.world.location_states[clinic]={
  operating_status:'operating',physical_condition:'intact',
  opening_hours:{confirmed:true,weekdays:{'1':[[540,1020]]}},
  note:'Synthetic clinic schedule for an isolated availability adapter test.',
  last_change_event_id:'EV-000029'
 };
 const before=JSON.stringify(s);
 const inside=previewRailgardenClinicFrontage({state:s,fromId:a,toId:c,weekday:1,minute:600});
 const outside=previewRailgardenClinicFrontage({state:s,fromId:a,toId:c,weekday:1,minute:1100});
 assert.equal(inside.openNow,'open');
 // Off-hours cannot be asserted closed when the previous weekday has no
 // confirmed schedule: an overnight interval may still cross midnight.
 assert.equal(outside.openNow,'unknown');
 assert.equal(outside.openingEvidenceSource,'day_not_documented');
 assert.equal(JSON.stringify(s),before);
 // Once the previous day is explicitly covered, closure can be certified.
 s.world.location_states[clinic].opening_hours.weekdays['0']=[];
 const completedSchedule=JSON.stringify(s);
 const confirmedClosed=previewRailgardenClinicFrontage({state:s,fromId:a,toId:c,weekday:1,minute:1100});
 assert.equal(confirmedClosed.openNow,'closed');
 assert.equal(confirmedClosed.openingEvidenceSource,'confirmed_schedule');
 assert.equal(inside.staffNow,'unknown');
 assert.equal(inside.servicesNow,'unknown');
 assert.equal(JSON.stringify(s),completedSchedule);
 assert.equal(state().world.locations[clinic].opening_hours,null);
});
