import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRailgardenClinicDetail,previewRailgardenClinicDetail} from
 '../tools/meridian_bay_railgarden_clinic_detail.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_CLINIC_DETAIL_20261117.json');

test('Railgarden clinic inherits a prepared, unadmitted parent link without changing canon',()=>{
 const s=state(),before=structuredClone(s),p=plan();
 assert.equal(validateRailgardenClinicDetail({state:s}),true);
 const segment=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json')
  .segments.find(x=>x.id==='MB-WEB-004');
 assert.deepEqual([p.endpoints.from_id,p.endpoints.to_id],[segment.from_id,segment.to_id]);
 assert.equal(s.world.locations['LOC-RAILGARDEN-CLINIC'],undefined);
 assert.deepEqual(s,before);
});

test('clinic corridor is exactly two contiguous, reversible source-aligned stretches',()=>{
 const p=plan(),city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const points=Object.fromEntries(city.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(p.nodes.map(x=>x.xy),[
  points['LOC-RAILGARDEN-RESIDENTIAL'],{x:48.55,y:44.28},
  points['LOC-RAILGARDEN-CLINIC']]);
 assert.deepEqual(p.links.map(x=>[x.from,x.to]),[
  ['MB-RC-N0','MB-RC-N1'],['MB-RC-N1','MB-RC-N2']]);
 assert.deepEqual(p.bands.map(x=>x.link_id),p.links.map(x=>x.id));
 assert.ok(p.bands.every(x=>x.sides.A&&x.sides.B&&x.footprints_verified===false));
});

test('preview navigates both directions without making clinic playable',()=>{
 const s=state(),before=JSON.stringify(s);
 const forward=previewRailgardenClinicDetail({state:s,fromId:'MB-RC-N0',toId:'MB-RC-N2'});
 const backward=previewRailgardenClinicDetail({state:s,fromId:'MB-RC-N2',toId:'MB-RC-N0'});
 assert.deepEqual(forward.nodeIds,['MB-RC-N0','MB-RC-N1','MB-RC-N2']);
 assert.deepEqual(forward.linkIds,['MB-RC-L1','MB-RC-L2']);
 assert.deepEqual(forward.frontageBands,['MB-RC-B1','MB-RC-B2']);
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.equal(forward.status,'proposed_connected');
 assert.equal(forward.canonicalNavigationAuthorized,false);
 assert.equal(forward.playerMoved,false);
 assert.equal(backward.npcMoved,false);
 assert.equal(forward.fictionalTimeAdvanced,false);
 assert.equal(JSON.stringify(s),before);
});

test('public approach cannot establish open clinic, doctors, services, or visit',()=>{
 const p=plan(),view=previewRailgardenClinicDetail({state:state(),fromId:'MB-RC-N0',toId:'MB-RC-N2'});
 assert.equal(p.site_semantics.public_access_in_design,true);
 assert.equal(p.site_semantics.existing_in_saved_checkpoint,false);
 assert.equal(view.openNow,'unknown');
 assert.equal(view.staffNow,'unknown');
 assert.equal(view.servicesNow,'unknown');
 assert.equal(view.emergencyCapacity,'unknown');
 assert.equal(view.actualAccessibleEntranceConfirmed,false);
 assert.equal(view.playerDiscoveryConfirmed,false);
 assert.equal(view.visitRecorded,false);
 assert.equal(view.travelMinutes,null);
});

test('catalog clinic identity, district parent and availability remain unchanged',()=>{
 const p=plan(),catalog=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
 const clinic=catalog.places.find(x=>x.id==='LOC-RAILGARDEN-CLINIC');
 assert.equal(clinic.type,'community_health_center');
 assert.equal(clinic.parent_id,'LOC-RAILGARDEN-RESIDENTIAL');
 assert.equal(clinic.world_design_id,p.endpoints.design_id);
 assert.deepEqual(clinic.connected_ids,['LOC-RAILGARDEN-RESIDENTIAL']);
 assert.equal(clinic.related_actor_id,null);
 assert.equal(clinic.opening_hours,null);
 assert.equal(clinic.travel_minutes,null);
 assert.equal(p.endpoints.site_status,'prebuilt_design_not_saved_story_location');
});

test('clinic section preserves grocery and home connections without cutting through them',()=>{
 const s=state();
 assert.ok(s.world.locations['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids.includes('LOC-WILSON-APARTMENT'));
 assert.ok(plan().nodes.slice(1,-1).every(x=>x.location_id===null));
 assert.equal(plan().spatial_policy.grocery_connection_replaced,false);
 assert.equal(plan().spatial_policy.home_workshop_as_street_vertex,false);
 assert.equal(plan().spatial_policy.elena_school_here,false);
 for(const id of ['LOC-RAILGARDEN-ABARROTES','LOC-WILSON-WORKSHOP','LOC-ELENA-SCHOOL-UNMAPPED']){
  const view=previewRailgardenClinicDetail({state:s,fromId:'MB-RC-N1',toId:id});
  assert.equal(view.status,'outside_this_corridor');
  assert.equal(view.nodeIds,null);
 }
});

test('corrupting original household link fails inherited regression gates',()=>{
 const s=state();
 s.world.locations['LOC-WILSON-APARTMENT'].connected_ids=[];
 assert.throws(()=>validateRailgardenClinicDetail({state:s}),
  /Unverified road or invented shortcut|Saved Wilson home|Story route contradicts/);
});

test('corrupting original district connector cannot be hidden by clinic sketch',()=>{
 const s=state();
 s.world.locations['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids=
  s.world.locations['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids
   .filter(id=>id!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateRailgardenClinicDetail({state:s}),
  /Unverified road or invented shortcut|Story route contradicts saved location connections/);
});

test('all clinic intervals refuse certified sidewalk, crosswalk, time and ambulance assertions',()=>{
 const p=plan();
 assert.ok(p.links.every(x=>x.travel_minutes===null&&x.traffic_flow==='unknown'));
 assert.equal(p.spatial_policy.accessible_route_certified,false);
 assert.equal(p.spatial_policy.parking_or_ambulance_access_certified,false);
 assert.equal(p.spatial_policy.verified_crosswalk,false);
 assert.equal(p.spatial_policy.unreviewed_shortcuts_permitted,false);
});
