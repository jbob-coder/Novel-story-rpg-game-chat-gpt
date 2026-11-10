// npm-style no-dependency test suite: node --test tests/turn_engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {verifyNarrativeSnapshot,stageNarrativeTurn} from '../tools/turn_engine.mjs';
import {checkFullNarration,stageNarratorScene} from '../tools/narrative_archive.mjs';
import {startSave,blockSave} from '../tools/save_gate.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(resolve(root,p),'utf8');
const initial={state:JSON.parse(read('game/STATE.json')),manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),events:JSON.parse(read('chapters/CH-000.events.json')),transcript:JSON.parse(read('chapters/CH-000.transcript.json')),chapter:read('chapters/CH-000.md')};
const saveGuard={observed_head:'f'.repeat(40),previous_attempt:null};
const playerTurn={save_guard:saveGuard,key:'test-turn-001',intent:'Jack reviews a public timetable.',outcome:'Jack notices a delayed train.',player_text:'Jack reviews the timetable.\nI study the platforms.',narration_messages:['Jack notices a delayed train.\n\nThe station remains busy.'],elapsed_days:0,offscreen:[{actor_id:'NPC-003',outcome:'Darius finishes a delivery in the commercial district.'},{actor_id:'NPC-001',outcome:'Lena continues to resolve the timetable delay.'}]};
test('current recorded checkpoint validates',()=>assert.equal(verifyNarrativeSnapshot(initial),true));
test('hypothetical novel turn with NPC actions but no XP',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.equal(later.manifest.last_completed_turn,initial.manifest.last_completed_turn+1);assert.equal(later.events.events.length,initial.events.events.length+3);assert.deepEqual(later.events.events.at(-1).caused_by,[]);assert.ok(later.events.events.slice(-3).every(e=>e.progression_awards.length===0));assert.equal(later.state.player.progression.lifetime_skill_xp,initial.state.player.progression.lifetime_skill_xp);assert.equal(verifyNarrativeSnapshot(JSON.parse(JSON.stringify(later))),true);assert.equal(initial.manifest.last_completed_turn,6)});
test('duplicate turn refuses to replay',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.throws(()=>stageNarrativeTurn(later,playerTurn),/Duplicate turn key/)});
test('missing event detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.events.events.pop();assert.throws(()=>verifyNarrativeSnapshot(later),/Event count mismatch/)});
test('corrupt XP detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.state.player.progression.skills.investigation.xp+=10;assert.throws(()=>verifyNarrativeSnapshot(later),/Skill XP tally mismatch/)});
test('future wave crossing forbidden without transition',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,elapsed_days:30}),/Crossing Day 0/));
test('ordinary people never inherit powers pre-wave',()=>{const later=JSON.parse(JSON.stringify(initial));later.state.world.actors['NPC-001'].progression.powers.push('test');assert.throws(()=>verifyNarrativeSnapshot(later),/Powers before Day 0/)});
test('all RPG XP grants are forbidden',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,awards:[{skill:'technology',amount:1,reason:'Old mechanic'}]}),/RPG XP awards disabled/));
test('NPC XP grants are also forbidden',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,offscreen:[{actor_id:'NPC-001',outcome:'Work continues.',awards:[{skill:'technology',amount:1,reason:'Old mechanic'}]}]}),/RPG XP awards disabled/));

test('opening scene is archived verbatim without playing a turn',()=>{const text='Luces del puerto.\n\n—Siguiente salida.';const x=stageNarratorScene(initial,text,'scene-opening-0001',saveGuard);assert.equal(x.transcript.entries[0].text,text);assert.equal(x.manifest.last_completed_turn,initial.manifest.last_completed_turn);assert.equal(initial.transcript.entries.length,14);assert.throws(()=>stageNarratorScene(x,text,'scene-opening-0001',saveGuard),/Scene already saved/)});
test('real turn requires original wording and preserves multiline narration',()=>{const x=stageNarrativeTurn(initial,playerTurn);assert.equal(x.transcript.entries.length,initial.transcript.entries.length+2);assert.equal(x.transcript.entries.at(-2).text,playerTurn.player_text);assert.equal(x.transcript.entries.at(-1).text,playerTurn.narration_messages[0]);assert.equal(x.manifest.last_transcript_sequence,initial.manifest.last_transcript_sequence+2);assert.ok(x.chapter.includes(playerTurn.narration_messages[0]));assert.equal(checkFullNarration(JSON.parse(JSON.stringify(x))),true)});
test('missing original message blocks any turn save',()=>{assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,player_text:null}),/Exact player message required/);assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,narration_messages:[]}),/Exact narrator messages required/)});
test('lost transcript entry is caught',()=>{const x=stageNarrativeTurn(initial,playerTurn);x.transcript.entries.pop();assert.throws(()=>verifyNarrativeSnapshot(x),/Transcript length mismatch/)});
test('existing six-turn verbatim archive is preserved',()=>{assert.equal(initial.transcript.entries.length,14);assert.equal(initial.manifest.last_transcript_sequence,14)});

test('stage player turn requires remote guard status',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,save_guard:null}),/Save guard required/));
test('stage opening scene requires remote guard status',()=>assert.throws(()=>stageNarratorScene(initial,'Scene','scene-test-no-guard'),/Save guard required/));
test('blocked previous save prevents next player turn',()=>{const failed=blockSave(startSave({source_head:'f'.repeat(40),chapter_id:'CH-000',turn:1}),'Network down');assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,save_guard:{observed_head:'f'.repeat(40),previous_attempt:failed}}),/NARRATIVE LOCKED/)});
test('blocked previous save prevents next opening scene',()=>{const failed=blockSave(startSave({source_head:'f'.repeat(40),chapter_id:'CH-000',turn:0}),'Network down');assert.throws(()=>stageNarratorScene(initial,'Scene','scene-test-blocked',{observed_head:'f'.repeat(40),previous_attempt:failed}),/NARRATIVE LOCKED/)});
