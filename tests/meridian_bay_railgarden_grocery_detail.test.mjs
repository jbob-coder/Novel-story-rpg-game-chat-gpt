import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRailgardenGroceryDetail,previewRailgardenGroceryDetail} from
 '../tools/meridian_bay_railgarden_grocery_detail.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL_20261116.json');

test('Railgarden grocery uses a source-backed, not-yet-admitted Phase 1 link',()=>{
 const s=state(),before=JSON.stringify(s),d=plan();
 assert.equal(validateRailgardenGroceryDetail({state:s}),true);
 assert.equal(s.world.locations['LOC-RAILGARDEN-ABARROTES'],undefined);
 const seg=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json')
  .segments.find(x=>x.id==='MB-WEB-003');
 assert.deepEqual([d.endpoints.from_id,d.endpoints.to_id],[seg.from_id,seg.to_id]);
 assert.equal(JSON.stringify(s),before);
});

test('both in-between segments inherit original city coordinates and frontage sides',()=>{
 const p=plan();
 const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const refs=Object.fromEntries(city.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(p.nodes.map(x=>x.xy),[
  refs['LOC-RAILGARDEN-RESIDENTIAL'],{x:47.72,y:44.15},
  refs['LOC-RAILGARDEN-ABARROTES']]);
 assert.deepEqual(p.links.map(x=>[x.from,x.to]),[
  ['MB-RG-N0','MB-RG-N1'],['MB-RG-N1','MB-RG-N2']]);
 assert.deepEqual(p.bands.map(x=>x.link_id),p.links.map(x=>x.id));
 assert.ok(p.bands.every(x=>x.sides.A&&x.sides.B&&x.footprints_verified===false));
 assert.ok(p.links.every(x=>x.approximate_minutes===null&&x.traffic_flow==='unknown'));
});

test('grocery approach supports reversible preview without pretending a visit',()=>{
 const s=state();
 const forward=previewRailgardenGroceryDetail({state:s,
  fromId:'MB-RG-N0',toId:'MB-RG-N2'});
 assert.deepEqual(forward.nodeIds,['MB-RG-N0','MB-RG-N1','MB-RG-N2']);
 assert.deepEqual(forward.linkIds,['MB-RG-L1','MB-RG-L2']);
 assert.deepEqual(forward.frontageBands,['MB-RG-B1','MB-RG-B2']);
 const backward=previewRailgardenGroceryDetail({state:s,fromId:'MB-RG-N2',toId:'MB-RG-N0'});
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.equal(forward.savedWorldLocationAdmitted,false);
 assert.equal(backward.visitRecorded,false);
 assert.equal(forward.travelMinutes,null);
});

test('public access design does not assert business open, staff, goods, discovery or player movement',()=>{
 const p=plan(),s=state(),before=JSON.stringify(s);
 const preview=previewRailgardenGroceryDetail({state:s,fromId:'MB-RG-N0',toId:'MB-RG-N2'});
 assert.equal(p.site_semantics.public_entrance_in_design,true);
 assert.equal(preview.openNow,'unknown');
 assert.equal(preview.staffNow,'unknown');
 assert.equal(preview.inventoryNow,'unknown');
 assert.equal(preview.playerDiscoveryConfirmed,false);
 assert.equal(preview.playerMoved,false);
 assert.equal(preview.npcMoved,false);
 assert.equal(preview.fictionalTimeAdvanced,false);
 assert.equal(preview.canonicalNavigationAuthorized,false);
 assert.equal(JSON.stringify(s),before);
});

test('store catalog identity and parent district are unchanged by map planning',()=>{
 const p=plan(),catalog=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
 const shop=catalog.places.find(x=>x.id==='LOC-RAILGARDEN-ABARROTES');
 assert.equal(shop.parent_id,'LOC-RAILGARDEN-RESIDENTIAL');
 assert.equal(shop.world_design_id,p.endpoints.design_id);
 assert.equal(shop.related_actor_id,null);
 assert.equal(shop.opening_hours,null);
 assert.equal(shop.travel_minutes,null);
 assert.equal(p.endpoints.shop_status,'prebuilt_design_not_saved_story_location');
});

test('a broken home-to-Railgarden original link fails the preceding gate',()=>{
 const s=state();
 s.world.locations['LOC-WILSON-APARTMENT'].connected_ids=[];
 assert.throws(()=>validateRailgardenGroceryDetail({state:s}),
  /Unverified road or invented shortcut|Saved Wilson home|Story route contradicts/);
});

test('missing authored grocery parent cannot be replaced by a fabricated shortcut',()=>{
 const s=state();
 s.world.locations['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids=
  s.world.locations['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids
   .filter(id=>id!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateRailgardenGroceryDetail({state:s}),
  /Unverified road or invented shortcut|Story route contradicts saved location connections/);
});

test('unmapped clinic, school, household workshop are not grocery street vertices',()=>{
 const s=state(),p=plan();
 assert.ok(p.nodes.slice(1,-1).every(x=>x.location_id===null));
 assert.equal(p.spatial_policy.clinic_here,false);
 assert.equal(p.spatial_policy.home_workshop_as_street_vertex,false);
 assert.equal(p.spatial_policy.elena_school_here,false);
 for(const x of ['LOC-RAILGARDEN-CLINIC','LOC-WILSON-WORKSHOP','LOC-ELENA-SCHOOL-UNMAPPED']){
  const route=previewRailgardenGroceryDetail({state:s,fromId:'MB-RG-N1',toId:x});
  assert.equal(route.status,'outside_this_corridor');
  assert.equal(route.nodeIds,null);
 }
});
