// End-to-end rehearsal: only in-memory remote Git objects; NO story data writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {saveFiveFileTurn,recoverFiveFileSave,decodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';
import {stageNarrativeTurn} from '../tools/turn_engine.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source='a'.repeat(40),newCommit='b'.repeat(40),other='c'.repeat(40),branch='work/chat-narrative-foundation';
function sourceFiles(){
 return Object.fromEntries(savePaths('CH-000').map(p=>[p,readFileSync(resolve(root,p),'utf8')]));
}
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
 return stageNarrativeTurn(snapshot,{key:'synthetic-save-turn-0007',save_guard:{observed_head:observedHead,previous_attempt:null},
  intent:'Jack observa su mesa de trabajo.',outcome:'El taller sigue en calma.',
  player_text:'Jack observa el taller.',narration_messages:[words],elapsed_days:0,offscreen:[]});
};
const run=remote=>saveFiveFileTurn({remote,branch,chapterId:'CH-000',buildNext,message:'Synthetic test only'});
test('synthetic turn atomically commits all five and reads back exact prose',async()=>{
 builds=0;const g=new FakeGit(),r=await run(g);
 assert.equal(r.status,'verified');assert.equal(r.attempt.percent,100);assert.equal(g.created,1);assert.equal(g.updated,1);
 assert.equal(g.head,newCommit);assert.equal(builds,1);assert.deepEqual(r.narration_messages,[words]);
 const next=decodeFiveFiles(g.commits.get(newCommit),'CH-000');
 assert.equal(next.manifest.last_completed_turn,7);assert.equal(next.events.events.length,22);
 assert.equal(next.transcript.entries.length,16);assert.equal(next.transcript.entries.at(-1).text,words);
 assert.equal(decodeFiveFiles(g.commits.get(source),'CH-000').manifest.last_completed_turn,6);
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
 assert.equal(transcript.entries.filter(e=>e.turn===7&&e.role==='player').length,1);
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
