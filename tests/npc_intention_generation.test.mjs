// The external generator is simulated by an injected test callback. This
// does NOT prove an LLM can pick good intents; it proves the model-facing
// contract, changing contexts, provenance, abstention and staging safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {prepareNPCIntentionRequests,inspectNPCGeneratedIntention,
 draftOutcomeFromNPCIntention} from '../tools/npc_intention_generation.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {playerVisibleDiagnostic,inspectLivingWorld} from '../tools/living_world_diagnostics.mjs';

const originals=Object.fromEntries(savePaths('CH-000').map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline=()=>decodeFiveFiles(originals,'CH-000');
const head='d'.repeat(40);
const initial=(snapshot,actorId)=>{
 const result=prepareNPCIntentionRequests({
  snapshot,actorIds:[actorId],elapsedMinutes:25});
 assert.equal(result.requests.length,1);
 return result.requests[0];
};
const propose=(r,intention,sourceEventIds=[])=>({
 actorId:r.actorId,decision:'act',intention,
 reasoning:'The action is a possible response to the actor own recorded goal and available evidence; no result is assumed.',
 sourceEventIds});
const turn=n=>({key:'synthetic-npc-generated-'+n,
 intent:'[SYNTHETIC QA] Player does not direct offscreen actors.',
 outcome:'An ordinary interval passes without revealing NPC secrets.',
 player_text:'[SYNTHETIC QA] Jack stays at the workbench.',
 narration_messages:['[SYNTHETIC QA] No offscreen secrets reach Jack.'],
 elapsed_days:0,elapsed_minutes:25,next_time_of_day:'morning'});

test('separate actors receive private open-ended generation requests without menus',()=>{
 const s=baseline(),before=JSON.stringify(s);
 const all=prepareNPCIntentionRequests({snapshot:s,elapsedMinutes:25});
 const noah=all.requests.find(x=>x.actorId==='NPC-006');
 const rosa=all.requests.find(x=>x.actorId==='NPC-005');
 assert.ok(noah&&rosa);
 assert.notEqual(noah.evidence.goal,rosa.evidence.goal);
 assert.notDeepEqual(noah.evidence.resources,rosa.evidence.resources);
 assert.equal(all.actionsPerformed,0);
 assert.equal(Object.hasOwn(noah,'routineMenu'),false);
 assert.equal(noah.evidence.knownEventIds.length,0);
 assert.deepEqual(noah.evidence.knownEvents,[]);
 assert.ok(Array.isArray(noah.evidence.plans));
 assert.ok(rosa.evidence.knownEventIds.includes('EV-000029'));
 assert.ok(rosa.evidence.knownEvents.some(e=>e.id==='EV-000029'&&
  e.outcome.includes('despertador reparado')));
 assert.ok(rosa.evidence.knownEvents.every(e=>
  rosa.evidence.knownEventIds.includes(e.id)));
 const darius=all.requests.find(x=>x.actorId==='NPC-003');
 assert.ok(darius);
 assert.ok(!darius.evidence.knownEvents.some(e=>e.id==='EV-000029'));
 assert.ok(!JSON.stringify(darius.evidence).includes('despertador reparado'));
 assert.equal(JSON.stringify(s),before);
 const report=inspectLivingWorld({snapshot:s,elapsedMinutes:25});
 assert.equal(playerVisibleDiagnostic(report).openNPCIntentionRequests,undefined);
});

test('different model-authored intentions can be reviewed without fixed action type',()=>{
 const s=baseline(),r=initial(s,'NPC-006');
 const a=inspectNPCGeneratedIntention({snapshot:s,request:r,
  proposal:propose(r,
   'Noah checks a discrepancy in his existing parts records before ordering supplies.')});
 const b=inspectNPCGeneratedIntention({snapshot:s,request:r,
  proposal:propose(r,
   'Noah reconsiders his customer service priorities after reviewing his shop reputation.')});
 assert.notEqual(a.intention,b.intention);
 assert.equal(a.actionPerformed,false);
 assert.equal(b.createdEvent,false);
 assert.equal(a.status,'requires_current_turn_causal_adjudication');
});

test('plan change changes next generated request; the provider must reconsider instead of repeating an older script',()=>{
 const s=baseline(),r=initial(s,'NPC-006');
 const first=propose(r,
  'Noah decides to review his current parts ledger before accepting new supplier terms.');
 const newPlan='Review missing part records before any new supplier arrangement.';
 const draft=draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:first,reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Noah updates his private parts review priority; no sale or shipment occurs.',
  changes:[{field:'independent_plan',before:r.evidence.independentPlan,after:newPlan}]});
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('step-one'),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.state.world.actors['NPC-006'].independent_plan,newPlan);
 const reread=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
 assert.equal(verifyNarrativeSnapshot(reread),true);
 const next=initial(reread,'NPC-006');
 assert.notEqual(next.evidence.independentPlan,r.evidence.independentPlan);
 assert.equal(next.evidence.independentPlan,newPlan);
 assert.equal(next.evidence.previousResult.eventId,staged.events.events.at(-1).id);
 assert.ok(next.evidence.knownEvents.some(e=>e.id===staged.events.events.at(-1).id&&
  e.outcome.includes('Noah updates his private parts review priority')));
 assert.throws(()=>inspectNPCGeneratedIntention({snapshot:reread,request:r,
  proposal:first}),/Stale or altered/);
 const revision=propose(next,
  'After checking his earlier records, Noah decides whether he should postpone a new order.',
  [next.evidence.previousResult.eventId]);
 const checked=inspectNPCGeneratedIntention({
  snapshot:reread,request:next,proposal:revision});
 assert.deepEqual(checked.sourceEventIds,[staged.events.events.at(-1).id]);
 assert.equal(checked.actionPerformed,false);
 assert.equal(reread.state.player.location_id,s.state.player.location_id);
});

test('forged knowledge and premature claims of successful action are rejected',()=>{
 const s=baseline(),r=initial(s,'NPC-003');
 assert.throws(()=>inspectNPCGeneratedIntention({snapshot:s,request:r,
  proposal:propose(r,
   'Darius assumes an unknown police investigation is already known to him.',
   ['EV-000029'])}),/not known by its actor/);
 assert.throws(()=>inspectNPCGeneratedIntention({snapshot:s,request:r,
  proposal:{...propose(r,'Darius contemplates a previously unrecorded delivery.'),
   outcome:'The parcel is delivered and accepted.'}}),/cannot predeclare outcome/);
 assert.throws(()=>inspectNPCGeneratedIntention({snapshot:s,request:r,
  proposal:{...propose(r,'Darius walks toward the unidentified school location.'),
   destinationId:'LOC-SCHOOL-UNKNOWN'}}),/existing admitted location/);
});

test('provider may choose inactivity; it never fabricates a compulsory routine event',()=>{
 const s=baseline(),r=initial(s,'NPC-007');
 const abstain=inspectNPCGeneratedIntention({snapshot:s,request:r,proposal:{
  actorId:r.actorId,decision:'abstain',
  reasoning:'The saved cafe shift was a past event; present availability is unknown and cannot be inferred.'}});
 assert.equal(abstain.chosenAction,null);
 assert.equal(abstain.createdEvent,false);
 assert.throws(()=>draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:{actorId:r.actorId,decision:'abstain',
   reasoning:'The present schedule is unknown and no new activity should be assumed.'},
  outcome:'Any invented action is invalid.',reviewed:true}),
  /No action can be staged for abstention/);
});

test('one selected model intention still requires narrative review, and no duplicate resolution per turn',()=>{
 const s=baseline(),r=initial(s,'NPC-005');
 const p=propose(r,
  'Rosa chooses to organize the repaired household item without assuming the neighbor arrived.',
  ['EV-000029']);
 assert.throws(()=>draftOutcomeFromNPCIntention({
  snapshot:s,request:r,proposal:p,outcome:'No unreviewed outcome may pass.'}),
  /separate editorial review/);
 const draft=draftOutcomeFromNPCIntention({snapshot:s,request:r,proposal:p,
  outcome:'SYNTHETIC PRIVATE: Rosa considers the completed repair and leaves the handover pending.',
  reviewed:true});
 assert.throws(()=>stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('double'),npcResolutions:[draft,draft]}),
  /Multiple outcomes for one NPC/);
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('one'),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.events.events.at(-1).actor_ids[0],'NPC-005');
 assert.ok(!staged.chapter.includes('SYNTHETIC PRIVATE:'));
 assert.ok(staged.transcript.entries.every(x=>!x.text.includes('SYNTHETIC PRIVATE:')));
 for(const [path,bytes] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
});


test('a new goal-led action after a previous result need not invent causal event linkage',()=>{
 const s=baseline(),r=initial(s,'NPC-005');
 assert.equal(r.evidence.previousResult.eventId,'EV-000029');
 const fresh=propose(r,
  'Rosa considers an ordinary personal activity unrelated to the completed clock repair.');
 const decision=draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:fresh,reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Rosa arranges an independent household priority without fictional meetings.'});
 assert.equal(Object.hasOwn(decision,'continuation_context'),false);
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('unrelated-new-intent'),npcResolutions:[decision]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.deepEqual(staged.events.events.at(-1).caused_by,[]);
 assert.equal(staged.events.events.at(-1).actor_ids[0],'NPC-005');
});

test('the cited older known source is preserved instead of silently forcing latest event',()=>{
 const s=baseline(),r=initial(s,'NPC-005');
 assert.ok(r.evidence.knownEventIds.includes('EV-000025'));
 const alternate=propose(r,
  'Rosa privately considers how her previously known family morning plans affect today household priorities.',
  ['EV-000025']);
 const draft=draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:alternate,reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Rosa considers a separate personal priority without moving Jack.'});
 assert.deepEqual(draft.continuation_context.source_event_ids,['EV-000025']);
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('older-owned-source'),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.deepEqual(staged.events.events.at(-1).caused_by,['EV-000025']);
 assert.ok(!staged.transcript.entries.some(x=>x.text.includes('SYNTHETIC PRIVATE:')));
});


test('generated NPC requests do not launder another actor event detail via known_to',()=>{
 const request=prepareNPCIntentionRequests({snapshot:baseline,actorIds:['NPC-005'],
  elapsedMinutes:15}).requests[0];
 assert.equal(request.actorId,'NPC-005');
 assert.ok(request.evidence.knownEventIds.includes('EV-000025'));
 const indirect=request.evidence.knownEvents.find(e=>e.id==='EV-000025');
 assert.ok(indirect);
 assert.equal(indirect.detailScope,'known_to_reference_only');
 assert.equal(indirect.outcome,null);
 assert.equal(indirect.intent,null);
 assert.ok(!JSON.stringify(indirect).includes('registros financieros'));
 const owned=request.evidence.knownEvents.find(e=>e.id==='EV-000029');
 assert.ok(owned?.outcome.includes('despertador reparado'));
});
