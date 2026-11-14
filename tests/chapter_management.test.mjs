// All chapter transitions here are synthetic and stay in memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageChapterTransition,validateChapterPlan} from '../tools/chapter_management.mjs';
import {allEvents,allTranscriptEntries,chapterFilePaths,fileDigest} from '../tools/chapter_history.mjs';
import {stageNarrativeTurn,verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {stageNarratorScene} from '../tools/narrative_archive.mjs';
import {decodeFiveFiles,encodeFiveFiles,savePaths} from '../tools/save_transaction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const head='a'.repeat(40),nextHead='b'.repeat(40);
const files=Object.fromEntries(savePaths('CH-000').map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const baseline=decodeFiveFiles(files,'CH-000');
const plan=(snapshot,source=head)=>({plan_version:1,
 chapter_id:'CH-'+String(Number(snapshot.manifest.chapter_id.slice(3))+1).padStart(3,'0'),
 title:'Synthetic continuation',status:'prepared',source_commit:source,
 purpose:'Explore ordinary events without scripting player choices.',
 time_context:{day:snapshot.state.time.day,period:snapshot.state.time.time_of_day,constraints:['No premature wave effects.']},
 location_ids:[snapshot.state.player.location_id],npc_ids:['NPC-005'],
 thread_ids:snapshot.state.narrative_threads.filter(x=>x.status==='open').map(x=>x.id),
 hidden_plan_ids:[],possible_developments:['A private circumstance may change.'],
 exit_conditions:['The current situation reaches a natural pause.']});
const close=(snapshot=baseline,overrides={})=>stageChapterTransition({snapshot,nextPlan:plan(snapshot),
 reason:'Synthetic review identifies a natural chapter boundary.',observedHead:head,reviewed:true,...overrides});
const action=(snapshot,overrides={})=>({key:'synthetic-chapter-turn-'+(snapshot.manifest.last_completed_turn+1),
 save_guard:{observed_head:head,previous_attempt:null},intent:'Synthetic observation.',outcome:'The workshop remains quiet.',
 player_text:'SYNTHETIC INPUT',narration_messages:['SYNTHETIC SCENE: A light falls across the workbench.'],
 elapsed_days:0,elapsed_minutes:0,...overrides});
const advance=(snapshot,overrides={})=>stageNarrativeTurn(snapshot,action(snapshot,overrides));
const withSource=snapshot=>({...snapshot,sourceFiles:encodeFiveFiles(snapshot)});

test('chapter transition preserves the played world and every original archived byte',()=>{
 const before=JSON.stringify(baseline),after=close();
 assert.equal(JSON.stringify(baseline),before);
 assert.equal(after.manifest.chapter_id,'CH-001');
 assert.equal(after.manifest.last_completed_turn,9);
 assert.equal(after.manifest.last_event_id,'EV-000029');
 assert.equal(after.manifest.last_transcript_id,'TXT-000020');
 assert.deepEqual(after.state.time,baseline.state.time);
 assert.deepEqual(after.state.player,baseline.state.player);
 assert.deepEqual(after.state.world,baseline.state.world);
 assert.deepEqual(after.state.narrative_threads,baseline.state.narrative_threads);
 assert.deepEqual(after.state.pending,baseline.state.pending);
 assert.equal(after.chapter,'');
 assert.deepEqual(after.events.events,[]);
 assert.deepEqual(after.transcript.entries,[]);
 assert.equal(after.transcript.last_entry_sequence,20);
 for(const path of chapterFilePaths('CH-000')){
  assert.equal(after.archives['CH-000'].files[path],files[path]);
  assert.equal(after.state.history.completed_chapters[0].file_hashes[path],fileDigest(files[path]));
 }
 assert.equal(verifyNarrativeSnapshot(after),true);
 assert.equal(after.sourceFiles,undefined);
});

test('the next chapter starts at the next global turn, event and transcript identifiers',()=>{
 const opened=close(),after=advance(opened);
 assert.equal(after.events.events.length,1);
 assert.equal(after.events.events[0].id,'EV-000030');
 assert.equal(after.events.events[0].turn,10);
 assert.equal(after.events.events[0].chapter_id,'CH-001');
 assert.deepEqual(after.transcript.entries.map(x=>x.id),['TXT-000021','TXT-000022']);
 assert.equal(after.manifest.last_event_sequence,30);
 assert.equal(after.manifest.last_transcript_sequence,22);
 assert.equal(allEvents(after).length,30);
 assert.equal(allTranscriptEntries(after).length,22);
 assert.equal(verifyNarrativeSnapshot(after),true);
 assert.deepEqual(after.archives,opened.archives);
});

test('a second boundary preserves distinct local archives and global history',()=>{
 const first=advance(close());
 const second=close(withSource(first),{nextPlan:plan(first,nextHead),observedHead:nextHead});
 assert.equal(second.manifest.chapter_id,'CH-002');
 assert.equal(second.manifest.last_completed_turn,10);
 assert.equal(second.state.history.completed_chapters.length,2);
 const after=advance(second);
 assert.equal(after.events.events[0].id,'EV-000031');
 assert.equal(after.events.events[0].turn,11);
 assert.equal(after.transcript.entries[0].id,'TXT-000023');
 assert.equal(allEvents(after).length,31);
 assert.equal(after.archives['CH-000'].events.events.length,29);
 assert.equal(after.archives['CH-001'].events.events.length,1);
 assert.equal(verifyNarrativeSnapshot(after),true);
});

test('a surviving thread can develop from its original chapter in a new chapter',()=>{
 const opened=close(),thread=opened.state.narrative_threads.find(x=>x.status==='open');
 const after=advance(opened,{consequence_updates:[{op:'develop',thread_id:thread.id,
  event_id:'EV-000030',summary:'Synthetic continuation of the unresolved situation.',visibility:'hidden'}]});
 const updated=after.state.narrative_threads.find(x=>x.id===thread.id);
 assert.equal(updated.origin_event_id,thread.origin_event_id);
 assert.equal(updated.history.at(-1).event_id,'EV-000030');
 assert.equal(verifyNarrativeSnapshot(after),true);
});

test('a comparable journey keeps its reference across a chapter boundary',()=>{
 const workshop='LOC-WILSON-WORKSHOP',home='LOC-WILSON-APARTMENT';
 const movement=(before,after,reference_event_id)=>({field:'location_id',before,after,
  travel:{mode:'walk',elapsed_minutes:0,basis:'Synthetic brief indoor movement.',
   ...(reference_event_id?{reference_event_id}:{})}});
 const moved=advance(baseline,{changes:[movement(workshop,home)]});
 const opened=close(withSource(moved));
 const back=advance(opened,{changes:[movement(home,workshop)]});
 assert.throws(()=>advance(back,{changes:[movement(workshop,home)]}),/Latest comparable travel reference/);
 const after=advance(back,{changes:[movement(workshop,home,'EV-000030')]});
 assert.equal(verifyNarrativeSnapshot(after),true);
});

test('archive corruption, missing history and forged bounds block recovery validation',()=>{
 const opened=close();
 for(const corrupt of [
  x=>delete x.archives['CH-000'],
  x=>{x.archives['CH-000'].files['chapters/CH-000.md']+='changed'},
  x=>{x.archives['CH-000'].events.events[0].outcome='changed'},
  x=>{x.state.history.completed_chapters[0].last_event_sequence--},
  x=>{x.state.history.completed_chapters[0].first_turn=0},
  x=>{x.archives['CH-009']=x.archives['CH-000']}
 ]){
  const damaged=structuredClone(opened);corrupt(damaged);
  assert.throws(()=>verifyNarrativeSnapshot(damaged));
 }
});

test('chapter closure requires review, correct source bytes and the next identity',()=>{
 assert.throws(()=>close(baseline,{reviewed:false}),/explicit review/);
 assert.throws(()=>close(baseline,{reason:''}),/explicit review/);
 assert.throws(()=>close(baseline,{nextPlan:{...plan(baseline),chapter_id:'CH-002'}}),/next chapter/);
 assert.throws(()=>close(baseline,{nextPlan:{...plan(baseline),status:'draft'}}),/not prepared/);
 const missing=structuredClone(baseline);delete missing.sourceFiles;
 assert.throws(()=>close(missing),/Verified original file required/);
 const changed=structuredClone(baseline);changed.sourceFiles['chapters/CH-000.md']+='changed';
 assert.throws(()=>close(changed),/source files differ/);
 assert.throws(()=>close(withSource(close())),/empty or unplayed/);
});

test('preparation validates references and never becomes visible prose',()=>{
 for(const patch of [
  {source_commit:nextHead},{location_ids:['LOC-UNKNOWN']},{npc_ids:['NPC-999']},
  {thread_ids:['THREAD-999999']},{hidden_plan_ids:['PLAN-999999']},{exit_conditions:[]},
  {time_context:{day:0,period:'morning',constraints:[]}}
 ])assert.throws(()=>validateChapterPlan({...plan(baseline),...patch},{snapshot:baseline,observedHead:head}));
 const opened=close();
 assert.equal(opened.state.chapter.planning.purpose,plan(baseline).purpose);
 assert.ok(!opened.chapter.includes(plan(baseline).possible_developments[0]));
});

test('opening scene keys remain unique across chapters',()=>{
 const original=baseline.transcript.entries.find(x=>x.kind==='scene');
 assert.ok(original);
 assert.throws(()=>stageNarratorScene(close(),'Synthetic visible opening.',original.source_key,
  {observed_head:head,previous_attempt:null}),/Scene already saved/);
 const opened=stageNarratorScene(close(),'Synthetic visible opening.','synthetic-new-chapter-opening',
  {observed_head:head,previous_attempt:null});
 assert.equal(opened.transcript.entries[0].id,'TXT-000021');
 assert.equal(opened.manifest.last_completed_turn,9);
 assert.equal(verifyNarrativeSnapshot(opened),true);
});
