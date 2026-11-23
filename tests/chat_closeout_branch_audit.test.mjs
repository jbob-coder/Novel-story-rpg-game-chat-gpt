import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const content=p=>readFileSync(resolve(root,p));
const read=p=>content(p).toString('utf8');
const json=p=>JSON.parse(read(p));
const data=json('docs/00_start/BRANCH_CLOSEOUT_PR150_154_2026-11-22.json');
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');

test('bounded closeout preserves ChatGPT-only interactive novel scope',()=>{
 assert.equal(data.schema_version,1);
 assert.equal(data.record_kind,'bounded_branch_audit_and_chat_closeout');
 assert.equal(data.repository,'jbob-coder/Novel-story-rpg-game-chat-gpt');
 assert.equal(data.project_mode,'chatgpt_only_interactive_novel');
 assert.equal(data.source_audit_parent_pr,148);
 assert.equal(data.source_audit_parent_sha,'e4461c0eda4cfe7415935c9bb39a5859c67d5939');
 assert.equal(data.main_sha_at_review,'019175c6463ff31807a0f7013d91299add94913c');
 assert.ok(data.prohibited_out_of_scope.includes('Godot'));
 assert.ok(data.prohibited_out_of_scope.includes('standalone_game_engine'));
 assert.equal(data.no_merge_no_story_write,true);
});

test('only three later source PRs are reviewed with their exact QA alias commits',()=>{
 const num=data.work_prs.map(x=>x.pr),qa=data.qa_mirrors.map(x=>x.qa);
 assert.deepEqual(num,[150,152,154]);
 assert.deepEqual(qa,[151,153,155]);
 assert.equal(new Set(data.work_prs.map(x=>x.head)).size,3);
 assert.equal(new Set(data.work_prs.map(x=>x.run)).size,3);
 for(let i=0;i<3;i++){
  const w=data.work_prs[i],q=data.qa_mirrors[i];
  assert.equal(w.qa,q.qa);
  assert.equal(q.of,w.pr);
  assert.equal(q.head,w.head);
  assert.equal(q.state,'closed');
  assert.equal(q.merged,false);
  assert.equal(q.base,'main');
  assert.equal(q.same_actions_run,w.run);
  assert.equal(w.gameAdmission,false);
  assert.equal(w.added+w.parentFiles,w.files);
  assert.equal(w.removed,0);
  assert.equal(w.python,47);
  assert.equal(w.checkpoint,'PASS');
  assert.equal(w.modified>=4,true);
  assert.match(w.base,/^[0-9a-f]{40}$/);
  assert.match(w.head,/^[0-9a-f]{40}$/);
 }
});

test('exact-commit CI counters and dependency PRs stay assigned to correct sources',()=>{
 const expected=[
  {pr:150,qa:151,basePR:132,js:555,run:45084135573,files:236},
  {pr:152,qa:153,basePR:142,js:589,run:45084194123,files:244},
  {pr:154,qa:155,basePR:138,js:516,run:45084569977,files:210}
 ];
 for(let i=0;i<expected.length;i++)
  for(const [k,v]of Object.entries(expected[i]))assert.equal(data.work_prs[i][k],v);
 assert.deepEqual(data.shared_conflict_paths,[
  'docs/01_world/INDEX.md','docs/FILE_INVENTORY.json',
  'tests/INDEX.md','tools/INDEX.md'
 ]);
 assert.equal(data.scope_completion.combined_integration,'not_attempted_not_authorized');
});

test('all five source story blobs match immutable known canonical source bytes',()=>{
 const expect=data.canonical_five_git_blobs;
 assert.equal(Object.keys(expect).length,5);
 for(const [path,hash]of Object.entries(expect)){
  assert.match(hash,/^[0-9a-f]{40}$/);
  assert.equal(sha(content(path)),hash,path);
 }
 const state=json('game/STATE.json'),manifest=json('game/SAVE_MANIFEST.json');
 assert.equal(state.pending.type,'await_player_action');
 assert.equal(state.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(manifest.last_completed_turn,9);
 assert.equal(manifest.chapter_id,'CH-000');
 assert.equal(manifest.last_event_id,'EV-000029');
 assert.equal(manifest.last_transcript_id,'TXT-000020');
});

test('isolated connector-format-delta QA has five distinct literal Git blob IDs',()=>{
 const qa=data.connector_qa;
 assert.equal(qa.status,'verified_QA_only_format_delta');
 assert.equal(qa.source_narrative_sha,data.narrative_sha_at_review);
 assert.ok(qa.isolated_story_branch.startsWith('qa/'));
 assert.ok(qa.isolated_journal_branch.startsWith('journal/qa-'));
 assert.notEqual(qa.isolated_journal_branch,'journal/living-world-save-attempts');
 assert.match(qa.detached_commit_and_final_qa_head,/^[a-f0-9]{40}$/);
 assert.match(qa.isolated_journal_verification_commit,/^[a-f0-9]{40}$/);
 const paths=Object.keys(qa.original_blobs);
 assert.deepEqual(paths.sort(),Object.keys(qa.new_blobs).sort());
 assert.equal(paths.length,5);
 for(const path of paths){
  assert.equal(qa.original_blobs[path],data.canonical_five_git_blobs[path]);
  assert.notEqual(qa.original_blobs[path],qa.new_blobs[path]);
 }
 for(const k of ['five_modified_bytes_verified','four_json_files_same_semantics',
  'one_markdown_extra_newline_only','blocked_before_commit',
  'detached_commit_recorded_before_qa_ref_move','resumed_from_independent_journal_read',
  'nonforce_expected_sha_ref_update','literal_readback_matches_all_five',
  'qa_journal_verified','production_refs_unchanged','fictional_turn_unmodified'])
  assert.equal(qa[k],true,k);
});

test('synthetic story and owner-turn completion cannot be inferred from transport QA',()=>{
 assert.equal(data.connector_qa.synthetic_new_turn_tested,false);
 assert.equal(data.connector_qa.owner_turn_live_tested,false);
 assert.equal(data.connector_qa.screen_delivery_attested,false);
 assert.equal(data.canonical_story_status.completed_turn,9);
 assert.equal(data.canonical_story_status.pending,'await_player_action');
 assert.equal(data.canonical_story_status.journal_verified_operation,'world_admission');
 assert.equal(data.scope_completion.production_live_turn_save,'not_tested');
 assert.equal(data.scope_completion.story_turn_10,'not_requested_no_action');
});

test('documentary artifacts are inventoried, linked and independent of story files',()=>{
 const files=[
  'docs/00_start/BRANCH_CLOSEOUT_PR150_154_2026-11-22.json',
  'docs/00_start/BRANCH_CLOSEOUT_PR150_154_2026-11-22.md',
  'docs/00_start/CHATGPT_ONLY_HANDOFF_2026-11-22.md',
  'tests/chat_closeout_branch_audit.test.mjs'
 ];
 const manifest=json('docs/FILE_INVENTORY.json');
 assert.deepEqual(manifest.supplemental.chat_closeout_branch_review_2026_11_22,files);
 const all=Object.values(manifest.supplemental).flat();
 assert.equal(new Set(all).size,all.length);
 for(const p of files)assert.equal(existsSync(resolve(root,p)),true,p);
 const docs=read('docs/00_start/INDEX.md'),tests=read('tests/INDEX.md');
 assert.ok(docs.includes('BRANCH_CLOSEOUT_PR150_154_2026-11-22.md'));
 assert.ok(docs.includes('CHATGPT_ONLY_HANDOFF_2026-11-22.md'));
 assert.ok(tests.includes('chat_closeout_branch_audit.test.mjs'));
});


test('independent synthetic QA distinguishes 51 baseline failures from focused PASS',()=>{
 const qa=data.external_connector_synthetic_qa;
 assert.equal(qa.original_qa_pr,156);
 assert.equal(qa.original_qa_closed_without_merge,true);
 assert.equal(qa.original_qa_full_baseline_ci.conclusion,'failure');
 assert.equal(qa.original_qa_full_baseline_ci.fixed_turn_nine_invariants_failed,51);
 assert.equal(qa.scoped_qa_overlay_pr,157);
 assert.notEqual(qa.original_qa_head,qa.scoped_overlay_head);
 assert.equal(qa.scoped_actions.run,45086079166);
 assert.equal(qa.scoped_actions.conclusion,'success');
 assert.equal(qa.scoped_actions.js_pass,5);
 assert.equal(qa.scoped_actions.js_fail,0);
 assert.equal(qa.scoped_actions.python_checkpoint,'PASS');
 assert.equal(qa.five_source_candidate_qa_files_verified_in_scoped_overlay,true);
 assert.equal(qa.real_owner_turn_tested,false);
 assert.equal(qa.canonical_saved_story_changed,false);
 assert.equal(qa.production_journal_changed,false);
});
