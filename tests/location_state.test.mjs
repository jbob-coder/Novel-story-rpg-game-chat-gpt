import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyStateChanges,verifyStateChanges} from '../tools/state_changes.mjs';
import {validateLocationState,verifyLocationStateHistory,locationAvailability,
 inspectLocationState} from '../tools/location_state.mjs';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const baseline=JSON.parse(read('game/STATE.json'));
const place='LOC-CAFE-BRUMA';
const record=(event,overrides={})=>({operating_status:'unknown',physical_condition:'unknown',
 opening_hours:null,note:'SYNTHETIC reviewed change to the business.',last_change_event_id:event,
 ...overrides});
const make=()=>({state:structuredClone(baseline),events:{events:[]}});
function event(snapshot,n,actor='NPC-007'){
 const value={id:'EV-'+String(n).padStart(6,'0'),chapter_id:'CH-000',turn:n+9,
  actor_ids:[actor],state_changes:[]};
 snapshot.events.events.push(value);return value;
}
const change=(before,after)=>({field:'location_state',location_id:place,before,after});
function set(snapshot,n,overrides={},actor='NPC-007'){
 const e=event(snapshot,n,actor),before=snapshot.state.world.location_states?.[place]??null;
 applyStateChanges(snapshot.state,e,[change(before,record(e.id,overrides))]);
 return e;
}

test('an authored location has no invented operating state, hours or access',()=>{
 const s=make(),before=JSON.stringify(s);
 assert.equal(verifyLocationStateHistory(s),true);
 assert.deepEqual(locationAvailability({state:s.state,locationId:place}),
  {status:'unknown',source:'no_recorded_location_state',eventId:null});
 assert.equal(inspectLocationState({state:s.state,locationId:place}).state,null);
 assert.equal(JSON.stringify(s),before);
});

test('different actors can close, damage and reopen one building without changing its design or knowledge',()=>{
 const s=make(),design=structuredClone(s.state.world.locations),player=structuredClone(s.state.player);
 set(s,1,{operating_status:'temporarily_closed'});
 assert.equal(locationAvailability({state:s.state,locationId:place}).status,'closed');
 set(s,2,{operating_status:'temporarily_closed',physical_condition:'damaged'},s.state.player.id);
 set(s,3,{operating_status:'operating',physical_condition:'under_repair'},'NPC-006');
 assert.equal(locationAvailability({state:s.state,locationId:place}).status,'unknown');
 assert.equal(verifyLocationStateHistory(s),true);
 assert.equal(verifyStateChanges(s),true);
 assert.deepEqual(s.state.world.locations,design);
 assert.deepEqual(s.state.player,player);
 assert.ok(s.events.events.every(e=>e.state_changes[0].after.last_change_event_id===e.id));
});

test('confirmed hours use real weekday/minute evidence while closures override posted hours',()=>{
 const s=make(),hours={confirmed:true,weekdays:{'0':[],'1':[[540,1020]]}};
 set(s,1,{operating_status:'operating',opening_hours:hours});
 assert.equal(locationAvailability({state:s.state,locationId:place}).status,'unknown');
 assert.equal(locationAvailability({state:s.state,locationId:place,weekday:1,minute:600}).status,'open');
 assert.equal(locationAvailability({state:s.state,locationId:place,weekday:1,minute:1100}).status,'closed');
 assert.equal(locationAvailability({state:s.state,locationId:place,weekday:2,minute:600}).status,'unknown');
 set(s,2,{operating_status:'temporarily_closed',opening_hours:hours});
 const closed=locationAvailability({state:s.state,locationId:place,weekday:1,minute:600});
 assert.equal(closed.status,'closed');assert.equal(closed.source,'recorded_location_closure');
 assert.equal(verifyLocationStateHistory(s),true);
});

test('overnight hours preserve next-day availability without inventing a weekday from relative day',()=>{
 const s=make();
 set(s,1,{opening_hours:{confirmed:true,weekdays:{'0':[[1320,1560]],'1':[]}}});
 assert.equal(locationAvailability({state:s.state,locationId:place,weekday:1,minute:60}).status,'open');
 assert.equal(locationAvailability({state:s.state,locationId:place,weekday:-29,minute:60}).status,'unknown');
});

test('mutable records reject geometry, unconfirmed hours, invalid intervals and missing causal notes',()=>{
 for(const bad of [
  {...record('EV-000001'),connected_ids:['LOC-HARBOR-WALK']},
  record('EV-000001',{opening_hours:{confirmed:false,weekdays:{'1':[[540,1020]]}}}),
  record('EV-000001',{opening_hours:{confirmed:true,weekdays:{'7':[]}}}),
  record('EV-000001',{opening_hours:{confirmed:true,weekdays:{'1':[[1020,540]]}}}),
  record('EV-000001',{opening_hours:{confirmed:true,weekdays:{'1':[[540,2500]]}}}),
  record('EV-000001',{note:''}),record('EV-000001',{operating_status:'open'})
 ])assert.throws(()=>validateLocationState(bad));
});

test('stale or wrongly attributed changes leave both actor and location batches untouched',()=>{
 const s=make();set(s,1,{operating_status:'temporarily_closed'});
 const e=event(s,2),before=JSON.stringify(s.state);
 const oldPlan=s.state.world.actors['NPC-007'].independent_plan;
 assert.throws(()=>applyStateChanges(s.state,e,[
  {field:'independent_plan',before:oldPlan,after:'Synthetic changed plan'},
  change(null,record(e.id,{operating_status:'operating'}))]),/Stale mutable/);
 assert.equal(JSON.stringify(s.state),before);assert.deepEqual(e.state_changes,[]);
 assert.throws(()=>applyStateChanges(s.state,e,[change(s.state.world.location_states[place],record('EV-000001'))]),
  /own actual event/);
 assert.equal(JSON.stringify(s.state),before);
});

test('a failed later actor effect rolls back an earlier mutable-location effect',()=>{
 const s=make(),e=event(s,1),before=JSON.stringify(s.state);
 assert.throws(()=>applyStateChanges(s.state,e,[change(null,record(e.id)),
  {field:'independent_plan',before:'Not the saved plan',after:'Synthetic new plan'}]),/Stale NPC/);
 assert.equal(JSON.stringify(s.state),before);assert.deepEqual(e.state_changes,[]);
 assert.equal(s.state.world.location_states,undefined);
});

test('orphan state, rewritten history and missing or unknown destinations fail readback',()=>{
 const original=make();set(original,1,{operating_status:'temporarily_closed'});
 for(const mutate of [
  s=>{s.events.events=[];},
  s=>{s.state.world.location_states[place].operating_status='operating';},
  s=>{delete s.state.world.location_states[place];},
  s=>{s.events.events[0].state_changes[0].before=record('EV-000000');},
  s=>{s.events.events[0].state_changes[0].actor_id=s.state.player.id;},
  s=>{s.state.world.location_states['LOC-NOT-ESTABLISHED']=record('EV-000001');}
 ]){const s=structuredClone(original);mutate(s);assert.throws(()=>verifyLocationStateHistory(s));}
});

test('closed-chapter events preserve location state and reports cannot mutate it',()=>{
 const s=make();set(s,1,{physical_condition:'damaged'});
 s.state.history.completed_chapters=[{id:'CH-000'}];
 s.archives={'CH-000':{events:s.events,transcript:{entries:[]}}};
 s.events={events:[]};
 const before=JSON.stringify(s);
 assert.equal(verifyLocationStateHistory(s),true);
 const report=inspectLocationState({state:s.state,locationId:place});
 report.state.physical_condition='intact';
 assert.equal(report.classification,'narrator_private_location_state');
 assert.equal(JSON.stringify(s),before);
});

test('the normal NPC turn coordinator records a closure without telling Jack or changing the catalog',()=>{
 const snapshot={state:structuredClone(baseline),manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
  events:JSON.parse(read('chapters/CH-000.events.json')),
  transcript:JSON.parse(read('chapters/CH-000.transcript.json')),chapter:read('chapters/CH-000.md')};
 const e='EV-'+String(snapshot.manifest.last_event_sequence+2).padStart(6,'0');
 const next=stageLivingWorldTurn({snapshot,observedHead:'a'.repeat(40),turn:{
  key:'synthetic-location-state',player_text:'SYNTHETIC: stay at the bench.',
  intent:'A quiet synthetic interval.',outcome:'The workbench stays quiet.',
  narration_messages:['SYNTHETIC: daylight remains across the workbench.'],
  elapsed_days:0,elapsed_minutes:20
 },npcResolutions:[{actor_id:'NPC-007',reviewed:true,resolved:true,
  causal_basis:'SYNTHETIC: the barista records a temporary maintenance closure.',
  outcome:'SYNTHETIC: the café closes its public service temporarily.',
  changes:[change(null,record(e,{operating_status:'temporarily_closed'}))]}]});
 assert.equal(locationAvailability({state:next.state,locationId:place}).status,'closed');
 assert.deepEqual(next.state.world.locations,snapshot.state.world.locations);
 assert.deepEqual(next.state.player.knowledge,snapshot.state.player.knowledge);
 assert.ok(!next.transcript.entries.at(-1).text.includes('closure'));
 assert.equal(verifyStateChanges(next),true);
});
