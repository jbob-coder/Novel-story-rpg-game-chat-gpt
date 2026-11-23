// Integration acceptance only: synthetic in-memory turns. No canonical writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {draftReviewedSocialContact} from '../tools/living_world_social.mjs';
import {draftReviewedNPCCausalContinuation,
  verifyNPCCausalContinuationHistory} from '../tools/living_world_causal_continuations.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {checkNPCFactEvidence,buildContextPacket} from '../tools/context_manager.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';

const protectedPaths=savePaths('CH-000');
const authentic=Object.fromEntries(protectedPaths.map(path=>
  [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const original=()=>decodeFiveFiles(authentic,'CH-000');
const head='a'.repeat(40);
const speaker='NPC-006',recipient='NPC-003',bystander='NPC-002';
const reason='The recipient considers a report actually heard at the market, without claiming it true.';
const outcome='The recipient privately checks ordinary supply options before deciding whether to act.';

function stage(snapshot,key,resolutions=[]){
  return stageLivingWorldTurn({snapshot,observedHead:head,
    turn:{key:'synthetic-acceptance-'+key,
      intent:'SYNTHETIC QA ONLY: Jack examines his bench and does not direct the NPCs.',
      outcome:'No player intervention or information transfer is implied.',
      player_text:'[SYNTHETIC QA ONLY] Inspect the bench.',
      narration_messages:['[SYNTHETIC QA] An ordinary workshop interval passes.'],
      elapsed_days:0,elapsed_minutes:15},
    npcResolutions:resolutions});
}

function draft(snapshot,actorId,sourceEventId,chosenOutcome=outcome){
  return draftReviewedNPCCausalContinuation({snapshot,actorId,
    sourceEventIds:[sourceEventId],reasoning:reason,
    outcome:chosenOutcome,reviewed:true,changes:[]});
}

function rehearsal(){
  const start=original(),unchanged=JSON.stringify(start);
  assert.equal(start.manifest.last_completed_turn,9);
  const knownEntry=start.state.world.actors[speaker].knowledge[0];
  assert.equal(typeof knownEntry,'string');
  const exchange=draftReviewedSocialContact({
    state:start.state,interactionId:'SOC-ACCEPT-0001',
    participantIds:[speaker,recipient],
    observation:{kind:'current_turn_observation',
      fact:'SYNTHETIC QA: the two colleagues discuss a limited supply report at Market Row.',
      causal_source:'SYNTHETIC QA: directly witnessed two-person market conversation.',
      observer_actor_id:speaker,confirmed_by_reviewer:true},
    knowledgeTransfer:{speaker_id:speaker,recipient_id:recipient,known_entry:knownEntry},
    outcomes:{
      [speaker]:'SYNTHETIC QA PRIVATE: the speaker shares one previously known statement.',
      [recipient]:'SYNTHETIC QA PRIVATE: the recipient hears that statement but cannot verify it.'
    },reviewed:true
  });
  const heard=stage(start,'01-private-exchange',exchange);
  const receipt=heard.events.events.at(-1);
  const knowledgeChange=receipt.state_changes.find(change=>change.field==='knowledge');
  assert.ok(knowledgeChange);
  const independent=draft(heard,recipient,receipt.id);
  const acted=stage(heard,'02-independent-followup',[independent]);
  assert.equal(JSON.stringify(start),unchanged);
  return {start,heard,receipt,knowledgeChange,independent,acted,unchanged};
}

test('acceptance 1: direct report reaches only its recorded recipient',()=>{
  const {start,heard,receipt,knowledgeChange}=rehearsal();
  assert.equal(verifyNarrativeSnapshot(heard),true);
  assert.equal(receipt.actor_ids[0],recipient);
  assert.equal(checkNPCFactEvidence({snapshot:heard,actorId:recipient,
    fact:knowledgeChange.fact}).status,'recorded_event');
  assert.equal(checkNPCFactEvidence({snapshot:heard,actorId:bystander,
    fact:knowledgeChange.fact}).status,'not_recorded');
  assert.deepEqual(heard.state.world.actors[bystander].knowledge,
    start.state.world.actors[bystander].knowledge);
  assert.ok(!heard.state.player.knowledge.includes(knowledgeChange.fact));
});

test('acceptance 2: independent NPC follow-up cites a known, earlier event',()=>{
  const {heard,receipt,acted}=rehearsal();
  const last=acted.events.events.at(-1);
  assert.equal(verifyNarrativeSnapshot(acted),true);
  assert.equal(last.kind,'independent_actor');
  assert.equal(last.actor_ids[0],recipient);
  assert.deepEqual(last.caused_by,[receipt.id]);
  assert.deepEqual(last.continuation_context.source_event_ids,[receipt.id]);
  assert.deepEqual(last.progression_awards,[]);
  assert.equal(verifyNPCCausalContinuationHistory(acted).length,1);
  assert.equal(heard.manifest.last_completed_turn,10);
  assert.equal(acted.manifest.last_completed_turn,11);
  assert.equal(acted.state.world.actors[bystander].last_resolved_action?.event_id,
    heard.state.world.actors[bystander].last_resolved_action?.event_id);
});

test('acceptance 3: previews allow a different decision without an action menu or world tick',()=>{
  const {heard,receipt}=rehearsal();
  const before=JSON.stringify(heard);
  const alternative=draft(heard,recipient,receipt.id,
    'The recipient keeps the report private and postpones checking supplies.');
  assert.equal(alternative.resolved,true);
  assert.equal(Object.hasOwn(alternative,'action_type'),false);
  assert.equal(Object.hasOwn(alternative,'menu_choice'),false);
  assert.notEqual(alternative.outcome,outcome);
  assert.equal(JSON.stringify(heard),before);
  assert.equal(heard.manifest.last_completed_turn,10);
});

test('acceptance 4: forged knowledge, chronology and disclosure fail closed',()=>{
  const {heard,receipt,acted,knowledgeChange}=rehearsal();
  assert.throws(()=>draft(heard,bystander,receipt.id),/event it does not know/);
  const corrupted=structuredClone(acted);
  corrupted.events.events.at(-1).caused_by=['EV-999999'];
  assert.throws(()=>verifyNarrativeSnapshot(corrupted));
  const safe=buildContextPacket({snapshot:acted,audience:'reader_visible',
    query:'supply report',maxReferences:20});
  assert.ok(safe.references.every(ref=>ref.kind==='transcript'));
  assert.equal(JSON.stringify(safe).includes(knowledgeChange.fact),false);
  assert.equal(acted.chapter.includes(knowledgeChange.fact),false);
  assert.ok(acted.transcript.entries.every(e=>!e.text.includes(knowledgeChange.fact)));
});

test('acceptance 5: recipient knowledge and causal actions survive a synthetic chapter change',()=>{
  const {acted,receipt,knowledgeChange}=rehearsal();
  const plan={plan_version:1,chapter_id:'CH-001',
    title:'SYNTHETIC QA: autonomous NPC memory acceptance',status:'prepared',
    source_commit:head,
    purpose:'Verify recipient-only memory and ordinary NPC choices across archives.',
    time_context:{day:acted.state.time.day,period:acted.state.time.time_of_day,
      constraints:['No authentic player action, extra disclosure or background tick.']},
    location_ids:[acted.state.player.location_id],
    npc_ids:[speaker,recipient],thread_ids:[],hidden_plan_ids:[],
    possible_developments:['The recipient may act or keep the report private in a later turn.'],
    exit_conditions:['The synthetic archive and source events pass verification.']};
  const closed=stageChapterTransition({
    snapshot:{...acted,sourceFiles:encodeFiveFiles(acted)},nextPlan:plan,
    reason:'SYNTHETIC QA: chapter rollover with no real story changes.',
    observedHead:head,reviewed:true});
  const restored=decodeFiveFiles({
    ...encodeFiveFiles(acted),...encodeFiveFiles(closed)},'CH-001');
  assert.equal(verifyNarrativeSnapshot(restored),true);
  assert.equal(restored.manifest.chapter_id,'CH-001');
  assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:recipient,
    fact:knowledgeChange.fact}).status,'recorded_event');
  assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:bystander,
    fact:knowledgeChange.fact}).status,'not_recorded');
  assert.ok(allEvents(restored).some(e=>e.id===receipt.id));
  assert.equal(verifyNPCCausalContinuationHistory(restored).length,1);
  for(const [path,bytes] of Object.entries(authentic))
    assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
  assert.equal(original().manifest.last_completed_turn,9);
});
