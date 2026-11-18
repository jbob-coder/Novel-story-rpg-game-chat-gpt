// Mutable, event-backed conditions sit beside immutable location design.
// A map entry never establishes opening hours, damage or current availability.
import {isDeepStrictEqual as same} from 'node:util';
import {allEvents} from './chapter_history.mjs';
import {availability} from './living_world_availability.mjs';

const insist=(ok,message)=>{if(!ok)throw Error(message);};
const clone=value=>structuredClone(value);
const eventId=value=>typeof value==='string'&&/^EV-\d{6,}$/.test(value);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const recordKeys=['operating_status','physical_condition','opening_hours','note','last_change_event_id'];
const changeKeys=new Set(['actor_id','field','location_id','before','after']);
const operating=new Set(['unknown','operating','temporarily_closed','permanently_closed']);
const condition=new Set(['unknown','intact','damaged','under_repair']);
const owns=(state,id)=>typeof id==='string'&&id.startsWith('LOC-')&&
 Object.hasOwn(state?.world?.locations??{},id);
const knownActor=(state,id)=>id===state?.player?.id||Object.hasOwn(state?.world?.actors??{},id);

function validateHours(hours){
 if(hours===null)return;
 insist(object(hours)&&Object.keys(hours).length===2&&hours.confirmed===true&&
  Object.hasOwn(hours,'weekdays')&&object(hours.weekdays),
  'Location hours require a confirmed weekday schedule');
 const days=Object.keys(hours.weekdays);
 insist(days.length>0&&days.length<=7&&days.every(day=>/^[0-6]$/.test(day)),
  'Invalid location schedule weekdays');
 for(const day of days){
  const intervals=hours.weekdays[day];
  insist(Array.isArray(intervals)&&intervals.length<=16&&intervals.every(pair=>
   Array.isArray(pair)&&pair.length===2&&Number.isSafeInteger(pair[0])&&
   Number.isSafeInteger(pair[1])&&pair[0]>=0&&pair[0]<1440&&
   pair[1]>pair[0]&&pair[1]<=pair[0]+1440),
   'Invalid location opening interval');
 }
}

export function validateLocationState(record,{eventIds=null}={}){
 insist(object(record)&&Object.keys(record).length===recordKeys.length&&
  recordKeys.every(key=>Object.hasOwn(record,key)),'Invalid mutable location state fields');
 insist(operating.has(record.operating_status)&&condition.has(record.physical_condition),
  'Invalid location operating status or physical condition');
 validateHours(record.opening_hours);
 insist(typeof record.note==='string'&&record.note.trim().length>=8&&record.note.length<=800,
  'Location state requires a concrete causal note');
 insist(eventId(record.last_change_event_id),'Location state requires an event reference');
 insist(eventIds===null||(eventIds instanceof Set&&eventIds.has(record.last_change_event_id)),
  'Location state cites an unknown event');
 return true;
}

function validateChange(state,event,change){
 insist(event&&eventId(event.id)&&Array.isArray(event.actor_ids)&&event.actor_ids.length===1&&
  knownActor(state,event.actor_ids[0])&&Array.isArray(event.state_changes),
  'Location change requires an actual actor event');
 insist(object(change)&&Object.keys(change).every(key=>changeKeys.has(key))&&
  change.field==='location_state'&&Object.hasOwn(change,'before')&&
  Object.hasOwn(change,'after')&&owns(state,change.location_id),
  'Location change requires an existing location and explicit before/after state');
 insist(change.actor_id===undefined||change.actor_id===event.actor_ids[0],
  'Location change actor differs from event actor');
 if(change.before!==null)validateLocationState(change.before);
 validateLocationState(change.after);
 insist(change.after.last_change_event_id===event.id,
  'Location change must cite its own actual event');
 const place=state.world.locations[change.location_id];
 if(place.world_design_id===state.world.prebuilt_design_id&&state.world.prebuilt_design_review){
  const review=state.world.prebuilt_design_review;
  const firstPlayedTurn=review.effective_from_turn+(review.operation==='world_admission'?1:0);
  insist(Number.isSafeInteger(event.turn)&&event.turn>=firstPlayedTurn,
   'Location condition cannot predate world admission');
 }
}

export function applyLocationStateChange({state,event,change}={}){
 validateChange(state,event,change);
 const before=state.world.location_states?.[change.location_id]??null;
 insist(same(before,change.before),'Stale mutable location state');
 insist(state.world.location_states===undefined||object(state.world.location_states),
  'Location states must be an object');
 const after=clone(change.after);
 state.world.location_states??={};
 state.world.location_states[change.location_id]=after;
 event.state_changes.push({actor_id:event.actor_ids[0],field:'location_state',
  location_id:change.location_id,before:clone(before),after:clone(after)});
 return state;
}

export function verifyLocationStateHistory(snapshot){
 const state=snapshot?.state;
 insist(state?.world?.locations&&state.player,'Saved world required for location state history');
 const current=state.world.location_states??{};
 insist(object(current),'Location states must be an object');
 const expected={},events=allEvents(snapshot),eventIds=new Set(events.map(event=>event.id));
 for(const event of events)for(const change of event.state_changes??[]){
  if(change.field!=='location_state')continue;
  validateChange(state,event,change);
  insist(change.actor_id===event.actor_ids[0],'Location change actor differs from event actor');
  const before=expected[change.location_id]??null;
  insist(same(change.before,before),'Location state history precondition mismatch');
  expected[change.location_id]=clone(change.after);
 }
 for(const [id,record] of Object.entries(current)){
  insist(owns(state,id),'Mutable state refers to an unknown location');
  validateLocationState(record,{eventIds});
 }
 insist(same(current,expected),'Mutable location state differs from its recorded history');
 return true;
}

// A closed business overrides its posted schedule. Merely operating, being
// damaged or having a public entrance is not proof of today's opening status.
export function locationAvailability({state,locationId,weekday=null,minute=null}={}){
 insist(owns(state,locationId),'Unknown location availability target');
 const record=state.world.location_states?.[locationId];
 if(record===undefined)return {status:'unknown',source:'no_recorded_location_state',eventId:null};
 validateLocationState(record);
 if(['temporarily_closed','permanently_closed'].includes(record.operating_status))
  return {status:'closed',source:'recorded_location_closure',eventId:record.last_change_event_id};
 return {...availability({schedule:record.opening_hours,weekday,minute}),eventId:record.last_change_event_id};
}

export function inspectLocationState({state,locationId,weekday=null,minute=null}={}){
 const currentAvailability=locationAvailability({state,locationId,weekday,minute});
 return {classification:'narrator_private_location_state',locationId,
  state:clone(state.world.location_states?.[locationId]??null),availability:currentAvailability};
}
