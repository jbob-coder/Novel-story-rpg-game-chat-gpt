// Crosswater Plaza ↔ Harbor Walk: read-only, provisional local-corridor review.
// All planning points are internal map design, never canonical LOC locations.
import {readFileSync} from 'node:fs';
import {validatePlazaTerminalDetail} from './meridian_bay_plaza_terminal_detail.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const plan=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL_20261116.json'));
const city=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const slice1=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'));
const slice2=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'));
const setting=read('../game/STARTING_LOCATIONS.md');
const chapter=read('../chapters/CH-000.transcript.json');
const fail=(test,message)=>{if(!test)throw Error(message);};
const deep=x=>structuredClone(x);
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const close=(a,b)=>valid(a)&&valid(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const dist=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const properCross=(a,b,c,d)=>
 orient(a,b,c)*orient(a,b,d)<-1e-8&&
 orient(c,d,a)*orient(c,d,b)<-1e-8;

// Strictly interior crossing of distinct polylines indicates an undefined junction.
// This is a planar sketch check, NOT a 3D bridge or traffic proof.
function checkNoDraftCrossings(newPoints,from,to,refs){
 const olds=[...slice1.segments,...slice2.segments];
 for(const prior of olds){
  const oldPoints=[refs.get(prior.from_id),...prior.via_xy_units,refs.get(prior.to_id)];
  fail(oldPoints.every(valid),'A source corridor lacks reference geometry');
  for(let i=1;i<newPoints.length;i++)
   for(let j=1;j<oldPoints.length;j++){
    fail(!properCross(newPoints[i-1],newPoints[i],oldPoints[j-1],oldPoints[j]),
     'Unregistered crossing with an existing draft corridor');
   }
  // A nonendpoint junction would not be safe to silently assume.
  for(let i=1;i<newPoints.length-1;i++)
   for(let j=1;j<oldPoints.length;j++){
    const p=newPoints[i],a=oldPoints[j-1],b=oldPoints[j];
    const length=dist(a,b),margin=1e-7;
    if(length>0&&Math.abs(orient(a,b,p))<margin&&
       dist(a,p)+dist(p,b)<length+margin){
      fail(false,'Intermediate sketch point lies on an unregistered source road');
    }
   }
 }
}

export function validatePlazaHarborCorridor({state}={}){
 validatePlazaTerminalDetail({state});
 fail(plan.schema_version===1&&
  plan.plan_id==='MB-PLAZA-HARBOR-CORRIDOR-DETAIL-20261116-V1'&&
  plan.type==='single_corridor_micro_map'&&
  plan.status==='detailed_draft_not_story_canon'&&
  plan.source.inherited_detailed_plaza_terminal===
   'docs/01_world/MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL_20261116.json'&&
  plan.source.inherited_connected_city===
   'docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'&&
  plan.draft_parent_segment.id==='MB-WEB-009-DRAFT'&&
  plan.draft_parent_segment.status==='new_draft_geometry_on_existing_graph_edge',
  'Unrecognized or prematurely activated Harbor Walk proposal');
 const world=prepareMeridianBayWorld({state}).world.locations;
 const from=plan.endpoints.from_location_id,to=plan.endpoints.to_location_id;
 fail(from==='LOC-CROSSWATER-PLAZA'&&to==='LOC-HARBOR-WALK'&&
  plan.endpoints.existing_world_graph_link===true&&
  world[from]?.connected_ids?.includes(to)&&
  world[to]?.connected_ids?.includes(from)&&
  world[from]?.public_area===true,
  'Harbor Walk link is absent from the existing story graph');
 const refs=new Map(city.locations.map(x=>[x.id,x.reference_xy_units]));
 const core=city.planning_regions.find(x=>x.id==='MB-REG-CORE');
 fail(core?.box&&Array.isArray(plan.draft_parent_segment.reference_waypoints)&&
  plan.draft_parent_segment.reference_waypoints.length===3&&
  plan.nodes.length===5&&plan.links.length===4&&plan.bands.length===4,
  'Missing established core or invalid four-section proposal');
 const points=[refs.get(from),...plan.draft_parent_segment.reference_waypoints,refs.get(to)];
 fail(points.every(valid)&&points.length===5,'Unknown draft location geometry');
 const ids=new Set();
 let polylineLength=0;
 for(let i=0;i<points.length;i++){
  const p=points[i],n=plan.nodes[i];
  fail(p.x>=core.box.x_min&&p.x<=core.box.x_max&&
   p.y>=core.box.y_min&&p.y<=core.box.y_max&&
   p.x>=0&&p.x<=city.planning_envelope.width_units&&
   p.y>=0&&p.y<=city.planning_envelope.height_units,
   'Harbor walk draft exceeds permitted planning envelope');
  fail(n&&!ids.has(n.id)&&n.id==='MB-PH-N'+i&&close(n.xy,p)&&
   typeof n.name_provisional==='string'&&n.name_provisional.length>5&&
   typeof n.narrative_land_use==='string'&&n.narrative_land_use.length>20&&
   typeof n.junction_design==='string'&&n.junction_design.length>20,
   'An in-between section point is missing or mismatches its source polyline');
  ids.add(n.id);
  if(i===0||i===4){
   fail(n.kind==='district_approach_anchor'&&
    n.location_id===(i===0?from:to),
    'Harbor corridor endpoints must remain actual canonical locations');
  }else{
   fail(n.kind==='intermediate_geometry_node'&&n.location_id===null&&
    !Object.hasOwn(world,n.id),
    'A planning bend cannot create a new saved-world place');
  }
  if(i) {
   const length=dist(points[i-1],p);
   fail(length>0,'A draft corridor contains a zero-length segment');
   polylineLength+=length;
  }
 }
 const direct=dist(points[0],points.at(-1));
 fail(direct>0&&polylineLength/direct<=1.8,
  'Harbor Walk corridor is implausibly circuitous in the planning sketch');
 // Include previously sketched road geometries to avoid an accidental shortcut.
 checkNoDraftCrossings(points,from,to,refs);
 const linkIds=new Set(),bandIds=new Set();
 for(let i=0;i<plan.links.length;i++){
  const l=plan.links[i],b=plan.bands[i];
  fail(l.id==='MB-PH-L'+(i+1)&&!linkIds.has(l.id)&&
   l.from===plan.nodes[i].id&&l.to===plan.nodes[i+1].id&&
   l.type==='single_continuous_candidate_pedestrian_approach'&&
   l.buildings_zone==='MB-PH-B'+(i+1)&&
   typeof l.street_character==='string'&&l.street_character.length>15&&
   typeof l.pedestrian_edge==='string'&&l.pedestrian_edge.length>20&&
   typeof l.access_notes==='string'&&l.access_notes.length>35&&
   l.traffic_flow==='unknown'&&l.estimated_minutes===null,
   'Missing, disconnected or prematurely certified corridor subsegment');
  linkIds.add(l.id);
  fail(b.id===l.buildings_zone&&b.link_id===l.id&&!bandIds.has(b.id)&&
   typeof b.relative_sides?.A==='string'&&b.relative_sides.A.length>25&&
   typeof b.relative_sides?.B==='string'&&b.relative_sides.B.length>25&&
   b.physical_building_footprints_confirmed===false,
   'Each section requires two reversible frontage descriptions, not real plots');
  bandIds.add(b.id);
 }
 const c=plan.coordinate_policy,s=plan.story_consistency,p=plan.inherited_road_web_policy,
  r=plan.cross_section_review,g=plan.acceptance_gates;
 fail(c.coordinates_are_reversible===true&&
  c.true_cardinal_direction_known===false&&
  c.surveyed_road_right_of_way===false&&
  c.shoreline_or_port_perimeter_surveyed===false&&
  c.draft_is_not_vehicle_route===true&&
  c.no_verified_distance_or_travel_minutes===true&&
  plan.draft_parent_segment.named_street===null&&
  plan.draft_parent_segment.real_travel_minutes===null,
  'Unsourced shoreline, road name, vehicle route or travel minutes asserted');
 fail(Array.isArray(s.starting_location_evidence)&&
  s.starting_location_evidence.length===4&&
  s.starting_location_evidence.every(x=>setting.includes(x))&&
  Array.isArray(s.chapter_evidence)&&s.chapter_evidence.length===1&&
  s.chapter_evidence.every(x=>chapter.includes(x))&&
  s.visible_harbor_from_crosswater_must_remain_plausible===true&&
  s.direct_sightline_verified===false&&
  s.industrial_port_access_verified===false&&
  s.passenger_port_access_verified===false&&
  s.land_water_barrier_surveyed===false&&
  s.no_retroactive_story_edits===true&&s.hidden_npc_routes_not_inferred===true,
  'Port views or hidden accessibility contradict the established chapter');
 fail(p.total_proposed_corridors_after_slice===9&&
  p.total_connected_anchors_after_slice===10&&
  p.prior_segment_ids.length===8&&
  p.prior_segment_ids.every((id,i)=>
   [...slice1.segments,...slice2.segments][i].id===id)&&
  p.new_planning_segment_id==='MB-WEB-009-DRAFT'&&
  p.unchanged_existing_market_to_harbor_graph_edge.from_id===
   'LOC-COMMERCIAL-DISTRICT'&&
  p.unchanged_existing_market_to_harbor_graph_edge.to_id===to&&
  p.unchanged_existing_market_to_harbor_graph_edge.geometry_status===
   'not_yet_detailed'&&
  p.unchanged_existing_market_to_harbor_graph_edge.must_not_be_collapsed_into_crosswater_route===true&&
  world['LOC-COMMERCIAL-DISTRICT']?.connected_ids?.includes(to)&&
  world[to]?.connected_ids?.includes('LOC-COMMERCIAL-DISTRICT'),
  'Existing direct Market Row to Harbor Walk branch must not disappear');
 fail(r.conceptual_pedestrian_continuity===true&&
  r.physical_pedestrian_accessibility_verified===false&&
  r.traffic_crossings_verified===false&&
  r.land_vs_water_intersection_verified===false&&
  r.vehicle_access_verified===false&&
  r.building_heights_verified===false&&
  r.public_private_property_line_verified===false&&
  r.no_automatic_port_area_admission===true&&
  Object.values(g).every(v=>v===true),
  'A draft cannot claim surveyed access or bypass review gates');
 return true;
}
export function previewPlazaHarborCorridor({state,fromId,toId}={}){
 validatePlazaHarborCorridor({state});
 const ids=plan.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={
  classification:'narrator_private_waterfront_corridor_draft',
  planId:plan.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,frontageBands:null,
  certifiedPedestrianRoute:false,coastlineVerified:false,
  industrialPortAccessVerified:false,passengerPortAccessVerified:false,
  walkingMinutes:null,roadName:null,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false,canonicalAdmission:false
 };
 if(a<0||b<0)return deep(result);
 const indices=[],step=a<=b?1:-1;
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const links=[];
 for(let i=0;i<indices.length-1;i++)
  links.push(plan.links[Math.min(indices[i],indices[i+1])].id);
 return deep({...result,status:'proposed_connected',nodeIds:indices.map(i=>ids[i]),
  linkIds:links,frontageBands:links.map(id=>plan.links.find(x=>x.id===id).buildings_zone)});
}
export function inspectPlazaHarborCorridor({state}={}){
 validatePlazaHarborCorridor({state});
 return deep({classification:'narrator_private_waterfront_corridor_draft',
  planId:plan.plan_id,status:plan.status,site:'Crosswater Plaza ↔ Harbor Walk',
  nodes:plan.nodes,links:plan.links,frontageBands:plan.bands,
  review:plan.cross_section_review,nextSection:'Market Row ↔ Harbor Walk (not yet drafted)',
  canonicalStateUnchanged:true});
}
