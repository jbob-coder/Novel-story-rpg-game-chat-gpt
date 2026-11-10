// npm-style no-dependency test suite: node --test tests/turn_engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {verifyNarrativeSnapshot,stageNarrativeTurn} from '../tools/turn_engine.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');
const initial={state:JSON.parse(read('game/STATE.json')),manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),events:JSON.parse(read('chapters/CH-000.events.json')),chapter:read('chapters/CH-000.md')};
const playerTurn={key:'test-turn-001',intent:'Jack reviews a public timetable.',outcome:'Jack notices a delayed train.',elapsed_days:0,awards:[{skill:'investigation',amount:1,reason:'He compares the listed departures carefully.'}],offscreen:[{actor_id:'NPC-003',outcome:'Darius walks to Market Row to finish a delivery.',new_location_id:'LOC-COMMERCIAL-DISTRICT'},{actor_id:'NPC-001',outcome:'Lena continues to resolve the timetable delay.'}]};
test('restored real setup checkpoint validates',()=>assert.equal(verifyNarrativeSnapshot(initial),true));
test('hypothetical turn with NPC actions + progression',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.equal(later.manifest.last_completed_turn,1);assert.equal(later.events.events.length,3);assert.deepEqual(later.events.events[1].caused_by,[]);assert.deepEqual(later.events.events[2].caused_by,[]);assert.equal(later.state.player.progression.skills.investigation.xp,9);assert.equal(verifyNarrativeSnapshot(JSON.parse(JSON.stringify(later))),true);assert.equal(initial.manifest.last_completed_turn,0)});
test('duplicate turn refuses to replay',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.throws(()=>stageNarrativeTurn(later,playerTurn),/Duplicate turn key/)});
test('missing event detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.events.events.pop();assert.throws(()=>verifyNarrativeSnapshot(later),/Event count mismatch/)});
test('corrupt XP detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.state.player.progression.skills.investigation.xp+=10;assert.throws(()=>verifyNarrativeSnapshot(later),/Skill XP tally mismatch/)});
test('future wave crossing forbidden without transition',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,elapsed_days:30}),/Crossing Day 0/));
test('ordinary people never inherit powers pre-wave',()=>{const later=JSON.parse(JSON.stringify(initial));later.state.world.actors['NPC-001'].progression.powers.push('test');assert.throws(()=>verifyNarrativeSnapshot(later),/Powers before Day 0/)});
test('no unsupported XP grants',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,awards:[{skill:'technology',amount:50,reason:'Trying to cheat skill XP.'}]}),/Skill award/));
