import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateWilsonRailgardenDetail,previewWilsonRailgardenDetail} from
 '../tools/meridian_bay_wilson_railgarden_detail.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const detail=()=>read('../docs/01_world/MERIDIAN_BAY_WILSON_RAILGARDEN_DETAIL_20261116.json');

test('home-to-neighborhood detail inherits only the original parent graph link',()=>{
 const s=state(),before=JSON.stringify(s),d=detail();
 assert.equal(validateWilsonRailgardenDetail({state:s}),true);
 const first=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');
 const segment=first.segments.find(x=>x.id==='MB-WEB-001');
 const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const refs=Object.fromEntries(city.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(d.nodes.map(n=>n.xy),[
  refs['LOC-WILSON-APARTMENT'],...segment.via_xy_units,
  refs['LOC-RAILGARDEN-RESIDENTIAL']]);
 assert.deepEqual([d.endpoints.from_location_id,d.endpoints.to_location_id],
  [segment.from_id,segment.to_id]);
 assert.equal(JSON.stringify(s),before);
});

test('both linked intervals preserve two-sided provisional frontage and no exact entrance floor',()=>{
 const d=detail();
 assert.deepEqual(d.links.map(x=>[x.from,x.to]),[
  ['MB-WR-N0','MB-WR-N1'],['MB-WR-N1','MB-WR-N2']]);
 assert.deepEqual(d.bands.map(x=>x.link_id),d.links.map(x=>x.id));
 assert.ok(d.bands.every(b=>b.relative_sides.A&&b.relative_sides.B&&
  b.physical_building_footprints_confirmed===false));
 assert.ok(d.links.every(x=>x.estimated_minutes===null&&x.traffic_flow==='unknown'));
 assert.equal(d.spatial_policy.building_floor_or_outside_door_set,false);
 assert.equal(d.spatial_policy.confirmed_building_footprint,false);
});

test('forward and reverse sketch paths pass through the same residential approach',()=>{
 const s=state();
 const f=previewWilsonRailgardenDetail({state:s,fromId:'MB-WR-N0',toId:'MB-WR-N2'});
 assert.deepEqual(f.nodeIds,['MB-WR-N0','MB-WR-N1','MB-WR-N2']);
 assert.deepEqual(f.linkIds,['MB-WR-L1','MB-WR-L2']);
 assert.deepEqual(f.frontageBands,['MB-WR-B1','MB-WR-B2']);
 const r=previewWilsonRailgardenDetail({state:s,fromId:'MB-WR-N2',toId:'MB-WR-N0'});
 assert.deepEqual(r.nodeIds,[...f.nodeIds].reverse());
 assert.deepEqual(r.linkIds,[...f.linkIds].reverse());
 assert.equal(f.canonicalNavigationAuthorized,false);
 assert.equal(r.travelMinutes,null);
 assert.equal(f.surveyedSidewalk,false);
 assert.equal(r.certifiedPublicAccess,false);
});

test('workshop is inside home and not a road vertex or public frontage',()=>{
 const s=state(),d=detail();
 assert.ok(s.world.locations['LOC-WILSON-WORKSHOP'].connected_ids.includes('LOC-WILSON-APARTMENT'));
 assert.ok(!d.nodes.some(x=>x.location_id==='LOC-WILSON-WORKSHOP'));
 assert.ok(!d.links.some(x=>[x.from,x.to].includes('LOC-WILSON-WORKSHOP')));
 assert.equal(d.story_consistency.workshop_remains_inside_apartment,true);
 const q=previewWilsonRailgardenDetail({state:s,fromId:'LOC-WILSON-WORKSHOP',toId:'MB-WR-N2'});
 assert.equal(q.status,'outside_this_corridor');
 assert.equal(q.nodeIds,null);
});

test('original chapter and starting locations still support the route order and household',()=>{
 const d=detail();
 const transcript=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 const setting=readFileSync(new URL('../game/STARTING_LOCATIONS.md',import.meta.url),'utf8');
 assert.ok(d.story_consistency.saved_chapter_fragments.every(t=>transcript.includes(t)));
 assert.ok(d.story_consistency.starting_location_fragments.every(t=>setting.includes(t)));
 assert.equal(d.story_consistency.elena_school_route_unverified,true);
 assert.equal(d.story_consistency.household_ownership_unresolved,true);
});

test('missing Wilson–Railgarden source link is rejected even though draft points exist',()=>{
 const s=state();
 s.world.locations['LOC-WILSON-APARTMENT'].connected_ids=
  s.world.locations['LOC-WILSON-APARTMENT'].connected_ids
   .filter(x=>x!=='LOC-RAILGARDEN-RESIDENTIAL');
 assert.throws(()=>validateWilsonRailgardenDetail({state:s}),
  /Unverified road or invented shortcut|Saved Wilson home/);
});

test('broken indoor workshop connection is rejected before any draft preview',()=>{
 const s=state();
 s.world.locations['LOC-WILSON-WORKSHOP'].connected_ids=[];
 assert.throws(()=>validateWilsonRailgardenDetail({state:s}),
  /Story route contradicts saved location connections|Saved Wilson home/);
});

test('draft preview never moves NPCs, player, time or saved world state',()=>{
 const s=state(),before=JSON.stringify(s);
 const q=previewWilsonRailgardenDetail({state:s,fromId:'MB-WR-N0',toId:'MB-WR-N2'});
 assert.equal(q.playerMoved,false);
 assert.equal(q.npcMoved,false);
 assert.equal(q.fictionalTimeAdvanced,false);
 assert.equal(q.playerKnowledgeChanged,false);
 assert.equal(q.knownApartmentFloor,false);
 assert.equal(JSON.stringify(s),before);
});

test('unrelated storefront, private school, and rail terminal are outside this local corridor',()=>{
 const s=state();
 for(const target of ['LOC-RAILGARDEN-ABARROTES','LOC-RAILGARDEN-CLINIC',
  'LOC-ELENA-SCHOOL-UNMAPPED','LOC-TRANSIT-TERMINAL']){
  const q=previewWilsonRailgardenDetail({state:s,fromId:'MB-WR-N1',toId:target});
  assert.equal(q.status,'outside_this_corridor');
  assert.equal(q.linkIds,null);
 }
});
