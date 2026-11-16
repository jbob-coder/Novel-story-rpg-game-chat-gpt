import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCrosswaterHarborCorridor,
 previewCrosswaterHarborCorridor} from '../tools/meridian_bay_cross_harbor_corridor.mjs';
import {validateMarketCrosswaterCorridor} from '../tools/meridian_bay_market_cross_corridor.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_CROSS_HARBOR_CORRIDOR_DETAIL_20261116.json');

test('four waterfront details match the pre-existing Crosswater Plaza–Harbor Walk polyline',()=>{
 const state=checkpoint(),before=JSON.stringify(state),p=plan();
 assert.equal(validateCrosswaterHarborCorridor({state}),true);
 const parent=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE3_20261116.json').segments[0];
 const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const pos=Object.fromEntries(city.locations.map(x=>[x.id,x.reference_xy_units]));
 assert.deepEqual(p.nodes.map(x=>x.xy),[
  pos[parent.from_id],...parent.via_xy_units,pos[parent.to_id]]);
 assert.equal(p.endpoints.parent_segment_id,'MB-WEB-009');
 assert.equal(JSON.stringify(state),before);
});

test('exactly four adjacent links and four paired two-sided frontage bands',()=>{
 const s=checkpoint(),p=plan();
 assert.equal(validateCrosswaterHarborCorridor({state:s}),true);
 assert.equal(p.nodes.length,5);
 assert.equal(p.links.length,4);
 assert.equal(p.frontage_bands.length,4);
 assert.deepEqual(p.links.map(x=>x.from),p.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(p.links.map(x=>x.to),p.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(p.links.map(x=>x.band_id),p.frontage_bands.map(x=>x.id));
 assert.ok(p.frontage_bands.every(x=>x.side_a&&x.side_b));
 assert.ok(p.links.every(x=>x.travel_minutes===null&&x.public_access_verified===false));
});

test('draft preview can traverse all in-between areas in both directions without moving anyone',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const a=previewCrosswaterHarborCorridor({state:s,fromId:'MB-CH-N0',toId:'MB-CH-N4'});
 const b=previewCrosswaterHarborCorridor({state:s,fromId:'MB-CH-N4',toId:'MB-CH-N0'});
 assert.deepEqual(a.nodeIds,['MB-CH-N0','MB-CH-N1','MB-CH-N2','MB-CH-N3','MB-CH-N4']);
 assert.deepEqual(a.linkIds,['MB-CH-L1','MB-CH-L2','MB-CH-L3','MB-CH-L4']);
 assert.deepEqual(b.nodeIds,[...a.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...a.linkIds].reverse());
 assert.deepEqual(b.bandIds,[...a.bandIds].reverse());
 for(const result of [a,b]){
  assert.equal(result.status,'proposed_connected');
  assert.equal(result.playerMoved,false);
  assert.equal(result.fictionalTimeAdvanced,false);
  assert.equal(result.canonicalNavigationAuthorized,false);
  assert.equal(result.actualWalkingMinutes,null);
 }
 assert.equal(JSON.stringify(s),before);
});

test('the visible harbor is story evidence, not a certified direct view or port entry',()=>{
 const p=plan(),start=readFileSync(new URL('../game/STARTING_LOCATIONS.md',import.meta.url),'utf8');
 const chapter=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.equal(p.source_requirements.length,5);
 assert.ok(p.source_requirements.every(x=>
  (x.source==='game/STARTING_LOCATIONS.md'?start:chapter).includes(x.fragment)));
 assert.equal(p.visibility_review.visibility_ray_verified,false);
 assert.equal(p.visibility_review.waterfront_outline_unknown,true);
 assert.equal(p.visibility_review.public_shipyard_dock_entry_approved,false);
 assert.ok(p.frontage_bands.every(x=>x.water_access_granted===false));
});

test('Market Row–Harbor Walk direct graph link survives but is not counted as this street',()=>{
 const s=checkpoint(),p=plan();
 assert.equal(validateCrosswaterHarborCorridor({state:s}),true);
 assert.ok(s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK'));
 assert.ok(s.world.locations['LOC-HARBOR-WALK'].connected_ids.includes('LOC-COMMERCIAL-DISTRICT'));
 assert.ok(!p.nodes.some(x=>x.location_id==='LOC-COMMERCIAL-DISTRICT'));
 const only=previewCrosswaterHarborCorridor({state:s,fromId:'LOC-COMMERCIAL-DISTRICT',toId:'MB-CH-N4'});
 assert.equal(only.nodeIds,null);
 assert.equal(only.status,'outside_this_corridor');
});

test('previous detailed sections still validate independently and the new geometry adds no locations',()=>{
 const s=checkpoint(),p=plan();
 assert.equal(validateMarketCrosswaterCorridor({state:s}),true);
 assert.equal(validateCrosswaterHarborCorridor({state:s}),true);
 assert.equal(p.nodes.slice(1,-1).length,3);
 assert.ok(p.nodes.slice(1,-1).every(x=>x.location_id===null&&!(x.id in s.world.locations)));
 assert.equal(p.layout_policy.no_new_streets_or_shortcuts,true);
 assert.equal(p.review_gate.no_new_canon_locations,true);
 assert.equal(p.review_gate.no_story_time_progress,true);
});

test('remove the actual public waterfront edge and validation fails closed',()=>{
 const state=checkpoint();
 state.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  state.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validateCrosswaterHarborCorridor({state}),
  /Waterfront link is absent from the saved world graph|Story route contradicts saved location connections/);
});

test('removing the separate Market Row–Harbor Walk connection is not a valid map simplification',()=>{
 const state=checkpoint();
 state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.filter(x=>x!=='LOC-HARBOR-WALK');
 assert.throws(()=>validateCrosswaterHarborCorridor({state}),
  /The separate Market Row–Harbor Walk graph link must not disappear/);
});
