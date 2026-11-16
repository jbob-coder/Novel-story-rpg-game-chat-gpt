// Market Row ↔ Harbor Walk — read-only review of the independent direct source link.
// Draft bends are not saved-world places; no actual streets, port gates or times.
import {readFileSync} from 'node:fs';
import {validatePlazaHarborCorridor} from './meridian_bay_plaza_harbor_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const plan=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_CORRIDOR_DETAIL_20261116.json'));
const plazaHarbor=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL_20261116.json'));
const slice1=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'));
const slice2=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'));
const city=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const starting=read('../game/STARTING_LOCATIONS.md');
const chapter=read('../chapters/CH-000.transcript.json');
const check=(condition,message)=>{if(!condition)throw Error(message);};
const copy=x=>structuredClone(x);
const point=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>point(a)&&point(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const hypot=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const strictCross=(a,b,c,d)=>
 orient(a,b,c)*orient(a,b,d)<-1e-8&&
 orient(c,d,a)*orient(c,d,b)<-1e-8;
function previousSegments(refs) {
 const segments=[...slice1.segments,...slice2.segments].map(s=>({
  id:s.id,points:[refs.get(s.from_id),...s.via_xy_units,refs.get(s.to_id)]
 }));
 segments.push({id:plazaHarbor.draft_parent_segment.id,
  points:[refs.get(plazaHarbor.endpoints.from_location_id),
   ...plazaHarbor.draft_parent_segment.reference_waypoints,
   refs.get(plazaHarbor.endpoints.to_location_id)]});
 return segments;
}
export function validateMarketHarborCorridor({state}={}){
 validatePlazaHarborCorridor({state});
 check(plan.schema_version===1&&
  plan.plan_id==='MB-MARKET-HARBOR-CORRIDOR-DETAIL-20261116-V1'&&
  plan.type==='single_corridor_micro_map'&&
  plan.status==='detailed_draft_not_story_canon'&&
  plan.sources.prior_crosswater_harbor===
   'docs/01_world/MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL_20261116.json'&&
  plan.geometry.id==='MB-WEB-010-DRAFT'&&
  plan.geometry.new_draft_geometry_only===true,
  'Unknown or prematurely canonical Market–Harbor layout');
 const graph=prepareMeridianBayWorld({state}).world.locations;
 const from=plan.endpoints.from_location_id,to=plan.endpoints.to_location_id;
 check(from==='LOC-COMMERCIAL-DISTRICT'&&to==='LOC-HARBOR-WALK'&&
  plan.endpoints.source_graph_direct_edge===true&&
  graph[from]?.connected_ids?.includes(to)&&graph[to]?.connected_ids?.includes(from),
  'Missing original direct Market Row–Harbor Walk graph link');
 check(plan.review.route_must_not_require_crosswater_plaza===true&&
  plan.review.crosswater_harbor_route_must_remain===true&&
  graph[from].connected_ids.includes('LOC-CROSSWATER-PLAZA')&&
  graph['LOC-CROSSWATER-PLAZA']?.connected_ids?.includes(to),
  'The direct Market–Harbor source route must coexist with Crosswater route');
 const refs=new Map(city.locations.map(x=>[x.id,x.reference_xy_units]));
 const box=city.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 const pts=[refs.get(from),...plan.geometry.via_xy_units,refs.get(to)];
 check(box&&pts.length===6&&pts.every(point)&&
  plan.nodes.length===6&&plan.links.length===5&&plan.bands.length===5,
  'Expected exactly five connected in-between Market–Harbor sections');
 const ids=new Set();
 let length=0;
 for(let i=0;i<pts.length;i++){
  const p=pts[i],node=plan.nodes[i];
  check(p.x>=box.x_min&&p.x<=box.x_max&&p.y>=box.y_min&&p.y<=box.y_max,
   'Market–Harbor geometry leaves the provisional core envelope');
  check(node&&node.id==='MB-MH-N'+i&&!ids.has(node.id)&&
   same(node.xy,p)&&
   typeof node.name_provisional==='string'&&node.name_provisional.length>8&&
   typeof node.narrative_land_use==='string'&&node.narrative_land_use.length>24&&
   typeof node.junction_design==='string'&&node.junction_design.length>24,
   'Incomplete or disconnected in-between map point');
  ids.add(node.id);
  if(i===0||i===5){
   check(node.kind==='district_approach_anchor'&&
    node.location_id===(i===0?from:to),
    'Map endpoints must preserve source place identities');
  }else{
   check(node.kind==='intermediate_geometry_node'&&node.location_id===null&&
    !Object.hasOwn(graph,node.id),
    'Draft map bend cannot become a canonical location');
  }
  if(i) {
   const step=hypot(pts[i-1],p);
   check(step>0,'Zero-length interval');
   length+=step;
  }
 }
 check(length/hypot(pts[0],pts.at(-1))<=1.8,
  'Implausibly long drafted detour between Market Row and Harbor Walk');
 const previous=previousSegments(refs);
 check(previous.length===9&&plan.review.charted_prior_web_segments_count===9,
  'Prior proposed road network does not match review evidence');
 for(const old of previous){
  check(old.points.every(point),'A previous corridor lacks a defined sketch reference');
  for(let i=1;i<pts.length;i++)for(let j=1;j<old.points.length;j++){
   check(!strictCross(pts[i-1],pts[i],old.points[j-1],old.points[j]),
    'Unregistered crossing of existing route sketches');
  }
  // Also reject an internal new waypoint lying directly on an old segment.
  for(let i=1;i<pts.length-1;i++)for(let j=1;j<old.points.length;j++){
   const p=pts[i],a=old.points[j-1],b=old.points[j];
   const d=hypot(a,b);
   if(d>0&&Math.abs(orient(a,b,p))<1e-7&&
      hypot(a,p)+hypot(p,b)<d+1e-7){
    check(false,'Unregistered junction at an intermediate planning point');
   }
  }
 }
 const uniqueLinkIds=new Set(),uniqueBands=new Set();
 for(let i=0;i<plan.links.length;i++){
  const link=plan.links[i],band=plan.bands[i];
  check(link.id==='MB-MH-L'+(i+1)&&!uniqueLinkIds.has(link.id)&&
   link.from===plan.nodes[i].id&&link.to===plan.nodes[i+1].id&&
   link.type==='single_continuous_candidate_pedestrian_approach'&&
   link.buildings_zone==='MB-MH-B'+(i+1)&&
   typeof link.street_character==='string'&&link.street_character.length>12&&
   typeof link.pedestrian_edge==='string'&&link.pedestrian_edge.length>20&&
   typeof link.access_notes==='string'&&link.access_notes.length>20&&
   link.traffic_flow==='unknown'&&link.estimated_minutes===null,
   'Invalid interior segment or fake route time');
  uniqueLinkIds.add(link.id);
  check(band.id===link.buildings_zone&&!uniqueBands.has(band.id)&&
   band.link_id===link.id&&band.physical_building_footprints_confirmed===false&&
   typeof band.relative_sides?.A==='string'&&band.relative_sides.A.length>25&&
   typeof band.relative_sides?.B==='string'&&band.relative_sides.B.length>25,
   'Missing two-sided or falsely surveyed building band');
  uniqueBands.add(band.id);
 }
 const s=plan.story_constraints,r=plan.review,g=plan.geometry,k=plan.invariants;
 check(s.starting_location_fragments.length===2&&
  s.starting_location_fragments.every(t=>starting.includes(t))&&
  s.chapter_fragments.length===1&&s.chapter_fragments.every(t=>chapter.includes(t))&&
  s.does_not_replace_crosswater_transit_plaza_route===true&&
  s.harbor_lights_remain_plausible===true&&
  s.direct_optical_sightline_claimed===false&&
  s.new_npc_events_created===false&&s.no_jack_movement===true,
  'Direct Harbor approach must not rewrite played story');
 check(g.street_name===null&&g.travel_minutes===null&&
  g.vehicle_access_certified===false&&g.approximate_canvas_only===true&&
  g.shoreline_surveyed===false&&g.private_port_access_certified===false&&
  r.projected_total_provisional_segments===10&&
  r.unique_known_location_anchors_total===10&&
  r.no_actual_distance_or_duration===true&&r.no_claim_of_quicker_route===true&&
  r.real_pedestrian_accessibility_verified===false&&
  r.traffic_lane_or_crosswalk_verified===false&&
  r.land_vs_water_boundary_verified===false&&
  r.full_city_audit_not_yet_performed===true&&
  Object.values(k).every(v=>v===true),
  'Draft cannot claim road priority, shoreline, access or canonical effects');
 return true;
}
export function previewMarketHarborCorridor({state,fromId,toId}={}){
 validateMarketHarborCorridor({state});
 const ids=plan.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={
  classification:'narrator_private_direct_market_harbor_draft',
  planId:plan.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,frontageBands:null,
  certifiedPedestrianRoute:false,streetName:null,travelMinutes:null,
  shorelineVerified:false,privatePortAccessVerified:false,
  shortestCityRouteClaimed:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false,canonicalAdmission:false
 };
 if(a<0||b<0)return copy(result);
 const step=a<=b?1:-1,indices=[];
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const linkIds=[];
 for(let i=0;i<indices.length-1;i++)
  linkIds.push(plan.links[Math.min(indices[i],indices[i+1])].id);
 return copy({...result,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds,
  frontageBands:linkIds.map(id=>plan.links.find(x=>x.id===id).buildings_zone)});
}
