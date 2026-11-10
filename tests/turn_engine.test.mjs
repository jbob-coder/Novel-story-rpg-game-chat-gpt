// npm-style no-dependency test suite: node --test tests/turn_engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {verifyNarrativeSnapshot,stageNarrativeTurn} from '../tools/turn_engine.mjs';
import {checkFullNarration,stageNarratorScene} from '../tools/narrative_archive.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');
const initial={state:JSON.parse(read('game/STATE.json')),manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),events:JSON.parse(read('chapters/CH-000.events.json')),transcript:JSON.parse(read('chapters/CH-000.transcript.json')),chapter:read('chapters/CH-000.md')};
const playerTurn={key:'test-turn-001',intent:'Jack reviews a public timetable.',outcome:'Jack notices a delayed train.',player_text:'Jack reviews the timetable.\nI study the platforms.',narration_messages:['Jack notices a delayed train.\n\nThe station remains busy.'],elapsed_days:0,awards:[{skill:'investigation',amount:1,reason:'He compares the listed departures carefully.'}],offscreen:[{actor_id:'NPC-003',outcome:'Darius walks to Market Row to finish a delivery.',new_location_id:'LOC-COMMERCIAL-DISTRICT'},{actor_id:'NPC-001',outcome:'Lena continues to resolve the timetable delay.'}]};
test('restored real setup checkpoint validates',()=>assert.equal(verifyNarrativeSnapshot(initial),true));
test('hypothetical turn with NPC actions + progression',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.equal(later.manifest.last_completed_turn,1);assert.equal(later.events.events.length,3);assert.deepEqual(later.events.events[1].caused_by,[]);assert.deepEqual(later.events.events[2].caused_by,[]);assert.equal(later.state.player.progression.skills.investigation.xp,9);assert.equal(verifyNarrativeSnapshot(JSON.parse(JSON.stringify(later))),true);assert.equal(initial.manifest.last_completed_turn,0)});
test('duplicate turn refuses to replay',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.throws(()=>stageNarrativeTurn(later,playerTurn),/Duplicate turn key/)});
test('missing event detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.events.events.pop();assert.throws(()=>verifyNarrativeSnapshot(later),/Event count mismatch/)});
test('corrupt XP detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.state.player.progression.skills.investigation.xp+=10;assert.throws(()=>verifyNarrativeSnapshot(later),/Skill XP tally mismatch/)});
test('future wave crossing forbidden without transition',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,elapsed_days:30}),/Crossing Day 0/));
test('ordinary people never inherit powers pre-wave',()=>{const later=JSON.parse(JSON.stringify(initial));later.state.world.actors['NPC-001'].progression.powers.push('test');assert.throws(()=>verifyNarrativeSnapshot(later),/Powers before Day 0/)});
test('no unsupported XP grants',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,awards:[{skill:'technology',amount:50,reason:'Trying to cheat skill XP.'}]}),/Skill award/));

test('opening scene is archived verbatim without playing a turn',()=>{const text='Luces del puerto.\n\n—Siguiente salida.';const x=stageNarratorScene(initial,text,'scene-opening-0001');assert.equal(x.transcript.entries[0].text,text);assert.equal(x.manifest.last_completed_turn,0);assert.equal(initial.transcript.entries.length,0);assert.throws(()=>stageNarratorScene(x,text,'scene-opening-0001'),/Scene already saved/)});
test('real turn requires original wording and preserves multiline narration',()=>{const x=stageNarrativeTurn(initial,playerTurn);assert.equal(x.transcript.entries.length,2);assert.equal(x.transcript.entries[0].text,playerTurn.player_text);assert.equal(x.transcript.entries[1].text,playerTurn.narration_messages[0]);assert.equal(x.manifest.last_transcript_sequence,2);assert.ok(x.chapter.includes(playerTurn.narration_messages[0]));assert.equal(checkFullNarration(JSON.parse(JSON.stringify(x))),true)});
test('missing original message blocks any turn save',()=>{assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,player_text:null}),/Exact player message required/);assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,narration_messages:[]}),/Exact narrator messages required/)});
test('lost transcript entry is caught',()=>{const x=stageNarrativeTurn(initial,playerTurn);x.transcript.entries.pop();assert.throws(()=>verifyNarrativeSnapshot(x),/Transcript length mismatch/)});
test('history archive is for real narrative, not synthetic project chat',()=>{assert.equal(initial.transcript.entries.length,0);assert.equal(initial.manifest.last_transcript_sequence,0)});
