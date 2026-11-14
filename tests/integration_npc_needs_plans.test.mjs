// Integration of PR #14 qualitative needs into the PR #25 chapter/plan pilot.
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
import {draftReviewedNeedIntroduction,draftReviewedNeedTradeoff,reviewNPCNeeds} from '../tools/living_world_needs.mjs';
import {evaluateNPCPlans} from '../tools/world_plans.mjs';
import {allEvents} from '../tools/chapter_history.mjs';

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
