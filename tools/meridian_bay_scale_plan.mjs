// Geographic planning aid for a fiction-first city. Read-only and tentative:
// unit/grid values are NOT surveyed meters, GPS, walking minutes or canon.
import {readFileSync} from 'node:fs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
import {worldRoute} from './living_world_routines.mjs';

const PLAN=JSON.parse(readFileSync(
 new URL('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json',import.meta.url),'utf8'));
const check=(ok,message)=>{if(!ok)throw Error(message)};
const clone=x=>JSON.parse(JSON.stringify(x));
const owns=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const validCoord=x=>Number.isFinite(x)&&x>=0;
const cityLocations=state=>prepareMeridianBayWorld({state}).world.locations;
const positionIndex=()=>new Map(PLAN.locations.map(x=>[x.id,x]));

export function validateMeridianBayScalePlan({state}={}){
 check(state?.world?.locations&&state?.player,
  'Saved world state is required for city scale review');
 const locations=cityLocations(state);
 const p=PLAN,canvas=p.planning_envelope;
 check(p.schema_version===1&&p.authority==='planning_hypothesis_not_saved_world_canon'&&
  p.scope.city_id==='CITY-MERIDIAN-BAY'&&
  p.rules.existing_graph_is_authoritative&&p.rules.new_route_links_created===0,
  'Scale plan must remain separate from location canon');
 check(canvas.width_units===100&&canvas.height_units===80&&
  canvas.reference_km_per_unit===0.1&&
  canvas.illustrative_width_km===10&&canvas.illustrative_height_km===8&&
  canvas.illustrative_bounding_rectangle_km2===80&&
  canvas.cardinal_orientation_confirmed===false,
  'Scale dimensions are tentative envelope values, not surveyed city limits');
 check(p.scope.world_coordinates===null&&
  p.scope.municipal_boundary_surveyed===false&&
  p.scope.shoreline_surveyed===false&&
  p.scope.actual_city_area_km2===null&&p.scope.population===null,
  'Unsurveyed physical city dimensions must not become facts');
 check(p.locations.length===14&&new Set(p.locations.map(x=>x.id)).size===14,
  'City scale locations must have unique identifiers');
 const actualIds=Object.keys(locations).filter(id=>id.startsWith('LOC-'));
 check(actualIds.length===p.locations.length&&
  p.locations.every(x=>owns(locations,x.id)),
  'Scale plan does not match the prepared location set');
 for(const entry of p.locations){
  const {x,y}=entry.reference_xy_units;
  check(validCoord(x)&&validCoord(y)&&
   x<=canvas.width_units&&y<=canvas.height_units&&
   validCoord(entry.placement_uncertainty_units)&&
   entry.placement_uncertainty_units>0&&
   entry.physical_footprint_defined===false,
   'Reference point is outside the scale canvas or improperly treated as a footprint');
  const actual=locations[entry.id];
  if(entry.source==='authored_prebuilt_catalog'){
   check(actual.world_design_id===state.world.prebuilt_design_id||
    // The source may be a legacy turn-9 checkpoint, still lacking materialization.
    actual.world_design_id==='MB-PREBUILT-20261112-V2',
    'Prebuilt design source mismatch');
   check(entry.parent_id===actual.parent_id&&
    actual.connected_ids.length===1&&actual.connected_ids[0]===entry.parent_id,
    'Site must remain anchored to its original district, without extra roads');
  }else check(entry.source==='checkpoint_location_anchor'&&
    !('parent_id' in entry),'Existing checkpoint anchors must not be remapped');
 }
 const seenRegions=new Set();
 for(const region of p.planning_regions){
  check(!seenRegions.has(region.id),'Duplicate planning region');
  seenRegions.add(region.id);
  const {x_min,x_max,y_min,y_max}=region.box;
  check(validCoord(x_min)&&validCoord(x_max)&&
   validCoord(y_min)&&validCoord(y_max)&&
   x_min<x_max&&y_min<y_max&&
   x_max<=canvas.width_units&&y_max<=canvas.height_units,
   'Planning region outside city canvas');
  check(region.status.includes('not_')||region.status==='working_envelope_not_administrative_district',
   'Unbuilt region cannot be treated as an approved playable district');
 }
 check(Array.isArray(p.focus_area_envelopes)&&p.focus_area_envelopes.length===5,
  'Known-neighborhood focus regions are missing');
 const namedFocus=new Set();
 for(const area of p.focus_area_envelopes){
  check(!namedFocus.has(area.location_id)&&
   owns(locations,area.location_id)&&area.boundary_confirmed===false,
   'Focus area cannot become an invented district or confirmed boundary');
  namedFocus.add(area.location_id);
  const {x_min,x_max,y_min,y_max}=area.box;
  const point=p.locations.find(loc=>loc.id===area.location_id).reference_xy_units;
  check(point.x>=x_min&&point.x<=x_max&&
   point.y>=y_min&&point.y<=y_max&&
   x_min>=0&&y_min>=0&&x_max<=canvas.width_units&&y_max<=canvas.height_units&&
   x_max>x_min&&y_max>y_min,'Neighborhood study box misses its actual map reference');
  check(Math.abs((x_max-x_min)*canvas.reference_km_per_unit-
   area.rough_envelope_km.width)<1e-8&&
   Math.abs((y_max-y_min)*canvas.reference_km_per_unit-
   area.rough_envelope_km.height)<1e-8,
   'Focus area sketch size conflicts with planning scale');
 }
 check(p.rules.focus_area_boxes_are_not_precise_district_boundaries&&
  p.rules.street_network_geometry_not_yet_mapped,
  'Planning extents must not silently create geographic fact');
 for(const id of actualIds)
  for(const next of locations[id].connected_ids??[]){
   if(!next.startsWith('LOC-'))continue;
   check(owns(locations,next)&&locations[next].connected_ids.includes(id),
    'Prebuilt route graph must keep all canonical connections reciprocal');
  }
 check(p.rules.coordinate_proximity_does_not_create_road&&
  p.rules.character_knowledge_separate_from_world_design&&
  p.rules.no_story_time_advance&&p.rules.no_player_or_npc_movement&&
  p.rules.travel_time_from_rough_plan_not_canon,
  'Provisional size cannot authorize fictional action or travel time');
 return true;
}

export function inspectMeridianBayScale({state}={}){
 validateMeridianBayScalePlan({state});
 return clone({
  classification:'narrator_private_planning_hypothesis',
  planId:PLAN.plan_id,
  isCanonicalDimension:false,
  envelope:PLAN.planning_envelope,
  context:PLAN.scope,
  districtReferences:PLAN.locations,
  unchartedRegions:PLAN.planning_regions,
  studyNeighborhoodEnvelopes:PLAN.focus_area_envelopes,
  positionUncertainty:'illustrative reference points within conceptual districts; not addresses or road geometry',
  fictionTimeElapsed:false,
  playerMoved:false,
  requiresEditorialReview:true
 });
}
const r1=n=>Math.round(n*10)/10;
/**
 * Straight-line *planning range*, not a walkable distance estimate.
 * Only compared for already connected graph destinations, with very broad
 * error based on approximate anchor placement. Return null when not mapped.
 */
export function previewMeridianBayPlanningSpan({state,fromId,toId}={}){
 validateMeridianBayScalePlan({state});
 const positions=positionIndex(),from=positions.get(fromId),to=positions.get(toId);
 if(!from||!to)return null;
 const locations=cityLocations(state);
 const actualRoute=worldRoute({...state,world:{...state.world,locations}},fromId,toId);
 if(!actualRoute)return null;
 const nominal=Math.hypot(
  to.reference_xy_units.x-from.reference_xy_units.x,
  to.reference_xy_units.y-from.reference_xy_units.y
 )*PLAN.planning_envelope.reference_km_per_unit;
 const uncertainty=(from.placement_uncertainty_units+
  to.placement_uncertainty_units)*PLAN.planning_envelope.reference_km_per_unit;
 return clone({
  classification:'illustrative_straight_line_span_not_route_length',
  fromId,toId,minimumReferenceKm:r1(Math.max(0,nominal-uncertainty)),
  maximumReferenceKm:r1(nominal+uncertainty),
  roadDistanceKm:null,walkingMinutes:null,
  routeIds:actualRoute,
  routeIsVerifiedGraphOnly:true,
  coordinatesAndCardinalDirectionsNotCanonical:true,
  playerMoved:false,fictionalTimeElapsed:false
 });
}
