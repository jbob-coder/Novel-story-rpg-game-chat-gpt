import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateNPCNeeds,validateNPCNeedChange,reviewNPCNeeds,
 draftReviewedNeedIntroduction,draftReviewedNeedTradeoff} from '../tools/living_world_needs.mjs';
import {selectRelevantNPCs} from '../tools/living_world_commitments.mjs';
import {assessNPCDecisions,draftReviewedNPCDecision} from '../tools/living_world_decisions.mjs';
import {applyStateChanges,verifyStateChanges} from '../tools/state_changes.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const actorId='NPC-005';
const need={
 id:'NEED-ROSA_CLOCK_TIME_001',domain:'personal',
 summary:'Coordinate a suitable later visit for the already repaired clock',
 priority:'important',status:'active',due_day:null,
 blockers:[],resource_keys:['current_repair']
};
const observe=(fact='Rosa decides to organize a later handover for the repaired clock.')=>({
 kind:'current_turn_observation',fact,
 causal_source:'Synthetic narrator-reviewed action in a fictional turn.',
 observer_actor_id:actorId,confirmed_by_reviewer:true
});
const introduction=(state=baseline.state,eventId='EV-000031')=>
 draftReviewedNeedIntroduction({state,actorId,eventId,need,observation:observe(),reviewed:true});
const tradeoff=(state,eventId='EV-000033',rest={})=>
 draftReviewedNeedTradeoff({state,actorId,needId:need.id,eventId,
 observation:observe('Rosa prepares the repaired clock and postpones a household errand.'),
 reviewed:true,
 decision:'Rosa prepares the clock for a future neighbor handover.',
 foregone:'A different ordinary household errand is postponed.',
 cost:'The unrelated errand remains incomplete for this interval.',
 ...rest});
const turn=(seq)=>({
 key:'synthetic-needs-qa-'+String(seq).padStart(3,'0'),
 intent:'Jack reviews a stationary workshop component.',
 outcome:'An interval passes without changing the Aster power system.',
 player_text:'I inspect the inactive joint.',
 narration_messages:['The workbench stays still; no offscreen detail is disclosed.'],
 elapsed_days:0,elapsed_minutes:25
});
const stage=(snapshot,seq,effect,outcome='Rosa privately considers her obligations.')=>
 stageLivingWorldTurn({snapshot,turn:turn(seq),observedHead:'a'.repeat(40),
 npcResolutions:[{
  actor_id:actorId,reviewed:true,resolved:true,
  causal_basis:'Rosa observes and evaluates her own current responsibilities.',
  outcome,changes:[effect]
 }]});
const newNeedState=()=>stage(baseline,10,introduction());

test('baseline remains unchanged: no retroactive needs or invented fatigue',()=>{
 const before=JSON.stringify(baseline);
 assert.deepEqual(reviewNPCNeeds({state:baseline.state}),[]);
 assert.ok(Object.values(baseline.state.world.actors).every(x=>x.needs===undefined));
 assert.equal(JSON.stringify(baseline),before);
});
test('an event-owned new need persists privately without triggering an errand or meeting',()=>{
 const before=JSON.stringify(baseline);
 const snapshot=newNeedState();
 assert.equal(verifyNarrativeSnapshot(snapshot),true);
 assert.equal(snapshot.manifest.last_completed_turn,10);
 assert.equal(snapshot.events.events.at(-1).id,'EV-000031');
 assert.equal(snapshot.events.events.at(-1).state_changes.at(-1).field,'needs');
 const saved=snapshot.state.world.actors[actorId].needs[0];
 assert.equal(saved.id,need.id);
 assert.equal(saved.source_event_id,'EV-000031');
 assert.equal(saved.last_change_event_id,'EV-000031');
 assert.deepEqual(saved.tradeoffs,[]);
 assert.equal(saved.resolution,null);
 assert.equal(snapshot.state.world.actors[actorId].location_id,'LOC-WILSON-APARTMENT');
 assert.equal(JSON.stringify(baseline),before);
});
test('a second synthetic event records a cost, the rejected alternative and its source',()=>{
 const first=newNeedState();
 const before=JSON.stringify(first);
 const second=stage(first,11,tradeoff(first.state),
  'Rosa prepares the clock for a future trip, and another errand remains pending.');
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(second.manifest.last_completed_turn,11);
 const saved=second.state.world.actors[actorId].needs[0];
 assert.equal(saved.tradeoffs.length,1);
 assert.equal(saved.tradeoffs[0].event_id,'EV-000033');
 assert.match(saved.tradeoffs[0].foregone,/postponed/);
 assert.match(saved.tradeoffs[0].cost,/incomplete/);
 assert.match(saved.tradeoffs[0].evidence,/prepares the repaired clock/);
 assert.equal(second.state.time.day,-29);
 assert.equal(JSON.stringify(first),before);
 assert.ok(!second.chapter.includes(saved.tradeoffs[0].decision));
 assert.ok(!second.transcript.entries.at(-1).text.includes(saved.tradeoffs[0].cost));
});
test('a third synthetic turn closes only the coordination need, preserving its history',()=>{
 const first=newNeedState();
 const second=stage(first,11,tradeoff(first.state));
 const closed=tradeoff(second.state,'EV-000035',{
  observation:observe('Rosa completes an agreed time to coordinate the later handover.'),
  decision:'Rosa confirms the possible visit arrangements with the neighbor.',
  foregone:'She chooses not to make an unplanned visit at an uncertain hour.',
  cost:'Scheduling requires her to rearrange a separate household plan.',
  status:'resolved',blockers:[],
  resolution:'The scheduling question is settled; physical handover remains pending.'
 });
 const final=stage(second,12,closed);
 assert.equal(verifyNarrativeSnapshot(final),true);
 assert.equal(final.manifest.last_completed_turn,12);
 const item=final.state.world.actors[actorId].needs[0];
 assert.equal(item.status,'resolved');
 assert.equal(item.resolution_event_id,'EV-000035');
 assert.deepEqual(item.tradeoffs.map(x=>x.event_id),['EV-000033','EV-000035']);
 assert.deepEqual(reviewNPCNeeds({state:final.state,actorIds:[actorId]}),[]);
 assert.equal(final.state.world.actors[actorId].location_id,'LOC-WILSON-APARTMENT');
});
test('blocked needs do not silently complete and an overdue need is not automatic failure',()=>{
 const first=newNeedState();
 const blocked=tradeoff(first.state,'EV-000033',{
  status:'blocked',blockers:['Neighbor availability remains unknown'],
  observation:observe('Rosa cannot confirm whether the neighbor is at home for a handover.'),
  decision:'Rosa postpones a visit until an appointment can be confirmed.',
  foregone:'She does not attempt an unconfirmed trip to the neighbor.',
  cost:'The clock remains at the Wilson apartment for now.'
 });
 const saved=stage(first,11,blocked);
 assert.equal(saved.state.world.actors[actorId].needs[0].status,'blocked');
 const today=reviewNPCNeeds({state:saved.state,actorIds:[actorId]});
 assert.equal(today[0].review,'blocked');
 const later=reviewNPCNeeds({state:saved.state,actorIds:[actorId],targetDay:-28});
 assert.equal(later[0].review,'blocked');
 assert.equal(saved.state.world.actors[actorId].needs[0].resolution,null);
});
test('future deadline and recorded urgent needs influence private priority only',()=>{
 const altered=structuredClone(baseline.state);
 altered.world.locations['LOC-ISOLATED-QA']={
  name:'Isolated synthetic location for route test',connected_ids:[]
 };
 altered.world.actors['NPC-003'].location_id='LOC-ISOLATED-QA';
 altered.world.actors['NPC-003'].needs=[{
  ...need,id:'NEED-DELIVERY_009',domain:'livelihood',
  summary:'Resolve a documented overdue courier income concern',
  status:'blocked',blockers:['An earlier handover could not be confirmed'],
  due_day:-30,priority:'urgent',resource_keys:['parcel'],
  source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  tradeoffs:[],resolution:null,resolution_event_id:null
 }];
 assert.equal(selectRelevantNPCs({state:altered,limit:1})[0],'NPC-003');
 const review=reviewNPCNeeds({state:altered,actorIds:['NPC-003']})[0];
 assert.equal(review.review,'blocked');
 assert.equal(review.priority,'urgent');
 assert.ok(!review.resolved);
});
test('recorded needs become private decision tradeoffs, not automatic costs',()=>{
 const first=newNeedState();
 const before=JSON.stringify(first);
 const assessment=assessNPCDecisions({state:first.state,actorIds:[actorId],
  elapsedMinutes:25})[0];
 assert.ok(assessment.competingNeeds.some(x=>x.needId===need.id));
 assert.equal(assessment.competingNeeds[0].domain,'personal');
 const d=inspectLivingWorld({snapshot:first,actorIds:[actorId],elapsedMinutes:25});
 assert.equal(d.qualitativeNeeds.length,1);
 const safe=playerVisibleDiagnostic(d);
 assert.equal('qualitativeNeeds' in safe,false);
 assert.equal('causalDecisionAssessments' in safe,false);
 assert.equal(JSON.stringify(first),before);
});
test('reviewed need tradeoff is compatible with existing causal resolution stage',()=>{
 const first=newNeedState();
 const assessment=assessNPCDecisions({state:first.state,actorIds:[actorId],
  elapsedMinutes:25})[0];
 const effect=tradeoff(first.state);
 const draft=draftReviewedNPCDecision({
  state:first.state,assessment,conclusion:'progress',reviewed:true,
  reasoning:'The current need and repair resources are recorded; a reviewed tradeoff was observed.',
  outcome:'Rosa organizes the clock and defers another household errand.',
  observations:[observe('Rosa prepares the repaired clock and postpones a household errand.')],
  changes:[effect]
 });
 const result=stageLivingWorldTurn({snapshot:first,turn:turn(11),
  observedHead:'a'.repeat(40),npcResolutions:[draft]});
 assert.equal(verifyNarrativeSnapshot(result),true);
 assert.equal(result.state.world.actors[actorId].needs[0].tradeoffs.length,1);
});
test('invented needs require a reviewed present-turn source, no silent backfilling',()=>{
 const wrong=structuredClone(need);
 assert.throws(()=>draftReviewedNeedIntroduction({state:baseline.state,
  actorId,eventId:'EV-000031',need:wrong,reviewed:false,observation:observe()}),
 /reviewed, attributed current-turn evidence/);
 assert.throws(()=>draftReviewedNeedIntroduction({state:baseline.state,
  actorId,eventId:'EV-000031',need:wrong,reviewed:true,
  observation:{...observe(),observer_actor_id:'NPC-003'}}),
 /reviewed, attributed current-turn evidence/);
 const change=introduction();
 const bad=structuredClone(change);
 bad.after[0].source_event_id='EV-000012';
 assert.throws(()=>validateNPCNeedChange({before:[],after:bad.after,
  eventId:'EV-000031'}),/require their own event/);
});
test('no need may silently reopen, be erased, fake a cost or rewrite past decisions',()=>{
 const first=newNeedState();
 const saved=first.state.world.actors[actorId].needs;
 assert.throws(()=>validateNPCNeedChange({before:saved,after:[],
  eventId:'EV-000033'}),/cannot silently disappear/);
 const forged=structuredClone(saved);
 forged[0].tradeoffs.push({event_id:'EV-000010',decision:'An invented choice',
  foregone:'An invented alternative',cost:'A past invented cost',
  evidence:'An invented historical observation'});
 forged[0].last_change_event_id='EV-000033';
 assert.throws(()=>validateNPCNeedChange({before:saved,after:forged,
  eventId:'EV-000033'}),/current narrative event/);
 const closed=stage(first,11,tradeoff(first.state,'EV-000033',{
  status:'resolved',resolution:'Scheduling question resolved with reviewed evidence.'
 }));
 const terminal=closed.state.world.actors[actorId].needs;
 const reopened=structuredClone(terminal);reopened[0].status='active';
 reopened[0].resolution=null;reopened[0].resolution_event_id=null;
 reopened[0].last_change_event_id='EV-000035';
 assert.throws(()=>validateNPCNeedChange({before:terminal,after:reopened,
  eventId:'EV-000035'}),/cannot reopen/);
});
test('failed multi-change batch is atomic and leaves original NPC and event unchanged',()=>{
 const first=newNeedState();
 const altered=structuredClone(first.state),before=JSON.stringify(altered);
 const record={id:'EV-000033',actor_ids:[actorId],state_changes:[]};
 const update=tradeoff(altered);
 assert.throws(()=>applyStateChanges(altered,record,[
  update,{...update,before:[]}
 ]),/Stale NPC needs/);
 assert.equal(JSON.stringify(altered),before);
 assert.deepEqual(record.state_changes,[]);
});
test('readback rejects fabricated event references and duplicate IDs across NPCs',()=>{
 const snap=newNeedState();
 const wrong=structuredClone(snap);
 wrong.state.world.actors[actorId].needs[0].source_event_id='EV-999999';
 assert.throws(()=>verifyStateChanges(wrong),/unknown narrative event/);
 const duplicate=structuredClone(snap);
 duplicate.state.world.actors['NPC-004'].needs=structuredClone(
  duplicate.state.world.actors[actorId].needs);
 assert.throws(()=>verifyStateChanges(duplicate),/Duplicate NPC need ID across actors/);
});
test('an NPC-only need effect cannot mutate Jack and invalid deadlines stay unknown',()=>{
 const save=structuredClone(baseline.state);
 const event={id:'EV-000030',actor_ids:['PLAYER-001'],state_changes:[]};
 assert.throws(()=>applyStateChanges(save,event,[{
  field:'needs',before:[],after:introduction().after
 }]),/Only NPC needs/);
 assert.throws(()=>validateNPCNeeds([{
  ...introduction().after[0],due_day:undefined
 }]),/deadline/);
 assert.deepEqual(reviewNPCNeeds({state:baseline.state,limitPerActor:0}),[]);
});
