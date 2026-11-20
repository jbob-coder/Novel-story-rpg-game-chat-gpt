// Selective PR #15 workflows on the admitted map; every event here is synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageNarrativeTurn,verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {applyStateChanges} from '../tools/state_changes.mjs';
import {stageNarratorScene} from '../tools/narrative_archive.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {ESTABLISHED_SERVICE_WORKFLOWS,draftReviewedServiceOpening,
 draftReviewedServiceStep,inspectEstablishedServices,reviewServiceCases,
 assertServiceNarrationPrivacy} from '../tools/meridian_bay_services.mjs';

const originals=Object.fromEntries(savePaths('CH-000').map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const initial=()=>decodeFiveFiles(originals,'CH-000'),head='a'.repeat(40);
const mara='NPC-007',serviceId='BAY-SVC-BRUMA-ACCOUNTS',caseId='CASE-QA-MARA-SERVICE';
const privateSummary='SYNTHETIC PRIVATE: compare the handwritten cash record before filing.';
const observation=fact=>({kind:'current_turn_observation',observer_actor_id:mara,
 confirmed_by_reviewer:true,fact,
 causal_source:'SYNTHETIC: Mara examines the paperwork herself during this interval.'});
const opening=(state,ev='EV-000031',extra={})=>draftReviewedServiceOpening({
 state,actorId:mara,serviceId,caseId,eventId:ev,summary:privateSummary,
 observation:observation('SYNTHETIC: handwritten entries await a manual comparison.'),
 reviewed:true,elapsedMinutes:5,...extra});
const event=(id,minutes=15)=>({id,actor_ids:[mara],turn:10,day:-29,
 turn_elapsed_minutes:minutes,state_changes:[]});
const turn=(snapshot,key)=>({key:'synthetic-service-'+key,
 player_text:'SYNTHETIC: continue a stationary inspection.',
 intent:'A chosen synthetic inspection interval.',outcome:'The interval ends quietly.',
 narration_messages:['SYNTHETIC: afternoon light has not yet reached the workbench.'],
 elapsed_days:0,elapsed_minutes:15,next_time_of_day:'morning'});
function stage(snapshot,changes,key){
 return stageLivingWorldTurn({snapshot,observedHead:head,turn:turn(snapshot,key),
  npcResolutions:[{actor_id:mara,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC: Mara reviews an existing work responsibility.',
   outcome:'SYNTHETIC: private paperwork status changes.',changes}]});
}
function opened(){const snapshot=initial();return stage(snapshot,[opening(snapshot.state)],'open');}
const nextEvent=s=>'EV-'+String(s.manifest.last_event_sequence+2).padStart(6,'0');
const step=(snapshot,extra={})=>draftReviewedServiceStep({state:snapshot.state,actorId:mara,
 caseId,eventId:nextEvent(snapshot),action:'SYNTHETIC: compare the next group of handwritten entries.',
 result:'SYNTHETIC: the comparison still needs another supporting slip.',
 observation:observation('SYNTHETIC: Mara observes an unchecked entry in the paperwork.'),
 reviewed:true,elapsedMinutes:5,...extra});
const closure=(ev,status='temporarily_closed')=>({operating_status:status,
 physical_condition:'unknown',opening_hours:null,
 note:'SYNTHETIC: public work in the café is temporarily interrupted.',last_change_event_id:ev});

test('three known functions remain distinct from opening hours, shifts and new businesses',()=>{
 const s=initial(),before=JSON.stringify(s);
 assert.equal(ESTABLISHED_SERVICE_WORKFLOWS.length,3);
 const rows=inspectEstablishedServices({state:s.state});
 assert.equal(rows.length,3);assert.ok(rows.every(x=>x.serviceNow==='unknown'));
 assert.ok(rows.every(x=>!x.verifiedActiveNow&&x.openingHours===null));
 assert.ok(!rows.some(x=>x.actor_id==='NPC-006'));
 const report=inspectLivingWorld({snapshot:s,elapsedMinutes:15});
 assert.ok(!JSON.stringify(playerVisibleDiagnostic(report)).includes(serviceId));
 assert.deepEqual(reviewServiceCases({state:s.state}),[]);
 assert.equal(JSON.stringify(s),before);
});

test('opening requires a present owner, available resource, reviewed observation and positive time',()=>{
 const s=initial(),original=JSON.stringify(s);
 for(const extra of [{reviewed:false},{elapsedMinutes:0},{elapsedMinutes:undefined},
  {linkedNeedId:'NEED-NOT-RECORDED'},
  {observation:{...observation('SYNTHETIC: another actor supplied this note.'),observer_actor_id:'NPC-006'}}])
  assert.throws(()=>opening(s.state,'EV-000031',extra));
 const absent=structuredClone(s.state);absent.world.actors[mara].location_id='LOC-COMMERCIAL-DISTRICT';
 assert.throws(()=>opening(absent),/present/);
 for(const value of [null,false,'']){
  const missing=structuredClone(s.state);missing.world.actors[mara].resources.register=value;
  assert.throws(()=>opening(missing),/resource/);
 }
 assert.equal(JSON.stringify(s),original);
});

test('raw typed service effects cannot bypass draft authorization and failed batches are atomic',()=>{
 const source=initial(),change=opening(source.state);
 for(const mutate of [
  c=>{delete c.review},c=>{c.review.confirmed_by_reviewer=false},
  c=>{c.review.elapsed_minutes=16},c=>{c.review.observer_actor_id='NPC-006'}
 ]){
  const state=structuredClone(source.state),record=event('EV-000031'),bad=structuredClone(change);
  mutate(bad);const before=JSON.stringify(state);
  assert.throws(()=>applyStateChanges(state,record,[
   {field:'conditions',before:state.world.actors[mara].conditions??[],after:['SYNTHETIC prior effect']},bad]));
  assert.equal(JSON.stringify(state),before);assert.deepEqual(record.state_changes,[]);
 }
 const state=structuredClone(source.state);state.world.actors[mara].location_id='LOC-COMMERCIAL-DISTRICT';
 assert.throws(()=>applyStateChanges(state,event('EV-000031'),[change]),/present/);
});

test('recorded closure overrides claimed service availability and prevents material work',()=>{
 const source=initial();source.state.world.location_states={
  'LOC-CAFE-BRUMA':closure('EV-000029')};
 const row=inspectEstablishedServices({state:source.state,serviceId,
  exceptions:{[serviceId]:{status:'open',reason:'Synthetic contradictory service hint.'}}})[0];
 assert.equal(row.serviceNow,'closed');assert.equal(row.availabilitySource,'recorded_location_closure');
 assert.throws(()=>opening(source.state),/closure/);
 const current=opened(),ev=nextEvent(current);
 const shut=stage(current,[{field:'location_state',location_id:'LOC-CAFE-BRUMA',before:null,
  after:closure(ev)}],'closure');
 assert.throws(()=>step(shut),/closure/);
 const interruption=step(shut,{status:'blocked',blockers:['SYNTHETIC: café work is paused.']});
 const blocked=stage(shut,[interruption],'blocked');
 assert.equal(blocked.state.world.actors[mara].service_cases[0].status,'blocked');
 assert.equal(verifyNarrativeSnapshot(blocked),true,
  'Historical work before closure stays valid while later work is blocked');
});

test('truthful blocked or cancelled notes can persist when the actor can no longer perform work',()=>{
 let current=opened(),ev=nextEvent(current);
 const changedResources={...current.state.world.actors[mara].resources,register:null};
 const missing=stage(current,[{field:'resources',before:current.state.world.actors[mara].resources,
  after:changedResources}], 'lost-resource');
 assert.throws(()=>step(missing),/resource/);
 const blocked=step(missing,{status:'blocked',blockers:['SYNTHETIC: the source record is unavailable.']});
 current=stage(missing,[blocked],'resource-blocker');
 assert.equal(verifyNarrativeSnapshot(current),true);
 const cancelled=step(current,{status:'cancelled',
  resolution:'SYNTHETIC: this attempt is cancelled until a new responsibility is established.'});
 current=stage(current,[cancelled],'cancel');
 assert.equal(current.state.world.actors[mara].service_cases[0].status,'cancelled');
 assert.throws(()=>step(current),/Closed/);
});

test('service outcomes remain event-backed and do not repair the resource or notify Jack',()=>{
 const start=initial(),open=opened();
 const result=stage(open,[step(open,{status:'resolved',blockers:[],
  result:'SYNTHETIC: the handwritten record is reconciled.',
  resolution:'SYNTHETIC: only the paperwork comparison is complete.'})],'resolved');
 const restored=decodeFiveFiles(encodeFiveFiles(result),'CH-000');
 assert.deepEqual(restored.state.world.actors[mara].resources,start.state.world.actors[mara].resources);
 assert.deepEqual(restored.state.player,start.state.player);
 assert.ok(!restored.chapter.includes(privateSummary));
 assert.equal(restored.state.world.actors[mara].service_cases[0].steps.length,1);
 const leaked=structuredClone(restored);
 leaked.events.events.at(-1).state_changes.find(c=>c.field==='service_cases').review.fact=
  'SYNTHETIC: forged observation unrelated to the recorded step.';
 assert.throws(()=>verifyNarrativeSnapshot(leaked),/observation|evidence/);
});

test('private service metadata is blocked at both narration entry points',()=>{
 const s=opened();
 for(const text of [privateSummary,caseId]){
  assert.throws(()=>assertServiceNarrationPrivacy(s.state,[text]),/Private NPC service/);
  assert.throws(()=>stageNarratorScene(s,text,'synthetic-service-leak',{
   observed_head:head,previous_attempt:null}),/Private NPC service/);
  assert.throws(()=>stageLivingWorldTurn({snapshot:s,observedHead:head,
   turn:{...turn(s,'leak'),narration_messages:[text]}}),/Private NPC service/);
 }
});

test('service duration cannot be evaded by splitting one actor into multiple events',()=>{
 const s=initial();
 const first=opening(s.state,'EV-000031',{elapsedMinutes:10});
 const laterState=structuredClone(s.state);laterState.world.actors[mara].service_cases=first.after;
 const second=opening(laterState,'EV-000032',{caseId:'CASE-QA-MARA-SECOND',elapsedMinutes:10});
 assert.throws(()=>stageNarrativeTurn(s,{...turn(s,'split-time'),
  save_guard:{observed_head:head,previous_attempt:null},
  offscreen:[{actor_id:mara,intent:'SYNTHETIC first comparison.',
   outcome:'SYNTHETIC first case opened.',changes:[first]},
  {actor_id:mara,intent:'SYNTHETIC second comparison.',
   outcome:'SYNTHETIC second case opened.',changes:[second]}]}),/exceed turn duration/);
});

test('recovery rejects an NPC event and review that jointly enlarge the player interval',()=>{
 const s=opened(),npc=s.events.events.at(-1);
 npc.turn_elapsed_minutes=30;
 npc.state_changes.find(c=>c.field==='service_cases').review.elapsed_minutes=30;
 assert.equal(s.events.events.at(-2).turn_elapsed_minutes,15);
 assert.throws(()=>verifyNarrativeSnapshot(s),/authorized turn duration/);
});

test('work and travel share the same actor interval even when movement follows work',()=>{
 const s=initial(),openingChange=opening(s.state,'EV-000031',{elapsedMinutes:10});
 assert.throws(()=>stage(s,[openingChange,{field:'location_id',before:'LOC-CAFE-BRUMA',
  after:'LOC-COMMERCIAL-DISTRICT',route:['LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT'],
  travel:{mode:'walking',elapsed_minutes:10,
   basis:'SYNTHETIC: ordinary movement from the café entrance into Market Row.'}}],'work-travel'),/exceed turn duration/);
});

test('canonical checkpoint files remain byte-identical after service QA',()=>{
 for(const [path,text] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),text);
});
