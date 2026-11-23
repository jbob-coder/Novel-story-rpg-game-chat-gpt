// QA-only synthetic in-memory story days; NEVER an unattended engine or a real player input.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';
import {inspectNPCContextualChoices,reviewNPCFreeformIntent}
 from '../tools/npc_contextual_intents.mjs';
import {draftReviewedNPCCausalContinuation,
  verifyNPCCausalContinuationHistory} from '../tools/living_world_causal_continuations.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {buildContextPacket} from '../tools/context_manager.mjs';

const originalFiles=Object.fromEntries(savePaths('CH-000').map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline=()=>decodeFiveFiles(originalFiles,'CH-000');
const observedHead='a'.repeat(40);
const reason='A reviewer compares the actor-owned recent event with the saved goal, memory and current circumstances.';

// All action texts are editorially authored TEST INPUTS; the code does not
// generate or autonomously choose any of them.
const days=[
 {actor:'NPC-005',intent:'Review a safe way to coordinate the clock return without assuming the neighbor is present.',
  other:'Choose to postpone speaking to the neighbor until actual contact becomes possible.'},
 {actor:'NPC-003',intent:'Privately reconsider the courier task without claiming the parcel was delivered.',
  other:'Avoid an unsupported delivery and review the unresolved address instead.'},
 {actor:'NPC-004',intent:'Recheck the presentation materials without assuming arrival at the unmapped school.',
  other:'Privately prioritize the art project before attempting another school journey.'},
 {actor:'NPC-002',intent:'Review the recorded maintenance anomaly without declaring any new failure.',
  other:'Defer the technical follow-up pending independently observed evidence.'},
 {actor:'NPC-007',intent:'Consider how to document the old register issue without asserting a new shift.',
  other:'Keep a private note to reconsider ordinary cafe records at the next established shift.'},
 {actor:'NPC-001',intent:'Review the already recorded dispatch disruption without inventing new service delays.',
  other:'Defer operational conclusions until an actual staff report is available.'},
 {actor:'NPC-005',intent:'Reconsider the repaired clock handover in light of previous private planning.',
  other:'Keep the earlier task open rather than fabricating a successful handover.'}
];
const review=(snapshot,context,intention,sourceId)=>reviewNPCFreeformIntent({
 snapshot,context,intention,reasoning:reason,sourceEventIds:[sourceId],reviewed:true});
const qaTurn=i=>({
 key:'synthetic-contextual-multiday-'+String(i+1).padStart(2,'0'),
 intent:'SYNTHETIC QA ONLY: no authentic player decision or offscreen directive.',
 outcome:'The synthetic comparison advances fictional test time without player intervention.',
 player_text:'[SYNTHETIC QA ONLY] Observe an ordinary day without intervention.',
 narration_messages:['[SYNTHETIC QA] Jack is not told private NPC outcomes.'],
 elapsed_days:1,elapsed_minutes:1440,next_time_of_day:'morning'
});

function scenario(){
 let snapshot=baseline();
 const before=JSON.stringify(snapshot),basePlayer=JSON.stringify(snapshot.state.player);
 const observations=[],syntheticPrivate=[];
 for(let index=0;index<days.length;index++){
  const {actor,intent,other}=days[index];
  const knownSource=allEvents(snapshot).filter(event=>
   event.turn<=snapshot.manifest.last_completed_turn&&
   event.known_to?.includes(actor)).at(-1);
  assert.ok(knownSource,'Missing actor-owned knowledge source '+actor);
  const context=inspectNPCContextualChoices({snapshot,actorId:actor});
  assert.ok(context.evidence.knownEventIds.includes(knownSource.id));
  const legacy=recommendNPCIntentReviews({
   state:snapshot.state,actorIds:[actor],elapsedDays:1,
   elapsedMinutes:1440,nextPeriod:'morning'});
  assert.ok(legacy.length<=1);
  const one=review(snapshot,context,intent,knownSource.id);
  const two=review(snapshot,context,other,knownSource.id);
  assert.notEqual(one.intention,two.intention);
  assert.equal(one.actionPerformed,false);
  assert.equal(two.actionPerformed,false);
  const privateOutcome='SYNTHETIC PRIVATE NPC MULTIDAY '+(index+1)+': '+intent;
  const causal=draftReviewedNPCCausalContinuation({
    snapshot,actorId:actor,sourceEventIds:one.sourceEventIds,
    reasoning:one.reasoning,outcome:privateOutcome,reviewed:true,changes:[]});
  const staged=stageLivingWorldTurn({
   snapshot,observedHead,turn:qaTurn(index),npcResolutions:[causal]});
  const e=staged.events.events.at(-1);
  assert.equal(e.kind,'independent_actor');
  assert.equal(e.actor_ids[0],actor);
  assert.deepEqual(e.caused_by,[knownSource.id]);
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,10+index);
  assert.equal(staged.state.time.day,-28+index);
  assert.deepEqual(staged.state.player,JSON.parse(basePlayer));
  assert.ok(!staged.chapter.includes(privateOutcome));
  assert.ok(staged.transcript.entries.every(t=>!t.text.includes(privateOutcome)));
  const savedBytes=encodeFiveFiles(staged);
  const loaded=decodeFiveFiles(savedBytes,'CH-000');
  assert.equal(verifyNarrativeSnapshot(loaded),true);
  assert.equal(loaded.events.events.at(-1).id,e.id);
  observations.push({day:staged.state.time.day,actor,
   oldSelected:legacy.length,openValidated:2,
   event:e.id,source:knownSource.id,
   previouslyKnown:context.evidence.knownEventIds.length});
  syntheticPrivate.push(privateOutcome);
  snapshot=loaded;
 }
 return {snapshot,observations,syntheticPrivate,before,basePlayer};
}

test('seven consecutive QA days validate causal NPC events and exact checkpoint readback',()=>{
 const result=scenario(),s=result.snapshot;
 assert.equal(s.manifest.last_completed_turn,16);
 assert.equal(s.state.time.day,-22);
 assert.equal(s.manifest.last_event_sequence,43);
 assert.equal(result.observations.length,7);
 assert.equal(verifyNarrativeSnapshot(s),true);
 assert.equal(verifyNPCCausalContinuationHistory(s).length,7);
 assert.equal(JSON.stringify(baseline()),result.before);
 for(const [path,bytes] of Object.entries(originalFiles))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
});

test('comparative measure: routine-first returns <=1 primary; reviewed open preview accepts two',()=>{
 const {observations}=scenario();
 assert.equal(observations.reduce((n,row)=>n+row.openValidated,0),14);
 assert.ok(observations.every(row=>row.oldSelected<=1));
 assert.ok(observations.every(row=>row.previouslyKnown>=1));
 assert.equal(new Set(observations.map(row=>row.event)).size,7);
 // These are editorially authored examples. Valid option coverage is NOT
 // proof of autonomous proposal generation or superior behavior.
 console.log('NPC_CONTEXTUAL_MULTIDAY_QA '+JSON.stringify({
  scenarioDays:7,actors:6,editoriallyWrittenIntentions:14,
  stagedReviewedPrivateEvents:7,sourceBackedEvents:7,
  baselinePrimaryMaximumPerActor:1,
  allProposalTextsAuthoredByReviewer:true,
  automaticDecisions:0,realStoryTurns:0
 }));
});

test('private follow-ups never grant Jack NPC memory or reveal it in reader-visible context',()=>{
 const {snapshot,syntheticPrivate,basePlayer}=scenario();
 assert.equal(JSON.stringify(snapshot.state.player),basePlayer);
 const visible=buildContextPacket({snapshot,audience:'reader_visible',
  query:'NPC MULTIDAY',maxReferences:20});
 assert.ok(visible.references.every(ref=>ref.kind==='transcript'));
 for(const secret of syntheticPrivate){
  assert.ok(!snapshot.chapter.includes(secret));
  assert.ok(!snapshot.transcript.entries.some(x=>x.text.includes(secret)));
  assert.ok(!JSON.stringify(visible).includes(secret));
 }
});

test('a forged late cause cannot survive complete multi-day historical replay',()=>{
 const {snapshot}=scenario();
 const forged=structuredClone(snapshot);
 forged.events.events.at(-1).caused_by=['EV-999999'];
 assert.throws(()=>verifyNarrativeSnapshot(forged));
 const preview=inspectNPCContextualChoices({snapshot,actorId:'NPC-003'});
 const known=allEvents(snapshot).filter(x=>x.actor_ids.includes('NPC-005')&&
  !x.known_to?.includes('NPC-003')).at(-1);
 assert.ok(known);
 assert.throws(()=>review(snapshot,preview,
  'React to the grandmother private action that Darius never heard.',known.id),
  /event it does not know/);
});

test('staging is explicit; no accepted proposal creates an unattended event or hidden time tick',()=>{
 const start=baseline(),ctx=inspectNPCContextualChoices({snapshot:start,actorId:'NPC-005'});
 const source=ctx.evidence.knownEventIds.at(-1);
 const before=JSON.stringify(start);
 for(let i=0;i<40;i++){
  const proposal=review(start,ctx,'Consider whether to defer the existing clock return task.',source);
  assert.equal(proposal.eventCreated,false);
  assert.equal(proposal.timeAdvanced,false);
  assert.equal(proposal.persisted,false);
 }
 assert.equal(JSON.stringify(start),before);
 assert.equal(start.manifest.last_completed_turn,9);
});


// Thirty-turn *structural* stress rehearsal. The callable below is a controlled
// test double, NOT an LLM and NOT evidence of high-quality authored initiative.
// Critically, each proposal is calculated from the newly decoded checkpoint,
// not from a prewritten 30-step event ledger or an old actor context.
const thirtyActorCycle=[
 'NPC-006','NPC-005','NPC-003','NPC-001','NPC-002','NPC-004','NPC-007'
];
const thirtyPolicy={
 'NPC-006':[
  'Audit the existing workshop task notes before considering any new purchase.',
  'Separate uncertain parts requirements from those already described in the records.',
  'Reconsider the ordering priority without assuming a supplier or customer has replied.'
 ],
 'NPC-005':[
  'Keep the already repaired alarm clock distinct from unfinished household work.',
  'Prepare an ordinary handover reminder without assuming the neighbor is present.',
  'Review whether returning the clock still needs actual contact with the neighbor.'
 ],
 'NPC-003':[
  'Check the known parcel obligation without inventing a recipient address.',
  'Keep the delivery deadline visible while the precise destination remains uncertain.',
  'Reassess whether a supported next route exists before making a delivery claim.'
 ],
 'NPC-001':[
  'Separate the recorded transit display fault from unverified service delays.',
  'Reconsider which existing staff report is needed before changing dispatch guidance.',
  'Keep a private dispatch priority note without claiming a new incident.'
 ],
 'NPC-002':[
  'Preserve the unresolved inspection observations in the maintenance notes.',
  'Reconsider the evidence needed before identifying a technical root cause.',
  'Review the existing work order rather than asserting a completed new inspection.'
 ]
};
const thirtyTurn=i=>({
 key:'SYNTHETIC-30-TURN-NPC-CONTINUITY-'+String(i).padStart(2,'0'),
 intent:'[SYNTHETIC QA] No player-initiated NPC task.',
 outcome:'A short fictional test interval passes without releasing private NPC information.',
 player_text:'[SYNTHETIC QA] Jack makes no offscreen NPC decisions.',
 narration_messages:['[SYNTHETIC QA] No confidential NPC outcome is disclosed.'],
 elapsed_days:0,elapsed_minutes:10,next_time_of_day:'morning'
});
function fixtureForCurrentActor(request){
 const {actorId,evidence}=request;
 const options=thirtyPolicy[actorId];
 // No established current school arrival or fresh cafe shift: do not invent one.
 if(!options)return {proposal:{actorId,decision:'abstain',
  reasoning:'No verified present opportunity is available; earlier travel or a past shift cannot establish an unseen new encounter.'},
  outcome:null,changes:[]};
 const priorPlan=evidence.independentPlan;
 const currentIndex=options.indexOf(priorPlan);
 const nextPlan=options[(currentIndex+1)%options.length];
 const prior=evidence.previousResult?.eventId??null;
 const source=prior&&evidence.knownEventIds.includes(prior)?[prior]:[];
 const intention=nextPlan+' The actor treats the attempt as a private current-step choice, not a guaranteed result.';
 const reasoning='This test-double choice follows the actor own recorded goal and current plan, and does not infer another person location, a sale, an encounter or a successful delivery.';
 return {proposal:{actorId,decision:'act',intention,reasoning,sourceEventIds:source},
  outcome:'SYNTHETIC PRIVATE: The actor records a narrower next priority without establishing any offscreen meeting, sale or delivery.',
  changes:[{field:'independent_plan',before:priorPlan,after:nextPlan}]};
}

function thirtyTurnRehearsal(){
 let snapshot=baseline();
 const originalPlayer=JSON.stringify(snapshot.state.player);
 const initialBytes=Object.fromEntries(Object.entries(originalFiles));
 const trace=[],priorRequests=new Map();
 let freshFollowups=0,reviewedActions=0,abstentions=0,planChanges=0;
 for(let index=1;index<=30;index++){
  const actorId=thirtyActorCycle[(index-1)%thirtyActorCycle.length];
  const request=prepareNPCIntentionRequests({snapshot,actorIds:[actorId],
   elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning',limit:1}).requests[0];
  assert.ok(request,'Each selected actor should have a saved goal');
  assert.equal(request.actorId,actorId);
  assert.equal(request.checkpoint.completedTurn,9+index-1);
  assert.ok(request.evidence.knownEvents.every(e=>
   request.evidence.knownEventIds.includes(e.id)));
  assert.ok(request.evidence.knownEvents.length<=8);
  const previous=priorRequests.get(actorId);
  if(previous)assert.notDeepEqual(request.checkpoint,previous.checkpoint);
  if(request.evidence.previousResult){
   const priorId=request.evidence.previousResult.eventId;
   assert.ok(request.evidence.knownEventIds.includes(priorId));
   assert.ok(request.evidence.knownEvents.some(x=>x.id===priorId));
   freshFollowups++;
  }
  const legacy=recommendNPCIntentReviews({state:snapshot.state,
   actorIds:[actorId],elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'});
  assert.ok(legacy.length<=1);
  const chosen=fixtureForCurrentActor(request);
  const isAction=chosen.proposal.decision==='act';
  const choices=[{request,proposal:chosen.proposal,
   ...(isAction?{reviewed:true,outcome:chosen.outcome,changes:chosen.changes}:{})}];
  const eventCountBefore=snapshot.manifest.last_event_sequence;
  const originalSnapshot=JSON.stringify(snapshot);
  const staged=stageReviewedNPCIntentionTurn({
   snapshot,observedHead:observedHead,turn:thirtyTurn(index),choices});
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,9+index);
  assert.equal(staged.manifest.last_event_sequence-eventCountBefore,
   isAction?2:1,'Only player-placeholder event and optionally NPC result');
  assert.equal(staged.npcTurnReview.createdCanonicalSave,false);
  assert.equal(JSON.stringify(snapshot),originalSnapshot);
  assert.equal(JSON.stringify(staged.state.player),originalPlayer);
  if(isAction){
   reviewedActions++;planChanges+=chosen.changes.length;
   const event=staged.events.events.at(-1);
   assert.equal(event.kind,'independent_actor');
   assert.deepEqual(event.actor_ids,[actorId]);
   assert.deepEqual(event.caused_by,chosen.proposal.sourceEventIds);
   assert.equal(staged.state.world.actors[actorId].independent_plan,
    chosen.changes[0].after);
   assert.ok(!staged.chapter.includes(chosen.outcome));
   assert.ok(staged.transcript.entries.every(x=>!x.text.includes(chosen.outcome)));
  }else{
   abstentions++;
   assert.deepEqual(staged.npcTurnReview.abstainedActorIds,[actorId]);
  }
  const reread=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
  assert.equal(verifyNarrativeSnapshot(reread),true);
  assert.equal(JSON.stringify(reread.state.player),originalPlayer);
  trace.push({turn:index,actorId,decision:chosen.proposal.decision,
   verifiedPreviousResult:request.evidence.previousResult?.eventId??null,
   sourceIds:chosen.proposal.sourceEventIds??[],
   beforePlan:request.evidence.independentPlan,
   afterPlan:reread.state.world.actors[actorId].independent_plan,
   baselineSuggestions:legacy.length,
   privateResultSaved:isAction});
  priorRequests.set(actorId,request);
  snapshot=reread;
 }
 for(const [path,bytes] of Object.entries(initialBytes)){
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 }
 return {snapshot,trace,reviewedActions,abstentions,planChanges,freshFollowups};
}

test('thirty consecutive contextual QA turns replay actual saved results without writing Jack save',()=>{
 const x=thirtyTurnRehearsal();
 assert.equal(x.trace.length,30);
 assert.equal(x.snapshot.manifest.last_completed_turn,39);
 assert.equal(x.snapshot.state.time.day,-29);
 assert.equal(x.snapshot.state.time.elapsed_minutes_since_opening_approx,
  baseline().state.time.elapsed_minutes_since_opening_approx+300);
 assert.ok(x.reviewedActions>=20);
 assert.ok(x.abstentions>=6);
 assert.equal(x.reviewedActions+x.abstentions,30);
 assert.equal(x.planChanges,x.reviewedActions);
 assert.ok(x.freshFollowups>=10);
 assert.equal(new Set(x.trace.filter(row=>row.privateResultSaved)
  .map(row=>row.actorId)).size,5);
 // Count is a replay/consistency result; do not equate templates with autonomy.
 console.log('NPC_30_TURN_SYNTHETIC_QA '+JSON.stringify({
  syntheticTurns:30,reviewedActions:x.reviewedActions,
  abstentions:x.abstentions,planChanges:x.planChanges,
  actorOwnedFollowups:x.freshFollowups,
  currentContextReadEveryTurn:true,reloadedAfterEveryTurn:true,
  originalPlayerTurns:0,canonicalSaveWrites:0,
  automaticModelAuthoredIntentions:0,
  narratorAutonomyQualityEstablished:false
 }));
});
