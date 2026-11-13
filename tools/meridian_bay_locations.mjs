// D-061: the authored world exists BEFORE Jack observes it.
// Prebuilt locations have independent source provenance; observation changes
// Jack's knowledge, never the existence or topology of the location.
import {readFileSync} from 'node:fs';
import {inspectMeridianBay} from './meridian_bay_city.mjs';

const requireFact=(ok,message)=>{if(!ok)throw Error(message);};
const copy=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const namedLoc=x=>typeof x==='string'&&/^LOC-[A-Z][A-Z0-9-]{4,63}$/.test(x);
const presented=(messages,quote)=>Array.isArray(messages)&&
 messages.some(message=>typeof message==='string'&&message.includes(quote));
const authored=JSON.parse(readFileSync(
 new URL('../game/MERIDIAN_BAY_PREBUILT.json',import.meta.url),'utf8'));

function catalogAgainstState(state){
 requireFact(state?.world?.locations&&state?.world?.actors,'Saved city state required');
 requireFact(authored.schema_version===1&&
  authored.purpose==='locations_preexist_player_discovery'&&
  typeof authored.world_design_id==='string'&&
  Array.isArray(authored.places)&&authored.places.length>0,
  'Invalid prebuilt world catalog');
 const seen=new Set(),opportunities=new Set();
 for(const place of authored.places){
  requireFact(place&&typeof place==='object'&&namedLoc(place.id)&&
   !seen.has(place.id)&&place.id!==place.parent_id&&
   typeof place.name==='string'&&place.name.length>=3&&
   typeof place.description==='string'&&place.description.length>=20&&
   place.world_design_id===authored.world_design_id&&
   place.opening_hours===null&&place.travel_minutes===null&&
   Array.isArray(place.connected_ids)&&equal(place.connected_ids,[place.parent_id])&&
   place.public_area===true&&place.access_status==='public_confirmed',
   'Prebuilt locations require unique IDs, an anchored public entrance and unknown times');
  requireFact(has(state.world.locations,place.parent_id)&&
   state.world.locations[place.parent_id].id===place.parent_id,
   'Prebuilt place has no saved district anchor');
  const area=inspectMeridianBay({state,anchorId:place.parent_id}).areas[0];
  requireFact(area?.opportunities.some(item=>item.id===place.origin_opportunity_id)&&
   !opportunities.has(place.origin_opportunity_id),
   'Prebuilt place must cite a unique documented district opportunity');
  requireFact(place.related_actor_id===null||
   has(state.world.actors,place.related_actor_id),
   'Prebuilt place refers to an unknown actor');
  seen.add(place.id);opportunities.add(place.origin_opportunity_id);
 }
 return authored.places;
}

/**
 * Purely materialize a previously authored world before any player action.
 * This does NOT advance time, create events, grant Jack knowledge or modify
 * the saved input. Caller may stage the result in the standard five-file save.
 */
export function prepareMeridianBayWorld({state}={}){
 const places=catalogAgainstState(state);
 const draft=copy(state),locations=draft.world.locations;
 for(const place of places){
  if(has(locations,place.id))
   requireFact(equal(locations[place.id],place),
    'Saved prebuilt place conflicts with the authored world catalog');
  else {
   requireFact(!Object.values(locations).some(loc=>
    loc?.origin_opportunity_id===place.origin_opportunity_id),
    'Prebuilt opportunity conflicts with an already established location');
   locations[place.id]=copy(place);
  }
  const parent=locations[place.parent_id];
  requireFact(Array.isArray(parent.connected_ids),
   'Prebuilt district is missing its road links');
  if(!parent.connected_ids.includes(place.id))parent.connected_ids.push(place.id);
  requireFact(parent.connected_ids.filter(x=>x===place.id).length===1,
   'Prebuilt location has duplicate parent links');
 }
 return draft;
}

function routeIn(state,from,to){
 const nodes=state.world.locations;
 if(!has(nodes,from)||!has(nodes,to))return null;
 const queue=[[from]],seen=new Set([from]);
 for(let i=0;i<queue.length;i++){
  const path=queue[i],last=path.at(-1);
  if(last===to)return path;
  for(const next of nodes[last]?.connected_ids??[]){
   if(!has(nodes,next)||seen.has(next))continue;
   seen.add(next);queue.push([...path,next]);
  }
 }
 return null;
}
/** Narrator-only preview; the existence of a place is not Jack's knowledge. */
export function inspectPrebuiltMeridianBay({state,fromId=null}={}){
 const staged=prepareMeridianBayWorld({state});
 requireFact(fromId===null||has(staged.world.locations,fromId),
  'Unknown route origin');
 return copy(authored.places.map(place=>({
  locationId:place.id,name:place.name,anchorId:place.parent_id,
  worldDesignId:place.world_design_id,preexistsPlayerObservation:true,
  access:place.access_status,openingHours:null,travelMinutes:null,
  route:fromId===null?null:routeIn(staged,fromId,place.id)
 })));
}

/**
 * An observation is allowed ONLY for a PREEXISTING location.
 * It can record witnessed public access but NEVER spawn a new place.
 */
export function applyReviewedPlaceDiscovery({state,event,discoveries=[],
 narrationMessages=[]}={}){
 requireFact(state?.world?.locations&&state?.player&&
  event?.kind==='player_action'&&
  event.actor_ids?.length===1&&event.actor_ids[0]===state.player.id&&
  Array.isArray(event.state_changes),'Actual player event required for observation');
 requireFact(Array.isArray(discoveries)&&discoveries.length<=2,
  'Maximum two reviewed observations per player turn');
 if(discoveries.length===0)return [];
 requireFact(Array.isArray(narrationMessages)&&narrationMessages.length>0,
  'Narrated player scene required for an observation');
 const known=new Set(),newKnowledge=[],changes=[];
 for(const observation of discoveries){
  requireFact(observation&&typeof observation==='object'&&
   observation.reviewed===true&&observation.public_access_confirmed===true,
   'Narrator-reviewed public-access observation required');
  const loc=state.world.locations[observation.id];
  requireFact(loc&&loc.world_design_id===authored.world_design_id&&
   authored.places.some(place=>equal(place,loc))&&
   !known.has(observation.id),
   'Place must already exist in the approved prebuilt world before observation');
  requireFact(loc.public_area===true&&loc.access_status==='public_confirmed',
   'Private or restricted places cannot be marked as publicly observed');
  requireFact(observation.anchor_id===undefined||
   observation.anchor_id===loc.parent_id,
   'Observed place has a different saved district');
  requireFact(observation.opportunity_id===undefined||
   observation.opportunity_id===loc.origin_opportunity_id,
   'Observed opportunity disagrees with prebuilt place');
  requireFact(typeof observation.scene_quote==='string'&&
   observation.scene_quote.length>=16&&
   typeof observation.access_quote==='string'&&
   observation.access_quote.length>=16&&
   observation.scene_quote!==observation.access_quote&&
   presented(narrationMessages,observation.scene_quote)&&
   presented(narrationMessages,observation.access_quote),
   'Observation and access must appear literally in the current narrated scene');
  const fact='Observed public access at '+loc.id;
  const source=observation.scene_quote+' | '+observation.access_quote;
  const after=fact+' (source: '+source+'; '+event.id+')';
  requireFact(!(state.player.knowledge??[]).includes(after),
   'Duplicate current-turn public observation');
  newKnowledge.push(after);
  changes.push({actor_id:state.player.id,field:'knowledge',fact,source,after});
  known.add(observation.id);
 }
 state.player.knowledge??=[];
 state.player.knowledge.push(...newKnowledge);
 event.state_changes.push(...changes);
 return copy(changes);
}
/** Only observed sites belong in the observed list; the narrator-only
 * prebuilt catalog is available separately before any visit. */
export function inspectSceneEstablishedPlaces({state,fromId=null}={}){
 const staged=prepareMeridianBayWorld({state});
 requireFact(fromId===null||has(staged.world.locations,fromId),
  'Unknown route origin for visitable inspection');
 const knowledge=staged.player?.knowledge??[];
 return copy(authored.places.filter(loc=>knowledge.some(entry=>
  typeof entry==='string'&&
  entry.startsWith('Observed public access at '+loc.id+' (source: ')))
 .map(loc=>({
  locationId:loc.id,name:loc.name,anchorId:loc.parent_id,
  publicAccessConfirmed:true,evidenceEventId:null,
  worldDesignId:loc.world_design_id,
  opportunityId:loc.origin_opportunity_id,
  openingHours:null,travelMinutes:null,
  route:fromId===null?null:routeIn(staged,fromId,loc.id)
 })));
}
export function verifyReviewedPlaceHistory(snapshot){
 requireFact(snapshot?.state?.world?.locations&&snapshot?.events?.events&&
  snapshot?.transcript?.entries,
  'Complete saved scene and event record required');
 const state=snapshot.state,locations=state.world.locations;
 catalogAgainstState(state);
 // Legacy opening checkpoint has no authored locations yet, but when present
 // they must exactly match the approved source and have reciprocal links.
 const expected=new Map(authored.places.map(place=>[place.id,place]));
 for(const [id,loc] of Object.entries(locations)){
  if(!id.startsWith('LOC-')||id==='LOC-CROSSWATER-PLAZA'||
   id==='LOC-TRANSIT-TERMINAL'||id==='LOC-COMMERCIAL-DISTRICT'||
   id==='LOC-HARBOR-WALK'||id==='LOC-RAILGARDEN-RESIDENTIAL'||
   id==='LOC-WILSON-APARTMENT'||id==='LOC-WILSON-WORKSHOP'||
   id==='LOC-CAFE-BRUMA')continue;
  requireFact(expected.has(id)&&equal(expected.get(id),loc),
   'World location must preexist in the approved design, not be invented during a visit');
  requireFact(locations[loc.parent_id]?.connected_ids?.includes(id),
   'Prebuilt place missing reciprocal district link');
 }
 for(const e of snapshot.events.events){
  if(e.turn<=6)continue;
  for(const c of e.state_changes){
   requireFact(c.field!=='world_location'&&c.field!=='world_location_link',
    'A player scene cannot create a world location or a road link');
   if(c.field!=='knowledge'||typeof c.fact!=='string'||
    !c.fact.startsWith('Observed public access at '))continue;
   const id=c.fact.slice('Observed public access at '.length);
   requireFact(expected.has(id)&&c.actor_id===state.player.id&&
    e.kind==='player_action'&&e.actor_ids?.[0]===state.player.id&&
    typeof c.source==='string'&&
    c.after===c.fact+' (source: '+c.source+'; '+e.id+')'&&
    (state.player.knowledge??[]).includes(c.after),
    'Public observation must have known prebuilt place and exact player evidence');
   const narrative=snapshot.transcript.entries.filter(t=>
    t.turn===e.turn&&t.role==='assistant').map(t=>t.text);
   const parts=c.source.split(' | ');
   requireFact(parts.length===2&&parts.every(x=>x.length>=16&&
    presented(narrative,x)),'Public observation source missing in transcript');
  }
 }
 return true;
}
