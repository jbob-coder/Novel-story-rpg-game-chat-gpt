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


test('mixed priorities rotate through the remaining slots without permanent gaps',()=>{
 const actors=structuredClone(syntheticActors);
 actors['NPC-180']={goal:'Review an outstanding responsibility.',
  commitments:[{status:'pending',due_day:-29}]};
 const seen=new Set();
 for(let turn=0;turn<20;turn++){
  const review=rankOpenNPCReviewCandidates({actors,completedTurn:turn,worldDay:-29,limit:5});
  assert.equal(review.eligibleCount,81);
  assert.equal(review.selected.length,5);
  assert.equal(review.selected[0].actorId,'NPC-180');
  assert.equal(new Set(review.selected.map(x=>x.actorId)).size,5);
  review.selected.forEach(row=>seen.add(row.actorId));
 }
 assert.equal(seen.size,81,'All 80 ordinary actors must receive review across 20 four-slot windows');
});

test('saturated due priorities remain a separate policy limitation',()=>{
 const actors=structuredClone(syntheticActors);
 for(let i=100;i<105;i++)actors['NPC-'+i].commitments=[{status:'pending',due_day:-29}];
 const review=rankOpenNPCReviewCandidates({actors,completedTurn:0,worldDay:-29,limit:5});
 assert.equal(review.eligibleCount,80);
 assert.ok(review.selected.every(row=>row.priority===3));
 // This patch preserves strict due-first policy. It does not promise lower-priority coverage under saturation.
});
