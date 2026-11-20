// Selective PR #27 qualitative-needs port onto the admitted Meridian Bay world.
// These tests are synthetic and never alter the canonical chapter checkpoint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot,stageNarrativeTurn} from '../tools/turn_engine.mjs';
import {stageNarratorScene} from '../tools/narrative_archive.mjs';
import {applyStateChanges} from '../tools/state_changes.mjs';
import {draftReviewedNeedIntroduction,draftReviewedNeedTradeoff,reviewNPCNeeds,validateNPCNeedChange} from '../tools/living_world_needs.mjs';
import {evaluateNPCPlans} from '../tools/world_plans.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const originals=Object.fromEntries(savePaths('CH-000').map(path=>
  [path,readFileSync(resolve(root,path),'utf8')]));
const sourceHead='a'.repeat(40);
const rosa='NPC-005',noah='NPC-006';
const observation=(id,fact)=>({
  kind:'current_turn_observation',observer_actor_id:id,
  fact,causal_source:'Synthetic observation attributed to the actor during QA.',
  confirmed_by_reviewer:true
});
const needs={
  [rosa]:{id:'NEED-QA-ROSA-NEIGHBOR',domain:'personal',
    summary:'Arrange a later handover of the already repaired clock.',
    priority:'important',status:'active',due_day:null,blockers:[],
    resource_keys:['current_repair']},
  [noah]:{id:'NEED-QA-NOAH-SUPPLIES',domain:'livelihood',
    summary:'Review an ordinary shop supply concern without inventing stock.',
    priority:'normal',status:'active',due_day:null,blockers:[],
    resource_keys:['daily_life']}
};
const clockObligation=id=>({id:'OBL-QA-ROSA-CLOCK',
  summary:'SYNTHETIC: coordinate a later clock handover.',
  source_event_id:id,last_change_event_id:id,due_day:null,
  status:'pending',priority:'normal',blockers:[],
  resolution:null,resolution_event_id:null});
const rosaPlan=id=>({id:'PLAN-000310',kind:'actor_intent',
  owner_actor_id:rosa,objective:'SYNTHETIC PRIVATE: plan a later clock handover.',
  motivation:'SYNTHETIC PRIVATE: remain helpful to a neighbor.',
  status:'proposed',earliest_day:-29,dependencies:[],
  requirements:[{kind:'location',location_id:'LOC-WILSON-APARTMENT'},
    {kind:'commitment',commitment_id:'OBL-QA-ROSA-CLOCK',status:'pending'}],
  known_by:[rosa],risks:['The recipient may not be available.'],
  alternatives:['Keep the clock until a time is agreed.'],
  source_event_id:id,last_change_event_id:id,
  resolution:null,resolution_event_id:null});
const turn=(snapshot,label)=>({
  key:'synthetic-need-plan-'+label+'-'+(snapshot.manifest.last_completed_turn+1),
  player_text:'SYNTHETIC QA: continue a stationary inspection.',
  intent:'A synthetic workbench interval without new decisions by Jack.',
  outcome:'The bench remains unchanged during a brief interval.',
  narration_messages:['SYNTHETIC SCENE: Light rests on the workbench.'],
  elapsed_days:0,elapsed_minutes:20,next_time_of_day:'morning'
});
const initial=()=>decodeFiveFiles(originals,'CH-000');
function firstTurn(){
  const start=initial(),before=JSON.stringify(start);
  const rosEvent='EV-000031',noEvent='EV-000032';
  const rosaNeed=draftReviewedNeedIntroduction({state:start.state,actorId:rosa,eventId:rosEvent,
    need:needs[rosa],observation:observation(rosa,'Rosa considers how to arrange a later clock handover.'),
    reviewed:true});
  const noahNeed=draftReviewedNeedIntroduction({state:start.state,actorId:noah,eventId:noEvent,
    need:needs[noah],observation:observation(noah,'Noah reviews an unresolved ordinary supply concern.'),
    reviewed:true});
  const actions=[
    {actor_id:rosa,reviewed:true,resolved:true,
      causal_basis:'Rosa independently considers an unfinished household obligation.',
      outcome:'SYNTHETIC: Rosa privately records a pending concern and intention.',
      changes:[{field:'commitments',before:[],after:[clockObligation(rosEvent)]},
        {field:'plans',before:[],after:[rosaPlan(rosEvent)]},rosaNeed]},
    {actor_id:noah,reviewed:true,resolved:true,
      causal_basis:'Noah privately considers a business concern in his established shop.',
      outcome:'SYNTHETIC: Noah privately records an unrelated business concern.',
      changes:[noahNeed]}
  ];
  const staged=stageLivingWorldTurn({snapshot:start,turn:turn(start,'first'),
    observedHead:sourceHead,npcResolutions:actions});
  assert.equal(JSON.stringify(start),before);
  return staged;
}
test('NPC needs, plans and obligations can coexist in two actor-owned recorded events',()=>{
  const staged=firstTurn();
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,10);
  assert.equal(staged.manifest.last_event_id,'EV-000032');
  assert.equal(staged.state.world.actors[rosa].needs[0].id,needs[rosa].id);
  assert.equal(staged.state.world.actors[noah].needs[0].id,needs[noah].id);
  assert.equal(staged.state.world.actors[rosa].commitments[0].status,'pending');
  const plans=evaluateNPCPlans({state:staged.state,actorId:rosa,
    elapsedMinutes:20,elapsedDays:0,
    eventIds:new Set(allEvents(staged).map(e=>e.id))});
  assert.equal(plans[0].ready,true);
  assert.equal(staged.state.world.actors[rosa].plans[0].status,'proposed');
  assert.equal(reviewNPCNeeds({state:staged.state}).length,2);
  assert.ok(!staged.chapter.includes('SYNTHETIC PRIVATE'));
  assert.ok(!staged.transcript.entries.at(-1).text.includes(needs[rosa].summary));
  assert.equal(staged.state.time.day,-29);
  assert.equal(staged.state.world.actors[rosa].location_id,'LOC-WILSON-APARTMENT');
});
test('reviewing NPC needs never mutates a checkpoint or creates automatic outcomes',()=>{
  const staged=firstTurn(),before=JSON.stringify(staged);
  const report=reviewNPCNeeds({state:staged.state,targetDay:-28});
  assert.equal(report.length,2);
  assert.equal(staged.state.world.actors[rosa].needs[0].status,'active');
  assert.equal(JSON.stringify(staged),before);
  assert.throws(()=>draftReviewedNeedIntroduction({state:staged.state,actorId:rosa,
    eventId:'EV-000034',need:{...needs[rosa],id:'NEED-QA-UNAUTHORIZED'},
    observation:observation(rosa,'A fictional observation was not reviewed.'),
    reviewed:false}),/reviewed/);
});
test('a stale NPC need change rolls back a preceding valid change atomically',()=>{
  const staged=firstTurn(),before=JSON.stringify(staged.state);
  const record={id:'EV-000034',actor_ids:[rosa],state_changes:[],day:-29,turn_elapsed_minutes:20};
  assert.throws(()=>applyStateChanges(staged.state,record,[
    {field:'conditions',before:[],after:['Synthetic state']},
    {field:'needs',before:[],after:[]}
  ]),/Stale NPC needs/);
  assert.equal(JSON.stringify(staged.state),before);
  assert.deepEqual(record.state_changes,[]);
});
test('a reviewed need tradeoff persists privately through a chapter transition',()=>{
  const first=firstTurn(),before=JSON.stringify(first);
  const change=draftReviewedNeedTradeoff({state:first.state,actorId:rosa,
    needId:needs[rosa].id,eventId:'EV-000034',
    observation:observation(rosa,'Rosa postpones a different errand to review the repaired clock.'),
    reviewed:true,decision:'Rosa reviews the repaired clock before a later handover.',
    foregone:'Another unrelated household errand remains postponed.',
    cost:'The unrelated errand remains incomplete during this interval.',
    status:'blocked',blockers:['Recipient availability is not yet established']});
  const second=stageLivingWorldTurn({snapshot:first,turn:turn(first,'second'),
    observedHead:sourceHead,npcResolutions:[{
      actor_id:rosa,reviewed:true,resolved:true,
      causal_basis:'Rosa independently weighs two conflicting household responsibilities.',
      outcome:'SYNTHETIC: a separate errand is deferred and the need remains blocked.',
      changes:[change]
    }]});
  assert.equal(JSON.stringify(first),before);
  assert.equal(verifyNarrativeSnapshot(second),true);
  assert.equal(second.manifest.last_event_id,'EV-000034');
  assert.equal(second.state.world.actors[rosa].needs[0].status,'blocked');
  assert.equal(second.state.world.actors[rosa].needs[0].tradeoffs.length,1);
  assert.equal(second.state.world.actors[rosa].plans[0].status,'proposed');
  assert.ok(!second.chapter.includes('Recipient availability'));
  const plan={plan_version:1,chapter_id:'CH-001',title:'Synthetic continued responsibilities',
    status:'prepared',source_commit:sourceHead,
    purpose:'Carry the same two NPC contexts into a later narrative arc.',
    time_context:{day:second.state.time.day,period:second.state.time.time_of_day,
      constraints:['No premature cosmic wave effects.']},
    location_ids:[second.state.player.location_id],
    npc_ids:[rosa,noah],
    thread_ids:second.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
    hidden_plan_ids:['PLAN-000310'],
    possible_developments:['A blocked obligation might later change.'],
    exit_conditions:['The situation ends in a natural narrative pause.']};
  const next=stageChapterTransition({snapshot:{...second,sourceFiles:encodeFiveFiles(second)},
    nextPlan:plan,reason:'Synthetic chapter-arc boundary after a reviewed interval.',
    observedHead:sourceHead,reviewed:true});
  assert.equal(verifyNarrativeSnapshot(next),true);
  assert.equal(next.manifest.chapter_id,'CH-001');
  assert.equal(next.manifest.last_completed_turn,11);
  assert.equal(next.manifest.last_event_id,'EV-000034');
  assert.equal(next.state.time.day,-29);
  for(const id of [rosa,noah]){
    assert.deepEqual(next.state.world.actors[id].needs,second.state.world.actors[id].needs);
  }
  assert.deepEqual(next.state.world.actors[rosa].plans,second.state.world.actors[rosa].plans);
  assert.deepEqual(next.state.world.actors[rosa].commitments,second.state.world.actors[rosa].commitments);
  const restored=decodeFiveFiles({...encodeFiveFiles(second),...encodeFiveFiles(next)},'CH-001');
  assert.equal(verifyNarrativeSnapshot(restored),true);
  assert.deepEqual(restored.state.world.actors[rosa].needs,next.state.world.actors[rosa].needs);
  assert.deepEqual(restored.state.world.locations,initial().state.world.locations);
  for(const [path,text] of Object.entries(originals))
    assert.equal(readFileSync(resolve(root,path),'utf8'),text);
});
test('recovery validation rejects forged, duplicated or undocumented needs',()=>{
  const staged=firstTurn();
  for(const corrupt of [
    s=>{s.state.world.actors[noah].needs[0].id=needs[rosa].id},
    s=>{s.state.world.actors[rosa].needs[0].source_event_id='EV-000029'},
    s=>{s.events.events.at(-1).state_changes.at(-1).after[0].summary='Tampered summary'}
  ]){
    const copy=structuredClone(staged);corrupt(copy);
    assert.throws(()=>verifyNarrativeSnapshot(copy));
  }
});

test('both narration entry points reject direct leakage of private need metadata',()=>{
  const staged=firstTurn();
  const forbidden=staged.state.world.actors[rosa].needs[0].summary;
  const guard={observed_head:sourceHead,previous_attempt:null};
  const before=JSON.stringify(staged);
  assert.throws(()=>stageNarratorScene(staged,forbidden,
    'synthetic-private-need-intro',guard),/Private NPC need information leaked/);
  const next=turn(staged,'forbidden');
  assert.throws(()=>stageNarrativeTurn(staged,{
    ...next,save_guard:guard,narration_messages:[forbidden]
  }),/Private NPC need information leaked/);
  assert.equal(JSON.stringify(staged),before);
});

test('need review includes distant actors while reader diagnostics disclose none of their needs',()=>{
  const staged=firstTurn(),before=JSON.stringify(staged);
  const report=inspectLivingWorld({snapshot:staged,actorIds:[],elapsedMinutes:20});
  assert.deepEqual(report.selectedActorIds,[]);
  assert.deepEqual(new Set(report.needReview.map(x=>x.actorId)),new Set([rosa,noah]));
  assert.ok(report.needReview.every(x=>x.visibility==='narrator_private'&&x.requiresDecision));
  const visible=JSON.stringify(playerVisibleDiagnostic(report));
  for(const n of Object.values(needs))assert.ok(!visible.includes(n.id)&&!visible.includes(n.summary));
  assert.deepEqual(staged.state.world.locations,initial().state.world.locations);
  assert.deepEqual(staged.state.player,initial().state.player);
  assert.equal(JSON.stringify(staged),before);
});

test('typed need changes cannot invent resource keys or accept another actor observation',()=>{
  const start=initial(),before=JSON.stringify(start.state);
  assert.throws(()=>draftReviewedNeedIntroduction({state:start.state,actorId:rosa,
    eventId:'EV-000031',need:needs[rosa],reviewed:true,
    observation:observation(noah,'Noah cannot supply Rosa with his own private observation.')}),/attributed/);
  const created=draftReviewedNeedIntroduction({state:start.state,actorId:rosa,
    eventId:'EV-000031',need:needs[rosa],reviewed:true,
    observation:observation(rosa,'Rosa checks her own outstanding household concern.')});
  created.after[0].resource_keys=['synthetic_unrecorded_resource'];
  const record={id:'EV-000031',actor_ids:[rosa],state_changes:[],day:-29,turn:10,
    turn_elapsed_minutes:20};
  assert.throws(()=>applyStateChanges(start.state,record,[created]),/resource references/);
  assert.equal(JSON.stringify(start.state),before);
  assert.deepEqual(record.state_changes,[]);
});

test('typed need application and history replay require retained owner evidence and an authorized interval',()=>{
  const start=initial(),original=JSON.stringify(start.state);
  const draft=draftReviewedNeedIntroduction({state:start.state,actorId:rosa,
    eventId:'EV-000031',need:needs[rosa],reviewed:true,
    observation:observation(rosa,'SYNTHETIC: Rosa records a concern that she observed herself.')});
  const mutations=[
    (change,record)=>{delete change.review},
    (change,record)=>{change.review.observer_actor_id=noah},
    (change,record)=>{change.review.confirmed_by_reviewer=false},
    (change,record)=>{record.turn_elapsed_minutes=0},
    (change,record)=>{delete record.turn_elapsed_minutes}
  ];
  for(const mutate of mutations){
    const change=structuredClone(draft),record={id:'EV-000031',actor_ids:[rosa],
      state_changes:[],day:-29,turn:10,turn_elapsed_minutes:20};
    mutate(change,record);
    assert.throws(()=>applyStateChanges(start.state,record,[change]),/evidence|interval/);
    assert.equal(JSON.stringify(start.state),original);
    assert.deepEqual(record.state_changes,[]);
  }
  const saved=firstTurn(),origin=saved.events.events.find(e=>e.id==='EV-000031');
  const change=origin.state_changes.find(c=>c.field==='needs');
  assert.equal(change.review.observer_actor_id,rosa);
  assert.equal(change.review.causal_source,observation(rosa,'ignored').causal_source);
  change.review.observer_actor_id=noah;
  assert.throws(()=>verifyNarrativeSnapshot(saved),/evidence/);
});

test('recovery rejects a forged need reference absent at its historical creation',()=>{
  const saved=firstTurn();
  const origin=saved.events.events.find(e=>e.id==='EV-000031');
  origin.state_changes.find(c=>c.field==='needs').after[0].resource_keys=['nonexistent_resource'];
  saved.state.world.actors[rosa].needs[0].resource_keys=['nonexistent_resource'];
  assert.throws(()=>verifyNarrativeSnapshot(saved),/resource references/);
});

test('typed need tradeoffs cannot substitute a different observation after drafting',()=>{
  const staged=firstTurn(),original=JSON.stringify(staged.state);
  const change=draftReviewedNeedTradeoff({state:staged.state,actorId:rosa,
    needId:needs[rosa].id,eventId:'EV-000034',reviewed:true,
    observation:observation(rosa,'SYNTHETIC: Rosa confirms that the other errand remains unfinished.'),
    decision:'SYNTHETIC: review the handover before choosing another task.',
    foregone:'SYNTHETIC: a different errand must wait until later.',
    cost:'SYNTHETIC: the unrelated errand has no progress this interval.'});
  change.review.fact='SYNTHETIC: a replacement observation that did not establish the recorded cost.';
  const record={id:'EV-000034',actor_ids:[rosa],state_changes:[],day:-29,
    turn:11,turn_elapsed_minutes:20};
  assert.throws(()=>applyStateChanges(staged.state,record,[change]),/differs from its reviewed/);
  assert.equal(JSON.stringify(staged.state),original);
  assert.deepEqual(record.state_changes,[]);
});

test('need drafting rejects supplied prior history and does not manufacture material changes',()=>{
  const start=initial();
  assert.throws(()=>draftReviewedNeedIntroduction({state:start.state,actorId:rosa,
    eventId:'EV-000031',need:{...needs[rosa],tradeoffs:[]},reviewed:true,
    observation:observation(rosa,'Rosa considers a specific household responsibility.')}),/prior history/);
  const staged=firstTurn(),before=staged.state.world.actors[rosa].needs;
  const after=structuredClone(before);after[0].last_change_event_id='EV-000034';
  assert.throws(()=>validateNPCNeedChange({before,after,eventId:'EV-000034'}),/material fact/);
  assert.deepEqual(staged.state.world.actors[rosa].needs,before);
});

test('terminal needs retain their causal history and cannot reopen or disappear',()=>{
  const staged=firstTurn(),before=staged.state.world.actors[rosa].needs;
  const completed=draftReviewedNeedTradeoff({state:staged.state,actorId:rosa,
    needId:needs[rosa].id,eventId:'EV-000034',reviewed:true,
    observation:observation(rosa,'SYNTHETIC: an agreed arrangement removes this concern.'),
    decision:'SYNTHETIC: Rosa confirms the arrangement at this time.',
    foregone:'SYNTHETIC: a different errand waits during the conversation.',
    cost:'SYNTHETIC: the other errand remains unfinished for now.',
    status:'resolved',resolution:'SYNTHETIC: an explicit agreement settles this concern.'});
  assert.equal(validateNPCNeedChange({before,after:completed.after,eventId:'EV-000034'}),true);
  const reopened=structuredClone(completed.after);
  Object.assign(reopened[0],{status:'active',resolution:null,resolution_event_id:null,
    last_change_event_id:'EV-000036'});
  assert.throws(()=>validateNPCNeedChange({before:completed.after,after:reopened,
    eventId:'EV-000036'}),/cannot reopen/);
  assert.throws(()=>validateNPCNeedChange({before:completed.after,after:[],
    eventId:'EV-000036'}),/silently disappear/);
  assert.equal(staged.state.world.actors[rosa].needs[0].status,'active');
});

test('later resource removal preserves a historical need without authorizing a new missing-resource reference',()=>{
  const first=firstTurn(),resources=first.state.world.actors[rosa].resources;
  const remaining=structuredClone(resources);delete remaining.current_repair;
  const later=stageLivingWorldTurn({snapshot:first,turn:turn(first,'resource-unavailable'),
    observedHead:sourceHead,npcResolutions:[{
      actor_id:rosa,reviewed:true,resolved:true,
      causal_basis:'SYNTHETIC: a reviewed change removes a previously recorded resource.',
      outcome:'SYNTHETIC: the resource is no longer available; the original need remains unresolved.',
      changes:[{field:'resources',before:resources,after:remaining}]
    }]});
  const restored=decodeFiveFiles(encodeFiveFiles(later),'CH-000');
  assert.equal(verifyNarrativeSnapshot(restored),true);
  assert.deepEqual(restored.state.world.actors[rosa].needs,first.state.world.actors[rosa].needs);
  assert.equal(Object.hasOwn(restored.state.world.actors[rosa].resources,'current_repair'),false);
  const blocked=draftReviewedNeedTradeoff({state:restored.state,actorId:rosa,
    needId:needs[rosa].id,eventId:'EV-000036',reviewed:true,
    observation:observation(rosa,'SYNTHETIC: the expected resource is no longer available.'),
    decision:'SYNTHETIC: postpone the task until its missing resource can be replaced.',
    foregone:'SYNTHETIC: the previously intended work remains unfinished.',
    cost:'SYNTHETIC: an unresolved responsibility must wait for another interval.',
    status:'blocked',blockers:['SYNTHETIC: the required resource is unavailable']});
  assert.equal(validateNPCNeedChange({before:blocked.before,after:blocked.after,
    eventId:'EV-000036',resources:remaining}),true);
  assert.throws(()=>draftReviewedNeedIntroduction({state:restored.state,actorId:rosa,
    eventId:'EV-000036',need:{...needs[rosa],id:'NEED-QA-NEW-MISSING-RESOURCE'},
    observation:observation(rosa,'SYNTHETIC: this attempted new need cites a missing resource.'),
    reviewed:true}),/resources must already exist/);
});

test('later need decisions cannot replace earlier observed costs',()=>{
  const first=firstTurn();
  const prior=draftReviewedNeedTradeoff({state:first.state,actorId:rosa,
    needId:needs[rosa].id,eventId:'EV-000034',reviewed:true,
    observation:observation(rosa,'SYNTHETIC: this interval leaves another errand unfinished.'),
    decision:'SYNTHETIC: Rosa spends this interval reviewing the pending handover.',
    foregone:'SYNTHETIC: an unrelated household errand remains unfinished.',
    cost:'SYNTHETIC: the other household errand is delayed until a later interval.'});
  const changed=structuredClone(prior.after);
  changed[0].last_change_event_id='EV-000036';
  changed[0].tradeoffs[0].cost='SYNTHETIC: forged claim that the previous decision had no cost.';
  assert.throws(()=>validateNPCNeedChange({before:prior.after,after:changed,
    eventId:'EV-000036'}),/Previous need decisions cannot be rewritten/);
});
