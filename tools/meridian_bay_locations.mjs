// Selective port of PR #21 (25d66f4), preserving its six identities and links.
// Design preparation is private and detached; admission requires a reviewed,
// source-bound operation. Neither step teaches Jack anything or plays a scene.
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual as same} from 'node:util';
import {worldRoute} from './living_world_routines.mjs';

const design=JSON.parse(readFileSync(new URL(
 '../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json',import.meta.url),'utf8'));
const check=(ok,message)=>{if(!ok)throw Error(message)};
const copy=value=>structuredClone(value);
const has=(obj,key)=>Object.hasOwn(obj,key);
const isSha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
export const meridianBayDesign=()=>copy(design);

function validateCatalog(state){
 check(state?.world?.locations&&state.world.actors,'Saved city state required');
 check(design.schema_version===1&&design.purpose==='locations_preexist_player_discovery'&&
  design.places.length===6&&has(state.world.locations,design.base_city),
  'Unsupported Meridian Bay design');
 const ids=new Set(),opportunities=new Set();
 for(const place of design.places){
  check(/^LOC-[A-Z][A-Z0-9-]{4,63}$/.test(place.id)&&!ids.has(place.id)&&
   place.id!==place.parent_id&&place.world_design_id===design.world_design_id&&
   typeof place.name==='string'&&place.name.length>=3&&
   typeof place.description==='string'&&place.description.length>=20&&
   place.opening_hours===null&&place.travel_minutes===null&&place.public_area===true&&
   place.access_status==='public_confirmed'&&same(place.connected_ids,[place.parent_id]),
   'Invalid authored location');
  const parent=state.world.locations[place.parent_id];
  check(parent?.id===place.parent_id&&Array.isArray(parent.connected_ids),
   'Missing saved district anchor');
  check(typeof place.origin_opportunity_id==='string'&&!opportunities.has(place.origin_opportunity_id),
   'Duplicate authored opportunity');
  check(place.related_actor_id===null||has(state.world.actors,place.related_actor_id),
   'Unknown related actor');
  ids.add(place.id);opportunities.add(place.origin_opportunity_id);
 }
}

export function prepareMeridianBayWorld({state}={}){
 validateCatalog(state);
 check(state.world.prebuilt_design_id===undefined||
  state.world.prebuilt_design_id===design.world_design_id,'World design version differs');
 const next=copy(state),locations=next.world.locations;
 for(const place of design.places){
  if(has(locations,place.id))check(same(locations[place.id],place),'Saved place conflicts with design');
  else{
   check(!Object.values(locations).some(x=>x.origin_opportunity_id===place.origin_opportunity_id),
    'Opportunity already belongs to another location');
   locations[place.id]=copy(place);
  }
  const links=locations[place.parent_id].connected_ids;
  if(!links.includes(place.id))links.push(place.id);
  check(links.filter(id=>id===place.id).length===1,'Duplicate district connection');
 }
 next.world.prebuilt_design_id=design.world_design_id;
 return next;
}

function validateReview(review){
 check(review?.reviewed===true&&review.design_id===design.world_design_id&&
  isSha(review.source_commit)&&typeof review.reason==='string'&&review.reason.trim().length>=16&&
  Number.isSafeInteger(review.effective_from_turn)&&review.effective_from_turn>0,
  'Reviewed source-bound world design admission required');
}

// Explicit adoption is technical worldbuilding, not a discovery or an NPC act.
export function admitMeridianBayWorld({state,designReview,observedHead,nextTurn}={}){
 check(isSha(observedHead)&&Number.isSafeInteger(nextTurn)&&nextTurn>0,
  'Admission requires the verified source and next turn');
 if(state.world.prebuilt_design_id!==undefined){
  verifyMeridianBayWorld(state);
  check(designReview===undefined||designReview===null,'World design is already admitted');
  return copy(state);
 }
 check(designReview?.source_commit===observedHead,'World admission source HEAD differs');
 const review={...copy(designReview),effective_from_turn:nextTurn};
 validateReview(review);
 const next=prepareMeridianBayWorld({state});
 next.world.prebuilt_design_review=review;
 verifyMeridianBayWorld(next);
 return next;
}

export function verifyMeridianBayWorld(state){
 const locations=state?.world?.locations;
 check(locations,'Saved city state required');
 const catalogIds=new Set(design.places.map(place=>place.id));
 const present=Object.values(locations).some(loc=>catalogIds.has(loc.id)||
  loc.world_design_id===design.world_design_id);
 if(!present&&state.world.prebuilt_design_id===undefined){
  check(state.world.prebuilt_design_review===undefined,'World review without a design');
  return true;
 }
 validateCatalog(state);
 check(state.world.prebuilt_design_id===design.world_design_id,'Missing world design version');
 validateReview(state.world.prebuilt_design_review);
 for(const place of design.places){
  check(same(locations[place.id],place),'Incomplete or altered authored location');
  check(locations[place.parent_id].connected_ids.filter(id=>id===place.id).length===1,
   'Missing or duplicated district connection');
 }
 for(const loc of Object.values(locations))if(loc.world_design_id===design.world_design_id)
  check(catalogIds.has(loc.id),'Unknown member of this world design');
 // Other approved designs and existing directed links have their own authority.
 return true;
}

export function inspectPrebuiltMeridianBay({state,fromId=null}={}){
 const prepared=prepareMeridianBayWorld({state});
 check(fromId===null||has(prepared.world.locations,fromId),'Unknown route origin');
 return design.places.map(place=>({
  locationId:place.id,name:place.name,anchorId:place.parent_id,
  worldDesignId:design.world_design_id,classification:'narrator_private_design',
  existsInDesign:true,existsInSavedWorld:has(state.world.locations,place.id),
  publicEntranceInDesign:true,accessNow:'unknown',openingHours:null,travelMinutes:null,
  route:fromId===null?null:worldRoute(prepared,fromId,place.id)
 }));
}
