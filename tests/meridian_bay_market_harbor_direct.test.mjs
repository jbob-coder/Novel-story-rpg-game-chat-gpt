import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateMarketHarborDirectCorridor,
 previewMarketHarborDirectCorridor} from '../tools/meridian_bay_market_harbor_direct.mjs';
import {validateCrosswaterHarborCorridor} from '../tools/meridian_bay_cross_harbor_corridor.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const design=()=>read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_DIRECT_DETAIL_20261116.json');

test('direct Market Row–Harbor Walk has five ordered sketch points with four in-between links',()=>{
 const s=checkpoint(),original=JSON.stringify(s),p=design();
 assert.equal(validateMarketHarborDirectCorridor({state:s}),true);
 assert.deepEqual(p.nodes.map(x=>x.xy),[
  {x:58,y:43},{x:60,y:40.7},{x:64,y:38.1},{x:68,y:36.9},{x:71,y:37}
 ]);
 assert.deepEqual(p.route_links.map(x=>x.from),p.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(p.route_links.map(x=>x.to),p.nodes.slice(1).map(x=>x.id));
 assert.equal(JSON.stringify(s),original);
});

test('four two-sided frontage bands describe in-between context without fixed building plots',()=>{
 const s=checkpoint(),p=design();
 assert.equal(validateMarketHarborDirectCorridor({state:s}),true);
 assert.equal(p.route_links.length,4);
 assert.equal(p.frontage_bands.length,4);
 assert.deepEqual(p.route_links.map(x=>x.frontage_id),p.frontage_bands.map(x=>x.id));
 assert.ok(p.frontage_bands.every(x=>x.side_a&&x.side_b&&x.surveyed_building_footprints===false));
 assert.ok(p.route_links.every(x=>x.minutes===null&&x.passable_verified===false));
});

test('four-link draft preview works both ways without real travel or time advance',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const forward=previewMarketHarborDirectCorridor({state:s,fromId:'MB-MH-N0',toId:'MB-MH-N4'});
 const backward=previewMarketHarborDirectCorridor({state:s,fromId:'MB-MH-N4',toId:'MB-MH-N0'});
 assert.deepEqual(forward.nodeIds,['MB-MH-N0','MB-MH-N1','MB-MH-N2','MB-MH-N3','MB-MH-N4']);
 assert.deepEqual(forward.linkIds,['MB-MH-L1','MB-MH-L2','MB-MH-L3','MB-MH-L4']);
 assert.deepEqual(backward.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(backward.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(backward.frontageIds,[...forward.frontageIds].reverse());
 for(const result of [forward,backward]){
  assert.equal(result.status,'proposed_connected');
  assert.equal(result.canonicalNavigationAuthorized,false);
  assert.equal(result.actualWalkingMinutes,null);
  assert.equal(result.playerMoved,false);
  assert.equal(result.npcsMoved,false);
  assert.equal(result.fictionalTimeAdvanced,false);
  assert.equal(result.newPlayerKnowledge,false);
 }
 assert.equal(JSON.stringify(s),before);
});

test('direct route never replaces the separate known path via Crosswater',()=>{
 const s=checkpoint(),p=design();
 assert.equal(validateMarketHarborDirectCorridor({state:s}),true);
 assert.equal(p.connection.direct_reference_not_through_crosswater,true);
 assert.deepEqual(p.nodes.filter(x=>x.location_id!==null).map(x=>x.location_id),[
  'LOC-COMMERCIAL-DISTRICT','LOC-HARBOR-WALK'
 ]);
 assert.ok(s.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-CROSSWATER-PLAZA'));
 assert.ok(s.world.locations['LOC-CROSSWATER-PLAZA'].connected_ids.includes('LOC-HARBOR-WALK'));
 assert.equal(validateCrosswaterHarborCorridor({state:s}),true);
});

test('story evidence for port views and Café Bruma terminal glow remains intact',()=>{
 const p=design();
 const starting=readFileSync(new URL('../game/STARTING_LOCATIONS.md',import.meta.url),'utf8');
 const chapter=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.equal(p.story_checks.length,6);
 assert.ok(p.story_checks.every(x=>
  (x.source==='game/STARTING_LOCATIONS.md'?starting:chapter).includes(x.fragment)));
 assert.equal(p.review.preserve_cafe_and_plaza_visibility_evidence,true);
 assert.equal(p.review.no_fixed_coastline_or_building_heights,true);
 assert.ok(p.frontage_bands.every(x=>x.harbor_entry_granted===false));
});

test('missing the original Market Row–Harbor Walk edge is rejected',()=>{
 const s=checkpoint();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids
   .filter(x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateMarketHarborDirectCorridor({state:s}),
  /The separate Market Row–Harbor Walk graph link must not disappear|Direct Market Row–Harbor Walk must use the existing saved graph link/);
});

test('the direct corridor does not invent a Crosswater interchange or dock access',()=>{
 const s=checkpoint();
 for(const outside of ['LOC-TRANSIT-TERMINAL','LOC-CROSSWATER-PLAZA','LOC-CAFE-BRUMA','LOC-NEW-DOCK']){
  const result=previewMarketHarborDirectCorridor({state:s,fromId:'MB-MH-N0',toId:outside});
  assert.equal(result.status,'outside_this_corridor');
  assert.equal(result.nodeIds,null);
  assert.equal(result.portEntryAuthorized,false);
 }
 assert.ok(design().nodes.slice(1,-1).every(x=>x.location_id===null&&!(x.id in s.world.locations)));
});

test('draft coordinates are separate from canon and earlier road sketches are unchanged',()=>{
 const s=checkpoint(),p=design(),before=JSON.stringify(s);
 const slices=[1,2,3].map(n=>read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE'+n+'_20261116.json'));
 assert.equal(slices.reduce((n,x)=>n+x.segments.length,0),9);
 assert.equal(p.connection.proposed_sketch_segment_id,'MB-WEB-010');
 assert.equal(p.review.no_canonical_state_changes,true);
 assert.equal(p.review.previous_three_corridors_unchanged,true);
 assert.equal(p.review.no_npc_presence_or_story_event,true);
 assert.equal(validateMarketHarborDirectCorridor({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});
