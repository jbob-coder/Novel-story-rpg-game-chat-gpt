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

test('authoritative chapter transition refuses a journal that has no baseline',async()=>{
 const remote=new Remote(),journal=new Journal();
 const r=await saveChapterTransition({remote,journal,branch:'work/chat-narrative-foundation',
  chapterId:'CH-000',nextPlan:plan('CH-001',source),
  reason:'Reviewed synthetic boundary.',reviewed:true});
 assert.equal(r.status,'blocked');
 assert.match(r.reason,/journal not initialized/);
 assert.equal(remote.created,0);assert.equal(journal.writes,0);
});
test('authoritative chapter transition accepts exact previously verified ready baseline',async()=>{
 const remote=new Remote(),journal=new Journal();
 journal.entry={status:'ready',branch:'work/chat-narrative-foundation',
  baselineHead:source,chapterId:'CH-000',turn:9,
  lastEventId:'EV-000029',lastTranscriptId:'TXT-000020'};
 const r=await saveChapterTransition({remote,journal,branch:'work/chat-narrative-foundation',
  chapterId:'CH-000',nextPlan:plan('CH-001',source),
  reason:'Reviewed synthetic boundary.',reviewed:true});
 assert.equal(r.status,'verified',r.reason);
 assert.equal(remote.created,1);assert.equal(remote.updates,1);
 assert.equal(journal.entry.status,'verified');
 assert.equal(journal.entry.attempt.chapter_id,'CH-001');
});

test('an ordinary choice, its private consequence and the Day 0 arrival survive separate chapter and save boundaries', async () => {
 const {ordinaryMorning} = await import('./helpers/ordinary_morning.mjs');
 const {verifyNarrativeSnapshot} = await import('../tools/turn_engine.mjs');
 const {allEvents} = await import('../tools/chapter_history.mjs');
 for (const visit of [false, true]) {
  const remote = new Remote(), journal = new Journal();
  let chapterId = 'CH-000';
  const snapshot = () => readCheckpoint({remote, commitSha: remote.head, chapterId});
  const save = turn => saveLivingWorldTurn({remote, journal, branch, chapterId, turn});
  const interval = (key, days, minutes, phase) => ({
   key, intent: 'Dejar pasar el intervalo solicitado.', outcome: 'Termina el intervalo.',
   player_text: 'Dejo pasar el tiempo.', narration_messages: ['La luz entra por la ventana.'],
   elapsed_days: days, elapsed_minutes: minutes,
   ...(phase === undefined ? {} : {day_zero_phase: phase})
  });
  const first = await saveLivingWorldTurn({remote, journal, branch, chapterId,
   ...ordinaryMorning(await snapshot(), {visit, recipientPresent: !visit})});
  assert.equal(first.status, 'verified', first.reason);
  const choice = await snapshot();
  const advance = await save(interval('qa-time-to-minus-one', 28, 28 * 1440));
  assert.equal(advance.status, 'verified', advance.reason);
  const boundary = plan('CH-001', remote.head);
  boundary.time_context.day = -1;
  const closed = await transition(remote, journal, {nextPlan: boundary});
  assert.equal(closed.status, 'verified', closed.reason);
  chapterId = 'CH-001';
  const early = await save(interval('qa-before-arrival', 1, 1440, 'before_arrival'));
  assert.equal(early.status, 'verified', early.reason);
  const before = await snapshot();
  assert.equal(before.state.time.day, 0);
  assert.equal(before.state.world.shockwave_arrived, false);
  for (const invalid of [interval('qa-skip-arrival', 1, 1440), interval('qa-no-interval', 0, 0, 'arrival')]) {
   const rejected = await save(invalid);
   assert.equal(rejected.status, 'blocked');
   assert.equal(remote.head, early.commitHead);
  }
  const arrival = interval('qa-actual-arrival', 0, 5, 'arrival');
  remote.failUpdate = true;
  const interrupted = await save(arrival);
  assert.equal(interrupted.status, 'blocked');
  assert.equal(remote.head, early.commitHead);
  remote.failUpdate = false;
  const recovered = await recoverJournaledSave({remote, journal, branch});
  assert.equal(recovered.status, 'verified', recovered.reason);
  assert.equal(recovered.commitHead, interrupted.commitHead);
  assert.deepEqual(recovered.narration_messages, arrival.narration_messages);
  assert.equal((await save(interval('qa-duplicate-arrival', 0, 5, 'arrival'))).status, 'blocked');
  // A private observation after arrival can persist without proving a cause or
  // granting anyone an ability. Only Darius examines the synthetic receipt.
  const post = interval('qa-following-day', 1, 1440);
  const observation = 'Al soltar el recibo, el papel queda suspendido un instante.';
  const resolutions = visit ? [] : [{actor_id: 'NPC-003', reviewed: true, resolved: true,
   causal_basis: 'Darius ordena el comprobante que recibió en la entrega.',
   outcome: 'El mensajero anota una observación cuya causa desconoce.',
   changes: [{field: 'knowledge', fact: observation, source: 'Darius observa el recibo directamente.'}]}];
  const next = await saveLivingWorldTurn({remote, journal, branch, chapterId, turn: post,
   npcResolutions: resolutions});
  assert.equal(next.status, 'verified', next.reason);
  const later = await snapshot();
  const anchors = allEvents(later).filter(event => event.kind === 'cosmic_shockwave');
  assert.equal(anchors.length, 1);
  assert.deepEqual(anchors[0].known_to, []);
  assert.equal(later.state.time.day, 1);
  assert.deepEqual(later.state.player, choice.state.player);
  assert.equal(later.state.world.shockwave_arrived, true);
  const courier = later.state.world.actors['NPC-003'];
  assert.equal(courier.knowledge.some(f => f.includes(observation)), !visit);
  assert.deepEqual(courier.resources, choice.state.world.actors[courier.id].resources);
  assert.deepEqual(courier.progression, choice.state.world.actors[courier.id].progression);
  assert.ok(!later.chapter.includes(observation));
  assert.ok(!later.state.player.knowledge.some(f => f.includes(observation)));
  assert.equal(later.state.world.humans_with_powers_observed, false);
  assert.ok(later.archives['CH-000'].chapter.includes(first.narration_messages[0]));
  for (const corrupt of [s => {s.state.world.shockwave_arrived = false;},
   s => {s.events.events.find(e => e.kind === 'cosmic_shockwave').known_to.push(s.state.player.id);},
   s => {s.events.events.find(e => e.kind === 'cosmic_shockwave').day = 1;}]) {
   const broken = structuredClone(later);
   corrupt(broken);
   assert.throws(() => verifyNarrativeSnapshot(broken));
  }
 }
});
