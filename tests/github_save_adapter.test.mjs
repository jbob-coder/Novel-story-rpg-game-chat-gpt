import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createGitHubSaveAdapter} from '../tools/github_save_adapter.mjs';
import {savePaths,saveFiveFileTurn,recoverFiveFileSave} from '../tools/save_transaction.mjs';
import {stageNarrativeTurn} from '../tools/turn_engine.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const BASE='a'.repeat(40),COMMIT='b'.repeat(40),TREE='c'.repeat(40),NEWTREE='d'.repeat(40);
const branch='qa/test-save',paths=savePaths('CH-000');
const original=Object.fromEntries(paths.map(path=>[path,readFileSync(resolve(root,path),'utf8')]));
function response(data,status=200){return {ok:status>=200&&status<300,status,json:async()=>data};}
function mockGitApi(){
 const oldBlobs=Object.fromEntries(paths.map((path,i)=>[String(i+1).repeat(40),original[path]]));
 const testBlobSha=i=>['6','7','8','9','a'][i].repeat(40);
 const state={head:BASE,files:{...original},createdFiles:null,requests:[],patches:0,commits:0,
  rejectPatch:false,conflict:false,failReadback:false};
 const fetchImpl=async(url,opts)=>{
  const u=new URL(url),method=opts.method,route=u.pathname.slice('/repos/jbob-coder/Novel-story-rpg-game-chat-gpt'.length);
  state.requests.push(method+' '+route);
  if(method==='GET'&&route==='/git/ref/heads/'+branch)
   return response({object:{sha:state.head}});
  if(method==='GET'&&route.startsWith('/git/commits/')){
   const id=route.split('/').at(-1);
   if(id===BASE)return response({tree:{sha:TREE}});
   if(id===COMMIT)return response({tree:{sha:NEWTREE}});
  }
  if(method==='GET'&&route.startsWith('/git/trees/')){
   const id=route.split('/').at(-1),source=id===TREE?oldBlobs:
    id===NEWTREE?Object.fromEntries(paths.map((path,i)=>[testBlobSha(i),state.createdFiles[path]])):null;
   if(source){
    const items=paths.map((path,i)=>({path,type:'blob',sha:id===TREE?String(i+1).repeat(40):testBlobSha(i)}));
    return response({truncated:false,tree:items});
   }
  }
  if(method==='GET'&&route.startsWith('/git/blobs/')){
   if(state.failReadback&&state.head===COMMIT)return response({message:'offline'},503);
   const id=route.split('/').at(-1),v=oldBlobs[id]??(state.createdFiles&&
    Object.fromEntries(paths.map((path,i)=>[testBlobSha(i),state.createdFiles[path]]))[id]);
   if(typeof v==='string')return response({encoding:'base64',content:Buffer.from(v).toString('base64')});
  }
  if(method==='POST'&&route==='/git/trees'){
   const body=JSON.parse(opts.body);
   assert.equal(body.base_tree,TREE);assert.equal(body.tree.length,5);
   state.createdFiles=Object.fromEntries(body.tree.map(e=>[e.path,e.content]));
   return response({sha:NEWTREE});
  }
  if(method==='POST'&&route==='/git/commits'){
   const body=JSON.parse(opts.body);
   assert.equal(body.tree,NEWTREE);assert.deepEqual(body.parents,[BASE]);
   state.commits++;return response({sha:COMMIT});
  }
  if(method==='PATCH'&&route==='/git/refs/heads/'+branch){
   state.patches++;assert.equal(JSON.parse(opts.body).force,false);
   if(state.rejectPatch)return response({message:'branch rejected'},422);
   if(state.conflict){state.head='e'.repeat(40);return response({message:'non fast forward'},422);}
   state.head=JSON.parse(opts.body).sha;return response({object:{sha:state.head}});
  }
  throw Error('Unexpected mocked GitHub endpoint '+method+' '+route);
 };
 const remote=createGitHubSaveAdapter({repository:'jbob-coder/Novel-story-rpg-game-chat-gpt',
  token:'test-only-not-a-secret',fetchImpl,apiBase:'http://mock.github.test'});
 return {remote,state};
}
test('GitHub REST adapter reads exact historical files',async()=>{
 const {remote,state}=mockGitApi();
 assert.equal(await remote.readHead(branch),BASE);
 const fetched=await remote.readFiles(BASE,paths);
 assert.deepEqual(fetched,original);
 assert.equal(state.commits,0);
});
test('adapter writes one five-file Git tree and moves ref without force',async()=>{
 const {remote,state}=mockGitApi();
 const changed={...original,'chapters/CH-000.md':original['chapters/CH-000.md']+'\n\nQA only'};
 assert.equal(await remote.createCommit({parentSha:BASE,files:changed,message:'A test commit'}),COMMIT);
 assert.equal(await remote.updateHead({branch,expectedSha:BASE,newSha:COMMIT}),true);
 assert.equal(state.head,COMMIT);assert.equal(state.patches,1);
 assert.deepEqual(await remote.readFiles(COMMIT,paths),changed);
});
test('non-matching expected head rejects without PATCH',async()=>{
 const {remote,state}=mockGitApi();state.head='e'.repeat(40);
 assert.equal(await remote.updateHead({branch,expectedSha:BASE,newSha:COMMIT}),false);
 assert.equal(state.patches,0);assert.equal(state.head,'e'.repeat(40));
});
test('GitHub 422 non-fast-forward update does not overwrite another writer',async()=>{
 const {remote,state}=mockGitApi();state.conflict=true;
 assert.equal(await remote.updateHead({branch,expectedSha:BASE,newSha:COMMIT}),false);
 assert.equal(state.patches,1);assert.equal(state.head,'e'.repeat(40));
});
test('commit with missing or extra story files cannot be sent',async()=>{
 const {remote,state}=mockGitApi();
 const partial={...original};delete partial['game/STATE.json'];
 await assert.rejects(()=>remote.createCommit({parentSha:BASE,files:partial,message:'Incomplete'}),/five complete/);
 await assert.rejects(()=>remote.createCommit({parentSha:BASE,files:{...original,extra:'hi'},message:'Extra'}),/five complete/);
 assert.equal(state.commits,0);
});
test('adapter refuses absent credentials and invalid repository names',()=>{
 assert.throws(()=>createGitHubSaveAdapter({repository:'jbob-coder/repo',token:''}),/token/);
 assert.throws(()=>createGitHubSaveAdapter({repository:'../repo',token:'x'}),/owner\/repo/);
});
const prose='[QA D-043 NO CANON]\\n\\nEl taller sigue en silencio.';
function builder({snapshot,observedHead}){
 return stageNarrativeTurn(snapshot,{key:'github-adapter-qa-synthetic-007',save_guard:{observed_head:observedHead,previous_attempt:null},
  player_text:'[QA D-043] Entrada ficticia de prueba',narration_messages:[prose],intent:'QA ficticio',
  outcome:'Evento ficticio para verificar guardado.',elapsed_days:0,offscreen:[]});
}
test('real orchestrator works through HTTP adapter and preserves literal response',async()=>{
 const {remote,state}=mockGitApi();
 const saved=await saveFiveFileTurn({remote,branch,chapterId:'CH-000',buildNext:builder,message:'QA save'});
 assert.equal(saved.status,'verified',saved.reason);
 assert.equal(saved.attempt.percent,100);assert.equal(state.head,COMMIT);
 assert.deepEqual(saved.narration_messages,[prose]);assert.equal(state.commits,1);
 const replay=await recoverFiveFileSave({remote,blocked:saved});
 assert.equal(replay.status,'verified');assert.equal(state.commits,1);
});
test('HTTP readback interruption recovers without generating a second commit',async()=>{
 const {remote,state}=mockGitApi();state.failReadback=true;
 const saved=await saveFiveFileTurn({remote,branch,chapterId:'CH-000',buildNext:builder,message:'QA interrupted'});
 assert.equal(saved.status,'blocked');assert.equal(saved.attempt.percent,85);
 state.failReadback=false;
 const restored=await recoverFiveFileSave({remote,blocked:saved});
 assert.equal(restored.status,'verified',restored.reason);
 assert.equal(state.commits,1);assert.deepEqual(restored.narration_messages,[prose]);
});

function absenceAdapter(treeResult={truncated:false,tree:[]},commitResult={tree:{sha:TREE}}){
 const requests=[];
 const remote=createGitHubSaveAdapter({repository:'jbob-coder/Novel-story-rpg-game-chat-gpt',
  token:'test-only-not-a-secret',apiBase:'http://mock.github.test',
  fetchImpl:async(url,options)=>{
   requests.push({url,method:options.method});
   assert.equal(options.method,'GET');
   if(url.endsWith('/git/commits/'+BASE))return response(commitResult);
   if(url.endsWith('/git/trees/'+TREE+'?recursive=1'))return response(treeResult);
   throw Error('Unexpected absence check request: '+url);
  }});
 return {remote,requests};
}
const nextChapterPaths=savePaths('CH-001').filter(path=>path.startsWith('chapters/'));
test('chapter destination absence is verified against one immutable commit tree',async()=>{
 const {remote,requests}=absenceAdapter({truncated:false,tree:[
  {path:'chapters',type:'tree',sha:TREE},{path:'chapters/CH-000.md',type:'blob',sha:BASE}
 ]});
 assert.equal(await remote.assertFilesAbsent(BASE,nextChapterPaths),true);
 assert.equal(requests.length,2);
 assert.ok(requests[0].url.endsWith(BASE));
});
for(const type of ['blob','tree','commit'])test('existing '+type+' blocks a chapter destination',async()=>{
 const {remote}=absenceAdapter({truncated:false,tree:[{path:nextChapterPaths[0],type,sha:BASE}]});
 await assert.rejects(()=>remote.assertFilesAbsent(BASE,nextChapterPaths),/already exists/);
});
test('a file in the destination ancestor blocks chapter creation',async()=>{
 const {remote}=absenceAdapter({truncated:false,tree:[{path:'chapters',type:'blob',sha:BASE}]});
 await assert.rejects(()=>remote.assertFilesAbsent(BASE,nextChapterPaths),/already exists/);
});
for(const tree of [{truncated:true,tree:[]},{tree:[]},{truncated:false}])
 test('incomplete tree cannot prove chapter destination absence '+JSON.stringify(tree),async()=>{
  const {remote}=absenceAdapter(tree);
  await assert.rejects(()=>remote.assertFilesAbsent(BASE,nextChapterPaths),/missing or truncated/);
 });
test('malformed commit tree SHA cannot prove absence',async()=>{
 const {remote}=absenceAdapter(undefined,{tree:{sha:'bad'}});
 await assert.rejects(()=>remote.assertFilesAbsent(BASE,nextChapterPaths),/40-digit Git SHA/);
});
test('invalid absence requests fail before any HTTP call',async()=>{
 const {remote,requests}=absenceAdapter();
 for(const paths of [[],['chapters/../CH-001.md'],['/chapters/CH-001.md'],
  ['other/CH-001.md'],['chapters//CH-001.md'],['chapters/./CH-001.md'],
  ['chapters/CH-001/'],['chapters/CH-001.md','chapters/CH-001.md'],[null]])
  await assert.rejects(()=>remote.assertFilesAbsent(BASE,paths),/Invalid/);
 await assert.rejects(()=>remote.assertFilesAbsent('bad',nextChapterPaths),/40-digit/);
 assert.equal(requests.length,0);
});
