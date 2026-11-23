import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const referencePath = 'docs/01_world/LIVING_WORLD_EVERYDAY_NEWS_AND_FUTURE_HOOKS_20261122.md';
const read = path => readFileSync(resolve(root, path), 'utf8');
const body = read(referencePath);
const lines = body.split(/\r?\n/);
const rowFor = prefix => lines.filter(line => new RegExp('^\\|\\s*' + prefix + '-\\d{2}\\s*\\|').test(line));
const extractIds = (rows, prefix) => rows.map(row => {
  const match = row.match(new RegExp('^\\|\\s*(' + prefix + '-\\d{2})\\s*\\|'));
  assert.ok(match, 'Invalid ' + prefix + ' row: ' + row);
  return match[1];
});

test('COT and POS proposals use unique, complete contiguous editorial identifiers', () => {
  for (const [prefix, count, columns] of [['COT', 20, 4], ['POS', 10, 3]]) {
    const rows = rowFor(prefix);
    assert.equal(rows.length, count, prefix + ' row count');
    const ids = extractIds(rows, prefix);
    assert.equal(new Set(ids).size, count, prefix + ' duplicate IDs');
    assert.deepEqual(ids, Array.from({length: count}, (_, i) => prefix + '-' + String(i + 1).padStart(2, '0')));
    for (const row of rows) {
      const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
      assert.equal(cells.length, columns, prefix + ' must retain source / uncertainty columns');
      assert.ok(cells[0].length >= 6 && cells.slice(1).every(cell => cell.length > 8),
        prefix + ' contains an empty or insufficient descriptive cell');
    }
  }
});

test('future lore hooks have ten stable references, not reserved narrative event IDs', () => {
  const ids = lines.flatMap(line => {
    const match = line.match(/^\s*-\s+\*\*(HIL-\d{2})\s/);
    return match ? [match[1]] : [];
  });
  assert.deepEqual(ids, Array.from({length: 10}, (_, i) => 'HIL-' + String(i + 1).padStart(2, '0')));
  assert.ok(body.includes('**Nunca reservar EV, TXT ni NPC IDs para estas semillas.**'));
});

test('reference retains safeguards for uncertain news, canon, time and player agency', () => {
  for (const phrase of [
    'PROPUESTA / NO CANÓNICA',
    'Ninguna fila de aquí se ha publicado, ocurrido o guardado como evento del juego',
    'El chat inactivo no hace avanzar relojes',
    'Una noticia publicada en ficción puede ser verdadera, falsa',
    'Jack solo puede verlo por pantalla, llamada, prensa, voz o experiencia accesible',
    'Ninguno de los efectos concretos siguientes está garantizado',
    'No adjudicar nuevas palabras, acciones o pensamientos a Jack',
    'Guardar solo lo ocurrido',
    'Una semilla no agrega hilos ni EV por anticipado'
  ]) assert.ok(body.includes(phrase), 'Missing guard: ' + phrase);
});

test('narrator can discover this proposed reference, and the repository inventory tracks it', () => {
  const name = 'LIVING_WORLD_EVERYDAY_NEWS_AND_FUTURE_HOOKS_20261122.md';
  assert.ok(read('docs/01_world/INDEX.md').includes(name));
  assert.ok(read('docs/NPC_RULES.md').includes(name));
  const inventory = JSON.parse(read('docs/FILE_INVENTORY.json'));
  assert.equal(inventory.supplemental.supporting_docs.filter(path => path === referencePath).length, 1);
  assert.equal(inventory.supplemental.additional_test_suites.filter(path => path === 'tests/living_world_news_reference.test.mjs').length, 1);
});
