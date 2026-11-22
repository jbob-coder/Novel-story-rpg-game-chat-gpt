import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path));
const json=path=>JSON.parse(read(path).toString('utf8'));
const audit=json('docs/00_start/BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.json');
const rows=new Map(audit.records.map(r=>[r.pr,r]));
const hash=b=>createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');

test('lot12 freezes eight PR records, exactly four distinct work heads',()=>{
 assert.equal(audit.version,1);
 assert.equal(audit.kind,'dated_cross_family_branch_custody_review');
 assert.equal(audit.repo,'jbob-coder/Novel-story-rpg-game-chat-gpt');
 assert.equal(audit.date,'2026-11-22');
 assert.equal(audit.parent_pr,144);
 assert.equal(audit.parent_sha,'fa8fc08d36170ed31ccb4d996f248b01092003f3');
 assert.equal(audit.main_at_snapshot,'019175c6463ff31807a0f7013d91299add94913c');
 assert.deepEqual([...rows.keys()],[138,139,140,141,142,143,146,147]);
 assert.equal(rows.size,8);
 assert.equal(audit.records.filter(x=>x.role==='work_draft').length,4);
 for(const r of audit.records){
  assert.match(r.head_sha,/^[0-9a-f]{40}$/,String(r.pr));
  assert.match(r.base_sha,/^[0-9a-f]{40}$/,String(r.pr));
  assert.equal(r.merged_at_snapshot,false,String(r.pr));
  assert.equal(r.draft_at_snapshot,true,String(r.pr));
 }
});

test('four QA mirrors are exact source SHA aliases, not independent tests',()=>{
 assert.deepEqual(audit.qa_pairs,{'139':138,'141':140,'143':142,'147':146});
 const runIds=new Set();
 const commits=new Set();
 for(const [qa,src] of Object.entries(audit.qa_pairs)){
  const alias=rows.get(Number(qa)),original=rows.get(src);
  assert.equal(alias.qa_of,src);
  assert.equal(alias.role,'qa_only_mirror');
  assert.equal(alias.state_at_snapshot,'closed');
  assert.equal(alias.base_branch,'main');
  assert.equal(alias.head_sha,original.head_sha);
  assert.equal(alias.ci.run_id,original.ci.run_id);
  assert.equal(alias.ci.head_sha,original.head_sha);
 }
 for(const r of audit.records){
  assert.equal(r.ci.status,'completed',String(r.pr));
  assert.equal(r.ci.conclusion,'success',String(r.pr));
  assert.equal(r.ci.head_sha,r.head_sha,String(r.pr));
  assert.equal(r.ci.python_pass,47);
  assert.equal(r.ci.checkpoint,'PASS');
  runIds.add(r.ci.run_id);commits.add(r.head_sha);
 }
 assert.equal(runIds.size,4);
 assert.equal(commits.size,4);
 assert.deepEqual([138,140,142,146].map(n=>rows.get(n).ci.javascript_pass),[498,527,569,542]);
});

test('parent dependencies and collision-prone inventories are accurately recorded',()=>{
 const parents={
  138:['work/npc-social-knowledge-anchor-20261122','ae42f871e3ef336dc69a23dca1ba8e861b30cc8d'],
  140:['audit/plaza-harbor-approach-evidence-gap-20261122','34898eb209472ad4f429c06e6d2b3df6c67f2d55'],
  142:['work/meridian-m1-p1-historical-access-gates-20261122','3a38d41d745075373170b790c1aab92cf8da4785'],
  146:['audit/crosswater-approach-provisional-fragment-20261122','190cff8a4eb1d3bdb9a8e44a76b57255fe91e245']
 };
 for(const [number,[branch,sha]] of Object.entries(parents)){
  const r=rows.get(Number(number));
  assert.equal(r.base_branch,branch,number);
  assert.equal(r.base_sha,sha,number);
  assert.equal(r.state_at_snapshot,'open');
  assert.ok(r.exclusive_ahead>0);
  assert.equal(r.exclusive_behind,0);
  assert.equal(new Set(r.exclusive_files).size,r.exclusive_files.length);
  assert.ok(r.exclusive_files.every(p=>
   !p.startsWith('game/')&&!p.startsWith('chapters/')&&!p.startsWith('journal/')));
  for(const i of audit.common_index_paths)assert.ok(r.exclusive_files.includes(i),number);
 }
 assert.equal(rows.get(146).base_sha,rows.get(140).head_sha);
 assert.deepEqual(audit.common_index_paths,[
  'docs/01_world/INDEX.md','docs/FILE_INVENTORY.json','tests/INDEX.md','tools/INDEX.md'
 ]);
});

test('NPC migration remains a candidate requiring remote verification and owner approval',()=>{
 const f=audit.findings.npc_migration;
 assert.equal(f.pr,138);
 assert.equal(f.source_pr,127);
 assert.equal(f.operations.promote_checkpoint,'candidate_only_requires_external_review_if_eligible');
 assert.equal(f.operations.register_npc,'blocked');
 assert.equal(f.operations.forget,'blocked');
 assert.equal(f.candidate_applied,false);
 assert.equal(f.remote_commit_verified,false);
 assert.equal(f.owner_approved,false);
 assert.equal(f.observed_head_is_only_format_checked,true);
 assert.equal(f.baseline_turn,9);
 assert.equal(f.baseline_event,'EV-000029');
 assert.equal(f.baseline_knowledge_entries,29);
 assert.equal(f.baseline_actor_count,7);
 const s=json('game/STATE.json');
 assert.equal(Object.keys(s.world.actors).length,f.baseline_actor_count);
 assert.equal(Object.values(s.world.actors)
  .reduce((n,a)=>n+a.knowledge.length,0),f.baseline_knowledge_entries);
});

test('the four physical-study records preserve unknown access and options',()=>{
 const f=audit.findings;
 assert.equal(f.crosswater_provisional.base_pr,130);
 assert.equal(f.crosswater_provisional.route_variants,2);
 assert.equal(f.crosswater_provisional.unknown_checks,6);
 assert.deepEqual(f.crosswater_provisional.common_leg,[[65,42],[66.9,40.6]]);
 assert.equal(f.crosswater_provisional.physical_walkability_verified,false);
 assert.equal(f.m1p1_concepts.base_pr,136);
 assert.deepEqual(f.m1p1_concepts.option_ids,['M1-A','M1-B','P1-A','P1-B']);
 assert.equal(f.m1p1_concepts.open_gates,12);
 assert.equal(f.m1p1_concepts.options_selected_for_build,0);
 assert.equal(f.m1p1_concepts.physical_route_approved,false);
 assert.equal(f.crosswater_frontage.base_pr,140);
 assert.equal(f.crosswater_frontage.diagram_half_width_canvas,0.12);
 assert.equal(f.crosswater_frontage.diagram_frontage_offset_canvas,0.45);
 assert.equal(f.crosswater_frontage.metric_width_meters,null);
 assert.equal(f.crosswater_frontage.unverified_survey_checks,5);
 assert.equal(f.crosswater_frontage.variants_preserved,2);
 assert.equal(f.crosswater_frontage.physical_route_approved,false);
});

test('all five canonical files match their immutable Git blob identity',()=>{
 assert.equal(Object.keys(audit.protected_story_git_blobs).length,5);
 for(const [path,expected] of Object.entries(audit.protected_story_git_blobs)){
  assert.match(expected,/^[0-9a-f]{40}$/);
  assert.equal(hash(read(path)),expected,path);
 }
 assert.equal(json('game/STATE.json').pending.type,'await_player_action');
});

test('artifacts are present in the file inventory and both indices without duplication',()=>{
 const expected=[
  'docs/00_start/BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.json',
  'docs/00_start/BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.md',
  'tests/branch_cross_family_lot12.test.mjs'
 ];
 const inv=json('docs/FILE_INVENTORY.json');
 assert.deepEqual(inv.supplemental.branch_cross_family_lot12_2026_11_22,expected);
 const values=Object.values(inv.supplemental).flat();
 assert.equal(new Set(values).size,values.length);
 for(const p of expected)assert.ok(existsSync(resolve(root,p)),p);
 const index=read('docs/00_start/INDEX.md').toString();
 assert.ok(index.includes('BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.md'));
 assert.ok(index.includes('BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.json'));
 assert.ok(read('tests/INDEX.md').toString().includes('branch_cross_family_lot12.test.mjs'));
});
