// Read-only verified context loader against deterministic remote Git fixtures.
// These tests do NOT create any player turn or write to GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadVerifiedContextPacket} from '../tools/verified_context_loader.mjs';
import {savePaths} from '../tools/save_transaction.mjs';

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
 return {branch,status:'verified',commitHead:SAVED,attempt:{
  status:'verified',percent:100,turn:9,chapter_id:'CH-000',
  verified_head:SAVED,source_head:'0'.repeat(40)
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
