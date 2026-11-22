// Lote 10: synthetic-only social knowledge chronology and chapter custody.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {draftReviewedSocialContact,verifySocialEventHistory} from '../tools/living_world_social.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {encodeFiveFiles} from '../tools/save_transaction.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const noah='NPC-006',darius='NPC-003',head='a'.repeat(40);
const observing=(message)=>({
 kind:'current_turn_observation',fact:message,
 causal_source:'Synthetic editorial observation, never a canonical play event.',
 observer_actor_id:noah,confirmed_by_reviewer:true
});
const turn=(key)=>({
 key,intent:'Synthetic inspection without a player turn.',
 outcome:'A quiet inspection interval is simulated.',
 player_text:'SYNTHETIC inspect the workshop.',
 narration_messages:['SYNTHETIC workbench remains quiet.'],
 elapsed_days:0,elapsed_minutes:25
});
const pair=(state,{id,speaker,recipient,knownEntry})=>
 draftReviewedSocialContact({state,reviewed:true,
  interactionId:id,participantIds:[darius,noah],
  observation:observing('SYNTHETIC Darius and Noah reviewed a short direct exchange.'),
  relationshipUpdates:[],knowledgeTransfer:{
   speaker_id:speaker,recipient_id:recipient,known_entry:knownEntry
  },
  outcomes:{
   [darius]:'Darius reflects privately upon a witnessed synthetic statement.',
   [noah]:'Noah records the private synthetic encounter and continues his day.'
  }});
const stage=(snapshot,resolutions,key)=>stageLivingWorldTurn({
 snapshot,observedHead:head,npcResolutions:resolutions,turn:turn(key)
});
const first=()=>{
 const knowledge=baseline.state.world.actors[noah].knowledge[0];
 const resolutions=pair(baseline.state,{id:'SOC-CHAIN-INIT-001',
  speaker:noah,recipient:darius,knownEntry:knowledge});
 return stage(baseline,resolutions,'synthetic-social-chain-first');
};
const close=(snapshot)=>stageChapterTransition({
 snapshot:{...snapshot,sourceFiles:encodeFiveFiles(snapshot)},
 nextPlan:{plan_version:1,chapter_id:'CH-001',
  title:'Synthetic social continuity',status:'prepared',source_commit:head,
  purpose:'Verify evidence without authoring a live scene.',
  time_context:{day:snapshot.state.time.day,
   period:snapshot.state.time.time_of_day,
   constraints:['No powers or new world admission']},
  location_ids:[snapshot.state.player.location_id],npc_ids:[noah,darius],
  thread_ids:[],hidden_plan_ids:[],
  possible_developments:['A sourced private exchange may be reviewed.'],
  exit_conditions:['Close the synthetic test chapter.']},
 reason:'Synthetic QA boundary for closed-chapter social evidence.',
 observedHead:head,reviewed:true
});

test('social testimony can be retransmitted only after a recorded earlier exchange',()=>{
 const original=JSON.stringify(baseline);
 const one=first();
 const learned=one.state.world.actors[darius].knowledge.at(-1);
 assert.ok(learned.startsWith('Reported by NPC-006 (not independently verified):'));
 assert.ok(learned.includes('EV-000032'));
 const closed=close(one);
 assert.equal(closed.manifest.chapter_id,'CH-001');
 assert.equal(closed.archives['CH-000'].events.events.at(-1).social_context.interaction_id,
  'SOC-CHAIN-INIT-001');
 assert.equal(verifySocialEventHistory(closed),true);
 const second=stage(closed,pair(closed.state,{id:'SOC-CHAIN-FOLLOWUP-002',
  speaker:darius,recipient:noah,knownEntry:learned}),
  'synthetic-social-chain-followup');
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(verifySocialEventHistory(second),true);
 assert.equal(second.manifest.last_completed_turn,11);
 assert.equal(second.manifest.last_event_id,'EV-000035');
 assert.equal(second.archives['CH-000'].events.events.at(-1).id,'EV-000032');
 assert.equal(second.events.events.length,3);
 assert.equal(second.events.events[2].caused_by.includes(second.events.events[1].id),true);
 assert.ok(second.state.world.actors[noah].knowledge.at(-1).includes(
  'Reported by NPC-003 (not independently verified):'));
 assert.ok(!second.chapter.includes(learned));
 assert.equal(JSON.stringify(baseline),original);
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('a future-acquired statement cannot be forged as an earlier social source',()=>{
 const one=first();
 const futureStatement='Synthetic future-only maritime report learned after the first exchange.';
 const future=stage(one,[{
  actor_id:noah,reviewed:true,resolved:true,
  causal_basis:'Synthetic source event establishes a later private fact.',
  outcome:'Synthetic later observation is recorded only in private memory.',
  changes:[{field:'knowledge',fact:futureStatement,
   source:'SYNTHETIC later direct observation by Noah'}],
  disclosures:[]
 }],'synthetic-social-future-source');
 const later=future.state.world.actors[noah].knowledge.at(-1);
 assert.ok(later.includes('EV-000034'));
 assert.equal(verifyNarrativeSnapshot(future),true);
 const forged=structuredClone(future);
 const social=forged.events.events.filter(e=>e.social_context?.interaction_id===
  'SOC-CHAIN-INIT-001');
 assert.equal(social.length,2);
 for(const event of social)event.social_context.transfer.known_entry=later;
 const recipient=social.find(e=>e.actor_ids[0]===darius);
 const knowledge=recipient.state_changes.find(c=>c.field==='knowledge');
 const previous=knowledge.after;
 knowledge.fact='Reported by '+noah+' (not independently verified): '+later;
 knowledge.after=knowledge.fact+' (source: '+knowledge.source+'; '+recipient.id+')';
 const entries=forged.state.world.actors[darius].knowledge;
 entries.splice(entries.indexOf(previous),1,knowledge.after);
 assert.throws(()=>verifySocialEventHistory(forged),
  /Social speaker had not yet learned the transferred statement/);
});

test('the full archive verifier rejects rewritten earlier speaker testimony',()=>{
 const closed=close(first());
 const broken=structuredClone(closed);
 const old=broken.archives['CH-000'].events.events.filter(e=>
  e.social_context?.interaction_id==='SOC-CHAIN-INIT-001');
 assert.equal(old.length,2);
 const invented='Synthetic fact the speaker never held before the turn.';
 for(const event of old)event.social_context.transfer.known_entry=invented;
 const recipient=old.find(event=>event.actor_ids[0]===darius);
 const change=recipient.state_changes.find(c=>c.field==='knowledge');
 const before=change.after;
 change.fact='Reported by '+noah+' (not independently verified): '+invented;
 change.after=change.fact+' (source: '+change.source+'; '+recipient.id+')';
 const known=broken.state.world.actors[darius].knowledge;
 known.splice(known.indexOf(before),1,change.after);
 assert.throws(()=>verifySocialEventHistory(broken),
  /Social speaker had not yet learned the transferred statement/);
 assert.throws(()=>verifyNarrativeSnapshot(broken),/Closed chapter/);
});

test('reusing a social interaction ID in another chapter is rejected',()=>{
 const prior=close(first());
 const next=stage(prior,pair(prior.state,{id:'SOC-CHAIN-REPEAT-002',
  speaker:darius,recipient:noah,
  knownEntry:prior.state.world.actors[darius].knowledge.at(-1)}),
  'synthetic-social-second-identity');
 const forged=structuredClone(next);
 for(const event of forged.events.events.filter(x=>x.social_context))
  event.social_context.interaction_id='SOC-CHAIN-INIT-001';
 assert.throws(()=>verifySocialEventHistory(forged),
  /Saved social exchange requires two linked events in one turn/);
});

test('a later ordinary turn retains private social evidence without duplication',()=>{
 const archived=close(first());
 const next=stage(archived,[],
  'synthetic-social-no-new-contact');
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.equal(verifySocialEventHistory(next),true);
 assert.equal(allEvents(next).filter(e=>e.social_context).length,2);
 assert.equal(next.archives['CH-000'].events.events.filter(e=>e.social_context).length,2);
 assert.ok(next.transcript.entries.every(x=>!x.text?.includes('SOC-CHAIN-INIT-001')));
 assert.equal(baseline.manifest.last_completed_turn,9);
});
