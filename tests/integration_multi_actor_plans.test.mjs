// QA-only rehearsal for two independent NPC plans and obligations spanning a
// chapter boundary. PR #10's obligation validator and PR #25's world plan
// engine are both exercised. PR #11–15 implementations are NOT imported here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {evaluateNPCPlans} from '../tools/world_plans.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=Object.fromEntries(savePaths('CH-000').map(path=>
  [path,readFileSync(resolve(root,path),'utf8')]));
const fixedHead='a'.repeat(40);
const fixtures=[
  {id:'NPC-005',event:'EV-000031',location:'LOC-WILSON-APARTMENT',
    obligation:'OBL-QA-ROSA',plan:'PLAN-000101',
    objective:'SYNTHETIC PRIVATE ROSA PLAN: review household repair materials.'},
  {id:'NPC-006',event:'EV-000032',location:'LOC-COMMERCIAL-DISTRICT',
    obligation:'OBL-QA-NOAH',plan:'PLAN-000102',
    objective:'SYNTHETIC PRIVATE NOAH PLAN: inspect ordinary shop supplies.'}
];

const obligation=f=>({id:f.obligation,
  summary:'SYNTHETIC: a separate actor-owned mundane obligation.',
  source_event_id:f.event,due_day:null,status:'pending',priority:'normal',
  blockers:[],last_change_event_id:f.event,resolution:null,resolution_event_id:null});
const plan=f=>({id:f.plan,kind:'actor_intent',owner_actor_id:f.id,
  objective:f.objective,
  motivation:'SYNTHETIC: ordinary personal responsibility within known resources.',
  status:'proposed',requirements:[
    {kind:'location',location_id:f.location},
    {kind:'commitment',commitment_id:f.obligation,status:'pending'}],
  earliest_day:-29,dependencies:[],known_by:[f.id],
  risks:['A later obligation may interfere.'],
  alternatives:['Wait for a more suitable time.'],
  source_event_id:f.event,last_change_event_id:f.event,
  resolution:null,resolution_event_id:null});
const nextPlan=snapshot=>({
  plan_version:1,chapter_id:'CH-001',title:'Synthetic two-actor continuation',
  status:'prepared',source_commit:fixedHead,
  purpose:'Preserve independent NPC intentions across a story-arc boundary.',
  time_context:{day:snapshot.state.time.day,period:snapshot.state.time.time_of_day,
    constraints:['No premature cosmic wave effects.']},
  location_ids:[snapshot.state.player.location_id,...fixtures.map(f=>f.location)],
  npc_ids:fixtures.map(f=>f.id),
  thread_ids:snapshot.state.narrative_threads.filter(t=>t.status==='open').map(t=>t.id),
  hidden_plan_ids:fixtures.map(f=>f.plan),
  possible_developments:['Either task may later be blocked or abandoned.'],
  exit_conditions:['A future scene naturally concludes the narrative situation.']
});

test('two event-owned NPC plans survive synthetic turn and chapter without sharing secrets',()=>{
  const initial=decodeFiveFiles(files,'CH-000');
  const before=JSON.stringify(initial);
  const turn={key:'qa-two-npc-plan-integration-10',
    player_text:'SYNTHETIC QA: remain at the workbench.',
    intent:'An authorized synthetic workshop interval.',
    outcome:'The workbench remains unchanged as time passes.',
    narration_messages:['SYNTHETIC SCENE: Only the workbench is visible to Jack.'],
    elapsed_days:0,elapsed_minutes:20,next_time_of_day:'morning'};
  const resolutions=fixtures.map(f=>({
    actor_id:f.id,reviewed:true,resolved:true,
    causal_basis:'An independent actor privately reviews an ordinary task.',
    outcome:'SYNTHETIC: the actor records a private intention.',
    changes:[
      {field:'commitments',before:[],after:[obligation(f)]},
      {field:'plans',before:[],after:[plan(f)]}
    ]
  }));
  const staged=stageLivingWorldTurn({snapshot:initial,turn,
    observedHead:fixedHead,npcResolutions:resolutions});
  assert.equal(verifyNarrativeSnapshot(staged),true);
  assert.equal(staged.manifest.last_completed_turn,10);
  assert.equal(staged.manifest.last_event_id,'EV-000032');
  assert.equal(staged.state.time.day,-29);
  assert.equal(staged.state.player.location_id,'LOC-WILSON-WORKSHOP');
  for(const f of fixtures){
    const npc=staged.state.world.actors[f.id];
    assert.equal(npc.location_id,f.location);
    assert.equal(npc.commitments[0].id,f.obligation);
    assert.equal(npc.plans[0].id,f.plan);
    const proposals=evaluateNPCPlans({state:staged.state,actorId:f.id,
      elapsedMinutes:20,elapsedDays:0,
      eventIds:new Set(allEvents(staged).map(event=>event.id))});
    assert.equal(proposals.length,1);
    assert.equal(proposals[0].ready,true);
    assert.equal(npc.plans[0].status,'proposed');
  }
  const diagnostic=playerVisibleDiagnostic(inspectLivingWorld({
    snapshot:staged,actorIds:fixtures.map(f=>f.id),elapsedMinutes:20}));
  for(const f of fixtures){
    assert.ok(!staged.chapter.includes(f.objective));
    assert.ok(!JSON.stringify(diagnostic).includes(f.objective));
  }
  assert.equal(JSON.stringify(initial),before);
  const transitionSource={...staged,sourceFiles:encodeFiveFiles(staged)};
  const closed=stageChapterTransition({
    snapshot:transitionSource,reviewed:true,
    reason:'Synthetic reviewed story-arc boundary after the two independent commitments.',
    observedHead:fixedHead,nextPlan:nextPlan(staged)
  });
  assert.equal(verifyNarrativeSnapshot(closed),true);
  assert.equal(closed.manifest.chapter_id,'CH-001');
  assert.equal(closed.manifest.last_completed_turn,10);
  assert.equal(closed.manifest.last_event_id,'EV-000032');
  assert.equal(closed.manifest.last_transcript_sequence,22);
  assert.equal(closed.state.time.day,-29);
  for(const f of fixtures){
    const actor=closed.state.world.actors[f.id];
    assert.deepEqual(actor.commitments,staged.state.world.actors[f.id].commitments);
    assert.deepEqual(actor.plans,staged.state.world.actors[f.id].plans);
  }
  assert.deepEqual(closed.state.world,staged.state.world);
  for(const [path,body] of Object.entries(files))
    assert.equal(readFileSync(resolve(root,path),'utf8'),body);
});
