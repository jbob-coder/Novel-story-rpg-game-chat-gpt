import test from 'node:test';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inv=JSON.parse(readFileSync(resolve(root,'docs/FILE_INVENTORY.json'),'utf8'));
test('every canonical path and index exists',()=>{
 for(const path of [...inv.entrypoints,...inv.indexes,...Object.values(inv.canonical).flat()]){
  assert.ok(existsSync(resolve(root,path)),path+' missing');
 }
});
test('every link in all indexes resolves locally',()=>{
 for(const path of inv.indexes){
  const body=readFileSync(resolve(root,path),'utf8');
  for(const match of body.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)){
   const link=match[1];if(link.startsWith('http'))continue;
   assert.ok(existsSync(resolve(dirname(resolve(root,path)),link)),path+' broken link: '+link);
  }
 }
});
test('chapter mandatory files are indexed',()=>{
 const chapter='CH-000',index=readFileSync(resolve(root,'chapters/CH-000/INDEX.md'),'utf8');
 for(const ext of ['.md','.events.json','.transcript.json'])assert.ok(index.includes(chapter+ext));
});

test('all Git tracked source paths are covered by the single file inventory',()=>{
 // GitHub Actions has a real checkout. Read-only exported copies may have
 // no .git; the existing index/link tests still run in that case.
 if(!existsSync(resolve(root,'.git')))return;
 const tracked=execFileSync('git',['ls-files','--cached','-z'],{
  cwd:root,encoding:'utf8'
 }).split('\0').filter(Boolean).sort();
 const declared=new Set([...inv.entrypoints,...inv.indexes,
  ...Object.values(inv.canonical).flat(),
  ...Object.values(inv.supplemental??{}).flat(),
  ...(inv.repository_checkpoints??[])]);
 assert.deepEqual([...declared].sort(),tracked,
  'Update docs/FILE_INVENTORY.json when adding or deleting tracked files');
});
test('dated full-repository metadata snapshot retains its original immutable source',()=>{
 const snapshot=JSON.parse(readFileSync(resolve(root,
  'docs/00_start/REPOSITORY_FILE_SNAPSHOT_2026-11-17.json'),'utf8'));
 assert.equal(snapshot.immutable_source_commit,
  'ff2fc65d3359830729a97a440a4ec9b341815ec2');
 assert.equal(snapshot.file_count,129);
 assert.equal(snapshot.git_blobs.length,129);
 assert.equal(new Set(snapshot.git_blobs.map(x=>x.path)).size,129);
 assert.ok(snapshot.git_blobs.every(x=>/^[0-9a-f]{40}$/.test(x.blob_sha)&&
  Number.isSafeInteger(x.size_bytes)&&x.size_bytes>=0));
});
