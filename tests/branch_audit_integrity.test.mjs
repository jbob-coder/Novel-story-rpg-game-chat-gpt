import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const report = json('docs/00_start/BRANCH_LIVE_VERIFICATION_2026-11-20.json');
const original = json('docs/00_start/INVENTARIO_RAMAS_2026-11-19.json');
const geometry = json('docs/00_start/BRANCH_GEOMETRY_CANDIDATES_2026-11-20.json');
const inventory = json('docs/FILE_INVENTORY.json');
const lots = Array.from({length: 9}, (_, index) =>
  json('docs/00_start/branch_checks/LOT_' + String(index + 1).padStart(2, '0') + '.json'));
const recorded = lots.flatMap(lot => lot.records);
const byName = new Map(report.per_branch.map(entry => [entry.name, entry]));
const oldByName = new Map(recorded.map(entry => [entry.name, entry]));
const gitBlob = data => {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0'))
    .update(bytes).digest('hex');
};
const fileBlob = path => gitBlob(readFileSync(resolve(root, path)));
const requiredCanon = {
  'game/SAVE_MANIFEST.json': '897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  'game/STATE.json': '3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  'chapters/CH-000.events.json': '1f40c724e44f70c9b45814dc11ff1f73262c5a5',
  'chapters/CH-000.transcript.json': '1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  'chapters/CH-000.md': 'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
};

test('all 108 immutable catalogue names remain uniquely represented within 113 records', () => {
  assert.equal(original.branch_count, 108);
  assert.equal(recorded.length, 108);
  assert.equal(oldByName.size, 108);
  assert.equal(report.per_branch.length, 113);
  assert.equal(byName.size, 113);
  assert.equal(report.per_branch.filter(item => item.historical_108).length, 108);
  assert.equal(report.per_branch.filter(item => !item.historical_108).length, 5);
  assert.deepEqual(
    [...original.branches.map(entry => entry.name)].sort(),
    [...recorded.map(entry => entry.name)].sort()
  );
  assert.deepEqual(
    [...original.branches.map(entry => entry.name)].sort(),
    [...report.per_branch.filter(entry => entry.historical_108).map(entry => entry.name)].sort()
  );
  assert.deepEqual(
    Object.fromEntries(['main','work','qa','journal','backup','audit'].map(group =>
      [group, report.per_branch.filter(entry => entry.historical_108 && entry.group === group).length])),
    {main: 1, work: 63, qa: 32, journal: 5, backup: 3, audit: 4}
  );
});

test('historical complete trees have verifiable SHA provenance and bounded content', () => {
  assert.equal(lots.length, 9);
  for (const lot of lots) assert.equal(lot.records.length, 12);
  const changed = [];
  for (const originalEntry of original.branches) {
    const row = byName.get(originalEntry.name);
    const old = oldByName.get(originalEntry.name);
    assert.equal(row.historical_head_sha, originalEntry.head_sha, row.name);
    assert.equal(old.expected_sha, originalEntry.head_sha, row.name);
    assert.equal(old.tree_sha, old.expected_sha, row.name);
    assert.equal(old.sha_match, true, row.name);
    assert.equal(old.truncated, false, row.name);
    assert.equal(new Set(old.files.map(x => x.path)).size, old.files.length, row.name);
    assert.equal(old.files.length, old.file_count, row.name);
    assert.ok(old.files.every(x => /^[0-9a-f]{40}$/.test(x.sha)), row.name);
    if (row.live_head_changed) changed.push(row.name);
    else {
      assert.equal(row.live_head_sha, old.expected_sha, row.name);
      assert.equal(row.file_evidence, 'immutable_2026_11_19_complete_tree', row.name);
      assert.equal(row.file_count, old.file_count, row.name);
    }
  }
  assert.deepEqual(changed.sort(), ['main','work/chat-narrative-foundation']);
});

test('recorded missing tool/test paths reconcile to all immutable trees without re-importing historical code', () => {
  const modernPaths = new Set([
    ...inventory.entrypoints, ...inventory.indexes,
    ...Object.values(inventory.canonical).flat(),
    ...Object.values(inventory.supplemental ?? {}).flat(),
    ...(inventory.repository_checkpoints ?? [])
  ]);
  // Newly added audit coverage did not exist at the frozen main baseline.
  modernPaths.delete('tests/branch_audit_integrity.test.mjs');
  const missingTools = new Set(), missingTests = new Set();
  for (const item of report.per_branch.filter(r => r.historical_108 && !r.live_head_changed)) {
    const old = oldByName.get(item.name);
    for (const [prefix, key, accumulator] of [
      ['tools/', 'missing_tool_paths_vs_main', missingTools],
      ['tests/', 'missing_test_paths_vs_main', missingTests]
    ]) {
      const paths = old.files.map(f => f.path)
        .filter(path => path.startsWith(prefix) && !modernPaths.has(path)).sort();
      assert.deepEqual(item[key], paths, item.name + ' ' + key);
      for (const path of paths) accumulator.add(path);
    }
    const oldMap = new Map(old.files.map(f => [f.path, f.sha]));
    assert.deepEqual(item.canonical_missing,
      Object.keys(requiredCanon).filter(path => !oldMap.has(path)), item.name);
    assert.deepEqual(item.canonical_different_blob,
      Object.keys(requiredCanon).filter(path =>
        oldMap.has(path) && oldMap.get(path) !== requiredCanon[path]), item.name);
  }
  // For advanced main/narrative heads, full new trees were read live rather
  // than substituting their immutable November 19 tree snapshots.
  assert.equal(missingTools.size, 26);
  assert.equal(missingTests.size, 32);
  assert.equal(report.summary.unique_missing_tool_paths, 26);
  assert.equal(report.summary.unique_missing_test_paths, 32);
});

test('all shared-HEAD alias links are symmetric and do not duplicate branch facts', () => {
  const originalRows = report.per_branch.filter(row => row.historical_108);
  const headGroups = Map.groupBy(originalRows, x => x.live_head_sha);
  const aliases = [...headGroups.values()].filter(group => group.length > 1);
  assert.equal(aliases.length, 21);
  assert.equal(aliases.reduce((total, group) => total + group.length, 0), 44);
  for (const row of report.per_branch) {
    const expected = report.per_branch.filter(x => x.name !== row.name && x.live_head_sha === row.live_head_sha)
      .map(x => x.name).sort();
    assert.deepEqual([...row.duplicate_head_with].sort(), expected, row.name);
  }
});

test('the exact five-file checkpoint remains identical to the verified baseline', () => {
  assert.equal(report.baseline.main_sha, '019175c6463ff31807a0f7013d91299add94913c');
  assert.equal(geometry.baseline_main_sha, report.baseline.main_sha);
  assert.equal(geometry.baseline_state_git_blob, requiredCanon['game/STATE.json']);
  for (const [path, sha] of Object.entries(requiredCanon)) assert.equal(fileBlob(path), sha, path);
  const manifest = json('game/SAVE_MANIFEST.json');
  const state = json('game/STATE.json');
  assert.equal(state.pending.type, 'await_player_action');
  assert.ok(manifest);
});

test('duplicate proposed route pairs have identical coordinates but retain separate evidence IDs', () => {
  assert.equal(geometry.candidates.length, 6);
  const candidates = new Map(geometry.candidates.map(x => [x.pr, x]));
  assert.equal(candidates.size, 6);
  for (const [a, b] of geometry.duplicate_pairs) {
    const first = candidates.get(a), second = candidates.get(b);
    assert.ok(first && second);
    assert.equal(first.from, second.from);
    assert.equal(first.to, second.to);
    assert.deepEqual(first.points, second.points);
    assert.notEqual(first.source_file_blob, second.source_file_blob);
    assert.notEqual(first.source_branch, second.source_branch);
  }
  for (const [a, b] of geometry.conflicting_pairs) {
    const first = candidates.get(a), second = candidates.get(b);
    assert.ok(first && second);
    assert.equal(first.from, second.from);
    assert.equal(first.to, second.to);
    assert.deepEqual(first.points[0], second.points[0]);
    assert.deepEqual(first.points.at(-1), second.points.at(-1));
    assert.notDeepEqual(first.points.slice(1, -1), second.points.slice(1, -1));
  }
});

test('candidate geometry can only describe known reciprocal graph links, not fictional new places', () => {
  const state = json('game/STATE.json');
  const locations = state.world.locations;
  assert.equal(Object.keys(locations).length, 15);
  const ids = new Set(geometry.candidates.map(x => x.pr));
  assert.equal(ids.size, 6);
  for (const candidate of geometry.candidates) {
    assert.match(candidate.source_head, /^[0-9a-f]{40}$/);
    assert.match(candidate.source_file_blob, /^[0-9a-f]{40}$/);
    const a = locations[candidate.from], b = locations[candidate.to];
    assert.ok(a && b, candidate.pr + ' endpoint must exist');
    assert.ok(a.connected_ids.includes(candidate.to), candidate.pr + ' forward edge missing');
    assert.ok(b.connected_ids.includes(candidate.from), candidate.pr + ' reverse edge missing');
    assert.ok(candidate.points.length >= 2 && candidate.points.every(point =>
      Array.isArray(point) && point.length === 2 &&
      point.every(value => typeof value === 'number' && Number.isFinite(value))));
  }
  for (const id of geometry.admission_review) {
    assert.equal(locations[id].access_status, 'public_confirmed', id);
    assert.equal(locations[id].opening_hours, null, id + ' hours unverified');
    assert.equal(locations[id].travel_minutes, null, id + ' travel unverified');
  }
  assert.equal(geometry.authority, 'archival_review_only_not_saved_world_canon');
});
