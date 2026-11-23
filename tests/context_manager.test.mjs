// All checks are synthetic/read-only: never advance the authentic novel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildContextPacket,resolvePrivateContextReference,selectNPCMemoryCandidates,
  checkNPCFactEvidence} from '../tools/context_manager.mjs';
import {decodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {stageChapterTransition} from '../tools/chapter_management.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {draftReviewedNPCIntroduction} from '../tools/living_world_npc_introduction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=Object.fromEntries(savePaths('CH-000').map(path=>
  [path,readFileSync(resolve(root,path),'utf8')]));
const initial=()=>decodeFiveFiles(files,'CH-000');

// A second NPC must be admitted through reviewed causal history, not inserted
// directly in a mutable STATE fixture; otherwise strict replay rejects it.
function syntheticSecondRosa(name='Rosa Rivera'){
  const snapshot=initial(),head='a'.repeat(40);
  const actor={
    id:'NPC-008',name,age:39,
    role:'Synthetic market inventory coordinator',
    location_id:'LOC-COMMERCIAL-DISTRICT',
    goal:'Keep the merchant supply register accurate and useful.',
    independent_plan:'Review delivery records and check current inventory.',
    description:'An independent synthetic adult used solely for name ambiguity QA.'
  };
  const introduction=draftReviewedNPCIntroduction({
    state:snapshot.state,actor,reviewed:true,
    observation:{
      kind:'current_turn_observation',
      observer_actor_id:'NPC-006',confirmed_by_reviewer:true,
      fact:`Synthetic Noah observes ${name} checking the market supply register.`,
      causal_source:'A fictional current-turn witness at the established Market Row counter.'
    },
    outcome:'The new market coordinator works privately on the delivery ledger.'
  });
  return stageLivingWorldTurn({
    snapshot,observedHead:head,npcResolutions:[],
    turn:{
      key:'synthetic-context-second-rosa-001',
      intent:'Synthetic interval for context name ambiguity verification.',
      outcome:'The workshop stays quiet while a separate citizen works at Market Row.',
      player_text:'SYNTHETIC QA ONLY: observe the workbench quietly.',
      narration_messages:['Synthetic daylight remains on the bench; no private NPC data is shared.'],
      elapsed_days:0,elapsed_minutes:25,npc_introductions:[introduction]
    }
  });
}

test('narrator packet anchors the saved checkpoint, search and preview limits',()=>{
  const snapshot=initial(),before=JSON.stringify(snapshot);
  const packet=buildContextPacket({snapshot,query:'Aster brazo taller',
    maxReferences:12,maxPreviewCharacters:450});
  assert.equal(packet.classification,'narrator_private');
  assert.equal(packet.checkpoint.turn,9);
  assert.equal(packet.checkpoint.lastEventId,'EV-000029');
  assert.equal(packet.checkpoint.lastTranscriptId,'TXT-000020');
  assert.ok(packet.references.length<=12);
  assert.ok(packet.references.some(r=>r.id==='game/ASTER_SPEC.md'));
  assert.ok(packet.references.filter(r=>r.preview).reduce((n,r)=>n+r.preview.length,0)<=450);
  assert.equal(JSON.stringify(snapshot),before);
});

test('reader projection excludes NPC plans, event outcomes and all text previews',()=>{
  const snapshot=initial(),hidden=String(snapshot.state.world.actors['NPC-005'].independent_plan??'');
  const safe=buildContextPacket({snapshot,audience:'reader_visible',
    query:'Rosa',maxPreviewCharacters:2000});
  assert.equal(safe.summary,null);
  assert.equal(safe.requiredReads.length,0);
  assert.ok(safe.references.every(r=>r.kind==='transcript'));
  assert.ok(safe.references.every(r=>!Object.hasOwn(r,'preview')));
  assert.ok(!JSON.stringify(safe).includes('independent_plan'));
  if(hidden)assert.ok(!JSON.stringify(safe).includes(hidden));
});

test('resolver returns exact copies and rejects unknown evidence',()=>{
  const snapshot=initial();
  const event=resolvePrivateContextReference({snapshot,referenceId:'EV-000029'});
  assert.equal(event.data.id,'EV-000029');
  assert.equal(event.data.chapter_id,'CH-000');
  event.data.id='CHANGED';
  assert.equal(snapshot.events.events.at(-1).id,'EV-000029');
  assert.equal(resolvePrivateContextReference({snapshot,referenceId:'TXT-000020'}).data.role,'assistant');
  assert.equal(resolvePrivateContextReference({snapshot,referenceId:'game/ASTER_SPEC.md'}).status,
    'fetch_original_from_verified_repository');
  assert.throws(()=>resolvePrivateContextReference({snapshot,referenceId:'EV-999999'}),/Unresolved/);
});

test('bad inputs or an inconsistent checkpoint block packet generation',()=>{
  const snapshot=initial();
  assert.throws(()=>buildContextPacket({snapshot,audience:'untrusted'}),/Unsupported/);
  assert.throws(()=>buildContextPacket({snapshot,maxReferences:100}),/Invalid reference/);
  assert.throws(()=>buildContextPacket({snapshot,sourceCommit:'notsha'}),/Invalid source/);
  snapshot.manifest.last_completed_turn+=1;
  assert.throws(()=>buildContextPacket({snapshot}),/Turn mismatch/);
});

test('closed chapter evidence remains addressable after a synthetic transition',()=>{
  const snapshot=initial(),head='a'.repeat(40);
  const plan={plan_version:1,chapter_id:'CH-001',title:'Synthetic future',status:'prepared',
    source_commit:head,purpose:'Only demonstrate archival reference continuity.',
    time_context:{day:snapshot.state.time.day,period:snapshot.state.time.time_of_day,
      constraints:['Synthetic boundary; no new powers or turns.']},
    location_ids:[snapshot.state.player.location_id],npc_ids:['NPC-005'],
    thread_ids:snapshot.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
    hidden_plan_ids:[],possible_developments:['A private situation might change.'],
    exit_conditions:['End this synthetic planning interval.']};
  const opened=stageChapterTransition({snapshot,nextPlan:plan,
    reason:'Synthetic chapter boundary for metadata testing.',observedHead:head,reviewed:true});
  const packet=buildContextPacket({snapshot:opened,query:'Rosa clock',maxReferences:12});
  assert.equal(packet.checkpoint.chapterId,'CH-001');
  assert.equal(packet.checkpoint.turn,9);
  assert.ok(packet.references.some(r=>r.chapterId==='CH-000'));
  assert.equal(resolvePrivateContextReference({snapshot:opened,referenceId:'EV-000029'}).data.id,
    'EV-000029');
});

test('explicit NPC memory is restored from saved state with exact event pointers',()=>{
  const snapshot=initial(),before=JSON.stringify(snapshot);
  const npc=snapshot.state.world.actors['NPC-005'];
  const packet=buildContextPacket({snapshot,query:'Rosa',npcIds:['NPC-005']});
  assert.equal(packet.npcMemory.length,1);
  const memory=packet.npcMemory[0];
  assert.equal(memory.actorId,'NPC-005');
  assert.equal(memory.sourcePath,'game/STATE.json');
  assert.deepEqual(memory.state.knowledge,npc.knowledge);
  assert.deepEqual(memory.state.relationships,npc.relationships);
  assert.deepEqual(memory.state.last_resolved_action,npc.last_resolved_action);
  assert.ok(memory.recentEventReferences.every(ref=>/^EV-\d{6}$/.test(ref.id)&&
    ref.path.endsWith('.events.json')));
  assert.ok(memory.recentEventReferences.length>0);
  assert.equal(JSON.stringify(snapshot),before);
  memory.state.knowledge.push('FORGED PRIVATE MEMORY');
  assert.equal(JSON.stringify(snapshot),before);
});

test('NPC memory request rejects unknown actors, duplicates and reader access',()=>{
  const snapshot=initial();
  assert.throws(()=>buildContextPacket({snapshot,npcIds:['NPC-999']}),/Invalid NPC memory/);
  assert.throws(()=>buildContextPacket({snapshot,npcIds:['NPC-005','NPC-005']}),/Invalid NPC memory/);
  assert.throws(()=>buildContextPacket({snapshot,npcIds:['PLAYER-001']}),/Invalid NPC memory/);
  assert.throws(()=>buildContextPacket({
    snapshot,audience:'reader_visible',npcIds:['NPC-005']
  }),/narrator-private only/);
  assert.equal(Object.hasOwn(buildContextPacket({snapshot,audience:'reader_visible'}),'npcMemory'),false);
});

test('NPC memory and event evidence survive synthetic chapter transitions',()=>{
  const snapshot=initial(),head='a'.repeat(40);
  const plan={plan_version:1,chapter_id:'CH-001',title:'Memory review only',status:'prepared',
    source_commit:head,purpose:'Test stable memory and historical pointers.',
    time_context:{day:snapshot.state.time.day,period:snapshot.state.time.time_of_day,
      constraints:['No story advancement or invented experiences.']},
    location_ids:[snapshot.state.player.location_id],npc_ids:['NPC-005'],
    thread_ids:snapshot.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
    hidden_plan_ids:[],possible_developments:['Synthetic test only.'],
    exit_conditions:['Finish synthetic memory test.']};
  const opened=stageChapterTransition({snapshot,nextPlan:plan,
    reason:'Synthetic memory test only.',observedHead:head,reviewed:true});
  const packet=buildContextPacket({snapshot:opened,npcIds:['NPC-005']});
  assert.equal(packet.checkpoint.chapterId,'CH-001');
  assert.deepEqual(packet.npcMemory[0].state.knowledge,snapshot.state.world.actors['NPC-005'].knowledge);
  assert.ok(packet.npcMemory[0].recentEventReferences.some(x=>x.chapterId==='CH-000'));
});

test('auto selects only named or co-located known NPCs, with bounded private memory',()=>{
  const snapshot=initial(),before=JSON.stringify(snapshot);
  const rosa=buildContextPacket({snapshot,query:'Quiero preguntar a Rosa por el reloj'});
  assert.deepEqual(rosa.npcMemory.map(x=>x.actorId),['NPC-005']);
  assert.equal(rosa.npcMemory[0].memoryMode,'compact_auto');
  assert.ok(rosa.npcMemory[0].state.knowledge.length<=4);
  assert.ok(rosa.npcMemory[0].recentEventReferences.length<=4);
  assert.ok(rosa.npcMemory[0].relatedEventCount>=rosa.npcMemory[0].recentEventReferences.length);
  assert.ok(!Object.hasOwn(rosa.npcMemory[0].state,'resources'));
  assert.deepEqual(buildContextPacket({snapshot,query:'Aster brazo taller'}).npcMemory,undefined);
  assert.equal(JSON.stringify(snapshot),before);
});

test('auto matching uses saved identities and does not infer remote presence',()=>{
  const state=initial().state;
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa y Elena'}),['NPC-004','NPC-005']);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'NPC-007'}),['NPC-007']);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa Wilson'}),['NPC-005']);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Wilson'}),[]);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Aster'}),[]);
  const selected=selectNPCMemoryCandidates({state,query:'Elena',sceneNpcIds:['NPC-006']});
  assert.deepEqual(selected,['NPC-004','NPC-006']);
  assert.deepEqual(selectNPCMemoryCandidates({state,sceneNpcIds:['NPC-005'],query:''}),['NPC-005']);
});

test('saved co-location helps select NPC without inventing travel',()=>{
  const state=structuredClone(initial().state);
  const location=state.player.location_id;
  state.world.actors['NPC-006'].location_id=location;
  assert.deepEqual(selectNPCMemoryCandidates({state,query:''}),['NPC-006']);
  // This is only a selector unit fixture, not a valid new story checkpoint.
  assert.notEqual(initial().state.world.actors['NPC-006'].location_id,location);
});

test('ambiguous first names are not assumed to identify a unique person',()=>{
  const state=structuredClone(initial().state);
  state.world.actors['NPC-008']={id:'NPC-008',name:'Rosa Rivera',
    location_id:'LOC-COMMERCIAL-DISTRICT'};
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa'}),[]);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa Wilson'}),['NPC-005']);
  assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa Rivera'}),['NPC-008']);
});

test('explicit NPC IDs retain full memory; disabling auto remains read-only',()=>{
  const snapshot=initial();
  const exact=buildContextPacket({snapshot,query:'Rosa',npcIds:['NPC-004']});
  assert.deepEqual(exact.npcMemory.map(x=>x.actorId),['NPC-004']);
  assert.deepEqual(exact.npcMemory[0].state.knowledge,
    snapshot.state.world.actors['NPC-004'].knowledge);
  assert.equal(Object.hasOwn(exact.npcMemory[0],'memoryMode'),false);
  assert.equal(buildContextPacket({snapshot,query:'Rosa',autoNpcMemory:false}).npcMemory,undefined);
  assert.throws(()=>buildContextPacket({snapshot,sceneNpcIds:['NPC-999']}),
    /Invalid scene NPC selection/);
  assert.throws(()=>buildContextPacket({snapshot,sceneNpcIds:['NPC-005','NPC-005']}),
    /Invalid scene NPC selection/);
  assert.throws(()=>buildContextPacket({snapshot,autoNpcMemory:1}),
    /Invalid auto NPC selection flag/);
  const safe=buildContextPacket({snapshot,audience:'reader_visible',query:'Rosa'});
  assert.equal(Object.hasOwn(safe,'npcMemory'),false);
  assert.throws(()=>buildContextPacket({snapshot,audience:'reader_visible',
    sceneNpcIds:['NPC-005']}),/narrator-private only/);
});

test('compact automatic recall includes most relevant facts rather than full accumulated memory',()=>{
  const snapshot=initial();
  const actor=snapshot.state.world.actors['NPC-005'];
  const oldCount=actor.knowledge.length;
  actor.knowledge=[...actor.knowledge,
    ...Array.from({length:20},(_,i)=>'SYNTHETIC past errand '+i),
    'SYNTHETIC: el reloj no se entregó todavía'];
  const output=buildContextPacket({snapshot,query:'Rosa reloj'});
  const m=output.npcMemory[0];
  assert.equal(m.knowledgeCount,oldCount+21);
  assert.equal(m.knowledgeIncluded,4);
  assert.ok(m.state.knowledge.some(x=>x.includes('el reloj no se entregó')));
  assert.ok(m.state.knowledge.every(x=>actor.knowledge.includes(x)));
  assert.ok(m.recentEventReferences.length<=4);
});

test('strict NPC fact checks allow saved legacy facts but not event association or another actor',()=>{
  const snapshot=initial(),rosa=snapshot.state.world.actors['NPC-005'];
  const fact=rosa.knowledge[0];
  const trusted=checkNPCFactEvidence({snapshot,actorId:'NPC-005',fact});
  assert.equal(trusted.status,'recorded_checkpoint');
  assert.equal(trusted.mayAssumeKnown,true);
  assert.equal(trusted.sourceEventId,null);
  const other=checkNPCFactEvidence({snapshot,actorId:'NPC-006',fact});
  assert.equal(other.status,'not_recorded');
  assert.equal(other.mayAssumeKnown,false);
  const eventOnly=checkNPCFactEvidence({snapshot,actorId:'NPC-005',
    fact:'SYNTHETIC QA: a neighbor secret reported in the private event log'});
  assert.equal(eventOnly.mayAssumeKnown,false);
  assert.throws(()=>checkNPCFactEvidence({snapshot,actorId:'NPC-999',fact}),/Unknown NPC/);
  assert.throws(()=>checkNPCFactEvidence({snapshot,actorId:'NPC-005',fact:'x'}),/Invalid NPC fact/);
});

test('ambiguous given names produce a private resolution warning but no guessed NPC',()=>{
  const snapshot=syntheticSecondRosa(),query='Rosa';
  const selected=selectNPCMemoryCandidates({state:snapshot.state,query});
  assert.deepEqual(selected,[]);
  const packet=buildContextPacket({snapshot,query});
  assert.equal(packet.npcMemory,undefined);
  assert.deepEqual(packet.npcAmbiguities,[{
    name:'rosa',candidateActorIds:['NPC-005','NPC-008'],
    status:'requires_explicit_identity'
  }]);
  const precise=buildContextPacket({snapshot,query:'Rosa Wilson'});
  assert.deepEqual(precise.npcMemory?.map(x=>x.actorId),['NPC-005']);
  assert.equal(Object.hasOwn(precise,'npcAmbiguities'),false);
  const reader=buildContextPacket({snapshot,audience:'reader_visible',query});
  assert.ok(!JSON.stringify(reader).includes('candidateActorIds'));
});


test('full context packets reject unsourced actor injection despite ambiguous name support',()=>{
  const snapshot=initial(),copy=structuredClone(snapshot.state.world.actors['NPC-005']);
  copy.id='NPC-008';copy.name='Rosa Rivera';
  snapshot.state.world.actors['NPC-008']=copy;
  assert.deepEqual(selectNPCMemoryCandidates({state:snapshot.state,query:'Rosa'}),[]);
  assert.throws(()=>buildContextPacket({snapshot,query:'Rosa'}),
    /unsourced additions or removals/);
});

test('unknown fact claims never inherit the event pointers or another NPC knowledge',()=>{
  const snapshot=initial(),fact='SYNTHETIC QA: Rosa learned a secret from the old event';
  const packet=buildContextPacket({snapshot,query:'Rosa',npcKnowledgeClaims:[
    {actorId:'NPC-005',fact},{actorId:'NPC-006',fact}
  ]});
  assert.ok(packet.npcKnowledgeChecks.every(x=>x.status==='not_recorded'&&!x.mayAssumeKnown));
  assert.ok(packet.npcMemory[0].recentEventReferences.length>0);
  assert.throws(()=>buildContextPacket({snapshot,npcKnowledgeClaims:[{actorId:'NPC-999',fact}]}),
    /Invalid NPC knowledge checks/);
  assert.throws(()=>buildContextPacket({snapshot,audience:'reader_visible',
    npcKnowledgeClaims:[{actorId:'NPC-005',fact}]}),/narrator-private only/);
  assert.equal(Object.hasOwn(buildContextPacket({snapshot,audience:'reader_visible',query:'Rosa'}),
    'npcKnowledgeChecks'),false);
});


test('a named Rosa and a separate bare Rosa remain ambiguous instead of being merged',()=>{
 const snapshot=syntheticSecondRosa();
 const ambiguous=buildContextPacket({snapshot,query:'Rosa Wilson habló con Rosa'});
 assert.deepEqual(ambiguous.npcMemory?.map(x=>x.actorId),['NPC-005']);
 assert.deepEqual(ambiguous.npcAmbiguities,[{
   name:'rosa',candidateActorIds:['NPC-005','NPC-008'],
   status:'requires_explicit_identity'
 }]);
 const twoFull=buildContextPacket({snapshot,query:'Rosa Wilson habló con Rosa Rivera'});
 assert.deepEqual(twoFull.npcMemory?.map(x=>x.actorId),['NPC-005','NPC-008']);
 assert.equal(twoFull.npcAmbiguities,undefined);
 const reverse=buildContextPacket({snapshot,query:'Rosa habló con Rosa Rivera'});
 assert.ok(reverse.npcAmbiguities?.some(x=>x.name==='rosa'));
});

test('similar paraphrases, rumors and opposite assertions yield review hints, not factual permission',()=>{
 const snapshot=initial(),actor=snapshot.state.world.actors['NPC-005'];
 const saved=JSON.stringify(snapshot);
 const exact=checkNPCFactEvidence({snapshot,actorId:'NPC-005',fact:actor.knowledge[0]});
 assert.equal(exact.status,'recorded_checkpoint');
 assert.equal(exact.mayAssumeKnown,true);
 assert.equal(exact.truthStatus,'not_assessed');
 const paraphrase=checkNPCFactEvidence({snapshot,actorId:'NPC-005',
   fact:'Jack constructs gadgets himself'});
 assert.equal(paraphrase.status,'not_recorded');
 assert.equal(paraphrase.mayAssumeKnown,false);
 assert.equal(paraphrase.truthStatus,'not_assessed');
 assert.ok(paraphrase.relatedStatementsForReview.some(x=>
   x.statement.includes('Jack')&&x.matchedTerms.includes('jack')));
 const falseClaim=checkNPCFactEvidence({snapshot,actorId:'NPC-005',
   fact:'Jack never makes gadgets'});
 assert.equal(falseClaim.status,'not_recorded');
 assert.equal(falseClaim.mayAssumeKnown,false);
 assert.equal(falseClaim.truthStatus,'not_assessed');
 assert.ok(falseClaim.relatedStatementsForReview.some(x=>x.matchedTerms.includes('gadgets')));
 assert.ok(falseClaim.relatedStatementsForReview.every(x=>x.classification==='review_only_possible_relation'));
 assert.equal(JSON.stringify(snapshot),saved);
});

test('no lexical match does not imply absolute ignorance or prevent fictional lying',()=>{
 const snapshot=initial();
 const invented=checkNPCFactEvidence({snapshot,actorId:'NPC-006',
   fact:'The mayor secretly replaced every traffic light in the city'});
 assert.equal(invented.status,'not_recorded');
 assert.equal(invented.mayAssumeKnown,false);
 assert.deepEqual(invented.relatedStatementsForReview,[]);
 assert.equal(invented.truthStatus,'not_assessed');
 const visible=buildContextPacket({snapshot,audience:'reader_visible',query:'Rosa'});
 assert.equal(visible.npcKnowledgeChecks,undefined);
 assert.equal(visible.npcMemory,undefined);
 assert.equal(JSON.stringify(visible).includes('relatedStatementsForReview'),false);
});

test('duplicate full names need an explicit actor ID even when every name token matches',()=>{
 const snapshot=syntheticSecondRosa('Rosa Wilson');
 const before=JSON.stringify(initial());
 const exactName='Rosa Wilson';
 // Neither established NPC should be guessed from the identical name.
 assert.deepEqual(selectNPCMemoryCandidates({state:snapshot.state,query:exactName}),[]);
 const ambiguous=buildContextPacket({snapshot,query:exactName});
 assert.equal(ambiguous.npcMemory,undefined);
 assert.deepEqual(ambiguous.npcAmbiguities,[{
  name:'rosa wilson',candidateActorIds:['NPC-005','NPC-008'],
  status:'requires_explicit_identity'
 }]);
 // A validated stable ID or pre-established scene hint is independent evidence.
 assert.deepEqual(selectNPCMemoryCandidates({state:snapshot.state,query:'NPC-008'}),['NPC-008']);
 const explicit=buildContextPacket({snapshot,query:'Rosa Wilson',npcIds:['NPC-008']});
 assert.deepEqual(explicit.npcMemory.map(x=>x.actorId),['NPC-008']);
 const hinted=buildContextPacket({snapshot,query:exactName,sceneNpcIds:['NPC-008']});
 assert.deepEqual(hinted.npcMemory.map(x=>x.actorId),['NPC-008']);
 assert.deepEqual(hinted.npcAmbiguities,[{
  name:'rosa wilson',candidateActorIds:['NPC-005','NPC-008'],
  status:'requires_explicit_identity'
 }]);
 // Reader output never receives private identity alternatives.
 const reader=buildContextPacket({snapshot,query:exactName,audience:'reader_visible'});
 assert.equal(Object.hasOwn(reader,'npcAmbiguities'),false);
 assert.equal(Object.hasOwn(reader,'npcMemory'),false);
 assert.equal(JSON.stringify(initial().state.world.actors['NPC-005']),
  JSON.stringify(snapshot.state.world.actors['NPC-005']));
 assert.notEqual(JSON.stringify(snapshot),before); // Only this fixture changed.
});

test('duplicate full-name alert is scoped to the referenced name, not an unrelated NPC',()=>{
 const state=syntheticSecondRosa('Rosa Wilson').state;
 assert.deepEqual(selectNPCMemoryCandidates({state,query:'Elena'}),['NPC-004']);
 assert.deepEqual(selectNPCMemoryCandidates({state,query:'Rosa'}),[]);
 // Explicit ID still identifies the selected person regardless of their name.
 assert.deepEqual(selectNPCMemoryCandidates({state,query:'NPC-005'}),['NPC-005']);
});

test('foundational saved NPC memory has no fabricated revisions',()=>{
 const snapshot=initial();
 const actor=snapshot.state.world.actors['NPC-005'];
 const fact=actor.knowledge[0];
 const check=checkNPCFactEvidence({snapshot,actorId:'NPC-005',fact});
 assert.equal(check.statementRevisionStatus,'not_marked_revised');
 assert.deepEqual(check.revisionEventIds,[]);
 assert.equal(check.truthStatus,'not_assessed');
 assert.equal(Object.hasOwn(buildContextPacket({snapshot,audience:'reader_visible'}),
   'npcKnowledgeChecks'),false);
});

test('private context indexes real open threads with stable source-event pointers',()=>{
  const snapshot=initial(),unchanged=JSON.stringify(snapshot);
  const packet=buildContextPacket({snapshot,maxReferences:10,maxPreviewCharacters:350});
  const threads=packet.references.filter(ref=>ref.kind==='thread');
  assert.ok(threads.some(ref=>ref.id==='THREAD-000001'));
  assert.ok(threads.some(ref=>ref.id==='THREAD-000004'));
  assert.ok(threads.every(ref=>ref.path==='game/STATE.json'));
  for(const ref of threads){
    const record=snapshot.state.narrative_threads.find(x=>x.id===ref.id);
    assert.equal(ref.lastEventId,record.history.at(-1).event_id);
  }
  assert.equal(JSON.stringify(snapshot),unchanged);
});

test('resolved world issues can be retrieved privately, including original reports and corrections',()=>{
  const snapshot=initial();
  const packet=buildContextPacket({snapshot,query:'Sora anomalías revisión',
    maxReferences:20});
  assert.ok(packet.references.some(x=>x.id==='THREAD-000002'&&x.kind==='thread'));
  const source=resolvePrivateContextReference({snapshot,referenceId:'THREAD-000002'});
  assert.equal(source.classification,'narrator_private_only');
  assert.equal(source.kind,'thread');
  assert.equal(source.data.status,'resolved');
  assert.deepEqual(source.eventReferences.map(x=>x.id),
    ['EV-000002','EV-000006','EV-000012']);
  source.data.history[0].summary='CORRUPTED LOCAL COPY';
  assert.notEqual(snapshot.state.narrative_threads[1].history[0].summary,
    'CORRUPTED LOCAL COPY');
  const reader=buildContextPacket({snapshot,audience:'reader_visible',
    query:'THREAD-000002 Sora'});
  assert.ok(reader.references.every(ref=>ref.kind==='transcript'));
  assert.ok(!JSON.stringify(reader).includes('THREAD-000002'));
});

test('synthetic NPC rumor and correction remain separate events without revealing either to Jack',async()=>{
  const {stageLivingWorldTurn}=await import('../tools/living_world_coordinator.mjs');
  const baseline=initial(),before=JSON.stringify(baseline),head='a'.repeat(40);
  const stage=(snapshot,suffix,op,threadId)=>{
    const npcEvent='EV-'+String(snapshot.manifest.last_event_sequence+2).padStart(6,'0');
    return stageLivingWorldTurn({snapshot,observedHead:head,
      turn:{key:'synthetic-news-context-'+suffix,
        intent:'[SYNTHETIC] Jack remains at the workbench.',
        outcome:'[SYNTHETIC] No new report reaches Jack.',
        player_text:'[SYNTHETIC QA ONLY, NOT A PLAYER ACTION]',
        narration_messages:['[SYNTHETIC] Quiet work at the bench.'],
        elapsed_days:0,elapsed_minutes:15,
        consequence_updates:[{op,event_id:npcEvent,
          summary:op==='open'
            ? 'Sora records an unconfirmed equipment rumor without adopting it as fact.'
            : 'Sora corrects the previous unconfirmed claim after checking the equipment.',
          visibility:'hidden',...(op==='open'
            ? {owner_actor_id:'NPC-002',scope:'world',
              question:'Who verifies the unconfirmed equipment rumor?'}
            : {thread_id:threadId})}]},
      npcResolutions:[{actor_id:'NPC-002',reviewed:true,resolved:true,
        causal_basis:'Sora independently checks an ordinary equipment report.',
        outcome:op==='open'
          ? 'PRIVATE SYNTHETIC: a source repeats an unsupported equipment claim.'
          : 'PRIVATE SYNTHETIC: the earlier claim is withdrawn, not established as fact.',
        changes:[]}]
    });
  };
  const first=stage(baseline,'origin','open',null);
  const newThread=first.state.narrative_threads.at(-1);
  const second=stage(first,'correction','resolve',newThread.id);
  const record=resolvePrivateContextReference({snapshot:second,referenceId:newThread.id});
  assert.deepEqual(record.eventReferences.map(x=>x.id),[
    first.events.events.at(-1).id,second.events.events.at(-1).id]);
  assert.deepEqual(record.data.history.map(x=>x.kind),['open','resolve']);
  assert.equal(record.data.status,'resolved');
  assert.ok(record.data.history[0].summary.includes('unconfirmed'));
  assert.ok(record.data.history[1].summary.includes('corrects'));
  assert.equal(second.state.time.day,-29);
  assert.equal(second.state.player.progression.powers.length,0);
  assert.ok(!second.chapter.includes('PRIVATE SYNTHETIC:'));
  assert.ok(!second.transcript.entries.some(entry=>
    entry.text.includes('PRIVATE SYNTHETIC:')));
  assert.ok(buildContextPacket({snapshot:second,query:'equipment rumor',
    maxReferences:15}).references.some(ref=>ref.id===newThread.id));
  const publicView=buildContextPacket({snapshot:second,
    audience:'reader_visible',query:'equipment rumor',maxReferences:15});
  assert.ok(publicView.references.every(ref=>ref.kind==='transcript'));
  assert.ok(!JSON.stringify(publicView).includes(newThread.id));
  assert.equal(JSON.stringify(baseline),before);
});

test('integrated duplicate-name ambiguity and private thread recall remain independent',()=>{
 const snapshot=syntheticSecondRosa('Rosa Wilson');
 const packet=buildContextPacket({snapshot,query:'Rosa Wilson THREAD-000001',maxReferences:12});
 assert.equal(packet.npcMemory,undefined);
 assert.ok(packet.references.some(ref=>ref.id==='THREAD-000001'&&ref.kind==='thread'));
 assert.deepEqual(packet.npcAmbiguities,[{
   name:'rosa wilson',candidateActorIds:['NPC-005','NPC-008'],
   status:'requires_explicit_identity'
 }]);
 const result=resolvePrivateContextReference({snapshot,referenceId:'THREAD-000001'});
 assert.equal(result.kind,'thread');
 assert.ok(result.eventReferences.length>0);
 const reader=buildContextPacket({snapshot,query:'Rosa Wilson THREAD-000001',
   audience:'reader_visible',maxReferences:12});
 assert.equal(reader.npcMemory,undefined);
 assert.equal(reader.npcAmbiguities,undefined);
 assert.ok(reader.references.every(x=>x.kind==='transcript'));
});
