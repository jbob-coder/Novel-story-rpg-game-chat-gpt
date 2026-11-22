import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read=p=>readFileSync(resolve(root,p));
const json=p=>JSON.parse(read(p));
const report=json('docs/00_start/BRANCH_FOLLOWUP_LOT_09_2026-11-22.json');
const rows=new Map(report.records.map(r=>[r.pr,r]));
const sha=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');

test('lot09 is a consistent frozen snapshot of exactly PR113–123',()=>{
  assert.equal(report.version,1);
  assert.equal(report.repository,'jbob-coder/Novel-story-rpg-game-chat-gpt');
  assert.equal(report.parent_pr,116);
  assert.equal(report.parent_head_sha,'eb50f8d13bf104a4cee3929d908d8f19e100b218');
  assert.equal(report.baseline_main_sha,'019175c6463ff31807a0f7013d91299add94913c');
  assert.equal(rows.size,11);
  assert.deepEqual([...rows.keys()],Array.from({length:11},(_,i)=>113+i));
  for(const r of report.records){
    assert.match(r.head_sha,/^[0-9a-f]{40}$/,String(r.pr));
    assert.match(r.base_sha,/^[0-9a-f]{40}$/,String(r.pr));
    assert.equal(r.merged_at_snapshot,false,String(r.pr));
    assert.ok(['open','closed'].includes(r.state_at_snapshot),String(r.pr));
  }
});

test('seven QA mirrors are identical HEADs, not independent implementations',()=>{
  const pairs=Object.entries(report.qa_aliases);
  assert.equal(pairs.length,7);
  const sources=new Set(),runIds=new Set();
  for(const [qa,source] of pairs){
    const q=rows.get(Number(qa));
    assert.equal(q.category,'qa_only_alias',qa);
    assert.equal(q.qa_alias_of_pr,Number(source),qa);
    assert.equal(q.merged_at_snapshot,false,qa);
    const parent=rows.get(Number(source));
    if(parent) assert.equal(q.head_sha,parent.head_sha,qa);
    else{
      assert.equal(Number(qa),113);
      assert.equal(Number(source),112);
      assert.equal(q.head_sha,report.source_revision_followup.revised_head);
    }
    sources.add(Number(source));
  }
  assert.equal(sources.size,5);
  assert.equal(report.records.filter(r=>!r.qa_alias_of_pr).length,4);
  for(const r of report.records){
    assert.ok(r.ci_matching_head,String(r.pr));
    assert.equal(r.ci_matching_head.head_sha,r.head_sha,String(r.pr));
    assert.equal(r.ci_matching_head.status,'completed',String(r.pr));
    assert.equal(r.ci_matching_head.conclusion,'success',String(r.pr));
    runIds.add(r.ci_matching_head.run_id);
  }
  assert.equal(runIds.size,5);
});

test('exclusive work diffs keep canonical and journal routes untouched',()=>{
  for(const r of report.records.filter(r=>!r.qa_alias_of_pr)){
    assert.ok(r.draft_at_snapshot,String(r.pr));
    assert.equal(r.state_at_snapshot,'open',String(r.pr));
    assert.ok(r.exclusive_ahead>0,String(r.pr));
    assert.equal(new Set(r.changed_paths).size,r.changed_paths.length,String(r.pr));
    assert.ok(r.changed_paths.every(p=>
      !p.startsWith('game/') && !p.startsWith('chapters/') && !p.startsWith('journal/')),String(r.pr));
  }
});

test('new downstream dependency and older narrative provenance are not conflated',()=>{
  const rev=report.source_revision_followup;
  assert.equal(rev.parent_pr,112);
  assert.notEqual(rev.previous_head_at_lot08,rev.revised_head);
  assert.equal(rev.diff_additions,9);
  assert.equal(rev.diff_deletions,0);
  assert.equal(rev.dependent_pr,122);
  assert.equal(rev.dependent_base_sha,rev.revised_head);
  assert.equal(rows.get(122).base_sha,rev.revised_head);
  assert.equal(rev.dependent_doc_cites_historical_sha,rev.previous_head_at_lot08);
  assert.ok(Number.isInteger(rev.review_comment_id));
  assert.equal(report.observed_sibling_overlap.final_112_head,rev.revised_head);
});

test('independent stacked PR bases are the exact preceding source SHA',()=>{
  assert.equal(rows.get(114).base_sha,'b22e05f1c4738bdcd0d907dc2bae671ac690e711');
  assert.equal(rows.get(116).base_sha,'fa3fe37ca48724f66559cbbc380af1b1a9d0464e');
  assert.equal(rows.get(118).base_sha,'bf2edd9c6e86240c2ef81a4c43d11e4fad49f1c7');
  assert.equal(rows.get(122).base_branch,'work/meridian-harbor-regional-coverage-20261122');
  assert.equal(rows.get(122).base_sha,report.source_revision_followup.revised_head);
});

test('five real canonical Git blobs remain byte identical',()=>{
  assert.equal(Object.keys(report.canonical_blobs).length,5);
  for(const [file,expected] of Object.entries(report.canonical_blobs))
    assert.equal(sha(read(file)),expected,file);
  assert.equal(json('game/STATE.json').pending.type,'await_player_action');
});

test('all lot09 references exist and are indexed without duplicates',()=>{
  const paths=[
    'docs/00_start/BRANCH_FOLLOWUP_LOT_09_2026-11-22.json',
    'docs/00_start/BRANCH_FOLLOWUP_LOT_09_2026-11-22.md',
    'tests/branch_followup_lot09.test.mjs'
  ];
  const inv=json('docs/FILE_INVENTORY.json');
  assert.deepEqual(inv.supplemental.branch_followup_lot09_2026_11_22,paths);
  const all=Object.values(inv.supplemental).flat();
  assert.equal(new Set(all).size,all.length);
  assert.ok(paths.every(x=>existsSync(resolve(root,x))));
  const idx=read('docs/00_start/INDEX.md').toString();
  const tests=read('tests/INDEX.md').toString();
  assert.ok(idx.includes('BRANCH_FOLLOWUP_LOT_09_2026-11-22.json'));
  assert.ok(idx.includes('BRANCH_FOLLOWUP_LOT_09_2026-11-22.md'));
  assert.ok(tests.includes('branch_followup_lot09.test.mjs'));
});
