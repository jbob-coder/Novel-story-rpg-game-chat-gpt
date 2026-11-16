// A place exists independently of Jack. These helpers record only what he
// physically observes, keeping knowledge, visits and current access separate.
import {isDeepStrictEqual} from 'node:util';
import {allEvents,allTranscriptEntries} from './chapter_history.mjs';
import {meridianBayDesign,verifyMeridianBayWorld} from './meridian_bay_locations.mjs';
import {worldRoute} from './living_world_routines.mjs';

const requireFact=(ok,message)=>{if(!ok)throw Error(message);};
const clone=value=>structuredClone(value);
const prefix='Observed public access at ';
const presented=(messages,quote)=>messages.some(message=>
 typeof message==='string'&&message.includes(quote));
const sourceFor=observation=>observation.scene_quote+' | '+observation.access_quote;
const recordedAfter=(fact,source,id)=>fact+' (source: '+source+'; '+id+')';
const playerMoves=(event,playerId)=>(event.state_changes??[]).filter(change=>
 change.actor_id===playerId&&change.field==='location_id');
const metadataKeys=['version','location_id','observed_from','scene_quote','access_quote'];

function designPlace(state,id){
 const design=meridianBayDesign();
 const authored=design.places.find(place=>place.id===id),saved=state.world.locations[id];
 requireFact(authored&&saved&&isDeepStrictEqual(authored,saved),
  'Observation requires a preexisting admitted design location');
 requireFact(saved.world_design_id===design.world_design_id&&saved.public_area===true&&
  saved.access_status==='public_confirmed','Observed place lacks a designed public entrance');
 return saved;
}

function observationMetadata(state,value){
 requireFact(value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).length===metadataKeys.length&&
  metadataKeys.every(key=>Object.hasOwn(value,key))&&value.version===1,
  'Structured place observation evidence required');
 const place=designPlace(state,value.location_id);
 requireFact(value.observed_from===place.id||value.observed_from===place.parent_id,
  'Observation must be made from the place or its district frontage');
 requireFact(typeof value.scene_quote==='string'&&value.scene_quote.trim().length>=16&&
  value.scene_quote.length<=2000&&typeof value.access_quote==='string'&&
  value.access_quote.trim().length>=16&&value.access_quote.length<=2000&&
  value.scene_quote!==value.access_quote,'Distinct concrete observation and access quotes required');
 return place;
}

function eventLocations(state,event,startPosition){
 let position=startPosition;
 const positions=new Set([position]);
 for(const change of playerMoves(event,state.player.id)){
  requireFact(change.before===position,'Observation player-location history is inconsistent');
  const route=change.route??[change.before,change.after];
  requireFact(Array.isArray(route)&&route.length>=2&&route[0]===change.before&&
   route.at(-1)===change.after&&route.every(id=>Object.hasOwn(state.world.locations,id))&&
   route.slice(1).every((id,index)=>state.world.locations[route[index]].connected_ids.includes(id)),
   'Observation travel evidence must follow the recorded location graph');
  for(const id of route)positions.add(id);
  position=change.after;
 }
 return {positions,endPosition:position};
}

/** Called after the player's movement has been applied, before offscreen acts. */
export function applyReviewedPlaceDiscovery({state,event,discoveries=[],narrationMessages=[]}={}){
 requireFact(Array.isArray(discoveries)&&discoveries.length<=2,
  'At most two reviewed place observations per turn');
 if(discoveries.length===0)return [];
 verifyMeridianBayWorld(state);
 requireFact(state?.player&&event?.kind==='player_action'&&
  event.actor_ids?.length===1&&event.actor_ids[0]===state.player.id&&
  /^EV-\d{6,}$/.test(event.id)&&Array.isArray(event.state_changes),
  'Actual player event required for observation');
 requireFact(Number.isSafeInteger(event.turn)&&
  event.turn>=state.world.prebuilt_design_review.effective_from_turn,
  'Observation cannot predate world design admission');
 requireFact(Array.isArray(narrationMessages)&&narrationMessages.length>0,
  'Narrated player scene required for observation');
 let initial=state.player.location_id;
 for(const change of [...playerMoves(event,state.player.id)].reverse()){
  requireFact(change.after===initial,'Observation player-location history is inconsistent');
  initial=change.before;
 }
 const {positions}=eventLocations(state,event,initial),ids=new Set(),changes=[];
 const knowledge=state.player.knowledge??[];
 requireFact(Array.isArray(knowledge),'Player knowledge must be a list');
 for(const observation of discoveries){
  requireFact(observation&&observation.reviewed===true&&
   observation.public_access_confirmed===true,'Reviewed public-entrance observation required');
  const evidence={version:1,location_id:observation.id,observed_from:observation.observed_from,
   scene_quote:observation.scene_quote,access_quote:observation.access_quote};
  const place=observationMetadata(state,evidence);
  requireFact(!ids.has(place.id),'Duplicate current-turn place observation');
  requireFact(observation.anchor_id===undefined||observation.anchor_id===place.parent_id,
   'Observation district disagrees with the admitted place');
  requireFact(observation.opportunity_id===undefined||
   observation.opportunity_id===place.origin_opportunity_id,
   'Observation opportunity disagrees with the admitted place');
  requireFact(positions.has(evidence.observed_from),
   'Jack was not at the recorded observation position during this event');
  requireFact(presented(narrationMessages,evidence.scene_quote)&&
   presented(narrationMessages,evidence.access_quote),
   'Observation quotes must appear literally in the current narration');
  const fact=prefix+place.id,source=sourceFor(evidence),after=recordedAfter(fact,source,event.id);
  requireFact(!knowledge.includes(after),'Duplicate current-turn place observation');
  changes.push({actor_id:state.player.id,field:'knowledge',fact,source,after,
   place_observation:evidence});
  ids.add(place.id);
 }
 // Commit the batch only after every entry has passed. No geometry is edited.
 state.player.knowledge=[...knowledge,...changes.map(change=>change.after)];
 event.state_changes.push(...clone(changes));
 return clone(changes);
}

/** Validate observations against the complete chapter history, not summaries. */
export function verifyReviewedPlaceHistory(snapshot){
 requireFact(snapshot?.state?.player&&snapshot.state.world?.locations,
  'Saved world and player required for observation history');
 verifyMeridianBayWorld(snapshot.state);
 const state=snapshot.state,events=allEvents(snapshot),entries=allTranscriptEntries(snapshot);
 let position=state.player.location_id;
 for(const event of [...events].reverse())for(const change of
  [...playerMoves(event,state.player.id)].reverse()){
  requireFact(change.after===position,'Observation player-location history is inconsistent');
  position=change.before;
 }
 const validatedKnowledge=new Set();
 for(const event of events){
  const interval=eventLocations(state,event,position);position=interval.endPosition;
  const seen=new Set();
  for(const change of event.state_changes??[]){
   const reservedFact=typeof change.fact==='string'&&change.fact.startsWith(prefix);
   if(!reservedFact&&change.place_observation===undefined)continue;
   requireFact(reservedFact&&change.field==='knowledge'&&change.actor_id===state.player.id&&
    event.kind==='player_action'&&event.actor_ids?.length===1&&
    event.actor_ids[0]===state.player.id,'Place observation must be an actual player knowledge event');
   const evidence=change.place_observation,place=observationMetadata(state,evidence);
   requireFact(event.turn>=state.world.prebuilt_design_review.effective_from_turn,
    'Observation cannot predate world design admission');
   requireFact(!seen.has(place.id),'Duplicate current-turn place observation');seen.add(place.id);
   requireFact(change.fact===prefix+place.id&&change.source===sourceFor(evidence)&&
    change.after===recordedAfter(change.fact,change.source,event.id)&&
    (state.player.knowledge??[]).includes(change.after),
    'Place observation must retain its exact fact, source and event identity');
   requireFact(interval.positions.has(evidence.observed_from),
    'Jack was not at the recorded observation position during this event');
   const narration=entries.filter(entry=>entry.role==='assistant'&&entry.turn===event.turn&&
    entry.chapter_id===event.chapter_id&&entry.event_ids?.includes(event.id)).map(entry=>entry.text);
   requireFact(presented(narration,evidence.scene_quote)&&presented(narration,evidence.access_quote),
    'Place observation quotes missing from event-linked transcript');
   validatedKnowledge.add(change.after);
  }
 }
 requireFact(position===state.player.location_id,'Observation final player position differs from history');
 for(const fact of state.player.knowledge??[])
  if(typeof fact==='string'&&fact.startsWith(prefix))requireFact(validatedKnowledge.has(fact),
   'Place observation knowledge lacks structured event evidence');
 return true;
}

/** Known exterior observations are not proof of a visit or an open business. */
export function inspectSceneEstablishedPlaces({snapshot,fromId=null}={}){
 verifyReviewedPlaceHistory(snapshot);
 const state=snapshot.state,events=allEvents(snapshot),known=new Map();
 requireFact(fromId===null||Object.hasOwn(state.world.locations,fromId),'Unknown route origin');
 for(const event of events)for(const change of event.state_changes??[]){
  if(change.place_observation===undefined)continue;
  const id=change.place_observation.location_id;
  if(!known.has(id))known.set(id,[]);
  known.get(id).push(event.id);
 }
 return [...known].map(([id,evidenceEventIds])=>{
  const place=state.world.locations[id];
  const visitEventIds=events.filter(event=>playerMoves(event,state.player.id).some(change=>
   change.after===id)).map(event=>event.id);
  return {locationId:id,name:place.name,anchorId:place.parent_id,
   worldDesignId:place.world_design_id,opportunityId:place.origin_opportunity_id,
   evidenceEventId:evidenceEventIds.at(-1),evidenceEventIds:[...evidenceEventIds],
   observedPublicEntrance:true,visited:visitEventIds.length>0,visitEventIds,
   visitStatus:visitEventIds.length?'recorded_visit':'not_recorded',
   accessNow:'unknown',openingHours:null,travelMinutes:null,
   route:fromId===null?null:worldRoute(state,fromId,id)};
 });
}
