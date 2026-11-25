// QA only: externally authored sequential replay, never a model substitute.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {prepareNPCIntentionRequests,stageReviewedNPCIntentionTurn}
 from '../tools/npc_intention_generation.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const paths=savePaths('CH-000');
const original=Object.fromEntries(paths.map(p=>[p,read(p)]));
const trace=JSON.parse(read('tests/npc_model_authored_trace.json'));
const actors=['NPC-006','NPC-005','NPC-003','NPC-001','NPC-002','NPC-004','NPC-007'];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const interval={elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'};
const turn=i=>({
 key:'SYNTHETIC-MODEL-QA-'+String(i).padStart(2,'0'),
 intent:'[SYNTHETIC QA] No player-initiated NPC task.',
 outcome:'A fictional test interval passes without disclosing private NPC information.',
 player_text:'[SYNTHETIC QA] Jack does not direct NPC decisions.',
 narration_messages:['[SYNTHETIC QA] No confidential NPC outcome is disclosed.'],
 elapsed_days:0,elapsed_minutes:10,next_time_of_day:'morning'
});
const nextRequest=(snapshot,i)=>prepareNPCIntentionRequests({
 snapshot,actorIds:[actors[i%actors.length]],...interval,limit:1
}).requests[0];

test('sequential external model trace replays only responses bound to freshly verified requests',()=>{
 assert.equal(trace.version,1);
 assert.ok(Array.isArray(trace.responses)&&trace.responses.length<=30);
 let snapshot=decodeFiveFiles(original,'CH-000');
 assert.equal(snapshot.manifest.last_completed_turn,9);
 const player=JSON.stringify(snapshot.state.player);
 const decisions=[];
 for(const [i,response] of trace.responses.entries()){
  const request=nextRequest(snapshot,i);
  assert.ok(request);
  assert.equal(response.requestSha256,hash(request),'Response is not bound to current request');
  assert.equal(response.proposal.actorId,request.actorId);
  assert.equal(typeof response.author,'string');
  assert.ok(response.author.trim().length>0);
  const action=response.proposal.decision==='act';
  const legacy=recommendNPCIntentReviews({state:snapshot.state,
   actorIds:[request.actorId],...interval});
  const choice={request,proposal:response.proposal};
  if(action){
   assert.equal(response.reviewed,true);
   choice.reviewed=true;choice.outcome=response.outcome;choice.changes=response.changes??[];
  }else{
   assert.equal(response.proposal.decision,'abstain');
   for(const key of ['reviewed','outcome','changes'])assert.ok(!(key in response));
  }
  const before=JSON.stringify(snapshot);
  const staged=stageReviewedNPCIntentionTurn({snapshot,observedHead:'a'.repeat(40),
   turn:turn(i+1),choices:[choice]});
  assert.equal(JSON.stringify(snapshot),before);
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,10+i);
  assert.equal(staged.manifest.last_event_sequence-snapshot.manifest.last_event_sequence,action?2:1);
  assert.equal(staged.npcTurnReview.createdCanonicalSave,false);
  assert.equal(JSON.stringify(staged.state.player),player);
  if(action){
   const e=staged.events.events.at(-1);
   assert.deepEqual(e.actor_ids,[request.actorId]);
   assert.deepEqual(e.caused_by,response.proposal.sourceEventIds??[]);
   assert.ok(!staged.chapter.includes(response.outcome));
   assert.ok(staged.transcript.entries.every(x=>!x.text.includes(response.outcome)));
  }
  snapshot=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
  assert.equal(verifyNarrativeSnapshot(snapshot),true);
  assert.equal(JSON.stringify(snapshot.state.player),player);
  decisions.push({actorId:request.actorId,decision:response.proposal.decision,legacyCandidateCount:legacy.length});
 }
 for(const p of paths)assert.equal(read(p),original[p]);
 const next=trace.responses.length<30?nextRequest(snapshot,trace.responses.length):null;
 if(next){
  assert.ok(next);
  // Public CI: no raw knowledge, event text, relationships or full private request.
  console.log('NPC_MODEL_NEXT '+JSON.stringify({requestSha256:hash(next),
   actorId:next.actorId,checkpoint:next.checkpoint,
   goal:next.evidence.goal,independentPlan:next.evidence.independentPlan,
   previousEventId:next.evidence.previousResult?.eventId??null,
   knownEventIds:next.evidence.knownEventIds,
   recentEventIds:next.evidence.knownEvents.map(x=>x.id)}));
 }
 console.log('NPC_MODEL_REPLAY '+JSON.stringify({responses:decisions.length,decisions,
  realPlayerTurns:0,canonicalSaveWrites:0,modelInvocationByEngine:false,
  independentNarrativeQualityEstablished:false}));
});
