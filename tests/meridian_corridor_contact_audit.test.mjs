import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 segmentContact,strictlyInsidePolygon,inspectRouteContacts,
 inspectMeridianCorridorContacts
} from '../tools/meridian_corridor_contact_audit.mjs';
import {candidateRouteCrossings} from '../tools/meridian_bay_three_region_seams.mjs';

const load=(file)=>JSON.parse(readFileSync(new URL(file,import.meta.url),'utf8'));
const bytes=file=>readFileSync(new URL(file,import.meta.url));
const state=()=>load('../game/STATE.json');
const root='../docs/01_world/';
const coast=()=>load(root+'MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json');
const source=name=>load(root+'SOURCE_'+name+'_20261120.json');
const blobSHA=buf=>createHash('sha1').update(Buffer.from('blob '+buf.length+'\0'))
 .update(buf).digest('hex');

test('candidate and historical source blobs are pinned independently',()=>{
 const files=[
  ['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',
   '139c3687c98285aff886d28422544d082768217d'],
  ['SOURCE_PR44_MARKET_HARBOR_20261120.json',
   'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
  ['SOURCE_PR58_MARKET_HARBOR_20261120.json',
   '280a444f6eed99a33027aea2edb48af70cc67bd0'],
  ['SOURCE_PR56_PLAZA_HARBOR_20261120.json',
   'a5ac772922b4717797118b15f182207be1d1a7fb']
 ];
 for(const [name,sha] of files)assert.equal(blobSHA(bytes(root+name)),sha,name);
});

test('all three corridors resolve only against the existing saved-world graph',()=>{
 const s=state(),v=inspectMeridianCorridorContacts({state:s});
 assert.equal(v.classification,'private_candidate_geometry_contact_audit');
 assert.equal(v.worldAuthority,'saved_location_graph_only_not_candidate_geometry');
 assert.equal(v.geometrySource,'PR67_noncanonical_coast01_candidate');
 assert.deepEqual(v.options.map(x=>x.source),['PR44','PR58','PR56']);
 assert.deepEqual(v.options.map(x=>x.segmentCount),[4,5,4]);
 assert.ok(v.options.every(x=>x.toLocationId==='LOC-HARBOR-WALK'));
 assert.deepEqual(v.options.slice(0,2).map(x=>x.fromLocationId),
  ['LOC-COMMERCIAL-DISTRICT','LOC-COMMERCIAL-DISTRICT']);
 assert.equal(v.options[2].fromLocationId,'LOC-CROSSWATER-PLAZA');
 assert.deepEqual(v.savedWorldRoutesAdded,[]);
 assert.equal(v.physicalMapApproved,false);
});

test('PR44/58 routes are different and each crosses the same hypothetical old trace',()=>{
 const v=inspectMeridianCorridorContacts({state:state()});
 const [a,b]=v.options;
 assert.equal(a.finalApproachMatchesPriorSketch,false);
 assert.equal(b.finalApproachMatchesPriorSketch,true);
 assert.equal(a.candidateBuildingIntersections,0);
 assert.equal(b.candidateBuildingIntersections,0);
 assert.equal(a.blockedTraceCrossings,1);
 assert.equal(b.blockedTraceCrossings,1);
 assert.deepEqual(a.contacts.map(x=>x.point),[{x:69.8598,y:36.962}]);
 assert.deepEqual(b.contacts.map(x=>x.point),[{x:70.0464,y:36.8093}]);
 for(const x of [a.contacts[0],b.contacts[0]]){
  assert.equal(x.category,'candidate_blocked_trace');
  assert.equal(x.candidateId,'HC-A-OLDTRACE');
  assert.equal(x.edge,1);
  assert.equal(x.kind,'strict_cross');
 }
 assert.equal(v.selectedMarketHarborRoute,null);
 assert.equal(v.issueSummary.competingDirectMarketRoutes,2);
 assert.equal(v.issueSummary.blockedTraceCrossings,2);
});

test('PR56 candidate enters and exits HC-B-01 on segment 2, not public route proof',()=>{
 const v=inspectMeridianCorridorContacts({state:state()});
 const x=v.options[2];
 assert.equal(x.candidateBuildingIntersections,2);
 assert.equal(x.blockedTraceCrossings,0);
 assert.equal(x.finalApproachMatchesPriorSketch,true);
 assert.equal(v.issueSummary.plazaCandidateBuildingCrossings,2);
 assert.deepEqual(x.contacts.map(h=>h.point),
  [{x:69.4756,y:38.5264},{x:69.0377,y:39.0008}]);
 assert.deepEqual(x.contacts.map(h=>h.edge),[1,2]);
 assert.ok(x.contacts.every(h=>h.kind==='strict_cross'&&
  h.candidateId==='HC-B-01'&&h.routeSegment===2));
 assert.equal(v.selectedPlazaHarborRoute,null);
});

test('new contact intersection counts agree with previous strict historical checks',()=>{
 const fragment=coast(),v=inspectMeridianCorridorContacts({state:state()});
 const names=['PR44_MARKET_HARBOR','PR58_MARKET_HARBOR','PR56_PLAZA_HARBOR'];
 for(let i=0;i<3;i++){
  const existing=candidateRouteCrossings(source(names[i]),fragment);
  assert.equal(v.options[i].contacts.length,existing.length);
  for(const entry of existing)assert.ok(v.options[i].contacts.some(x=>
   x.routeSegment===entry.segment&&x.candidateId===entry.candidateId&&
   x.edge===entry.edge));
 }
});

test('segment contact identifies strict crossing and calibrated fractional intersection',()=>{
 const hit=segmentContact({x:0,y:0},{x:2,y:2},{x:0,y:2},{x:2,y:0});
 assert.equal(hit.kind,'strict_cross');
 assert.deepEqual(hit.point,{x:1,y:1});
 assert.equal(hit.t,0.5);
 assert.equal(segmentContact({x:0,y:0},{x:1,y:0},
  {x:0,y:2},{x:1,y:2}),null);
});

test('tangencies at corners and endpoints are not silently treated as strict roads',()=>{
 const corner=segmentContact({x:-1,y:-1},{x:0,y:0},
  {x:0,y:0},{x:2,y:0});
 assert.equal(corner.kind,'boundary_touch');
 assert.deepEqual(corner.point,{x:0,y:0});
 const square=[{x:0,y:0},{x:3,y:0},{x:3,y:3},{x:0,y:3}];
 const contacts=inspectRouteContacts(
  [{x:-1,y:-1},{x:0,y:0}],
  [{id:'PROPOSED-B',polygon:square}],[]);
 assert.ok(contacts.length>=1);
 assert.ok(contacts.every(x=>x.kind==='boundary_touch'));
 assert.equal(strictlyInsidePolygon({x:0,y:0},square),false);
});

test('collinear shared boundaries are classified separately from strict crossings',()=>{
 const contact=segmentContact({x:-1,y:0},{x:2,y:0},
  {x:0,y:0},{x:3,y:0});
 assert.equal(contact.kind,'collinear_overlap');
 assert.deepEqual(contact.start,{x:0,y:0});
 assert.deepEqual(contact.end,{x:2,y:0});
 const overlap=inspectRouteContacts([{x:-1,y:0},{x:2,y:0}],
  [{id:'PROPOSED-B',polygon:[
   {x:0,y:0},{x:3,y:0},{x:3,y:2},{x:0,y:2}
  ]}],[]);
 assert.ok(overlap.some(x=>x.kind==='collinear_overlap'));
});

test('an entire route inside a proposed building is reported even without an edge crossing',()=>{
 const square=[{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}];
 const within=inspectRouteContacts([{x:1,y:1},{x:2,y:2}],
  [{id:'B',polygon:square}],[]);
 assert.equal(within.filter(x=>x.kind==='route_node_inside').length,2);
 assert.ok(within.every(x=>x.kind==='route_node_inside'));
 assert.equal(strictlyInsidePolygon({x:2,y:2},square),true);
 assert.equal(strictlyInsidePolygon({x:4,y:2},square),false);
});

test('malformed and zero-length geometry is rejected before being presented as a result',()=>{
 assert.throws(()=>segmentContact({x:0,y:0},{x:0,y:0},
  {x:0,y:1},{x:1,y:1}),/Zero-length segment/);
 assert.throws(()=>segmentContact({x:NaN,y:1},{x:1,y:1},
  {x:0,y:0},{x:1,y:0}),/finite points/);
 assert.throws(()=>inspectRouteContacts([{x:0,y:0},{x:0,y:0}],[],[]),
  /Duplicated consecutive route node/);
 assert.throws(()=>inspectRouteContacts([{x:0,y:0},{x:1,y:1}],
  [{id:'B',polygon:[]}],[]),/Malformed candidate building/);
});

test('missing or forged saved-world edges cannot authorize a drawn harbor route',()=>{
 assert.throws(()=>inspectMeridianCorridorContacts({state:{}}),
  /Saved world and player required/);
 const s=state(),h='LOC-HARBOR-WALK',m='LOC-COMMERCIAL-DISTRICT';
 s.world.locations[h].connected_ids=s.world.locations[h].connected_ids.filter(x=>x!==m);
 assert.throws(()=>inspectMeridianCorridorContacts({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('audit output is cloned; no player, NPC or time changes in canonical checkpoint',()=>{
 const s=state(),before=JSON.stringify(s),a=inspectMeridianCorridorContacts({state:s});
 assert.equal(a.issuesRequireSiteSurveyOrEditorialDecision,true);
 assert.equal(a.roadLengthsKm,null);
 assert.equal(a.travelMinutes,null);
 assert.equal(a.playerMoved,false);
 assert.equal(a.npcMoved,false);
 assert.equal(a.fictionalTimeAdvanced,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 a.options[0].contacts[0].point.x=999;
 const again=inspectMeridianCorridorContacts({state:s});
 assert.deepEqual(again.options[0].contacts[0].point,{x:69.8598,y:36.962});
 assert.equal(JSON.stringify(s),before);
});
