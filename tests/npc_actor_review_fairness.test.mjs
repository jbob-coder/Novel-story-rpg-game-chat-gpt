// Bounded offscreen NPC review, priority and rotating fairness.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles} from '../tools/save_transaction.mjs';
import {rankOpenNPCReviewCandidates,rankNPCReviewWithAging,createNPCReviewLedger,encodeNPCReviewLedger,decodeNPCReviewLedger,persistNPCReviewReceipt,inspectOpenNPCAgency}
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


function agingActors(count,due){
 return Object.fromEntries(Array.from({length:count},(_,i)=>[
  'NPC-'+(100+i),{goal:'Ordinary personal life.',
   ...(i<due?{commitments:[{status:'pending',due_day:-29}]}:{})}]));
}
function runAging(count,due,limit,windows){
 const actors=agingActors(count,due),lastReviewedAt={},seen=new Set(),urgentPerWindow=[];
 for(let completedTurn=0;completedTurn<windows;completedTurn++){
  const before=JSON.stringify({actors,lastReviewedAt});
  const result=rankNPCReviewWithAging({actors,worldDay:-29,completedTurn,limit,lastReviewedAt});
  assert.equal(JSON.stringify({actors,lastReviewedAt}),before);
  assert.equal(result.selected.length,Math.min(count,limit));
  assert.equal(new Set(result.selected.map(x=>x.actorId)).size,result.selected.length);
  assert.equal(result.actionsPerformed,0);
  assert.equal(result.timeAdvanced,false);
  assert.equal(result.historyPersisted,false);
  assert.equal(result.readerVisible,false);
  const urgent=result.selected.filter(x=>x.priority===3).length;
  urgentPerWindow.push(urgent);
  assert.equal(result.deferredDueCount,due-urgent);
  assert.equal(result.deferredOtherCount,count-due-(result.selected.length-urgent));
  // Only a genuinely completed synthetic review updates caller-owned history.
  for(const row of result.selected){
   seen.add(row.actorId);lastReviewedAt[row.actorId]=completedTurn;
  }
 }
 return {coverage:seen.size,urgentPerWindow};
}
test('experimental aging prevents starvation during continuous due saturation',()=>{
 const r=runAging(10,5,5,5);
 assert.equal(r.coverage,10);
 assert.deepEqual(r.urgentPerWindow,[4,4,4,4,4]);
});
test('single-slot aging reserves every fourth review for ordinary actors',()=>{
 const r=runAging(6,3,1,12);
 assert.equal(r.coverage,6);
 assert.deepEqual(r.urgentPerWindow,[1,1,1,0,1,1,1,0,1,1,1,0]);
});
test('aging uses all available slots without invented urgent duties',()=>{
 for(const [count,due,limit,windows] of [[80,0,5,16],[12,12,4,3],[81,1,5,20],[0,0,5,2]]){
  assert.equal(runAging(count,due,limit,windows).coverage,count);
 }
});
test('aging rejects future and same-window review history and never alters canonical ranking',()=>{
 const actors=agingActors(10,5);
 for(const invalid of [1,2,-1,0.5]){
  assert.throws(()=>rankNPCReviewWithAging({actors,worldDay:-29,completedTurn:1,limit:5,
   lastReviewedAt:{'NPC-100':invalid}}),/completed earlier review windows/);
 }
 const original=rankOpenNPCReviewCandidates({actors,worldDay:-29,completedTurn:0,limit:5});
 assert.ok(original.selected.every(x=>x.priority===3));
});
test('new or returning actors without prior reviews can receive the reserved slot',()=>{
 const actors=agingActors(6,3);
 const lastReviewedAt=Object.fromEntries(Object.keys(actors).map(id=>[id,0]));
 delete actors['NPC-105'];
 actors['NPC-106']={goal:'New ordinary personal goal.'};
 const p=rankNPCReviewWithAging({actors,worldDay:-29,completedTurn:1,limit:3,lastReviewedAt});
 assert.ok(p.selected.some(x=>x.actorId==='NPC-106'));
 assert.ok(!p.selected.some(x=>x.actorId==='NPC-105'));
});


test('urgent override is explicit and reports the ordinary capacity conflict',()=>{
 const actors=agingActors(10,5);
 for(let i=100;i<103;i++)actors['NPC-'+i].commitments[0].priority='urgent';
 const args={actors,worldDay:-29,completedTurn:0,limit:3};
 const ordinary=rankNPCReviewWithAging(args);
 assert.equal(ordinary.urgentOverrideApplied,false);
 assert.equal(ordinary.selected.filter(x=>x.priority===3).length,2);
 const urgent=rankNPCReviewWithAging({...args,urgentDueOverride:true});
 assert.deepEqual(urgent.selected.map(x=>x.actorId),['NPC-100','NPC-101','NPC-102']);
 assert.equal(urgent.deferredUrgentDueCount,0);
 assert.equal(urgent.deferredOtherCount,5);
 assert.equal(urgent.actionsPerformed,0);
});
function receiptFixture(){
 const branch='qa/review-ledger-test',sourceHead='a'.repeat(40),commitHead='b'.repeat(40);
 const receipt={branch,sourceHead,commitHead,sourceTurn:9,completedTurn:10,reviewedActorIds:['NPC-100','NPC-101']};
 let bytes=encodeNPCReviewLedger(createNPCReviewLedger({branch,head:sourceHead,completedTurn:9})),revision='1',writes=0;
 const storage={
  read:async()=>({bytes,revision}),
  compareAndSwap:async(_,r,next)=>{if(r!==revision)return false;bytes=next;revision=String(++writes+1);return true}
 };
 const verifyReceipt=async r=>JSON.stringify(r)===JSON.stringify(receipt);
 return {branch,receipt,storage,verifyReceipt,writes:()=>writes};
}
test('review receipt roundtrips and retry never records a duplicate',async()=>{
 const f=receiptFixture(),out=await persistNPCReviewReceipt(f);
 assert.equal(out.status,'recorded');
 assert.deepEqual(out.ledger.lastReviewedAt,{'NPC-100':9,'NPC-101':9});
 assert.deepEqual(decodeNPCReviewLedger((await f.storage.read()).bytes),out.ledger);
 assert.equal((await persistNPCReviewReceipt(f)).status,'already_recorded');
 assert.equal(f.writes(),1);
});
test('unverified, stale, malformed and production receipts cannot write',async()=>{
 const f=receiptFixture();
 await assert.rejects(()=>persistNPCReviewReceipt({...f,verifyReceipt:async()=>false}),/verification failed/);
 await assert.rejects(()=>persistNPCReviewReceipt({...f,receipt:{...f.receipt,sourceHead:'c'.repeat(40)},verifyReceipt:async()=>true}),/Stale/);
 await assert.rejects(()=>persistNPCReviewReceipt({...f,receipt:{...f.receipt,privateNarration:'not allowed'}}),/Invalid QA review receipt/);
 await assert.rejects(()=>persistNPCReviewReceipt({...f,receipt:{...f.receipt,reviewedActorIds:['NPC-100','NPC-100']}}),/Invalid QA review receipt/);
 assert.throws(()=>createNPCReviewLedger({branch:'work/chat-narrative-foundation',head:'a'.repeat(40),completedTurn:9}),/QA branch/);
 assert.equal(f.writes(),0);
});
test('sidecar rejects a lost write lease and detects false acknowledgement',async()=>{
 const f=receiptFixture();
 await assert.rejects(()=>persistNPCReviewReceipt({...f,storage:{...f.storage,compareAndSwap:async()=>false}}),/Concurrent/);
 await assert.rejects(()=>persistNPCReviewReceipt({...f,storage:{...f.storage,compareAndSwap:async()=>true}}),/readback mismatch/);
 assert.equal(f.writes(),0);
});
test('ledger rejects fabricated metadata and conflicting retry',async()=>{
 const f=receiptFixture();
 const out=await persistNPCReviewReceipt(f);
 assert.throws(()=>encodeNPCReviewLedger({...out.ledger,privateNarration:'not allowed'}),/sidecar metadata/);
 assert.throws(()=>encodeNPCReviewLedger({...out.ledger,lastReviewedAt:{'NPC-100':9}}),/sidecar metadata/);
 await assert.rejects(()=>persistNPCReviewReceipt({...f,receipt:{...f.receipt,reviewedActorIds:[]},verifyReceipt:async()=>true}),/Conflicting receipt/);
 assert.equal(f.writes(),1);
});
