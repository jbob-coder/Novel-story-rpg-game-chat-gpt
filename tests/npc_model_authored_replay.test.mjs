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

// Node assertion diffs print actual and expected values. Source-bound NPC
// snapshots, actor IDs, causality and save files are narrator-private even on
// *failure*. Use a boolean assertion with a fixed diagnostic instead.
const assertPrivateEqual=(actual,expected,diagnostic)=>{
 assert.ok(actual===expected,diagnostic);
};
const assertPrivateDeepEqual=(actual,expected,diagnostic)=>{
 assert.ok(JSON.stringify(actual)===JSON.stringify(expected),diagnostic);
};
const interval={elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'};

/**
 * CI outputs are often more widely accessible than narrator-private evidence.
 * Emit only explicit nonsemantic counters and opaque digests. In particular,
 * goals, plans, known-event IDs, actors and individual decisions are private.
 * A reviewer must retrieve the next exact request via authorized source access,
 * never reverse-engineer it from public test logs.
 */
const publicNextSummary=(request,completedResponses)=>({
 requestSha256:hash(request),
 completedResponses,targetResponses:30,
 syntheticCompletedTurn:request.checkpoint.completedTurn
});
// Never publish a hash of a low-entropy actor/decision list: known actor
// order and small choice space permit brute-force reconstruction. Even
// aggregate act/abstain totals leak the newly appended actor's decision by
// differencing consecutive CI runs. Only progress and fixed QA flags are public.
const publicReplaySummary=decisions=>({
 completedResponses:decisions.length,targetResponses:30,
 realPlayerTurns:0,canonicalSaveWrites:0,modelInvocationByEngine:false,
 independentNarrativeQualityEstablished:false
});

// Structural assessment is calculated locally and kept in memory, never sent
// to CI logs. Counts describe typed saved effects, not whether an actor's
// original intention was narratively convincing, truthful or useful.
const privateReplayEvidence=(decisions,confirmedActions)=>{
 const acts=decisions.filter(x=>x.decision==='act').length;
 const idle=decisions.filter(x=>x.decision==='abstain').length;
 const fields=confirmedActions.flatMap(x=>x.materialFields);
 const knownFields=new Set(['independent_plan','knowledge','resources']);
 return {
  responses:decisions.length,acts,abstentions:idle,
  confirmedActionRecords:confirmedActions.length,
  actionsWithCitedEvents:confirmedActions.filter(x=>x.sourceCount>0).length,
  actionsWithoutMaterialChange:confirmedActions.filter(x=>x.materialFields.length===0).length,
  planChanges:fields.filter(x=>x==='independent_plan').length,
  knowledgeChanges:fields.filter(x=>x==='knowledge').length,
  resourceChanges:fields.filter(x=>x==='resources').length,
  otherMaterialChanges:fields.filter(x=>!knownFields.has(x)).length,
  // A typed effect is not evidence that an autonomous world was simulated.
  semanticQualityEstablished:false
 };
};
/**
 * The trace is a durable QA fixture, not an unfiltered prompt transcript.
 * Unknown fields (especially nested private request/evidence) must not be
 * accepted silently, even though the replay engine currently ignores them.
 * Fail with generic errors: CI must never echo rejected private payloads.
 */
const assertCleanTraceResponse=response=>{
 const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 assert.ok(record(response)&&record(response.proposal),
  'Malformed NPC response record');
 const proposal=response.proposal,acting=proposal.decision==='act';
 assert.ok(acting||proposal.decision==='abstain',
  'Unsupported NPC decision in external trace');
 const top=acting?
  ['requestSha256','author','proposal','reviewed','outcome','changes']:
  ['requestSha256','author','proposal'];
 const inner=acting?
  ['actorId','decision','intention','reasoning','sourceEventIds','destinationId']:
  ['actorId','decision','reasoning'];
 assert.ok(Object.keys(response).every(key=>top.includes(key)),
  'Unsupported external trace response field');
 assert.ok(Object.keys(proposal).every(key=>inner.includes(key)),
  'Unsupported external trace proposal field');
 assert.ok(/^[a-f0-9]{64}$/.test(response.requestSha256??''),
  'Invalid request digest in external trace');
 assert.ok(typeof response.author==='string'&&
  response.author.trim().length>=1&&response.author.length<=160,
  'Missing or oversized trace reviewer attribution');
 if(acting){
  assert.ok(response.reviewed===true&&typeof response.outcome==='string'&&
   response.outcome.trim().length>=12&&response.outcome.length<=2000,
   'Externally authored action needs a bounded reviewed outcome');
  assert.ok(response.changes===undefined||
   (Array.isArray(response.changes)&&response.changes.length<=40),
   'Invalid NPC trace change list');
 }else{
  assert.ok(!Object.hasOwn(response,'reviewed')&&
   !Object.hasOwn(response,'changes')&&
   !Object.hasOwn(response,'outcome'),
   'An abstention cannot carry an NPC action or effects');
 }
};
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
 const decisions=[],confirmedActions=[];
 for(const [i,response] of trace.responses.entries()){
  assertCleanTraceResponse(response);
  const request=nextRequest(snapshot,i);
  assert.ok(request);
  assertPrivateEqual(response.requestSha256,hash(request),'NPC response request binding failed');
  assertPrivateEqual(response.proposal.actorId,request.actorId,'NPC response actor binding failed');
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
  assertPrivateEqual(JSON.stringify(snapshot),before,'NPC staging mutated private input snapshot');
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,10+i);
  assert.equal(staged.manifest.last_event_sequence-snapshot.manifest.last_event_sequence,action?2:1);
  assert.equal(staged.npcTurnReview.createdCanonicalSave,false);
  assertPrivateEqual(JSON.stringify(staged.state.player),player,'Synthetic replay modified original player');
  if(action){
   const e=staged.events.events.at(-1);
   assertPrivateDeepEqual(e.actor_ids,[request.actorId],'NPC event actor ownership failed');
   assertPrivateDeepEqual(e.caused_by,response.proposal.sourceEventIds??[],'NPC event causal provenance failed');
   assert.ok(!staged.chapter.includes(response.outcome));
   assert.ok(staged.transcript.entries.every(x=>!x.text.includes(response.outcome)));
   confirmedActions.push({
    sourceCount:e.caused_by?.length??0,
    materialFields:e.state_changes.filter(c=>c.field!=='last_resolved_action')
     .map(c=>c.field)
   });
  }
  snapshot=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
  assert.equal(verifyNarrativeSnapshot(snapshot),true);
  assertPrivateEqual(JSON.stringify(snapshot.state.player),player,'Synthetic replay modified original player on readback');
  decisions.push({actorId:request.actorId,decision:response.proposal.decision,legacyCandidateCount:legacy.length});
 }
 const privateMetrics=privateReplayEvidence(decisions,confirmedActions);
 assert.equal(privateMetrics.responses,trace.responses.length);
 assert.equal(privateMetrics.acts+privateMetrics.abstentions,trace.responses.length);
 assert.equal(privateMetrics.confirmedActionRecords,privateMetrics.acts);
 assert.equal(privateMetrics.semanticQualityEstablished,false);
 for(const p of paths)assertPrivateEqual(read(p),original[p],
  'Canonical save fixture changed during synthetic replay');
 const next=trace.responses.length<30?nextRequest(snapshot,trace.responses.length):null;
 if(next){
  assert.ok(next);
  // Public CI: no raw knowledge, event text, relationships or full private request.
  console.log('NPC_MODEL_NEXT '+JSON.stringify(publicNextSummary(next,trace.responses.length)));
 }
 console.log('NPC_MODEL_REPLAY '+JSON.stringify(publicReplaySummary(decisions)));
});

test('CI next-request and replay summaries never expose narrator-private actor evidence',()=>{
 const privateMarker='PRIVATE-NPC-ACTOR-AND-MEMORY-QA-SENTINEL';
 const next={
  actorId:privateMarker,
  checkpoint:{completedTurn:21,chapterId:'SYNTHETIC',lastEventSequence:101},
  evidence:{goal:privateMarker,independentPlan:privateMarker,
   knowledge:[privateMarker],knownEventIds:[privateMarker],
   knownEvents:[{id:privateMarker,outcome:privateMarker}]}
 };
 const actions=[{actorId:privateMarker,decision:'act',legacyCandidateCount:2},
  {actorId:privateMarker,decision:'abstain',legacyCandidateCount:0}];
 const metadata=publicNextSummary(next,2);
 const summary=publicReplaySummary(actions);
 assert.deepEqual(Object.keys(metadata),[
  'requestSha256','completedResponses','targetResponses','syntheticCompletedTurn']);
 assert.deepEqual(Object.keys(summary),[
  'completedResponses','targetResponses','realPlayerTurns','canonicalSaveWrites',
  'modelInvocationByEngine','independentNarrativeQualityEstablished']);
 assert.equal(metadata.requestSha256,hash(next));
 assert.equal(summary.completedResponses,2);
 assert.equal(summary.targetResponses,30);
 const privateMetrics=privateReplayEvidence(actions,[
  {sourceCount:2,materialFields:['independent_plan','knowledge']}
 ]);
 assert.deepEqual(privateMetrics,{
  responses:2,acts:1,abstentions:1,confirmedActionRecords:1,
  actionsWithCitedEvents:1,actionsWithoutMaterialChange:0,
  planChanges:1,knowledgeChanges:1,resourceChanges:0,
  otherMaterialChanges:0,semanticQualityEstablished:false
 });
 assert.equal(metadata.syntheticCompletedTurn,21);
 for(const entry of [metadata,summary]){
  const publicText=JSON.stringify(entry);
  assert.ok(!publicText.includes(privateMarker));
  for(const field of ['actorId','goal','independentPlan','knowledge',
   'knownEventIds','knownEvents','previousEventId','intent','outcome',
   'decisions','sourceEventIds','relationships']){
   assert.ok(!Object.hasOwn(entry,field),'Unexpected private log field: '+field);
  }
 }
});

test('public progress cannot reveal individual choices by hashing or incremental totals',()=>{
 const secret='SYNTHETIC-PRIVATE-CHOICE-NEVER-LOGGED';
 const a=[{actorId:secret,decision:'act',legacyCandidateCount:1}];
 const b=[{actorId:secret,decision:'abstain',legacyCandidateCount:1}];
 const first=publicReplaySummary(a),second=publicReplaySummary(b);
 assert.deepEqual(first,second);
 assert.equal(JSON.stringify(first).includes(secret),false);
 for(const key of ['decisions','actorIds','actionCount','abstentionCount',
   'selectorComparedCount','privateDecisionsSha256','privateEvidence']){
  assert.ok(!Object.hasOwn(first,key),'Private decision metadata in CI output');
 }
 const expanded=publicReplaySummary([...a,...b]);
 assert.equal(expanded.completedResponses,2);
 assert.equal(expanded.targetResponses,30);
});

test('private replay assessment separates saved typed effects from creative quality',()=>{
 const decisions=[
  {actorId:'NPC-001',decision:'act',legacyCandidateCount:1},
  {actorId:'NPC-005',decision:'abstain',legacyCandidateCount:0},
  {actorId:'NPC-006',decision:'act',legacyCandidateCount:1}
 ];
 const measured=privateReplayEvidence(decisions,[
  {sourceCount:1,materialFields:['independent_plan','knowledge','resources','relationship']},
  {sourceCount:0,materialFields:[]}
 ]);
 assert.deepEqual(measured,{
  responses:3,acts:2,abstentions:1,confirmedActionRecords:2,
  actionsWithCitedEvents:1,actionsWithoutMaterialChange:1,
  planChanges:1,knowledgeChanges:1,resourceChanges:1,
  otherMaterialChanges:1,semanticQualityEstablished:false
 });
 assert.equal(JSON.stringify(publicReplaySummary(decisions)).includes('relationship'),false);
});
test('external trace rejects hidden private packets and unreviewed extra fields without logging them',()=>{
 const sealed='SYNTHETIC-HIDDEN-PRIVATE-PACKET-SHOULD-NOT-APPEAR-IN-ERROR';
 const goodAction={
  requestSha256:'f'.repeat(64),
  author:'SYNTHETIC external QA author',
  proposal:{actorId:'NPC-005',decision:'act',
   intention:'Rosa checks the original repair notes before deciding what to do next.',
   reasoning:'Her independently documented household objective requires verifying the old result.',
   sourceEventIds:[]},
  reviewed:true,outcome:'SYNTHETIC: Rosa considers a documented repair precaution.',
  changes:[]
 };
 const goodAbstention={
  requestSha256:'f'.repeat(64),author:'SYNTHETIC external QA author',
  proposal:{actorId:'NPC-007',decision:'abstain',
   reasoning:'An unverified shift should not be invented without new evidence.'}
 };
 assert.doesNotThrow(()=>assertCleanTraceResponse(goodAction));
 assert.doesNotThrow(()=>assertCleanTraceResponse(goodAbstention));
 const additions=[
  {...goodAction,request:{evidence:{knowledge:[sealed]}}},
  {...goodAction,context:{secrets:[sealed]}},
  {...goodAction,privateEvidence:sealed},
  {...goodAction,proposal:{...goodAction.proposal,fullRequest:sealed}},
  {...goodAction,proposal:{...goodAction.proposal,privateKnowledge:sealed}},
  {...goodAbstention,changes:[{field:'knowledge',fact:sealed}]},
  {...goodAbstention,proposal:{...goodAbstention.proposal,outcome:sealed}},
  {...goodAction,requestSha256:'not-a-digest'},
  {...goodAction,author:sealed.repeat(12)}
 ];
 for(const response of additions){
  let message=null;
  try{assertCleanTraceResponse(response);}catch(error){message=String(error.message);}
  assert.ok(message,'Unexpected acceptance of malformed external trace');
  assert.ok(!message.includes(sealed),
   'Failure message must not copy rejected private trace content into CI');
 }
});

test('private assertion failures never include actor, causal history or save contents',()=>{
 const secrets=[
  'PRIVATE-LOCATION-AND-ACTOR-SENTINEL',
  'PRIVATE-CAUSAL-EVENT-DETAIL-SENTINEL',
  'PRIVATE-CANONICAL-SAVE-TEXT-SENTINEL'
 ];
 for(const secret of secrets){
  for(const run of [
   ()=>assertPrivateEqual(secret,'unrelated','Private actor comparison mismatch'),
   ()=>assertPrivateDeepEqual([{source:secret}],[{source:'other'}],
    'Private causal comparison mismatch'),
   ()=>assertPrivateEqual(JSON.stringify({state:{knowledge:[secret]}}),
    JSON.stringify({state:{knowledge:[]}}),'Canonical save comparison mismatch')
  ]){
   let thrown;
   try{run();}catch(error){thrown=error;}
   assert.ok(thrown,'A private mismatch must fail');
   const emitted=String(thrown.stack??thrown);
   assert.ok(!emitted.includes(secret),
    'Private assertion exception must not expose actual input value');
   assert.ok(!emitted.includes('source:')&&!emitted.includes('knowledge:'),
    'Private assertion exception must not include structured private fields');
  }
 }
});
