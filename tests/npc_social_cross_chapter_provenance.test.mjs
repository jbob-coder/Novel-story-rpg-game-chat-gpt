// Lote 10: synthetic-only social knowledge chronology and chapter custody.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {draftReviewedSocialContact,verifySocialEventHistory} from '../tools/living_world_social.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {encodeFiveFiles,decodeFiveFiles} from '../tools/save_transaction.mjs';
import {checkNPCFactEvidence,buildContextPacket} from '../tools/context_manager.mjs';

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

test('a forged acquired-knowledge event ID is rejected during social replay',()=>{
 const forged=structuredClone(first());
 const recipient=forged.events.events.at(-1);
 const learned=recipient.state_changes.find(change=>change.field==='knowledge');
 assert.ok(learned.after.includes(recipient.id));
 learned.after=learned.after.replace(recipient.id,'EV-999999');
 assert.throws(()=>verifySocialEventHistory(forged),
  /Event-backed NPC knowledge has inconsistent source or event ID/);
});


test('distinct private recipient accounts survive CH-001 reload and inform only reviewed directional relation changes',()=>{
 const baselineBefore=JSON.stringify(baseline),mara='NPC-007',sora='NPC-002';
 const sourceFact='SYNTHETIC QA PRIVATE: a sealed repair package contains an undisclosed client address and delivery instructions.';
 const source=stage(baseline,[{
  actor_id:darius,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Darius privately reads a sealed repair order.',
  outcome:'SYNTHETIC QA PRIVATE: Darius alone retains the customer note.',
  changes:[{field:'knowledge',fact:sourceFact,
    source:'SYNTHETIC QA: inspected a sealed customer repair order'}]
 }],'synthetic-cross-recipients-source');
 const sourceEntry=source.state.world.actors[darius].knowledge.at(-1);
 assert.ok(sourceEntry.includes('EV-000031'));
 const observation=(recipient,tag)=>({
  kind:'current_turn_observation',
  fact:'SYNTHETIC QA: '+tag+' spoke privately with Darius in Market Row.',
  causal_source:'SYNTHETIC QA: independently reviewed ordinary conversation.',
  observer_actor_id:recipient,confirmed_by_reviewer:true
 });
 const talk=(snapshot,id,recipient,mode,reportedText,updates,tag)=>draftReviewedSocialContact({
  state:snapshot.state,interactionId:id,reviewed:true,
  participantIds:[darius,recipient],
  observation:observation(recipient,tag),relationshipUpdates:updates,
  knowledgeTransfer:mode===null?null:{
    speaker_id:darius,recipient_id:recipient,known_entry:sourceEntry,
    reported_form:mode,reported_text:reportedText
  },
  outcomes:{
   [darius]:'Darius acts independently and reviews how much he wants to share.',
   [recipient]:'The listener interprets an attributed report without knowing the original note.'
  }
 });
 const partialText='A repair package is coming; the recipient and address were not shared.';
 const partial=stage(source,talk(source,'SOC-ARCH-PARTIAL-01',noah,'partial',partialText,
  [{actorId:darius,relation:'contacto comercial',bond:'interés reservado'}],'Noah'),
  'synthetic-cross-recipients-partial');
 assert.equal(verifyNarrativeSnapshot(partial),true);
 const maraMoved=stage(partial,[{
  actor_id:mara,reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC QA: Mara chooses to walk from Café Bruma to Market Row.',
  outcome:'SYNTHETIC QA: Mara reaches Market Row after a brief walk.',
  changes:[{field:'location_id',before:'LOC-CAFE-BRUMA',after:'LOC-COMMERCIAL-DISTRICT',
   route:['LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT'],
   travel:{mode:'walk',basis:'SYNTHETIC QA: café to market sidewalk',elapsed_minutes:12}}]
 }],'synthetic-cross-recipients-walk');
 const alteredText='Darius says the order was cancelled; he did not reveal a customer name.';
 const both=stage(maraMoved,talk(maraMoved,'SOC-ARCH-ALTERED-02',mara,'altered',alteredText,
  [{actorId:mara,relation:'contacto de mercado',bond:'reserva profesional'}],'Mara'),
  'synthetic-cross-recipients-altered');
 assert.equal(verifyNarrativeSnapshot(both),true);
 assert.equal(verifySocialEventHistory(both),true);
 const archived=close(both);
 const restored=decodeFiveFiles({...encodeFiveFiles(both),...encodeFiveFiles(archived)},'CH-001');
 assert.equal(verifyNarrativeSnapshot(restored),true);
 assert.equal(verifySocialEventHistory(restored),true);
 const reported=(entry)=>'Reported by NPC-003 (not independently verified): '+entry;
 const firstCheck=checkNPCFactEvidence({snapshot:restored,actorId:noah,fact:reported(partialText)});
 const secondCheck=checkNPCFactEvidence({snapshot:restored,actorId:mara,fact:reported(alteredText)});
 assert.equal(firstCheck.status,'recorded_event');
 assert.equal(secondCheck.status,'recorded_event');
 assert.equal(firstCheck.eventPath,'chapters/CH-000.events.json');
 assert.equal(secondCheck.eventPath,'chapters/CH-000.events.json');
 assert.equal(firstCheck.socialTransmissionEvidence.speakerActorId,darius);
 assert.equal(firstCheck.socialTransmissionEvidence.recipientActorId,noah);
 assert.equal(firstCheck.socialTransmissionEvidence.reportedForm,'partial');
 assert.equal(firstCheck.socialTransmissionEvidence.sourceStatementOriginEventId,'EV-000031');
 assert.equal(firstCheck.socialTransmissionEvidence.truthStatus,'not_assessed');
 assert.equal(secondCheck.socialTransmissionEvidence.recipientActorId,mara);
 assert.equal(secondCheck.socialTransmissionEvidence.reportedForm,'altered');
 assert.equal(secondCheck.socialTransmissionEvidence.sourceStatementOriginEventId,'EV-000031');
 assert.equal(secondCheck.socialTransmissionEvidence.truthStatus,'not_assessed');
 assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:noah,
  fact:reported(alteredText)}).status,'not_recorded');
 assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:mara,
  fact:reported(partialText)}).status,'not_recorded');
 assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:sora,
  fact:reported(partialText)}).status,'not_recorded');
 assert.equal(restored.state.world.actors[darius].relationships[noah].bond,'interés reservado');
 assert.equal(restored.state.world.actors[noah].relationships[darius],undefined);
 assert.equal(restored.state.world.actors[mara].relationships[darius].bond,'reserva profesional');
 assert.equal(restored.state.world.actors[darius].relationships[mara],undefined);
 const laterNoah=stage(restored,talk(restored,'SOC-REVIEW-NOAH-03',noah,null,null,
  [{actorId:darius,bond:'confianza limitada tras escuchar dudas'}],'Noah otra vez'),
  'synthetic-post-chapter-noah-relation');
 const laterMara=stage(laterNoah,talk(laterNoah,'SOC-REVIEW-MARA-04',mara,null,null,
  [{actorId:mara,bond:'escepticismo cauteloso'}],'Mara otra vez'),
  'synthetic-post-chapter-mara-relation');
 assert.equal(verifyNarrativeSnapshot(laterMara),true);
 assert.equal(verifySocialEventHistory(laterMara),true);
 assert.equal(laterMara.state.world.actors[darius].relationships[noah].bond,
  'confianza limitada tras escuchar dudas');
 assert.equal(laterMara.state.world.actors[mara].relationships[darius].bond,
  'escepticismo cauteloso');
 assert.equal(laterMara.state.world.actors[darius].relationships[mara],undefined);
 assert.equal(laterMara.state.world.actors[noah].relationships[darius],undefined);
 assert.deepEqual(laterMara.state.world.actors[noah].knowledge,
  restored.state.world.actors[noah].knowledge);
 assert.deepEqual(laterMara.state.world.actors[mara].knowledge,
  restored.state.world.actors[mara].knowledge);
 assert.equal(allEvents(laterMara).filter(x=>x.social_context).length,8);
 assert.equal(laterMara.events.events.filter(x=>x.social_context).length,4);
 assert.equal(laterMara.archives['CH-000'].events.events.filter(x=>x.social_context).length,4);
 const privatePacket=buildContextPacket({snapshot:laterMara,audience:'narrator_private',
  npcKnowledgeClaims:[{actorId:noah,fact:reported(partialText)},
                      {actorId:mara,fact:reported(alteredText)}]});
 assert.deepEqual(privatePacket.npcKnowledgeChecks.map(x=>x.socialTransmissionEvidence.reportedForm),
  ['partial','altered']);
 const reader=buildContextPacket({snapshot:laterMara,audience:'reader_visible'});
 assert.equal(reader.npcKnowledgeChecks,undefined);
 assert.ok(reader.references.every(x=>x.kind==='transcript'));
 for(const statement of [sourceFact,partialText,alteredText])
  assert.equal(JSON.stringify(reader).includes(statement),false);
 assert.equal(JSON.stringify(baseline),baselineBefore);
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('closed-chapter social report details cannot be silently altered after archival custody',()=>{
 const old=close(first()),tampered=structuredClone(old);
 const event=tampered.archives['CH-000'].events.events.find(e=>e.social_context &&
  e.social_context.transfer?.recipient_id===darius);
 assert.ok(event);
 event.social_context.transfer.known_entry='SYNTHETIC QA: forged later source.';
 assert.throws(()=>verifyNarrativeSnapshot(tampered),/Closed chapter|archive|historical|Social speaker/i);
});
