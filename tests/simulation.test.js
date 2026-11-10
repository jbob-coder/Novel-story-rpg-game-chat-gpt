import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, advanceDay, restoreWorld, START_DAY } from '../src/simulation.js';

function progress(world, days, choice = 'wait') {
  for (let i = 0; i < days; i++) world = advanceDay(world, choice);
  return world;
}
test('starts thirty days before the shockwave with ordinary life', () => {
  const w = createWorld();
  assert.equal(w.day, START_DAY);
  assert.equal(w.nature.wildlife.affected, false);
  assert.equal(w.people.every(p => p.power === null), true);
  assert.equal(w.player.power, null);
});
test('world actors continue to act even if the player only waits', () => {
  const w = progress(createWorld(), 10);
  assert.equal(w.people.every(p => p.actions === 10), true);
  assert.ok(w.people.some(p => p.lastAction !== 'none'));
});
test('shockwave occurs on day zero, not before; affects all natural domains', () => {
  const pre = progress(createWorld(), 29);
  assert.equal(pre.day, -1);
  assert.equal(pre.nature.plants.affected, false);
  assert.equal(pre.people.every(p => p.power === null), true);
  const at = advanceDay(pre);
  assert.equal(at.day, 0);
  assert.equal(at.nature.wildlife.affected, true);
  assert.equal(at.nature.plants.affected, true);
  assert.equal(at.nature.environment.affected, true);
  assert.ok(at.people.some(p => p.power !== null));
});
test('hybrid awakening supports immediate, delayed and never', () => {
  const w = createWorld(1701);
  const eligible = [w.player, ...w.people];
  for (let seed = 1; seed < 60; seed++) {
    eligible.push(createWorld(seed).player);
  }
  assert.ok(eligible.some(p => p.awakeningDay === 0));
  assert.ok(eligible.some(p => p.awakeningDay > 0));
  assert.ok(eligible.some(p => p.awakeningDay === null));
});
test('same seed and actions replay identically, including after save and restore', () => {
  const a = progress(createWorld(921), 47, 'observe');
  const b = progress(createWorld(921), 22, 'observe');
  const restored = restoreWorld(JSON.stringify(b));
  assert.deepEqual(a, progress(restored, 25, 'observe'));
});
test('invalid actions cannot mutate the previous state', () => {
  const w = createWorld();
  assert.throws(() => advanceDay(w, 'invented'), /Unknown action/);
  const result = advanceDay(w, 'help');
  assert.equal(w.day, -30);
  assert.equal(result.day, -29);
});
test('rejects corrupt and unsupported save data', () => {
  assert.equal(restoreWorld('{'), null);
  assert.equal(restoreWorld('{"version":999}'), null);
  assert.equal(restoreWorld('null'), null);
});
test('long simulation keeps numeric resources bounded', () => {
  const w = progress(createWorld(18), 365, 'help');
  for (const value of [w.player.energy, w.player.supplies, w.society.trust, w.society.concern, w.society.knowledge, w.society.scarcity]) {
    assert.ok(value >= 0 && value <= 100);
  }
  assert.ok(w.history.length <= 60);
});
