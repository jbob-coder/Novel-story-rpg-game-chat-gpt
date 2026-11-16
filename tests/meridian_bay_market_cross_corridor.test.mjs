import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketCrosswaterCorridor,previewMarketCrosswaterCorridor,
 inspectMarketCrosswaterCorridor} from '../tools/meridian_bay_market_cross_corridor.mjs';
import {validateRailgardenMarketCorridor} from '../tools/meridian_bay_rail_market_corridor.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const detail=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_CROSS_CORRIDOR_DETAIL_20261116.json');

test('Market Row to Crosswater section matches original four-part connector exactly',()=>{
 const s=checkpoint(),before=JSON.stringify(s),d=detail();
 assert.equal(validateMarketCrosswaterCorridor({state:s}),true);
 const connector=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json')
  .segments.find(x=>x.id==='MB-WEB-007');
 const scale=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const pos=Object.fromEntries(scale.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(d.nodes.map(x=>x.xy),[
  pos[connector.from_id],...connector.via_xy_units,pos[connector.to_id]
 ]);
 assert.equal(d.endpoints.from_location_id,'LOC-COMMERCIAL-DISTRICT');
 assert.equal(d.endpoints.to_location_id,'LOC-CROSSWATER-PLAZA');
 assert.equal(JSON.stringify(s),before);
});

test('each intermediate block has a connected link and a two-sided frontage',()=>{
 const s=checkpoint(),d=detail();
 const view=inspectMarketCrosswaterCorridor({state:s});
 assert.equal(view.nodes.length,5);
 assert.equal(view.links.length,4);
 assert.equal(view.frontageBands.length,4);
 assert.deepEqual(d.links.map(x=>x.from),d.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(d.links.map(x=>x.to),d.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(d.frontage_bands.map(x=>x.link_id),d.links.map(x=>x.id));
 assert.ok(d.frontage_bands.every(x=>x.side_a&&x.side_b));
 assert.ok(d.links.every(x=>x.crossing_verified===false&&x.vehicle_rules==='unknown'&&x.time_minutes===null));
 assert.equal(view.futureSectionBlockedUntilReview,true);
});

test('route preview traverses all four pieces forward and backward',()=>{
 const s=checkpoint();
 const forward=previewMarketCrosswaterCorridor({state:s,fromId:'MB-MC-N0',toId:'MB-MC-N4'});
 assert.deepEqual(forward.nodeIds,['MB-MC-N0','MB-MC-N1','MB-MC-N2','MB-MC-N3','MB-MC-N4']);
 assert.deepEqual(forward.linkIds,['MB-MC-L1','MB-MC-L2','MB-MC-L3','MB-MC-L4']);
 assert.deepEqual(forward.frontageBands,['MB-MC-B1','MB-MC-B2','MB-MC-B3','MB-MC-B4']);
 const backward=previewMarketCrosswaterCorridor({state:s,fromId:'MB-MC-N4',toId:'MB-MC-N0'});
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(backward.frontageBands,[...forward.frontageBands].reverse());
 assert.equal(forward.canonicalNavigationAuthorized,false);
 assert.equal(backward.playerMoved,false);
 assert.equal(forward.fictionalTimeAdvanced,false);
 assert.equal(backward.walkingMinutes,null);
});

test('story evidence pins plaza arrival, café corner and noncertified terminal glow',()=>{
 const s=checkpoint(),d=detail(),before=JSON.stringify(s);
 const transcript=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 for(const evidence of d.story_requirements){
  assert.ok(transcript.includes(evidence.fragment));
 }
 const v=inspectMarketCrosswaterCorridor({state:s}).unresolvedVisibility;
 assert.equal(v.raycast_or_sightline_completed,false);
 assert.equal(v.block_new_obstructing_building_canon_until_review,true);
 assert.equal(v.do_not_claim_direct_line_of_sight,true);
 assert.equal(JSON.stringify(s),before);
});

test('existing Railgarden to Market Row detail remains intact on this branch',()=>{
 const s=checkpoint(),old=read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL_20261116.json');
 assert.equal(validateRailgardenMarketCorridor({state:s}),true);
 assert.equal(old.nodes.length,5);
 assert.equal(old.links.length,4);
 assert.equal(old.bands.length,4);
 assert.equal(validateMarketCrosswaterCorridor({state:s}),true);
});

test('the public terminal and café are not silently moved onto new road vertices',()=>{
 const d=detail(),s=checkpoint();
 assert.ok(d.nodes.slice(1,-1).every(x=>x.location_id===null));
 assert.ok(d.nodes.slice(1,-1).every(x=>!(x.id in s.world.locations)));
 assert.ok(!d.nodes.some(x=>x.location_id==='LOC-TRANSIT-TERMINAL'));
 assert.ok(!d.nodes.some(x=>x.location_id==='LOC-CAFE-BRUMA'));
 const x=previewMarketCrosswaterCorridor({state:s,
  fromId:'LOC-CAFE-BRUMA',toId:'MB-MC-N4'});
 assert.equal(x.status,'outside_this_corridor');
 assert.equal(x.nodeIds,null);
});

test('missing existing Market Row–Crosswater link rejects the detailed corridor',()=>{
 const s=checkpoint();
 s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids
   .filter(id=>id!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateMarketCrosswaterCorridor({state:s}),
  /Story route contradicts saved location connections/);
});
