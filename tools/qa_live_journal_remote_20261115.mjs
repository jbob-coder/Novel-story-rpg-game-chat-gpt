// One-shot remote QA: invoke the real Node save and journal adapters against
// GitHub using Actions' ephemeral token. NEVER run against the playable branch.
// Invoked only by a restricted push workflow on the dedicated QA trigger branch.
import assert from 'node:assert/strict';
import {createGitHubSaveAdapter} from './github_save_adapter.mjs';
import {createGitHubSaveJournal} from './github_save_journal.mjs';
import {saveLivingWorldTurn} from './living_world_coordinator.mjs';
import {recoverJournaledSave,savePaths} from './save_transaction.mjs';

const repository='jbob-coder/Novel-story-rpg-game-chat-gpt';
const trigger='qa/trigger-live-journal-20261115';
const sourceCommit='2be0ffc5c4f65fff16472bb4665b8b25f10fa257';
const token=process.env.GITHUB_TOKEN;
assert.equal(process.env.GITHUB_REPOSITORY,repository,'Wrong GitHub repository');
assert.equal(process.env.GITHUB_REF,'refs/heads/'+trigger,'Run only from isolated trigger branch');
assert.match(token??'',/^\S+$/,'GitHub Actions token is required');
assert.match(process.env.GITHUB_RUN_ID??'',/^[0-9]+$/,'A GitHub run ID is required');
const id=process.env.GITHUB_RUN_ID;
const storyBranch='qa/live-journal-runtime-'+id;
const journalBranch='journal/qa-live-journal-runtime-'+id;
const api='https://api.github.com/repos/'+repository;
const headers={
 Accept:'application/vnd.github+json',
 Authorization:'Bearer '+token,
 'X-GitHub-Api-Version':'2022-11-28',
 'Content-Type':'application/json'
};
async function apiRequest(method,route,payload){
 const response=await fetch(api+route,{method,headers,
  ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
 if(!response.ok)
  throw Error('GitHub QA API '+method+' '+route+' returned HTTP '+response.status);
 return response.json();
}
async function createBranch(name,sha){
 assert.match(sha,/^[0-9a-f]{40}$/);
 return apiRequest('POST','/git/refs',{ref:'refs/heads/'+name,sha});
}
async function journalSourceHead(){
 const data=await apiRequest('GET','/git/ref/heads/journal/living-world-save-attempts');
 const value=data.object?.sha;
 assert.match(value??'',/^[0-9a-f]{40}$/);
 return value;
}

const prose='[NONCANONICAL LIVE QA]\n\nLa luz del taller permanece encendida. Aster no se mueve.';
const turn={
 key:'qa-live-runtime-'+id,
 player_text:'[NONCANONICAL LIVE QA] Comprobar la mesa sin tocar ningún mecanismo.',
 narration_messages:[prose],
 intent:'Noncanonical observation for QA only.',
 outcome:'Noncanonical turn for transport and recovery validation.',
 elapsed_days:0,elapsed_minutes:5
};
// The only mutation of a story branch is on this fresh, run-specific QA branch.
await createBranch(storyBranch,sourceCommit);
await createBranch(journalBranch,await journalSourceHead());
const config={repository,token};
let injected=0;
const failedPatchFetch=(url,options)=>{
 if(options.method==='PATCH'&&new URL(url).pathname.endsWith('/git/refs/heads/'+storyBranch)
    &&injected++===0){
  return Promise.resolve({ok:false,status:422,async json(){
   return {message:'Intentionally interrupted QA ref update'};
  }});
 }
 return fetch(url,options);
};
const firstRemote=createGitHubSaveAdapter({...config,fetchImpl:failedPatchFetch});
const firstJournal=createGitHubSaveJournal({...config,journalBranch});
assert.equal(await firstJournal.read(storyBranch),null,'QA journal must be fresh');
const startFiles=await firstRemote.readFiles(sourceCommit,savePaths('CH-000'));
assert.equal(JSON.parse(startFiles['game/SAVE_MANIFEST.json']).last_completed_turn,9,
 'Expected source turn-9 fixture');
const interrupted=await saveLivingWorldTurn({
 remote:firstRemote,journal:firstJournal,branch:storyBranch,
 chapterId:'CH-000',turn,npcResolutions:[]
});
assert.equal(interrupted.status,'blocked',interrupted.reason);
assert.equal(interrupted.attempt?.percent,75,'Ref update should be the only interrupted step');
assert.equal(injected,1,'Interruption must occur exactly once');
assert.match(interrupted.commitHead??'',/^[0-9a-f]{40}$/);
const stored=await firstJournal.read(storyBranch);
assert.equal(stored.status,'blocked');
assert.equal(stored.commitHead,interrupted.commitHead);
assert.equal(await firstRemote.readHead(storyBranch),sourceCommit);
assert.deepEqual(stored.expectedFiles,interrupted.expectedFiles);
// Simulate a separate ChatGPT/runtime session: recreate both adapters from
// durable GitHub data and discard the candidate generator and prior result.
const recoveredRemote=createGitHubSaveAdapter(config);
const recoveredJournal=createGitHubSaveJournal({...config,journalBranch});
const recovered=await recoverJournaledSave({
 remote:recoveredRemote,journal:recoveredJournal,branch:storyBranch
});
assert.equal(recovered.status,'verified',recovered.reason);
assert.deepEqual(recovered.narration_messages,[prose]);
assert.equal(recovered.commitHead,interrupted.commitHead,'Do not make a second commit');
assert.equal(await recoveredRemote.readHead(storyBranch),recovered.commitHead);
const actual=await recoveredRemote.readFiles(recovered.commitHead,savePaths('CH-000'));
for(const [path,value] of Object.entries(interrupted.expectedFiles))
 assert.equal(actual[path],value,'Exact remote readback failed for '+path);
const saved=JSON.parse(actual['game/SAVE_MANIFEST.json']);
assert.equal(saved.last_completed_turn,10,'Only QA may advance a synthetic turn');
assert.equal(saved.last_event_id,'EV-000030');
assert.equal(saved.last_transcript_id,'TXT-000022');
const durable=await recoveredJournal.read(storyBranch);
assert.equal(durable.status,'verified');
assert.equal(durable.commitHead,recovered.commitHead);
assert.equal(durable.expectedFiles,null);
const gitCommit=await apiRequest('GET','/git/commits/'+recovered.commitHead);
assert.equal(gitCommit.parents?.length,1);
assert.equal(gitCommit.parents[0].sha,sourceCommit);
const literal=await recoverJournaledSave({remote:recoveredRemote,journal:recoveredJournal,branch:storyBranch});
assert.equal(literal.status,'verified');
assert.deepEqual(literal.narration_messages,[prose]);
console.log(JSON.stringify({
 status:'PASS',scope:'ISOLATED NONCANONICAL QA',storyBranch,journalBranch,
 sourceCommit,commit:recovered.commitHead,
 interruptedStage:interrupted.attempt.percent,verifiedPercent:recovered.attempt.percent,
 exactFiveFileReadback:true,literalRecovery:true,canonicalStoryWrites:0
}));
