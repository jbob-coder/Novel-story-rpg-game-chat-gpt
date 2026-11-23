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


test('conditional macroevents have ten unique references and complete causal news-chain fields', () => {
  const rows = rowFor('MAC');
  const expected = Array.from({length: 10}, (_, i) => 'MAC-' + String(i + 1).padStart(2, '0'));
  assert.deepEqual(extractIds(rows, 'MAC'), expected, 'stable and ordered macroevent identifiers');
  assert.equal(new Set(extractIds(rows, 'MAC')).size, 10);
  for (const row of rows) {
    const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
    assert.equal(cells.length, 5, 'each macroevent needs condition, chain, news and alternative');
    assert.ok(cells[0].length >= 6 && cells.slice(1).every(cell => cell.length > 35),
      'macroevent must supply nontrivial context for conditional review');
  }
  assert.equal(rows.filter(line => /Día 0 — la onda cósmica llega a la Tierra, hecho CANÓNICO futuro/.test(line)).length, 1,
    'one confirmed macroevent, arrival of the cosmic shockwave');
  for (const id of ['MAC-08', 'MAC-09', 'MAC-10']) {
    const row = rows.find(line => line.includes('| ' + id + ' |'));
    assert.ok(/Día 0/.test(row), id + ' cannot predate day 0');
  }
});

test('macro news progression never schedules effects or equates coverage to truth', () => {
  for (const heading of [
    '## 9. Macroeventos independientes',
    '### 9.1 Evolución causal (no cronograma fijo)',
    '### 9.2 Catálogo de cadenas posibles',
    '### 9.3 Ejemplo concreto de noticia',
    '### 9.4 Condiciones de promoción y seguimiento'
  ]) assert.ok(body.includes(heading), 'missing macroevent protocol: ' + heading);
  for (const stage of ['F0 · Latente', 'F1 · Primer hecho', 'F2 · Reacción/información',
    'F3 · Propagación o contención', 'F4 · Consecuencias persistentes', 'F5 · Deriva, resolución o revisión']) {
    assert.ok(body.includes(stage), 'missing macroevent review stage: ' + stage);
  }
  for (const safeguard of [
    'Todos los demás MAC',
    'Ninguna ocurrida',
    'No ejecutar nada mientras el chat está inactivo',
    'sin «resolver» todos los sistemas de una ciudad',
    'una noticia antigua sigue siendo evidencia de lo que alguien supo o creyó',
    'Únicamente la llegada futura de la onda en Día 0 pertenece al canon establecido',
    'No reservar IDs, anticipar resultados',
    'El total es **50 referencias editoriales no ejecutadas**',
    'Jack puede no enterarse jamás'
  ]) {
    assert.ok(body.toLocaleLowerCase('es').includes(safeguard.toLocaleLowerCase('es')),
      'missing macroevent gate: ' + safeguard);
  }
  assert.ok(body.includes('**F3 · opción A:**'));
  assert.ok(body.includes('**F3 · opción B:**'));
  assert.ok(body.includes('**F3 · opción C:**'));
});
