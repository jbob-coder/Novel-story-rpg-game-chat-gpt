// Synthetic, in-memory travel only; never copy these turns into story files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageNarrativeTurn,verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {latestTravelReference} from '../tools/living_world_travel.mjs';
import {applyStateChanges} from '../tools/state_changes.mjs';
import {stageLivingWorldTurn,saveLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {savePaths,decodeFiveFiles,recoverJournaledSave} from '../tools/save_transaction.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const initial={state:JSON.parse(read('game/STATE.json')),manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')};
const workshop='LOC-WILSON-WORKSHOP',home='LOC-WILSON-APARTMENT',rail='LOC-RAILGARDEN-RESIDENTIAL',
 market='LOC-COMMERCIAL-DISTRICT',harbor='LOC-HARBOR-WALK';
const route=[workshop,home,rail,market,harbor];
const move=(path,minutes=20,extra={})=>({field:'location_id',before:path[0],after:path.at(-1),route:path,
 travel:{mode:'walk',elapsed_minutes:minutes,basis:'Synthetic contextual estimate for this connected route.',...extra}});
const turn=(snapshot,changes,extra={})=>({save_guard:{observed_head:'a'.repeat(40),previous_attempt:null},
 key:'synthetic-travel-'+(snapshot.manifest.last_completed_turn+1),intent:'Synthetic QA travel.',
 outcome:'Synthetic movement is resolved.',player_text:'SYNTHETIC QA INPUT',
 narration_messages:['SYNTHETIC QA: A street scene visible to Jack.'],elapsed_days:0,elapsed_minutes:20,
 changes,...extra});
const stage=(snapshot,changes,extra={})=>stageNarrativeTurn(snapshot,turn(snapshot,changes,extra));

test('historical checkpoint validates without retrofitted travel estimates',()=>{
 const before=JSON.stringify(initial);
 assert.equal(verifyNarrativeSnapshot(initial),true);
 assert.equal(JSON.stringify(initial),before);
});
test('new exterior movement cannot consume zero minutes or omit its estimate',()=>{
 const before=JSON.stringify(initial);
 assert.throws(()=>stage(initial,[move(route,0)],{elapsed_minutes:0}),/Exterior travel requires positive/);
 const missing=move(route);delete missing.travel;
 assert.throws(()=>stage(initial,[missing]),/Contextual travel estimate required/);
 assert.equal(JSON.stringify(initial),before);
});
test('a short indoor movement may round to zero without invented clock time',()=>{
 const result=stage(initial,[move([workshop,home],0)],{elapsed_minutes:0});
 assert.equal(result.state.player.location_id,home);
 assert.equal(result.state.time.clock_time,null);
 assert.equal(result.state.time.calendar_date,null);
 assert.equal(verifyNarrativeSnapshot(result),true);
});
test('shared city parent does not turn exterior travel into an indoor exception',()=>{
 assert.equal(initial.state.world.locations[home].parent_id,initial.state.world.locations[rail].parent_id);
 assert.throws(()=>stage(initial,[move([workshop,home],0),move([home,rail],0)]),
  /Exterior travel requires positive/);
});
test('estimated movement follows connections and survives literal JSON readback',()=>{
 const change=move(route),result=stage(initial,[change]);
 const event=result.events.events.at(-1);
 assert.deepEqual(event.state_changes[0].travel,change.travel);
 assert.deepEqual(event.state_changes[0].route,route);
 assert.equal(event.turn_elapsed_minutes,20);
 assert.equal(result.state.player.location_id,harbor);
 assert.ok(result.state.player.inventory.filter(item=>item.carried).every(item=>item.location_id===harbor));
 assert.equal(verifyNarrativeSnapshot(JSON.parse(JSON.stringify(result))),true);
 assert.throws(()=>stage(initial,[move([workshop,harbor])]),/Nonadjacent/);
});
test('each actor needs time for the sum of their successive movements',()=>{
 assert.throws(()=>stage(initial,[move([workshop,home,rail],12),move([rail,market],12)]),
  /Sequential actor travel exceeds turn duration/);
 assert.doesNotThrow(()=>stage(initial,[move([workshop,home,rail],12),move([rail,market],8)]));
});
test('different actors may travel concurrently without exposing private estimates',()=>{
 const secret='SYNTHETIC PRIVATE ROUTE CONTEXT';
 const result=stage(initial,[move(route,20)],{offscreen:[{actor_id:'NPC-005',
  outcome:'Rosa independently travels along an established public route.',
  changes:[move([home,rail],20,{basis:secret})]}]});
 assert.equal(result.state.world.actors['NPC-005'].location_id,rail);
 assert.deepEqual(result.events.events.at(-1).known_to,['NPC-005']);
 assert.ok(!result.chapter.includes(secret));
 assert.ok(!result.transcript.entries.at(-1).text.includes(secret));
 assert.equal(verifyNarrativeSnapshot(result),true);
});
test('movement requires a valid turn budget even through the lower-level engine',()=>{
 for(const elapsed_minutes of [undefined,-1,1.5,NaN])
  assert.throws(()=>stage(initial,[move(route)],{elapsed_minutes}),/Travel turn requires approximate elapsed minutes/);
});
test('subsequent comparable travel must cite its latest prior event',()=>{
 const first=stage(initial,[move(route)]),firstId=first.events.events.at(-1).id;
 const back=stage(first,[move(route.toReversed())]);
 assert.deepEqual(latestTravelReference({events:back.events.events,actorId:'PLAYER-001',route,mode:'walk'}),
  {event_id:firstId,travel:move(route).travel});
 assert.throws(()=>stage(back,[move(route)]),/Latest comparable travel reference required/);
 assert.throws(()=>stage(back,[move(route,20,{reference_event_id:'EV-999999'})]),/Latest comparable/);
 const again=stage(back,[move(route,20,{reference_event_id:firstId})]);
 const againId=again.events.events.at(-1).id;
 const returnId=back.events.events.at(-1).id;
 const backAgain=stage(again,[move(route.toReversed(),20,{reference_event_id:returnId})]);
 assert.throws(()=>stage(backAgain,[move(route,20,{reference_event_id:firstId})]),/Latest comparable/);
 assert.doesNotThrow(()=>stage(backAgain,[move(route,20,{reference_event_id:againId})]));
});
test('changed duration needs a contextual explanation, not a new permanent distance',()=>{
 const first=stage(initial,[move(route)]),reference_event_id=first.events.events.at(-1).id;
 const back=stage(first,[move(route.toReversed())]);
 assert.throws(()=>stage(back,[move(route,30,{reference_event_id})],{elapsed_minutes:30}),
  /Changed travel estimate requires contextual explanation/);
 const result=stage(back,[move(route,30,{reference_event_id,variation_reason:'Synthetic stop at a crossing.'})],
  {elapsed_minutes:30});
 assert.equal(result.events.events.at(-1).state_changes[0].travel.elapsed_minutes,30);
 assert.deepEqual(result.state.world.locations,initial.state.world.locations);
});
test('route references cannot borrow a different actor, direction or transport mode',()=>{
 const first=stage(initial,[move(route)]),reference_event_id=first.events.events.at(-1).id;
 assert.throws(()=>stage(first,[move(route.toReversed(),20,{reference_event_id})]),/no comparable prior event/);
 const back=stage(first,[move(route.toReversed())]);
 assert.throws(()=>stage(back,[move(route,20,{mode:'bus',reference_event_id})]),/no comparable prior event/);
 assert.equal(latestTravelReference({events:first.events.events,actorId:'NPC-005',route,mode:'walk'}),null);
});
test('readback rejects stripped estimates, impossible budgets and changed references',()=>{
 const result=stage(initial,[move(route)]);
 for(const corrupt of [
  x=>delete x.events.events.at(-1).state_changes[0].travel,
  x=>{x.events.events.at(-1).turn_elapsed_minutes=10},
  x=>{x.events.events.at(-1).state_changes[0].travel.reference_event_id='EV-999999'}
 ]){
  const copy=structuredClone(result);corrupt(copy);
  assert.throws(()=>verifyNarrativeSnapshot(copy));
 }
});
test('invalid travel metadata leaves the whole low-level change batch untouched',()=>{
 const state=structuredClone(initial.state),before=JSON.stringify(state);
 const record={id:'EV-000030',actor_ids:['PLAYER-001'],state_changes:[]};
 assert.throws(()=>applyStateChanges(state,record,[
  {field:'conditions',before:state.player.conditions,after:['synthetic condition']},
  move(route,-1)
 ]),/Invalid approximate travel minutes/);
 assert.equal(JSON.stringify(state),before);
 assert.deepEqual(record.state_changes,[]);
});

test('coordinator persists approximate travel and recovers the same scene after a fresh session',async()=>{
 const source='a'.repeat(40),commit='b'.repeat(40),branch='qa/contextual-travel';
 const paths=savePaths('CH-000'),originals=Object.fromEntries(paths.map(path=>[path,read(path)]));
 let head=source,created=0,updated=0,journalWrites=0,entry=null;
 const commits=new Map([[source,originals]]);
 const remote={
  async readHead(){return head},
  async readFiles(sha,wanted){return Object.fromEntries(wanted.map(path=>[path,commits.get(sha)[path]]))},
  async createCommit({parentSha,files}){
   assert.equal(parentSha,source);commits.set(commit,structuredClone(files));created++;return commit;
  },
  async updateHead({expectedSha,newSha}){assert.equal(head,expectedSha);head=newSha;updated++;return true}
 };
 const journal={async read(){return structuredClone(entry)},
  async write(_branch,value){entry=structuredClone(value);journalWrites++}};
 const {save_guard,...action}=turn(initial,[move(route)]);
 const saved=await saveLivingWorldTurn({remote,journal,branch,chapterId:'CH-000',turn:action});
 assert.equal(saved.status,'verified',saved.reason);
 const snapshot=decodeFiveFiles(commits.get(commit),'CH-000');
 assert.equal(snapshot.state.time.elapsed_minutes_since_opening_approx,
  initial.state.time.elapsed_minutes_since_opening_approx+20);
 assert.equal(snapshot.state.time.time_of_day,'morning');
 assert.deepEqual(snapshot.events.events.at(-1).state_changes[0].travel,move(route).travel);
 const writesBefore=[created,updated,journalWrites];
 const recovered=await recoverJournaledSave({remote,journal,branch});
 assert.equal(recovered.status,'verified',recovered.reason);
 assert.deepEqual(recovered.narration_messages,action.narration_messages);
 assert.deepEqual([created,updated,journalWrites],writesBefore);
 assert.deepEqual(commits.get(source),originals);
});

test('coordinator rejects exterior travel that exceeds the interval without remote writes',async()=>{
 const {save_guard,...action}=turn(initial,[move(route,30)]);
 assert.throws(()=>stageLivingWorldTurn({snapshot:initial,turn:action,observedHead:'a'.repeat(40)}),
  /Sequential actor travel exceeds turn duration/);
 let writes=0;
 const remote={async readHead(){return 'a'.repeat(40)},
  async readFiles(_sha,paths){return Object.fromEntries(paths.map(path=>[path,read(path)]))},
  async createCommit(){writes++;return 'b'.repeat(40)},async updateHead(){writes++;return true}};
 const saved=await saveLivingWorldTurn({remote,branch:'qa/invalid-travel',chapterId:'CH-000',turn:action});
 assert.equal(saved.status,'blocked');assert.match(saved.reason,/Sequential actor travel/);
 assert.equal(writes,0);
});
