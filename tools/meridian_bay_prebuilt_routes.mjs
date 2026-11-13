// Read-only narrated route preview across original and pre-authored Meridian Bay.
// It uses the existing graph; no invented shortcuts, movement, clock or scene.
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
import {worldRoute} from './living_world_routines.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message);};
const clone=value=>JSON.parse(JSON.stringify(value));
const validId=id=>typeof id==='string'&&id.startsWith('LOC-');

export function previewPrebuiltMeridianRoute({state,fromId=null,destinationId,
  waypoints=[]}={}){
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
 const impossible=()=>({
  classification:'narrator_private_route_preview',status:'unreachable',
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
  assert(origin.connected_ids.includes(to)&&target.connected_ids.includes(from),
   'Route contains an unconfirmed one-way or fabricated connection');
  return {
   from,to,fromName:origin.name,toName:target.name,
   connection:'verified_in_prepared_graph',
   toPrebuiltDesignId:target.world_design_id??null,
   approximateMinutes:null,openingHours:null,
   traversed:false
  };
 });
 const dest=locations[destinationId];
 const playerPublicObservationRecorded=(state.player.knowledge??[]).some(
  entry=>typeof entry==='string'&&
   entry.startsWith('Observed public access at '+destinationId+' (source: '));
 return clone({
  classification:'narrator_private_route_preview',status:'route_available',
  originId,destinationId,destinationName:dest.name,
  destinationWorldDesignId:dest.world_design_id??null,
  preexistsPlayerObservation:dest.world_design_id!==undefined,
  publicAccessInDesign:dest.public_area===true&&
   dest.access_status==='public_confirmed',
  playerPublicObservationRecorded,
  playerKnowledgeOtherwise:'not_determined',
  waypoints:[...waypoints],route,segments,
  estimateMinutes:null,possibleNpcEncounters:[],
  characterMoved:false,fictionalTimeAdvanced:false,
  actionCompleted:false,requiresPlayerAction:true,
  rules:[
   'The map is authored before a visit; a route preview does not discover the destination for Jack.',
   'Public access is not a confirmed opening hour, employee presence, inventory or completed service.',
   'Unknown walking times stay unknown until a plausible narration establishes them.',
   'No NPC encounter, player choice, action or story event is created by this preview.'
  ]
 });
}
