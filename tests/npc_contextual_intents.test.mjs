// Synthetic read-only context review; never write a turn or create an event.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectNPCContextualChoices,reviewNPCFreeformIntent}
 from '../tools/npc_contextual_intents.mjs';
import {recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';
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


test('known_to points to other actors events without granting their full private outcomes',()=>{
 const rosa=contextFor('NPC-005');
 const elena=contextFor('NPC-004');
 const visibleToRosa=rosa.evidence.knownEvents.find(e=>e.id==='EV-000025');
 assert.ok(visibleToRosa,'The saved event pointer should remain discoverable');
 assert.ok(rosa.evidence.knownEventIds.includes('EV-000025'));
 assert.equal(visibleToRosa.detailScope,'known_to_reference_only');
 assert.equal(visibleToRosa.intent,null);
 assert.equal(visibleToRosa.outcome,null);
 assert.equal(visibleToRosa.actorIds,null);
 assert.equal(visibleToRosa.kind,null);
 assert.ok(!JSON.stringify(visibleToRosa).includes('registros financieros'));
 const owned=elena.evidence.knownEvents.find(e=>e.id==='EV-000025');
 assert.ok(owned);
 assert.equal(owned.detailScope,'actor_owned_event');
 assert.ok(owned.outcome.includes('ilustración'));
 assert.equal(rosa.evidence.knownEvents.find(e=>e.id==='EV-000029')?.detailScope,
  'actor_owned_event');
});
