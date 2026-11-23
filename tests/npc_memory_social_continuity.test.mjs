// NONCANONICAL synthetic integration test: no player action or NPC story event
// from this fixture may be copied into game/ or chapters/.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveLivingWorldTurn,stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
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


test('synthetic corrected belief survives chapter recovery without deleting earlier memory',async()=>{
 const {afterDecision}=await storyRehearsal();
 const before=JSON.stringify(afterDecision);
 const previous=afterDecision.state.world.actors[actorId].knowledge.find(x=>
   x.includes(fictionalFact));
 assert.ok(previous?.includes('EV-000031'));
 const revisedFact='SYNTHETIC QA: The clock owner now requests handover today.';
 const changedPlan='SYNTHETIC QA ONLY: arrange handover today after new owner request.';
 const proposed={actor_id:actorId,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Rosa receives a newer request directly from the clock owner.',
   outcome:'SYNTHETIC QA PRIVATE: Rosa updates her plan without losing the earlier request.',
   changes:[{field:'knowledge',fact:revisedFact,
     source:'SYNTHETIC QA: direct owner update',
     revision_of:previous,
     revision_reason:'The owner directly changed their preferred handover time.'},
   {field:'independent_plan',
     before:afterDecision.state.world.actors[actorId].independent_plan,
     after:changedPlan}]};
 const staged=stageLivingWorldTurn({snapshot:afterDecision,
   turn:makeTurn(3),observedHead:'a'.repeat(40),npcResolutions:[proposed]});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(JSON.stringify(afterDecision),before);
 assert.equal(staged.manifest.last_completed_turn,12);
 assert.equal(staged.manifest.last_event_id,'EV-000035');
 const oldCheck=checkNPCFactEvidence({snapshot:staged,actorId,fact:fictionalFact});
 assert.equal(oldCheck.status,'recorded_event');
 assert.equal(oldCheck.mayAssumeKnown,true);
 assert.equal(oldCheck.statementRevisionStatus,'explicitly_revised');
 assert.deepEqual(oldCheck.revisionEventIds,['EV-000035']);
 assert.equal(oldCheck.latestLinkedStatementForReview,revisedFact);
 const newCheck=checkNPCFactEvidence({snapshot:staged,actorId,fact:revisedFact});
 assert.equal(newCheck.status,'recorded_event');
 assert.equal(newCheck.statementRevisionStatus,'not_marked_revised');
 const ignorant=checkNPCFactEvidence({snapshot:staged,
   actorId:'NPC-006',fact:revisedFact});
 assert.equal(ignorant.mayAssumeKnown,false);
 assert.equal(ignorant.status,'not_recorded');
 assert.ok(staged.state.world.actors[actorId].knowledge.includes(previous));
 assert.ok(staged.state.world.actors[actorId].knowledge.some(x=>x.includes(revisedFact)));
 const nextPlan={plan_version:1,chapter_id:'CH-001',
   title:'SYNTHETIC QA: revised knowledge continuity',status:'prepared',
   source_commit:'a'.repeat(40),
   purpose:'SYNTHETIC QA: preserve a later correction and the initial claim.',
   time_context:{day:staged.state.time.day,period:staged.state.time.time_of_day,
     constraints:['No new canon or unreviewed player action.']},
   location_ids:[staged.state.player.location_id],npc_ids:[actorId],
   thread_ids:staged.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
   hidden_plan_ids:[],possible_developments:['Review synthetic correction evidence.'],
   exit_conditions:['Synthetic continuity review ends.']};
 const closed=stageChapterTransition({snapshot:{...staged,
     sourceFiles:encodeFiveFiles(staged)},nextPlan,observedHead:'a'.repeat(40),
   reason:'Synthetic chapter transition after a revised private claim.',reviewed:true});
 const reloaded=decodeFiveFiles({...encodeFiveFiles(staged),
   ...encodeFiveFiles(closed)},'CH-001');
 assert.equal(verifyNarrativeSnapshot(reloaded),true);
 assert.deepEqual(checkNPCFactEvidence({snapshot:reloaded,
   actorId,fact:fictionalFact}).revisionEventIds,['EV-000035']);
 assert.deepEqual(checkNPCFactEvidence({snapshot:reloaded,
   actorId,fact:fictionalFact}).latestLinkedStatementForReview,revisedFact);
 assert.equal(reloaded.state.world.actors[actorId].independent_plan,changedPlan);
 assert.ok(reloaded.state.world.actors[actorId].knowledge.includes(previous));
 assert.ok(!reloaded.chapter.includes(revisedFact));
 const safe=buildContextPacket({snapshot:reloaded,audience:'reader_visible'});
 assert.equal(safe.npcKnowledgeChecks,undefined);
 for(const [path,text] of Object.entries(originals))
   assert.equal(readFileSync(resolve(root,path),'utf8'),text);
});


// Synthetic competing testimonies are not canonical dialogue or player turns.
function syntheticClaimTurn(snapshot,n,fact,source,revisionOf=null){
 const change={field:'knowledge',fact,source};
 if(revisionOf!==null){
   change.revision_of=revisionOf;
   change.revision_reason='SYNTHETIC QA: revised after a later, attributable report.';
 }
 return stageLivingWorldTurn({snapshot,turn:makeTurn(n),observedHead:'a'.repeat(40),
   npcResolutions:[{actor_id:actorId,reviewed:true,resolved:true,
     causal_basis:'SYNTHETIC QA: Rosa hears a new private and attributable statement.',
     outcome:'SYNTHETIC QA PRIVATE: Rosa records the report without judging its truth.',
     changes:[change]}]});
}

test('three linked NPC statements preserve the entire chronology and never rewrite the original',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const before=JSON.stringify(afterDecision);
 const first='SYNTHETIC QA: neighbor claims delivery is planned for Monday.';
 const second='SYNTHETIC QA: clock owner reports delivery is planned for Tuesday.';
 const step1=syntheticClaimTurn(afterDecision,3,first,'SYNTHETIC QA: neighbor testimony',remembered);
 const firstEntry=step1.state.world.actors[actorId].knowledge.at(-1);
 const step2=syntheticClaimTurn(step1,4,second,'SYNTHETIC QA: direct owner testimony',firstEntry);
 assert.equal(verifyNarrativeSnapshot(step2),true);
 const old=checkNPCFactEvidence({snapshot:step2,actorId,fact:fictionalFact});
 assert.equal(old.status,'recorded_event');
 assert.equal(old.statementRevisionStatus,'explicitly_revised');
 assert.deepEqual(old.revisionEventIds,['EV-000035','EV-000037']);
 assert.equal(old.latestLinkedStatementForReview,second);
 assert.equal(old.truthStatus,'not_assessed');
 assert.ok(step2.state.world.actors[actorId].knowledge.includes(remembered));
 assert.ok(step2.state.world.actors[actorId].knowledge.includes(firstEntry));
 assert.equal(step2.state.world.actors[actorId].knowledge.length,
   afterDecision.state.world.actors[actorId].knowledge.length+2);
 const other=checkNPCFactEvidence({snapshot:step2,actorId:'NPC-006',fact:second});
 assert.equal(other.status,'not_recorded');
 assert.equal(other.mayAssumeKnown,false);
 assert.equal(JSON.stringify(afterDecision),before);
 const reader=buildContextPacket({snapshot:step2,audience:'reader_visible'});
 assert.equal(reader.npcKnowledgeChecks,undefined);
 assert.equal(reader.npcMemory,undefined);
});

test('forked NPC testimony exposes distinct latest statements without choosing a winner',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const reportA='SYNTHETIC QA: a neighbor asserts pickup will happen at dawn.';
 const reportB='SYNTHETIC QA: the clock owner asserts pickup is postponed a week.';
 const reportC='SYNTHETIC QA: a second neighbor repeats the dawn pickup claim.';
 const step1=syntheticClaimTurn(afterDecision,3,reportA,
   'SYNTHETIC QA: first neighbor report',remembered);
 const entryA=step1.state.world.actors[actorId].knowledge.at(-1);
 const step2=syntheticClaimTurn(step1,4,reportB,
   'SYNTHETIC QA: owner report',remembered);
 const step3=syntheticClaimTurn(step2,5,reportC,
   'SYNTHETIC QA: second neighbor report',entryA);
 assert.equal(verifyNarrativeSnapshot(step3),true);
 const review=checkNPCFactEvidence({snapshot:step3,actorId,fact:fictionalFact});
 assert.equal(review.status,'recorded_event');
 assert.equal(review.statementRevisionStatus,'multiple_review_required');
 assert.deepEqual(review.revisionEventIds,['EV-000035','EV-000037','EV-000039']);
 assert.equal(review.alternativeStatementCount,2);
 assert.equal(review.latestLinkedStatementForReview,undefined);
 assert.deepEqual(review.alternativeLatestStatementsForReview.map(x=>x.statement),
   [reportB,reportC]);
 assert.deepEqual(review.alternativeLatestStatementsForReview.map(x=>x.sourceEventId),
   ['EV-000037','EV-000039']);
 assert.deepEqual(review.alternativeLatestStatementsForReview[1].revisionPathEventIds,
   ['EV-000035','EV-000039']);
 assert.ok(review.alternativeLatestStatementsForReview.every(x=>
   x.eventPath==='chapters/CH-000.events.json'&&x.revisionReason.includes('later')));
 assert.equal(review.truthStatus,'not_assessed');
 const privatePacket=buildContextPacket({snapshot:step3,query:'Rosa',
   npcKnowledgeClaims:[{actorId,fact:fictionalFact}]});
 assert.equal(privatePacket.npcKnowledgeChecks[0].alternativeStatementCount,2);
 const reader=buildContextPacket({snapshot:step3,audience:'reader_visible',query:'Rosa'});
 assert.equal(JSON.stringify(reader).includes(reportB),false);
 assert.equal(JSON.stringify(reader).includes(reportC),false);
 assert.equal(JSON.stringify(reader).includes('alternativeLatestStatementsForReview'),false);
 const snapshotPlan={plan_version:1,chapter_id:'CH-001',
   title:'SYNTHETIC QA: forked testimony continuity',status:'prepared',
   source_commit:'a'.repeat(40),
   purpose:'SYNTHETIC QA: verify competing source claims across chapters.',
   time_context:{day:step3.state.time.day,period:step3.state.time.time_of_day,
     constraints:['No canonical dialogue or authored owner action.']},
   location_ids:[step3.state.player.location_id],npc_ids:[actorId],
   thread_ids:step3.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
   hidden_plan_ids:[],possible_developments:['Synthetic reports are unresolved.'],
   exit_conditions:['Synthetic source comparison done.']};
 const transitioned=stageChapterTransition({snapshot:{...step3,
    sourceFiles:encodeFiveFiles(step3)},nextPlan:snapshotPlan,
    observedHead:'a'.repeat(40),
    reason:'SYNTHETIC QA: chapter boundary for competing testimony.',reviewed:true});
 const restored=decodeFiveFiles({...encodeFiveFiles(step3),...encodeFiveFiles(transitioned)},
   'CH-001');
 assert.equal(verifyNarrativeSnapshot(restored),true);
 const continued=checkNPCFactEvidence({snapshot:restored,actorId,fact:fictionalFact});
 assert.equal(continued.statementRevisionStatus,'multiple_review_required');
 assert.deepEqual(continued.alternativeLatestStatementsForReview.map(x=>x.statement),
   [reportB,reportC]);
 assert.equal(continued.sourceEventId,'EV-000031');
 for(const [path,original] of Object.entries(originals))
   assert.equal(readFileSync(resolve(root,path),'utf8'),original);
});

test('unlinked opposing reports from different people stay separate and are not forced revisions',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const report1='SYNTHETIC QA: the mechanic says the repaired clock works.';
 const report2='SYNTHETIC QA: the owner says the repaired clock does not work.';
 const step1=syntheticClaimTurn(afterDecision,3,report1,
   'SYNTHETIC QA: mechanic assertion');
 const step2=syntheticClaimTurn(step1,4,report2,
   'SYNTHETIC QA: owner assertion');
 assert.equal(verifyNarrativeSnapshot(step2),true);
 const original=checkNPCFactEvidence({snapshot:step2,actorId,fact:fictionalFact});
 assert.equal(original.statementRevisionStatus,'not_marked_revised');
 const first=checkNPCFactEvidence({snapshot:step2,actorId,fact:report1});
 const second=checkNPCFactEvidence({snapshot:step2,actorId,fact:report2});
 assert.equal(first.status,'recorded_event');
 assert.equal(second.status,'recorded_event');
 assert.equal(first.statementRevisionStatus,'not_marked_revised');
 assert.equal(second.statementRevisionStatus,'not_marked_revised');
 assert.equal(first.truthStatus,'not_assessed');
 assert.equal(second.truthStatus,'not_assessed');
 assert.equal(first.mayAssumeKnown,true);
 assert.equal(second.mayAssumeKnown,true);
 assert.ok(step2.state.world.actors[actorId].knowledge.includes(remembered));
 const hidden=checkNPCFactEvidence({snapshot:step2,actorId:'NPC-006',fact:report2});
 assert.equal(hidden.status,'not_recorded');
});


test('private NPC rumor can travel by two distinct reviewed recipient events without becoming truth',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const before=JSON.stringify(afterDecision);
 const firstFact='SYNTHETIC QA: Rosa reportedly heard a request to postpone the clock delivery.';
 const secondFact='SYNTHETIC QA: Sora heard an unverified report about a delayed clock delivery.';
 const makeTransfer=(base,n,recipient,fact,from,sourceEntry,sourceId)=>{
   return stageLivingWorldTurn({snapshot:base,turn:makeTurn(n),
     observedHead:'a'.repeat(40),npcResolutions:[{
      actor_id:recipient,reviewed:true,resolved:true,
      causal_basis:'SYNTHETIC QA: an NPC privately conveys an unverified report to one recipient.',
      outcome:'SYNTHETIC QA PRIVATE: one recipient hears a report, without independent proof.',
      changes:[{field:'knowledge',fact,
        source:'SYNTHETIC QA: private, attributed conversation',
        transmitted_from:{actor_id:from,knowledge_entry:sourceEntry,event_id:sourceId}}]
    }]});
 };
 const first=makeTransfer(afterDecision,3,'NPC-006',firstFact,
   actorId,remembered,'EV-000031');
 assert.equal(verifyNarrativeSnapshot(first),true);
 const receiverRecord=first.state.world.actors['NPC-006'].knowledge.at(-1);
 assert.ok(receiverRecord.includes('EV-000035'));
 const report=checkNPCFactEvidence({snapshot:first,actorId:'NPC-006',fact:firstFact});
 assert.equal(report.status,'recorded_event');
 assert.equal(report.transmissionEvidence.reportedByActorId,actorId);
 assert.equal(report.transmissionEvidence.sourceKnowledgeEventId,'EV-000031');
 assert.equal(report.transmissionEvidence.recipientLearningEventId,'EV-000035');
 assert.equal(report.transmissionEvidence.claimTruth,'not_assessed');
 assert.equal(report.transmissionEvidence.scope,'only_the_recipient_recorded_statement');
 assert.equal(checkNPCFactEvidence({snapshot:first,actorId:'NPC-002',fact:firstFact}).status,
   'not_recorded');
 const second=makeTransfer(first,4,'NPC-002',secondFact,
   'NPC-006',receiverRecord,'EV-000035');
 assert.equal(verifyNarrativeSnapshot(second),true);
 const final=checkNPCFactEvidence({snapshot:second,actorId:'NPC-002',fact:secondFact});
 assert.equal(final.status,'recorded_event');
 assert.equal(final.transmissionEvidence.reportedByActorId,'NPC-006');
 assert.equal(final.transmissionEvidence.sourceKnowledgeEventId,'EV-000035');
 assert.equal(final.transmissionEvidence.recipientLearningEventId,'EV-000037');
 assert.equal(final.truthStatus,'not_assessed');
 assert.equal(checkNPCFactEvidence({snapshot:second,actorId:'NPC-007',fact:secondFact}).status,
   'not_recorded');
 assert.equal(checkNPCFactEvidence({snapshot:second,actorId:'NPC-007',fact:firstFact}).status,
   'not_recorded');
 const another=buildContextPacket({snapshot:second,query:'Sora clock',
    npcKnowledgeClaims:[{actorId:'NPC-002',fact:secondFact}]});
 assert.equal(another.npcKnowledgeChecks[0].transmissionEvidence.reportedByActorId,'NPC-006');
 const reader=buildContextPacket({snapshot:second,audience:'reader_visible',
   query:'Sora clock',maxReferences:15});
 assert.equal(reader.npcKnowledgeChecks,undefined);
 assert.equal(JSON.stringify(reader).includes('transmissionEvidence'),false);
 assert.equal(JSON.stringify(reader).includes(secondFact),false);
 assert.equal(JSON.stringify(second.chapter).includes('Sora heard an unverified report'),false);
 assert.equal(JSON.stringify(afterDecision),before);
 const plan={plan_version:1,chapter_id:'CH-001',
   title:'SYNTHETIC QA: private communication across chapters',
   status:'prepared',source_commit:'a'.repeat(40),
   purpose:'SYNTHETIC QA: record two successive private reports, preserving source chains.',
   time_context:{day:second.state.time.day,period:second.state.time.time_of_day,
     constraints:['Synthetic events only; no real story advance.']},
   location_ids:[second.state.player.location_id],npc_ids:['NPC-006','NPC-002'],
   thread_ids:second.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
   hidden_plan_ids:[],possible_developments:['No disclosure to the player.'],
   exit_conditions:['QA chain is traceable after reloading.']};
 const next=stageChapterTransition({snapshot:{...second,sourceFiles:encodeFiveFiles(second)},
   nextPlan:plan,observedHead:'a'.repeat(40),
   reason:'SYNTHETIC QA: private hearsay chain chapter boundary.',reviewed:true});
 const restored=decodeFiveFiles({...encodeFiveFiles(second),...encodeFiveFiles(next)},'CH-001');
 assert.equal(verifyNarrativeSnapshot(restored),true);
 assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:'NPC-002',fact:secondFact})
   .transmissionEvidence.sourceKnowledgeEventPath,'chapters/CH-000.events.json');
 assert.equal(checkNPCFactEvidence({snapshot:restored,actorId:'NPC-006',fact:firstFact})
   .transmissionEvidence.sourceKnowledgeEventId,'EV-000031');
 for(const [path,original] of Object.entries(originals))
   assert.equal(readFileSync(resolve(root,path),'utf8'),original);
});

test('a forged private source pointer fails replay and cannot claim another actor learned',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const fact='SYNTHETIC QA: isolated visitor learned a private clock report.';
 const transferred=stageLivingWorldTurn({snapshot:afterDecision,
  turn:makeTurn(3),observedHead:'a'.repeat(40),npcResolutions:[{
   actor_id:'NPC-006',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: Rosa privately reports a previously learned request.',
   outcome:'SYNTHETIC QA PRIVATE: one reporter describes a request.',
   changes:[{field:'knowledge',fact,source:'SYNTHETIC QA: reported by Rosa',
    transmitted_from:{actor_id:actorId,knowledge_entry:remembered,event_id:'EV-000031'}}]
  }]});
 assert.equal(verifyNarrativeSnapshot(transferred),true);
 const corrupted=structuredClone(transferred);
 corrupted.events.events.at(-1).state_changes
   .find(x=>x.field==='knowledge').transmitted_from.event_id='EV-000032';
 assert.throws(()=>verifyNarrativeSnapshot(corrupted),/earlier saved sender statement|source event/);
 const unlinked=checkNPCFactEvidence({snapshot:afterDecision,actorId:'NPC-006',fact});
 assert.equal(unlinked.mayAssumeKnown,false);
 assert.equal(unlinked.status,'not_recorded');
});


test('an NPC can keep silent, share only part, or alter a report without automatic diffusion',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const unchanged=JSON.stringify(afterDecision);
 const quiet=stageLivingWorldTurn({snapshot:afterDecision,
   observedHead:'a'.repeat(40),turn:makeTurn(3),npcResolutions:[{
     actor_id:actorId,reviewed:true,resolved:true,
     causal_basis:'SYNTHETIC QA: Rosa declines to tell a visitor what the owner requested.',
     outcome:'SYNTHETIC QA PRIVATE: Rosa keeps a conversation to herself.',
     changes:[]
   }]});
 assert.equal(verifyNarrativeSnapshot(quiet),true);
 assert.equal(checkNPCFactEvidence({snapshot:quiet,actorId:'NPC-006',fact:fictionalFact}).status,
   'not_recorded');
 const partialFact='SYNTHETIC QA: Rosa mentioned a handover request, but not the requested time.';
 const partial=stageLivingWorldTurn({snapshot:quiet,observedHead:'a'.repeat(40),
   turn:makeTurn(4),npcResolutions:[{
     actor_id:'NPC-006',reviewed:true,resolved:true,
     causal_basis:'SYNTHETIC QA: a visitor hears Rosa describe only a limited part.',
     outcome:'SYNTHETIC QA PRIVATE: only an incomplete account reaches the visitor.',
     changes:[{field:'knowledge',fact:partialFact,source:'SYNTHETIC QA: partial account',
       transmitted_from:{actor_id:actorId,knowledge_entry:remembered,
         event_id:'EV-000031',reported_form:'partial'}}]
   }]});
 assert.equal(verifyNarrativeSnapshot(partial),true);
 const limited=checkNPCFactEvidence({snapshot:partial,actorId:'NPC-006',fact:partialFact});
 assert.equal(limited.status,'recorded_event');
 assert.equal(limited.transmissionEvidence.reportedForm,'partial');
 assert.equal(limited.transmissionEvidence.reportedFormEvidence,
  'narrator_label_not_semantic_proof');
 assert.equal(limited.transmissionEvidence.claimTruth,'not_assessed');
 assert.equal(checkNPCFactEvidence({snapshot:partial,actorId:'NPC-006',
   fact:fictionalFact}).status,'not_recorded');
 const alteredFact='SYNTHETIC QA: Rosa told Sora the owner wanted the clock returned this morning.';
 const altered=stageLivingWorldTurn({snapshot:partial,observedHead:'a'.repeat(40),
   turn:makeTurn(5),npcResolutions:[{
     actor_id:'NPC-002',reviewed:true,resolved:true,
     causal_basis:'SYNTHETIC QA: Sora hears an attributed but deliberately altered version.',
     outcome:'SYNTHETIC QA PRIVATE: Sora hears an altered version without verification.',
     changes:[{field:'knowledge',fact:alteredFact,source:'SYNTHETIC QA: Rosa altered her report',
       transmitted_from:{actor_id:actorId,knowledge_entry:remembered,
         event_id:'EV-000031',reported_form:'altered'}}]
   }]});
 assert.equal(verifyNarrativeSnapshot(altered),true);
 const alteredCheck=checkNPCFactEvidence({snapshot:altered,actorId:'NPC-002',fact:alteredFact});
 assert.equal(alteredCheck.status,'recorded_event');
 assert.equal(alteredCheck.transmissionEvidence.reportedForm,'altered');
 assert.equal(alteredCheck.truthStatus,'not_assessed');
 assert.equal(checkNPCFactEvidence({snapshot:altered,actorId:'NPC-002',
   fact:fictionalFact}).status,'not_recorded');
 assert.equal(checkNPCFactEvidence({snapshot:altered,actorId:'NPC-007',
   fact:partialFact}).status,'not_recorded');
 assert.equal(checkNPCFactEvidence({snapshot:altered,actorId:'NPC-007',
   fact:alteredFact}).status,'not_recorded');
 assert.equal(JSON.stringify(afterDecision),unchanged);
 const allPrivate=[fictionalFact,partialFact,alteredFact];
 for(const secret of allPrivate){
   assert.equal(altered.chapter.includes(secret),false);
   assert.equal(altered.transcript.entries.some(x=>x.text.includes(secret)),false);
 }
 const visible=buildContextPacket({snapshot:altered,audience:'reader_visible'});
 assert.ok(visible.references.every(x=>x.kind==='transcript'));
 assert.equal(JSON.stringify(visible).includes('reportedForm'),false);
 const originalRosa=checkNPCFactEvidence({snapshot:altered,actorId,fact:fictionalFact});
 assert.equal(originalRosa.status,'recorded_event');
 assert.equal(originalRosa.truthStatus,'not_assessed');
 for(const [path,source] of Object.entries(originals))
   assert.equal(readFileSync(resolve(root,path),'utf8'),source);
});

test('literal source secrets and recipient facts cannot leak from a private NPC handoff',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const partialFact='SYNTHETIC QA: Rosa mentioned a handover but not the private time.';
 const recipient={actor_id:'NPC-006',reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC QA: a visitor privately hears part of a clock request.',
   outcome:'SYNTHETIC QA PRIVATE: a limited account reaches the visitor.',
   changes:[{field:'knowledge',fact:partialFact,source:'SYNTHETIC QA: visitor heard',
     transmitted_from:{actor_id:actorId,knowledge_entry:remembered,
       event_id:'EV-000031',reported_form:'partial'}}]};
 assert.throws(()=>stageLivingWorldTurn({snapshot:afterDecision,
   observedHead:'a'.repeat(40),
   turn:{...makeTurn(3),narration_messages:[playerProse+' '+fictionalFact]},
   npcResolutions:[recipient]}),/Private NPC knowledge leaked/);
 assert.throws(()=>stageLivingWorldTurn({snapshot:afterDecision,
   observedHead:'a'.repeat(40),
   turn:{...makeTurn(3),narration_messages:[playerProse+' '+partialFact]},
   npcResolutions:[recipient]}),/Private NPC knowledge leaked/);
 const allowed=stageLivingWorldTurn({snapshot:afterDecision,
   observedHead:'a'.repeat(40),turn:makeTurn(3),npcResolutions:[recipient]});
 assert.equal(verifyNarrativeSnapshot(allowed),true);
 assert.equal(allowed.manifest.last_completed_turn,12);
 assert.equal(checkNPCFactEvidence({snapshot:allowed,
   actorId:'NPC-006',fact:partialFact}).status,'recorded_event');
});

test('invalid report classification is rejected without a recipient write',async()=>{
 const {afterDecision,remembered}=await storyRehearsal();
 const original=JSON.stringify(afterDecision);
 assert.throws(()=>stageLivingWorldTurn({snapshot:afterDecision,
  observedHead:'a'.repeat(40),turn:makeTurn(3),npcResolutions:[{
    actor_id:'NPC-006',reviewed:true,resolved:true,
    causal_basis:'SYNTHETIC QA: a visitor privately hears one attributed report.',
    outcome:'SYNTHETIC QA PRIVATE: an unreviewed label is refused.',
    changes:[{field:'knowledge',
      fact:'SYNTHETIC QA: a visitor received an attributed account.',
      source:'SYNTHETIC QA: private report',
      transmitted_from:{actor_id:actorId,knowledge_entry:remembered,
        event_id:'EV-000031',reported_form:'objectively_true'}}]
  }]}),/Invalid narrator-reviewed report form/);
 assert.equal(JSON.stringify(afterDecision),original);
});
