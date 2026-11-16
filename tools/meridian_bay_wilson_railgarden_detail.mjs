// Wilson home -> Railgarden, one read-only and noncanonical detailed connection.
// This validates a copy of previously proposed geometry; no gameplay writes.
import {readFileSync} from 'node:fs';
import {validateMarketHarborCorridor} from './meridian_bay_market_harbor_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const detail=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_WILSON_RAILGARDEN_DETAIL_20261116.json'));
const first=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'));
const canvas=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const setting=read('../game/STARTING_LOCATIONS.md');
const transcript=read('../chapters/CH-000.transcript.json');
const check=(yes,message)=>{if(!yes)throw Error(message);};
const copy=x=>structuredClone(x);
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>valid(a)&&valid(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

export function validateWilsonRailgardenDetail({state}={}){
 validateMarketHarborCorridor({state});
 check(detail.schema_version===1&&
  detail.plan_id==='MB-WILSON-RAILGARDEN-APPROACH-20261116-V1'&&
  detail.type==='single_short_residential_approach'&&
  detail.status==='detailed_draft_not_story_canon'&&
  detail.source.road_web==='docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'&&
  detail.source.parent_segment_id==='MB-WEB-001',
  'Unrecognized detailed home-to-neighborhood proposal');
 const parent=first.segments.find(x=>x.id===detail.source.parent_segment_id);
 const from=detail.endpoints.from_location_id,to=detail.endpoints.to_location_id;
 check(parent&&parent.from_id===from&&parent.to_id===to&&
  from==='LOC-WILSON-APARTMENT'&&to==='LOC-RAILGARDEN-RESIDENTIAL'&&
  parent.known_graph_connection===true&&parent.assumed_bidirectional===true&&
  detail.endpoints.existing_graph_link===true&&parent.via_xy_units.length===1&&
  parent.travel_minutes===null&&parent.established_street_name===null,
  'In-between study must preserve only the existing Wilson–Railgarden connection');
 const graph=prepareMeridianBayWorld({state}).world.locations;
 check(graph[from]?.connected_ids?.includes(to)&&graph[to]?.connected_ids?.includes(from)&&
  graph[from]?.connected_ids?.includes('LOC-WILSON-WORKSHOP')&&
  graph['LOC-WILSON-WORKSHOP']?.connected_ids?.includes(from),
  'Saved Wilson home, workshop, and residential neighborhood graph must remain intact');
 const ref=new Map(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 const pts=[ref.get(from),...parent.via_xy_units,ref.get(to)];
 const core=canvas.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 check(pts.length===3&&pts.every(valid)&&core&&
  detail.nodes.length===3&&detail.links.length===2&&detail.bands.length===2,
  'Expected exactly two in-between approaches with one noncanonical bend');
 const ids=new Set();
 for(let i=0;i<pts.length;i++){
  const n=detail.nodes[i],p=pts[i];
  check(p.x>=core.x_min&&p.x<=core.x_max&&p.y>=core.y_min&&p.y<=core.y_max&&
   n.id==='MB-WR-N'+i&&!ids.has(n.id)&&same(n.xy,p)&&
   typeof n.name_provisional==='string'&&n.name_provisional.length>12&&
   typeof n.narrative_land_use==='string'&&n.narrative_land_use.length>35&&
   typeof n.junction_design==='string'&&n.junction_design.length>35,
   'In-between geometry deviates from source, exits core, or lacks design notes');
  ids.add(n.id);
  if(i===1)check(n.kind==='noncanonical_building_to_neighborhood_marker'&&
   n.location_id===null&&!Object.hasOwn(graph,n.id),
   'Intermediate approach cannot become a new location');
  else check(n.kind==='source_location_anchor'&&n.location_id===(i===0?from:to),
   'Existing source place IDs must remain endpoints');
  if(i)check(distance(pts[i-1],pts[i])>0,'Zero-length home approach');
 }
 const seenLinks=new Set(),seenBands=new Set();
 for(let i=0;i<2;i++){
  const l=detail.links[i],b=detail.bands[i];
  check(l.id==='MB-WR-L'+(i+1)&&!seenLinks.has(l.id)&&
   l.from===detail.nodes[i].id&&l.to===detail.nodes[i+1].id&&
   l.type==='single_continuous_candidate_residential_approach'&&
   l.buildings_zone==='MB-WR-B'+(i+1)&&
   typeof l.street_character==='string'&&l.street_character.length>25&&
   typeof l.pedestrian_edge==='string'&&l.pedestrian_edge.length>35&&
   typeof l.access_notes==='string'&&l.access_notes.length>40&&
   l.traffic_flow==='unknown'&&l.estimated_minutes===null,
   'Home approach has a disconnected interval or falsely confirmed access');
  seenLinks.add(l.id);
  check(b.id===l.buildings_zone&&b.link_id===l.id&&!seenBands.has(b.id)&&
   typeof b.relative_sides?.A==='string'&&b.relative_sides.A.length>45&&
   typeof b.relative_sides?.B==='string'&&b.relative_sides.B.length>45&&
   b.physical_building_footprints_confirmed===false,
   'Each short segment needs two distinct noncanonical frontage descriptions');
  seenBands.add(b.id);
 }
 const s=detail.story_consistency,geo=detail.spatial_policy,g=detail.review_gate;
 check(Array.isArray(s.saved_chapter_fragments)&&s.saved_chapter_fragments.length===4&&
  s.saved_chapter_fragments.every(t=>transcript.includes(t))&&
  Array.isArray(s.starting_location_fragments)&&s.starting_location_fragments.length===4&&
  s.starting_location_fragments.every(t=>setting.includes(t))&&
  s.workshop_remains_inside_apartment===true&&
  s.household_ownership_unresolved===true&&
  s.elena_school_route_unverified===true&&
  s.grocery_and_clinic_are_distinct_phase1_drafts===true&&
  s.no_retroactive_jack_movement===true,
  'Home geography must match the chapter without fictional added details');
 check(geo.reference_grid_only===true&&
  geo.actual_cardinal_orientation_known===false&&
  geo.confirmed_building_footprint===false&&
  geo.building_floor_or_outside_door_set===false&&
  geo.certified_accessible_sidewalk===false&&
  geo.verified_crosswalk===false&&
  geo.verified_vehicle_access===false&&
  geo.verified_times_or_distances===false&&
  geo.original_graph_unchanged===true&&
  geo.original_parent_segment_unchanged===true&&
  geo.all_intermediate_nodes_not_world_locations===true&&
  Object.entries(g).filter(([k])=>k!=='next_standalone_section').every(([,v])=>v===true),
  'Draft cannot assert certified city measurements or create gameplay effects');
 return true;
}
export function previewWilsonRailgardenDetail({state,fromId,toId}={}){
 validateWilsonRailgardenDetail({state});
 const ids=detail.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const out={
  classification:'narrator_private_residential_approach_draft',
  planId:detail.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,frontageBands:null,
  surveyedSidewalk:false,knownApartmentFloor:false,
  certifiedPublicAccess:false,travelMinutes:null,
  canonicalNavigationAuthorized:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false
 };
 if(a<0||b<0)return copy(out);
 const step=a<=b?1:-1,indices=[];
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const links=[];
 for(let i=0;i<indices.length-1;i++)
  links.push(detail.links[Math.min(indices[i],indices[i+1])].id);
 return copy({...out,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds:links,
  frontageBands:links.map(id=>detail.links.find(x=>x.id===id).buildings_zone)});
}
