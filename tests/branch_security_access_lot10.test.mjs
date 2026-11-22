import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bytes=p=>readFileSync(resolve(root,p));
const str=p=>bytes(p).toString('utf8');
const data=JSON.parse(str('docs/00_start/BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.json'));
const byPR=new Map(data.records.map(r=>[r.pr,r]));
const blob=b=>createHash('sha1')
  .update(Buffer.from('blob '+b.length+'\\0')).update(b).digest('hex');

test('lot10 is exactly six frozen records and three independent review heads',()=>{
  assert.equal(data.version,1);
  assert.equal(data.repository,'jbob-coder/Novel-story-rpg-game-chat-gpt');
  assert.equal(data.date,'2026-11-22');
  assert.equal(data.parent_pr,124);
  assert.equal(data.parent_sha,'4f76f51becbd7af8ebe6c281d0e85dbfca3bfaf6');
  assert.equal(data.baseline_main_sha,'019175c6463ff31807a0f7013d91299add94913c');
  assert.deepEqual([...byPR.keys()],[126,127,128,129,130,131]);
  assert.equal(byPR.size,6);
  assert.equal(data.records.filter(r=>r.classification==='review_work').length,3);
  for(const r of data.records){
    assert.match(r.head_sha,/^[a-f0-9]{40}$/,r.pr);
    assert.match(r.base_sha,/^[a-f0-9]{40}$/,r.pr);
    assert.equal(r.merged_at_review,false,r.pr);
    assert.equal(r.draft_at_review,true,r.pr);
  }
});

test('QA PR aliases match source HEAD exactly; evidence counted once per SHA',()=>{
  assert.deepEqual(data.qa_aliases,{'128':126,'129':127,'131':130});
  const runIds=new Set(),heads=new Set();
  for(const r of data.records){
    const c=r.ci_exact_head;
    assert.ok(c,r.pr);
    assert.equal(c.head_sha,r.head_sha,r.pr);
    assert.equal(c.status,'completed',r.pr);
    assert.equal(c.conclusion,'success',r.pr);
    assert.ok(Number.isSafeInteger(c.run_id),r.pr);
    runIds.add(c.run_id);
    heads.add(r.head_sha);
  }
  assert.equal(runIds.size,3);
  assert.equal(heads.size,3);
  for(const [alias,source] of Object.entries(data.qa_aliases)){
    const q=byPR.get(Number(alias)),p=byPR.get(source);
    assert.equal(q.qa_mirror_of,source);
    assert.equal(q.classification,'qa_only_same_sha');
    assert.equal(q.head_sha,p.head_sha);
    assert.equal(q.ci_exact_head.run_id,p.ci_exact_head.run_id);
    assert.equal(q.base_branch,'main');
  }
});

test('each review PR has exact parent SHA and no story/journal file changes',()=>{
  const parents={
    126:['work/meridian-harbor-section04-study-validated-20261122','1daa0e8de0859bbab03361342908a265d309b86a'],
    127:['work/npc-social-provenance-chapter-20261122','414896744036731949aab7ee2a687d29efb80f9a'],
    130:['audit/plaza-harbor-crossstack-coverage-20261122','26560ccc1fb859cc7372967b54d7354c854fc92a']
  };
  for(const [id,[base,sha]] of Object.entries(parents)){
    const r=byPR.get(Number(id));
    assert.equal(r.base_branch,base,id);
    assert.equal(r.base_sha,sha,id);
    assert.equal(r.state_at_review,'open',id);
    assert.ok(r.exclusive_ahead>0,id);
    assert.equal(r.exclusive_behind,0,id);
    assert.ok(r.exclusive_changed_paths.length>=7,id);
    assert.equal(new Set(r.exclusive_changed_paths).size,r.exclusive_changed_paths.length,id);
    assert.ok(r.exclusive_changed_paths.every(p=>
      !p.startsWith('game/')&&!p.startsWith('chapters/')&&!p.startsWith('journal/')),id);
  }
});

test('checkpoint identity and NPC baseline knowledge counts are grounded in actual bytes',()=>{
  assert.equal(Object.keys(data.canonical_git_blobs).length,5);
  for(const [p,s] of Object.entries(data.canonical_git_blobs))
    assert.equal(blob(bytes(p)),s,p);
  const state=JSON.parse(str('game/STATE.json'));
  assert.equal(state.pending.type,'await_player_action');
  const knowledge=Object.values(state.world.actors).map(x=>x.knowledge);
  assert.equal(knowledge.length,data.findings.npc_anchor.npc_count);
  assert.equal(knowledge.reduce((sum,x)=>sum+x.length,0),data.findings.npc_anchor.knowledge_entry_count);
  assert.equal(data.findings.npc_anchor.source_blob,data.canonical_git_blobs['game/STATE.json']);
  assert.equal(data.findings.npc_anchor.source_commit,data.baseline_main_sha);
  assert.equal(data.findings.npc_anchor.last_event,'EV-000029');
  assert.equal(data.findings.npc_anchor.last_turn,9);
});

test('geographic gaps, sibling conflict and stale report pointer remain unadmitted',()=>{
  assert.equal(data.findings.harbor_m1p1.parent_pr,122);
  assert.equal(data.findings.plaza_approach.parent_pr,114);
  assert.deepEqual(data.findings.plaza_approach.shared_first_draft_segment,[[65,42],[66.9,40.6]]);
  assert.equal(data.findings.plaza_approach.shared_length,2.360085);
  assert.equal(data.findings.plaza_approach.illustrative_uncovered_lengths.pr106_variant,3.638721);
  assert.equal(data.findings.plaza_approach.illustrative_uncovered_lengths.pr103_variant,4.6114);
  assert.equal(data.findings.prerequisite_overlap.resolved,false);
  assert.equal(data.findings.prerequisite_overlap.shared_report,
    'docs/01_world/MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_AUDIT_20261122.md');
  assert.equal(data.findings.stale_provenance.resolved,false);
  assert.notEqual(data.findings.stale_provenance.parent_current_sha,
    data.findings.stale_provenance.parent_historic_sha_in_report);
  assert.equal(data.findings.stale_provenance.review_comment,7087441989);
});

test('new artifacts are indexed with unique inventory entries',()=>{
  const list=[
    'docs/00_start/BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.json',
    'docs/00_start/BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.md',
    'tests/branch_security_access_lot10.test.mjs'
  ];
  const inv=JSON.parse(str('docs/FILE_INVENTORY.json'));
  assert.deepEqual(inv.supplemental.branch_security_access_lot10_2026_11_22,list);
  const supplemental=Object.values(inv.supplemental).flat();
  assert.equal(new Set(supplemental).size,supplemental.length);
  assert.ok(list.every(p=>existsSync(resolve(root,p))));
  assert.ok(str('docs/00_start/INDEX.md').includes('BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.md'));
  assert.ok(str('docs/00_start/INDEX.md').includes('BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.json'));
  assert.ok(str('tests/INDEX.md').includes('branch_security_access_lot10.test.mjs'));
});
