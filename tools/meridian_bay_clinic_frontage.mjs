// Selective, read-only port of historical Railgarden clinic frontage PR #64.
// The clinic already exists in the admitted world; the spatial detail remains
// an unsurveyed narrator-private draft, never a playable navigation operation.
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual as same} from 'node:util';
import {meridianBayDesign,verifyMeridianBayWorld} from './meridian_bay_locations.mjs';
import {locationAvailability} from './location_state.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const plan=read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_CLINIC_FRONTAGE_REVIEW_20261120.json');
const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const requireFact=(condition,message)=>{if(!condition)throw Error(message);};
const has=(object,key)=>Object.hasOwn(object,key);
const copy=value=>structuredClone(value);
const validPoint=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
 Number.isFinite(value.x)&&Number.isFinite(value.y);
const rail='LOC-RAILGARDEN-RESIDENTIAL';
const clinic='LOC-RAILGARDEN-CLINIC';
const grocery='LOC-RAILGARDEN-ABARROTES';
const home='LOC-WILSON-APARTMENT';
const workshop='LOC-WILSON-WORKSHOP';
const market='LOC-COMMERCIAL-DISTRICT';

function validateClinicDraft(){
 const catalog=meridianBayDesign();
 requireFact(plan.schema_version===1&&
  plan.plan_id==='MB-RAILGARDEN-CLINIC-ADMITTED-FRONTAGE-20261120-V1'&&
  plan.type==='single_health_center_frontage_approach'&&
  plan.status==='private_spatial_draft_not_story_canon'&&
  plan.authority==='private_review_not_playable_world'&&
  plan.sources?.catalog==='docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json'&&
  plan.sources?.city_canvas==='docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'&&
  plan.provenance?.historical_head==='3a359a171ecf31d3e7492e600b1cbae3e2aec426'&&
  plan.provenance?.historical_plan_blob_sha==='5e8442b4baec74e646b79148d09d11ed6d113acb'&&
  plan.provenance?.historical_tool_blob_sha==='43ddfce346bf939ae669fde53ca73c2042c39eff'&&
  plan.endpoints?.from_id===rail&&plan.endpoints?.to_id===clinic&&
  plan.endpoints?.parent_segment==='MB-WEB-004'&&
  plan.endpoints?.design_id===catalog.world_design_id&&
  plan.endpoints?.saved_world_admission_required===true&&
  plan.endpoints?.site_status==='admitted_saved_story_location_with_unverified_frontage',
  'Unverified or obsolete clinic frontage authority');
 const site=plan.site_semantics;
 requireFact(site?.exists_in_catalog===true&&
  site.requires_no_saved_world_admission_for_draft===false&&
  site.existing_in_saved_checkpoint===true&&
  site.saved_world_admission_required===true&&
  site.public_access_in_design===true&&
  site.open_now==='derived_from_event_backed_location_state'&&
  site.clinical_staff_now==='unknown'&&site.services_available_now==='unknown'&&
  site.emergency_capacity==='unknown'&&site.user_discovered===null&&
  site.visit_recorded===null&&site.npc_presence_inferred===false&&
  site.travel_time_minutes===null&&
  site.actual_accessible_entrance_confirmed===false,
  'Clinic draft cannot assert service, hours, discoveries or a surveyed entrance');
 const spatial=plan.spatial_policy,gate=plan.review_gate;
 requireFact(spatial?.reversible_canvas===true&&
  spatial.source_parent_polyline_must_match===true&&
  Object.entries(spatial).filter(([key])=>
   !['reversible_canvas','source_parent_polyline_must_match'].includes(key))
   .every(([,value])=>value===false)&&
  gate?.must_validate_admitted_saved_world===true&&
  Object.entries(gate).filter(([key])=>key!=='next_section')
   .every(([,value])=>value===true),
  'Unreviewed shortcut, clinic accessibility claim or story action is forbidden');
 const refs=new Map(city.locations.map(site=>[site.id,site.reference_xy_units]));
 const core=city.planning_regions.find(region=>region.id==='MB-REG-CORE')?.box;
 const expected=[refs.get(rail),{x:48.55,y:44.28},refs.get(clinic)];
 requireFact(core&&expected.every(validPoint)&&plan.nodes?.length===3&&
  plan.links?.length===2&&plan.bands?.length===2,
  'Missing clinic planning canvas or two-section geometry');
 const kinds=['saved_district_anchor','private_draft_waypoint_only','saved_public_site_anchor'];
 for(let i=0;i<3;i++){
  const pos=expected[i],node=plan.nodes[i];
  requireFact(node?.id==='MB-RC-N'+i&&node.kind===kinds[i]&&
   node.location_id===(i===0?rail:i===2?clinic:null)&&same(node.xy,pos)&&
   pos.x>=core.x_min&&pos.x<=core.x_max&&
   pos.y>=core.y_min&&pos.y<=core.y_max&&
   typeof node.name_provisional==='string'&&node.name_provisional.length>12&&
   typeof node.land_use==='string'&&node.land_use.length>35&&
   typeof node.junction_note==='string'&&node.junction_note.length>35,
   'Clinic draft waypoint or source coordinate differs from reviewed history');
  if(i)requireFact(Math.hypot(pos.x-expected[i-1].x,pos.y-expected[i-1].y)>0,
   'Clinic draft contains a zero-length section');
 }
 for(let i=0;i<2;i++){
  const link=plan.links[i],band=plan.bands[i],n=i+1;
  requireFact(link?.id==='MB-RC-L'+n&&link.from===plan.nodes[i].id&&
   link.to===plan.nodes[i+1].id&&link.type==='one_existing_draft_neighborhood_link'&&
   link.band_id==='MB-RC-B'+n&&link.travel_minutes===null&&
   link.traffic_flow==='unknown'&&
   typeof link.character==='string'&&link.character.length>30&&
   typeof link.pedestrian_context==='string'&&link.pedestrian_context.length>40&&
   typeof link.access_notes==='string'&&link.access_notes.length>45&&
   band?.id===link.band_id&&band.link_id===link.id&&
   band.footprints_verified===false&&
   typeof band.sides?.A==='string'&&band.sides.A.length>45&&
   typeof band.sides?.B==='string'&&band.sides.B.length>45,
   'Clinic frontage can only contain the two unverified historical spatial legs');
 }
 return true;
}

export function validateRailgardenClinicFrontage({state}={}){
 requireFact(state?.world?.locations&&state?.player?.location_id,
  'Saved world and player location required');
 const design=meridianBayDesign();
 requireFact(state.world.prebuilt_design_id===design.world_design_id&&
  state.world.prebuilt_design_review?.design_id===design.world_design_id&&
  state.world.prebuilt_design_review?.reviewed===true&&
  state.world.prebuilt_design_review?.operation==='world_admission',
  'Clinic preview requires the actual reviewed admission, not an old design fixture');
 verifyMeridianBayWorld(state);
 const locations=state.world.locations;
 const approved=design.places.find(site=>site.id===clinic);
 requireFact(approved&&approved.type==='community_health_center'&&
  approved.parent_id===rail&&approved.related_actor_id===null&&
  approved.public_area===true&&approved.access_status==='public_confirmed'&&
  approved.opening_hours===null&&approved.travel_minutes===null&&
  same(locations[clinic],approved),
  'Clinic identity or public-design-only facts were changed');
 requireFact(has(locations,state.player.location_id),'Unknown saved player location');
 // The clinic is one of several separate original neighborhood links.
 // An exterior draft cannot silently erase the grocery or Wilson's route.
 for(const [a,b] of [[rail,clinic],[rail,grocery],[rail,home],[home,workshop],[rail,market]]){
  requireFact(locations[a]&&locations[b]&&
   locations[a].connected_ids?.filter(id=>id===b).length===1&&
   locations[b].connected_ids?.filter(id=>id===a).length===1,
   'Missing or duplicated original district, market, grocery or household link');
 }
 validateClinicDraft();
 requireFact(!has(locations,plan.nodes[1].id),
  'A fictional clinic waypoint cannot become a saved location');
 return true;
}

export function previewRailgardenClinicFrontage({state,fromId=null,toId=null,
 weekday=null,minute=null}={}){
 validateRailgardenClinicFrontage({state});
 const status=locationAvailability({state,locationId:clinic,weekday,minute});
 const ids=plan.nodes.map(node=>node.id),start=ids.indexOf(fromId),end=ids.indexOf(toId);
 const result={
  classification:'narrator_private_admitted_clinic_frontage_draft',
  planId:plan.plan_id,status:'outside_this_frontage',fromId,toId,
  nodeIds:null,linkIds:null,frontageBands:null,
  savedWorldLocationAdmitted:true,publicAccessInDesign:true,
  actualAccessibleEntranceConfirmed:false,
  graphSource:'admitted_world_link_draft_waypoints',
  openNow:status.status,openingEvidenceSource:status.source,
  staffNow:'unknown',servicesNow:'unknown',emergencyCapacity:'unknown',
  playerDiscoveryConfirmed:null,visitRecorded:null,travelMinutes:null,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  canonicalNavigationAuthorized:false,actionCompleted:false,
  requiresPlayerAction:true
 };
 if(start<0||end<0)return copy(result);
 const indices=[],step=start<=end?1:-1;
 for(let i=start;;i+=step){indices.push(i);if(i===end)break;}
 const links=[];
 for(let i=1;i<indices.length;i++)
  links.push(plan.links[Math.min(indices[i-1],indices[i])].id);
 return copy({...result,status:'draft_segment_sequence',
  nodeIds:indices.map(i=>ids[i]),linkIds:links,
  frontageBands:links.map(id=>plan.links.find(link=>link.id===id).band_id)});
}
