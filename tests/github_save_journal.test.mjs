import test from 'node:test';
import assert from 'node:assert/strict';
import {createGitHubSaveJournal} from '../tools/github_save_journal.mjs';
const repo='example/story',branch='work/chat-narrative-foundation',journalBranch='journal/story-save-attempts';
function mock(){
 let entry=null,rev=0;const seen=[];
 const fetchImpl=async(url,options)=>{
  seen.push({url,method:options.method,body:options.body?JSON.parse(options.body):null});
  if(options.method==='GET'){
   return entry===null?{ok:false,status:404}:{
    ok:true,status:200,async json(){return entry}
   };
  }
  const body=JSON.parse(options.body);
  if((entry!==null&&body.sha!==entry.sha)||(entry===null&&body.sha))
   return {ok:false,status:409};
  const newSha=(++rev).toString(16).padStart(40,'0');
  entry={sha:newSha,encoding:'base64',content:body.content};
  return {ok:true,status:201,async json(){return {content:{sha:newSha}}}};
 };
 return {fetchImpl,seen};
}
test('journal creates and reads durable blocked attempt without changing narrative branch',async()=>{
 const m=mock();
 const j=createGitHubSaveJournal({repository:repo,token:'fake-test-token',
  journalBranch,fetchImpl:m.fetchImpl,apiBase:'http://mock.github.test'});
 assert.equal(await j.read(branch),null);
 const data={status:'blocked',branch,sourceHead:'a'.repeat(40),commitHead:'b'.repeat(40),
  expectedFiles:{'chapters/CH-000.md':'fictional text'},attempt:{percent:75}};
 assert.equal(await j.write(branch,data),true);
 assert.deepEqual(await j.read(branch),data);
 assert.ok(m.seen.every(x=>x.url.includes('.narrative-save-attempts/')));
 assert.equal(m.seen.filter(x=>x.method==='PUT').length,1);
 assert.ok(m.seen.filter(x=>x.method==='PUT').every(x=>x.body.branch===journalBranch));
});
test('journal status can be verified and clears staged payload after save confirmation',async()=>{
 const m=mock(),j=createGitHubSaveJournal({repository:repo,token:'token',
  journalBranch,fetchImpl:m.fetchImpl,apiBase:'http://mock.github.test'});
 await j.write(branch,{status:'blocked',branch,expectedFiles:{a:'b'}});
 await j.write(branch,{status:'verified',branch,commitHead:'b'.repeat(40),expectedFiles:null});
 const x=await j.read(branch);
 assert.equal(x.status,'verified');assert.equal(x.expectedFiles,null);
 assert.equal(m.seen.filter(x=>x.method==='PUT').length,2);
});
test('journal rejects wrong branch and never puts narrative branch as journal',async()=>{
 const m=mock();
 assert.throws(()=>createGitHubSaveJournal({repository:repo,token:'token',
  journalBranch:'work/chat-narrative-foundation',fetchImpl:m.fetchImpl,apiBase:'http://mock.github.test'}),
  /separate journal/);
 const j=createGitHubSaveJournal({repository:repo,token:'token',
  journalBranch,fetchImpl:m.fetchImpl,apiBase:'http://mock.github.test'});
 await assert.rejects(()=>j.write(branch,{status:'blocked',branch:'other-branch'}),/Attempt\/branch mismatch/);
 assert.equal(m.seen.length,0);
});
test('journal remote errors fail closed',async()=>{
 const j=createGitHubSaveJournal({repository:repo,token:'token',journalBranch,
  apiBase:'http://mock.github.test',fetchImpl:async()=>({ok:false,status:500})});
 await assert.rejects(()=>j.read(branch),/HTTP 500/);
});
