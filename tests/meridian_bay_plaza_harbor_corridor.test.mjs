import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePlazaHarborCorridor,previewPlazaHarborCorridor,
 inspectPlazaHarborCorridor} from '../tools/meridian_bay_plaza_harbor_corridor.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL_20261116.json');

test('Crosswater Plaza–Harbor Walk draft uses existing source locations and no new world movement',()=>{
 const s=state(),before=JSON.stringify(s),d=plan();
 assert.equal(validatePlazaHarborCorridor({state:s}),true);
 assert.deepEqual([d.endpoints.from_location_id,d.endpoints.to_location_id],
  ['LOC-CROSSWATER-PLAZA','LOC-HARBOR-WALK']);
 assert.equal(d.draft_parent_segment.status,'new_draft_geometry_on_existing_graph_edge');
 const canvas=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const positions=Object.fromEntries(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(d.nodes.map(x=>x.xy),[
  positions['LOC-CROSSWATER-PLAZA'],...d.draft_parent_segment.reference_waypoints,
  positions['LOC-HARBOR-WALK']
 ]);
 assert.equal(JSON.stringify(s),before);
});

test('the in-between space has four contiguous subsegments and two-side frontage notes',()=>{
 const s=state(),view=inspectPlazaHarborCorridor({state:s}),d=plan();
 assert.equal(view.nodes.length,5);
 assert.equal(view.links.length,4);
 assert.equal(view.frontageBands.length,4);
 assert.deepEqual(d.links.map(x=>x.from),d.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.to),d.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(d.bands.map(x=>x.link_id),d.links.map(x=>x.id));
 assert.ok(d.bands.every(x=>x.relative_sides.A&&x.relative_sides.B));
 assert.ok(d.bands.every(x=>x.physical_building_footprints_confirmed===false));
 assert.equal(view.canonicalStateUnchanged,true);
});

test('draft walking path visits all in-between points in both directions with no inferred time',()=>{
 const s=state();
 const forward=previewPlazaHarborCorridor({state:s,fromId:'MB-PH-N0',toId:'MB-PH-N4'});
 assert.deepEqual(forward.nodeIds,['MB-PH-N0','MB-PH-N1','MB-PH-N2','MB-PH-N3','MB-PH-N4']);
 assert.deepEqual(forward.linkIds,['MB-PH-L1','MB-PH-L2','MB-PH-L3','MB-PH-L4']);
 assert.deepEqual(forward.frontageBands,['MB-PH-B1','MB-PH-B2','MB-PH-B3','MB-PH-B4']);
 const reverse=previewPlazaHarborCorridor({state:s,fromId:'MB-PH-N4',toId:'MB-PH-N0'});
 assert.deepEqual(reverse.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(reverse.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(reverse.frontageBands,[...forward.frontageBands].reverse());
 assert.equal(forward.walkingMinutes,null);
 assert.equal(forward.certifiedPedestrianRoute,false);
 assert.equal(reverse.coastlineVerified,false);
 assert.equal(reverse.playerMoved,false);
 assert.equal(reverse.npcMoved,false);
});

test('source-backed harbor light and port views do not assert a surveyed shoreline',()=>{
 const d=plan();
 const setting=readFileSync(new URL('../game/STARTING_LOCATIONS.md',import.meta.url),'utf8');
 const transcript=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.ok(d.story_consistency.starting_location_evidence.every(x=>setting.includes(x)));
 assert.ok(d.story_consistency.chapter_evidence.every(x=>transcript.includes(x)));
 assert.equal(d.story_consistency.visible_harbor_from_crosswater_must_remain_plausible,true);
 assert.equal(d.story_consistency.direct_sightline_verified,false);
 assert.equal(d.story_consistency.industrial_port_access_verified,false);
 assert.equal(d.story_consistency.passenger_port_access_verified,false);
 assert.equal(d.story_consistency.land_water_barrier_surveyed,false);
 assert.equal(d.coordinate_policy.shoreline_or_port_perimeter_surveyed,false);
});

test('the existing Market Row–Harbor Walk graph edge is preserved but not drawn here',()=>{
 const s=state(),d=plan();
 assert.ok(s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK'));
 assert.ok(s.world.locations['LOC-HARBOR-WALK'].connected_ids.includes('LOC-COMMERCIAL-DISTRICT'));
 assert.equal(d.inherited_road_web_policy.unchanged_existing_market_to_harbor_graph_edge.geometry_status,'not_yet_detailed');
 assert.equal(d.inherited_road_web_policy.unchanged_existing_market_to_harbor_graph_edge.must_not_be_collapsed_into_crosswater_route,true);
 assert.equal(previewPlazaHarborCorridor({state:s,fromId:'LOC-COMMERCIAL-DISTRICT',toId:'MB-PH-N4'}).status,
  'outside_this_corridor');
});

test('workshop, terminal interior and port infrastructure cannot enter this local preview',()=>{
 const s=state(),before=JSON.stringify(s);
 for(const x of ['LOC-WILSON-WORKSHOP','LOC-TRANSIT-TERMINAL','LOC-PORT-INDUSTRIAL-PRIVATE']){
  const p=previewPlazaHarborCorridor({state:s,fromId:'MB-PH-N1',toId:x});
  assert.equal(p.status,'outside_this_corridor');
  assert.equal(p.nodeIds,null);
  assert.equal(p.canonicalAdmission,false);
 }
 assert.equal(JSON.stringify(s),before);
});

test('an absent Crosswater–Harbor edge fails closed',()=>{
 const s=state();
 s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validatePlazaHarborCorridor({state:s}),
  /Story route contradicts saved location connections|Harbor Walk link is absent/);
});

test('an absent independent direct Market Row–Harbor edge also fails closed',()=>{
 const s=state();
 s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validatePlazaHarborCorridor({state:s}),
  /Existing direct Market Row to Harbor Walk branch must not disappear/);
});

test('intermediate geometry is never promoted into canonical world locations or sea access',()=>{
 const d=plan(),s=state();
 assert.ok(d.nodes.slice(1,-1).every(x=>x.location_id===null&&
  x.kind==='intermediate_geometry_node'&&!(x.id in s.world.locations)));
 assert.equal(d.coordinate_policy.draft_is_not_vehicle_route,true);
 assert.equal(d.cross_section_review.land_vs_water_intersection_verified,false);
 assert.equal(d.cross_section_review.public_private_property_line_verified,false);
 assert.equal(d.cross_section_review.no_automatic_port_area_admission,true);
 assert.equal(d.acceptance_gates.no_canonical_world_write,true);
 assert.equal(d.acceptance_gates.no_player_or_npc_movement,true);
 assert.equal(d.acceptance_gates.no_fake_times_or_travel_minutes,true);
});
