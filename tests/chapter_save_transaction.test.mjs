// Synthetic multi-chapter persistence only. No fixture is a played turn.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {savePaths,readCheckpoint,saveChapterTransition,recoverJournaledSave} from '../tools/save_transaction.mjs';
import {chapterFilePaths} from '../tools/chapter_history.mjs';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source='a'.repeat(40),branch='qa/multichapter-synthetic';
const original=Object.fromEntries(savePaths('CH-000').map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const plan=(id,head)=>({plan_version:1,chapter_id:id,title:'Synthetic chapter',status:'prepared',
 source_commit:head,purpose:'Synthetic continuity test without a predetermined outcome.',
 time_context:{day:-29,period:'morning',constraints:[]},location_ids:['LOC-WILSON-WORKSHOP'],
 npc_ids:['NPC-005'],thread_ids:[],hidden_plan_ids:[],possible_developments:[],
 exit_conditions:['A reviewed natural pause in the synthetic scenario.']});
class Remote {
 constructor(){this.head=source;this.commits=new Map([[source,structuredClone(original)]]);
  this.created=0;this.updates=0;this.written=[];this.reads=[];this.failUpdate=false;this.failRead=false;}
 async readHead(){return this.head}
 async readFiles(sha,paths){
  this.reads.push({sha,paths:[...paths]});
  if(this.failRead&&sha!==source)throw Error('Synthetic readback outage');
  const files=this.commits.get(sha);assert.ok(files,'Unknown synthetic commit');
  return Object.fromEntries(paths.map(path=>[path,files[path]]));
 }
 async assertFilesAbsent(sha,paths){return paths.every(path=>!Object.hasOwn(this.commits.get(sha),path))}
 async createCommit({parentSha,files}){
  assert.equal(parentSha,this.head);
  const next=String(++this.created).padStart(40,'0');
  this.commits.set(next,{...this.commits.get(parentSha),...structuredClone(files)});
  this.written.push(Object.keys(files));return next;
 }
 async updateHead({expectedSha,newSha}){
  this.updates++;if(this.failUpdate||expectedSha!==this.head)return false;
  this.head=newSha;return true;
 }
}
class Journal {
 constructor(){this.entry=null;this.writes=0;this.failFinal=false;}
 async read(){return structuredClone(this.entry)}
 async write(_branch,entry){
  if(this.failFinal&&entry.status==='verified')throw Error('Synthetic journal outage');
  this.writes++;this.entry=structuredClone(entry);
 }
}
const transition=(remote,journal,extra={})=>saveChapterTransition({remote,journal,branch,chapterId:'CH-000',
 nextPlan:plan('CH-001',remote.head),reason:'Reviewed synthetic chapter boundary.',reviewed:true,...extra});
const quietTurn=()=>({key:'synthetic-first-ch001-turn',intent:'Synthetic observation.',outcome:'Synthetic calm moment.',
 player_text:'SYNTHETIC observation.',narration_messages:['SYNTHETIC — the workshop stays quiet.\n\nNo secret is disclosed.'],
 elapsed_days:0,elapsed_minutes:20});

test('transition writes exactly five destination files and preserves closed chapter bytes',async()=>{
 const remote=new Remote(),journal=new Journal();
 const result=await transition(remote,journal);
 assert.equal(result.status,'verified',result.reason);assert.equal(result.operation,'chapter_transition');
 assert.deepEqual(result.narration_messages,[]);assert.equal(result.attempt.percent,100);
 assert.deepEqual(remote.written,[savePaths('CH-001')]);
 for(const path of chapterFilePaths('CH-000'))assert.equal(remote.commits.get(remote.head)[path],original[path]);
 const next=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-001'});
 assert.equal(next.manifest.last_completed_turn,9);assert.equal(next.manifest.last_event_id,'EV-000029');
 assert.equal(next.manifest.last_transcript_id,'TXT-000020');
 assert.deepEqual(next.events.events,[]);assert.deepEqual(next.transcript.entries,[]);assert.equal(next.chapter,'');
 const oldState=JSON.parse(original['game/STATE.json']);
 for(const field of ['player','world','time','pending','narrative_threads'])assert.deepEqual(next.state[field],oldState[field]);
 assert.equal(next.state.history.completed_chapters[0].closed_from_commit,source);
 assert.ok(remote.reads.some(read=>read.sha===remote.head&&read.paths.includes('chapters/CH-000.md')));
});

test('verified transition recovery after context loss returns no fabricated or previous scene',async()=>{
 const remote=new Remote(),journal=new Journal();
 await transition(remote,journal);
 const counts=[remote.created,remote.updates,journal.writes];
 const first=await recoverJournaledSave({remote,journal,branch});
 const second=await recoverJournaledSave({remote,journal,branch});
 assert.equal(first.status,'verified',first.reason);assert.deepEqual(first,second);
 assert.deepEqual(first.narration_messages,[]);assert.equal(first.operation,'chapter_transition');
 assert.deepEqual([remote.created,remote.updates,journal.writes],counts);
});

test('turn after rollover continues global IDs and rereads history on delivery recovery',async()=>{
 const remote=new Remote(),journal=new Journal();
 assert.equal((await transition(remote,journal)).status,'verified');
 const saved=await saveLivingWorldTurn({remote,journal,branch,chapterId:'CH-001',turn:quietTurn()});
 assert.equal(saved.status,'verified',saved.reason);
 const next=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-001'});
 assert.equal(next.manifest.last_completed_turn,10);assert.equal(next.events.events[0].id,'EV-000030');
 assert.deepEqual(next.transcript.entries.map(entry=>entry.id),['TXT-000021','TXT-000022']);
 assert.deepEqual(next.transcript.entries.map(entry=>entry.chapter_id),['CH-001','CH-001']);
 const counts=[remote.created,remote.updates,journal.writes];
 const recovered=await recoverJournaledSave({remote,journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.deepEqual(recovered.narration_messages,quietTurn().narration_messages);
 assert.deepEqual([remote.created,remote.updates,journal.writes],counts);
 for(const path of chapterFilePaths('CH-000'))assert.equal(remote.commits.get(remote.head)[path],original[path]);
});

for(const failure of ['before-ref','after-ref','journal-finalization'])
 test('interrupted chapter transition recovers same commit: '+failure,async()=>{
  const remote=new Remote(),journal=new Journal();
  if(failure==='before-ref')remote.failUpdate=true;
  if(failure==='after-ref')remote.failRead=true;
  if(failure==='journal-finalization')journal.failFinal=true;
  const blocked=await transition(remote,journal);
  assert.equal(blocked.status,'blocked');assert.equal(remote.created,1);
  const commit=blocked.commitHead;
  const duplicate=await transition(remote,journal);
  assert.equal(duplicate.status,'blocked');assert.equal(remote.created,1);
  remote.failUpdate=false;remote.failRead=false;journal.failFinal=false;
  const recovered=await recoverJournaledSave({remote,journal,branch});
  assert.equal(recovered.status,'verified',recovered.reason);assert.equal(remote.head,commit);
  assert.equal(remote.created,1);assert.deepEqual(recovered.narration_messages,[]);
  const next=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-001'});
  assert.equal(next.state.history.completed_chapters.length,1);assert.equal(next.manifest.last_completed_turn,9);
 });

for(const [name,setup,expected] of [
 ['no durable journal',()=>({journal:null}),/Durable journal required/],
 ['no destination absence check',remote=>{remote.assertFilesAbsent=undefined;return {}},/verify destination absence/],
 ['existing destination',remote=>{remote.commits.get(source)['chapters/CH-001.md']='existing';return {}},/already exists/],
 ['unreviewed closure',()=>({reviewed:false}),/explicit review/],
 ['stale planning source',()=>({nextPlan:plan('CH-001','f'.repeat(40))}),/Stale chapter planning/]
])test('chapter transition blocks before writes: '+name,async()=>{
 const remote=new Remote(),journal=new Journal();
 const result=await transition(remote,journal,setup(remote));
 assert.equal(result.status,'blocked');assert.match(result.reason,expected);
 assert.equal(remote.created,0);assert.equal(remote.head,source);
});

for(const failure of ['missing','changed'])test('closed chapter '+failure+' blocks verified recovery without writing',async()=>{
 const remote=new Remote(),journal=new Journal();
 assert.equal((await transition(remote,journal)).status,'verified');
 const path='chapters/CH-000.md',files=remote.commits.get(remote.head);
 if(failure==='missing')delete files[path];else files[path]+='Synthetic corruption';
 const counts=[remote.created,remote.updates,journal.writes];
 const result=await recoverJournaledSave({remote,journal,branch});
 assert.equal(result.status,'blocked');assert.equal(Object.hasOwn(result,'narration_messages'),false);
 assert.match(result.reason,/Missing closed chapter file|Closed chapter hash mismatch/);
 assert.deepEqual([remote.created,remote.updates,journal.writes],counts);
});

test('changed source chapter identity prevents detached transition recovery from moving branch',async()=>{
 const remote=new Remote(),journal=new Journal();remote.failUpdate=true;
 assert.equal((await transition(remote,journal)).status,'blocked');
 journal.entry.attempt.source_chapter_id='CH-099';remote.failUpdate=false;
 const updates=remote.updates;
 const result=await recoverJournaledSave({remote,journal,branch});
 assert.equal(result.status,'blocked');assert.match(result.reason,/Transition checkpoint/);
 assert.equal(remote.head,source);assert.equal(remote.updates,updates);
});
