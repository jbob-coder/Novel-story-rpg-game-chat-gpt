import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessNPCDecisions,draftReviewedNPCDecision} from '../tools/living_world_decisions.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {playerVisibleDiagnostic,inspectLivingWorld} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const state=baseline.state;
const assess=(actorId,opts={})=>assessNPCDecisions({
 state,actorIds:[actorId],elapsedMinutes:25,...opts
})[0];
const observation=(actorId)=>({
 kind:'current_turn_observation',
 fact:'The character visibly checks their existing task before continuing.',
 causal_source:'Synthetic reviewed narrative scene during fictional time advance.',
 observer_actor_id:actorId,confirmed_by_reviewer:true
});
const decision=(a,conclusion,opts={})=>draftReviewedNPCDecision({
 state,assessment:a,conclusion,reviewed:true,
 reasoning:'Reviewed existing goal, time and resources without assuming a result.',
 outcome:'The character evaluates a concrete next step without inventing a final delivery.',
 ...opts
});

test('checks only checkpoint-derived goals, resources, destinations and independent decisions',()=>{
 const before=JSON.stringify(baseline);
 const assessments=assessNPCDecisions({state,elapsedMinutes:25});
 assert.ok(assessments.length>=5);
 assert.ok(assessments.every(a=>a.classification==='narrator_private_causal_assessment'&&
  a.status==='unresolved_review_only'&&a.persisted===false&&a.knownToPlayer===false));
 assert.ok(assessments.every(a=>a.source.recordedGoal===state.world.actors[a.actorId].goal));
 assert.equal(JSON.stringify(baseline),before);
});
test('Rosa cannot claim to have handed over clock before neighbor location/contact is established',()=>{
 const a=assess('NPC-005');
 assert.equal(a.candidateId,'routine:NPC-005:clock-handover-plan');
 assert.ok(a.unknowns.some(x=>x.code==='destination_or_handover_not_established'));
 assert.ok(!a.allowedConclusions.includes('completed'));
 assert.throws(()=>decision(a,'completed',{observations:[observation('NPC-005')]}),
  /Conclusion forbidden/);
 assert.ok(a.allowedConclusions.includes('progress'));
});
test('Elena can consider school materials but a school arrival remains unsupported',()=>{
 const a=assess('NPC-004');
 assert.equal(a.candidateId,'routine:NPC-004:school-preparation');
 assert.ok(a.allowedConclusions.includes('completed'));
 assert.ok(!a.objective.toLowerCase().includes('arrival'));
 const agenda=assessNPCDecisions({state,actorIds:['NPC-004'],elapsedMinutes:25});
 assert.equal(agenda.length,1);
 assert.equal(state.world.actors['NPC-004'].location_id,'LOC-RAILGARDEN-RESIDENTIAL');
});
test('Darius has no confirmed recipient destination and cannot be marked delivered',()=>{
 const a=assess('NPC-003');
 assert.equal(a.candidateId,'routine:NPC-003:courier-plan');
 assert.equal(a.source.recordedLocationId,'LOC-COMMERCIAL-DISTRICT');
 assert.ok(a.unknowns.some(x=>x.code==='destination_or_handover_not_established'));
 assert.ok(!a.allowedConclusions.includes('completed'));
});
test('no new world event or change is permitted from a bare reviewer assertion',()=>{
 const a=assess('NPC-004');
 for(const conclusion of ['progress','failed','completed'])
  assert.throws(()=>decision(a,conclusion),/require reviewed new-turn evidence/);
 assert.throws(()=>draftReviewedNPCDecision({
  state,assessment:a,conclusion:'progress',reviewed:false,
  reasoning:'I reviewed the state and the time interval.',
  outcome:'Elena checks her school materials.',observations:[observation('NPC-004')]
 }),/Editorial causal review required/);
});
test('reviewed observations must have actor attribution and a concrete causal source',()=>{
 const a=assess('NPC-004');
 assert.throws(()=>decision(a,'progress',{
  observations:[{...observation('NPC-004'),observer_actor_id:'NPC-003'}]
 }),/attributed current-turn fact/);
 assert.throws(()=>decision(a,'progress',{
  observations:[{...observation('NPC-004'),confirmed_by_reviewer:false}]
 }),/attributed current-turn fact/);
});
test('blocked obligations remain blocked until a separately documented causal change',()=>{
 const modified=structuredClone(state);
 modified.world.actors['NPC-003'].commitments=[{
  id:'OBL-PARCEL_302',summary:'Verify parcel receiver before handover',
  source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  due_day:-29,status:'blocked',priority:'urgent',
  blockers:['Recipient address remains unconfirmed'],
  resolution:null,resolution_event_id:null
 }];
 const a=assessNPCDecisions({state:modified,actorIds:['NPC-003'],elapsedMinutes:20})[0];
 assert.equal(a.kind,'obligation');
 assert.equal(a.obligationId,'OBL-PARCEL_302');
 assert.ok(a.blockingEvidence.some(x=>x.code==='recorded_obligation_blocker'));
 assert.ok(!a.allowedConclusions.includes('completed'));
 assert.throws(()=>draftReviewedNPCDecision({state:modified,assessment:a,conclusion:'progress',
  reviewed:true,reasoning:'Reviewed the record and courier task.',outcome:'The parcel was delivered.',
  observations:[observation('NPC-003')]
 }),/progress or completion across unresolved/);
});
test('confirmed closure prevents routine selection rather than fabricating work',()=>{
 const assessments=assessNPCDecisions({state,actorIds:['NPC-006'],elapsedMinutes:25,
  exceptions:{'NPC-006':{status:'closed',confirmed:true}}});
 assert.deepEqual(assessments,[]);
 assert.equal(state.world.actors['NPC-006'].location_id,'LOC-COMMERCIAL-DISTRICT');
});
test('competing tasks are visible only in private assessment, not resolved simultaneously',()=>{
 const a=assess('NPC-004');
 assert.equal(a.competition,'Competing responsibilities require priority and time review');
 assert.ok(a.alternatives.some(x=>x.includes('school-journey')));
 assert.equal('alternatives' in playerVisibleDiagnostic(inspectLivingWorld({
  snapshot:baseline,actorIds:['NPC-004'],elapsedMinutes:25
 })),false);
});
test('decisions reject tampered or stale assessments and cannot mutate unrelated actor',()=>{
 const a=assess('NPC-004');
 const injected=structuredClone(a);
 injected.allowedConclusions.push('fictional_override');
 assert.throws(()=>decision(injected,'defer'),/Assessment changed or cannot be reproduced/);
 const bypass=structuredClone(a);
 bypass.unknowns=[];
 assert.throws(()=>decision(bypass,'defer'),/Assessment changed or cannot be reproduced/);
 const altered=structuredClone(state);
 altered.world.actors['NPC-004'].independent_plan='A new plan after a separate event.';
 assert.throws(()=>draftReviewedNPCDecision({state:altered,assessment:a,
  conclusion:'defer',reviewed:true,
  reasoning:'Conservative defer based on current state.',
  outcome:'The character does not advance the task this turn.'
 }),/Stale NPC decision assessment/);
 assert.throws(()=>decision(a,'defer',{changes:[
  {field:'independent_plan',actor_id:'NPC-003',before:'a',after:'b'}
 ]}),/Unsupported or cross-actor change/);
});
test('deferral cannot secretly mutate plans or resources without an observation',()=>{
 const a=assess('NPC-005');
 assert.throws(()=>decision(a,'defer',{changes:[{
  field:'independent_plan',
  before:state.world.actors['NPC-005'].independent_plan,
  after:'Return the clock sometime later.'
 }]}),/Unobserved deferral cannot mutate state/);
 const d=decision(a,'defer');
 assert.deepEqual(d.changes,[]);
 assert.equal(d.review_metadata.remains_pending_save,true);
});
test('a reviewed synthetic progress decision stages one private NPC event, never a canonical turn',()=>{
 const a=assess('NPC-004');
 const outcome='SYNTHETIC-ONLY Elena checks a loose note in her existing project materials.';
 const reviewed=decision(a,'progress',{
  observations:[observation('NPC-004')],outcome,
  changes:[{field:'independent_plan',
    before:state.world.actors['NPC-004'].independent_plan,
    after:'Synthetic future plan: verify project notes during next class.'}]
 });
 const before=JSON.stringify(baseline);
 const staged=stageLivingWorldTurn({snapshot:baseline,observedHead:'a'.repeat(40),
  npcResolutions:[reviewed],turn:{
   key:'qa-meridian-bay-causal-001',
   intent:'Jack reviews an unfinished component.',
   outcome:'A quiet interval passes in the workshop.',
   player_text:'I review an unfinished component.',
   narration_messages:['The workshop remains still around Jack.'],
   elapsed_days:0,elapsed_minutes:25
  }});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.events.events.at(-1).actor_ids[0],'NPC-004');
 assert.equal(staged.events.events.at(-1).outcome,outcome);
 assert.ok(!staged.chapter.includes(outcome));
 assert.ok(!staged.transcript.entries.at(-1).text.includes(outcome));
 assert.equal(JSON.stringify(baseline),before);
 assert.equal(baseline.manifest.last_completed_turn,9);
});
test('zero time and impossible day jumps cannot create decision assessments',()=>{
 assert.deepEqual(assessNPCDecisions({state,elapsedMinutes:0}),[]);
 assert.throws(()=>assessNPCDecisions({state,elapsedMinutes:20,elapsedDays:1}),
  /Impossible narrative day transition/);
 assert.throws(()=>assessNPCDecisions({state,elapsedMinutes:25,actorIds:['NPC-003','NPC-003']}),
  /Unknown or duplicated actor selection/);
 assert.throws(()=>assessNPCDecisions({state,elapsedMinutes:25,limit:20}),
  /Invalid assessment limit/);
});
