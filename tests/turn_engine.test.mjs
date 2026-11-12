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
test('hypothetical novel turn with NPC actions but no XP',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.equal(later.manifest.last_completed_turn,initial.manifest.last_completed_turn+1);assert.equal(later.events.events.length,initial.events.events.length+3);assert.deepEqual(later.events.events.at(-1).caused_by,[]);assert.ok(later.events.events.slice(-3).every(e=>e.progression_awards.length===0));assert.equal(later.state.player.progression.lifetime_skill_xp,initial.state.player.progression.lifetime_skill_xp);assert.equal(verifyNarrativeSnapshot(JSON.parse(JSON.stringify(later))),true);assert.equal(initial.manifest.last_completed_turn,initial.state.save.last_verified_turn)});
test('duplicate turn refuses to replay',()=>{const later=stageNarrativeTurn(initial,playerTurn);assert.throws(()=>stageNarrativeTurn(later,playerTurn),/Duplicate turn key/)});
test('missing event detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.events.events.pop();assert.throws(()=>verifyNarrativeSnapshot(later),/Event count mismatch/)});
test('corrupt XP detected',()=>{const later=stageNarrativeTurn(initial,playerTurn);later.state.player.progression.skills.investigation.xp+=10;assert.throws(()=>verifyNarrativeSnapshot(later),/Skill XP tally mismatch/)});
test('future wave crossing forbidden without transition',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,elapsed_days:30}),/Crossing Day 0/));
test('ordinary people never inherit powers pre-wave',()=>{const later=JSON.parse(JSON.stringify(initial));later.state.world.actors['NPC-001'].progression.powers.push('test');assert.throws(()=>verifyNarrativeSnapshot(later),/Powers before Day 0/)});
test('all RPG XP grants are forbidden',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,awards:[{skill:'technology',amount:1,reason:'Old mechanic'}]}),/RPG XP awards disabled/));
test('NPC XP grants are also forbidden',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,offscreen:[{actor_id:'NPC-001',outcome:'Work continues.',awards:[{skill:'technology',amount:1,reason:'Old mechanic'}]}]}),/RPG XP awards disabled/));

test('opening scene is archived verbatim without playing a turn',()=>{const text='Luces del puerto.\n\n—Siguiente salida.';const x=stageNarratorScene(initial,text,'scene-opening-0001',saveGuard);assert.equal(x.transcript.entries.at(-1).text,text);assert.equal(x.manifest.last_completed_turn,initial.manifest.last_completed_turn);assert.equal(initial.transcript.entries.length,initial.manifest.last_transcript_sequence);assert.throws(()=>stageNarratorScene(x,text,'scene-opening-0001',saveGuard),/Scene already saved/)});
test('real turn requires original wording and preserves multiline narration',()=>{const x=stageNarrativeTurn(initial,playerTurn);assert.equal(x.transcript.entries.length,initial.transcript.entries.length+2);assert.equal(x.transcript.entries.at(-2).text,playerTurn.player_text);assert.equal(x.transcript.entries.at(-1).text,playerTurn.narration_messages[0]);assert.equal(x.manifest.last_transcript_sequence,initial.manifest.last_transcript_sequence+2);assert.ok(x.chapter.includes(playerTurn.narration_messages[0]));assert.equal(checkFullNarration(JSON.parse(JSON.stringify(x))),true)});
test('missing original message blocks any turn save',()=>{assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,player_text:null}),/Exact player message required/);assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,narration_messages:[]}),/Exact narrator messages required/)});
test('lost transcript entry is caught',()=>{const x=stageNarrativeTurn(initial,playerTurn);x.transcript.entries.pop();assert.throws(()=>verifyNarrativeSnapshot(x),/Transcript length mismatch/)});
test('all recorded turns remain in the literal archive',()=>{assert.equal(initial.transcript.entries.length,initial.manifest.last_transcript_sequence);assert.ok(initial.transcript.entries.some(x=>x.id==='TXT-000015'&&x.role==='player'));assert.ok(initial.transcript.entries.some(x=>x.id==='TXT-000016'&&x.kind==='resolution'))});

test('stage player turn requires remote guard status',()=>assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,save_guard:null}),/Save guard required/));
test('stage opening scene requires remote guard status',()=>assert.throws(()=>stageNarratorScene(initial,'Scene','scene-test-no-guard'),/Save guard required/));
test('blocked previous save prevents next player turn',()=>{const failed=blockSave(startSave({source_head:'f'.repeat(40),chapter_id:'CH-000',turn:1}),'Network down');assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,save_guard:{observed_head:'f'.repeat(40),previous_attempt:failed}}),/NARRATIVE LOCKED/)});
test('blocked previous save prevents next opening scene',()=>{const failed=blockSave(startSave({source_head:'f'.repeat(40),chapter_id:'CH-000',turn:0}),'Network down');assert.throws(()=>stageNarratorScene(initial,'Scene','scene-test-blocked',{observed_head:'f'.repeat(40),previous_attempt:failed}),/NARRATIVE LOCKED/)});

test('player movement updates carried inventory and records each effect',()=>{
 const original=initial.state.player.location_id;
 const destination=original==='LOC-WILSON-WORKSHOP'?'LOC-WILSON-APARTMENT':'LOC-WILSON-WORKSHOP';
 const x=stageNarrativeTurn(initial,{...playerTurn,offscreen:[],changes:[{field:'location_id',before:original,after:destination}]});
 assert.equal(x.state.player.location_id,destination);
 assert.ok(x.state.player.inventory.filter(item=>item.carried).every(item=>item.location_id===destination));
 assert.ok(x.events.events.at(-1).state_changes.some(c=>c.field==='inventory_item'&&c.automatic_carry));
 assert.equal(verifyNarrativeSnapshot(x),true);
 assert.equal(initial.state.player.location_id,original);
});
test('NPC changes record relationship, plans and knowledge without RPG advancement',()=>{
 const current=initial.state.world.actors['NPC-004'];
 const x=stageNarrativeTurn(initial,{...playerTurn,offscreen:[{actor_id:'NPC-004',outcome:'Elena continues preparing her drawing.',learned_fact:'The drawing is backed up',source:'Elena saved it herself',changes:[{field:'relationship',target_actor_id:'PLAYER-001',before:current.relationships['PLAYER-001'],after:{...current.relationships['PLAYER-001'],latest_shared_moment:'They discussed a drawing backup'}},{field:'independent_plan',before:current.independent_plan,after:'Prepare her presentation for school'}]}]});
 const npc=x.state.world.actors['NPC-004'];
 assert.equal(npc.independent_plan,'Prepare her presentation for school');
 assert.ok(npc.knowledge.some(value=>value.includes('The drawing is backed up')));
 assert.equal(npc.relationships['PLAYER-001'].latest_shared_moment,'They discussed a drawing backup');
 assert.equal(verifyNarrativeSnapshot(x),true);
});
test('invalid or stale state changes never modify the original save',()=>{
 const original=initial.state.player.location_id;
 assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,changes:[{field:'location_id',before:'LOC-CROSSWATER-PLAZA',after:'LOC-WILSON-APARTMENT'}]}),/Stale actor location/);
 assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,changes:[{field:'progression',before:48,after:49}]}),/Unsupported state change/);
 assert.equal(initial.manifest.last_completed_turn,initial.state.save.last_verified_turn);
 assert.equal(initial.state.player.location_id,original);
});
test('a saved relationship differing from its event is rejected',()=>{
 const old=initial.state.player.relationships['NPC-004'];
 const x=stageNarrativeTurn(initial,{...playerTurn,offscreen:[],changes:[{field:'relationship',target_actor_id:'NPC-004',before:old,after:{...old,bond:'closer'}}]});
 x.state.player.relationships['NPC-004'].bond='unrelated';
 assert.throws(()=>verifyNarrativeSnapshot(x),/Saved state differs from recorded relationship/);
});
test('material changes cannot create duplicate inventory ownership',()=>{
 const phone=initial.state.player.inventory.find(item=>item.id==='ITEM-PHONE');
 assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,offscreen:[{actor_id:'NPC-004',outcome:'Elena finds a phone.',changes:[{field:'inventory_item',item_id:'ITEM-PHONE',before:null,after:{...phone,location_id:initial.state.world.actors['NPC-004'].location_id}}]}]}),/Duplicate inventory ID/);
});
test('reloaded narrated turn retains precise original player message and its event effects',()=>{
 const x=stageNarrativeTurn(initial,{...playerTurn,offscreen:[],changes:[{field:'conditions',before:[],after:['tired']}]});
 const recovered=JSON.parse(JSON.stringify(x));
 assert.equal(recovered.transcript.entries.at(-2).text,playerTurn.player_text);
 assert.deepEqual(recovered.state.player.conditions,['tired']);
 assert.equal(recovered.events.events.at(-1).state_changes[0].field,'conditions');
 assert.equal(verifyNarrativeSnapshot(recovered),true);
});

test('offscreen NPC events are saved privately without chapter spoilers',()=>{
 const privateOutcome='PRIVATE-NEIGHBOR-ROUTE-UNSHARED-002: Rosa changes a private plan.';
 const x=stageNarrativeTurn(initial,{...playerTurn,offscreen:[
   {actor_id:'NPC-005',outcome:privateOutcome,changes:[]}
 ],narration_messages:['El taller sigue silencioso.']});
 assert.equal(x.events.events.at(-1).outcome,privateOutcome);
 assert.equal(x.state.world.actors['NPC-005'].last_resolved_action.summary,privateOutcome);
 assert.ok(!x.chapter.includes(privateOutcome),'Private offscreen event leaked through the chapter');
 assert.ok(!x.transcript.entries.at(-1).text.includes(privateOutcome),'Narrator text leaked an offscreen event');
 assert.equal(verifyNarrativeSnapshot(x),true);
});

test('private technical outcome cannot leak via public chapter footer',()=>{
 const secret='PRIVATE-ACTOR-DETAIL-UNKNOWABLE-0001';
 const x=stageNarrativeTurn(initial,{...playerTurn,
  outcome:'A quiet public moment. '+secret,
  offscreen:[{actor_id:'NPC-005',outcome:secret}],
  narration_messages:['Jack can only hear the workshop fan.']});
 assert.equal(x.events.events.at(-1).outcome,secret);
 assert.ok(!x.chapter.includes(secret));
 assert.ok(!x.chapter.slice(initial.chapter.length).includes("**Outcome:**"));
});
test('narrator copying a private NPC outcome verbatim is blocked',()=>{
 const secret='ROSA-SECRET-NO-PLAYER-KNOWLEDGE-0001';
 assert.throws(()=>stageNarrativeTurn(initial,{...playerTurn,
  offscreen:[{actor_id:'NPC-005',outcome:secret}],
  narration_messages:['Jack somehow learns: '+secret]}),/Private NPC outcome leaked/);
});
