// Bounded offscreen NPC review, priority and rotating fairness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles} from '../tools/save_transaction.mjs';
import {rankOpenNPCReviewCandidates,inspectOpenNPCAgency}
 from '../tools/npc_actor_agency.mjs';

const files=Object.fromEntries(savePaths('CH-000').map(p=>
 [p,readFileSync(new URL('../'+p,import.meta.url),'utf8')]));
const snapshot=decodeFiveFiles(files,'CH-000');
const syntheticActors=Object.fromEntries(Array.from({length:80},(_,i)=>{
 const id='NPC-'+String(i+100).padStart(3,'0');
 return [id,{goal:'Earn a living while caring for local obligations.',
  independent_plan:'Consider practical options as circumstances change.',
  location_id:'LOC-COMMERCIAL-DISTRICT',resources:{daily_life:'known basic context'}}];
}));
const syntheticActorFixtureBaseline=JSON.stringify(syntheticActors);

test('a large cast rotates fairly and limits expensive contextual review',()=>{
 const seen=new Set(),sample=[];
 for(let turn=0;turn<16;turn++){
  const review=rankOpenNPCReviewCandidates({actors:syntheticActors,
   completedTurn:turn,worldDay:-29,limit:5});
  assert.equal(review.eligibleCount,80);
  assert.equal(review.selected.length,5);
  for(const row of review.selected)seen.add(row.actorId);
  sample.push(review.selected[0].actorId);
 }
 assert.equal(seen.size,80,'Every equally eligible actor should get review coverage');
 assert.ok(new Set(sample).size>5);
});

test('due commitments rank before unconstrained plans without declaring success',()=>{
 const actors=structuredClone(syntheticActors);
 actors['NPC-179'].commitments=[{id:'OBL-QA',status:'pending',
  due_day:-28,summary:'Keep a time-sensitive but unresolved responsibility.'}];
 const ranked=rankOpenNPCReviewCandidates({actors,worldDay:-29,
  completedTurn:6,elapsedDays:1,limit:4});
 assert.equal(ranked.selected[0].actorId,'NPC-179');
 assert.equal(ranked.selected[0].priority,3);
 assert.equal(ranked.eligibleCount,80);
 assert.equal(Object.hasOwn(actors['NPC-179'],'last_resolved_action'),false);
});

test('a historical action does not permanently crowd out new NPCs',()=>{
 const actors=structuredClone(syntheticActors);
 actors['NPC-100'].last_resolved_action={event_id:'EV-000080',day:-29,
  summary:'A prior ordinary action in synthetic context.'};
 const first=rankOpenNPCReviewCandidates({actors,worldDay:-29,
  completedTurn:0,limit:5});
 const later=rankOpenNPCReviewCandidates({actors,worldDay:-29,
  completedTurn:14,limit:5});
 assert.equal(first.selected[0].priority,0);
 assert.ok(!later.selected.some(x=>x.actorId==='NPC-100'));
});

test('actual saved seven-NPC world remains reviewable without mutation',()=>{
 const before=JSON.stringify(snapshot);
 const p=inspectOpenNPCAgency({snapshot,elapsedMinutes:25,limit:20});
 assert.equal(p.actorCount,7);
 assert.equal(p.reviewCount,7);
 assert.ok(p.frames.some(x=>x.actorId==='NPC-006'));
 assert.ok(p.frames.every(x=>x.actionSelected===false));
 assert.equal(JSON.stringify(snapshot),before);
 for(const [path,original] of Object.entries(files))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),original);
});

test('invalid candidate limits and actor identities are rejected',()=>{
 assert.throws(()=>rankOpenNPCReviewCandidates({actors:syntheticActors,
  worldDay:-29,completedTurn:9,limit:0}),/Invalid NPC review limit/);
 assert.throws(()=>rankOpenNPCReviewCandidates({actors:syntheticActors,
  worldDay:-29,completedTurn:9,limit:5,actorIds:['NPC-100','NPC-100']}),
  /Unknown or duplicate NPC review selection/);
});

test('persistent overdue work cannot permanently exclude ordinary civilians',()=>{
 const actors=structuredClone(Object.fromEntries(Object.entries(syntheticActors).slice(0,12)));
 for(const id of Object.keys(actors).slice(0,6))
  actors[id].commitments=[{id:'DUE-'+id,status:'pending',due_day:-30,
   summary:'SYNTHETIC overdue obligation, not an instruction to act.'}];
 const frozen=JSON.stringify(actors),seen=new Set(),ordinary=new Set();
 for(let turn=0;turn<12;turn++){
  const result=rankOpenNPCReviewCandidates({actors,
   worldDay:-29,completedTurn:turn,limit:4});
  assert.equal(result.selected.length,4);
  assert.equal(result.selected[0].priority,3);
  assert.ok(result.selected.some(x=>x.priority===0),
   'Ordinary civilians need a share of review even when deadlines persist');
  for(const row of result.selected){
   seen.add(row.actorId);
   if(row.priority===0)ordinary.add(row.actorId);
  }
 }
 assert.equal(seen.size,12);
 assert.equal(ordinary.size,6);
 assert.equal(JSON.stringify(actors),frozen);
 assert.equal(JSON.stringify(syntheticActors),syntheticActorFixtureBaseline);
});

test('a two-slot budget rotates fairly across three priority bands',()=>{
 const actors=structuredClone(Object.fromEntries(Object.entries(syntheticActors).slice(0,6)));
 const ids=Object.keys(actors);
 for(const id of ids.slice(0,2))actors[id].commitments=[
  {id:'DUE-'+id,status:'pending',due_day:-30,summary:'SYNTHETIC deadline'}];
 for(const id of ids.slice(2,4))actors[id].commitments=[
  {id:'OPEN-'+id,status:'pending',due_day:10,summary:'SYNTHETIC future work'}];
 const seen=new Set(),lowerBands=new Set();
 for(let turn=0;turn<12;turn++){
  const result=rankOpenNPCReviewCandidates({actors,
   worldDay:-29,completedTurn:turn,limit:2});
  assert.equal(result.selected.length,2);
  assert.equal(result.selected[0].priority,3);
  assert.ok([0,1].includes(result.selected[1].priority));
  for(const row of result.selected){
   seen.add(row.actorId);
   if(row.priority!==3)lowerBands.add(row.priority);
  }
 }
 assert.equal(seen.size,6);
 assert.deepEqual([...lowerBands].sort(),[0,1]);
 assert.equal(JSON.stringify(syntheticActors),syntheticActorFixtureBaseline);
});

test('a single review slot eventually covers overdue and ordinary actors',()=>{
 const actors=structuredClone(Object.fromEntries(Object.entries(syntheticActors).slice(0,4)));
 const ids=Object.keys(actors);
 for(const id of ids.slice(0,2))actors[id].commitments=[
  {id:'DUE-'+id,status:'pending',due_day:-30,summary:'SYNTHETIC deadline'}];
 const seen=new Set(),priorities=new Set();
 for(let turn=0;turn<12;turn++){
  const result=rankOpenNPCReviewCandidates({actors,
   worldDay:-29,completedTurn:turn,limit:1});
  assert.equal(result.selected.length,1);
  seen.add(result.selected[0].actorId);
  priorities.add(result.selected[0].priority);
 }
 assert.equal(seen.size,4);
 assert.deepEqual([...priorities].sort(),[0,3]);
 assert.equal(JSON.stringify(syntheticActors),syntheticActorFixtureBaseline);
});
