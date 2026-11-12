import test from 'node:test';
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
