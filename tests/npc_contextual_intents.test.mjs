// Synthetic read-only context review; never write a turn or create an event.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectNPCContextualChoices,reviewNPCFreeformIntent}
 from '../tools/npc_contextual_intents.mjs';
import {recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';
import {prepareNPCIntentionRequests} from '../tools/npc_intention_generation.mjs';
import {savePaths,decodeFiveFiles} from '../tools/save_transaction.mjs';

const originals=Object.fromEntries(savePaths('CH-000').map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const baseline=decodeFiveFiles(originals,'CH-000');
const contextFor=id=>inspectNPCContextualChoices({snapshot:baseline,actorId:id});
const propose=(id,intention,opts={})=>reviewNPCFreeformIntent({
 snapshot:baseline,context:contextFor(id),intention,
 reasoning:'The actor reconsiders their own recorded priorities and chooses an ordinary next step.',
 reviewed:true,...opts
});

test('context retrieves goal, needs, memory, resources and personal ties without an action menu',()=>{
 const before=JSON.stringify(baseline);
 const ctx=contextFor('NPC-004'),actor=baseline.state.world.actors['NPC-004'];
 assert.equal(ctx.evidence.goal,actor.goal);
 assert.equal(ctx.evidence.independentPlan,actor.independent_plan);
 assert.deepEqual(ctx.evidence.knowledge,actor.knowledge);
 assert.deepEqual(ctx.evidence.relationships,actor.relationships);
 assert.deepEqual(ctx.evidence.resources,actor.resources);
 assert.equal(ctx.checkpoint.completedTurn,9);
 assert.equal(ctx.automaticallySelectedAction,false);
 assert.equal(Object.hasOwn(ctx,'actionMenu'),false);
 assert.equal(JSON.stringify(baseline),before);
});

test('open intentions are not confined to an existing routine or selected priority',()=>{
 const old=recommendNPCIntentReviews({state:baseline.state,actorIds:['NPC-006'],
  elapsedMinutes:25});
 assert.ok(old.length>0&&old[0].candidateId.startsWith('routine:'));
 const a=propose('NPC-006','Check the reliability of an unfamiliar supplier before ordering parts.');
 const b=propose('NPC-006','Postpone the supplier call and privately review the workshop accounts.');
 assert.notEqual(a.intention,b.intention);
 for(const x of [a,b]){
  assert.equal(x.status,'requires_causal_adjudication');
  assert.equal(x.actionPerformed,false);
  assert.equal(x.eventCreated,false);
  assert.equal(x.persisted,false);
  assert.equal(Object.hasOwn(x,'action_type'),false);
 }
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('one actor cannot cite another NPC private event or future event',()=>{
 const ctx=contextFor('NPC-003');
 const foreign=baseline.events.events.find(e=>e.known_to?.includes('NPC-002')&&
  !e.known_to.includes('NPC-003'));
 assert.ok(foreign);
 assert.throws(()=>propose('NPC-003',
  'Investigate a maintenance report heard only by the inspector.',
  {sourceEventIds:[foreign.id]}),/event it does not know/);
 assert.throws(()=>propose('NPC-003',
  'Invent the consequences of a meeting that has not happened.',
  {sourceEventIds:['EV-999999']}),/event it does not know/);
 assert.ok(ctx.evidence.knowledge.every(x=>!x.includes('EV-999999')));
});

test('explicit known event can inform an intention without asserting its truth',()=>{
 const ctx=contextFor('NPC-002');
 assert.ok(ctx.evidence.knownEventIds.length);
 const source=ctx.evidence.knownEventIds.at(-1);
 const x=propose('NPC-002','Privately review a previously observed service irregularity.',
  {sourceEventIds:[source]});
 assert.deepEqual(x.sourceEventIds,[source]);
 assert.equal(x.actionPerformed,false);
 assert.equal(x.playerKnows,false);
});

test('admitted graph route is only potential travel; unknown destinations rejected',()=>{
 const x=propose('NPC-003','Consider walking to the public transit plaza to ask about delays.',
  {destinationId:'LOC-CROSSWATER-PLAZA'});
 assert.deepEqual(x.possibleGraphRoute,
  ['LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA']);
 assert.equal(x.graphAccessUnverified,true);
 assert.equal(x.timeAdvanced,false);
 assert.throws(()=>propose('NPC-003',
  'Travel to a school with no existing map location.',
  {destinationId:'LOC-SCHOOL-UNKNOWN'}),/existing admitted location/);
});

test('tampered and stale actor contexts cannot become reviewed intentions',()=>{
 const ctx=contextFor('NPC-005'),tampered=structuredClone(ctx);
 tampered.evidence.resources.current_repair='Invented successful delivery.';
 assert.throws(()=>reviewNPCFreeformIntent({snapshot:baseline,context:tampered,
  intention:'Return the clock after a fictional handover.',
  reasoning:'A deliberately tampered context must never authorize a fictional delivery.',
  reviewed:true}),/Stale or altered/);
 const newer=structuredClone(baseline);
 newer.state.world.actors['NPC-005'].goal='A changed goal after a hypothetical future event.';
 assert.throws(()=>reviewNPCFreeformIntent({snapshot:newer,context:ctx,
  intention:'Review an ordinary household task with the obsolete goal.',
  reasoning:'The actor must be assessed using the current saved situation.',
  reviewed:true}),/Stale or altered/);
});

test('no execution without review, no automatic background advance across many probes',()=>{
 const origin=JSON.stringify(baseline);
 const ctx=contextFor('NPC-005');
 assert.throws(()=>reviewNPCFreeformIntent({snapshot:baseline,context:ctx,
  intention:'Consider arranging a clock return with the neighbor.',
  reasoning:'This is a plausible tentative decision requiring editorial review.'}),
  /requires editorial review/);
 for(let day=0;day<14;day++){
  const s=structuredClone(baseline);
  s.state.time.day-=day;
  // Hypothetical days are observations of a cloned state, never canonical turns.
  const info=inspectNPCContextualChoices({snapshot:s,actorId:'NPC-005'});
  assert.equal(info.checkpoint.worldDay,-29-day);
  assert.equal(info.executionAuthorized,false);
 }
 assert.equal(JSON.stringify(baseline),origin);
 assert.equal(baseline.manifest.last_completed_turn,9);
 for(const [path,bytes] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
});

test('third-party known_to grants an event pointer, not the owner private outcome',()=>{
 const before=JSON.stringify(baseline),event=baseline.events.events.find(x=>x.id==='EV-000025');
 assert.ok(event);
 assert.deepEqual(event.actor_ids,['NPC-004']);
 assert.ok(event.known_to.includes('NPC-005'));
 const elena=contextFor('NPC-004'),rosa=contextFor('NPC-005');
 const own=elena.evidence.knownEvents.find(x=>x.id===event.id);
 const secondary=rosa.evidence.knownEvents.find(x=>x.id===event.id);
 assert.ok(own&&secondary);
 assert.equal(own.contentScope,'actor_owned_event');
 assert.equal(own.outcome,event.outcome);
 assert.equal(secondary.contentScope,'reference_only_not_full_event_knowledge');
 assert.equal(Object.hasOwn(secondary,'intent'),false);
 assert.equal(Object.hasOwn(secondary,'outcome'),false);
 assert.ok(rosa.evidence.knownEventIds.includes(event.id));
 assert.ok(!JSON.stringify(secondary).includes('registros financieros'));
 assert.equal(JSON.stringify(baseline),before);
});

test('private generation request never includes the full third-party event text',()=>{
 const requests=prepareNPCIntentionRequests({
  snapshot:baseline,actorIds:['NPC-004','NPC-005'],elapsedMinutes:15});
 const rosa=requests.requests.find(x=>x.actorId==='NPC-005');
 const elena=requests.requests.find(x=>x.actorId==='NPC-004');
 const source=baseline.events.events.find(x=>x.id==='EV-000025');
 assert.ok(rosa&&elena&&source);
 const hearer=rosa.evidence.knownEvents.find(x=>x.id===source.id);
 const author=elena.evidence.knownEvents.find(x=>x.id===source.id);
 assert.equal(hearer.contentScope,'reference_only_not_full_event_knowledge');
 assert.equal(Object.hasOwn(hearer,'outcome'),false);
 assert.equal(author.outcome,source.outcome);
 assert.ok(!JSON.stringify(rosa.evidence.knownEvents).includes('desconoce los registros financieros'));
 assert.equal(requests.actionsPerformed,0);
 assert.equal(requests.timeAdvanced,false);
 assert.equal(baseline.manifest.last_completed_turn,9);
});
