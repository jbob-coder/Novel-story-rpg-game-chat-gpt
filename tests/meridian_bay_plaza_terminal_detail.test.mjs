import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validatePlazaTerminalDetail,previewPlazaTerminalDetail} from '../tools/meridian_bay_plaza_terminal_detail.mjs';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const detail=()=>read('../docs/01_world/MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL_20261116.json');

test('plaza and glass terminal entrance are connected through one noncanonical approach point',()=>{
 const s=state(),prior=JSON.stringify(s);
 assert.equal(validatePlazaTerminalDetail({state:s}),true);
 const p=detail();
 assert.deepEqual(p.nodes.map(x=>x.xy),[{x:65,y:42},{x:65.5,y:42},{x:66,y:42}]);
 assert.deepEqual([p.from_id,p.to_id],['LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']);
 assert.equal(JSON.stringify(s),prior);
});

test('the two sections form one pedestrian concept with distinct frontage sides',()=>{
 const p=detail();
 assert.deepEqual(p.links.map(x=>[x.from,x.to]),[
  ['MB-PT-N0','MB-PT-N1'],['MB-PT-N1','MB-PT-N2']
 ]);
 assert.ok(p.links.every(x=>x.sideA&&x.sideB&&x.minutes===null));
 assert.ok(p.links.every(x=>x.traffic_crossing_status==='unknown'));
});

test('forward and reverse previews visit the intervening forecourt',()=>{
 const s=state(),a=previewPlazaTerminalDetail({state:s,fromId:'MB-PT-N0',toId:'MB-PT-N2'});
 assert.deepEqual(a.nodeIds,['MB-PT-N0','MB-PT-N1','MB-PT-N2']);
 assert.deepEqual(a.linkIds,['MB-PT-L1','MB-PT-L2']);
 const b=previewPlazaTerminalDetail({state:s,fromId:'MB-PT-N2',toId:'MB-PT-N0'});
 assert.deepEqual(b.nodeIds,[...a.nodeIds].reverse());
 assert.deepEqual(b.linkIds,[...a.linkIds].reverse());
 assert.equal(a.certifiedPedestrianRoute,false);
 assert.equal(b.accessibleCrossingConfirmed,false);
 assert.equal(a.walkingMinutes,null);
});

test('unmapped harbor, market row and private station interiors remain outside this section',()=>{
 const s=state();
 for(const x of ['LOC-HARBOR-WALK','LOC-COMMERCIAL-DISTRICT','LOC-TICKETED-PLATFORM']){
  const p=previewPlazaTerminalDetail({state:s,fromId:'MB-PT-N1',toId:x});
  assert.equal(p.status,'outside_this_section');
  assert.equal(p.nodeIds,null);
 }
});

test('player and NPC movements, discoveries, events and travel time are never invented',()=>{
 const s=state(),before=JSON.stringify(s),p=detail();
 const q=previewPlazaTerminalDetail({state:s,fromId:'MB-PT-N0',toId:'MB-PT-N2'});
 assert.equal(q.canonicalAdmission,false);
 assert.equal(q.playerMoved,false);
 assert.equal(q.npcMoved,false);
 assert.equal(q.fictionalTimeAdvanced,false);
 assert.equal(p.world_constraints.new_places,false);
 assert.equal(p.world_constraints.auto_npc_placement,false);
 assert.equal(p.pedestrian_interface.verified_accessibility,false);
 assert.equal(p.pedestrian_interface.verified_vehicle_conflict_free,false);
 assert.equal(JSON.stringify(s),before);
});

test('a missing terminal-plaza story edge rejects the detailed connection',()=>{
 const s=state();
 s.world.locations['LOC-TRANSIT-TERMINAL'].connected_ids=[];
 assert.throws(()=>validatePlazaTerminalDetail({state:s}),/Story route contradicts saved location connections|Proposed segment is absent|Missing original/);
});
