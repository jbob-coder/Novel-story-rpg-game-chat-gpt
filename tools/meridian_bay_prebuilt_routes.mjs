// Read-only narrated route preview across original and pre-authored Meridian Bay.
// It uses the existing graph; no invented shortcuts, movement, clock or scene.
// Adapted from PR #22, edb0d06791b7b441e23b21802ccbc01b2d7641d9.
import {prepareMeridianBayWorld,verifyMeridianBayWorld} from './meridian_bay_locations.mjs';
import {worldRoute} from './living_world_routines.mjs';
import {locationAvailability} from './location_state.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message);};
const clone=value=>JSON.parse(JSON.stringify(value));
const validId=id=>typeof id==='string'&&id.startsWith('LOC-');

export function previewPrebuiltMeridianRoute({state,fromId=null,destinationId,
  waypoints=[],weekday=null,minute=null}={}){
 assert(state?.world?.locations&&state?.player?.location_id,
  'Verified saved world and player location required');
 assert(fromId===null||validId(fromId),'Invalid starting location ID');
 assert(Array.isArray(waypoints)&&waypoints.length<=8&&
  waypoints.every(validId),'Invalid route waypoints');
 assert(typeof destinationId==='string'&&destinationId.length>0,
  'Destination ID required');

 const originId=fromId??state.player.location_id;
 const staged=prepareMeridianBayWorld({state});
 const locations=staged.world.locations;
 const admitted=state.world.prebuilt_design_review!==undefined;
 if(admitted)verifyMeridianBayWorld(state);
 const graphSource=admitted?'admitted_world':'draft_design_preview';
 const impossible=()=>({
  classification:'narrator_private_route_preview',status:'unreachable',
  graphSource,travelAuthorized:false,
  originId,destinationId,waypoints:[...waypoints],route:null,
  segments:[],estimateMinutes:null,possibleNpcEncounters:[],
  characterMoved:false,fictionalTimeAdvanced:false,
  actionCompleted:false,requiresPlayerAction:true
 });
 if(!validId(originId)||!validId(destinationId)||
  !Object.hasOwn(locations,originId)||!Object.hasOwn(locations,destinationId))
  return impossible();

 const route=[originId];
 for(const stopId of [...waypoints,destinationId]){
  if(!validId(stopId)||!Object.hasOwn(locations,stopId))return impossible();
  const leg=worldRoute(staged,route.at(-1),stopId);
  if(leg===null)return impossible();
  route.push(...leg.slice(1));
 }
 const segments=route.slice(1).map((to,i)=>{
  const from=route[i],origin=locations[from],target=locations[to];
  // Existing directed routes stay directed. Only authored district entrances
  // receive reciprocal links during catalog preparation.
  assert(origin.connected_ids.includes(to),
   'Route contains a fabricated connection');
  return {
   from,to,fromName:origin.name,toName:target.name,
   connection:'verified_in_prepared_graph',graphSource,
   toPrebuiltDesignId:target.world_design_id??null,
   approximateMinutes:null,openingHours:null,
   traversed:false
  };
 });
 const dest=locations[destinationId];
 return clone({
  classification:'narrator_private_route_preview',status:'route_available',
  graphSource,travelAuthorized:false,
  originId,destinationId,destinationName:dest.name,
  destinationWorldDesignId:dest.world_design_id??null,
  preexistsPlayerObservation:dest.world_design_id!==undefined,
  publicAccessInDesign:dest.public_area===true&&
   dest.access_status==='public_confirmed',
  openNow:locationAvailability({state:staged,locationId:destinationId,weekday,minute}).status,
  // A state-only route graph cannot authenticate discovery evidence. Use
  // inspectSceneEstablishedPlaces(snapshot) for the event-backed knowledge view.
  playerPublicObservationRecorded:null,
  playerKnowledgeOtherwise:'not_determined',
  waypoints:[...waypoints],route,segments,
  estimateMinutes:null,possibleNpcEncounters:[],
  characterMoved:false,fictionalTimeAdvanced:false,
  actionCompleted:false,requiresPlayerAction:true,
  rules:[
   'The map is authored before a visit; a route preview does not discover the destination for Jack.',
   'A route in a draft design must be admitted to the world separately before actual travel can use it.',
   'Public access is not a confirmed opening hour, employee presence, inventory or completed service.',
   'Unknown walking times stay unknown until a plausible narration establishes them.',
   'No NPC encounter, player choice, action or story event is created by this preview.'
  ]
 });
}
