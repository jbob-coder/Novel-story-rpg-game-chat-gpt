// All checks are synthetic/read-only: never advance the authentic novel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildContextPacket,resolvePrivateContextReference} from '../tools/context_manager.mjs';
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
