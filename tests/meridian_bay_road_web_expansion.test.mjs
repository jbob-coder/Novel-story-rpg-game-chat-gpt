import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMeridianBayRoadExpansion,
 previewMeridianBayExpandedWeb} from '../tools/meridian_bay_road_web_expansion.mjs';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');

test('next map slice adds only Market Row–Crosswater and plaza–terminal',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 assert.equal(validateMeridianBayRoadExpansion({state:s}),true);
 const data=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json');
 assert.deepEqual(data.segments.map(x=>[x.from_id,x.to_id]),[
  ['LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA'],
  ['LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']
 ]);
 assert.equal(data.mapped_world_nodes_after_this_slice,9);
 assert.equal(data.mapped_corridor_edges_after_this_slice,8);
 assert.equal(JSON.stringify(s),before);
});

test('story route from Crosswater to Wilson home remains continuous',()=>{
 const s=checkpoint();
 const route=previewMeridianBayExpandedWeb({state:s,
  fromId:'LOC-CROSSWATER-PLAZA',toId:'LOC-WILSON-APARTMENT'});
 assert.deepEqual(route.routeIds,[
  'LOC-CROSSWATER-PLAZA','LOC-COMMERCIAL-DISTRICT',
  'LOC-RAILGARDEN-RESIDENTIAL','LOC-WILSON-APARTMENT'
 ]);
 assert.equal(route.usableForCanonicalTravel,false);
 assert.equal(route.streetGeometryConfirmed,false);
 assert.equal(route.travelMinutes,null);
 assert.equal(route.playerMoved,false);
});

test('terminal to cafe preserves story connections but not a verified sightline',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const p=previewMeridianBayExpandedWeb({state:s,
  fromId:'LOC-TRANSIT-TERMINAL',toId:'LOC-CAFE-BRUMA'});
 assert.deepEqual(p.routeIds,[
  'LOC-TRANSIT-TERMINAL','LOC-CROSSWATER-PLAZA',
  'LOC-COMMERCIAL-DISTRICT','LOC-CAFE-BRUMA'
 ]);
 assert.equal(p.cafeToTerminalSightlineVerified,false);
 const data=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json');
 assert.equal(data.story_constraints.visibility_result,'not_verified');
 assert.match(data.story_constraints.visibility_preservation_rule,/building/);
 assert.equal(JSON.stringify(s),before);
});

test('missing story connection rejects the next road-slice preview',()=>{
 const s=checkpoint();
 s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids=
  s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids
   .filter(id=>id!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateMeridianBayRoadExpansion({state:s}),
  /Story route contradicts saved location connections/);
});

test('unmapped places and Harbor Walk remain outside this incremental web',()=>{
 const s=checkpoint();
 for(const target of ['LOC-HARBOR-WALK','LOC-SCHOOL-UNKNOWN']){
  const x=previewMeridianBayExpandedWeb({state:s,
   fromId:'LOC-RAILGARDEN-RESIDENTIAL',toId:target});
  assert.equal(x.status,'outside_draft_slice');
  assert.equal(x.routeIds,null);
 }
 const fromInterior=previewMeridianBayExpandedWeb({state:s,
  fromId:'LOC-WILSON-WORKSHOP',toId:'LOC-CAFE-BRUMA'});
 assert.equal(fromInterior.routeIds,null);
});
