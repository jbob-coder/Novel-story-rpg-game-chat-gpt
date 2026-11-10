// Deterministic vertical slice. Rules in docs/CANON.md; mechanics in docs/SIMULATION.md.
export const SAVE_VERSION = 1;
export const START_DAY = -30;
const NPC_SEEDS = [
  ['mara', 'Mara Vale', 'paramedic', 'care'],
  ['dev', 'Dev Ortiz', 'reporter', 'inquiry'],
  ['imani', 'Imani Brooks', 'gardener', 'ecology'],
  ['sol', 'Sol Rhee', 'shopkeeper', 'security'],
];
const POWERS = ['kinetic', 'perception', 'regeneration', 'energy', 'adaptation'];
const ACTIONS = [
  { id: 'work', label: 'Work', detail: 'Gain supplies; spend energy.' },
  { id: 'connect', label: 'Build relationships', detail: 'Improve your local connections.' },
  { id: 'prepare', label: 'Prepare', detail: 'Store supplies for an uncertain future.' },
  { id: 'observe', label: 'Investigate', detail: 'Track changes in the wider world.' },
  { id: 'help', label: 'Help others', detail: 'Support the community at personal cost.' },
  { id: 'rest', label: 'Rest', detail: 'Recover energy.' },
  { id: 'wait', label: 'Let the day pass', detail: 'Watch the world act without you.' },
];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

// Stable pseudo-random values independent of iteration order and wall clock.
function roll(seed, key) {
  let h = 2166136261;
  for (const char of `${seed}:${key}`) {
    h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  }
  return (h >>> 0) / 4294967296;
}
function awakeningDay(seed, id) {
  const r = roll(seed, `${id}:awakening`);
  if (r < 0.20) return 0;
  if (r < 0.55) return 1 + Math.floor(roll(seed, `${id}:delay`) * 180);
  return null;
}
function makePerson(seed, [id, name, job, drive]) {
  return { id, name, job, drive, energy: 65, supplies: 25, trust: 40,
    actions: 0, lastAction: 'none', awakeningDay: awakeningDay(seed, id), power: null };
}
function addLog(world, message) {
  world.history.unshift({ day: world.day, message });
  world.history.length = Math.min(world.history.length, 60);
}
export function createWorld(seed = 1701) {
  if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer');
  const people = NPC_SEEDS.map(person => makePerson(seed, person));
  // The first awakenings occur on Day 0, even for seeds with no natural immediate result.
  if (!people.some(person => person.awakeningDay === 0)) {
    people[Math.floor(roll(seed, 'first-witness') * people.length)].awakeningDay = 0;
  }
  const world = {
    version: SAVE_VERSION, seed, day: START_DAY,
    player: { ...makePerson(seed, ['player', 'You', 'resident', 'freedom']), relationships: 0 },
    people,
    society: { trust: 55, concern: 12, knowledge: 4, scarcity: 20 },
    nature: {
      wildlife: { affected: false, changes: 0 },
      plants: { affected: false, changes: 0 },
      environment: { affected: false, anomalies: 0 },
    },
    history: [],
  };
  addLog(world, 'An ordinary month begins. Other people are already living their lives.');
  return world;
}
export function availableActions() { return ACTIONS.map(action => ({ ...action })); }
function applyPlayerAction(world, choice) {
  const p = world.player;
  switch (choice) {
    case 'work': p.supplies += 8; p.energy -= 13; break;
    case 'connect': p.relationships += 4; p.energy -= 6; world.society.trust += 1; break;
    case 'prepare': p.supplies += 5; p.energy -= 8; break;
    case 'observe': world.society.knowledge += 3; p.energy -= 7; break;
    case 'help': p.supplies -= 3; p.relationships += 3; world.society.trust += 2; p.energy -= 12; break;
    case 'rest': p.energy += 24; break;
    case 'wait': break;
    default: throw new Error('Unknown action');
  }
  p.energy = clamp(p.energy);
  p.supplies = clamp(p.supplies);
  p.relationships = clamp(p.relationships);
  world.society.trust = clamp(world.society.trust);
  world.society.knowledge = clamp(world.society.knowledge);
}
function awaken(world, person) {
  if (person.awakeningDay !== world.day || person.power) return;
  person.power = POWERS[Math.floor(roll(world.seed, `${person.id}:power`) * POWERS.length)];
  addLog(world, `${person.name} develops an unfamiliar ability. Their choices remain their own.`);
}
function shockwave(world) {
  addLog(world, 'A cosmic shockwave reaches Earth from a distant corner of the universe.');
  world.nature.wildlife.affected = true;
  world.nature.plants.affected = true;
  world.nature.environment.affected = true;
  world.nature.wildlife.changes = 1;
  world.nature.plants.changes = 1;
  world.nature.environment.anomalies = 1;
  world.society.concern = clamp(world.society.concern + 35);
}
function updateNature(world) {
  if (world.day < 0) return;
  for (const [name, key] of [['wildlife', 'changes'], ['plants', 'changes'], ['environment', 'anomalies']]) {
    if (roll(world.seed, `${name}:${world.day}`) < 0.15) {
      world.nature[name][key] += 1;
      if (world.day < 8 || world.day % 10 === 0) {
        addLog(world, `${name[0].toUpperCase()}${name.slice(1)} conditions shift independently of the player.`);
      }
    }
  }
}
function npcTurn(world, person) {
  const urgent = world.day >= 0 && world.society.concern > 45;
  let action;
  if (person.energy < 22) action = 'rest';
  else if (person.supplies < 12) action = 'work';
  else if (urgent && person.drive === 'care') action = 'help';
  else if (urgent && person.drive === 'inquiry') action = 'investigate';
  else if (urgent && person.drive === 'security') action = 'stockpile';
  else if (person.drive === 'ecology') action = 'tend';
  else if (person.power && roll(world.seed, `${person.id}:${world.day}:train`) < 0.35) action = 'train';
  else action = roll(world.seed, `${person.id}:${world.day}:routine`) < 0.25 ? 'connect' : 'work';

  person.actions += 1;
  person.lastAction = action;
  switch (action) {
    case 'rest': person.energy += 30; break;
    case 'work': person.supplies += 5; person.energy -= 7; break;
    case 'connect': person.trust += 3; person.energy -= 3; world.society.trust += 1; break;
    case 'help': person.supplies -= 2; person.energy -= 9; world.society.trust += 2; break;
    case 'investigate': person.energy -= 8; world.society.knowledge += 2; break;
    case 'stockpile': person.supplies += 4; person.energy -= 6; world.society.scarcity += 1; break;
    case 'tend': person.energy -= 8; world.society.trust += 1; break;
    case 'train': person.energy -= 10; world.society.knowledge += 1; break;
  }
  person.energy = clamp(person.energy);
  person.supplies = clamp(person.supplies);
  person.trust = clamp(person.trust);
  if (world.day % 7 === 0 || world.day === 0) {
    addLog(world, `${person.name} chooses to ${action}; their life continues beyond your decisions.`);
  }
}
export function advanceDay(previous, choice = 'wait') {
  if (!ACTIONS.some(action => action.id === choice)) throw new Error('Unknown action');
  if (!isValidWorld(previous)) throw new Error('Invalid world state');
  const world = JSON.parse(JSON.stringify(previous));
  applyPlayerAction(world, choice);
  world.day += 1;
  if (world.day === 0) shockwave(world);
  awaken(world, world.player);
  for (const person of world.people) {
    awaken(world, person);
    npcTurn(world, person);
  }
  updateNature(world);
  world.society.trust = clamp(world.society.trust);
  world.society.knowledge = clamp(world.society.knowledge);
  world.society.scarcity = clamp(world.society.scarcity);
  world.society.concern = clamp(world.society.concern + (world.day >= 0 ? 1 : 0));
  addLog(world, `You chose to ${choice}.`);
  return world;
}
export function isValidWorld(world) {
  return !!world && world.version === SAVE_VERSION && Number.isSafeInteger(world.seed) &&
    Number.isSafeInteger(world.day) && world.day >= START_DAY && world.day <= 100000 &&
    Array.isArray(world.people) && world.people.length === NPC_SEEDS.length &&
    world.people.every(person => person && typeof person.id === 'string' && Number.isInteger(person.actions)) &&
    world.player && Number.isFinite(world.player.energy) &&
    world.society && Number.isFinite(world.society.trust) &&
    world.nature && world.nature.wildlife && world.nature.plants && world.nature.environment &&
    Array.isArray(world.history) && world.history.length <= 60;
}
export function restoreWorld(serialized) {
  try {
    const candidate = JSON.parse(serialized);
    return isValidWorld(candidate) ? candidate : null;
  } catch { return null; }
}
