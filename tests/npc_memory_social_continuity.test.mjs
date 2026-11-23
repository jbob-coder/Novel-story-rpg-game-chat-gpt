// NONCANONICAL synthetic integration test: no player action or NPC story event
// from this fixture may be copied into game/ or chapters/.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {savePaths, decodeFiveFiles, encodeFiveFiles} from '../tools/save_transaction.mjs';
import {buildContextPacket, resolvePrivateContextReference,
  checkNPCFactEvidence} from '../tools/context_manager.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {allEvents} from '../tools/chapter_history.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const paths=savePaths('CH-000');
const originals=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const actorId='NPC-005';
const fictionalFact='SYNTHETIC QA: The clock owner requested a later handover instead of a morning return.';
const revisedPlan='SYNTHETIC QA ONLY: keep the repaired clock safe and arrange a later handover.';
const playerProse='SYNTHETIC QA: Jack remains in the workshop; no NPC private conversation is described.';
const makeTurn=n=>({
  key:'qa-social-memory-round-'+n,
  intent:'SYNTHETIC QA: a stationary, uneventful workshop interval.',
  outcome:'SYNTHETIC QA: the workshop remains unchanged.',
  player_text:'SYNTHETIC QA INPUT '+n+' — NOT A REAL PLAYER ACTION',
  narration_messages:[playerProse],
  elapsed_days:0,elapsed_minutes:20,next_time_of_day:'morning'
});
function fakeRemote(){
  const first='a'.repeat(40),commits=new Map([[first,structuredClone(originals)]]);
  let head=first,writeCount=0;
  return {
    commits,get head(){return head},get writes(){return writeCount},
    remote:{
      async readHead(){return head},
      async readFiles(commitSha,requested){
        const files=commits.get(commitSha);
        assert.ok(files,'Unknown QA-only commit');
        return Object.fromEntries(requested.filter(path=>Object.hasOwn(files,path))
          .map(path=>[path,files[path]]));
      },
      async createCommit({parentSha,files}){
        assert.equal(parentSha,head);
        assert.deepEqual(Object.keys(files).sort(),paths.slice().sort());
        const sha=String(++writeCount).padStart(40,'0');
        commits.set(sha,structuredClone(files));
        return sha;
      },
      async updateHead({expectedSha,newSha}){
        assert.equal(expectedSha,head);
        assert.ok(commits.has(newSha));
        head=newSha;
        return true;
      }
    }
  };
}
async function storyRehearsal(){
  const qa=fakeRemote(),first=decodeFiveFiles(originals,'CH-000');
  const originalCheckpoint=JSON.stringify(first);
  assert.ok(!first.state.world.actors[actorId].knowledge.includes(fictionalFact));
  const chat={
    actor_id:actorId,reviewed:true,resolved:true,
    causal_basis:'SYNTHETIC QA: Rosa receives the clock owner at the apartment doorway.',
    outcome:'SYNTHETIC QA PRIVATE: the neighbor asks Rosa to defer the clock handover.',
    changes:[{field:'knowledge',fact:fictionalFact,
      source:'SYNTHETIC QA: Rosa heard this request directly from the clock owner.'}]
  };
  const result1=await saveLivingWorldTurn({
    remote:qa.remote,branch:'qa/npc-memory-social-rehearsal',
    chapterId:'CH-000',turn:makeTurn(1),npcResolutions:[chat]
  });
  assert.equal(result1.status,'verified',result1.reason);
  assert.equal(result1.attempt.percent,100);
  const afterConversation=decodeFiveFiles(qa.commits.get(qa.head),'CH-000');
  const memory=buildContextPacket({snapshot:afterConversation,npcIds:[actorId],query:'Rosa reloj'});
  assert.equal(memory.classification,'narrator_private');
  assert.deepEqual(memory.npcMemory[0].state.knowledge,
    afterConversation.state.world.actors[actorId].knowledge);
  const remembered=memory.npcMemory[0].state.knowledge.find(s=>s.includes(fictionalFact));
  assert.ok(remembered?.includes('EV-000031'));
  assert.ok(memory.npcMemory[0].recentEventReferences.some(ref=>ref.id==='EV-000031'));
  const observation=resolvePrivateContextReference({
    snapshot:afterConversation,referenceId:'EV-000031'});
  assert.equal(observation.data.actor_ids[0],actorId);
  assert.equal(observation.data.known_to.includes('PLAYER-001'),false);
  assert.equal(observation.data.state_changes.find(c=>c.field==='knowledge').fact,fictionalFact);
  assert.ok(!afterConversation.chapter.includes(fictionalFact));
  assert.ok(!afterConversation.transcript.entries.at(-1).text.includes(fictionalFact));
  assert.equal(JSON.stringify(first),originalCheckpoint);

  // The next private choice uses a remembered observation, not a scripted clock.
  const oldPlan=afterConversation.state.world.actors[actorId].independent_plan;
  const oldResources=afterConversation.state.world.actors[actorId].resources;
  const newResources={...oldResources,
    handover:'SYNTHETIC QA ONLY: owner-requested delay; clock remains with Rosa.'};
  const choice={
    actor_id:actorId,reviewed:true,resolved:true,
    causal_basis:'SYNTHETIC QA: Rosa remembers the direct request recorded as EV-000031 and postpones delivery.',
    outcome:'SYNTHETIC QA PRIVATE: Rosa chooses to keep the clock and make a later arrangement.',
    changes:[
      {field:'independent_plan',before:oldPlan,after:revisedPlan},
      {field:'resources',before:oldResources,after:newResources}
    ]
  };
  const result2=await saveLivingWorldTurn({
    remote:qa.remote,branch:'qa/npc-memory-social-rehearsal',
    chapterId:'CH-000',turn:makeTurn(2),npcResolutions:[choice]
  });
  assert.equal(result2.status,'verified',result2.reason);
  assert.equal(result2.attempt.percent,100);
  const afterDecision=decodeFiveFiles(qa.commits.get(qa.head),'CH-000');
  assert.equal(afterDecision.state.world.actors[actorId].independent_plan,revisedPlan);
  assert.equal(afterDecision.state.world.actors[actorId].resources.handover,newResources.handover);
  assert.ok(afterDecision.state.world.actors[actorId].knowledge.includes(remembered));
  assert.deepEqual(afterDecision.state.world.actors[actorId].resources.current_repair,
    first.state.world.actors[actorId].resources.current_repair);
  assert.deepEqual(afterDecision.state.player,first.state.player);
  assert.equal(afterDecision.state.time.day,-29);
  assert.equal(afterDecision.manifest.last_completed_turn,11);
  assert.equal(afterDecision.manifest.last_event_id,'EV-000033');
  const causalEvent=resolvePrivateContextReference({
    snapshot:afterDecision,referenceId:'EV-000033'}).data;
  assert.equal(causalEvent.actor_ids[0],actorId);
  assert.ok(causalEvent.intent.includes('EV-000031'));
  assert.ok(causalEvent.state_changes.some(x=>x.field==='independent_plan'));
  assert.ok(causalEvent.state_changes.some(x=>x.field==='resources'));
  assert.ok(!afterDecision.chapter.includes(revisedPlan));
  assert.ok(!afterDecision.transcript.entries.at(-1).text.includes(revisedPlan));

  const nextPlan={
    plan_version:1,chapter_id:'CH-001',title:'SYNTHETIC QA: continuity only',
    status:'prepared',source_commit:qa.head,
    purpose:'SYNTHETIC QA: verify NPC private knowledge and a revised choice survive a chapter boundary.',
    time_context:{day:afterDecision.state.time.day,
      period:afterDecision.state.time.time_of_day,
      constraints:['Synthetic chapter; do not copy to canonical narrative.']},
    location_ids:[afterDecision.state.player.location_id],npc_ids:[actorId],
    thread_ids:afterDecision.state.narrative_threads
      .filter(thread=>thread.status==='open').map(thread=>thread.id),
    hidden_plan_ids:[],possible_developments:['SYNTHETIC QA: the owner may become available later.'],
    exit_conditions:['SYNTHETIC QA: completed memory continuity rehearsal.']
  };
  const opened=stageChapterTransition({
    snapshot:afterDecision,nextPlan,
    reason:'SYNTHETIC QA: separate chapter boundary, no new player action.',
    observedHead:qa.head,reviewed:true
  });
  assert.equal(verifyNarrativeSnapshot(opened),true);
  const reloaded=decodeFiveFiles({
    ...qa.commits.get(qa.head),...encodeFiveFiles(opened)
  },'CH-001');
  assert.equal(verifyNarrativeSnapshot(reloaded),true);
  const persisted=reloaded.state.world.actors[actorId];
  assert.ok(persisted.knowledge.includes(remembered));
  assert.equal(persisted.independent_plan,revisedPlan);
  assert.equal(persisted.resources.handover,newResources.handover);
  const history=allEvents(reloaded);
  assert.ok(history.some(event=>event.id==='EV-000031'&&event.chapter_id==='CH-000'));
  assert.ok(history.some(event=>event.id==='EV-000033'&&event.chapter_id==='CH-000'));
  const reopenedPacket=buildContextPacket({snapshot:reloaded,npcIds:[actorId]});
  assert.ok(reopenedPacket.npcMemory[0].recentEventReferences
    .some(event=>event.id==='EV-000031'&&event.chapterId==='CH-000'));
  assert.ok(reopenedPacket.npcMemory[0].state.knowledge.includes(remembered));
  assert.equal(reloaded.manifest.last_completed_turn,11);
  assert.equal(reloaded.state.time.day,-29);
  assert.equal(qa.writes,2);
  for(const [path,content] of Object.entries(originals))
    assert.equal(readFileSync(resolve(root,path),'utf8'),content);
  return {afterDecision,reloaded,remembered};
}

test('QA social memory: conversation -> recalled choice -> exact save -> chapter reload',async()=>{
  await storyRehearsal();
});

test('QA memories remain actor-specific and are never returned to reader-visible packets',async()=>{
  const {reloaded,remembered}=await storyRehearsal();
  const other=buildContextPacket({snapshot:reloaded,npcIds:['NPC-006']});
  assert.ok(!other.npcMemory[0].state.knowledge?.includes(remembered));
  assert.ok(!JSON.stringify(other.npcMemory[0]).includes(fictionalFact));
  assert.throws(()=>buildContextPacket({
    snapshot:reloaded,audience:'reader_visible',npcIds:[actorId]
  }),/narrator-private only/);
  const visible=buildContextPacket({snapshot:reloaded,audience:'reader_visible'});
  assert.equal(Object.hasOwn(visible,'npcMemory'),false);
  assert.ok(visible.references.every(ref=>ref.kind==='transcript'&&!Object.hasOwn(ref,'preview')));
});

test('QA checkpoint rejects erasing a learned fact after the choice was saved',async()=>{
  const {reloaded,remembered}=await storyRehearsal();
  const forged=structuredClone(reloaded);
  forged.state.world.actors[actorId].knowledge=
    forged.state.world.actors[actorId].knowledge.filter(fact=>fact!==remembered);
  assert.throws(()=>verifyNarrativeSnapshot(forged),/Recorded knowledge not retained/);
});

test('event-backed NPC learning is verified strictly after chapter reload',async()=>{
 const {reloaded}=await storyRehearsal();
 const correct=checkNPCFactEvidence({snapshot:reloaded,
   actorId,fact:fictionalFact});
 assert.equal(correct.status,'recorded_event');
 assert.equal(correct.sourceEventId,'EV-000031');
 assert.equal(correct.eventPath,'chapters/CH-000.events.json');
 assert.equal(correct.mayAssumeKnown,true);
 const unrelated=checkNPCFactEvidence({snapshot:reloaded,
   actorId:'NPC-006',fact:fictionalFact});
 assert.equal(unrelated.status,'not_recorded');
 assert.equal(unrelated.mayAssumeKnown,false);
 const ungrounded=checkNPCFactEvidence({snapshot:reloaded,
   actorId,fact:'SYNTHETIC QA: The owner has already received the clock.'});
 assert.equal(ungrounded.status,'not_recorded');
 assert.equal(ungrounded.mayAssumeKnown,false);
 const packet=buildContextPacket({snapshot:reloaded,query:'Rosa',
   npcKnowledgeClaims:[{actorId,fact:fictionalFact}]});
 assert.equal(packet.npcKnowledgeChecks[0].status,'recorded_event');
 assert.equal(packet.npcKnowledgeChecks[0].sourceEventId,'EV-000031');
});


test('saved hearsay proves hearing a statement, not the alleged outside truth',async()=>{
 const {reloaded}=await storyRehearsal();
 const heard=checkNPCFactEvidence({snapshot:reloaded,actorId,
   fact:fictionalFact});
 assert.equal(heard.status,'recorded_event');
 assert.equal(heard.mayAssumeKnown,true);
 assert.equal(heard.truthStatus,'not_assessed');
 const rumor=checkNPCFactEvidence({snapshot:reloaded,actorId,
   fact:'SYNTHETIC QA: The clock owner definitely abandoned the city'});
 assert.equal(rumor.status,'not_recorded');
 assert.equal(rumor.mayAssumeKnown,false);
 assert.equal(rumor.truthStatus,'not_assessed');
 assert.ok(rumor.relatedStatementsForReview.some(x=>
   x.statement.includes('clock owner')));
 const another=checkNPCFactEvidence({snapshot:reloaded,actorId:'NPC-006',
   fact:fictionalFact});
 assert.equal(another.status,'not_recorded');
 assert.equal(another.mayAssumeKnown,false);
});
