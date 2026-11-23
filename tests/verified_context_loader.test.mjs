// Read-only verified context loader against deterministic remote Git fixtures.
// These tests do NOT create any player turn or write to GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadVerifiedContextPacket} from '../tools/verified_context_loader.mjs';
import {savePaths} from '../tools/save_transaction.mjs';
import {SAVE_PHASES} from '../tools/save_gate.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const branch='work/chat-narrative-foundation',HEAD='a'.repeat(40),SAVED='b'.repeat(40);
const paths=savePaths('CH-000');
const base=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const cloned=x=>JSON.parse(JSON.stringify(x));
function fakeRemote({historical=base,initial=base}={}){
 const state={calls:[],head:HEAD,readCount:0,switchHead:false};
 return {state,remote:{
  async readHead(b){
   assert.equal(b,branch);
   state.calls.push('head');
   state.readCount++;
   if(state.switchHead&&state.readCount>1)return 'c'.repeat(40);
   return state.head;
  },
  async readFiles(sha,requested){
   state.calls.push('files:'+sha);
   assert.ok(sha===HEAD||sha===SAVED);
   const data=sha===SAVED?historical:initial;
   return Object.fromEntries(requested.map(p=>[p,data[p]]).filter(([,x])=>x!==undefined));
  }
 }};
}
function fakeJournal(value){
 const state={reads:0,mutated:false,value};
 return {state,journal:{async read(b){
  assert.equal(b,branch);
  state.reads++;
  if(state.mutated&&state.reads>1)return {...state.value,status:'blocked'};
  return cloned(state.value);
 }}};
}
function verifiedRecord(){
 const source='0'.repeat(40);
 return {branch,status:'verified',commitHead:SAVED,sourceHead:source,expectedFiles:null,attempt:{
  version:1,status:'verified',percent:100,turn:9,chapter_id:'CH-000',
  verified_head:SAVED,source_head:source,
  completed:SAVE_PHASES.map(phase=>phase.id),
  evidence:Object.fromEntries(SAVE_PHASES.map(phase=>[phase.id,'verified QA evidence']))
 }};
}
test('loads complete source checkpoint by immutable SHA and returns only read-only references',async()=>{
 const {remote,state}=fakeRemote();
 const packet=await loadVerifiedContextPacket({remote,branch,query:'Aster brazo taller',
  maxReferences:12,maxPreviewCharacters:450});
 assert.equal(packet.loadStatus,'verified_read_only');
 assert.equal(packet.sourceCommitStatus,'verified_immutable_remote_readback');
 assert.equal(packet.sourceCommit,HEAD);
 assert.equal(packet.journalGate,'not_connected');
 assert.equal(packet.mayAdvanceStory,false);
 assert.equal(packet.checkpoint.turn,9);
 assert.equal(packet.checkpoint.lastEventId,'EV-000029');
 assert.equal(packet.checkpoint.lastTranscriptId,'TXT-000020');
 assert.ok(packet.references.some(r=>r.id==='game/ASTER_SPEC.md'));
 assert.ok(packet.references.every(r=>r.path));
 assert.ok(state.calls.includes('files:'+HEAD));
 assert.equal(state.calls.filter(x=>x==='head').length,2);
});
test('reader context cannot contain private event previews or mandatory private document fetches',async()=>{
 const {remote}=fakeRemote();
 const packet=await loadVerifiedContextPacket({remote,branch,audience:'reader_visible',
  query:'Rosa',maxPreviewCharacters:1000});
 assert.equal(packet.classification,'reader_visible');
 assert.equal(packet.summary,null);
 assert.deepEqual(packet.requiredReads,[]);
 assert.ok(packet.references.every(r=>r.kind==='transcript'&&!Object.hasOwn(r,'preview')));
});
test('blocked durable journal stops before reading remote context',async()=>{
 const {remote,state}=fakeRemote();
 const {journal}=fakeJournal({branch,status:'blocked',commitHead:SAVED,attempt:{percent:75}});
 await assert.rejects(()=>loadVerifiedContextPacket({remote,branch,journal}),
  /Unresolved durable narrative save attempt/);
 assert.deepEqual(state.calls,[]);
});
test('journal absence permits context browsing but does not authorize any turn',async()=>{
 const {remote}=fakeRemote(),{journal}=fakeJournal(null);
 const packet=await loadVerifiedContextPacket({remote,journal,branch});
 assert.equal(packet.journalGate,'not_initialized');
 assert.equal(packet.mayAdvanceStory,false);
});
test('prior verified journal with matching bytes permits docs-only branch commits',async()=>{
 const {remote,state}=fakeRemote(),{journal}=fakeJournal(verifiedRecord());
 const packet=await loadVerifiedContextPacket({remote,journal,branch});
 assert.equal(packet.journalGate,'verified_previous_attempt');
 assert.ok(state.calls.includes('files:'+SAVED));
 assert.equal(packet.sourceCommit,HEAD);
});
test('missing or changed historical save bytes block verified journal reconciliation',async()=>{
 const corrupted={...base,'game/STATE.json':'{}'};
 const {remote}=fakeRemote({historical:corrupted}),{journal}=fakeJournal(verifiedRecord());
 await assert.rejects(()=>loadVerifiedContextPacket({remote,journal,branch}),
  /Current checkpoint differs/);
 const removed={...base};delete removed['game/SAVE_MANIFEST.json'];
 const broken=fakeRemote({historical:removed});
 await assert.rejects(()=>loadVerifiedContextPacket({remote:broken.remote,journal,branch}),
  /Current checkpoint differs/);
});
test('a moved remote branch is never accepted as a verified context packet',async()=>{
 const {remote,state}=fakeRemote();
 state.switchHead=true;
 await assert.rejects(()=>loadVerifiedContextPacket({remote,branch}),
  /Branch moved during context retrieval/);
});
test('journal replacement during read fails the consistency gate',async()=>{
 const {remote}=fakeRemote(),{journal,state}=fakeJournal(verifiedRecord());
 state.mutated=true;
 await assert.rejects(()=>loadVerifiedContextPacket({remote,journal,branch}),
  /Journal changed during context retrieval/);
});
test('invalid source, journal or branch is rejected without claiming coherence',async()=>{
 const {remote}=fakeRemote();
 await assert.rejects(()=>loadVerifiedContextPacket({remote,branch:'qa/testing'}),/non-QA/);
 await assert.rejects(()=>loadVerifiedContextPacket({remote,branch,journal:{}}),/journal adapter/);
 const {journal}=fakeJournal({branch:'another',status:'verified'});
 await assert.rejects(()=>loadVerifiedContextPacket({remote,branch,journal}),/Invalid journal/);
 const data={...base,'game/SAVE_MANIFEST.json':'{"chapter_id":"CH-999"}'};
 await assert.rejects(()=>loadVerifiedContextPacket({remote:fakeRemote({initial:data}).remote,branch}),
  /Missing complete save file|Requested chapter differs|Turn mismatch|Missing|does not exist/);
});

function readyRecord(){
 return {branch,status:'ready',baselineHead:SAVED,chapterId:'CH-000',turn:9,
  lastEventId:'EV-000029',lastTranscriptId:'TXT-000020'};
}
test('ready journal permits read-only context only after exact baseline reconciliation',async()=>{
 const {remote,state}=fakeRemote(),{journal}=fakeJournal(readyRecord());
 const packet=await loadVerifiedContextPacket({remote,journal,branch});
 assert.equal(packet.journalGate,'ready_baseline');
 assert.equal(packet.mayAdvanceStory,false);
 assert.ok(state.calls.includes('files:'+SAVED));
});
test('ready baseline with altered canonical bytes blocks even if turn numbers match',async()=>{
 const historical={...base,'chapters/CH-000.md':base['chapters/CH-000.md']+'\nCHANGED'};
 const {remote}=fakeRemote({historical}),{journal}=fakeJournal(readyRecord());
 await assert.rejects(()=>loadVerifiedContextPacket({remote,journal,branch}),
  /Ready journal baseline differs/);
});
test('ready baseline with incorrect event ID does not authorize context',async()=>{
 const record={...readyRecord(),lastEventId:'EV-000028'};
 const {remote}=fakeRemote(),{journal}=fakeJournal(record);
 await assert.rejects(()=>loadVerifiedContextPacket({remote,journal,branch}),
  /Ready journal checkpoint differs/);
});

test('verified loader offers private NPC memories only from the immutable checkpoint',async()=>{
 const {remote}=fakeRemote(),{journal}=fakeJournal(null);
 const packet=await loadVerifiedContextPacket({remote,journal,branch,npcIds:['NPC-005']});
 const saved=JSON.parse(base['game/STATE.json']).world.actors['NPC-005'];
 assert.equal(packet.sourceCommitStatus,'verified_immutable_remote_readback');
 assert.equal(packet.npcMemory[0].sourcePath,'game/STATE.json');
 assert.deepEqual(packet.npcMemory[0].state.knowledge,saved.knowledge);
 assert.equal(packet.mayAdvanceStory,false);
 const {remote:readerRemote}=fakeRemote();
 await assert.rejects(()=>loadVerifiedContextPacket({
   remote:readerRemote,branch,audience:'reader_visible',npcIds:['NPC-005']
 }),/narrator-private only/);
});

test('verified GitHub loader auto-selects bounded NPC memory from a named query',async()=>{
 const {remote}=fakeRemote(),{journal}=fakeJournal(readyRecord());
 const packet=await loadVerifiedContextPacket({remote,journal,branch,query:'Rosa y el reloj'});
 assert.equal(packet.loadStatus,'verified_read_only');
 assert.equal(packet.sourceCommitStatus,'verified_immutable_remote_readback');
 assert.deepEqual(packet.npcMemory.map(x=>x.actorId),['NPC-005']);
 assert.equal(packet.npcMemory[0].memoryMode,'compact_auto');
 assert.equal(packet.npcMemory[0].sourcePath,'game/STATE.json');
 assert.ok(packet.npcMemory[0].recentEventReferences.length<=4);
 assert.equal(packet.mayAdvanceStory,false);
 const {remote:remoteReader}=fakeRemote();
 const read=await loadVerifiedContextPacket({remote:remoteReader,branch,audience:'reader_visible',query:'Rosa'});
 assert.equal(Object.hasOwn(read,'npcMemory'),false);
});

test('verified loader honors scene actor hints without asserting physical presence',async()=>{
 const {remote}=fakeRemote();
 const packet=await loadVerifiedContextPacket({remote,branch,query:'el reloj',sceneNpcIds:['NPC-005']});
 assert.deepEqual(packet.npcMemory.map(x=>x.actorId),['NPC-005']);
 assert.equal(packet.npcMemory[0].memoryMode,'compact_auto');
 assert.equal(packet.checkpoint.turn,9);
 assert.equal(packet.mayAdvanceStory,false);
});

test('verified loader checks actor-specific knowledge without leaking to reader context',async()=>{
 const {remote}=fakeRemote(),fact='Jack construye gadgets.';
 const packet=await loadVerifiedContextPacket({remote,branch,query:'Rosa',npcKnowledgeClaims:[
   {actorId:'NPC-005',fact},{actorId:'NPC-006',fact}
 ]});
 assert.equal(packet.sourceCommitStatus,'verified_immutable_remote_readback');
 assert.deepEqual(packet.npcKnowledgeChecks.map(x=>x.status),
   ['recorded_checkpoint','not_recorded']);
 assert.deepEqual(packet.npcKnowledgeChecks.map(x=>x.mayAssumeKnown),[true,false]);
 assert.equal(packet.mayAdvanceStory,false);
 const {remote:otherRemote}=fakeRemote();
 await assert.rejects(()=>loadVerifiedContextPacket({remote:otherRemote,branch,
   audience:'reader_visible',npcKnowledgeClaims:[{actorId:'NPC-005',fact}]}),
   /narrator-private only/);
});


test('immutable remote thread references do not authorize reader disclosure',async()=>{
 const {remote}=fakeRemote();
 const packet=await loadVerifiedContextPacket({remote,branch,query:'THREAD-000003',
  maxReferences:16,maxPreviewCharacters:800});
 assert.equal(packet.loadStatus,'verified_read_only');
 assert.ok(packet.references.some(x=>x.id==='THREAD-000003'&&x.kind==='thread'));
 assert.ok(packet.warnings.some(x=>x.includes('THREAD visibility')));
 const {remote:readerRemote}=fakeRemote();
 const visible=await loadVerifiedContextPacket({remote:readerRemote,branch,
  audience:'reader_visible',query:'THREAD-000003',maxReferences:16});
 assert.ok(visible.references.every(x=>x.kind==='transcript'));
 assert.equal(JSON.stringify(visible).includes('THREAD-000003'),false);
 assert.equal(visible.mayAdvanceStory,false);
});
