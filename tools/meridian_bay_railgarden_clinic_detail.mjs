// Single reviewed Railgarden → community health center design corridor.
// This is read-only proposed geometry; not a visit, admission or medical service.
import {readFileSync} from 'node:fs';
import {validateRailgardenGroceryDetail} from './meridian_bay_railgarden_grocery_detail.mjs';
import {prepareMeridianBayWorld,meridianBayDesign} from './meridian_bay_locations.mjs';

const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const plan=load('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_CLINIC_DETAIL_20261117.json');
const road=load('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');
const canvas=load('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>valid(a)&&valid(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;

export function validateRailgardenClinicDetail({state}={}){
 validateRailgardenGroceryDetail({state});
 check(plan.schema_version===1&&
  plan.plan_id==='MB-RAILGARDEN-CLINIC-APPROACH-20261117-V1'&&
  plan.type==='single_health_center_frontage_approach'&&
  plan.status==='detailed_draft_not_story_canon'&&
  plan.sources.previous_detail==='docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL_20261116.json'&&
  plan.endpoints.parent_segment==='MB-WEB-004',
  'Unrecognized or promoted Railgarden clinic draft');
 const {from_id:from,to_id:to,design_id:design}=plan.endpoints;
 const parent=road.segments.find(x=>x.id===plan.endpoints.parent_segment);
 check(parent?.from_id===from&&parent?.to_id===to&&
  from==='LOC-RAILGARDEN-RESIDENTIAL'&&to==='LOC-RAILGARDEN-CLINIC'&&
  parent.known_graph_connection===true&&parent.assumed_bidirectional===true&&
  parent.via_xy_units.length===1&&parent.travel_minutes===null&&
  parent.established_street_name===null,
  'Clinic approach must inherit only the established draft connection');
 const catalog=meridianBayDesign();
 const clinic=catalog.places.find(p=>p.id===to);
 check(catalog.world_design_id===design&&clinic?.world_design_id===design&&
  clinic.parent_id===from&&clinic.type==='community_health_center'&&
  clinic.public_area===true&&clinic.access_status==='public_confirmed'&&
  clinic.related_actor_id===null&&clinic.opening_hours===null&&
  clinic.travel_minutes===null&&
  clinic.connected_ids.length===1&&clinic.connected_ids[0]===from,
  'Clinic identity or availability contradicts the original catalog');
 check(state?.world?.locations&&
  !Object.hasOwn(state.world.locations,to),
  'Clinic must remain outside the saved story checkpoint');
 const prepared=prepareMeridianBayWorld({state});
 const locations=prepared.world.locations;
 check(prepared!==state&&
  locations[from].connected_ids.includes(to)&&
  locations[to].connected_ids.includes(from)&&
  locations[from].connected_ids.includes('LOC-RAILGARDEN-ABARROTES')&&
  locations['LOC-RAILGARDEN-ABARROTES'].connected_ids.includes(from)&&
  locations[from].connected_ids.includes('LOC-WILSON-APARTMENT')&&
  !Object.hasOwn(state.world.locations,to),
  'Detached health center must preserve grocery and Wilson neighborhood links');
 const points=new Map(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 const original=[points.get(from),...parent.via_xy_units,points.get(to)];
 const core=canvas.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 check(original.length===3&&original.every(valid)&&core&&
  plan.nodes.length===3&&plan.links.length===2&&plan.bands.length===2,
  'Clinic requires two contiguous frontage sections');
 const ids=new Set();
 for(let i=0;i<3;i++){
  const p=original[i],node=plan.nodes[i];
  check(p.x>=core.x_min&&p.x<=core.x_max&&
   p.y>=core.y_min&&p.y<=core.y_max&&
   node.id==='MB-RC-N'+i&&!ids.has(node.id)&&same(node.xy,p)&&
   typeof node.name_provisional==='string'&&node.name_provisional.length>12&&
   typeof node.land_use==='string'&&node.land_use.length>35&&
   typeof node.junction_note==='string'&&node.junction_note.length>35,
   'Unreviewed clinic geometry or missing exterior context');
  ids.add(node.id);
  if(i===1)check(node.kind==='noncanonical_intermediate_frontage_marker'&&
   node.location_id===null&&!Object.hasOwn(locations,node.id),
   'Clinic bend cannot become an invented public street or location');
  else check(node.kind===(i===0?'source_location_anchor':'draft_design_location_anchor')&&
   node.location_id===(i===0?from:to),
   'Known district and clinic anchors must be unchanged');
  if(i)check(Math.hypot(p.x-original[i-1].x,p.y-original[i-1].y)>0,
   'Zero-length clinic approach');
 }
 for(let i=0;i<2;i++){
  const l=plan.links[i],b=plan.bands[i];
  check(l.id==='MB-RC-L'+(i+1)&&
   l.from===plan.nodes[i].id&&l.to===plan.nodes[i+1].id&&
   l.type==='one_existing_draft_neighborhood_link'&&
   l.band_id==='MB-RC-B'+(i+1)&&
   typeof l.character==='string'&&l.character.length>30&&
   typeof l.pedestrian_context==='string'&&l.pedestrian_context.length>40&&
   typeof l.access_notes==='string'&&l.access_notes.length>45&&
   l.travel_minutes===null&&l.traffic_flow==='unknown',
   'Clinic access section wrongly asserts a route, travel time or medical access');
  check(b.id===l.band_id&&b.link_id===l.id&&
   typeof b.sides?.A==='string'&&b.sides.A.length>45&&
   typeof b.sides?.B==='string'&&b.sides.B.length>45&&
   b.footprints_verified===false,
   'Both sides of each provisional clinic frontage are required');
 }
 const site=plan.site_semantics,sp=plan.spatial_policy,gate=plan.review_gate;
 check(site.exists_in_catalog===true&&
  site.requires_no_saved_world_admission_for_draft===true&&
  site.existing_in_saved_checkpoint===false&&
  site.public_access_in_design===true&&
  site.open_now==='unknown'&&site.clinical_staff_now==='unknown'&&
  site.services_available_now==='unknown'&&site.emergency_capacity==='unknown'&&
  site.user_discovered===null&&site.visit_recorded===false&&
  site.npc_presence_inferred===false&&site.travel_time_minutes===null,
  'Clinic planning cannot claim service, staffing or discovered status');
 check(sp.reversible_canvas===true&&sp.source_parent_polyline_must_match===true&&
  Object.entries(sp).filter(([key])=>!['reversible_canvas','source_parent_polyline_must_match'].includes(key))
   .every(([,v])=>v===false)&&
  Object.entries(gate).filter(([key])=>key!=='next_section').every(([,v])=>v===true),
  'Clinic map must not assert surveyed geometry or story events');
 return true;
}

export function previewRailgardenClinicDetail({state,fromId,toId}={}){
 validateRailgardenClinicDetail({state});
 const ids=plan.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const preview={classification:'narrator_private_unadmitted_health_center_draft',
  planId:plan.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,frontageBands:null,
  savedWorldLocationAdmitted:false,publicAccessInDesign:true,
  openNow:'unknown',staffNow:'unknown',servicesNow:'unknown',
  emergencyCapacity:'unknown',actualAccessibleEntranceConfirmed:false,
  playerDiscoveryConfirmed:false,visitRecorded:false,travelMinutes:null,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  canonicalNavigationAuthorized:false};
 if(a<0||b<0)return structuredClone(preview);
 const step=a<=b?1:-1,indices=[];
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const linkIds=[];
 for(let i=0;i<indices.length-1;i++)
  linkIds.push(plan.links[Math.min(indices[i],indices[i+1])].id);
 return structuredClone({...preview,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds,
  frontageBands:linkIds.map(id=>plan.links.find(x=>x.id===id).band_id)});
}
