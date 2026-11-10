// GitHub REST implementation of the five-file narrative save adapter (D-043).
// No credentials or writes are embedded here: the caller supplies a scoped token.
// Inject fetchImpl to test without any network traffic.
import {savePaths} from './save_transaction.mjs';

function insist(ok,message){if(!ok)throw new Error(message)}
const isSha=value=>typeof value==='string'&&/^[0-9a-f]{40}$/.test(value);
function safeBranch(value){
 insist(typeof value==='string' && /^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(value) &&
  !value.includes('//') && !value.includes('..') && !value.endsWith('/'), 'Invalid GitHub branch');
 return value.split('/').map(encodeURIComponent).join('/');
}
function safeSha(value){
 insist(isSha(value),'Expected a 40-digit Git SHA');
 return value;
}
const normRepo=value=>{
 insist(typeof value==='string'&&/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value),'Expected owner/repo');
 return value;
};
function onlyFiveFiles(files){
 insist(files&&typeof files==='object'&&!Array.isArray(files),'Expected exactly five story files');
 const keys=Object.keys(files);
 const chapters=keys.filter(x=>/^chapters\/CH-\d{3}\.transcript\.json$/.test(x));
 insist(chapters.length===1,'Expected one canonical chapter transcript');
 const chapter=chapters[0].split('/')[1].slice(0,6),expected=savePaths(chapter);
 insist(keys.length===5&&expected.every(p=>typeof files[p]==='string')&&keys.every(k=>expected.includes(k)),
  'Commit requires exactly five complete canonical story files');
 return expected;
}

export function createGitHubSaveAdapter({repository,token,fetchImpl=fetch,apiBase='https://api.github.com'}){
 const repo=normRepo(repository);
 insist(typeof token==='string'&&token.trim().length>0,'Scoped GitHub token required');
 insist(typeof fetchImpl==='function','HTTP fetch implementation required');
 insist(apiBase==='https://api.github.com'||apiBase==='http://mock.github.test',
  'Unexpected GitHub REST host');
 const prefix=apiBase+'/repos/'+repo;
 async function request(method,route,payload){
  const headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
   'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
  const response=await fetchImpl(prefix+route,{method,headers,
   ...(payload===undefined?{}:{body:JSON.stringify(payload)})});
  if(!response?.ok){
   const err=new Error('GitHub REST '+method+' '+route+' failed (HTTP '+response?.status+')');
   err.status=response?.status;throw err;
  }
  return response.json();
 }
 async function readHead(branch){
  const data=await request('GET','/git/ref/heads/'+safeBranch(branch));
  insist(isSha(data?.object?.sha),'GitHub branch ref has no commit SHA');
  return data.object.sha;
 }
 async function readFiles(commitSha,paths){
  const commit=await request('GET','/git/commits/'+safeSha(commitSha));
  const treeSha=safeSha(commit?.tree?.sha);
  const tree=await request('GET','/git/trees/'+treeSha+'?recursive=1');
  insist(tree?.truncated===false&&Array.isArray(tree.tree),'GitHub tree missing or truncated');
  insist(Array.isArray(paths)&&paths.length>0&&new Set(paths).size===paths.length,'Invalid requested files');
  const values=await Promise.all(paths.map(async(path)=>{
   insist(typeof path==='string'&&/^(?:chapters|game)\/[A-Za-z0-9_.\/-]+$/.test(path)&&!path.includes('..'),
    'Invalid file path');
   const blob=tree.tree.find(x=>x.path===path&&x.type==='blob');
   insist(blob&&isSha(blob.sha),'Missing Git tree blob: '+path);
   const result=await request('GET','/git/blobs/'+blob.sha);
   insist(result?.encoding==='base64'&&typeof result.content==='string',
    'GitHub blob is not base64: '+path);
   const bytes=Buffer.from(result.content.replace(/\s/g,''),'base64');
   insist(bytes.toString('base64')===result.content.replace(/\s/g,''),
    'Invalid base64 GitHub blob: '+path);
   return [path,bytes.toString('utf8')];
  }));
  return Object.fromEntries(values);
 }
 async function createCommit({parentSha,files,message}){
  const paths=onlyFiveFiles(files);
  insist(typeof message==='string'&&message.trim()&&message.length<500,
   'A concise commit message is required');
  const parent=await request('GET','/git/commits/'+safeSha(parentSha));
  const parentTree=safeSha(parent?.tree?.sha);
  const tree=await request('POST','/git/trees',{base_tree:parentTree,
   tree:paths.map(path=>({path,mode:'100644',type:'blob',content:files[path]}))});
  const treeSha=safeSha(tree?.sha);
  const commit=await request('POST','/git/commits',{message,tree:treeSha,parents:[parentSha]});
  return safeSha(commit?.sha);
 }
 async function updateHead({branch,expectedSha,newSha}){
  safeBranch(branch);safeSha(expectedSha);safeSha(newSha);
  if(await readHead(branch)!==expectedSha)return false;
  try{
   const response=await request('PATCH','/git/refs/heads/'+safeBranch(branch),{sha:newSha,force:false});
   insist(response?.object?.sha===newSha,'GitHub returned an unexpected ref');
   return true;
  }catch(error){
   if(error.status===409||error.status===422)return false;
   throw error;
  }
 }
 // GitHub REST uses a non-force fast-forward update, preceded by a HEAD read.
 // It has no native compare-and-swap field; this is NOT a universal atomic CAS.
 return {readHead,readFiles,createCommit,updateHead};
}
