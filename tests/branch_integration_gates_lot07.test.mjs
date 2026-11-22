import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const report=JSON.parse(readFileSync(resolve(root,
  'docs/00_start/BRANCH_INTEGRATION_GATES_LOT_07_2026-11-22.json'),'utf8'));
const byPR=new Map(report.pr_records.map(x=>[x.pr,x]));
const gitBlob=bytes=>createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');

test('lot 07 is a frozen six-PR custody review, not an admission or a new turn',()=>{
  assert.equal(report.version,1);
  assert.equal(report.repository,'jbob-coder/Novel-story-rpg-game-chat-gpt');
  assert.equal(report.baseline.sha,'019175c6463ff31807a0f7013d91299add94913c');
  assert.deepEqual([...byPR.keys()],[82,83,84,85,86,87]);
  assert.equal(byPR.size,6);
  assert.ok(report.scope.includes('snapshot'));
  assert.ok(report.scope.includes('not floating'));
  for(const x of report.pr_records){
    assert.equal(x.state_at_review,'open',x.pr);
    assert.equal(x.merged_at_review,false,x.pr);
    assert.equal(x.git_tree_complete,true,x.pr);
    assert.equal(x.canonical_blobs_match_baseline,true,x.pr);
    assert.match(x.head_sha,/^[a-f0-9]{40}$/,x.pr);
    assert.match(x.base_sha,/^[a-f0-9]{40}$/,x.pr);
    assert.equal(x.changed_paths.length,x.changed_file_count,x.pr);
    assert.equal(new Set(x.changed_paths).size,x.changed_file_count,x.pr);
    assert.ok(x.changed_paths.every(p=>!p.startsWith('game/') &&
      !p.startsWith('chapters/') && !p.startsWith('journal/')),x.pr);
    assert.ok(x.gate.length>45,x.pr);
  }
});

test('the five actual canonical Git blobs have not been modified by this audit',()=>{
  assert.equal(Object.keys(report.baseline.canonical_blobs).length,5);
  for(const [p,sha] of Object.entries(report.baseline.canonical_blobs)){
    assert.match(sha,/^[a-f0-9]{40}$/,p);
    assert.equal(gitBlob(readFileSync(resolve(root,p))),sha,p);
  }
  const state=JSON.parse(readFileSync(resolve(root,'game/STATE.json'),'utf8'));
  assert.equal(state.pending.type,'await_player_action');
});

test('CI snapshots are pinned to each reviewed exact HEAD, not just a PR number',()=>{
  const ids=new Set();
  for(const r of report.pr_records){
    assert.ok(Number.isSafeInteger(r.ci.run_id),r.pr);
    assert.ok(!ids.has(r.ci.run_id),r.pr);
    ids.add(r.ci.run_id);
    assert.equal(r.ci.head_sha,r.head_sha,r.pr);
    assert.equal(r.ci.status,'completed',r.pr);
    assert.equal(r.ci.conclusion,'success',r.pr);
    assert.deepEqual(r.ci.steps,[
      'JavaScript unit and integration suites',
      'Python regression suite',
      'Verify canonical saved checkpoint'
    ],r.pr);
  }
  assert.equal(byPR.get(87).ci.head_branch,
    'qa/meridian-three-region-seam-ci-20261120');
  assert.notEqual(byPR.get(87).ci.head_branch,byPR.get(87).head_branch);
});

test('PR 87 is a stacked review that depends on current PR 86 exact SHA',()=>{
  const parent=byPR.get(86),stack=byPR.get(87);
  assert.equal(parent.base_branch,'main');
  assert.equal(stack.base_branch,parent.head_branch);
  assert.equal(stack.base_sha,parent.head_sha);
  assert.equal(stack.head_sha,'3a923dab989c046b186370d2f441ad4a545c6c2f');
  assert.ok(parent.changed_paths.includes('tests/harbor_coast_svg_sync.test.mjs'));
  assert.ok(stack.changed_paths.includes('tests/meridian_bay_three_region_seams.test.mjs'));
});

test('parallel grocery and clinic PRs require shared-index reconciliation',()=>{
  const a=byPR.get(84),b=byPR.get(85);
  assert.equal(a.base_sha,report.baseline.sha);
  assert.equal(b.base_sha,report.baseline.sha);
  const shared=a.changed_paths.filter(p=>b.changed_paths.includes(p)).sort();
  assert.deepEqual(shared,[
    'docs/01_world/INDEX.md',
    'docs/FILE_INVENTORY.json',
    'tests/INDEX.md',
    'tools/INDEX.md'
  ].sort());
  assert.ok(a.changed_paths.includes('tests/meridian_bay_grocery_frontage.test.mjs'));
  assert.ok(b.changed_paths.includes('tests/meridian_bay_clinic_frontage.test.mjs'));
});
