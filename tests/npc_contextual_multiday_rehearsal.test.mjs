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
