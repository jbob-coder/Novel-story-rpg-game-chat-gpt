// Synthetic city workflow only. All remote commits live in memory, never in canon.
import {draftReviewedSocialContact} from '../tools/living_world_social.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,readCheckpoint,saveChapterTransition,recoverJournaledSave} from '../tools/save_transaction.mjs';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {draftReviewedNeedIntroduction,draftReviewedNeedTradeoff} from '../tools/living_world_needs.mjs';
import {draftReviewedServiceOpening,draftReviewedServiceStep} from '../tools/meridian_bay_services.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';
import {allEvents,allTranscriptEntries} from '../tools/chapter_history.mjs';

const originals=Object.fromEntries(savePaths('CH-000').map(path=>[
 path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const branch='qa/meridian-phase2-workflow',mara='NPC-007';
const needId='NEED-QA-MARA-MANUAL-ACCOUNTS',caseId='CASE-QA-MARA-MANUAL-ACCOUNTS';
const serviceId='BAY-SVC-BRUMA-ACCOUNTS';
const privateNeed='SYNTHETIC PRIVATE: compare the handwritten sales notes before filing them.';
const privateCase='SYNTHETIC PRIVATE: reconcile the handwritten café sales record.';
const observation=fact=>({kind:'current_turn_observation',observer_actor_id:mara,
 confirmed_by_reviewer:true,fact,
 causal_source:'SYNTHETIC: Mara examines the café paperwork herself during this authorized interval.'});
const eventId=s=>'EV-'+String(s.manifest.last_event_sequence+2).padStart(6,'0');

function fixture(){
 let head='b'.repeat(40),created=0,updates=0,journalWrites=0,entry=null,rejectRef=false;
 const commits=new Map([[head,structuredClone(originals)]]);
 const remote={
  async readHead(){return head},
  async readFiles(sha,paths){
   assert.ok(commits.has(sha),'Read an existing immutable synthetic commit');
   return Object.fromEntries(paths.map(path=>[path,commits.get(sha)[path]]));
  },
  async assertFilesAbsent(sha,paths){return paths.every(path=>!Object.hasOwn(commits.get(sha),path))},
  async createCommit({parentSha,files}){
   assert.equal(parentSha,head);
   const sha=(++created).toString(16).padStart(40,'0');
   commits.set(sha,{...commits.get(parentSha),...structuredClone(files)});
   return sha;
  },
  async updateHead({expectedSha,newSha}){
   if(rejectRef)return false;
   assert.equal(expectedSha,head);head=newSha;updates++;return true;
  }
 };
 const journal={async read(){return structuredClone(entry)},
  async write(_branch,value){entry=structuredClone(value);journalWrites++}};
 return {remote,journal,commits,
  get head(){return head},get counts(){return [created,updates,journalWrites]},
  set rejectRef(value){rejectRef=value},
  async snapshot(){const chapterId=JSON.parse(commits.get(head)['game/SAVE_MANIFEST.json']).chapter_id;
   return readCheckpoint({remote,commitSha:head,chapterId})}
 };
}
function action(snapshot){
 const turn=snapshot.manifest.last_completed_turn+1;
 return {key:'synthetic-city-workflow-'+turn,
  player_text:'SYNTHETIC QA: continue examining the mechanical assembly at the workbench.',
  intent:'A chosen synthetic stationary inspection interval.',
  outcome:'The inspection interval ends without changing the assembly.',
  narration_messages:['SYNTHETIC SCENE '+turn+': Daylight rests along the edge of the workbench.'],
  elapsed_days:0,elapsed_minutes:15,next_time_of_day:'morning'};
}
async function saveNPC(f,snapshot,changes,outcome){
 return saveLivingWorldTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:snapshot.manifest.chapter_id,turn:action(snapshot),npcResolutions:[{
   actor_id:mara,reviewed:true,resolved:true,
   causal_basis:'SYNTHETIC: Mara independently reviews paperwork at her recorded café location.',
   outcome,changes}]});
}
async function savedNPC(f,snapshot,changes,outcome){
 const saved=await saveNPC(f,snapshot,changes,outcome);
 assert.equal(saved.status,'verified',saved.reason);
 assert.deepEqual(saved.narration_messages,action(snapshot).narration_messages);
 return f.snapshot();
}
const needOf=s=>s.state.world.actors[mara].needs.find(n=>n.id===needId);
const caseOf=s=>s.state.world.actors[mara].service_cases.find(c=>c.id===caseId);

test('private café work stays conditional across a chapter and recovers the exact completed result',async()=>{
 const f=fixture(),initial=await f.snapshot();
 const originalMara=structuredClone(initial.state.world.actors[mara]);
 const initialWorldLocations=structuredClone(initial.state.world.locations);
 assert.ok(initial.state.world.locations['LOC-MARKET-NOAH-REPAIR'],
  'Use the already admitted city instead of installing another catalog');
 assert.equal(initial.state.world.actors[mara].location_id,'LOC-CAFE-BRUMA');

 const introduce=draftReviewedNeedIntroduction({state:initial.state,actorId:mara,
  eventId:eventId(initial),reviewed:true,
  observation:observation('SYNTHETIC: Mara finds that handwritten entries still need comparison.'),
  need:{id:needId,domain:'livelihood',summary:privateNeed,priority:'important',
   status:'active',due_day:null,blockers:[],resource_keys:['register']}});
 let current=await savedNPC(f,initial,[introduce],
  'SYNTHETIC: Mara records an outstanding private paperwork concern.');
 const open=draftReviewedServiceOpening({state:current.state,actorId:mara,
  serviceId,caseId,eventId:eventId(current),summary:privateCase,linkedNeedId:needId,
  elapsedMinutes:10,reviewed:true,
  observation:observation('SYNTHETIC: Mara starts comparing the available handwritten sales notes.')});
 current=await savedNPC(f,current,[open],
  'SYNTHETIC: Mara starts an unfinished manual reconciliation case.');
 assert.equal(caseOf(current).status,'open');
 assert.equal(caseOf(current).steps.length,0);
 assert.equal(needOf(current).status,'active');
 assert.deepEqual(current.state.world.actors[mara].resources,originalMara.resources);

 const blockedEvent=eventId(current);
 const obstruction=observation('SYNTHETIC: a duplicate sales slip is absent from the paperwork on the counter.');
 const blockedNeed=draftReviewedNeedTradeoff({state:current.state,actorId:mara,
  needId,eventId:blockedEvent,reviewed:true,observation:obstruction,
  decision:'SYNTHETIC: leave the comparison unresolved while locating the missing slip.',
  foregone:'SYNTHETIC: filing the paperwork immediately would leave an unchecked entry.',
  cost:'SYNTHETIC: the remaining comparison must wait for the supporting record.',
  status:'blocked',blockers:['SYNTHETIC: supporting sales slip not yet located.']});
 const blockedCase=draftReviewedServiceStep({state:current.state,actorId:mara,caseId,
  eventId:blockedEvent,elapsedMinutes:10,reviewed:true,observation:obstruction,
  action:'SYNTHETIC: compare the handwritten entries with the slips currently present.',
  result:'SYNTHETIC: one comparison remains unresolved because its slip is missing.',
  status:'blocked',blockers:['SYNTHETIC: supporting sales slip not yet located.']});
 current=await savedNPC(f,current,[blockedNeed,blockedCase],
  'SYNTHETIC: a missing supporting record interrupts the private paperwork task.');
 assert.equal(needOf(current).status,'blocked');assert.equal(caseOf(current).status,'blocked');
 const beforeReview=JSON.stringify(current);
 const report=inspectLivingWorld({snapshot:current,elapsedMinutes:15,actorIds:[]});
 assert.ok(report.needReview.some(n=>n.needId===needId),
  'A private saved need remains reviewable even with no proximity-selected NPC');
 assert.ok(report.serviceReview.some(c=>c.caseId===caseId),
  'Persisted service work must not disappear from an empty routine selection');
 const visible=JSON.stringify(playerVisibleDiagnostic(report));
 for(const privateText of [needId,caseId,privateNeed,privateCase]){
  assert.ok(!visible.includes(privateText));assert.ok(!current.chapter.includes(privateText));
 }
 assert.equal(JSON.stringify(current),beforeReview,'Diagnostics must not resolve blocked work');
 const beforeLeak=f.counts,headBeforeLeak=f.head;
 const leaked=await saveLivingWorldTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:current.manifest.chapter_id,
  turn:{...action(current),narration_messages:['SYNTHETIC disclosure attempt: '+privateCase]}});
 assert.equal(leaked.status,'blocked');
 assert.match(leaked.reason,/Private.*service.*leaked/i);
 assert.equal(f.head,headBeforeLeak);
 assert.deepEqual(f.counts,beforeLeak,'A private-case leak must fail before journal or story writes');

 const beforeBoundary=structuredClone(current),closedFiles={...current.sourceFiles};
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic café continuity',status:'prepared',
  source_commit:f.head,purpose:'Preserve unresolved private city work across a narrative boundary.',
  time_context:{day:current.state.time.day,period:current.state.time.time_of_day,constraints:[]},
  location_ids:['LOC-CAFE-BRUMA'],npc_ids:[mara],thread_ids:[],hidden_plan_ids:[],
  possible_developments:['The record may be found or the paperwork may remain unresolved.'],
  exit_conditions:['A later synthetic interval reaches a natural pause.']};
 const transition=await saveChapterTransition({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',nextPlan,reviewed:true,
  reason:'SYNTHETIC narrative boundary while private café work remains unresolved.'});
 assert.equal(transition.status,'verified',transition.reason);
 assert.deepEqual(transition.narration_messages,[]);
 current=await f.snapshot();
 assert.equal(current.manifest.chapter_id,'CH-001');
 assert.deepEqual(current.state.world,beforeBoundary.state.world);
 assert.deepEqual(current.state.time,beforeBoundary.state.time);
 assert.equal(current.events.events.length,0);
 for(const path of savePaths('CH-000').slice(0,3))
  assert.equal(f.commits.get(f.head)[path],closedFiles[path]);
 const continued=inspectLivingWorld({snapshot:current,elapsedMinutes:15,actorIds:[]});
 assert.ok(continued.needReview.some(n=>n.needId===needId&&n.status==='blocked'));
 assert.ok(continued.serviceReview.some(c=>c.caseId===caseId&&c.status==='blocked'));

 const finishEvent=eventId(current);
 const found=observation('SYNTHETIC: Mara locates the duplicate slip beneath a tray and compares the missing entry.');
 const resolution='SYNTHETIC: available handwritten entries and supporting slips were compared; the register remains faulty.';
 const resolvedNeed=draftReviewedNeedTradeoff({state:current.state,actorId:mara,needId,
  eventId:finishEvent,reviewed:true,observation:found,
  decision:'SYNTHETIC: finish checking the recovered slip against the handwritten entry.',
  foregone:'SYNTHETIC: defer filing another set of notes until this comparison is checked.',
  cost:'SYNTHETIC: the comparison occupies the current paperwork interval.',
  status:'resolved',blockers:[],resolution});
 const resolvedCase=draftReviewedServiceStep({state:current.state,actorId:mara,caseId,
  eventId:finishEvent,elapsedMinutes:10,reviewed:true,observation:found,
  action:'SYNTHETIC: compare the recovered duplicate slip against the remaining entry.',
  result:'SYNTHETIC: the outstanding manual comparison is complete.',
  status:'resolved',blockers:[],resolution});

 // Persist a detached result, lose the ref update, then recover it literally.
 f.rejectRef=true;
 const blockedSave=await saveNPC(f,current,[resolvedNeed,resolvedCase],
  'SYNTHETIC: Mara completes only the manual paperwork comparison.');
 assert.equal(blockedSave.status,'blocked');assert.ok(blockedSave.commitHead);
 assert.equal(caseOf(await f.snapshot()).status,'blocked',
  'A detached save cannot silently change the authoritative checkpoint');
 const created=f.counts[0];
 const duplicate=await saveNPC(f,current,[resolvedNeed,resolvedCase],
  'SYNTHETIC: the pending save must be recovered instead of restaged.');
 assert.equal(duplicate.status,'blocked');assert.equal(f.counts[0],created);
 f.rejectRef=false;
 const recovered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.equal(recovered.commitHead,blockedSave.commitHead);
 assert.deepEqual(recovered.narration_messages,action(current).narration_messages);
 assert.equal(f.counts[0],created,'Recovery must reuse the detached commit');
 current=await f.snapshot();
 assert.equal(needOf(current).status,'resolved');assert.equal(caseOf(current).status,'resolved');
 assert.equal(caseOf(current).steps.length,2);assert.equal(needOf(current).tradeoffs.length,2);
 assert.deepEqual(current.state.world.actors[mara].resources,originalMara.resources,
  'Paperwork completion does not repair the cash register or invent a transaction');
 assert.deepEqual(current.state.player,initial.state.player);
 assert.deepEqual(current.state.world.locations,initialWorldLocations);
 assert.deepEqual(current.state.world.actors[mara].relationships,originalMara.relationships);
 assert.equal(allEvents(current).length,current.manifest.last_event_sequence);
 assert.equal(allTranscriptEntries(current).length,current.manifest.last_transcript_sequence);
 for(const privateText of [needId,caseId,privateNeed,privateCase,resolution]){
  assert.ok(!current.chapter.includes(privateText));
  assert.ok(!allTranscriptEntries(current).some(entry=>entry.text.includes(privateText)),
   'Private decisions and results never enter the exact visible transcript');
 }
 assert.ok(allEvents(current).some(e=>e.id===finishEvent&&
  e.state_changes.some(c=>c.field==='service_cases'&&c.after.some(x=>x.id===caseId&&x.status==='resolved'))));
 const counts=f.counts;
 const repeat=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(repeat.status,'verified',repeat.reason);
 assert.deepEqual(repeat.narration_messages,recovered.narration_messages);
 assert.deepEqual(f.counts,counts,'Repeated recovery makes no new writes');
 for(const [path,text] of Object.entries(originals))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),text);
});

test('social testimony survives interrupted save, chapter closure and later travel',async()=>{
 const f=fixture(),initial=await f.snapshot(),actors=['NPC-006','NPC-003'];
 const encounter=draftReviewedSocialContact({state:initial.state,interactionId:'SOC-QA-COMPONENTS',
  participantIds:actors,elapsedMinutes:5,reviewed:true,
  observation:{kind:'current_turn_observation',confirmed_by_reviewer:true,
   observer_actor_id:actors[0],fact:'Noah and Darius discuss their previous work at Market Row.',
   causal_source:'A direct conversation heard by the two participants.'},
  outcomes:{[actors[0]]:'Noah describes his experience with local supplies.',
   [actors[1]]:'Darius listens to the account while waiting for his delivery.'},
  knowledgeTransfer:{speaker_id:actors[0],recipient_id:actors[1],
   known_entry:initial.state.world.actors[actors[0]].knowledge[0]},
  relationshipUpdates:[{actorId:actors[1],relation:'local contact',bond:'willing to ask for advice'}]});
 const turn=action(initial);
 f.rejectRef=true;
 const interrupted=await saveLivingWorldTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',turn,npcResolutions:encounter});
 assert.equal(interrupted.status,'blocked');assert.ok(interrupted.commitHead);
 f.rejectRef=false;
 const recovered=await recoverJournaledSave({remote:f.remote,journal:f.journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.equal(recovered.commitHead,interrupted.commitHead);
 assert.deepEqual(recovered.narration_messages,turn.narration_messages);
 const current=await f.snapshot();
 const nextPlan={plan_version:1,chapter_id:'CH-001',title:'Synthetic Market Row continuity',
  status:'prepared',source_commit:f.head,purpose:'Carry a private relationship across chapters.',
  time_context:{day:current.state.time.day,period:current.state.time.time_of_day,constraints:[]},
  location_ids:['LOC-COMMERCIAL-DISTRICT'],npc_ids:actors,thread_ids:[],hidden_plan_ids:[],
  possible_developments:[],exit_conditions:['The next ordinary work interval closes.']};
 const transition=await saveChapterTransition({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-000',nextPlan,reviewed:true,reason:'Synthetic chapter boundary for social recovery.'});
 assert.equal(transition.status,'verified',transition.reason);
 const later=await f.snapshot();
 const moved=await saveLivingWorldTurn({remote:f.remote,journal:f.journal,branch,
  chapterId:'CH-001',turn:action(later),npcResolutions:[{actor_id:actors[1],reviewed:true,
   resolved:true,causal_basis:'Darius continues his delivery after the conversation.',
   outcome:'Darius reaches the collection point in Market Row.',
   changes:[{field:'location_id',before:'LOC-COMMERCIAL-DISTRICT',after:'LOC-MARKET-DELIVERY-POINT',
    travel:{mode:'walking',elapsed_minutes:5,basis:'Short walk to the connected collection point.'}}]}]});
 assert.equal(moved.status,'verified',moved.reason);
 const final=await f.snapshot();
 assert.equal(allEvents(final).filter(e=>e.social_context).length,2);
 assert.equal(final.state.world.actors[actors[1]].relationships[actors[0]].bond,'willing to ask for advice');
 assert.deepEqual(final.state.world.actors[actors[0]].relationships,initial.state.world.actors[actors[0]].relationships);
 assert.deepEqual(final.state.player.knowledge,initial.state.player.knowledge);
});
