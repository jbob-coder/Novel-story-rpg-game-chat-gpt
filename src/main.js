import { createWorld, advanceDay, availableActions, restoreWorld } from './simulation.js';

const STORAGE_KEY = 'living-superhuman-world-v1';
const byId = id => document.getElementById(id);
function load() {
  try { return restoreWorld(localStorage.getItem(STORAGE_KEY)) ?? createWorld(); }
  catch { return createWorld(); }
}
let world = load();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(world)); }
  catch { byId('save-note').textContent = 'Storage unavailable: progress lasts only this session.'; }
}
function text(id, value) { byId(id).textContent = value; }
function render() {
  text('day', world.day < 0 ? `Day ${world.day} · Before the wave` : `Day +${world.day} · After the wave`);
  text('player', `Energy ${world.player.energy} · Supplies ${world.player.supplies} · Relationships ${world.player.relationships} · Ability ${world.player.power ?? 'none'}`);
  text('society', `Public trust ${world.society.trust} · Concern ${world.society.concern} · Knowledge ${world.society.knowledge}`);
  text('nature', world.day < 0 ? 'Wildlife, plants and environment: ordinary.' :
    `Wildlife changes ${world.nature.wildlife.changes} · Plant changes ${world.nature.plants.changes} · Environmental anomalies ${world.nature.environment.anomalies}`);
  const actors = byId('actors');
  actors.replaceChildren(...world.people.map(person => {
    const li = document.createElement('li');
    li.textContent = `${person.name} (${person.job}) · ${person.lastAction} · Ability: ${person.power ?? 'none'}`;
    return li;
  }));
  const history = byId('history');
  history.replaceChildren(...world.history.slice(0, 18).map(entry => {
    const li = document.createElement('li');
    li.textContent = `Day ${entry.day}: ${entry.message}`;
    return li;
  }));
}
const choices = byId('choices');
for (const action of availableActions()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = action.label;
  button.title = action.detail;
  button.addEventListener('click', () => {
    world = advanceDay(world, action.id);
    save();
    render();
  });
  choices.append(button);
}
byId('restart').addEventListener('click', () => {
  if (!window.confirm('Start a new world and replace the current saved progress?')) return;
  world = createWorld();
  save();
  render();
});
render();
