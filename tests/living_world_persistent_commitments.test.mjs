import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewNPCCommitments,selectRelevantNPCs} from '../tools/living_world_commitments.mjs';

const baseline=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
const clone=value=>structuredClone(value);
const source='EV-000001';
const eventIds=new Set([source,'EV-000002']);
const obligation=(overrides={})=>({id:'OBL-QA_PRIVATE',summary:'Synthetic private obligation',
 source_event_id:source,due_day:-29,status:'pending',priority:'important',blockers:[],
 last_change_event_id:source,resolution:null,resolution_event_id:null,...overrides});
function fixture(){
 const state=clone(baseline);
 state.world.actors['NPC-005'].commitments=[obligation()];
 return state;
}
const review=(state,overrides={})=>reviewNPCCommitments({state,elapsedMinutes:15,eventIds,...overrides});

test('saved obligations are reviewed without a caller-provided list or actor selection',()=>{
 const state=fixture(),before=JSON.stringify(state);
 const result=review(state);
 assert.equal(result.length,1);
 assert.equal(result[0].origin,'saved_checkpoint');
 assert.equal(result[0].status,'pending');
 assert.equal(result[0].review,'due_today_review');
 assert.equal(result[0].requiresResolution,true);
 assert.equal(JSON.stringify(state),before);
});

test('routine limit and unknown routes do not truncate persistent obligations',()=>{
 const state=fixture();
 const owners=Object.keys(state.world.actors).filter(id=>/^NPC-/.test(id));
 assert.ok(owners.length>3);
 owners.forEach((id,index)=>{
  const actor=state.world.actors[id];
  actor.commitments=[obligation({id:`OBL-QA_OWNER_${index}`})];
  delete actor.independent_plan;
  actor.location_id=null;
 });
 assert.deepEqual(selectRelevantNPCs({state}),[]);
 const result=review(state,{actorIds:selectRelevantNPCs({state})});
 assert.deepEqual(new Set(result.map(item=>item.actorId)),new Set(owners));
 assert.ok(result.every(item=>item.visibility==='narrator_private'));
});

test('deadlines crossed during a multi-day interval are flagged without completing them',()=>{
 const state=fixture();
 state.world.actors['NPC-005'].commitments=[
  obligation({id:'OBL-QA_OVERDUE',due_day:-30}),
  obligation({id:'OBL-QA_TODAY',due_day:-29}),
  obligation({id:'OBL-QA_INTERVAL',due_day:-28}),
  obligation({id:'OBL-QA_END_DAY',due_day:-27}),
  obligation({id:'OBL-QA_LATER',due_day:-26}),
  obligation({id:'OBL-QA_UNKNOWN',due_day:null})
 ];
 const before=JSON.stringify(state);
 const result=review(state,{elapsedDays:2,elapsedMinutes:2880});
 const byId=Object.fromEntries(result.map(item=>[item.id,item]));
 assert.equal(byId['OBL-QA_OVERDUE'].review,'overdue_review');
 assert.equal(byId['OBL-QA_TODAY'].review,'due_today_review');
 assert.equal(byId['OBL-QA_INTERVAL'].review,'due_within_interval');
 assert.equal(byId['OBL-QA_END_DAY'].review,'due_within_interval');
 assert.equal(byId['OBL-QA_LATER'].review,'upcoming');
 assert.equal(byId['OBL-QA_UNKNOWN'].review,'deadline_unknown');
 assert.ok(result.every(item=>item.reviewedThroughDay===-27&&item.status==='pending'));
 assert.equal(JSON.stringify(state),before);
});

test('blocked and overdue dimensions remain visible independently',()=>{
 const state=fixture();
 state.world.actors['NPC-005'].commitments=[obligation({status:'blocked',due_day:-30,
  blockers:['Synthetic unavailable replacement']})];
 const result=review(state)[0];
 assert.equal(result.status,'blocked');
 assert.equal(result.review,'overdue_review');
 assert.deepEqual(result.blockers,['Synthetic unavailable replacement']);
 result.blockers.push('Mutated caller output');
 assert.equal(state.world.actors['NPC-005'].commitments[0].blockers.length,1);
});

test('resolved and cancelled obligations remain history without pending reviews',()=>{
 const state=fixture();
 state.world.actors['NPC-005'].commitments=['resolved','cancelled'].map((status,index)=>
  obligation({id:`OBL-QA_TERMINAL_${index}`,status,resolution:'Synthetic reviewed conclusion',
   last_change_event_id:'EV-000002',resolution_event_id:'EV-000002'}));
 assert.deepEqual(review(state),[]);
});

test('zero interval emits no activity while impossible intervals are rejected',()=>{
 const state=fixture();
 assert.deepEqual(review(state,{elapsedMinutes:0}),[]);
 assert.throws(()=>review(state,{elapsedDays:1,elapsedMinutes:20}),/Impossible narrative/);
 assert.throws(()=>review(state,{elapsedDays:2,elapsedMinutes:15}),/days\/minutes disagree/);
 assert.throws(()=>review(state,{elapsedDays:1,elapsedMinutes:0}),/days\/minutes disagree/);
});

test('saved references are checked against supplied global event identities',()=>{
 const state=fixture();
 assert.equal(review(state,{eventIds:new Set([source])}).length,1);
 assert.throws(()=>review(state,{eventIds:new Set(['EV-000099'])}),/unknown event/);
 state.world.actors['NPC-005'].commitments[0].last_change_event_id='EV-000099';
 assert.throws(()=>review(state),/unknown event/);
});

test('malformed saved obligations and duplicate IDs for one owner are rejected',()=>{
 const state=fixture();
 state.world.actors['NPC-005'].commitments[0].status='blocked';
 assert.throws(()=>review(state),/stated obstacle/);
 state.world.actors['NPC-005'].commitments[0].status='pending';
 state.world.actors['NPC-005'].commitments.push(obligation());
 assert.throws(()=>review(state),/duplicate obligation/);
});

test('different owners may retain the same obligation ID',()=>{
 const state=fixture();
 state.world.actors['NPC-003'].commitments=[obligation({source_event_id:'EV-000002',
  last_change_event_id:'EV-000002'})];
 const result=review(state);
 assert.equal(result.length,2);
 assert.deepEqual(new Set(result.map(item=>item.actorId)),new Set(['NPC-003','NPC-005']));
 assert.ok(result.every(item=>item.id==='OBL-QA_PRIVATE'));
});

test('temporary hints cannot shadow durable obligations even outside actor selection',()=>{
 const state=fixture();
 const temporary={id:'OBL-QA_PRIVATE',actor_id:'NPC-005',source_event_id:source,
  summary:'Synthetic conflicting hint',due_day:null,status:'pending'};
 assert.throws(()=>review(state,{commitments:[temporary]}),/Duplicate commitment/);
});

test('temporary and saved obligations with the same ID may belong to different owners',()=>{
 const state=fixture();
 const temporary={id:'OBL-QA_PRIVATE',actor_id:'NPC-003',source_event_id:'EV-000002',
  summary:'Synthetic different owner hint',due_day:null,status:'pending'};
 const result=review(state,{actorIds:['NPC-003'],commitments:[temporary]})
  .filter(item=>item.kind==='explicit_commitment');
 assert.equal(result.length,2);
 assert.equal(result.find(item=>item.actorId==='NPC-003').origin,'temporary_input');
 assert.equal(result.find(item=>item.actorId==='NPC-005').origin,'saved_checkpoint');
 assert.throws(()=>review(state,{commitments:[temporary,{...temporary}]}),
  /Duplicate commitment id for owner/);
});

test('temporary compact inputs retain selection and explicit nonpersistent origin',()=>{
 const state=clone(baseline);
 const temporary={id:'OBL-QA_TEMPORARY',actor_id:'NPC-003',source_event_id:source,
  summary:'Synthetic temporary obligation',due_day:-28,status:'pending'};
 assert.deepEqual(review(state,{commitments:[temporary]}),[]);
 const result=review(state,{actorIds:['NPC-003'],commitments:[temporary],
  elapsedDays:1,elapsedMinutes:1440}).find(item=>item.id===temporary.id);
 assert.equal(result.origin,'temporary_input');
 assert.equal(result.review,'due_within_interval');
 assert.equal(state.world.actors['NPC-003'].commitments,undefined);
 assert.throws(()=>review(state,{actorIds:['NPC-003'],commitments:[{
  ...temporary,source_event_id:'EV-000099'}]}),/unknown event/);
});
