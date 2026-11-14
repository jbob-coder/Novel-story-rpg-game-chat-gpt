import test from 'node:test';
import assert from 'node:assert/strict';
import {validateNPCPlans,validateNPCPlanChange,evaluateNPCPlans,draftReviewedPlanResolution,
 playerVisiblePlans,assertPlanNarrationPrivacy} from '../tools/world_plans.mjs';
import {validateNPCCommitments,validateNPCCommitmentChange} from '../tools/living_world_obligations.mjs';
const actorId='NPC-005',home='LOC-WILSON-APARTMENT',old='EV-000001',fresh='EV-000002';
const eventIds=new Set([old]);
const p=()=>({id:'PLAN-000001',kind:'actor_intent',owner_actor_id:actorId,
 objective:'A private repair-kit preparation.',motivation:'Help a neighbor at a later opportunity.',
 status:'proposed',requirements:[{kind:'location',location_id:home},
  {kind:'resource',key:'supply',expected:'ready'},
  {kind:'commitment',commitment_id:'OBL-PREPARE',status:'pending'}],
 earliest_day:-29,dependencies:[],known_by:[actorId],risks:['Supplies may become unavailable.'],
 alternatives:['Postpone the preparation.'],source_event_id:old,last_change_event_id:old,
 resolution:null,resolution_event_id:null});
const fixture=()=>({player:{id:'PLAYER-001'},time:{day:-29},world:{locations:{[home]:{}},
 actors:{[actorId]:{id:actorId,location_id:home,resources:{supply:'ready'},
  commitments:[{id:'OBL-PREPARE',status:'pending'}],plans:[p()]},
 'NPC-006':{id:'NPC-006',location_id:home,resources:{},plans:[]}}}});
const review=()=>({reviewed:true,reason:'Supplies inspected during the authorized interval.',
 observations:[{actor_id:actorId,fact:'Supply is ready.',source:'Direct inspection.'}]});
const assess=(state,extra={})=>evaluateNPCPlans({state,actorId,elapsedMinutes:20,elapsedDays:0,eventIds,...extra});
const draft=(state,outcome='progress',extra={})=>draftReviewedPlanResolution({state,
 assessment:assess(state)[0],eventId:fresh,outcome,review:review(),...extra});
test('evaluating an eligible plan is private and never executes or mutates it',()=>{
 const state=fixture(),before=structuredClone(state),assessment=assess(state)[0];
 assert.equal(assessment.ready,true);assert.equal(assessment.visibility,'narrator_private');
 assert.equal(state.world.actors[actorId].plans[0].status,'proposed');
 assert.deepEqual(assess(state,{elapsedMinutes:0}),[]);assert.deepEqual(state,before);
 assert.deepEqual(playerVisiblePlans(state),[]);
 assert.equal(playerVisiblePlans(state,actorId)[0].objective,p().objective);
});
test('a target day only makes review eligible and cannot imply completion',()=>{
 const state=fixture();state.world.actors[actorId].plans[0].earliest_day=-28;
 assert.equal(assess(state)[0].eligible,false);
 assert.throws(()=>draft(state),/not yet eligible/);
 assert.equal(assess(state,{elapsedMinutes:1440,elapsedDays:1})[0].ready,true);
 assert.equal(state.world.actors[actorId].plans[0].status,'proposed');
});
test('all requirements and completed dependencies are necessary',()=>{
 for(const change of [s=>{s.world.actors[actorId].resources.supply='missing'},
  s=>{s.world.actors[actorId].location_id='LOC-ELSEWHERE'},
  s=>{s.world.actors[actorId].commitments[0].status='blocked'}]){
  const state=fixture();change(state);assert.equal(assess(state)[0].ready,false);
  assert.throws(()=>draft(state,'succeeded'),/blocked/);
  assert.equal(draft(state,'blocked').after[0].status,'blocked');
 }
 const state=fixture(),dependency={...p(),id:'PLAN-000002',requirements:[]};
 state.world.actors[actorId].plans.push(dependency);
 state.world.actors[actorId].plans[0].dependencies=['PLAN-000002'];
 assert.equal(assess(state)[0].ready,false);
 dependency.status='completed';dependency.resolution='A previously reviewed completion.';dependency.resolution_event_id=old;
 assert.equal(assess(state)[0].ready,true);
});
test('a changed condition or altered assessment requires fresh review',()=>{
 const state=fixture(),assessment=assess(state)[0];
 state.world.actors[actorId].resources.supply='unavailable';
 assert.throws(()=>draft(state,'progress',{assessment}),/Stale or altered/);
 const altered=assess(state)[0];altered.ready=true;
 assert.throws(()=>draft(state,'progress',{assessment:altered}),/Stale or altered/);
});
test('unsupported, missing and cyclic dependencies are rejected',()=>{
 for(const change of [plan=>{plan.dependencies=['PLAN-999999']},
  plan=>{plan.dependencies=[plan.id]},plan=>{plan.requirements=[{kind:'magic_success'}]}]){
  const state=fixture();change(state.world.actors[actorId].plans[0]);assert.throws(()=>assess(state));
 }
 const state=fixture(),other={...p(),id:'PLAN-000002',dependencies:['PLAN-000001']};
 state.world.actors[actorId].plans[0].dependencies=[other.id];state.world.actors[actorId].plans.push(other);
 assert.throws(()=>assess(state),/Cyclic/);
});
test('author possibilities cannot become NPC knowledge or executable intentions',()=>{
 const state=fixture(),plan=state.world.actors[actorId].plans[0];plan.kind='author_proposal';plan.known_by=[];
 assert.deepEqual(assess(state),[]);assert.deepEqual(playerVisiblePlans(state,actorId),[]);
 plan.status='active';assert.throws(()=>assess(state),/author proposal execution/);
 plan.status='proposed';plan.known_by=[actorId];assert.throws(()=>assess(state),/knowledge/);
});
test('unknown evidence, locations and knowledge cannot be introduced',()=>{
 for(const change of [plan=>{plan.source_event_id='EV-999999'},
  plan=>{plan.requirements=[{kind:'location',location_id:'LOC-UNKNOWN'}]},
  plan=>{plan.known_by=['PLAYER-001']},plan=>{plan.requirements=[{kind:'commitment',commitment_id:'OBL-UNKNOWN',status:'pending'}]}]){
  const state=fixture();change(state.world.actors[actorId].plans[0]);assert.throws(()=>assess(state));
 }
});
test('reviewed progress persists observations while a proposal cannot jump straight to success',()=>{
 const state=fixture(),change=draft(state);
 assert.equal(change.field,'plans');assert.equal(change.after[0].status,'active');
 assert.equal(change.after[0].last_change_event_id,fresh);
 assert.deepEqual(change.review.observations,review().observations);
 assert.throws(()=>draft(state,'succeeded'),/status transition/);
 assert.throws(()=>draft(state,'progress',{review:{reviewed:true}}),/observations/);
 assert.throws(()=>draft(state,'progress',{review:{...review(),observations:[{actor_id:'NPC-006',fact:'A claim.',source:'Unknown.'}]}}),/observations/);
});
test('successful or abandoned plans cannot reopen, disappear, or change their requirements',()=>{
 const state=fixture();state.world.actors[actorId].plans[0].status='active';
 const done=draft(state,'succeeded');assert.equal(done.after[0].status,'completed');
 const args={actorId,actorIds:new Set(['PLAYER-001',actorId]),eventIds:new Set([old,fresh]),eventId:'EV-000003'};
 assert.throws(()=>validateNPCPlanChange({...args,before:done.after,after:[]}),/disappear/);
 assert.throws(()=>validateNPCPlanChange({...args,before:done.after,after:[{...done.after[0],status:'active',resolution:null,resolution_event_id:null}]}),/reopened/);
 const revised=draft(state);revised.after[0].requirements=[];
 assert.throws(()=>validateNPCPlanChange({...args,before:revised.before,after:revised.after,
  eventId:fresh,review:revised.review}),/replacement plan/);
 const abandoned=draft(fixture(),'abandoned');assert.equal(abandoned.after[0].status,'abandoned');
});
test('a forged review interval cannot be accepted as a completed action',()=>{
 const state=fixture(),change=draft(state);
 delete change.review.elapsed_minutes;
 assert.throws(()=>validateNPCPlanChange({...change,actorId,eventId:fresh,eventIds,
  actorIds:new Set([actorId]),state}),/reviewed fictional interval/);
});
test('private plan text cannot be copied into visible narration',()=>{
 const state=fixture();assert.throws(()=>assertPlanNarrationPrivacy(state,[p().objective]),/leaked/);
 assert.throws(()=>assertPlanNarrationPrivacy(state,['Some text '+p().motivation]),/leaked/);
 assert.equal(assertPlanNarrationPrivacy(state,['A quiet workshop scene.']),true);
});
const commitment=()=>({id:'OBL-PREPARE',summary:'Prepare an ordinary repair kit.',source_event_id:old,
 last_change_event_id:old,status:'pending',priority:'normal',blockers:[],due_day:null,
 resolution:null,resolution_event_id:null});
test('reused obligation validator keeps creation, blockers and terminal evidence causal',()=>{
 const item=commitment();assert.equal(validateNPCCommitmentChange({before:[],after:[item],eventId:old}),true);
 assert.throws(()=>validateNPCCommitments([{...item,status:'blocked'}]),/obstacle/);
 assert.throws(()=>validateNPCCommitments([item],{eventIds:new Set()}),/unknown event/);
 const closed={...item,status:'resolved',resolution:'The kit was inspected and prepared.',
  last_change_event_id:fresh,resolution_event_id:fresh};
 assert.equal(validateNPCCommitmentChange({before:[item],after:[closed],eventId:fresh}),true);
 assert.throws(()=>validateNPCCommitmentChange({before:[closed],after:[item],eventId:'EV-000003'}),/reopened/);
 assert.throws(()=>validateNPCCommitmentChange({before:[item],after:[],eventId:fresh}),/deleted/);
});
