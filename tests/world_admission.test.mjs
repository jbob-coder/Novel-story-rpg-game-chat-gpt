// Worldbuilding-only synthetic saves. Never modify the live chapter or files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preAdmissionFilesForQA} from './helpers/meridian_bay_fixture.mjs';
import {savePaths,decodeFiveFiles,encodeFiveFiles,readCheckpoint,saveWorldAdmission,
 saveChapterTransition,recoverFiveFileSave,recoverJournaledSave} from '../tools/save_transaction.mjs';
import {stageWorldAdmission,assertWorldAdmission} from '../tools/world_admission.mjs';
import {meridianBayDesign} from '../tools/meridian_bay_locations.mjs';

const source='a'.repeat(40),branch='qa/world-admission-only';
const originals=preAdmissionFilesForQA(Object.fromEntries(savePaths('CH-000').map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')])));
const review=head=>({reviewed:true,design_id:meridianBayDesign().world_design_id,
 source_commit:head,reason:'SYNTHETIC reviewed worldbuilding admission, separate from gameplay.'});
class Remote{
 constructor(files=originals){this.head=source;this.commits=new Map([[source,structuredClone(files)]]);
  this.created=0;this.updated=0;this.failUpdate=false;this.failRead=false;this.reads=[];}
 async readHead(){return this.head}
 async readFiles(sha,paths){
  this.reads.push({sha,paths:[...paths]});
  if(this.failRead&&sha!==source)throw Error('SYNTHETIC readback outage');
  const files=this.commits.get(sha);assert.ok(files,'Known immutable commit');
  return Object.fromEntries(paths.map(path=>[path,files[path]]));
 }
 async assertFilesAbsent(sha,paths){return paths.every(path=>!Object.hasOwn(this.commits.get(sha),path))}
 async createCommit({parentSha,files}){
  assert.equal(parentSha,this.head);
  const sha=String(++this.created).padStart(40,'0');
  this.commits.set(sha,{...this.commits.get(parentSha),...structuredClone(files)});
  return sha;
 }
 async updateHead({expectedSha,newSha}){
  this.updated++;if(this.failUpdate||expectedSha!==this.head)return false;
  this.head=newSha;return true;
 }
}
class Journal{
 constructor(){this.entry=null;this.writes=0;this.failFinal=false;}
 async read(){return structuredClone(this.entry)}
 async write(_branch,entry){
  if(this.failFinal&&entry.status==='verified')throw Error('SYNTHETIC journal finalization outage');
  this.entry=structuredClone(entry);this.writes++;
 }
}
const admit=(remote,journal,extra={})=>saveWorldAdmission({remote,journal,branch,
 chapterId:'CH-000',designReview:review(remote.head),...extra});
const counts=(remote,journal)=>[remote.created,remote.updated,journal.writes];

test('world admission persists six places while preserving every played fact and four exact original blobs',async()=>{
 const files=structuredClone(originals);
 for(const path of ['chapters/CH-000.transcript.json','chapters/CH-000.events.json','game/SAVE_MANIFEST.json'])
  files[path]=JSON.stringify(JSON.parse(files[path]),null,4)+'\n\n';
 const remote=new Remote(files),journal=new Journal(),before=decodeFiveFiles(files,'CH-000');
 const saved=await admit(remote,journal);
 assert.equal(saved.status,'verified',saved.reason);assert.equal(saved.attempt.percent,100);
 assert.equal(saved.operation,'world_admission');assert.equal(saved.attempt.turn,9);
 assert.deepEqual(saved.narration_messages,[]);
 const after=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-000'});
 assert.equal(Object.keys(after.state.world.locations).length,15);
 for(const field of ['player','time','history','pending','narrative_threads','save','chapter'])
  assert.deepEqual(after.state[field],before.state[field]);
 assert.deepEqual(after.state.world.actors,before.state.world.actors);
 assert.deepEqual(after.manifest,before.manifest);
 assert.equal(after.state.world.prebuilt_design_review.effective_from_turn,9);
 assert.equal(after.state.world.prebuilt_design_review.operation,'world_admission');
 for(const path of savePaths('CH-000'))if(path!=='game/STATE.json')
  assert.equal(remote.commits.get(remote.head)[path],files[path]);
 assert.equal(assertWorldAdmission(before,after,source),true);
 assert.equal(remote.reads.filter(r=>r.sha===source).length>=2,true);
});

test('verified world admission recovers no prior scene and does not duplicate an operation',async()=>{
 const remote=new Remote(),journal=new Journal();
 assert.equal((await admit(remote,journal)).status,'verified');
 const before=counts(remote,journal);
 const first=await recoverJournaledSave({remote,journal,branch});
 const second=await recoverJournaledSave({remote,journal,branch});
 assert.equal(first.status,'verified',first.reason);assert.deepEqual(first,second);
 assert.deepEqual(first.narration_messages,[]);assert.deepEqual(counts(remote,journal),before);
 const repeated=await admit(remote,journal);
 assert.equal(repeated.status,'blocked');assert.match(repeated.reason,/already admitted/);
 assert.deepEqual(counts(remote,journal),before);
});

for(const failure of ['before-ref','after-ref','journal-finalization'])
 test('interrupted world admission resumes the same commit without a turn: '+failure,async()=>{
  const remote=new Remote(),journal=new Journal();
  if(failure==='before-ref')remote.failUpdate=true;
  if(failure==='after-ref')remote.failRead=true;
  if(failure==='journal-finalization')journal.failFinal=true;
  const blocked=await admit(remote,journal);
  assert.equal(blocked.status,'blocked');assert.equal(remote.created,1);
  const duplicate=await admit(remote,journal);
  assert.equal(duplicate.status,'blocked');assert.equal(remote.created,1);
  remote.failUpdate=false;remote.failRead=false;journal.failFinal=false;
  const recovered=await recoverJournaledSave({remote,journal,branch});
  assert.equal(recovered.status,'verified',recovered.reason);
  assert.equal(recovered.commitHead,blocked.commitHead);assert.equal(remote.created,1);
  assert.deepEqual(recovered.narration_messages,[]);
  const after=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-000'});
  assert.equal(after.manifest.last_completed_turn,9);
  assert.equal(after.manifest.last_event_id,'EV-000029');
  assert.equal(after.manifest.last_transcript_id,'TXT-000020');
 });

test('missing journal, stale source and unreviewed designs block admission before writes',async()=>{
 for(const extra of [{journal:null},{designReview:{...review(source),reviewed:false}},
  {designReview:review('b'.repeat(40))}]){
  const remote=new Remote(),journal=new Journal();
  const result=await admit(remote,journal,extra);
  assert.equal(result.status,'blocked');assert.equal(remote.created,0);
  assert.equal(remote.head,source);assert.equal(journal.writes,0);
 }
});

test('strict world admission delta rejects changes to actors, time and unrelated world facts',()=>{
 const before=decodeFiveFiles(originals,'CH-000');
 const after=stageWorldAdmission({snapshot:before,observedHead:source,designReview:review(source)});
 for(const mutate of [
  s=>{s.state.time.elapsed_minutes_since_opening_approx+=1},
  s=>{s.state.player.conditions.push('SYNTHETIC unauthorized condition')},
  s=>{s.state.world.unrelated_fact='SYNTHETIC forbidden extra worldbuilding'},
  s=>{s.manifest.notes='SYNTHETIC unrelated manifest rewrite'}
 ]){
  const changed=structuredClone(after);mutate(changed);
  assert.throws(()=>assertWorldAdmission(before,changed,source));
 }
 assert.equal(before.state.world.prebuilt_design_id,undefined);
});

for(const corruption of ['source-identity','design-identity','unrelated-world','reformatted-history'])
 test('detached admission corruption cannot move the branch: '+corruption,async()=>{
  const remote=new Remote(),journal=new Journal();remote.failUpdate=true;
  const blocked=await admit(remote,journal);assert.equal(blocked.status,'blocked');
  if(corruption==='source-identity')journal.entry.attempt.source_chapter_id='CH-099';
  if(corruption==='design-identity')journal.entry.attempt.world_design_id='OTHER-DESIGN';
  if(corruption==='unrelated-world'){
   const files=remote.commits.get(blocked.commitHead),state=JSON.parse(files['game/STATE.json']);
   state.world.unrelated_fact='SYNTHETIC forged world change';
   files['game/STATE.json']=JSON.stringify(state,null,2)+'\n';
   journal.entry.expectedFiles['game/STATE.json']=files['game/STATE.json'];
  }
  if(corruption==='reformatted-history'){
   const path='chapters/CH-000.events.json',files=remote.commits.get(blocked.commitHead);
   files[path]=JSON.stringify(JSON.parse(files[path]));journal.entry.expectedFiles[path]=files[path];
  }
  remote.failUpdate=false;const before=counts(remote,journal);
  const result=await recoverJournaledSave({remote,journal,branch});
  assert.equal(result.status,'blocked');assert.equal(remote.head,source);
  assert.deepEqual(counts(remote,journal),before);
  assert.equal('narration_messages' in result,false);
 });

test('admission after a chapter transition preserves all archived bytes and empty active chapter',async()=>{
 const remote=new Remote(),journal=new Journal();
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic chapter',status:'prepared',
  source_commit:source,purpose:'Synthetic chapter boundary without new story events.',
  time_context:{day:-29,period:'morning',constraints:[]},location_ids:['LOC-WILSON-WORKSHOP'],
  npc_ids:[],thread_ids:[],hidden_plan_ids:[],possible_developments:[],
  exit_conditions:['Synthetic future natural pause.']};
 const transition=await saveChapterTransition({remote,journal,branch,chapterId:'CH-000',
  nextPlan,reason:'Synthetic reviewed boundary.',reviewed:true});
 assert.equal(transition.status,'verified',transition.reason);
 const before=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-001'});
 const result=await saveWorldAdmission({remote,journal,branch,chapterId:'CH-001',designReview:review(remote.head)});
 assert.equal(result.status,'verified',result.reason);
 const after=await readCheckpoint({remote,commitSha:remote.head,chapterId:'CH-001'});
 assert.deepEqual(after.archives,before.archives);assert.deepEqual(after.manifest,before.manifest);
 assert.deepEqual(after.events.events,[]);assert.deepEqual(after.transcript.entries,[]);
 const recovered=await recoverJournaledSave({remote,journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);assert.deepEqual(recovered.narration_messages,[]);
});

test('world admission and verified recovery support a genuine zero-turn synthetic checkpoint',async()=>{
 const zero=decodeFiveFiles(originals,'CH-000');
 zero.events.events=[];zero.transcript.entries=[];zero.transcript.last_entry_sequence=0;zero.chapter='';
 zero.manifest.last_completed_turn=0;zero.manifest.last_event_sequence=0;zero.manifest.last_event_id=null;
 zero.manifest.last_transcript_sequence=0;zero.manifest.last_transcript_id=null;
 zero.state.save.last_verified_turn=0;zero.state.history.last_event_sequence=0;
 zero.state.history.last_transcript_sequence=0;zero.state.history.completed_turn_keys=[];
 zero.state.chapter.last_resolved_event_id=null;zero.state.narrative_threads=[];
 for(const actor of [zero.state.player,...Object.values(zero.state.world.actors)]){
  for(const skill of Object.values(actor.progression.skills))skill.last_progress_event_id=null;
  delete actor.last_resolved_action;
 }
 const remote=new Remote(encodeFiveFiles(zero)),journal=new Journal();
 const result=await admit(remote,journal);
 assert.equal(result.status,'verified',result.reason);assert.equal(result.attempt.turn,0);
 const recovered=await recoverJournaledSave({remote,journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);assert.deepEqual(recovered.narration_messages,[]);
});

test('canonical admission requires an initialized matching journal and survives later code-only commits',async()=>{
 const canonical='work/chat-narrative-foundation',remote=new Remote(),journal=new Journal();
 const missing=await admit(remote,journal,{branch:canonical});
 assert.equal(missing.status,'blocked');assert.match(missing.reason,/not initialized/);
 assert.deepEqual(counts(remote,journal),[0,0,0]);
 journal.entry={status:'ready',branch:canonical,baselineHead:source,chapterId:'CH-000',
  turn:9,lastEventId:'EV-000029',lastTranscriptId:'TXT-000020'};
 const saved=await admit(remote,journal,{branch:canonical});
 assert.equal(saved.status,'verified',saved.reason);
 const descendant='d'.repeat(40);
 remote.commits.set(descendant,{...remote.commits.get(saved.commitHead),
  'README.md':'SYNTHETIC later code/documentation-only update'});
 remote.head=descendant;
 const before=counts(remote,journal);
 const recovered=await recoverJournaledSave({remote,journal,branch:canonical});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.equal(recovered.commitHead,saved.commitHead);assert.deepEqual(recovered.narration_messages,[]);
 assert.deepEqual(counts(remote,journal),before);assert.equal(remote.head,descendant);
});

test('admission refuses a journal write acknowledgment without exact durable readback',async()=>{
 const remote=new Remote(),journal=new Journal();
 journal.write=async()=>{journal.writes++};
 const result=await admit(remote,journal);
 assert.equal(result.status,'blocked');assert.match(result.reason,/Durable journal readback differs/);
 assert.equal(remote.created,0);assert.equal(remote.updated,0);
});

for(const recovery of ['direct','journaled','next-operation'])
 test('verified admission rechecks the source delta before '+recovery,async()=>{
  const remote=new Remote(),journal=new Journal(),saved=await admit(remote,journal);
  assert.equal(saved.status,'verified',saved.reason);
  // Simulate a forged persisted candidate and matching staged bytes. Full save
  // evidence and immutable reread alone cannot authorize an unrelated change.
  const files=remote.commits.get(saved.commitHead),state=JSON.parse(files['game/STATE.json']);
  state.world.unrelated_fact='SYNTHETIC forged change outside reviewed admission';
  files['game/STATE.json']=JSON.stringify(state,null,2)+'\n';
  saved.expectedFiles['game/STATE.json']=files['game/STATE.json'];
  const before=counts(remote,journal);
  const result=recovery==='direct'?await recoverFiveFileSave({remote,blocked:saved}):
   recovery==='journaled'?await recoverJournaledSave({remote,journal,branch}):
    await admit(remote,journal);
  assert.equal(result.status,'blocked');assert.match(result.reason,/World admission/);
  assert.equal('narration_messages' in result,false);
  assert.deepEqual(counts(remote,journal),before);
 });
