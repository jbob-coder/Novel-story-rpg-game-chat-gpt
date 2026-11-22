import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {screenDraftRoute,inspectHarborRouteAlternatives}
 from '../tools/meridian_bay_harbor_route_comparison.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(read(p));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const src=name=>'../docs/01_world/'+name+'.json';
const state=()=>json('../game/STATE.json');
const review=()=>inspectHarborRouteAlternatives({state:state()});

test('three historical route sources and coast source have pinned Git blob identities',()=>{
 for(const [name,hash]of [
 ['SOURCE_PR44_MARKET_HARBOR_20261120','e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
 ['SOURCE_PR58_MARKET_HARBOR_20261120','280a444f6eed99a33027aea2edb48af70cc67bd0'],
 ['SOURCE_PR56_PLAZA_HARBOR_20261120','a5ac772922b4717797118b15f182207be1d1a7fb'],
 ['SOURCE_PR67_COAST_01_20261120','7cb79b2113bfef7b7fbbc39539c17fd80a275cd7']
 ])assert.equal(sha(read(src(name))),hash);
});

test('saved graph, real endpoints, candidate node counts and review-only custody',()=>{
 const v=review();
 assert.equal(v.classification,'narrator_private_noncanonical_corridor_review');
 assert.deepEqual(v.candidates.map(x=>x.pointCount),[5,6,5]);
 assert.deepEqual(v.candidates.map(x=>x.segmentCount),[4,5,4]);
 assert.deepEqual(v.candidates.map(x=>x.startLocationId),
  ['LOC-COMMERCIAL-DISTRICT','LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA']);
 assert.ok(v.candidates.every(x=>x.endLocationId==='LOC-HARBOR-WALK'));
 assert.deepEqual(v.newSavedWorldLinks,[]);
 assert.equal(v.approvedPhysicalRoute,null);
});

test('PR44 crosses only hypothetical blocked street trace on fourth route span',()=>{
 const v=review().candidates[0];
 assert.deepEqual(v.findings,[{
  type:'hypothetical_blocked_trace_strict_cross',
  candidateId:'HC-A-OLDTRACE',routeSegment:3,candidateSegment:1
 }]);
});

test('PR58 crosses same blocked draft trace on its fifth route span',()=>{
 const v=review().candidates[1];
 assert.deepEqual(v.findings,[{
  type:'hypothetical_blocked_trace_strict_cross',
  candidateId:'HC-A-OLDTRACE',routeSegment:4,candidateSegment:1
 }]);
});

test('PR56 intersects two candidate HC-B-01 edges within its third route span',()=>{
 const v=review().candidates[2];
 assert.deepEqual(v.findings,[{
  type:'candidate_building_strict_cross',candidateId:'HC-B-01',
  routeSegment:2,candidateEdge:1
 },{
  type:'candidate_building_strict_cross',candidateId:'HC-B-01',
  routeSegment:2,candidateEdge:2
 }]);
});

test('candidate canvas lengths are not real distances and cannot select a route',()=>{
 const v=review();
 assert.deepEqual(v.candidates.map(x=>x.sketchCanvasLength),
  [14.996483,15.758878,7.837531]);
 assert.deepEqual(v.marketDraftLengthOrder,['PR44','PR58']);
 assert.equal(v.lengthOrderDoesNotAuthorizeSelection,true);
 for(const c of v.candidates){
  assert.equal(c.distanceKm,null);
  assert.equal(c.travelMinutes,null);
  assert.equal(c.selected,false);
  assert.equal(c.eligibleForPhysicalApproval,false);
 }
});

test('synthetic contained waypoints and tangent contact are not misclassified as clear',()=>{
 const coast={building_footprints:[{id:'BUILD',polygon:[
  {x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}]}],street_alignments:[]};
 const contained=screenDraftRoute({nodes:[
  {xy:{x:1,y:1}},{xy:{x:1.5,y:1.5}}]},coast);
 assert.deepEqual(contained.findings.map(x=>x.type),
  ['candidate_building_waypoint_inside','candidate_building_waypoint_inside']);
 const touching=screenDraftRoute({nodes:[
  {xy:{x:-1,y:-1}},{xy:{x:0,y:0}}]},coast);
 assert.ok(touching.findings.some(x=>x.type==='candidate_building_boundary_touch'));
});

test('synthetic blocked trace, invalid coordinates and zero-length candidate fail safely',()=>{
 const coast={building_footprints:[],street_alignments:[
  {id:'TRACE',mode:'blocked',points:[{x:1,y:-1},{x:1,y:3}]}]};
 const crossing=screenDraftRoute({nodes:[{xy:{x:0,y:1}},{xy:{x:2,y:1}}]},coast);
 assert.deepEqual(crossing.findings,[{type:'hypothetical_blocked_trace_strict_cross',
  candidateId:'TRACE',routeSegment:0,candidateSegment:0}]);
 assert.throws(()=>screenDraftRoute({nodes:[{xy:{x:0,y:0}},{xy:{x:0,y:0}}]},coast),/Zero-length/);
 assert.throws(()=>screenDraftRoute({nodes:[{xy:{x:0,y:0}},{xy:{x:NaN,y:0}}]},coast),/invalid coordinates/);
 assert.throws(()=>screenDraftRoute({},coast),/Draft corridor/);
});

test('a forged missing saved-world connection fails closed',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>inspectHarborRouteAlternatives({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('private inspection is cloned, read-only, and does not narrate or advance time',()=>{
 const s=state(),before=JSON.stringify(s);
 const v=inspectHarborRouteAlternatives({state:s});
 v.candidates[0].findings[0].candidateId='FORGED';
 assert.equal(inspectHarborRouteAlternatives({state:s}).candidates[0].findings[0].candidateId,
  'HC-A-OLDTRACE');
 assert.equal(JSON.stringify(s),before);
 assert.equal(v.historicalSourcesOnly,true);
 assert.equal(v.playerMoved,false);
 assert.equal(v.npcMoved,false);
 assert.equal(v.fictionalTimeAdvanced,false);
 assert.equal(v.narrativeDeliveryAuthorized,false);
 assert.equal(v.routeAccessibilityVerified,false);
 assert.equal(v.newLocationRecorded,false);
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
});
