// Synthetic, in-memory-only test. Never write invented reports to game/ or chapters/.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {checkNPCFactEvidence,buildContextPacket} from '../tools/context_manager.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {allEvents} from '../tools/chapter_history.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const protectedFiles=Object.fromEntries(savePaths('CH-000')
  .map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const baseline=()=>decodeFiveFiles(protectedFiles,'CH-000');
const sourceActor='NPC-002'; // Sora, established NPC.
const recipient='NPC-007'; // Mara, established NPC.
const sourceClaim='SYNTHETIC QA: Sora posted an unverified notice claiming several panels had failed.';
const heardClaim='SYNTHETIC QA: Mara read Sora\'s unverified panel-failure notice, not an independent finding.';
const sourceCorrection='SYNTHETIC QA: Sora withdrew the panel-failure claim after checking the ordinary maintenance ticket.';
const heardCorrection='SYNTHETIC QA: Mara read Sora\'s correction; the alleged multiple failures were never confirmed.';
const head='a'.repeat(40);
const nextNpcEvent=snapshot=>'EV-'+String(snapshot.manifest.last_event_sequence+2).padStart(6,'0');

function turn(snapshot,label,actorId,fact,source,{revisionOf=null,thread=null}={}){
  const eventId=nextNpcEvent(snapshot);
  const change={field:'knowledge',fact,source};
  if(revisionOf!==null){
    change.revision_of=revisionOf;
    change.revision_reason='SYNTHETIC QA: a later, separately recorded notice changes this actor\'s earlier account.';
  }
  const consequence_updates=thread===null?[]:[{
    op:thread.op,event_id:eventId,summary:thread.summary,visibility:'hidden',
    ...(thread.op==='open'?{
      owner_actor_id:sourceActor,scope:'world',
      question:'Will an unverified equipment notice be corrected after inspection?'
    }:{thread_id:thread.id})
  }];
  return stageLivingWorldTurn({snapshot,observedHead:head,
    turn:{
      key:'qa-news-provenance-'+label,
      intent:'SYNTHETIC QA only: the player does not intervene in the news chain.',
      outcome:'SYNTHETIC QA only: ordinary workshop time passes without new information reaching Jack.',
      player_text:'[SYNTHETIC QA, NOT AN AUTHENTIC PLAYER ACTION] '+label,
      narration_messages:['[SYNTHETIC QA] The workshop remains quiet.'],
      elapsed_days:0,elapsed_minutes:15,next_time_of_day:'morning',
      consequence_updates
    },
    npcResolutions:[{
      actor_id:actorId,reviewed:true,resolved:true,
      causal_basis:'SYNTHETIC QA: actor receives or checks a specific source and judges what to record.',
      outcome:'PRIVATE SYNTHETIC: the actor records a limited report without certifying its contents.',
      changes:[change]
    }]
  });
}

function scenario(){
  const original=baseline(),before=JSON.stringify(original);
  assert.equal(original.manifest.last_completed_turn,9);
  const published=turn(original,'01-published',sourceActor,sourceClaim,
    'SYNTHETIC QA: issued notice after an unverified maintenance report',{
      thread:{op:'open',summary:'Sora issues an unconfirmed maintenance report; the alleged failures are not proved.'}
    });
  const threadId=published.state.narrative_threads.at(-1).id;
  const sourceEvent=published.events.events.at(-1).id;
  const read=turn(published,'02-received',recipient,heardClaim,
    'SYNTHETIC QA: read the specific notice in '+sourceEvent);
  const sourceOriginal=read.state.world.actors[sourceActor].knowledge.at(-1);
  const recipientOriginal=read.state.world.actors[recipient].knowledge.at(-1);
  const corrected=turn(read,'03-corrected',sourceActor,sourceCorrection,
    'SYNTHETIC QA: checked the maintenance ticket and issued a correction',{
      revisionOf:sourceOriginal,
      thread:{op:'resolve',id:threadId,
        summary:'Sora withdraws her unsupported report after direct inspection; no wider failure is established.'}
    });
  const correctionEvent=corrected.events.events.at(-1).id;
  const recipientUpdated=turn(corrected,'04-revised',recipient,heardCorrection,
    'SYNTHETIC QA: read the correction published in '+correctionEvent,{
      revisionOf:recipientOriginal
    });
  assert.equal(JSON.stringify(original),before);
  return {original,published,read,corrected,recipientUpdated,threadId,
    sourceEvent,correctionEvent,sourceOriginal,recipientOriginal};
}

test('one unverified report produces distinct actor events, not a true infrastructure failure',()=>{
  const {original,published,read,threadId,sourceEvent,recipientOriginal}=scenario();
  assert.equal(verifyNarrativeSnapshot(published),true);
  assert.equal(verifyNarrativeSnapshot(read),true);
  assert.equal(original.state.narrative_threads.length+1,published.state.narrative_threads.length);
  assert.equal(published.state.narrative_threads.at(-1).id,threadId);
  assert.deepEqual(published.state.narrative_threads.at(-1).history.map(x=>x.event_id),[sourceEvent]);
  assert.equal(allEvents(published).find(x=>x.id===sourceEvent).actor_ids[0],sourceActor);
  assert.ok(!read.state.world.actors[sourceActor].knowledge.includes(recipientOriginal));
  assert.ok(read.state.world.actors[recipient].knowledge.includes(recipientOriginal));
  assert.equal(checkNPCFactEvidence({snapshot:read,actorId:recipient,fact:sourceClaim}).mayAssumeKnown,false);
  assert.equal(checkNPCFactEvidence({snapshot:read,actorId:recipient,fact:heardClaim}).truthStatus,'not_assessed');
  assert.ok(!published.chapter.includes('PRIVATE SYNTHETIC:'));
});

test('correction remains unknown to the recipient until separately sourced',()=>{
  const {corrected,recipientUpdated,sourceOriginal,recipientOriginal,correctionEvent,threadId}=scenario();
  assert.equal(checkNPCFactEvidence({snapshot:corrected,
    actorId:sourceActor,fact:sourceClaim}).statementRevisionStatus,'explicitly_revised');
  assert.equal(checkNPCFactEvidence({snapshot:corrected,
    actorId:recipient,fact:heardCorrection}).status,'not_recorded');
  assert.equal(checkNPCFactEvidence({snapshot:corrected,
    actorId:recipient,fact:heardClaim}).statementRevisionStatus,'not_marked_revised');
  assert.ok(corrected.state.world.actors[sourceActor].knowledge.includes(sourceOriginal));
  const old=checkNPCFactEvidence({snapshot:recipientUpdated,actorId:recipient,fact:heardClaim});
  assert.equal(old.status,'recorded_event');
  assert.equal(old.truthStatus,'not_assessed');
  assert.equal(old.statementRevisionStatus,'explicitly_revised');
  assert.equal(old.latestLinkedStatementForReview,heardCorrection);
  assert.deepEqual(old.revisionEventIds,[recipientUpdated.events.events.at(-1).id]);
  assert.ok(recipientUpdated.state.world.actors[recipient].knowledge.includes(recipientOriginal));
  assert.deepEqual(recipientUpdated.state.narrative_threads.at(-1).history.map(x=>x.kind),
    ['open','resolve']);
  assert.equal(recipientUpdated.state.narrative_threads.at(-1).resolution_event_id,correctionEvent);
  assert.equal(recipientUpdated.state.narrative_threads.at(-1).id,threadId);
  assert.equal(recipientUpdated.state.narrative_threads.at(-1).status,'resolved');
  assert.equal(recipientUpdated.state.time.day,-29);
  assert.equal(recipientUpdated.manifest.last_completed_turn,13);
  assert.ok(!recipientUpdated.state.player.knowledge.includes(heardCorrection));
  assert.equal(recipientUpdated.state.player.progression.powers.length,0);
  assert.ok(!recipientUpdated.chapter.includes('PRIVATE SYNTHETIC:'));
  assert.ok(!recipientUpdated.transcript.entries.some(entry=>entry.text.includes('PRIVATE SYNTHETIC:')));
  const reader=buildContextPacket({snapshot:recipientUpdated,audience:'reader_visible',
    query:'panel notice'});
  assert.ok(reader.references.every(x=>x.kind==='transcript'));
  assert.ok(!JSON.stringify(reader).includes(heardCorrection));
});

test('unknown and another actor\'s source cannot be used to forge a knowledge correction',()=>{
  const {read,corrected,sourceOriginal}=scenario();
  assert.throws(()=>turn(read,'forged-source',recipient,heardCorrection,
    'SYNTHETIC QA: unreceived claim from another actor',
    {revisionOf:sourceOriginal}),/earlier exact actor-owned memory/);
  assert.throws(()=>turn(corrected,'forged-future',recipient,heardCorrection,
    'SYNTHETIC QA: claim without a received source',
    {revisionOf:'SYNTHETIC QA: missing notice (source: imaginary; EV-999999)'}),
    /earlier exact actor-owned memory/);
  assert.equal(checkNPCFactEvidence({snapshot:read,
    actorId:recipient,fact:heardCorrection}).mayAssumeKnown,false);
});

test('news source and correction survive a synthetic chapter rollover without file writes',()=>{
  const {original,recipientUpdated,sourceEvent,correctionEvent,recipientOriginal}=scenario();
  const plan={plan_version:1,chapter_id:'CH-001',
    title:'SYNTHETIC QA: archival news continuity',status:'prepared',
    source_commit:head,purpose:'SYNTHETIC QA: trace two independent notice versions.',
    time_context:{day:recipientUpdated.state.time.day,
      period:recipientUpdated.state.time.time_of_day,
      constraints:['No fictional news becomes canonical.']},
    location_ids:[recipientUpdated.state.player.location_id],
    npc_ids:[sourceActor,recipient],
    thread_ids:recipientUpdated.state.narrative_threads
      .filter(x=>x.status==='open').map(x=>x.id),
    hidden_plan_ids:[],possible_developments:['Review only the recorded claim sources.'],
    exit_conditions:['End hypothetical check.']};
  const closed=stageChapterTransition({
    snapshot:{...recipientUpdated,sourceFiles:encodeFiveFiles(recipientUpdated)},
    nextPlan:plan,observedHead:head,reason:'SYNTHETIC QA: metadata-only chapter boundary.',
    reviewed:true});
  const recovered=decodeFiveFiles({
    ...encodeFiveFiles(recipientUpdated),...encodeFiveFiles(closed)},'CH-001');
  assert.equal(verifyNarrativeSnapshot(recovered),true);
  const old=checkNPCFactEvidence({snapshot:recovered,actorId:recipient,fact:heardClaim});
  assert.equal(old.statementRevisionStatus,'explicitly_revised');
  assert.ok(recovered.state.world.actors[recipient].knowledge.includes(recipientOriginal));
  assert.ok(allEvents(recovered).some(e=>e.id===sourceEvent&&e.chapter_id==='CH-000'));
  assert.ok(allEvents(recovered).some(e=>e.id===correctionEvent&&e.chapter_id==='CH-000'));
  assert.equal(original.manifest.last_completed_turn,9);
  for(const [path,text] of Object.entries(protectedFiles))
    assert.equal(readFileSync(resolve(root,path),'utf8'),text);
});
