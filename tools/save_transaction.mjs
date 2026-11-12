// D-042: atomic five-file story saves and conservative crash recovery.
// Pure orchestration: the injected adapter performs remote Git writes and reads.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {REQUIRED_SAVE_FILES,startSave,recordSaveStage,blockSave,resumeSave,confirmRemoteReadback} from './save_gate.mjs';
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
  chapter:files[chapter],state:JSON.parse(files[state]),manifest:JSON.parse(files[manifest])};
 verifyNarrativeSnapshot(value);
 return value;
}
export function encodeFiveFiles(value){
 verifyNarrativeSnapshot(value);
 const [transcript,events,chapter,state,manifest]=savePaths(value.manifest.chapter_id);
 return {[transcript]:json(value.transcript),[events]:json(value.events),
  [chapter]:value.chapter,[state]:json(value.state),[manifest]:json(value.manifest)};
}
function assertNextTurn(before,after){
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
 return {status:'blocked',reason,attempt:attempt?blockSave(attempt,reason):null,
  expectedFiles,commitHead,sourceHead,branch};
}
async function readExactCommit(remote,commitHead,expectedFiles,chapterId){
 const actual=await remote.readFiles(commitHead,savePaths(chapterId));
 for(const path of savePaths(chapterId))
  check(typeof actual?.[path]==='string'&&actual[path]===expectedFiles[path],
   'Remote bytes differ for: '+path);
 decodeFiveFiles(actual,chapterId);
 return actual;
}
// Adapter contract:
// readHead(branch)->SHA; readFiles(SHA,paths)->{path:exactText};
// createCommit({parentSha,files,message})->SHA, one Git tree with ALL five files;
// updateHead({branch,expectedSha,newSha})->true only after non-force CAS.
export async function saveFiveFileTurn({remote,branch,chapterId,buildNext,journal=null,message='Save narrated turn'}){
 let attempt=null,expectedFiles=null,commitHead=null,sourceHead=null;
 try{
  check(remote&&typeof buildNext==='function'&&typeof branch==='string'&&branch,'Save adapter/branch/builder required');
  if(journal!==null){
   check(typeof journal.read==='function'&&typeof journal.write==='function','Durable journal adapter required');
   const previousAttempt=await journal.read(branch);
   check(previousAttempt==null||previousAttempt.status==='verified',
    'Unresolved durable save attempt: recover before a new turn');
  }
  sourceHead=await remote.readHead(branch);
  check(sha(sourceHead),'Invalid remote source HEAD');
  const previous=decodeFiveFiles(await remote.readFiles(sourceHead,savePaths(chapterId)),chapterId);
  attempt=startSave({source_head:sourceHead,chapter_id:chapterId,turn:previous.manifest.last_completed_turn+1});
  attempt=recordSaveStage(attempt,'read','Remote HEAD and five original files: '+sourceHead);
  verifyNarrativeSnapshot(previous);
  attempt=recordSaveStage(attempt,'validate','Original five files form a valid checkpoint');
  const candidate=await buildNext({snapshot:previous,observedHead:sourceHead});
  verifyNarrativeSnapshot(candidate);
  assertNextTurn(previous,candidate);
  attempt=recordSaveStage(attempt,'stage','Exactly one new turn staged without editing history');
  expectedFiles=encodeFiveFiles(candidate);
  decodeFiveFiles(expectedFiles,chapterId);
  attempt=recordSaveStage(attempt,'preflight','Five candidate files and literal archive verified');
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
  const head=await remote.readHead(branch);
  const fetched=await readExactCommit(remote,commitHead,expectedFiles,chapterId);
  attempt=confirmRemoteReadback(attempt,{branch_head:head,commit_head:commitHead,
   expected_files:expectedFiles,fetched_files:fetched});
  if(journal!==null) await journal.write(branch,
   {status:'verified',attempt,expectedFiles:null,commitHead,sourceHead,branch});
  return {status:'verified',attempt,expectedFiles,commitHead,sourceHead,branch,
   narration_messages:candidate.transcript.entries.filter(x=>x.turn===candidate.manifest.last_completed_turn&&x.kind==='resolution').map(x=>x.text)};
 }catch(error){return blockedResult(attempt,error,expectedFiles,commitHead,sourceHead,branch)}
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
  const chapterId=attempt.chapter_id;
  decodeFiveFiles(expectedFiles,chapterId);
  const head=await remote.readHead(branch);
  check(head===sourceHead||head===commitHead,'Remote branch changed; stop and reconcile');
  attempt=resumeSave(attempt,{observed_head:head,staged_commit_head:commitHead});
  const fetched=await readExactCommit(remote,commitHead,expectedFiles,chapterId);
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
  const snapshot=decodeFiveFiles(fetched,chapterId);
  return {status:'verified',attempt,expectedFiles,commitHead,sourceHead,branch,
   narration_messages:snapshot.transcript.entries.filter(x=>x.turn===snapshot.manifest.last_completed_turn&&x.kind==='resolution').map(x=>x.text)};
 }catch(error){return blockedResult(attempt,error,expectedFiles,commitHead,sourceHead,branch)}
}

// A new chat/session MUST read the independent durable journal before preparing
// a new action. Recovery reuses the exact stored commit and literal text.
// Lost staged files or commit SHA are fail-closed; never fabricate a turn.
export async function recoverJournaledSave({remote,journal,branch}={}){
 check(remote&&journal&&typeof journal.read==='function'&&
  typeof journal.write==='function'&&typeof branch==='string','Durable journal required');
 const stored=await journal.read(branch);
 check(stored!=null,'No durable save attempt found');
 check(stored.branch===branch,'Journal branch mismatch');
 if(stored.status==='verified'){
  check(sha(stored.commitHead) &&
   await remote.readHead(branch)===stored.commitHead,'Verified journal disagrees with branch');
  return {status:'verified',attempt:stored.attempt,commitHead:stored.commitHead,
   sourceHead:stored.sourceHead,branch,reason:'Already verified; no new turn staged'};
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
}
