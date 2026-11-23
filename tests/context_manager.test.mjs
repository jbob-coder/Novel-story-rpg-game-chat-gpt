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

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const files=Object.fromEntries(savePaths('CH-000').map(path=>
  [path,readFileSync(resolve(root,path),'utf8')]));
const initial=()=>decodeFiveFiles(files,'CH-000');

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
  const snapshot=initial(),actors=snapshot.state.world.actors;
  const copy=structuredClone(actors['NPC-005']);
  copy.id='NPC-008';copy.name='Rosa Rivera';
  actors['NPC-008']=copy;
  const query='Rosa';
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
