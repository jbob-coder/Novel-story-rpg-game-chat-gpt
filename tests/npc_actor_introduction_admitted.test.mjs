// Lote 13: all NPC admission and chapter scenarios are synthetic and in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {draftReviewedNPCIntroduction,verifyNPCIntroductionHistory}
 from '../tools/living_world_npc_introduction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {encodeFiveFiles} from '../tools/save_transaction.mjs';
import {draftReviewedSocialContact,verifySealedNPCKnowledge}
 from '../tools/living_world_social.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const head='a'.repeat(40);
const testimony='Synthetic supply clerk checks the published parts inventory.';
const location='LOC-COMMERCIAL-DISTRICT';
const actor=(id='NPC-008',where=location)=>({
 id,name:id==='NPC-008'?'SYNTHETIC Sera Vale':'SYNTHETIC Theo Vale',
 age:24,role:'Reviewed synthetic municipal supply clerk',location_id:where,
 goal:'Maintain an accurate and ethical public inventory record.',
 independent_plan:'Inspect the delivery log and verify the available parts.',
 description:'A synthetic adult shop clerk admitted for causal regression tests.'
});
const observation=(observer='NPC-006')=>({
 kind:'current_turn_observation',
 fact:'Synthetic Noah observes a new supply clerk registering at the nearby counter.',
 causal_source:'Explicit synthetic current-turn reviewed presence at the commercial market.',
 observer_actor_id:observer,confirmed_by_reviewer:true
});
const intro=(state,id='NPC-008',custom={})=>draftReviewedNPCIntroduction({
 state,actor:actor(id),observation:observation(),reviewed:true,
 outcome:'The synthetic supply clerk organizes the public delivery register privately.',
 initialKnowledge:[{fact:testimony,source:'Synthetic direct review of the market inventory register'}],
 ...custom
});
const turn=(key,npc_introductions=[],extras={})=>({
 key,intent:'SYNTHETIC reviewed ordinary interval in the workshop.',
 outcome:'SYNTHETIC the workbench remains quiet and Jack continues his own work.',
 player_text:'SYNTHETIC QA not real player input.',
 narration_messages:['Synthetic light falls on the workbench; no private NPC facts are disclosed.'],
 elapsed_days:0,elapsed_minutes:25,npc_introductions,...extras
});
const stage=(snapshot,introductions,key,other={})=>
 stageLivingWorldTurn({snapshot,observedHead:head,
  turn:turn(key,introductions),npcResolutions:other.npcResolutions??[]});
const first=()=>stage(baseline,[intro(baseline.state)],
 'synthetic-npc-introduction-turn-001');
const plan=snapshot=>({plan_version:1,chapter_id:'CH-001',
 title:'Synthetic admission persistence',status:'prepared',source_commit:head,
 purpose:'Test identity continuity without creating any canonical scene.',
 time_context:{day:snapshot.state.time.day,period:snapshot.state.time.time_of_day,
  constraints:['Preserve all legacy NPC knowledge']},
 location_ids:[snapshot.state.player.location_id],npc_ids:['NPC-008'],
 thread_ids:[],hidden_plan_ids:[],
 possible_developments:['No synthetic lore becomes canon.'],
 exit_conditions:['Synthetic evidence has been checked.']});
const close=snapshot=>stageChapterTransition({
 snapshot:{...snapshot,sourceFiles:encodeFiveFiles(snapshot)},
 nextPlan:plan(snapshot),
 reason:'Synthetic editorial boundary review only.',observedHead:head,reviewed:true
});

test('a reviewed private proposal does not add actors, knowledge or events',()=>{
 const before=JSON.stringify(baseline),draft=intro(baseline.state);
 assert.equal(draft.actor.id,'NPC-008');
 assert.deepEqual(draft.actor.knowledge,[]);
 assert.deepEqual(draft.review.initial_knowledge.map(x=>x.fact),[testimony]);
 assert.equal(JSON.stringify(baseline),before);
 assert.equal(Object.hasOwn(baseline.state.world.actors,'NPC-008'),false);
});

test('one synthetic turn admits an NPC with owned knowledge event and no disclosure',()=>{
 const before=JSON.stringify(baseline),after=first();
 assert.equal(verifyNarrativeSnapshot(after),true);
 assert.equal(after.manifest.last_completed_turn,10);
 assert.equal(after.manifest.last_event_sequence,31);
 assert.deepEqual(after.events.events.slice(-2).map(x=>x.kind),
  ['player_action','npc_introduction']);
 const birth=after.events.events.at(-1),newActor=after.state.world.actors['NPC-008'];
 assert.deepEqual(birth.actor_ids,['NPC-008']);
 assert.deepEqual(birth.known_to,['NPC-008']);
 assert.equal(birth.state_changes[0].field,'npc_introduction');
 assert.equal(birth.state_changes[0].before,null);
 assert.equal(birth.state_changes[1].field,'knowledge');
 assert.equal(birth.state_changes[1].actor_id,'NPC-008');
 assert.equal(birth.state_changes[1].after,newActor.knowledge[0]);
 assert.ok(newActor.knowledge[0].includes('EV-000031'));
 assert.ok(!after.chapter.includes(testimony));
 assert.ok(!after.chapter.includes(birth.outcome));
 assert.ok(!after.transcript.entries.at(-1).text.includes(testimony));
 assert.equal(verifyNPCIntroductionHistory(after).size,1);
 assert.equal(verifySealedNPCKnowledge(after),true);
 assert.equal(JSON.stringify(baseline),before);
});

test('a second admission uses a new identity and correct later event sequence',()=>{
 const one=first(),two=stage(one,[intro(one.state,'NPC-009')],
  'synthetic-npc-introduction-turn-002');
 assert.equal(two.manifest.last_completed_turn,11);
 assert.equal(two.manifest.last_event_sequence,33);
 assert.deepEqual([...verifyNPCIntroductionHistory(two).keys()],['NPC-008','NPC-009']);
 assert.equal(two.state.world.actors['NPC-009'].knowledge.length,1);
 assert.equal(verifyNarrativeSnapshot(two),true);
});

test('an existing offscreen NPC resolution remains correctly sequenced after admission',()=>{
 const proposed=intro(baseline.state);
 const result=stage(baseline,[proposed],'synthetic-npc-introduction-and-old-NPC',
  {npcResolutions:[{actor_id:'NPC-005',reviewed:true,resolved:true,
   causal_basis:'Synthetic existing clockmaker continues her usual private task.',
   outcome:'The synthetic clockmaker notes an ordinary checked timepiece.',
   changes:[],disclosures:[]}]});
 assert.equal(result.manifest.last_event_sequence,32);
 assert.deepEqual(result.events.events.slice(-3).map(x=>x.actor_ids[0]),
  ['PLAYER-001','NPC-008','NPC-005']);
 assert.equal(result.events.events.at(-1).id,'EV-000032');
 assert.equal(verifyNarrativeSnapshot(result),true);
});

test('invalid or reused NPC identity is rejected at proposal stage',()=>{
 assert.throws(()=>intro(baseline.state,'NPC-007'),/next unused stable actor ID/);
 assert.throws(()=>intro(baseline.state,'NPC-010'),/next unused stable actor ID/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{reviewed:false}),
  /explicit editorial review/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{actor:{...actor(),age:-3}}),
  /identity, description/);
});

test('NPC admission needs a named, co-located witness and real admitted location',()=>{
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  observation:observation('NPC-999')}),/existing observer/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  observation:observation('PLAYER-001')}),/co-located existing observer/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  actor:actor('NPC-008','LOC-UNKNOWN')}),/identity, description/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  observation:{...observation(),confirmed_by_reviewer:false}}),
  /reviewed current-turn evidence/);
});

test('knowledge without direct provenance or too many facts cannot enter an actor',()=>{
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  initialKnowledge:[{fact:'An unsupported statement',source:'?' }]
 }),/bounded, sourced/);
 assert.throws(()=>intro(baseline.state,'NPC-008',{
  initialKnowledge:Array.from({length:4},(_,i)=>({
   fact:'Synthetic different fact number '+i,
   source:'Synthetic direct checked record number '+i
  }))}),/bounded, sourced/);
});

test('staging rejects forged profile and additional unreviewed actor fields',()=>{
 const proposal=intro(baseline.state);
 proposal.actor.resources.cash=100000;
 assert.throws(()=>stage(baseline,[proposal],
  'synthetic-npc-introduction-forged-001'),/changed after editorial review/);
 const hidden=intro(baseline.state);
 hidden.actor.secret_abilities=['invented'];
 assert.throws(()=>stage(baseline,[hidden],
  'synthetic-npc-introduction-forged-002'),/changed after editorial review/);
});

test('a forged roster without an introduction event fails snapshot verification',()=>{
 const forged=structuredClone(first());
 forged.state.world.actors['NPC-009']=structuredClone(forged.state.world.actors['NPC-008']);
 forged.state.world.actors['NPC-009'].id='NPC-009';
 assert.throws(()=>verifyNarrativeSnapshot(forged),
  /NPC actor roster has unsourced additions or removals/);
});

test('missing event, changed initial identity or forged observer are rejected',()=>{
 const after=first();
 const cases=[
  x=>{x.events.events.at(-1).kind='independent_actor'},
  x=>{x.events.events.at(-1).state_changes[0].after.name='Falsified name'},
  x=>{x.events.events.at(-1).state_changes[0].review.observation.observer_actor_id='NPC-999'}
 ];
 for(const change of cases){
  const forged=structuredClone(after);change(forged);
  assert.throws(()=>verifyNarrativeSnapshot(forged));
 }
});

test('new NPC identity and knowledge persist across a closed chapter',()=>{
 const one=first(),closed=close(one);
 assert.equal(closed.manifest.chapter_id,'CH-001');
 assert.equal(verifyNarrativeSnapshot(closed),true);
 assert.equal(closed.archives['CH-000'].events.events.at(-1).kind,'npc_introduction');
 const next=stage(closed,[],'synthetic-npc-introduction-next-chapter');
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.deepEqual([...verifyNPCIntroductionHistory(next).keys()],['NPC-008']);
 assert.equal(allEvents(next).filter(x=>x.kind==='npc_introduction').length,1);
 assert.equal(next.state.world.actors['NPC-008'].knowledge.length,1);
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('admitted NPC can later share sourced testimony without automatic player knowledge',()=>{
 const prior=first(),witness=prior.state.world.actors['NPC-008'];
 const contacts=draftReviewedSocialContact({state:prior.state,reviewed:true,
  interactionId:'SOC-NEW-NPC-EXCHANGE-001',
  participantIds:['NPC-006','NPC-008'],
  observation:{kind:'current_turn_observation',
   fact:'Synthetic Sera and Noah discuss the public inventory at the commercial counter.',
   causal_source:'A synthetic privately reviewed co-located second-turn exchange.',
   observer_actor_id:'NPC-006',confirmed_by_reviewer:true},
  relationshipUpdates:[],
  knowledgeTransfer:{speaker_id:'NPC-008',recipient_id:'NPC-006',
   known_entry:witness.knowledge[0]},
  outcomes:{
   'NPC-008':'Sera reports one observed delivery statement in a private exchange.',
   'NPC-006':'Noah accepts a reported statement without independent verification.'
  }});
 const after=stageLivingWorldTurn({snapshot:prior,observedHead:head,
  turn:turn('synthetic-npc-introduction-social-later',[]),
  npcResolutions:contacts});
 assert.equal(verifyNarrativeSnapshot(after),true);
 assert.equal(after.manifest.last_completed_turn,11);
 assert.equal(after.events.events.filter(x=>x.social_context).length,2);
 assert.ok(after.state.world.actors['NPC-006'].knowledge.at(-1).includes('Reported by NPC-008'));
 assert.ok(!after.chapter.includes(witness.knowledge[0]));
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('a private new NPC result cannot be copied directly into visible narration',()=>{
 const proposal=intro(baseline.state);
 assert.throws(()=>stageLivingWorldTurn({snapshot:baseline,observedHead:head,
  turn:turn('synthetic-npc-introduction-private-leak',[proposal],{
   narration_messages:[proposal.outcome]}),npcResolutions:[]}),
  /Private NPC introduction information leaked/);
});

test('admission is limited to one actor per reviewed player turn',()=>{
 assert.throws(()=>stage(baseline,[intro(baseline.state),intro(baseline.state)],
  'synthetic-npc-introduction-double'),/Only one separately reviewed NPC|At most one reviewed/);
});

test('baseline checkpoint still has only seven original NPCs and all legacy events',()=>{
 assert.equal(Object.keys(baseline.state.world.actors).length,7);
 assert.equal(baseline.manifest.last_completed_turn,9);
 assert.equal(verifyNPCIntroductionHistory(baseline).size,0);
 assert.equal(verifyNarrativeSnapshot(baseline),true);
});

test('historical witness co-location remains valid after the witness later travels',()=>{
 const admitted=first();
 const moved=stageLivingWorldTurn({snapshot:admitted,observedHead:head,
  turn:turn('synthetic-npc-witness-travels-later',[]),
  npcResolutions:[{actor_id:'NPC-006',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC confirmed movement to a neighboring repair counter.',
   outcome:'The shopkeeper walks from the district to his own repair counter.',
   changes:[{field:'location_id',before:location,
    after:'LOC-MARKET-NOAH-REPAIR',
    route:[location,'LOC-MARKET-NOAH-REPAIR'],
    travel:{mode:'walk',elapsed_minutes:8,
     basis:'Synthetic observed short trip along the known market connection.'}}],
   disclosures:[]}]});
 assert.equal(moved.state.world.actors['NPC-006'].location_id,'LOC-MARKET-NOAH-REPAIR');
 assert.equal(moved.state.world.actors['NPC-008'].location_id,location);
 assert.equal(verifyNPCIntroductionHistory(moved).size,1);
 assert.equal(verifyNarrativeSnapshot(moved),true);
});

test('final actor name and goal cannot diverge without authored lifecycle events',()=>{
 const checkpoint=first(),forged=structuredClone(checkpoint);
 forged.state.world.actors['NPC-008'].name='SYNTHETIC retroactive replacement';
 assert.throws(()=>verifyNPCIntroductionHistory(forged),
  /NPC initial identity diverged without an authored update/);
 const changed=structuredClone(checkpoint);
 changed.state.world.actors['NPC-008'].goal='Invented new objective without causal event.';
 assert.throws(()=>verifyNarrativeSnapshot(changed),
  /NPC initial identity diverged without an authored update/);
});
