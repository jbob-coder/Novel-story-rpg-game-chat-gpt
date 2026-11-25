// Every turn here is synthetic, in-memory and not a saved player action.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 inspectNPCCausalContinuations,draftReviewedNPCCausalContinuation,
 validateNPCContinuationDraft,verifyNPCCausalContinuationHistory,
 inspectNPCDecisionConsequenceHistory
} from '../tools/living_world_causal_continuations.mjs';
import {draftReviewedSocialContact} from '../tools/living_world_social.mjs';
import {draftReviewedNPCIntroduction} from '../tools/living_world_npc_introduction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageNarrativeTurn,verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {encodeFiveFiles} from '../tools/save_transaction.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const head='a'.repeat(40);
const reason='The actor reviews a known, sourced event and chooses a proportionate independent action.';
const outcome='The actor privately verifies the note and decides on an ordinary next task.';
const turn=(key,extra={})=>({
 key,intent:'SYNTHETIC QA: Jack inspects the workbench without directing offscreen NPCs.',
 outcome:'The ordinary workshop interval passes without a forced intervention.',
 player_text:'[SYNTHETIC QA ONLY] Quietly inspect the bench.',
 narration_messages:['Synthetic daylight falls on the workbench. Nothing private is disclosed.'],
 elapsed_days:0,elapsed_minutes:25,...extra
});
const stage=(snapshot,resolutions=[],key='synthetic-open-causal-test-default',extra={})=>
 stageLivingWorldTurn({snapshot,observedHead:head,turn:turn(key,extra),
  npcResolutions:resolutions});
const npcAction=(snapshot,actorId,ids,other={})=>
 draftReviewedNPCCausalContinuation({snapshot,actorId,sourceEventIds:ids,
  reasoning:reason,outcome,reviewed:true,changes:[],...other});
const directSocial=(state,from='NPC-006',to='NPC-003',fact=null,interactionId='SOC-CASCADE-0001')=>
 draftReviewedSocialContact({
  state,interactionId,participantIds:[from,to],
  observation:{kind:'current_turn_observation',
   fact:'Synthetic witnesses at the Market Row counter exchange an observed commercial detail.',
   causal_source:'Synthetic reviewed direct two-person conversation at an established shared location.',
   observer_actor_id:from,confirmed_by_reviewer:true},
  knowledgeTransfer:{speaker_id:from,recipient_id:to,
   known_entry:fact??state.world.actors[from].knowledge[0]},
  outcomes:{
   [from]:'The source NPC shares a limited known commercial detail privately.',
   [to]:'The recipient listens and considers the reported information without certainty.'
  },reviewed:true
 });
const socialFirst=()=>stage(baseline,directSocial(baseline.state), 'synthetic-cascade-step-001');
const afterRecipient=()=>{
 const first=socialFirst(),recipient=first.events.events.at(-1);
 return stage(first,[npcAction(first,'NPC-003',[recipient.id],{
  outcome:'The recipient changes their private plans after receiving a reported commercial detail.',
  changes:[{field:'knowledge',
   fact:'Synthetic Darius decided to ask a registered clerk about the reported parts availability.',
   source:'Reviewed private follow-up after the social testimony at Market Row'}]
 })],'synthetic-cascade-step-002');
};
const intro=(state)=>draftReviewedNPCIntroduction({
 state,actor:{id:'NPC-008',name:'SYNTHETIC Clerk Sera',age:24,
  role:'Synthetic market inventory clerk',location_id:'LOC-COMMERCIAL-DISTRICT',
  goal:'Maintain a correct record of ordinary market supplies.',
  independent_plan:'Check deliveries and relay only personally reviewed facts.',
  description:'An adult private synthetic identity used only for QA causal chains.'},
 observation:{kind:'current_turn_observation',
  fact:'Noah observes a new clerk working at the public market inventory counter.',
  causal_source:'Synthetic direct reviewed current-turn witness at the market.',
  observer_actor_id:'NPC-006',confirmed_by_reviewer:true},
 reviewed:true,outcome:'The newly registered clerk organizes ordinary market inventory records.'
});
const plan=s=>({plan_version:1,chapter_id:'CH-001',
 title:'Synthetic chain after chapter boundary',status:'prepared',source_commit:head,
 purpose:'Keep event provenance without scripting the next actor action.',
 time_context:{day:s.state.time.day,period:s.state.time.time_of_day,
  constraints:['Preserve existing NPC knowledge and player choice']},
 location_ids:[s.state.player.location_id],
 npc_ids:['NPC-003','NPC-006',...(s.state.world.actors['NPC-008']?['NPC-008']:[])],
 thread_ids:[],hidden_plan_ids:[],
 possible_developments:['Characters may decide later whether any report matters.'],
 exit_conditions:['The synthetic audit is completed.']});
const close=s=>stageChapterTransition({
 snapshot:{...s,sourceFiles:encodeFiveFiles(s)},nextPlan:plan(s),
 reason:'Synthetic reviewed chapter boundary.',observedHead:head,reviewed:true
});

test('read-only preview inspects known events without moving or exposing anything',()=>{
 const before=JSON.stringify(baseline);
 const proposals=inspectNPCCausalContinuations({
  snapshot:baseline,actorIds:['NPC-006','NPC-005'],limitPerActor:3});
 assert.ok(proposals.length>0);
 assert.ok(proposals.every(x=>x.status==='review_required'&&
  x.resolved===false&&x.applied===false&&x.player_visible===false));
 assert.equal(JSON.stringify(baseline),before);
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('free-form causal decisions do not impose a hard-coded action menu',()=>{
 const event=baseline.events.events.find(x=>x.actor_ids[0]==='NPC-005'&&
  x.known_to.includes('NPC-005'));
 const draft=npcAction(baseline,'NPC-005',[event.id],{
  outcome:'The synthetic clock repairer considers ordinary neighbour work instead of a mission.'});
 assert.deepEqual(draft.continuation_context.source_event_ids,[event.id]);
 assert.equal(draft.causal_basis,reason);
 assert.ok(draft.outcome.includes('considers ordinary'));
 assert.equal(Object.hasOwn(draft,'action_type'),false);
 assert.equal(Object.hasOwn(draft,'menu_choice'),false);
});

test('NPC cannot cite an event it never knew',()=>{
 assert.throws(()=>npcAction(baseline,'NPC-003',['EV-000029']),
  /event it does not know/);
 assert.throws(()=>npcAction(baseline,'NPC-006',['EV-000030']),
  /future event or an event it does not know/);
});

test('repeated and unbounded sources cannot forge a continuation',()=>{
 assert.throws(()=>npcAction(baseline,'NPC-005',['EV-000029','EV-000029']),
  /distinct prior event IDs/);
 assert.throws(()=>npcAction(baseline,'NPC-005',['EV-000026','EV-000029',
  'EV-000025','EV-000015']),/one to three distinct/);
 assert.throws(()=>npcAction(baseline,'NPC-005',[]),/one to three distinct/);
});

test('unreviewed, empty, or unsupported actors cannot create causal actions',()=>{
 assert.throws(()=>npcAction(baseline,'NPC-003',['EV-000025'],
  {reviewed:false}),/editorial review/);
 assert.throws(()=>npcAction(baseline,'NPC-999',['EV-000029']),
  /existing actor/);
 assert.throws(()=>npcAction(baseline,'NPC-005',['EV-000029'],
  {reasoning:'because'}),/editorial review/);
});

test('coordinator stages reviewed references from an earlier known actor event',()=>{
 const first=socialFirst(),source=first.events.events.at(-1);
 assert.equal(source.actor_ids[0],'NPC-003');
 const second=stage(first,[npcAction(first,'NPC-003',[source.id])],
  'synthetic-cascade-step-002');
 const event=second.events.events.at(-1);
 assert.equal(event.kind,'independent_actor');
 assert.deepEqual(event.caused_by,[source.id]);
 assert.deepEqual(event.continuation_context.source_event_ids,[source.id]);
 assert.equal(event.actor_ids[0],'NPC-003');
 assert.equal(event.state_changes[0].field,'last_resolved_action');
 assert.equal(verifyNPCCausalContinuationHistory(second).length,1);
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(JSON.stringify(baseline.events.events),JSON.stringify(
  second.events.events.slice(0,baseline.events.events.length)));
});

test('private follow-up causes neither automatic disclosure nor RPG awards',()=>{
 const first=socialFirst(),id=first.events.events.at(-1).id;
 const result=stage(first,[npcAction(first,'NPC-003',[id],
  {outcome:'Darius privately checks which parts are available without discussing it with Jack.'})],
 'synthetic-cascade-private');
 const event=result.events.events.at(-1);
 assert.equal(event.known_to.length,1);
 assert.equal(event.known_to[0],'NPC-003');
 assert.deepEqual(event.progression_awards,[]);
 assert.ok(!result.chapter.includes(event.outcome));
 assert.ok(!result.transcript.entries.at(-1).text.includes(event.outcome));
});

test('direct stageNarrativeTurn rejects a future actor reference without coordinator',()=>{
 assert.throws(()=>stageNarrativeTurn(baseline,{
  ...turn('synthetic-direct-causal-reject'),offscreen:[{
    actor_id:'NPC-003',outcome,
    intent:reason,continuation_context:{
     kind:'known_event',reviewed:true,reasoning:reason,
     source_event_ids:['EV-000029']}
  }],
  save_guard:{observed_head:head,previous_attempt:null}
 }),/event it does not know/);
});

test('staging rejects a manipulated review and raw source shortcut',()=>{
 const first=socialFirst(),ref=first.events.events.at(-1).id;
 const draft=npcAction(first,'NPC-003',[ref]);
 draft.continuation_context.reasoning='Changed to an unreviewed reason.';
 assert.throws(()=>stage(first,[draft],'synthetic-cascade-forged-review'),
  /review differs from its actor-owned intent/);
 assert.throws(()=>stage(first,[{
  actor_id:'NPC-003',reviewed:true,resolved:true,causal_basis:reason,outcome,
  changes:[],disclosures:[],causal_source_event_ids:[ref]
 }],'synthetic-cascade-raw-source'),
  /Use a reviewed NPC continuation context/);
 assert.throws(()=>validateNPCContinuationDraft({snapshot:first,item:{
  ...draft,social_context:{interaction_id:'SOC-FAKE'}
 }}),/Social encounters use their separately verified paired/);
});

test('historical readback rejects altered source, review and actor-owned intent',()=>{
 const first=socialFirst(),ref=first.events.events.at(-1).id;
 const next=stage(first,[npcAction(first,'NPC-003',[ref])],
  'synthetic-cascade-integrity');
 const mutations=[
  s=>s.events.events.at(-1).caused_by.pop(),
  s=>s.events.events.at(-1).continuation_context.reviewed=false,
  s=>s.events.events.at(-1).intent='Forcibly rewritten and unreviewed',
  s=>s.events.events.at(-1).continuation_context.source_event_ids=['EV-000029']
 ];
 for(const mutation of mutations){
  const tampered=structuredClone(next);mutation(tampered);
  assert.throws(()=>verifyNarrativeSnapshot(tampered));
 }
});

test('unsourced event causal links are rejected on readback',()=>{
 const first=socialFirst(),result=stage(first,[{
  actor_id:'NPC-005',reviewed:true,resolved:true,
  causal_basis:'Synthetic ordinary clock repair work continues separately.',
  outcome:'The clockmaker keeps working without any cited external cause.',
  changes:[],disclosures:[]
 }],'synthetic-cascade-unsourced');
 const forged=structuredClone(result);
 forged.events.events.at(-1).caused_by=['EV-000029'];
 assert.throws(()=>verifyNPCCausalContinuationHistory(forged),
  /unsourced continuation links/);
});

test('continuations remain strictly later than their triggering events',()=>{
 const first=socialFirst(),source=first.events.events.at(-1);
 const future=structuredClone(first);
 // The previous event cannot pretend to be triggered by itself or a later event.
 future.events.events.at(-1).continuation_context={
  kind:'known_event',reviewed:true,reasoning:future.events.events.at(-1).intent,
  source_event_ids:[source.id]};
 future.events.events.at(-1).caused_by=[source.id];
 assert.throws(()=>verifyNPCCausalContinuationHistory(future),
  /not actor-owned|future event or an event it does not know|unreviewed, altered/);
});

test('an unsupported current-turn offscreen social shortcut cannot carry private causes',()=>{
 const first=socialFirst(),ref=first.events.events.at(-1).id;
 const invalid=draftReviewedNPCCausalContinuation({
  snapshot:first,actorId:'NPC-003',sourceEventIds:[ref],
  reasoning:reason,outcome,reviewed:true
 });
 invalid.social_context={interaction_id:'SOC-BOGUS'};
 assert.throws(()=>stage(first,[invalid],'synthetic-cascade-social-shortcut'),
  /Social encounters use their separately verified paired|Invalid social/);
});

test('multi-actor cascade passes through actual knowledge transfer and later actions',()=>{
 const a=socialFirst(),recipientEvent=a.events.events.at(-1);
 const b=afterRecipient(),bEvent=b.events.events.at(-1);
 assert.deepEqual(bEvent.caused_by,[recipientEvent.id]);
 const c=stage(b,[], 'synthetic-cascade-step-003',{npc_introductions:[intro(b.state)]});
 assert.equal(c.state.world.actors['NPC-008'].location_id,'LOC-COMMERCIAL-DISTRICT');
 const transmitted=b.state.world.actors['NPC-003'].knowledge.at(-1);
 const speech=directSocial(c.state,'NPC-003','NPC-008',transmitted,'SOC-CASCADE-0002');
 const d=stage(c,speech,'synthetic-cascade-step-004'),transfer=d.events.events.at(-1);
 assert.equal(transfer.actor_ids[0],'NPC-008');
 assert.equal(transfer.caused_by.length,1);
 assert.equal(transfer.caused_by[0],d.events.events.at(-2).id);
 assert.ok(d.state.world.actors['NPC-008'].knowledge.at(-1).includes(bEvent.id));
 const e=stage(d,[npcAction(d,'NPC-008',[transfer.id],
  {outcome:'The inventory clerk privately verifies the reported parts situation and updates her work plan.'})],
 'synthetic-cascade-step-005');
 assert.equal(verifyNarrativeSnapshot(e),true);
 assert.deepEqual(e.events.events.at(-1).caused_by,[transfer.id]);
 assert.deepEqual([...verifyNPCCausalContinuationHistory(e)].map(x=>x.actor_id),
  ['NPC-003','NPC-008']);
 assert.ok(!e.chapter.includes(transmitted));
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('a causal chain survives closing the chapter and opening the next one',()=>{
 const start=afterRecipient();
 const closed=close(start);
 assert.equal(closed.manifest.chapter_id,'CH-001');
 const sourceEvent=allEvents(closed).find(x=>x.continuation_context);
 assert.ok(sourceEvent);
 const next=stage(closed,[npcAction(closed,'NPC-003',[sourceEvent.id],
  {outcome:'The courier privately reconsiders the prior reported market availability.'})],
 'synthetic-cascade-chapter-crossing');
 assert.equal(next.manifest.chapter_id,'CH-001');
 assert.equal(next.manifest.last_completed_turn,12);
 assert.equal(verifyNarrativeSnapshot(next),true);
 const links=verifyNPCCausalContinuationHistory(next);
 assert.equal(links.length,2);
 assert.deepEqual(links.at(-1).source_event_ids,[sourceEvent.id]);
 assert.equal(closed.archives['CH-000'].events.events.at(-1).id,sourceEvent.id);
});

test('review does not execute between player turns or without a saved candidate',()=>{
 const snapshot=socialFirst(),source=snapshot.events.events.at(-1);
 const before=JSON.stringify(snapshot);
 const candidate=npcAction(snapshot,'NPC-003',[source.id]);
 assert.equal(candidate.resolved,true);
 assert.equal(JSON.stringify(snapshot),before);
 assert.equal(snapshot.manifest.last_completed_turn,10);
 assert.equal(snapshot.state.world.actors['NPC-003'].last_resolved_action.event_id,source.id);
});


test('two NPCs may choose different free-form outcomes from their own exact memories',()=>{
 const base=JSON.stringify(baseline);
 const reported=socialFirst(); // Darius receives an attributed social fact as EV-000032.
 const dariusEntry=reported.state.world.actors['NPC-003'].knowledge.at(-1);
 const dSource=reported.events.events.at(-1).id;
 assert.ok(dariusEntry.includes(dSource));
 const source=stage(reported,[{
  actor_id:'NPC-006',reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Noah independently inspects an actual repair supply record.',
  outcome:'SYNTHETIC QA PRIVATE: Noah notes the supply count without speaking to Jack.',
  changes:[{field:'knowledge',
   fact:'SYNTHETIC QA: Noah saw the current repair supply count on his own ledger.',
   source:'SYNTHETIC QA: Noah personally inspected a stock ledger'}]
 }],'synthetic-choice-new-independent-source');
 const noahEntry=source.state.world.actors['NPC-006'].knowledge.at(-1);
 const nSource=source.events.events.at(-1).id;
 const alternativeD='Darius could instead trust the hearsay and make an immediate sale.';
 const alternativeN='Noah could instead stop work and go ask Darius about the rumor.';
 const nextPlan='SYNTHETIC QA: Darius elects to check the actual delivery before promising supplies.';
 const first=npcAction(source,'NPC-003',[dSource],{
  reasoning:'SYNTHETIC QA: Darius weighs the private report and chooses to verify before selling.',
  outcome:'SYNTHETIC QA PRIVATE: Darius chooses to check for a delivery rather than promise stock.',
  memoryBasis:{
   knowledge_entry:dariusEntry,
   interpretation:'SYNTHETIC QA: Darius treats the attributed report as insufficient evidence.',
   alternative_considered:alternativeD
  },
  changes:[{field:'independent_plan',
   before:source.state.world.actors['NPC-003'].independent_plan,
   after:nextPlan}]
 });
 const second=npcAction(source,'NPC-006',[nSource],{
  reasoning:'SYNTHETIC QA: Noah considers his own checked ledger sufficient for routine tasks.',
  outcome:'SYNTHETIC QA PRIVATE: Noah continues his work without a change to his plan.',
  memoryBasis:{
   knowledge_entry:noahEntry,
   interpretation:'SYNTHETIC QA: Noah treats his personally observed ledger as locally useful.',
   alternative_considered:alternativeN
  }
 });
 const out=stage(source,[first,second],'synthetic-choice-two-perspectives');
 assert.equal(verifyNarrativeSnapshot(out),true);
 const events=out.events.events.slice(-2);
 assert.deepEqual(events.map(e=>e.actor_ids[0]),['NPC-003','NPC-006']);
 assert.deepEqual(events.map(e=>e.continuation_context.source_event_ids),[[dSource],[nSource]]);
 assert.deepEqual(events.map(e=>e.continuation_context.decision_memory_basis.knowledge_entry),
  [dariusEntry,noahEntry]);
 assert.deepEqual(events.map(e=>e.continuation_context.decision_memory_basis.alternative_considered),
  [alternativeD,alternativeN]);
 assert.equal(out.state.world.actors['NPC-003'].independent_plan,nextPlan);
 assert.equal(out.state.world.actors['NPC-006'].independent_plan,
  source.state.world.actors['NPC-006'].independent_plan);
 assert.deepEqual(out.state.world.actors['NPC-006'].knowledge,
  source.state.world.actors['NPC-006'].knowledge);
 assert.deepEqual(out.state.world.actors['NPC-003'].knowledge,
  source.state.world.actors['NPC-003'].knowledge);
 assert.equal(out.state.player.knowledge.length,baseline.state.player.knowledge.length);
 assert.ok(!out.chapter.includes(dariusEntry));
 assert.ok(!out.chapter.includes(noahEntry));
 assert.equal(verifyNPCCausalContinuationHistory(out).length,2);
 const archived=close(out);
 assert.equal(verifyNarrativeSnapshot(archived),true);
 const inNextChapter=stage(archived,[],'synthetic-choice-after-chapter-boundary');
 assert.equal(verifyNarrativeSnapshot(inNextChapter),true);
 assert.equal(verifyNPCCausalContinuationHistory(inNextChapter).length,2);
 assert.equal(inNextChapter.archives['CH-000'].events.events.at(-1)
  .continuation_context.decision_memory_basis.alternative_considered,alternativeN);
 assert.equal(JSON.stringify(baseline),base);
});

test('memory-grounded choice refuses someone else source, unsupported event and malformed options',()=>{
 const first=socialFirst(),fact=first.state.world.actors['NPC-003'].knowledge.at(-1);
 const eventId=first.events.events.at(-1).id;
 const other=first.state.world.actors['NPC-006'].knowledge[0];
 const good={
  knowledge_entry:fact,
  interpretation:'SYNTHETIC QA: Darius prefers a cautious interpretation of the report.',
  alternative_considered:'SYNTHETIC QA: Darius could immediately rely on the same report.'
 };
 const original=JSON.stringify(first);
 assert.throws(()=>npcAction(first,'NPC-003',[eventId],{memoryBasis:{...good,
  knowledge_entry:other}}),/actor-owned memory/);
 assert.throws(()=>npcAction(first,'NPC-003',['EV-000030'],{
  memoryBasis:good}),/event it does not know|cited prior event/);
 assert.throws(()=>npcAction(first,'NPC-003',[eventId],{memoryBasis:{
  ...good,alternative_considered:' '}}),/complete reviewed|free-form review/);
 assert.throws(()=>npcAction(first,'NPC-003',[eventId],{memoryBasis:{
  ...good,chosen_action:'must follow the script'}}),/complete reviewed|free-form review/);
 assert.equal(JSON.stringify(first),original);
});

test('forged final-state knowledge cannot backdate a private NPC decision',()=>{
 const first=socialFirst(),owned=first.state.world.actors['NPC-003'].knowledge.at(-1);
 const ev=first.events.events.at(-1).id;
 const interpretation='SYNTHETIC QA: Darius weighs an attributed report cautiously.';
 const alternative='SYNTHETIC QA: Darius could instead accept the report as proven.';
 const one=stage(first,[npcAction(first,'NPC-003',[ev],{
  memoryBasis:{knowledge_entry:owned,interpretation,alternative_considered:alternative}
 })],'synthetic-grounded-decision-original');
 const later=stage(one,[{
  actor_id:'NPC-003',reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius learns a further unrelated detail on a later turn.',
  outcome:'SYNTHETIC QA PRIVATE: Darius retains a new private note.',
  changes:[{field:'knowledge',
    fact:'SYNTHETIC QA: Darius later learns a new material inventory detail.',
    source:'SYNTHETIC QA: later direct independent inventory note'}]
 }],'synthetic-grounded-decision-future');
 assert.equal(verifyNarrativeSnapshot(later),true);
 const forged=structuredClone(later);
 const decision=forged.events.events.find(e=>e.continuation_context?.decision_memory_basis);
 decision.continuation_context.decision_memory_basis.knowledge_entry=
  forged.state.world.actors['NPC-003'].knowledge.at(-1);
 assert.throws(()=>verifyNPCCausalContinuationHistory(forged),
  /actor-owned memory from a cited prior event/);
 // Even forging the event references cannot make a later EV precede the decision.
 const futureEvent=forged.events.events.at(-1).id;
 decision.continuation_context.source_event_ids=[futureEvent];
 decision.caused_by=[futureEvent];
 assert.throws(()=>verifyNPCCausalContinuationHistory(forged),
  /future event or an event it does not know/);
 assert.equal(verifyNarrativeSnapshot(later),true);
});

test('reviewed decision effects stay actor-owned across work obligation, trust and independent plan',()=>{
 const old=JSON.stringify(baseline),first=socialFirst();
 const actorId='NPC-003',otherId='NPC-006';
 const sourceId=first.events.events.at(-1).id;
 const memory=first.state.world.actors[actorId].knowledge.at(-1);
 const createEvent='EV-000034',followEvent='EV-000037';
 const obligation={
  id:'OBL-SYNTHETIC-SUPPLY-VERIFY',summary:'SYNTHETIC QA: confirm a repair part delivery.',
  source_event_id:createEvent,last_change_event_id:createEvent,
  due_day:null,status:'pending',priority:'normal',blockers:[],
  resolution:null,resolution_event_id:null
 };
 const chosenPlan='SYNTHETIC QA: verify the parts delivery before accepting a promise.';
 const actor=first.state.world.actors[actorId],before=actor.commitments??[];
 const firstDecision=npcAction(first,actorId,[sourceId],{
  reasoning:'SYNTHETIC QA: Darius weighs a sourced report and chooses to check the supplies.',
  outcome:'SYNTHETIC QA PRIVATE: Darius starts an independent verification obligation.',
  memoryBasis:{
   knowledge_entry:memory,
   interpretation:'SYNTHETIC QA: the secondhand report is not enough to guarantee stock.',
   alternative_considered:'SYNTHETIC QA: he could accept the report as settled without checking.'
  },
  changes:[
   {field:'independent_plan',before:actor.independent_plan,after:chosenPlan},
   {field:'relationship',target_actor_id:otherId,before:null,
    after:{relation:'colleague from the market',bond:'cautious cooperation'}},
   {field:'commitments',before,after:[...before,obligation]}
  ]
 });
 const noahDecision=npcAction(first,otherId,[first.events.events.at(-2).id],{
  outcome:'SYNTHETIC QA PRIVATE: Noah chooses to continue his existing work without a new obligation.'
 });
 const decisions=stage(first,[firstDecision,noahDecision],
  'synthetic-decision-consequences-first');
 assert.equal(verifyNarrativeSnapshot(decisions),true);
 const effects=inspectNPCDecisionConsequenceHistory({snapshot:decisions});
 assert.equal(effects.length,2);
 const d=effects.find(x=>x.actorId===actorId),n=effects.find(x=>x.actorId===otherId);
 assert.equal(d.decisionEventId,createEvent);
 assert.equal(d.recordedEffectCount,3);
 assert.deepEqual(d.recordedEffectFields,['commitments','independent_plan','relationship']);
 assert.deepEqual(d.commitmentIdsChanged,[obligation.id]);
 assert.deepEqual(d.relationshipTargetIds,[otherId]);
 assert.equal(d.independentPlanChanged,true);
 assert.equal(d.memorySourceEventId,sourceId);
 assert.deepEqual(d.laterOwnCitedFollowupEventIds,[]);
 assert.equal(d.inferredCompletion,false);
 assert.equal(n.status,'no_material_state_effect_recorded');
 assert.deepEqual(n.commitmentIdsChanged,[]);
 assert.equal(n.independentPlanChanged,false);
 assert.equal(decisions.state.world.actors[otherId].relationships?.[actorId],undefined);
 assert.deepEqual(decisions.state.world.actors[otherId].commitments??[],
   first.state.world.actors[otherId].commitments??[]);
 const blocked={...obligation,status:'blocked',
  blockers:['SYNTHETIC QA: the supplier confirmation has not arrived.'],
  last_change_event_id:followEvent};
 const later=npcAction(decisions,actorId,[createEvent],{
  reasoning:'SYNTHETIC QA: Darius reviews his original commitment and notes an unresolved supplier reply.',
  outcome:'SYNTHETIC QA PRIVATE: verification remains blocked, not silently completed.',
  changes:[{field:'commitments',before:[obligation],after:[blocked]}]
 });
 const next=stage(decisions,[later],'synthetic-decision-consequences-followup');
 assert.equal(verifyNarrativeSnapshot(next),true);
 const report=inspectNPCDecisionConsequenceHistory({snapshot:next,actorIds:[actorId]});
 assert.equal(report.length,2);
 assert.deepEqual(report[0].laterOwnCitedFollowupEventIds,[followEvent]);
 assert.equal(report[0].laterOwnCitedFollowupCount,1);
 assert.deepEqual(report[1].commitmentIdsChanged,[obligation.id]);
 assert.equal(next.state.world.actors[actorId].commitments[0].status,'blocked');
 assert.equal(next.state.world.actors[actorId].commitments[0].resolution_event_id,null);
 const closed=close(next);
 assert.equal(verifyNarrativeSnapshot(closed),true);
 const replay=stage(closed,[],'synthetic-consequence-after-archive');
 assert.equal(verifyNarrativeSnapshot(replay),true);
 assert.deepEqual(inspectNPCDecisionConsequenceHistory({snapshot:replay,actorIds:[actorId]}),
  report);
 assert.equal(replay.manifest.chapter_id,'CH-001');
 assert.equal(replay.state.world.actors[actorId].commitments[0].status,'blocked');
 assert.ok(!replay.chapter.includes(obligation.summary));
 assert.equal(JSON.stringify(baseline),old);
});

test('decision effect audit refuses forged causal links and never infers completion',()=>{
 const first=socialFirst(),event=first.events.events.at(-1).id;
 const decision=stage(first,[npcAction(first,'NPC-003',[event],{
  outcome:'SYNTHETIC QA PRIVATE: Darius weighs his options without a material new action.'
 })],'synthetic-decision-consequences-noop');
 const original=JSON.stringify(decision);
 const evidence=inspectNPCDecisionConsequenceHistory({snapshot:decision,actorIds:['NPC-003']});
 assert.equal(evidence.length,1);
 assert.equal(evidence[0].recordedEffectCount,0);
 assert.equal(evidence[0].inferredCompletion,false);
 // Zero requested private decision records must not return the whole history.
 assert.deepEqual(inspectNPCDecisionConsequenceHistory({
  snapshot:decision,limit:0}),[]);
 assert.deepEqual(inspectNPCDecisionConsequenceHistory({
  snapshot:decision,actorIds:['NPC-003'],limit:0}),[]);
 assert.deepEqual(inspectNPCDecisionConsequenceHistory({
  snapshot:decision,actorIds:[],limit:1}),[]);
 assert.deepEqual(inspectNPCDecisionConsequenceHistory({
  snapshot:decision,limit:1}),evidence);
 assert.throws(()=>inspectNPCDecisionConsequenceHistory({snapshot:decision,
  actorIds:['NPC-007','NPC-007']}),/Unknown or repeated/);
 assert.throws(()=>inspectNPCDecisionConsequenceHistory({snapshot:decision,
  limit:101}),/Invalid decision consequence/);
 const forged=structuredClone(decision);
 forged.events.events.at(-1).continuation_context.source_event_ids=['EV-000029'];
 assert.throws(()=>inspectNPCDecisionConsequenceHistory({snapshot:forged}),
  /event it does not know|unreviewed, altered|causal/i);
 assert.equal(JSON.stringify(decision),original);
});
