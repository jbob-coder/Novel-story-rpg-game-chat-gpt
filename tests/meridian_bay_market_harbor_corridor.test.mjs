import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketHarborCorridor,previewMarketHarborCorridor} from
 '../tools/meridian_bay_market_harbor_corridor.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const detail=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_CORRIDOR_DETAIL_20261116.json');

test('Market Row–Harbor Walk uses the original independent direct graph edge',()=>{
 const s=state(),before=JSON.stringify(s),d=detail();
 assert.equal(validateMarketHarborCorridor({state:s}),true);
 assert.deepEqual([d.endpoints.from_location_id,d.endpoints.to_location_id],
  ['LOC-COMMERCIAL-DISTRICT','LOC-HARBOR-WALK']);
 assert.equal(d.endpoints.source_graph_direct_edge,true);
 assert.equal(JSON.stringify(s),before);
});

test('five in-between intervals remain contiguous and tied to two-sided frontage reviews',()=>{
 const d=detail(),c=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const refs=Object.fromEntries(c.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.equal(d.nodes.length,6);
 assert.deepEqual(d.nodes.map(x=>x.xy),[
  refs['LOC-COMMERCIAL-DISTRICT'],...d.geometry.via_xy_units,refs['LOC-HARBOR-WALK']
 ]);
 assert.deepEqual(d.links.map(x=>x.from),d.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.to),d.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(d.bands.map(x=>x.link_id),d.links.map(x=>x.id));
 assert.ok(d.bands.every(x=>x.relative_sides.A&&x.relative_sides.B&&
  x.physical_building_footprints_confirmed===false));
});

test('forward and reverse path previews include all five pieces without claiming travel minutes',()=>{
 const s=state();
 const a=previewMarketHarborCorridor({state:s,fromId:'MB-MH-N0',toId:'MB-MH-N5'});
 assert.deepEqual(a.nodeIds,['MB-MH-N0','MB-MH-N1','MB-MH-N2','MB-MH-N3','MB-MH-N4','MB-MH-N5']);
 assert.deepEqual(a.linkIds,['MB-MH-L1','MB-MH-L2','MB-MH-L3','MB-MH-L4','MB-MH-L5']);
 assert.deepEqual(a.frontageBands,['MB-MH-B1','MB-MH-B2','MB-MH-B3','MB-MH-B4','MB-MH-B5']);
 const b=previewMarketHarborCorridor({state:s,fromId:'MB-MH-N5',toId:'MB-MH-N0'});
 assert.deepEqual(b.nodeIds,[...a.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...a.linkIds].reverse());
 assert.deepEqual(b.frontageBands,[...a.frontageBands].reverse());
 assert.equal(a.shortestCityRouteClaimed,false);
 assert.equal(a.travelMinutes,null);
 assert.equal(a.playerMoved,false);
 assert.equal(a.canonicalAdmission,false);
});

test('the independent Crosswater and direct Market Harbor routes coexist without fictional shortcuts',()=>{
 const s=state(),d=detail();
 assert.ok(s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK'));
 assert.ok(s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.includes('LOC-HARBOR-WALK'));
 assert.ok(s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-CROSSWATER-PLAZA'));
 assert.equal(d.review.route_must_not_require_crosswater_plaza,true);
 assert.equal(d.review.crosswater_harbor_route_must_remain,true);
 assert.equal(previewMarketHarborCorridor({state:s,
  fromId:'LOC-CROSSWATER-PLAZA',toId:'MB-MH-N5'}).status,'outside_this_corridor');
});

test('story evidence is preserved without new port entries or shoreline claims',()=>{
 const d=detail();
 const setting=readFileSync(new URL('../game/STARTING_LOCATIONS.md',import.meta.url),'utf8');
 const chapter=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.ok(d.story_constraints.starting_location_fragments.every(x=>setting.includes(x)));
 assert.ok(d.story_constraints.chapter_fragments.every(x=>chapter.includes(x)));
 assert.equal(d.geometry.shoreline_surveyed,false);
 assert.equal(d.geometry.private_port_access_certified,false);
 assert.equal(d.review.land_vs_water_boundary_verified,false);
 assert.equal(d.story_constraints.direct_optical_sightline_claimed,false);
 assert.equal(d.story_constraints.new_npc_events_created,false);
});

test('intermediate bend points do not become story locations or automatic NPC destinations',()=>{
 const s=state(),d=detail(),before=JSON.stringify(s);
 assert.ok(d.nodes.slice(1,-1).every(x=>x.kind==='intermediate_geometry_node'&&
  x.location_id===null&&!(x.id in s.world.locations)));
 assert.equal(d.invariants.no_new_location_ids,true);
 assert.equal(d.invariants.no_new_graph_edges,true);
 assert.equal(d.invariants.no_offscreen_npc_movement,true);
 assert.equal(d.invariants.no_canonical_writes,true);
 assert.equal(JSON.stringify(s),before);
});

test('missing direct Market Row–Harbor graph link causes fail-closed validation',()=>{
 const s=state();
 s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids
   .filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validateMarketHarborCorridor({state:s}),
  /Existing direct Market Row to Harbor Walk branch must not disappear|Missing original direct/);
});

test('missing alternative Crosswater–Harbor graph link also causes fail-closed validation',()=>{
 const s=state();
 s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids
   .filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validateMarketHarborCorridor({state:s}),
  /Story route contradicts saved location connections|Harbor Walk link is absent/);
});

test('private port, station and workshop locations are not implied by this draft corridor',()=>{
 const s=state();
 for(const id of ['LOC-PRIVATE-PORT','LOC-TRANSIT-TERMINAL','LOC-WILSON-WORKSHOP']){
  const q=previewMarketHarborCorridor({state:s,fromId:'MB-MH-N1',toId:id});
  assert.equal(q.status,'outside_this_corridor');
  assert.equal(q.nodeIds,null);
  assert.equal(q.privatePortAccessVerified,false);
  assert.equal(q.playerKnowledgeChanged,false);
 }
});
