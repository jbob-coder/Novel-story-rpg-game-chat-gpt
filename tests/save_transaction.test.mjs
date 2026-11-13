// End-to-end rehearsal: only in-memory remote Git objects; NO story data writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveFiveFileTurn,recoverFiveFileSave,recoverJournaledSave,decodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {stageNarrativeTurn} from '../tools/turn_engine.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source='a'.repeat(40),newCommit='b'.repeat(40),other='c'.repeat(40),branch='work/chat-narrative-foundation';
function sourceFiles(){
 return Object.fromEntries(savePaths('CH-000').map(p=>[p,readFileSync(resolve(root,p),'utf8')]));
}
const baseline=decodeFiveFiles(sourceFiles(),'CH-000');
const futureTurn=baseline.manifest.last_completed_turn+1;
class FakeGit {
 constructor(){
  this.head=source;this.commits=new Map([[source,sourceFiles()]]);
  this.created=0;this.updated=0;this.failReadback=false;this.failUpdate=false;this.divergeBeforeUpdate=false;this.corruptReadback=false;
 }
 async readHead(){return this.head}
 async readFiles(sha,paths){
  if(sha===newCommit&&this.failReadback)throw Error('Temporary readback outage');
  const saved=this.commits.get(sha);if(!saved)throw Error('Unknown commit');
  const result=Object.fromEntries(paths.map(p=>[p,saved[p]]));
  if(sha===newCommit&&this.corruptReadback)result[paths[0]]='CORRUPT';
  return result;
 }
 async createCommit({parentSha,files}){
  assert.equal(parentSha,this.head);assert.deepEqual(Object.keys(files).sort(),savePaths('CH-000').sort());
  this.created++;this.commits.set(newCommit,{...files});return newCommit;
 }
 async updateHead({branch:b,expectedSha,newSha}){
  assert.equal(b,branch);this.updated++;
  if(this.divergeBeforeUpdate){this.head=other;return false}
  if(this.failUpdate)return false;
  if(this.head!==expectedSha)return false;
  this.head=newSha;return true;
 }
}
const words='La luz permanece encendida.\n\n—¿La memoria?';
let builds=0;
const buildNext=({snapshot,observedHead})=>{
 builds++;
 return stageNarrativeTurn(snapshot,{key:'synthetic-save-future-turn',save_guard:{observed_head:observedHead,previous_attempt:null},
  intent:'Jack observa su mesa de trabajo.',outcome:'El taller sigue en calma.',
  player_text:'Jack observa el taller.',narration_messages:[words],elapsed_days:0,offscreen:[]});
};
const run=remote=>saveFiveFileTurn({remote,branch,chapterId:'CH-000',buildNext,message:'Synthetic test only'});
test('synthetic turn atomically commits all five and reads back exact prose',async()=>{
 builds=0;const g=new FakeGit(),r=await run(g);
 assert.equal(r.status,'verified');assert.equal(r.attempt.percent,100);assert.equal(g.created,1);assert.equal(g.updated,1);
 assert.equal(g.head,newCommit);assert.equal(builds,1);assert.deepEqual(r.narration_messages,[words]);
 const next=decodeFiveFiles(g.commits.get(newCommit),'CH-000');
 assert.equal(next.manifest.last_completed_turn,futureTurn);
 assert.equal(next.events.events.length,baseline.events.events.length+1);
 assert.equal(next.transcript.entries.length,baseline.transcript.entries.length+2);
 assert.equal(next.transcript.entries.at(-1).text,words);
 assert.equal(decodeFiveFiles(g.commits.get(source),'CH-000').manifest.last_completed_turn,baseline.manifest.last_completed_turn);
});
test('readback interruption blocks at 85%; recovery verifies same commit without resimulation',async()=>{
 builds=0;const g=new FakeGit();g.failReadback=true;const x=await run(g);
 assert.equal(x.status,'blocked');assert.equal(x.attempt.percent,85);assert.equal(g.head,newCommit);
 g.failReadback=false;const y=await recoverFiveFileSave({remote:g,blocked:x});
 assert.equal(y.status,'verified');assert.equal(y.attempt.percent,100);assert.equal(g.created,1);assert.equal(g.updated,1);
 assert.equal(builds,1);assert.deepEqual(y.narration_messages,[words]);
});
test('commit created but branch update rejected; recover same SHA with CAS once available',async()=>{
 builds=0;const g=new FakeGit();g.failUpdate=true;const x=await run(g);
 assert.equal(x.status,'blocked');assert.equal(x.attempt.percent,75);assert.equal(g.head,source);assert.equal(g.created,1);
 g.failUpdate=false;const y=await recoverFiveFileSave({remote:g,blocked:x});
 assert.equal(y.status,'verified');assert.equal(g.head,newCommit);assert.equal(g.created,1);assert.equal(builds,1);
});
test('concurrent branch change stops recovery and preserves another writer',async()=>{
 const g=new FakeGit();g.failUpdate=true;const x=await run(g);g.head=other;g.failUpdate=false;
 const y=await recoverFiveFileSave({remote:g,blocked:x});
 assert.equal(y.status,'blocked');assert.match(y.reason,/Remote branch changed/);
 assert.equal(g.head,other);assert.equal(g.created,1);
});
test('corrupt detached commit refuses recovery; never advance branch',async()=>{
 const g=new FakeGit();g.failUpdate=true;const x=await run(g);g.failUpdate=false;
 g.corruptReadback=true;const y=await recoverFiveFileSave({remote:g,blocked:x});
 assert.equal(y.status,'blocked');assert.match(y.reason,/Remote bytes differ/);
 assert.equal(g.head,source);
});
test('unknown commit from incomplete write cannot be reconstructed',async()=>{
 const g=new FakeGit();const x=await run(g);
 const invalid={...x,status:'blocked',commitHead:null,attempt:{...x.attempt,status:'blocked'}};
 const y=await recoverFiveFileSave({remote:g,blocked:invalid});
 assert.equal(y.status,'blocked');assert.match(y.reason,/Unknown commit/);assert.equal(g.created,1);
});
test('repeat recovery of verified save never duplicates player action',async()=>{
 builds=0;const g=new FakeGit();const saved=await run(g);
 const repeated=await recoverFiveFileSave({remote:g,blocked:saved});
 assert.equal(repeated.status,'verified');assert.equal(g.created,1);assert.equal(builds,1);
 const transcript=decodeFiveFiles(g.commits.get(g.head),'CH-000').transcript;
 assert.equal(transcript.entries.filter(e=>e.turn===futureTurn&&e.role==='player').length,1);
});
test('missing source file blocks before committing anything',async()=>{
 const g=new FakeGit();delete g.commits.get(source)['chapters/CH-000.transcript.json'];
 const x=await run(g);assert.equal(x.status,'blocked');assert.equal(g.created,0);assert.equal(g.head,source);
});
test('ref moved but last step was interrupted: recovery uses existing branch ref',async()=>{
 builds=0;const g=new FakeGit();const x=await run(g);
 const interrupted={...x,status:'blocked',attempt:{...x.attempt,status:'blocked',percent:75,completed:x.attempt.completed.slice(0,5)}};
 const y=await recoverFiveFileSave({remote:g,blocked:interrupted});
 assert.equal(y.status,'verified');assert.equal(g.created,1);assert.equal(g.updated,1);assert.equal(builds,1);
});
test('silent transcript tampering blocks 100% even if manifest counters still match',async()=>{
 const g=new FakeGit();g.corruptReadback=true;
 const x=await run(g);assert.equal(x.status,'blocked');assert.equal(x.attempt.percent,85);
 assert.match(x.reason,/Remote bytes differ/);assert.equal(g.head,newCommit);
});

class MemoryJournal {
 constructor(){this.entries=new Map();this.writes=0;this.failFinal=false;}
 async read(branch){const x=this.entries.get(branch);return x==null?null:structuredClone(x)}
 async write(branch,value){
  if(this.failFinal&&value.status==='verified')throw Error('Journal service offline');
  this.entries.set(branch,structuredClone(value));this.writes++;
 }
}
test('durable journal tracks checkpoint before commit and confirms exact final state',async()=>{
 const g=new FakeGit(),journal=new MemoryJournal();
 const r=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(r.status,'verified');assert.equal(journal.writes,4);
 const saved=await journal.read(branch);
 assert.equal(saved.status,'verified');assert.equal(saved.expectedFiles,null);
 assert.equal(saved.commitHead,newCommit);
});
test('fresh session refuses a second story turn while remote journal is blocked',async()=>{
 const g=new FakeGit(),journal=new MemoryJournal();g.failUpdate=true;
 const first=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(first.status,'blocked');assert.equal(first.attempt.percent,75);
 const second=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(second.status,'blocked');assert.match(second.reason,/Unresolved durable save attempt/);
 assert.equal(g.created,1);
 g.failUpdate=false;
 const resumed=await recoverJournaledSave({remote:g,journal,branch});
 assert.equal(resumed.status,'verified');
 assert.equal((await journal.read(branch)).status,'verified');
 assert.equal(g.created,1);
});
test('journal recovery after context loss returns same narrative without a new commit',async()=>{
 const g=new FakeGit(),journal=new MemoryJournal();g.failReadback=true;
 const x=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(x.status,'blocked');assert.equal(g.head,newCommit);
 g.failReadback=false;
 const r=await recoverJournaledSave({remote:g,journal,branch});
 assert.equal(r.status,'verified');assert.equal(r.attempt.percent,100);
 assert.deepEqual(r.narration_messages,[words]);assert.equal(g.created,1);
});
test('journal write outage fails before the commit, never claiming progress',async()=>{
 const g=new FakeGit();const journal={
  async read(){return null},async write(){throw Error('Journal unavailable')}
 };
 const r=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(r.status,'blocked');assert.equal(g.created,0);
 assert.match(r.reason,/Journal unavailable/);
});
test('if journal finalization fails after remote readback, recovery must certify it',async()=>{
 const g=new FakeGit(),journal=new MemoryJournal();journal.failFinal=true;
 const r=await saveFiveFileTurn({remote:g,journal,branch,chapterId:'CH-000',buildNext});
 assert.equal(r.status,'blocked');assert.equal(g.created,1);
 journal.failFinal=false;
 const recovered=await recoverJournaledSave({remote:g,journal,branch});
 assert.equal(recovered.status,'verified');assert.equal(g.created,1);
});
test('journal with no detached commit SHA blocks recovery without re-authoring text',async()=>{
 const g=new FakeGit(),journal=new MemoryJournal();
 const staged={status:'blocked',branch,sourceHead:source,commitHead:null,expectedFiles:sourceFiles(),
  attempt:{version:1,status:'blocked',source_head:source,chapter_id:'CH-000',turn:futureTurn,
   completed:['read','validate','stage','preflight'],percent:60}};
 await journal.write(branch,staged);
 const r=await recoverJournaledSave({remote:g,journal,branch});
 assert.equal(r.status,'blocked');assert.match(r.reason,/Unknown commit/);assert.equal(g.created,0);
});

// Recreate only durable Git/journal storage, discarding the save result and all
// caller-held staged text. Recovery runs in a fresh session with zero writes.
async function verifiedSession(messages=[words]){
 const oldGit=new FakeGit(),oldJournal=new MemoryJournal();
 const saved=await saveFiveFileTurn({remote:oldGit,journal:oldJournal,branch,
  chapterId:'CH-000',buildNext:args=>{
   const next=buildNext(args);
   if(messages.length===1&&messages[0]===words)return next;
   return stageNarrativeTurn(args.snapshot,{key:'synthetic-multiple-messages',
    save_guard:{observed_head:args.observedHead,previous_attempt:null},
    intent:'Jack observa su mesa.',outcome:'El taller sigue en calma.',
    player_text:'Observar.',narration_messages:messages,elapsed_days:0,offscreen:[]});
  }});
 assert.equal(saved.status,'verified');
 const remote=new FakeGit(),journal=new MemoryJournal(),reads=[];
 remote.head=oldGit.head;remote.commits=structuredClone(oldGit.commits);
 journal.entries=structuredClone(oldJournal.entries);
 const readFiles=remote.readFiles.bind(remote);
 remote.readFiles=async(sha,paths)=>{reads.push({sha,paths});return readFiles(sha,paths)};
 return {remote,journal,reads};
}
function assertNoRecoveryWrites({remote,journal},buildCount){
 assert.equal(remote.created,0);assert.equal(remote.updated,0);
 assert.equal(journal.writes,0);assert.equal(builds,buildCount);
}
test('verified journal recovers multiple literal messages after delivery/context loss',async()=>{
 const messages=['  —¿El café? ☕\n\nUna luz tenue.  ','\nUna segunda línea.\r\nÁrbol y cafe\u0301.\n'];
 const fixture=await verifiedSession(messages),buildCount=builds;
 const originalJournal=structuredClone(fixture.journal.entries);
 const originalCommits=structuredClone(fixture.remote.commits);
 const r=await recoverJournaledSave({...fixture,branch});
 assert.equal(r.status,'verified');assert.equal(r.attempt.percent,100);
 assert.deepEqual(r.narration_messages,messages);
 assert.deepEqual(fixture.reads,[{sha:newCommit,paths:savePaths('CH-000')}]);
 assertNoRecoveryWrites(fixture,buildCount);
 assert.deepEqual(fixture.journal.entries,originalJournal);
 assert.deepEqual(fixture.remote.commits,originalCommits);
});
test('verified journal recovery is repeatable without duplicate turns or regeneration',async()=>{
 const fixture=await verifiedSession(),buildCount=builds;
 const first=await recoverJournaledSave({...fixture,branch});
 const second=await recoverJournaledSave({...fixture,branch});
 assert.deepEqual(first,second);assert.deepEqual(second.narration_messages,[words]);
 assert.equal(fixture.reads.length,2);assertNoRecoveryWrites(fixture,buildCount);
 const snapshot=decodeFiveFiles(fixture.remote.commits.get(newCommit),'CH-000');
 assert.equal(snapshot.transcript.entries.filter(x=>x.turn===futureTurn&&x.role==='player').length,1);
});
for(const [name,mutate,reason] of [
 ['read outage',f=>{f.remote.failReadback=true},/readback outage/],
 ['missing file',f=>{delete f.remote.commits.get(newCommit)['chapters/CH-000.events.json']},/Missing complete save file/],
 ['invalid JSON',f=>{f.remote.corruptReadback=true},/JSON/],
 ['inconsistent checkpoint',f=>{
   const files=f.remote.commits.get(newCommit),manifest=JSON.parse(files['game/SAVE_MANIFEST.json']);
   manifest.last_event_sequence++;
   files['game/SAVE_MANIFEST.json']=JSON.stringify(manifest);
  },/Sequence mismatch/],
 ['missing chapter prose',f=>{f.remote.commits.get(newCommit)['chapters/CH-000.md']='Not the saved chapter.'},/literal turn narration/],
 ['different turn',f=>{f.journal.entries.get(branch).attempt.turn++},/saved chapter\/turn/],
 ['different chapter',f=>{
   f.journal.entries.get(branch).attempt.chapter_id='CH-001';
   const files=f.remote.commits.get(newCommit);
   for(const path of savePaths('CH-000'))files[path.replace('CH-000','CH-001')]=files[path];
  },/saved chapter\/turn/],
 ['invalid chapter ID',f=>{f.journal.entries.get(branch).attempt.chapter_id='../other'},/Invalid chapter ID/],
 ['invalid turn',f=>{f.journal.entries.get(branch).attempt.turn=0},/Invalid verified journal turn/],
 ['journal branch mismatch',f=>{f.journal.entries.get(branch).branch='work/other'},/Journal branch mismatch/],
 ['source identity mismatch',f=>{f.journal.entries.get(branch).sourceHead=other},/commit identity mismatch/],
 ['verified commit mismatch',f=>{f.journal.entries.get(branch).attempt.verified_head=other},/commit identity mismatch/],
 ['missing complete evidence',f=>{delete f.journal.entries.get(branch).attempt.evidence},/complete save evidence/],
 ['changed branch',f=>{f.remote.head=other},/disagrees with branch/],
 ['branch changed during read',f=>{
   const read=f.remote.readFiles;
   f.remote.readFiles=async(...args)=>{const files=await read(...args);f.remote.head=other;return files};
  },/moved during recovery/]
])test('verified journal blocks '+name+' without exposing or rewriting narration',async()=>{
 const fixture=await verifiedSession(),buildCount=builds;
 mutate(fixture);
 const originalJournal=structuredClone(fixture.journal.entries);
 const r=await recoverJournaledSave({...fixture,branch});
 assert.equal(r.status,'blocked');assert.match(r.reason,reason);
 assert.equal(Object.hasOwn(r,'narration_messages'),false);assert.equal(r.expectedFiles,null);
 assert.ok(r.attempt===null||r.attempt.status==='blocked');
 assert.deepEqual(fixture.journal.entries,originalJournal);
 assertNoRecoveryWrites(fixture,buildCount);
});
test('journal unavailable or absent produces a blocked recovery result',async()=>{
 const fixture=await verifiedSession(),buildCount=builds;
 fixture.journal.entries.clear();
 const absent=await recoverJournaledSave({...fixture,branch});
 assert.equal(absent.status,'blocked');assert.match(absent.reason,/No durable save attempt/);
 fixture.journal.read=async()=>{throw Error('Journal read unavailable')};
 const unavailable=await recoverJournaledSave({...fixture,branch});
 assert.equal(unavailable.status,'blocked');assert.match(unavailable.reason,/Journal read unavailable/);
 assertNoRecoveryWrites(fixture,buildCount);
});
