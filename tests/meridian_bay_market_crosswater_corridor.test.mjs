import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketCrosswaterCorridor,
 previewMarketCrosswaterCorridor,inspectMarketCrosswaterCorridor} from
 '../tools/meridian_bay_market_crosswater_corridor.mjs';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const detail=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_CORRIDOR_DETAIL_20261116.json');

test('Market Row–Crosswater detail inherits the same proposed parent line and four intervals',()=>{
 const s=state(),before=JSON.stringify(s),d=detail();
 assert.equal(validateMarketCrosswaterCorridor({state:s}),true);
 const parent=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json');
 const segment=parent.segments.find(x=>x.id==='MB-WEB-007');
 assert.deepEqual(d.nodes.map(x=>x.xy),[{x:58,y:43},...segment.via_xy_units,{x:65,y:42}]);
 assert.deepEqual([d.endpoints.from_location_id,d.endpoints.to_location_id],
  [segment.from_id,segment.to_id]);
 assert.equal(JSON.stringify(s),before);
});

test('every section link is continuous, with two provisional frontage sides',()=>{
 const d=detail(),v=inspectMarketCrosswaterCorridor({state:state()});
 assert.equal(v.nodes.length,5);
 assert.equal(v.links.length,4);
 assert.equal(v.frontageBands.length,4);
 assert.deepEqual(d.links.map(x=>x.from),d.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.to),d.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(d.bands.map(x=>x.link_id),d.links.map(x=>x.id));
 assert.ok(d.bands.every(x=>x.relative_sides.A&&x.relative_sides.B));
 assert.ok(d.links.every(x=>x.estimated_minutes===null&&x.traffic_flow==='unknown'));
 assert.equal(v.nextSectionBlockedUntilReview,true);
});

test('walking sketch forwards and backwards contains all intermediate areas',()=>{
 const s=state();
 const f=previewMarketCrosswaterCorridor({state:s,fromId:'MB-MC-N0',toId:'MB-MC-N4'});
 assert.equal(f.status,'proposed_connected');
 assert.deepEqual(f.nodeIds,['MB-MC-N0','MB-MC-N1','MB-MC-N2','MB-MC-N3','MB-MC-N4']);
 assert.deepEqual(f.linkIds,['MB-MC-L1','MB-MC-L2','MB-MC-L3','MB-MC-L4']);
 assert.deepEqual(f.frontageBands,['MB-MC-B1','MB-MC-B2','MB-MC-B3','MB-MC-B4']);
 const b=previewMarketCrosswaterCorridor({state:s,fromId:'MB-MC-N4',toId:'MB-MC-N0'});
 assert.deepEqual(b.nodeIds,[...f.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...f.linkIds].reverse());
 assert.deepEqual(b.frontageBands,[...f.frontageBands].reverse());
 assert.equal(f.canonicalNavigationAuthorized,false);
 assert.equal(f.playerMoved,false);
 assert.equal(f.walkingMinutes,null);
});

test('geometry draft does not make new world places, crossings or NPC movements',()=>{
 const d=detail(),s=state(),before=JSON.stringify(s);
 assert.ok(d.nodes.slice(1,-1).every(x=>x.kind==='intermediate_geometry_node'&&x.location_id===null));
 assert.ok(d.nodes.slice(1,-1).every(x=>!(x.id in s.world.locations)));
 assert.equal(d.coordinate_policy.surveyed_road_right_of_way,false);
 assert.equal(d.cross_section_review.accessible_crossings,'unknown');
 assert.equal(d.review_gate.can_author_new_canonical_places,false);
 assert.equal(d.review_gate.can_assign_npc_schedules,false);
 assert.equal(d.review_gate.may_advance_time,false);
 assert.equal(JSON.stringify(s),before);
});

test('saved Café Bruma terminal-glow account remains a design constraint, not optical proof',()=>{
 const d=detail(),chapter=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.ok(d.story_consistency.required_literal_fragments.every(x=>chapter.includes(x)));
 assert.equal(d.story_consistency.terminal_glow_must_remain_plausible,true);
 assert.equal(d.story_consistency.direct_sightline_verified,false);
 assert.equal(d.story_consistency.building_massing_surveyed,false);
 const preview=previewMarketCrosswaterCorridor({state:state(),
  fromId:'MB-MC-N0',toId:'MB-MC-N4'});
 assert.equal(preview.cafeToTerminalSightlineVerified,false);
});

test('unrelated Harbor, household and café anchors cannot be silently connected to this corridor',()=>{
 const s=state();
 for(const loc of ['LOC-HARBOR-WALK','LOC-WILSON-APARTMENT','LOC-CAFE-BRUMA']){
  const preview=previewMarketCrosswaterCorridor({state:s,fromId:'MB-MC-N1',toId:loc});
  assert.equal(preview.status,'outside_this_corridor');
  assert.equal(preview.nodeIds,null);
 }
});

test('removing Crosswater’s existing market connection fails closed',()=>{
 const s=state();
 s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids
   .filter(x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateMarketCrosswaterCorridor({state:s}),
  /Story route contradicts saved location connections|Proposed segment is absent/);
});
