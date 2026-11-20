// Integration of the actual REST save + journal adapters using a shared HTTP
// transport. Every action is synthetic and confined to process memory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGitHubSaveAdapter} from '../tools/github_save_adapter.mjs';
import {createGitHubSaveJournal} from '../tools/github_save_journal.mjs';
import {saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {recoverJournaledSave,savePaths} from '../tools/save_transaction.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const repo='jbob-coder/Novel-story-rpg-game-chat-gpt';
const storyBranch='qa/synthetic-journaled-http-integration';
const journalBranch='journal/qa-synthetic-http-integration';
const BASE='a'.repeat(40),COMMIT='b'.repeat(40);
const TREE='c'.repeat(40),NEWTREE='d'.repeat(40);
const paths=savePaths('CH-000');
const original=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
const literal='[NONCANONICAL QA ONLY]\n\nLa luz de la mesa permanece encendida.\n—¿Aster?';
const turn={
 key:'qa-only-journal-rest-integration-0001',
 player_text:'[NONCANONICAL QA ONLY] Observar el taller.',
 narration_messages:[literal],
 intent:'Synthetic read-only observation of the workshop.',
 outcome:'Synthetic narration only; no new canonical facts.',
 elapsed_days:0,elapsed_minutes:5
};
const respond=(value,status=200)=>({
 ok:status>=200&&status<300,status,async json(){return value}
});
function blobSha(value){
 const body=Buffer.from(value,'utf8');
 return createHash('sha1').update('blob '+body.length+'\0').update(body).digest('hex');
}

function mockGitHub(){
 const saved=new Map([[BASE,{...original}]]);
 const blobs=new Map();
 for(const value of Object.values(original))blobs.set(blobSha(value),value);
 const s={storyHead:BASE,journalEntry:null,commits:0,patches:0,journalWrites:0,
  failPatch:false,failReadback:false,requests:[]};
 async function fetchImpl(url,options){
  const u=new URL(url),method=options.method;
  const route=u.pathname.slice(('/repos/'+repo).length);
  s.requests.push(method+' '+route);
  const journalPath='/contents/.narrative-save-attempts/'+
   Buffer.from(storyBranch,'utf8').toString('base64url')+'.json';
  if(route===journalPath){
   if(method==='GET'){
    assert.equal(u.searchParams.get('ref'),journalBranch);
    return s.journalEntry===null?respond({message:'Not Found'},404):
     respond({sha:s.journalEntry.sha,encoding:'base64',content:s.journalEntry.content});
   }
   if(method==='PUT'){
    const body=JSON.parse(options.body);
    assert.equal(body.branch,journalBranch);
    if(s.journalEntry!==null&&body.sha!==s.journalEntry.sha)
     return respond({message:'Conflict'},409);
    if(s.journalEntry===null&&body.sha!==undefined)
     return respond({message:'Conflict'},409);
    const stored=Buffer.from(body.content,'base64').toString('utf8');
    s.journalEntry={sha:blobSha(stored),content:body.content};
    s.journalWrites++;
    return respond({content:{sha:s.journalEntry.sha}},201);
   }
  }
  if(method==='GET'&&route==='/git/ref/heads/'+storyBranch)
   return respond({object:{sha:s.storyHead}});
  if(method==='GET'&&route.startsWith('/git/commits/')){
   const sha=route.split('/').at(-1);
   if(sha===BASE)return respond({tree:{sha:TREE}});
   if(sha===COMMIT&&saved.has(COMMIT))return respond({tree:{sha:NEWTREE}});
  }
  if(method==='GET'&&route.startsWith('/git/trees/')){
   const tree=route.split('/').at(-1);
   const commit=tree===TREE?BASE:tree===NEWTREE?COMMIT:null;
   if(commit&&saved.has(commit)){
    const entries=paths.map(path=>({path,type:'blob',sha:blobSha(saved.get(commit)[path])}));
    return respond({truncated:false,tree:entries});
   }
  }
  if(method==='GET'&&route.startsWith('/git/blobs/')){
   if(s.failReadback&&s.storyHead===COMMIT)
    return respond({message:'Temporary read outage'},503);
   const value=blobs.get(route.split('/').at(-1));
   if(value!==undefined)
    return respond({encoding:'base64',content:Buffer.from(value,'utf8').toString('base64')});
  }
  if(method==='POST'&&route==='/git/trees'){
   const body=JSON.parse(options.body);
   assert.equal(body.base_tree,TREE);
   assert.deepEqual(body.tree.map(x=>x.path).sort(),[...paths].sort());
   s.staged=Object.fromEntries(body.tree.map(x=>[x.path,x.content]));
   for(const value of Object.values(s.staged))blobs.set(blobSha(value),value);
   return respond({sha:NEWTREE});
  }
  if(method==='POST'&&route==='/git/commits'){
   const body=JSON.parse(options.body);
   assert.equal(body.tree,NEWTREE);
   assert.deepEqual(body.parents,[BASE]);
   saved.set(COMMIT,{...s.staged});
   s.commits++;
   return respond({sha:COMMIT});
  }
  if(method==='PATCH'&&route==='/git/refs/heads/'+storyBranch){
   s.patches++;
   const body=JSON.parse(options.body);
   assert.equal(body.force,false);
   if(s.failPatch)return respond({message:'Non-fast-forward'},422);
   if(s.storyHead!==BASE)return respond({message:'Conflict'},422);
   assert.equal(body.sha,COMMIT);
   s.storyHead=COMMIT;
   return respond({object:{sha:COMMIT}});
  }
  throw Error('Unexpected mock request: '+method+' '+route);
 }
 const client=()=>({
  remote:createGitHubSaveAdapter({repository:repo,token:'synthetic-token',
   fetchImpl,apiBase:'http://mock.github.test'}),
  journal:createGitHubSaveJournal({repository:repo,token:'synthetic-token',
   journalBranch,fetchImpl,apiBase:'http://mock.github.test'})
 });
 return {s,saved,client};
}
const save=({remote,journal})=>saveLivingWorldTurn({
 remote,journal,branch:storyBranch,chapterId:'CH-000',turn,npcResolutions:[]
});

test('combined GitHub REST adapters save and recover literal narration without rewriting',async()=>{
 const host=mockGitHub(),client=host.client();
 const first=await save(client);
 assert.equal(first.status,'verified',first.reason);
 assert.deepEqual(first.narration_messages,[literal]);
 assert.equal(host.s.storyHead,COMMIT);
 assert.equal(host.s.commits,1);
 assert.equal((await client.journal.read(storyBranch)).status,'verified');
 const count=host.s.journalWrites;
 const second=await recoverJournaledSave({...host.client(),branch:storyBranch});
 assert.equal(second.status,'verified',second.reason);
 assert.deepEqual(second.narration_messages,[literal]);
 assert.equal(host.s.commits,1);
 assert.equal(host.s.journalWrites,count,'read-only recovery must not write');
 assert.deepEqual(host.saved.get(BASE),original,'source remains immutable');
 assert.equal(JSON.parse(host.saved.get(COMMIT)['game/SAVE_MANIFEST.json']).last_completed_turn,
  JSON.parse(original['game/SAVE_MANIFEST.json']).last_completed_turn+1);
});

test('interrupted ref update recovers same detached Git commit using persisted journal',async()=>{
 const host=mockGitHub();
 host.s.failPatch=true;
 const interrupted=await save(host.client());
 assert.equal(interrupted.status,'blocked');
 assert.equal(host.s.storyHead,BASE);
 assert.equal(host.s.commits,1);
 const durable=await host.client().journal.read(storyBranch);
 assert.equal(durable.status,'blocked');
 assert.equal(durable.commitHead,COMMIT);
 host.s.failPatch=false;
 const recovery=await recoverJournaledSave({...host.client(),branch:storyBranch});
 assert.equal(recovery.status,'verified',recovery.reason);
 assert.deepEqual(recovery.narration_messages,[literal]);
 assert.equal(host.s.storyHead,COMMIT);
 assert.equal(host.s.commits,1,'recovery never recreates a turn');
 assert.equal((await host.client().journal.read(storyBranch)).status,'verified');
});

test('interrupted readback after ref update resumes without a second authored action',async()=>{
 const host=mockGitHub();
 host.s.failReadback=true;
 const interrupted=await save(host.client());
 assert.equal(interrupted.status,'blocked');
 assert.equal(host.s.storyHead,COMMIT);
 assert.equal(host.s.commits,1);
 host.s.failReadback=false;
 const recovered=await recoverJournaledSave({...host.client(),branch:storyBranch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.deepEqual(recovered.narration_messages,[literal]);
 assert.equal(host.s.commits,1);
 assert.equal(host.s.patches,1,'recovery must not move the already-correct ref');
});

test('blocked durable journal prevents a second turn even after context loss',async()=>{
 const host=mockGitHub();
 host.s.failPatch=true;
 const first=await save(host.client());
 assert.equal(first.status,'blocked');
 const second=await save(host.client());
 assert.equal(second.status,'blocked');
 assert.match(second.reason,/Unresolved durable save attempt/);
 assert.equal(host.s.commits,1);
 assert.equal(host.s.storyHead,BASE);
});
