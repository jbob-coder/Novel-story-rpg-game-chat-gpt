// D-042: atomic five-file story saves and conservative crash recovery.
// Pure orchestration: the injected adapter performs remote Git writes and reads.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {chapterFilePaths,allEvents,allTranscriptEntries} from './chapter_history.mjs';
import {stageChapterTransition} from './chapter_management.mjs';
import {REQUIRED_SAVE_FILES,SAVE_PHASES,startSave,recordSaveStage,blockSave,resumeSave,confirmRemoteReadback} from './save_gate.mjs';
const check=(ok,message)=>{if(!ok)throw new Error(message)};
const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const json=value=>JSON.stringify(value,null,2)+'\n';
export function savePaths(chapterId){
 check(typeof chapterId==='string'&&/^CH-\d{3}$/.test(chapterId),'Invalid chapter ID');
 return REQUIRED_SAVE_FILES.map(path=>path.replace('CH-NNN',chapterId));
}
export function decodeFiveFiles(files,chapterId){
 const [transcript,events,chapter,state,manifest]=savePaths(chapterId);
 for(const path of [transcript,events,chapter,state,manifest])
  check(typeof files?.[path]==='string','Missing complete save file: '+path);
 const value={transcript:JSON.parse(files[transcript]),events:JSON.parse(files[events]),
  chapter:files[chapter],state:JSON.parse(files[state]),manifest:JSON.parse(files[manifest]),
  archives:{},sourceFiles:{...files}};
 check(value.manifest.chapter_id===chapterId,'Requested chapter differs from manifest');
 for(const descriptor of value.state.history.completed_chapters??[]){
  const [archivedTranscript,archivedEvents,archivedChapter]=chapterFilePaths(descriptor.id);
  check(descriptor.id!==chapterId&&!Object.hasOwn(value.archives,descriptor.id),'Duplicate archived chapter');
  for(const path of [archivedTranscript,archivedEvents,archivedChapter])
   check(typeof files[path]==='string','Missing closed chapter file: '+path);
  value.archives[descriptor.id]={transcript:JSON.parse(files[archivedTranscript]),
   events:JSON.parse(files[archivedEvents]),chapter:files[archivedChapter],
   files:Object.fromEntries([archivedTranscript,archivedEvents,archivedChapter].map(path=>[path,files[path]]))};
 }
 verifyNarrativeSnapshot(value);
 return value;
}
export function encodeFiveFiles(value){
 verifyNarrativeSnapshot(value);
 const [transcript,events,chapter,state,manifest]=savePaths(value.manifest.chapter_id);
 return {[transcript]:json(value.transcript),[events]:json(value.events),
  [chapter]:value.chapter,[state]:json(value.state),[manifest]:json(value.manifest)};
}
function archivedFiles(snapshot){
 return Object.assign({},...Object.values(snapshot.archives??{}).map(archive=>archive.files));
}
// Every historical file is read at the SAME immutable commit as the active five.
async function readCheckpointFiles(remote,commitSha,chapterId){
 const files=await remote.readFiles(commitSha,savePaths(chapterId));
 check(typeof files?.['game/STATE.json']==='string','Missing complete save file: game/STATE.json');
 const state=JSON.parse(files['game/STATE.json']);
 const descriptors=state.history?.completed_chapters??[];
 check(Array.isArray(descriptors),'Invalid completed chapter index');
 const ids=descriptors.map(x=>x?.id);
 check(new Set(ids).size===ids.length&&!ids.includes(chapterId),'Duplicate archived chapter');
 const paths=ids.flatMap(chapterFilePaths);
 return paths.length?{...files,...await remote.readFiles(commitSha,paths)}:files;
}
export async function readCheckpoint({remote,commitSha,chapterId}){
 check(sha(commitSha),'Invalid checkpoint commit SHA');
 return decodeFiveFiles(await readCheckpointFiles(remote,commitSha,chapterId),chapterId);
}
function assertNextTurn(before,after){
 check(same(before.state.history.completed_chapters,after.state.history.completed_chapters)&&
  same(archivedFiles(before),archivedFiles(after)),'Closed chapter history rewritten');
 check(after.manifest.chapter_id===before.manifest.chapter_id,'Unexpected chapter change');
 check(after.manifest.last_completed_turn===before.manifest.last_completed_turn+1,'Not exactly one new turn');
 check(after.manifest.last_event_sequence>before.manifest.last_event_sequence,'New turn lacks events');
 check(after.transcript.entries.length>before.transcript.entries.length,'New turn lacks transcript');
 check(same(after.transcript.entries.slice(0,before.transcript.entries.length),before.transcript.entries),'Historical transcript rewritten');
 check(same(after.events.events.slice(0,before.events.events.length),before.events.events),'Historical event rewritten');
 check(after.chapter.startsWith(before.chapter),'Historical prose rewritten');
 const oldKeys=before.state.history.completed_turn_keys,newKeys=after.state.history.completed_turn_keys;
 check(same(newKeys.slice(0,oldKeys.length),oldKeys)&&newKeys.length===oldKeys.length+1,'Turn keys rewritten or missing');
 for(const id of [before.state.player.id,...Object.keys(before.state.world.actors)]){
  const old=id===before.state.player.id?before.state.player:before.state.world.actors[id];
  const current=id===before.state.player.id?after.state.player:after.state.world.actors[id];
  check(current&&same(old.progression,current.progression),'Frozen RPG progression changed');
 }
 const turn=after.manifest.last_completed_turn;
 const added=after.transcript.entries.slice(before.transcript.entries.length);
 check(added.filter(x=>x.turn===turn&&x.role==='player').length===1 &&
  added.some(x=>x.turn===turn&&x.kind==='resolution'),'Turn lacks exact player/narrator pair');
}
function blockedResult(attempt,error,expectedFiles,commitHead,sourceHead,branch){
 const reason=String(error?.message??error);
 // The five files may already be verified, while final journal persistence
 // failed. The attempt must remain recoverable and externally unconfirmed.
 // Restore the last durable stage (85%) instead of trying to block a 100%
 // verified state, which save_gate correctly forbids.
 const safeAttempt=attempt?.status==='verified'?{
  ...attempt,status:'saving',percent:85,verified_head:null,
  completed:attempt.completed.filter(x=>x!=='readback'),
  evidence:Object.fromEntries(Object.entries(attempt.evidence).filter(([key])=>key!=='readback'))
 }:attempt;
 return {status:'blocked',reason,attempt:safeAttempt?blockSave(safeAttempt,reason):null,
  expectedFiles,commitHead,sourceHead,branch};
}
async function readExactCommit(remote,commitHead,expectedFiles,chapterId){
 const actual=await readCheckpointFiles(remote,commitHead,chapterId);
 for(const path of savePaths(chapterId))
  check(typeof actual?.[path]==='string'&&actual[path]===expectedFiles[path],
   'Remote bytes differ for: '+path);
 decodeFiveFiles(actual,chapterId);
 return actual;
}
// Adapter contract:
// readHead(branch)->SHA; readFiles(SHA,paths)->{path:exactText};
// createCommit({parentSha,files,message})->SHA, one Git tree with ALL five files;
// updateHead({branch,expectedSha,newSha})->true after expected-head check and
// non-force update; GitHub REST does not offer an atomic compare-and-swap.
function operationOf(attempt){
 const operation=attempt.operation??'turn';
 check(['turn','chapter_transition'].includes(operation),'Unknown save operation');
 return operation;
}
function narrationFor(snapshot,attempt){
 check(snapshot.manifest.chapter_id===attempt.chapter_id&&
  snapshot.manifest.last_completed_turn===attempt.turn,'Save attempt does not identify chapter/turn');
 if(operationOf(attempt)==='chapter_transition'){
  const closed=snapshot.state.history.completed_chapters.at(-1);
  check(closed?.id===attempt.source_chapter_id&&closed.closed_from_commit===attempt.source_head&&
   snapshot.events.events.length===0&&snapshot.transcript.entries.length===0,
   'Transition checkpoint is not an empty next chapter');
  return [];
 }
 check(attempt.source_chapter_id===undefined||attempt.source_chapter_id===attempt.chapter_id,
  'Turn save source chapter differs from destination');
 const narration=snapshot.transcript.entries.filter(x=>x.turn===attempt.turn&&
  x.role==='assistant'&&x.kind==='resolution').map(x=>x.text);
 check(narration.length>0,'Verified turn has no literal narration');
 check(narration.every(text=>snapshot.chapter.includes(text)),
  'Saved chapter lacks literal turn narration');
 return narration;
}
function assertTransition(before,after,chapterId){
 check(after.manifest.chapter_id===chapterId&&chapterId!==before.manifest.chapter_id,
  'Invalid chapter transition target');
 for(const key of ['last_completed_turn','last_event_sequence','last_event_id',
  'last_transcript_sequence','last_transcript_id'])
  check(same(before.manifest[key],after.manifest[key]),'Transition changed global counters');
 for(const key of ['player','world','time','pending','narrative_threads'])
  check(same(before.state[key],after.state[key]),'Transition changed world state: '+key);
 check(same(allEvents(before),allEvents(after))&&same(allTranscriptEntries(before),allTranscriptEntries(after)),
  'Transition rewrote played history');
 check(after.events.events.length===0&&after.transcript.entries.length===0&&after.chapter==='',
  'Transition cannot author a new scene');
 const oldHistory={...before.state.history},newHistory={...after.state.history};
 delete oldHistory.completed_chapters;delete newHistory.completed_chapters;
 check(same(oldHistory,newHistory),'Transition changed nonchapter history');
}
async function saveOperation({remote,branch,chapterId,targetChapterId=chapterId,buildNext,
 journal=null,message='Save narrated turn',operation='turn'}){
 let attempt=null,expectedFiles=null,commitHead=null,sourceHead=null;
 try{
  check(remote&&typeof buildNext==='function'&&typeof branch==='string'&&branch,'Save adapter/branch/builder required');
  check(['turn','chapter_transition'].includes(operation),'Unknown save operation');
  if(operation==='chapter_transition')check(journal!==null,'Durable journal required for chapter transition');
  if(journal!==null){
   check(typeof journal.read==='function'&&typeof journal.write==='function','Durable journal adapter required');
   const previousAttempt=await journal.read(branch);
   check(previousAttempt==null||previousAttempt.status==='verified',
    'Unresolved durable save attempt: recover before a new turn');
  }
  sourceHead=await remote.readHead(branch);
  check(sha(sourceHead),'Invalid remote source HEAD');
  const previous=await readCheckpoint({remote,commitSha:sourceHead,chapterId});
  attempt=startSave({source_head:sourceHead,chapter_id:targetChapterId,
   turn:previous.manifest.last_completed_turn+(operation==='turn'?1:0)});
  attempt.operation=operation;attempt.source_chapter_id=chapterId;
  attempt=recordSaveStage(attempt,'read','Remote HEAD, active five and closed chapters: '+sourceHead);
  verifyNarrativeSnapshot(previous);
  attempt=recordSaveStage(attempt,'validate','Original files form a valid complete checkpoint');
  if(operation==='chapter_transition'){
   check(typeof remote.assertFilesAbsent==='function','Transition adapter must verify destination absence');
   check(await remote.assertFilesAbsent(sourceHead,chapterFilePaths(targetChapterId))===true,
    'Destination chapter already exists');
  }
  const candidate=await buildNext({snapshot:previous,observedHead:sourceHead});
  verifyNarrativeSnapshot(candidate);
  if(operation==='turn')assertNextTurn(previous,candidate);
  else assertTransition(previous,candidate,targetChapterId);
  attempt=recordSaveStage(attempt,'stage',operation==='turn'?
   'Exactly one new turn staged without editing history':'Reviewed chapter transition staged without playing a turn');
  expectedFiles=encodeFiveFiles(candidate);
  decodeFiveFiles({...archivedFiles(candidate),...expectedFiles},targetChapterId);
  attempt=recordSaveStage(attempt,'preflight','Five candidate files and complete literal history verified');
  if(journal!==null) await journal.write(branch,
   blockedResult(attempt,Error('Durable pre-commit save checkpoint'),expectedFiles,null,sourceHead,branch));
  check(await remote.readHead(branch)===sourceHead,'Concurrent branch change before commit');
  commitHead=await remote.createCommit({parentSha:sourceHead,files:expectedFiles,message});
  check(sha(commitHead),'Remote commit SHA missing');
  attempt=recordSaveStage(attempt,'commit','Created five-file commit: '+commitHead);
  if(journal!==null) await journal.write(branch,
   blockedResult(attempt,Error('Durable detached commit checkpoint'),expectedFiles,commitHead,sourceHead,branch));
  check(await remote.updateHead({branch,expectedSha:sourceHead,newSha:commitHead})===true,
   'Protected branch update rejected');
  attempt=recordSaveStage(attempt,'ref','Moved branch with expected source HEAD to '+commitHead);
  if(journal!==null) await journal.write(branch,
   blockedResult(attempt,Error('Durable branch update checkpoint'),expectedFiles,commitHead,sourceHead,branch));
  const fetched=await readExactCommit(remote,commitHead,expectedFiles,targetChapterId);
  const head=await remote.readHead(branch);
  attempt=confirmRemoteReadback(attempt,{branch_head:head,commit_head:commitHead,
   expected_files:expectedFiles,fetched_files:fetched});
  const narration=narrationFor(decodeFiveFiles(fetched,targetChapterId),attempt);
  if(journal!==null) await journal.write(branch,
   {status:'verified',attempt,expectedFiles:null,commitHead,sourceHead,branch});
  return {status:'verified',attempt,expectedFiles,commitHead,sourceHead,branch,operation,
   narration_messages:narration};
 }catch(error){return blockedResult(attempt,error,expectedFiles,commitHead,sourceHead,branch)}
}
export function saveFiveFileTurn(options){return saveOperation({...options,operation:'turn'});}
export function saveChapterTransition({remote,branch,chapterId,nextPlan,reason,reviewed=false,journal=null}={}){
 return saveOperation({remote,branch,chapterId,targetChapterId:nextPlan?.chapter_id,journal,
  operation:'chapter_transition',message:'Save reviewed chapter transition without playing a turn',
  buildNext:({snapshot,observedHead})=>stageChapterTransition({snapshot,nextPlan,reason,reviewed,observedHead})});
}
// No restaging, rewriting or creating a second commit during recovery.
// A missing/unknown SHA or loss of the exact staged text requires investigation.
export async function recoverFiveFileSave({remote,blocked}){
 if(blocked?.status==='verified')return blocked;
 check(blocked?.status==='blocked','No blocked save to recover');
 const {expectedFiles,commitHead,sourceHead,branch}=blocked;
 let attempt=blocked.attempt;
 try{
  check(attempt?.status==='blocked','No durable save attempt evidence');
  check(sha(commitHead)&&expectedFiles&&sha(sourceHead),'Unknown commit or lost exact staged files');
  check(attempt.source_head===sourceHead,'Save attempt source commit identity mismatch');
  const chapterId=attempt.chapter_id;
  savePaths(chapterId);
  operationOf(attempt);
  const head=await remote.readHead(branch);
  check(head===sourceHead||head===commitHead,'Remote branch changed; stop and reconcile');
  attempt=resumeSave(attempt,{observed_head:head,staged_commit_head:commitHead});
  const fetched=await readExactCommit(remote,commitHead,expectedFiles,chapterId);
  // Validate operation identity and literal delivery before making a detached
  // commit authoritative. A corrupt journal must never move the story branch.
  const snapshot=decodeFiveFiles(fetched,chapterId);
  const narration=narrationFor(snapshot,attempt);
  if(head===sourceHead){
   check(attempt.completed.length===5,'Cannot repair unknown commit stage');
   check(await remote.updateHead({branch,expectedSha:sourceHead,newSha:commitHead})===true,
    'Protected branch update rejected');
   attempt=recordSaveStage(attempt,'ref','Recovered branch pointer at '+commitHead);
  }else if(attempt.completed.length===5){
   attempt=recordSaveStage(attempt,'ref','Observed branch already at saved commit');
  }
  check(attempt.completed.length===6,'Recovery lacks commit/ref evidence');
  const verifiedHead=await remote.readHead(branch);
  check(verifiedHead===commitHead,'Remote branch moved during recovery');
  attempt=confirmRemoteReadback(attempt,{branch_head:verifiedHead,commit_head:commitHead,
   expected_files:expectedFiles,fetched_files:fetched});
  return {status:'verified',attempt,expectedFiles,commitHead,sourceHead,branch,
   operation:operationOf(attempt),narration_messages:narration};
 }catch(error){return blockedResult(attempt,error,expectedFiles,commitHead,sourceHead,branch)}
}

// A new chat/session MUST read the independent durable journal before preparing
// a new action. Recovery reuses the exact stored commit and literal text.
// Lost staged files or commit SHA are fail-closed; never fabricate a turn.
export async function recoverJournaledSave({remote,journal,branch}={}){
 let stored=null,verifiedAttempt=null;
 try{
  check(remote&&journal&&typeof journal.read==='function'&&
   typeof journal.write==='function'&&typeof branch==='string'&&branch,'Durable journal required');
  stored=await journal.read(branch);
  check(stored!=null,'No durable save attempt found');
  check(stored.branch===branch,'Journal branch mismatch');
  if(stored.status==='verified'){
   const {attempt,commitHead,sourceHead}=stored;
   check(attempt?.version===1&&attempt.status==='verified'&&attempt.percent===100&&
    same(attempt.completed,SAVE_PHASES.map(x=>x.id))&&
    SAVE_PHASES.every(x=>typeof attempt.evidence?.[x.id]==='string'&&attempt.evidence[x.id].trim()),
    'Verified journal lacks complete save evidence');
   check(sha(commitHead)&&sha(sourceHead)&&attempt.source_head===sourceHead&&
    attempt.verified_head===commitHead,'Verified journal commit identity mismatch');
   check(Number.isSafeInteger(attempt.turn)&&attempt.turn>=1,'Invalid verified journal turn');
   savePaths(attempt.chapter_id);
   operationOf(attempt);
   verifiedAttempt=attempt;
   check(await remote.readHead(branch)===commitHead,'Verified journal disagrees with branch');
   // A completed save does not prove delivery. A fresh session must recover
   // the original text from the immutable commit, never restage the scene.
   const snapshot=await readCheckpoint({remote,commitSha:commitHead,chapterId:attempt.chapter_id});
   check(snapshot.manifest.chapter_id===attempt.chapter_id&&
    snapshot.manifest.last_completed_turn===attempt.turn,
    'Verified journal does not identify the saved chapter/turn');
   const narration=narrationFor(snapshot,attempt);
   check(await remote.readHead(branch)===commitHead,'Remote branch moved during recovery');
   return {status:'verified',attempt,commitHead,sourceHead,branch,
    operation:operationOf(attempt),narration_messages:narration,
    reason:operationOf(attempt)==='chapter_transition'?'Chapter transition recovered; no scene generated':
     'Saved narration recovered; no new turn staged'};
  }
  check(stored.status==='blocked','Unexpected journal state');
  // Never restage/author new prose during recovery.
  const recovered=await recoverFiveFileSave({remote,blocked:stored});
  if(recovered.status==='verified'){
   try{await journal.write(branch,{status:'verified',attempt:recovered.attempt,
    expectedFiles:null,commitHead:recovered.commitHead,sourceHead:recovered.sourceHead,branch});}
   catch(error){return blockedResult(recovered.attempt,Error('Journal confirmation pending: '+error.message),
    recovered.expectedFiles,recovered.commitHead,recovered.sourceHead,branch)}
  }
  return recovered;
 }catch(error){
  // Revalidation failures must not expose narration or mutate the durable
  // verified record. A retry will read the original journal and commit again.
  return blockedResult(verifiedAttempt,error,null,stored?.commitHead??null,
   stored?.sourceHead??null,branch);
 }
}
