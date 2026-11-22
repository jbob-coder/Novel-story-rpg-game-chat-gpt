import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const snapshot=JSON.parse(read('docs/00_start/BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.json'));
const byPr=new Map(snapshot.records.map(row=>[row.pr,row]));
const blob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');

test('lot08 contains exactly 25 dated PR records, not a floating count',()=>{
  assert.equal(snapshot.version,1);
  assert.equal(snapshot.repository,'jbob-coder/Novel-story-rpg-game-chat-gpt');
  assert.equal(snapshot.snapshot_date,'2026-11-22');
  assert.deepEqual(snapshot.snapshot_pr_range,[88,112]);
  assert.deepEqual([...byPr.keys()],Array.from({length:25},(_,i)=>i+88));
  assert.equal(byPr.size,25);
  assert.equal(snapshot.parent_audit_pr,99);
  assert.equal(snapshot.parent_audit_sha,byPr.get(99).head_sha);
  assert.equal(snapshot.baseline_main_sha,'019175c6463ff31807a0f7013d91299add94913c');
  for(const row of snapshot.records){
    assert.match(row.head_sha,/^[0-9a-f]{40}$/,String(row.pr));
    assert.match(row.base_sha,/^[0-9a-f]{40}$/,String(row.pr));
    assert.equal(row.merged_at_snapshot,false,String(row.pr));
    if(row.exclusive_changed_paths){
      assert.equal(new Set(row.exclusive_changed_paths).size,row.exclusive_changed_paths.length,String(row.pr));
      assert.ok(row.exclusive_changed_paths.every(path=>
        !path.startsWith('game/') && !path.startsWith('chapters/') &&
        !path.startsWith('journal/')),String(row.pr));
    }
    if(row.ci_matching_head){
      assert.equal(row.ci_matching_head.head_sha,row.head_sha,String(row.pr));
      assert.equal(row.ci_matching_head.status,'completed',String(row.pr));
      assert.equal(row.ci_matching_head.conclusion,'success',String(row.pr));
      assert.ok(Number.isSafeInteger(row.ci_matching_head.run_id),String(row.pr));
    }
  }
});

test('QA aliases reuse implementation HEAD bytes and are never merged',()=>{
  const pairs=Object.entries(snapshot.qa_mirror_pr_map);
  assert.equal(pairs.length,11);
  const targets=new Set();
  for(const [q,t] of pairs){
    const mirror=byPr.get(Number(q)), origin=byPr.get(Number(t));
    assert.ok(mirror,String(q));
    assert.equal(mirror.category,'qa_only_alias',q);
    assert.equal(mirror.qa_alias_for_pr,Number(t),q);
    assert.equal(mirror.merged_at_snapshot,false,q);
    if(origin) assert.equal(mirror.head_sha,origin.head_sha,q);
    else {
      assert.equal(Number(q),88);
      assert.equal(Number(t),87);
      assert.equal(mirror.head_sha,'3a923dab989c046b186370d2f441ad4a545c6c2f');
    }
    targets.add(Number(t));
  }
  assert.equal(targets.size,11);
  assert.equal(byPr.get(93).state_at_snapshot,'closed');
  assert.equal(byPr.get(93).superseded_by_pr,99);
  assert.equal(byPr.get(99).state_at_snapshot,'open');
});

test('stacked PR base SHA equals recorded exact parent HEAD',()=>{
  const pairs=[[99,92],[96,89],[98,82],[101,94],[103,89],
    [106,101],[108,98],[110,103],[112,103]];
  for(const [child,parent] of pairs){
    const c=byPr.get(child);
    const p=byPr.get(parent);
    if(p){
      assert.equal(c.base_sha,p.head_sha,String(child));
      assert.equal(c.base_branch,p.head_branch,String(child));
    }else{
      assert.equal(child,98);
      assert.equal(parent,82);
      assert.equal(c.base_sha,'53f6dcb77965a62cf896be22cd1d97cef2088761');
    }
  }
  assert.equal(byPr.get(92).base_sha,'5db66f51265dcb86d80f12cd80f4c567f5a4bb4a');
  for(const n of [89,94])
    assert.equal(byPr.get(n).base_sha,'3a923dab989c046b186370d2f441ad4a545c6c2f');
});

test('PR110 and PR112 have distinct conflicting source documentation',()=>{
  const c=snapshot.documented_overlap, a=byPr.get(110),b=byPr.get(112);
  assert.deepEqual(c.prs,[110,112]);
  assert.equal(c.parent_pr,103);
  assert.equal(a.base_sha,b.base_sha);
  assert.equal(a.base_sha,byPr.get(103).head_sha);
  assert.ok(a.exclusive_changed_paths.includes(c.common_path));
  assert.ok(b.exclusive_changed_paths.includes(c.common_path));
  assert.notEqual(c.distinct_blob_sha_by_pr['110'],c.distinct_blob_sha_by_pr['112']);
  for(const sha of Object.values(c.distinct_blob_sha_by_pr))assert.match(sha,/^[0-9a-f]{40}$/);
  assert.equal(c.shared_reported_uncovered_percent.market_to_harbor,69.72);
  assert.equal(c.shared_reported_uncovered_percent.plaza_to_harbor,55.6891);
});

test('the five canonical files are still byte-identical Git blobs',()=>{
  assert.equal(Object.keys(snapshot.protected_blobs).length,5);
  for(const [path,sha] of Object.entries(snapshot.protected_blobs)){
    const b=readFileSync(resolve(root,path));
    assert.equal(blob(b),sha,path);
  }
  assert.equal(JSON.parse(read('game/STATE.json')).pending.type,'await_player_action');
});

test('dated topology artifacts remain present in inventory and indices',()=>{
  const list=[
    'docs/00_start/BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.json',
    'docs/00_start/BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.md',
    'tests/branch_stack_topology_lot08.test.mjs'
  ];
  const inventory=JSON.parse(read('docs/FILE_INVENTORY.json'));
  assert.deepEqual(inventory.supplemental.branch_stack_topology_2026_11_22,list);
  const startIndex=read('docs/00_start/INDEX.md');
  assert.ok(startIndex.includes('BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.json'));
  assert.ok(startIndex.includes('BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.md'));
  assert.ok(read('tests/INDEX.md').includes('branch_stack_topology_lot08.test.mjs'));
});
