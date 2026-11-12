// Persistent crash-recovery ledger in an independent GitHub branch.
// This is not a narration engine. The caller creates a dedicated journal branch,
// supplies a scoped token externally and never passes this branch as story canon.
const insist=(ok,message)=>{if(!ok)throw Error(message)};
const validBranch=s=>typeof s==='string'&&/^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(s)&&
 !s.includes('..')&&!s.includes('//')&&!s.endsWith('/');
const validRepo=s=>typeof s==='string'&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(s);
const isSha=s=>typeof s==='string'&&/^[0-9a-f]{40}$/.test(s);
const prefixFor=branch=>'.narrative-save-attempts/'+Buffer.from(branch,'utf8').toString('base64url')+'.json';
export function createGitHubSaveJournal({repository,token,journalBranch,fetchImpl=fetch,
 apiBase='https://api.github.com'}={}){
 insist(validRepo(repository),'Invalid repository');
 insist(validBranch(journalBranch)&&journalBranch.startsWith('journal/'),
  'A separate journal/* branch is required');
 insist(typeof token==='string'&&token.trim(),'Scoped GitHub token required');
 insist(typeof fetchImpl==='function','HTTP implementation required');
 insist(['https://api.github.com','http://mock.github.test'].includes(apiBase),'Invalid API endpoint');
 const base=apiBase+'/repos/'+repository+'/contents/';
 const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
  'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
 async function request(method,branch,payload){
  insist(validBranch(branch)&&branch!==journalBranch,'Invalid story branch');
  const path=prefixFor(branch);
  const url=base+path+(method==='GET'?'?ref='+encodeURIComponent(journalBranch):'');
  const response=await fetchImpl(url,{method,headers,
   ...(payload?{body:JSON.stringify(payload)}:{})});
  if(method==='GET'&&response?.status===404)return null;
  if(!response?.ok)throw Error('GitHub journal '+method+' failed (HTTP '+response?.status+')');
  return response.json();
 }
 async function readRaw(branch){
  const entry=await request('GET',branch);
  if(entry==null)return {sha:null,value:null};
  insist(isSha(entry.sha)&&entry.encoding==='base64'&&typeof entry.content==='string',
   'Malformed GitHub journal contents');
  const text=Buffer.from(entry.content.replace(/\s/g,''),'base64').toString('utf8');
  const value=JSON.parse(text);
  insist(value?.branch===branch&&['blocked','verified'].includes(value.status),
   'Journal identity/status mismatch');
  return {sha:entry.sha,value};
 }
 return {
  async read(branch){return (await readRaw(branch)).value},
  async write(branch,value){
   insist(value&&value.branch===branch&&['blocked','verified'].includes(value.status),
    'Attempt/branch mismatch');
   const {sha}=await readRaw(branch);
   const path=prefixFor(branch);
   const payload={message:'chore: checkpoint narrative save attempt',
    branch:journalBranch,content:Buffer.from(JSON.stringify(value),'utf8').toString('base64'),
    ...(sha?{sha}:{})};
   const result=await request('PUT',branch,payload);
   insist(isSha(result?.content?.sha),'GitHub did not acknowledge journal write');
   return true;
  }
 };
}
