import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bytes=p=>readFileSync(resolve(root,p));
const read=p=>bytes(p).toString('utf8');
const audit=JSON.parse(read('docs/00_start/BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.json'));
const byPR=new Map(audit.records.map(row=>[row.pr,row]));
const gitBlob=b=>createHash('sha1')
  .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');

test('lot11 records exact heads and four custody PRs, not a floating count',()=>{
 assert.equal(audit.version,1);
 assert.equal(audit.repo,'jbob-coder/Novel-story-rpg-game-chat-gpt');
 assert.equal(audit.date,'2026-11-22');
 assert.equal(audit.parent_pr,134);
 assert.equal(audit.parent_head,'bf5112753d0bf46b3a77d57c3323f992ca9c9a74');
 assert.deepEqual([...byPR.keys()],[132,133,136,137]);
 assert.equal(byPR.size,4);
 for(const row of byPR.values()){
   assert.match(row.head_sha,/^[0-9a-f]{40}$/,String(row.pr));
   assert.match(row.base_sha,/^[0-9a-f]{40}$/,String(row.pr));
   assert.equal(row.merged_at_review,false,String(row.pr));
   assert.equal(row.draft_at_review,true,String(row.pr));
 }
});

test('QA duplicates exactly share the source head, but cannot be merged',()=>{
 for(const [qa,source] of [[133,132],[137,136]]){
   const q=byPR.get(qa),s=byPR.get(source);
   assert.equal(q.mirror_of,source);
   assert.equal(q.kind,'qa_exact_head_mirror');
   assert.equal(q.head_sha,s.head_sha);
   assert.equal(q.state_at_review,'closed');
   assert.equal(q.base_branch,'main');
   assert.equal(q.merged_at_review,false);
   assert.equal(q.ci.run_id,s.ci.run_id);
 }
 for(const n of [132,136]){
   const x=byPR.get(n);
   assert.equal(x.state_at_review,'open');
   assert.equal(x.ci.head_sha,x.head_sha);
   assert.equal(x.ci.status,'completed');
   assert.equal(x.ci.conclusion,'success');
 }
 assert.notEqual(byPR.get(132).ci.run_id,byPR.get(136).ci.run_id);
 assert.equal(audit.findings.quality.pr132_run,byPR.get(132).ci.run_id);
 assert.equal(audit.findings.quality.pr136_run,byPR.get(136).ci.run_id);
});

test('PR132 is a sibling of PR126; PR136 is a child of PR126 and overlaps exactly four index paths',()=>{
 const a=byPR.get(132),b=byPR.get(136),f=audit.findings.sibling_custody;
 assert.equal(a.base_sha,f.pr132_base_sha);
 assert.equal(b.base_sha,f.pr136_base_sha);
 assert.equal(f.pr132_base_pr,122);
 assert.equal(f.pr136_base_pr,126);
 assert.equal(f.pr126_base_pr,122);
 assert.notEqual(a.base_sha,b.base_sha);
 assert.notEqual(a.head_sha,b.head_sha);
 const shared=a.exclusive_changed_paths.filter(p=>b.exclusive_changed_paths.includes(p)).sort();
 assert.deepEqual(shared,audit.shared_paths);
 assert.deepEqual(shared,[
   'docs/01_world/INDEX.md','docs/FILE_INVENTORY.json','tests/INDEX.md','tools/INDEX.md'
 ]);
 assert.ok(a.exclusive_changed_paths.some(p=>p.endsWith('.svg')));
 assert.ok(b.exclusive_changed_paths.includes('docs/01_world/SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json'));
 assert.ok(b.exclusive_changed_paths.includes('docs/01_world/SOURCE_PR54_PLAZA_TERMINAL_ACCESS_20261122.json'));
});

test('twelve entry checks remain unverified and source SHA typo is reported, not used',()=>{
 const d=audit.findings.pr132_svg_and_story,g=audit.findings.pr136_historical;
 assert.equal(d.pr,132);
 assert.equal(g.pr,136);
 assert.equal(d.entries,2);
 assert.equal(d.source_git_blobs,7);
 assert.equal(d.can_navigate,false);
 assert.equal(d.source_state_tool_verified_sha,audit.checkpoint_blobs['game/STATE.json']);
 assert.notEqual(d.source_state_report_wrong_sha,d.source_state_tool_verified_sha);
 assert.equal(d.comment_id,7087596687);
 assert.equal(g.required_gates,12);
 assert.equal(g.missing,12);
 assert.equal(g.m1_missing.length,6);
 assert.equal(g.p1_missing.length,6);
 assert.equal(new Set([...g.m1_missing,...g.p1_missing]).size,12);
 assert.equal(g.physical_routes_approved,false);
});

test('the five saved narrative blobs are still identical to main',()=>{
 assert.equal(audit.baseline_main_sha,'019175c6463ff31807a0f7013d91299add94913c');
 assert.equal(Object.keys(audit.checkpoint_blobs).length,5);
 for(const [path,sha] of Object.entries(audit.checkpoint_blobs)){
   assert.match(sha,/^[0-9a-f]{40}$/);
   assert.equal(gitBlob(bytes(path)),sha,path);
 }
 assert.equal(JSON.parse(read('game/STATE.json')).pending.type,'await_player_action');
});

test('all lot11 artifacts have valid unique inventory and indices',()=>{
 const list=[
 'docs/00_start/BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.json',
 'docs/00_start/BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.md',
 'tests/branch_m1p1_comparison_lot11.test.mjs'
 ];
 const inventory=JSON.parse(read('docs/FILE_INVENTORY.json'));
 assert.deepEqual(inventory.supplemental.branch_m1p1_lot11_2026_11_22,list);
 const paths=Object.values(inventory.supplemental).flat();
 assert.equal(new Set(paths).size,paths.length);
 assert.ok(list.every(p=>existsSync(resolve(root,p))));
 const d=read('docs/00_start/INDEX.md'),t=read('tests/INDEX.md');
 assert.ok(d.includes('BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.json'));
 assert.ok(d.includes('BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.md'));
 assert.ok(t.includes('branch_m1p1_comparison_lot11.test.mjs'));
});
