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
import {draftReviewedSocialContact} from '../tools/living_world_social.mjs';
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
 assert.equal(noah.evidence.historicalMemory.totalKnownEventCount,0);
 assert.equal(noah.evidence.historicalMemory.readOnlyRecallAvailable,true);
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
  sourceReviews:[{eventId:'EV-000025',reviewed:true,
   basis:'reference_only_uncertain',
   reason:'Rosa is allowed to investigate the event pointer without claiming another actor private intent.'}],
  outcome:'SYNTHETIC PRIVATE: Rosa considers a separate personal priority without moving Jack.'});
 assert.deepEqual(draft.continuation_context.source_event_ids,['EV-000025']);
 const staged=stageLivingWorldTurn({snapshot:s,observedHead:head,
  turn:turn('older-owned-source'),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.deepEqual(staged.events.events.at(-1).caused_by,['EV-000025']);
 assert.ok(!staged.transcript.entries.some(x=>x.text.includes('SYNTHETIC PRIVATE:')));
});


test('generated NPC requests do not launder another actor event detail via known_to',()=>{
 const request=prepareNPCIntentionRequests({snapshot:baseline(),actorIds:['NPC-005'],
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

 
test('cited shared-event pointers remain reference-only evidence in private intention review',()=>{
 const s=baseline(),r=initial(s,'NPC-005');
 assert.ok(r.evidence.knownEventIds.includes('EV-000025'));
 assert.ok(r.evidence.knownEventIds.includes('EV-000029'));
 const pointer=inspectNPCGeneratedIntention({snapshot:s,request:r,proposal:propose(r,
  'Rosa privately considers how to check a possible report without assuming its private details.',
  ['EV-000025'])});
 assert.deepEqual(pointer.citedEventEvidence,[{
  eventId:'EV-000025',detailScope:'known_to_reference_only',
  actorOwnedFullEventText:false,additionalContentReviewRequired:true
 }]);
 assert.equal(pointer.requiresReferencedContentReview,true);
 assert.equal(pointer.actionPerformed,false);
 assert.equal(pointer.createdEvent,false);
 const owned=inspectNPCGeneratedIntention({snapshot:s,request:r,proposal:propose(r,
  'Rosa considers a safe time to review the already repaired neighbor clock.',
  ['EV-000029'])});
 assert.deepEqual(owned.citedEventEvidence,[{
  eventId:'EV-000029',detailScope:'actor_owned_event',
  actorOwnedFullEventText:true,additionalContentReviewRequired:false
 }]);
 assert.equal(owned.requiresReferencedContentReview,false);
 const independent=inspectNPCGeneratedIntention({snapshot:s,request:r,proposal:propose(r,
  'Rosa reconsiders an ordinary household priority without using any external source.',
  [])});
 assert.deepEqual(independent.citedEventEvidence,[]);
 assert.equal(independent.requiresReferencedContentReview,false);
 assert.equal(JSON.stringify(s),JSON.stringify(baseline()));
});


test('older actor-known events stay citeable after they leave the eight-event prompt window',()=>{
 const authentic=baseline(),original=JSON.stringify(authentic);
 let staged=authentic;
 for(let i=0;i<9;i++){
  staged=stageLivingWorldTurn({snapshot:staged,observedHead:head,
   turn:turn('older-known-event-'+i),
   npcResolutions:[{actor_id:'NPC-005',reviewed:true,resolved:true,
    causal_basis:'SYNTHETIC QA: Rosa quietly reassesses her own existing household priorities.',
    outcome:'SYNTHETIC PRIVATE: Rosa performs a limited reflection without a new delivery.',
    changes:[],disclosures:[]}]
  });
 }
 assert.equal(verifyNarrativeSnapshot(staged),true);
 const request=initial(staged,'NPC-005');
 for(const oldId of ['EV-000025','EV-000029'])
  assert.ok(!request.evidence.knownEventIds.includes(oldId),
   'The compact recent-event preview must no longer contain '+oldId);
 assert.ok(request.evidence.historicalMemory.olderKnownEventCount>=2);
 assert.ok(request.evidence.historicalMemory.olderEventPointers.length<=4);
 assert.ok(request.evidence.historicalMemory.olderEventPointers.every(e=>
  !request.evidence.knownEventIds.includes(e.id)));
 const own=inspectNPCGeneratedIntention({snapshot:staged,request,
  proposal:propose(request,
   'Rosa revisits the earlier repaired clock before considering a future return.',
   ['EV-000029'])});
 assert.deepEqual(own.citedEventEvidence,[{
  eventId:'EV-000029',detailScope:'actor_owned_event',
  actorOwnedFullEventText:true,additionalContentReviewRequired:true,
  outsideRecentContext:true
 }]);
 assert.equal(own.requiresReferencedContentReview,true);
 const thirdParty=inspectNPCGeneratedIntention({snapshot:staged,request,
  proposal:propose(request,
   'Rosa considers a previously known event without assuming Elena private thoughts.',
   ['EV-000025'])});
 assert.deepEqual(thirdParty.citedEventEvidence,[{
  eventId:'EV-000025',detailScope:'known_to_reference_only',
  actorOwnedFullEventText:false,additionalContentReviewRequired:true,
  outsideRecentContext:true
 }]);
 assert.throws(()=>inspectNPCGeneratedIntention({snapshot:staged,request,
  proposal:propose(request,
   'Rosa incorrectly claims details of an unrelated private player event.',
   ['EV-000027'])}),/not known by its actor/);
 const reviewed=draftOutcomeFromNPCIntention({snapshot:staged,request,
  proposal:propose(request,
   'Rosa privately plans to check whether the old clock still needs returning.',
   ['EV-000029']),
  reviewed:true,outcome:'SYNTHETIC PRIVATE: Rosa reviews the old clock, not a confirmed handover.',
  sourceReviews:[{eventId:'EV-000029',reviewed:true,
   basis:'actor_owned_recall',
   reason:'Rosa rechecks her own original saved repair event before drawing conclusions.'}]});
 assert.deepEqual(reviewed.continuation_context.source_event_ids,['EV-000029']);
 const next=stageLivingWorldTurn({snapshot:staged,observedHead:head,
  turn:turn('older-known-event-causal-followup'),npcResolutions:[reviewed]});
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.deepEqual(next.events.events.at(-1).caused_by,['EV-000029']);
 assert.equal(JSON.stringify(authentic),original);
 for(const [path,bytes] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
});


test('source-content adjudication is mandatory for third-party event citations',()=>{
 const s=baseline(),before=JSON.stringify(s),r=initial(s,'NPC-005');
 const p=propose(r,
  'Rosa considers whether an old family event reference warrants further inquiry.',
  ['EV-000025']);
 const make=sourceReviews=>draftOutcomeFromNPCIntention({
  snapshot:s,request:r,proposal:p,reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Rosa plans to ask later but learns nothing new.',
  ...(sourceReviews===undefined?{}:{sourceReviews})
 });
 assert.throws(()=>make(),/Explicit source evidence review required/);
 assert.throws(()=>make([{eventId:'EV-000025',reviewed:true,
  basis:'actor_owned_recall',
  reason:'A shared event reference is not a private actor-owned result.'}]),
  /Third-party reference requires limited-content review/);
 assert.throws(()=>make([{eventId:'EV-000025',reviewed:true,
  basis:'recorded_actor_knowledge',knownEntry:'FORGED SECRET',
  reason:'An invented record must not count as evidence of knowledge.'}]),
  /not actor recorded knowledge/);
 const cautious=make([{eventId:'EV-000025',reviewed:true,
  basis:'reference_only_uncertain',
  reason:'Rosa may investigate the event without assuming Elena private thoughts.'}]);
 assert.deepEqual(cautious.continuation_context.source_event_ids,['EV-000025']);
 assert.ok(r.evidence.knowledge.length>0);
 assert.throws(()=>make([{eventId:'EV-000025',reviewed:true,
  basis:'recorded_actor_knowledge',knownEntry:r.evidence.knowledge[0],
  reason:'An unrelated genuine memory cannot justify claiming the private details of Elena event.'}]),
  /no recorded provenance linking this cited event/);
 assert.equal(JSON.stringify(s),before);
});

test('ordinary owned recent events and independent initiatives need no extra source review',()=>{
 const s=baseline(),r=initial(s,'NPC-005'),original=JSON.stringify(s);
 const recent=propose(r,'Rosa reconsiders what to do with an already repaired clock.',
  ['EV-000029']);
 const reviewed=draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:recent,reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Rosa does not invent a delivery or an appointment.'});
 assert.deepEqual(reviewed.continuation_context.source_event_ids,['EV-000029']);
 const noCause=draftOutcomeFromNPCIntention({snapshot:s,request:r,
  proposal:propose(r,'Rosa reevaluates another existing household priority.'),
  reviewed:true,
  outcome:'SYNTHETIC PRIVATE: An independent plan can change without citing a new event.'});
 assert.equal(Object.hasOwn(noCause,'continuation_context'),false);
 assert.equal(JSON.stringify(s),original);
});


test('socially learned source statement can support a foreign event only with exact event-linked provenance',()=>{
 const saved=baseline(),before=JSON.stringify(saved);
 const rosa='NPC-005',elena='NPC-004';
 const elenaEvidence=saved.state.world.actors[elena].knowledge.find(
  x=>x.includes('EV-000025'));
 assert.ok(elenaEvidence);
 const walk=stageLivingWorldTurn({snapshot:saved,observedHead:head,
  turn:turn('synthetic-rosa-visit'),
  npcResolutions:[{actor_id:rosa,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Rosa decides to walk to the known residential district.',
   outcome:'SYNTHETIC PRIVATE: Rosa reaches the existing residential neighborhood.',
   changes:[{field:'location_id',before:'LOC-WILSON-APARTMENT',
    after:'LOC-RAILGARDEN-RESIDENTIAL',
    route:['LOC-WILSON-APARTMENT','LOC-RAILGARDEN-RESIDENTIAL'],
    travel:{mode:'walk',basis:'SYNTHETIC QA: admitted neighborhood path',
     elapsed_minutes:12}}]}]});
 assert.equal(verifyNarrativeSnapshot(walk),true);
 const social=draftReviewedSocialContact({state:walk.state,reviewed:true,
  interactionId:'SOC-QA-INTENT-ORIGIN-001',
  participantIds:[elena,rosa],
  observation:{kind:'current_turn_observation',
   fact:'SYNTHETIC QA: Rosa and Elena speak privately in their known district.',
   causal_source:'SYNTHETIC QA: independently reviewed direct conversation.',
   observer_actor_id:rosa,confirmed_by_reviewer:true},
  relationshipUpdates:[],
  knowledgeTransfer:{speaker_id:elena,recipient_id:rosa,
   known_entry:elenaEvidence},
  outcomes:{
   [elena]:'SYNTHETIC PRIVATE: Elena reports her own earlier USB preparation.',
   [rosa]:'SYNTHETIC PRIVATE: Rosa hears the report without assuming it must be true.'
  }
 });
 const shared=stageLivingWorldTurn({snapshot:walk,observedHead:head,
  turn:turn('synthetic-rosa-hears'),npcResolutions:social});
 assert.equal(verifyNarrativeSnapshot(shared),true);
 const learned=shared.state.world.actors[rosa].knowledge.at(-1);
 assert.ok(learned.includes('Reported by NPC-004'));
 const r=initial(shared,rosa);
 const proposal=propose(r,
  'Rosa considers asking Elena whether the earlier USB preparation still matters.',
  ['EV-000025']);
 const draft=draftOutcomeFromNPCIntention({snapshot:shared,request:r,proposal,
  reviewed:true,
  outcome:'SYNTHETIC PRIVATE: Rosa weighs what Elena reported, without declaring it true.',
  sourceReviews:[{eventId:'EV-000025',reviewed:true,
   basis:'recorded_actor_knowledge',knownEntry:learned,
   reason:'The earlier Elena event is linked by the verified source origin of Rosa own learned statement.'}]
 });
 assert.deepEqual(draft.continuation_context.source_event_ids,['EV-000025']);
 assert.equal(JSON.stringify(saved),before);
});
