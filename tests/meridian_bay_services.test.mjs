import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ESTABLISHED_SERVICE_WORKFLOWS,inspectEstablishedServices,
 reviewServiceCases,validateNPCServiceCases,validateNPCServiceCaseChange,
 draftReviewedServiceOpening,draftReviewedServiceStep}
 from '../tools/meridian_bay_services.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {verifyStateChanges} from '../tools/state_changes.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {assessNPCDecisions} from '../tools/living_world_decisions.mjs';
import {selectRelevantNPCs} from '../tools/living_world_commitments.mjs';
import {inspectMeridianBay} from '../tools/meridian_bay_city.mjs';
import {draftReviewedNeedIntroduction} from '../tools/living_world_needs.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>readFileSync(resolve(root,p),'utf8');
const baseline={
 state:JSON.parse(load('game/STATE.json')),
 manifest:JSON.parse(load('game/SAVE_MANIFEST.json')),
 events:JSON.parse(load('chapters/CH-000.events.json')),
 transcript:JSON.parse(load('chapters/CH-000.transcript.json')),
 chapter:load('chapters/CH-000.md')
};
const state=baseline.state;
const svc=ESTABLISHED_SERVICE_WORKFLOWS;
const caseIds=['CASE-TERMINAL_QA_01','CASE-PLAZA_QA_02','CASE-BRUMA_QA_03'];
const observe=(actorId,detail='reviews a pre-existing routine task at the established workplace')=>({
 kind:'current_turn_observation',
 fact:`${actorId} ${detail} during a synthetic, reviewed story interval.`,
 causal_source:'Synthetic, directly observed workplace action in the new fictional turn.',
 observer_actor_id:actorId,confirmed_by_reviewer:true
});
const opening=(source,idx,eventId,extras={})=>draftReviewedServiceOpening({
 state:source,actorId:svc[idx].actor_id,serviceId:svc[idx].id,
 caseId:caseIds[idx],eventId,summary:[
  'Review terminal dispatch notes without assuming a current departure',
  'Review a work order in the established Crosswater plaza',
  'Review the handwritten café sales without claiming the cash register was repaired'
 ][idx],observation:observe(svc[idx].actor_id),reviewed:true,...extras
});
const step=(source,idx,eventId,extras={})=>draftReviewedServiceStep({
 state:source,actorId:svc[idx].actor_id,caseId:caseIds[idx],
 eventId,
 action:'Review the recorded task before choosing the next work step.',
 result:'The task remains under explicit review; no automatic completion.',
 observation:observe(svc[idx].actor_id),reviewed:true,...extras
});
const resolution=(actorId,effect,description='The NPC privately reviews a practical workplace detail.')=>({
 actor_id:actorId,reviewed:true,resolved:true,causal_basis:
 'Observed routine workplace decision with recorded resources and location.',
 outcome:description,changes:[effect]});
const turn=n=>({
 key:`synthetic-service-qa-${String(n).padStart(3,'0')}`,
 intent:'Jack continues inspecting an inactive Aster component.',
 outcome:'A quiet interval passes at the workbench.',
 player_text:'I inspect the unfinished component.',
 narration_messages:['The workbench remains quiet as Jack works.'],
 elapsed_days:0,elapsed_minutes:25
});
const stage=(snapshot,number,effects)=>stageLivingWorldTurn({
 snapshot,turn:turn(number),observedHead:'a'.repeat(40),
 npcResolutions:effects
});
const first=()=>stage(baseline,10,[
 resolution(svc[0].actor_id,opening(state,0,'EV-000031')),
 resolution(svc[1].actor_id,opening(state,1,'EV-000032')),
 resolution(svc[2].actor_id,opening(state,2,'EV-000033'))
]);

test('three known service functions reuse existing workplaces, not new invented locations',()=>{
 const before=JSON.stringify(baseline);
 const all=inspectEstablishedServices({state});
 assert.equal(all.length,3);
 assert.equal(new Set(all.map(s=>s.location_id)).size,3);
 assert.ok(all.every(s=>Object.hasOwn(state.world.locations,s.location_id)));
 assert.ok(all.every(s=>s.classification==='established_function_not_a_confirmed_shift'&&
  s.actorPresentAtAnchor===true&&s.actorResourceRecorded===true&&
  s.serviceNow==='unknown'&&s.openingHours===null&&
  s.travelMinutes===null&&s.verifiedActiveNow===false));
 assert.equal(Object.keys(state.world.locations).length,9);
 const proposed=inspectMeridianBay({state});
 assert.equal(proposed.areas.flatMap(a=>a.opportunities).length,18);
 const catalog=proposed.areas.flatMap(a=>a.opportunities);
 assert.equal(catalog.filter(x=>x.status==='prebuilt_world').length,6);
 assert.equal(catalog.filter(x=>x.status==='proposed_not_canon').length,12);
 assert.ok(catalog.filter(x=>x.status==='prebuilt_world').every(x=>
  x.locationId?.startsWith('LOC-')&&x.openingHours===null));
 assert.ok(catalog.filter(x=>x.status==='proposed_not_canon').every(x=>
  x.locationId===null));
 assert.equal(JSON.stringify(baseline),before);
});
test('confirmed service exception is acknowledged, but missing schedule stays unknown',()=>{
 const closed=inspectEstablishedServices({state,serviceId:svc[2].id,
  exceptions:{[svc[2].id]:{confirmed:true,status:'closed'}}});
 assert.equal(closed[0].serviceNow,'closed');
 const unknown=inspectEstablishedServices({state,serviceId:svc[2].id,
  schedules:{[svc[2].id]:{confirmed:false}}});
 assert.equal(unknown[0].serviceNow,'unknown');
});
test('wrong actor, missing resource and unknown workplace cannot create a case',()=>{
 assert.throws(()=>draftReviewedServiceOpening({state,actorId:'NPC-004',
  serviceId:svc[0].id,caseId:'CASE-WRONG_001',eventId:'EV-000031',
  summary:'Invented service assignment with no recorded authority',
  observation:observe('NPC-004'),reviewed:true}),/not established/);
 const lacking=structuredClone(state);
 delete lacking.world.actors['NPC-001'].resources.work_authority;
 assert.throws(()=>opening(lacking,0,'EV-000031'),/not established/);
 const moved=structuredClone(state);
 moved.world.actors['NPC-001'].location_id='LOC-HARBOR-WALK';
 assert.throws(()=>opening(moved,0,'EV-000031'),
  /actor present at its established anchor/);
 assert.throws(()=>inspectEstablishedServices({state,serviceId:'BAY-SVC-INVENTED'}),
  /Unknown established service/);
});
test('a proposed service needs an explicit actor observation, not mere elapsed time',()=>{
 assert.deepEqual(reviewServiceCases({state}),[]);
 assert.throws(()=>opening(state,0,'EV-000031',{reviewed:false}),
  /reviewed current-turn observation/);
 assert.throws(()=>opening(state,0,'EV-000031',{
  observation:{...observe('NPC-001'),observer_actor_id:'NPC-007'}
 }),/reviewed current-turn observation/);
 assert.throws(()=>opening(state,0,'EV-000031',{
  observation:{...observe('NPC-001'),confirmed_by_reviewer:false}
 }),/reviewed current-turn observation/);
});
test('one synthetic turn opens three distinct cases with actor-owned event references',()=>{
 const before=JSON.stringify(baseline);
 const next=first();
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.equal(next.manifest.last_completed_turn,10);
 assert.deepEqual(next.events.events.slice(-3).map(e=>e.actor_ids[0]),
  ['NPC-001','NPC-002','NPC-007']);
 assert.deepEqual(next.events.events.slice(-3).map(e=>e.id),
  ['EV-000031','EV-000032','EV-000033']);
 for(let i=0;i<3;i++){
  const actor=next.state.world.actors[svc[i].actor_id];
  assert.equal(actor.service_cases.length,1);
  assert.equal(actor.service_cases[0].source_event_id,'EV-'+String(31+i).padStart(6,'0'));
  assert.deepEqual(actor.service_cases[0].steps,[]);
 }
 assert.equal(JSON.stringify(baseline),before);
});
test('blocked maintenance remains pending; delay is not success nor automatic failure',()=>{
 const prev=first();
 const actor='NPC-002';
 const blocker='An independent follow-up observation remains unavailable';
 const change=step(prev.state,1,'EV-000035',{
  status:'blocked',blockers:[blocker],
  result:'The maintenance check cannot be completed without a recorded follow-up.'
 });
 const next=stage(prev,11,[resolution(actor,change)]);
 assert.equal(verifyNarrativeSnapshot(next),true);
 const open=reviewServiceCases({state:next.state,actorIds:[actor]});
 assert.equal(open.length,1);
 assert.equal(open[0].review,'blocked');
 assert.deepEqual(open[0].blockers,[blocker]);
 assert.equal(next.state.world.actors[actor].service_cases[0].resolution,null);
 assert.equal(next.state.world.actors[actor].service_cases[0].steps.length,1);
 assert.equal(next.state.world.actors[actor].location_id,'LOC-CROSSWATER-PLAZA');
});
test('a following synthetic turn can resolve handwritten sales review without repairing register',()=>{
 const prev=first();
 const actor='NPC-007';
 const change=step(prev.state,2,'EV-000035',{
  action:'Review the manual record from the earlier café sale.',
  result:'The existing handwritten entry is reconciled for this review.',
  status:'resolved',blockers:[],
  resolution:'Only review of this saved manual entry is closed; register condition remains unknown.'
 });
 const next=stage(prev,11,[resolution(actor,change,
  'Mara confirms an existing handwritten sales entry in a reviewed QA scene.')]);
 assert.equal(verifyNarrativeSnapshot(next),true);
 const caseRecord=next.state.world.actors[actor].service_cases[0];
 assert.equal(caseRecord.status,'resolved');
 assert.equal(caseRecord.resolution_event_id,'EV-000035');
 assert.equal(caseRecord.steps[0].event_id,'EV-000035');
 assert.match(caseRecord.resolution,/register condition remains unknown/);
 assert.equal(next.state.world.actors[actor].resources.register,
  state.world.actors[actor].resources.register);
 assert.ok(!next.chapter.includes(caseRecord.resolution));
 assert.ok(!next.transcript.entries.at(-1).text.includes(caseRecord.resolution));
 assert.deepEqual(reviewServiceCases({state:next.state,actorIds:[actor]}),[]);
 assert.equal(baseline.manifest.last_completed_turn,9);
});
test('a case can span multiple turns without disappearing or changing its original source',()=>{
 const a=first();
 const b=stage(a,11,[resolution('NPC-001',step(a.state,0,'EV-000035'))]);
 const c=stage(b,12,[resolution('NPC-001',step(b.state,0,'EV-000037',{
  status:'resolved',
  action:'Confirm a reviewed dispatch note with an established outcome.',
  result:'The case review can end without asserting the train departed.',
  resolution:'Terminal note review concluded; actual departure remains unestablished.'
 }))]);
 assert.equal(verifyNarrativeSnapshot(c),true);
 const record=c.state.world.actors['NPC-001'].service_cases[0];
 assert.deepEqual(record.steps.map(s=>s.event_id),['EV-000035','EV-000037']);
 assert.equal(record.source_event_id,'EV-000031');
 assert.equal(record.last_change_event_id,'EV-000037');
 assert.equal(record.status,'resolved');
 assert.equal(c.manifest.last_completed_turn,12);
});
test('cannot claim a completed case without an actual result or reopen a closed case',()=>{
 const a=first();
 assert.throws(()=>step(a.state,0,'EV-000035',{
  status:'resolved',resolution:null}),/Closed service case requires documented outcome/);
 const completed=stage(a,11,[resolution('NPC-001',step(a.state,0,'EV-000035',{
  status:'resolved',
  resolution:'A bounded review of recorded departure notes was completed.'
 }))]);
 assert.throws(()=>step(completed.state,0,'EV-000037'),
  /Closed service cases cannot reopen or be rewritten/);
 const saved=completed.state.world.actors['NPC-001'].service_cases;
 const deleted=[];
 assert.throws(()=>validateNPCServiceCaseChange({before:saved,after:deleted,
  actorId:'NPC-001',locations:completed.state.world.locations,
  eventId:'EV-000037'}),/cannot be deleted/);
});
test('case records cannot invent a recipient, prior event or duplicate id globally',()=>{
 const a=first(),original=a.state.world.actors['NPC-001'].service_cases;
 const bad=structuredClone(a);
 bad.state.world.actors['NPC-001'].service_cases[0].source_event_id='EV-999999';
 assert.throws(()=>verifyStateChanges(bad),/unknown event/);
 const duplicate=structuredClone(a);
 duplicate.state.world.actors['NPC-002'].service_cases[0].id=caseIds[0];
 assert.throws(()=>verifyStateChanges(duplicate),/Duplicate service case ID across NPCs/);
 assert.throws(()=>opening(a.state,0,'EV-000035',{linkedNeedId:'NEED-FAKE_001'}),
  /nonexistent NPC need/);
 const injected=structuredClone(original);
 injected[0].service_id='BAY-SVC-UNCONFIRMED';
 assert.throws(()=>validateNPCServiceCases(injected,{
  actorId:'NPC-001',locations:a.state.world.locations
 }),/unestablished service/);
});
test('case preconditions are atomic across a failing later effect',async()=>{
 const a=first(),current=structuredClone(a.state);
 const baselineValue=JSON.stringify(current);
 const record={id:'EV-000035',actor_ids:['NPC-001'],state_changes:[]};
 const originalStep=step(current,0,'EV-000035');
 const {applyStateChanges}=await import('../tools/state_changes.mjs');
 assert.throws(()=>applyStateChanges(current,record,[originalStep,{
  field:'service_cases',before:[],after:originalStep.after
 }]),/Stale NPC service cases/);
 assert.equal(JSON.stringify(current),baselineValue);
 assert.deepEqual(record.state_changes,[]);
});
test('service cases are private, while urgent recorded work can inform NPC attention',()=>{
 const a=first(),d=inspectLivingWorld({snapshot:a,
  actorIds:['NPC-001','NPC-002','NPC-007'],elapsedMinutes:25});
 assert.equal(d.establishedServices.length,3);
 assert.equal(d.serviceCaseReview.length,3);
 assert.ok(d.causalDecisionAssessments.some(x=>
  x.competingServiceCases.length===1));
 const safe=playerVisibleDiagnostic(d);
 assert.equal('establishedServices' in safe,false);
 assert.equal('serviceCaseReview' in safe,false);
 assert.equal('competingServiceCases' in safe,false);
 assert.equal(JSON.stringify(safe).includes('CASE-TERMINAL_QA_01'),false);
 const state2=structuredClone(a.state),caseRec=state2.world.actors['NPC-002'].service_cases[0];
 caseRec.priority='urgent';caseRec.due_day=-30;
 const chosen=selectRelevantNPCs({state:state2,limit:1});
 assert.equal(chosen[0],'NPC-002');
});
test('a service case may cite an existing, explicitly documented NPC need',()=>{
 const need={
  id:'NEED-TRANSIT_WORK_001',domain:'livelihood',
  summary:'Review previously established dispatch demands without assuming an actual departure',
  priority:'normal',status:'active',due_day:null,
  blockers:[],resource_keys:['work_authority']
 };
 const firstNeed=draftReviewedNeedIntroduction({
  state,actorId:'NPC-001',eventId:'EV-000031',
  need,observation:observe('NPC-001'),reviewed:true
 });
 const previous=stage(baseline,10,[resolution('NPC-001',firstNeed)]);
 const open=opening(previous.state,0,'EV-000033',{linkedNeedId:need.id});
 const next=stage(previous,11,[resolution('NPC-001',open)]);
 assert.equal(verifyNarrativeSnapshot(next),true);
 const record=next.state.world.actors['NPC-001'].service_cases[0];
 assert.equal(record.linked_need_id,need.id);
 const review=inspectEstablishedServices({state:next.state,actorIds:['NPC-001']});
 assert.deepEqual(review[0].pendingNeeds.map(n=>n.id),[need.id]);
 assert.equal(baseline.state.world.actors['NPC-001'].needs,undefined);
});
