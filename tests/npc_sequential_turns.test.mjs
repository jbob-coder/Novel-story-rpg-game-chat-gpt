// Synthetic turns only: each next NPC action cites the *actually staged*
// previous result. Never touch the authentic five-file CH-000 checkpoint.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {inspectNPCNextTurn,draftReviewedNPCNextTurn}
 from '../tools/npc_sequential_turns.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';

const files=Object.fromEntries(savePaths('CH-000').map(p=>
 [p,readFileSync(new URL('../'+p,import.meta.url),'utf8')]));
const baseline=()=>decodeFiveFiles(files,'CH-000');
const head='b'.repeat(40);
const actorId='NPC-005';
const turn=n=>({
 key:'qa-synthetic-sequence-'+n,
 intent:'SYNTHETIC QA: no real player action or NPC command.',
 outcome:'The simulated interval passes without giving Jack private NPC facts.',
 player_text:'[SYNTHETIC QA] Quietly remain at the workbench.',
 narration_messages:['[SYNTHETIC QA] A quiet interval passes.'],
 elapsed_days:0,elapsed_minutes:20,next_time_of_day:'morning'
});
const intents=[
 'Rosa checks whether her existing repair arrangement needs coordination with a neighbor.',
 'Rosa reviews the unfinished neighbor contact after her previous private attempt.',
 'Rosa decides to defer the handover until a real opportunity to contact the neighbor arises.'
];
function story(){
 let s=baseline();
 const results=[],firstContext=inspectNPCNextTurn({snapshot:s,actorId});
 let oldPlan=s.state.world.actors[actorId].independent_plan;
 for(let i=0;i<3;i++){
  const focus=inspectNPCNextTurn({snapshot:s,actorId});
  if(i>0)assert.equal(focus.sourceEventId,results[i-1].id);
  const nextPlan='Synthetic QA task continuation after review '+(i+1)+
   ': still waiting for a confirmed neighbor contact.';
  const reviewed=draftReviewedNPCNextTurn({
   snapshot:s,focus,intention:intents[i],
   reasoning:'Only a private review is supported; the clock stays with Rosa and no meeting is claimed.',
   outcome:'SYNTHETIC PRIVATE: Rosa reconsiders her repair task and does not claim delivery '+(i+1)+'.',
   reviewed:true,changes:[{field:'independent_plan',before:oldPlan,after:nextPlan}]
  });
  assert.equal(reviewed.continuation_context.source_event_ids[0],focus.sourceEventId);
  assert.equal(reviewed.resolved,true);
  const stepped=stageLivingWorldTurn({
   snapshot:s,turn:turn(i+1),npcResolutions:[reviewed],observedHead:head});
  assert.equal(verifyNarrativeSnapshot(stepped),true);
  const event=stepped.events.events.at(-1);
  assert.equal(event.actor_ids[0],actorId);
  assert.deepEqual(event.caused_by,[focus.sourceEventId]);
  assert.equal(event.turn,10+i);
  assert.equal(stepped.state.world.actors[actorId].last_resolved_action.event_id,event.id);
  assert.equal(stepped.state.world.actors[actorId].independent_plan,nextPlan);
  assert.equal(stepped.state.player.location_id,baseline().state.player.location_id);
  assert.ok(!stepped.chapter.includes('SYNTHETIC PRIVATE:'));
  assert.ok(stepped.transcript.entries.every(x=>!x.text.includes('SYNTHETIC PRIVATE:')));
  const reloaded=decodeFiveFiles(encodeFiveFiles(stepped),'CH-000');
  assert.equal(verifyNarrativeSnapshot(reloaded),true);
  results.push(event);
  s=reloaded;oldPlan=nextPlan;
 }
 return {s,results,firstContext};
}

test('three serial NPC turns each use the previous verified result as next cause',()=>{
 const {s,results}=story();
 assert.equal(s.manifest.last_completed_turn,12);
 assert.equal(results.length,3);
 assert.equal(new Set(results.map(x=>x.id)).size,3);
 assert.equal(s.state.time.day,-29);
 assert.equal(allEvents(s).length,35);
 assert.deepEqual(results.map(e=>e.caused_by[0]),['EV-000029',results[0].id,results[1].id]);
 assert.equal(baseline().manifest.last_completed_turn,9);
 for(const [p,data] of Object.entries(files))
  assert.equal(readFileSync(new URL('../'+p,import.meta.url),'utf8'),data);
});

test('stale focus cannot reprocess earlier outcome after another NPC decision',()=>{
 const {s,firstContext}=story();
 assert.throws(()=>draftReviewedNPCNextTurn({
  snapshot:s,focus:firstContext,intention:'Rosa considers an ordinary repair follow-up.',
  reasoning:'This wrongly attempts to reuse the old turn nine decision context.',
  outcome:'SYNTHETIC PRIVATE: old action replay must be blocked.',
  reviewed:true}),/Stale NPC turn focus/);
});

test('one NPC cannot resolve two different outcomes within the same turn',()=>{
 const s=baseline(),focus=inspectNPCNextTurn({snapshot:s,actorId});
 const draft=draftReviewedNPCNextTurn({
  snapshot:s,focus,intention:intents[0],
  reasoning:'The saved plan and last repair are the only available causal context.',
  outcome:'SYNTHETIC PRIVATE: Rosa reviews her neighbor task without delivering the clock.',
  reviewed:true
 });
 assert.throws(()=>stageLivingWorldTurn({
  snapshot:s,turn:turn('duplicate'),npcResolutions:[draft,draft],
  observedHead:head}),/Multiple outcomes for one NPC/);
});

test('one turn contains no scripted second-turn result or automatic scheduling',()=>{
 const s=baseline(),focus=inspectNPCNextTurn({snapshot:s,actorId});
 assert.equal(focus.reviewTurn,10);
 assert.equal(focus.previousResult.eventId,'EV-000029');
 assert.equal(focus.intentChosen,false);
 assert.equal(focus.outcomeAssumed,false);
 assert.equal(focus.eventStaged,false);
 assert.ok(!Object.hasOwn(focus,'futureIntents'));
 assert.ok(!Object.hasOwn(focus,'futureOutcomes'));
 assert.equal(s.manifest.last_completed_turn,9);
});

test('source information is actor-specific and cannot be forged by another NPC',()=>{
 const s=baseline(),mismatched=inspectNPCNextTurn({snapshot:s,actorId:'NPC-003'});
 const forged=structuredClone(mismatched);
 forged.sourceEventId='EV-000029'; // Rosa's event, not known by Darius
 assert.throws(()=>draftReviewedNPCNextTurn({
  snapshot:s,focus:forged,
  intention:'Darius acts on secret repair information he never learned.',
  reasoning:'A forged source must not be accepted into the next actor turn.',
  outcome:'SYNTHETIC PRIVATE: this should never be staged.',
  reviewed:true}),/Stale NPC turn focus/);
});
