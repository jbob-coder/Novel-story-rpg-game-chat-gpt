import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFiveFiles, encodeFiveFiles, savePaths} from '../tools/save_transaction.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {inspectSceneEstablishedPlaces} from '../tools/meridian_bay_discovery.mjs';
import {ordinaryMorning, waitingMoment} from './helpers/ordinary_morning.mjs';

const files = Object.fromEntries(savePaths('CH-000').map(path =>
  [path, readFileSync(new URL('../' + path, import.meta.url), 'utf8')]));
const head = 'a'.repeat(40);
for (const recipientPresent of [false, true]) {
  test('Jack can stay or inspect while delivery recipient is ' + (recipientPresent ? 'present' : 'absent'), () => {
    const courierResults = [];
    for (const visit of [false, true]) {
      const snapshot = decodeFiveFiles(files, 'CH-000');
      const action = ordinaryMorning(snapshot, {visit, recipientPresent});
      const next = stageLivingWorldTurn({snapshot, observedHead: head, ...action});
      const saved = decodeFiveFiles(encodeFiveFiles(next), 'CH-000');
      const entries = saved.transcript.entries.slice(-2);
      assert.deepEqual(entries.map(e => e.text), [action.turn.player_text, ...action.turn.narration_messages]);
      const prose = entries[1].text;
      const courierEvent = saved.events.events.at(-1);
      const courier = saved.state.world.actors['NPC-003'];
      assert.deepEqual(courierEvent.known_to, [courier.id]);
      assert.equal(Object.hasOwn(courier.resources, 'parcel'), !recipientPresent);
      courierResults.push(courier);
      assert.doesNotMatch(prose, /Darius|recibo|destinataria|paquete/);
      assert.equal(prose.includes('¿Me dejas ver el casquillo?'), visit);
      assert.equal(saved.state.player.location_id, visit ? 'LOC-MARKET-NOAH-REPAIR' : snapshot.state.player.location_id);
      assert.equal(inspectSceneEstablishedPlaces({snapshot: saved}).some(p => p.visited && p.locationId === 'LOC-MARKET-NOAH-REPAIR'), visit);
      assert.deepEqual(saved.state.player.inventory.map(i => i.id), snapshot.state.player.inventory.map(i => i.id));
      assert.deepEqual(saved.state.player.finances, snapshot.state.player.finances);
      assert.deepEqual(saved.state.player.inventory.find(i => i.id === 'ITEM-ASTER'),
        snapshot.state.player.inventory.find(i => i.id === 'ITEM-ASTER'));
      assert.equal(saved.state.player.knowledge.some(k => k.includes('pestaña del casquillo')), visit);
      const follow = stageLivingWorldTurn({snapshot: saved, observedHead: head, turn: waitingMoment(saved)});
      assert.equal(follow.transcript.entries.at(-1).text.includes('casquillo'), visit);
      assert.deepEqual(follow.state.world.actors['NPC-003'], courier);
      assert.deepEqual(follow.state.player, saved.state.player);
    }
    assert.deepEqual(...courierResults);
  });
}
