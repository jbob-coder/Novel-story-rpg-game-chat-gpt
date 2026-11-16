// Railgarden → Market Row: read-only review of *one* detailed draft corridor.
// Geometry nodes are planning features, never canonical LOC locations.
import {readFileSync} from 'node:fs';
import {validateMeridianBayRoadWeb} from './meridian_bay_road_web.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const plan=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL_20261116.json'));
const parent=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'));
const canvas=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const originalStory=read('../chapters/CH-000.transcript.json');
const check=(condition,message)=>{if(!condition)throw Error(message);};
const copy=x=>structuredClone(x);
const point=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const equalsPoint=(a,b)=>point(a)&&point(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;

export function validateRailgardenMarketCorridor({state}={}){
 validateMeridianBayRoadWeb({state});
 check(plan.schema_version===1&&
  plan.plan_id==='MB-RAIL-MARKET-CORRIDOR-DETAIL-20261116-V1'&&
  plan.type==='single_corridor_micro_map'&&
  plan.status==='detailed_draft_not_story_canon',
  'Unknown or promoted corridor draft');
 check(plan.source.inherited_first_slice==='docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'&&
  plan.source.source_city_canvas==='docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'&&
  plan.source.story_evidence==='docs/01_world/MERIDIAN_BAY_STORY_MAP_EVIDENCE_20261116.json',
  'Unreviewed map foundation');
 const base=parent.segments.find(x=>x.id===plan.endpoints.draft_parent_segment_id);
 check(base&&base.from_id===plan.endpoints.from_location_id&&
  base.to_id===plan.endpoints.to_location_id&&
  base.id==='MB-WEB-002'&&plan.endpoints.existing_world_graph_link===true,
  'Detailed section cannot invent a new district road');
 const world=prepareMeridianBayWorld({state}).world.locations;
 check(world[base.from_id].connected_ids.includes(base.to_id)&&
  world[base.to_id].connected_ids.includes(base.from_id),
  'District road absent from approved original location graph');
 const pos=new Map(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 const parentPoints=[pos.get(base.from_id),...base.via_xy_units,pos.get(base.to_id)];
 check(parentPoints.every(point),'Parent street sketch missing');
 check(plan.nodes.length===parentPoints.length&&plan.nodes.length===5&&
  plan.links.length===4&&plan.bands.length===4,
  'Section must contain exactly four contiguous micro-segments');
 const ids=new Set();
 for(let i=0;i<plan.nodes.length;i++){
  const node=plan.nodes[i];
  check(typeof node.id==='string'&&!ids.has(node.id),
   'Duplicate geometry node');
  ids.add(node.id);
  check(equalsPoint(node.xy,parentPoints[i])&&
   typeof node.name_provisional==='string'&&node.name_provisional.length>5&&
   typeof node.narrative_land_use==='string'&&node.narrative_land_use.length>15&&
   typeof node.junction_design==='string'&&node.junction_design.length>15,
   'Detailed node deviates from reviewed corridor geometry or lacks junction description');
  if(i===0||i===plan.nodes.length-1){
   check(node.kind==='district_approach_anchor'&&
    node.location_id===(i===0?base.from_id:base.to_id),
    'District endpoints must remain the original location IDs');
  }else{
   check(node.kind==='intermediate_geometry_node'&&node.location_id===null&&
    !Object.hasOwn(world,node.id),
    'Intermediate planning nodes cannot be new saved-world places');
  }
 }
 const sides=new Set();
 for(let i=0;i<plan.links.length;i++){
  const link=plan.links[i],band=plan.bands[i];
  check(link.from===plan.nodes[i].id&&link.to===plan.nodes[i+1].id&&
   link.type==='single_continuous_candidate_corridor'&&
   typeof link.street_character==='string'&&link.street_character.length>12&&
   typeof link.pedestrian_edge==='string'&&link.pedestrian_edge.length>12&&
   link.estimated_minutes===null&&link.traffic_flow==='unknown',
   'Missing or noncontiguous intermediate corridor links');
  check(band.link_id===link.id&&band.id===link.buildings_zone&&
   !sides.has(band.id)&&band.physical_building_footprints_confirmed===false&&
   typeof band.relative_sides?.A==='string'&&
   typeof band.relative_sides?.B==='string'&&
   typeof band.visual_character==='string',
   'Missing, duplicated or falsely surveyed frontage band');
  sides.add(band.id);
 }
 const c=plan.coordinate_policy,x=plan.cross_section_review,g=plan.review_gate;
 check(c.coordinates_are_reversible===true&&
  c.true_cardinal_direction_known===false&&
  c.confirmed_street_centerline===false&&
  c.surveyed_road_right_of_way===false&&
  c.roadway_length_or_travel_minutes===null&&
  x.continuity_verified_against_actual_footprints===false&&
  x.accessible_crossings==='unknown'&&
  x.lanes==='not_fixed'&&x.building_heights==='not_fixed'&&
  x.vehicle_access==='unknown',
  'Unverified geometry or access must remain explicitly provisional');
 check(g.can_create_story_events===false&&
  g.can_author_new_canonical_places===false&&
  g.can_assign_npc_schedules===false&&
  g.may_advance_time===false&&g.may_promote_to_playable_navigation===false,
  'Street sketch cannot activate gameplay');
 check(plan.story_consistency.required_literal_fragment.length>20&&
  originalStory.includes(plan.story_consistency.required_literal_fragment)&&
  JSON.stringify(plan.story_consistency.return_sequence)===
   JSON.stringify([base.to_id,base.from_id,'LOC-WILSON-APARTMENT']),
  'Corridor placement contradicts the saved return scene');
 return true;
}

export function previewRailgardenMarketCorridor({state,fromId,toId}={}){
 validateRailgardenMarketCorridor({state});
 const list=plan.nodes.map(x=>x.id);
 const a=list.indexOf(fromId),b=list.indexOf(toId);
 const result={
  classification:'narrator_private_single_corridor_draft',
  status:'outside_this_corridor',
  planId:plan.plan_id,
  fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,frontageBands:null,
  roadNames:null,walkingMinutes:null,accessibleCrossingVerified:false,
  canonicalNavigationAuthorized:false,playerMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false
 };
 if(a<0||b<0)return copy(result);
 const step=a<=b?1:-1;
 const indices=[];
 for(let i=a; ;i+=step){indices.push(i);if(i===b)break;}
 const route=indices.map(i=>list[i]);
 const links=[];
 for(let i=0;i<indices.length-1;i++){
  const item=plan.links[Math.min(indices[i],indices[i+1])];
  links.push(item.id);
 }
 return copy({...result,status:'proposed_connected',nodeIds:route,linkIds:links,
  frontageBands:links.map(id=>plan.links.find(x=>x.id===id).buildings_zone)});
}

export function inspectRailgardenMarketCorridor({state}={}){
 validateRailgardenMarketCorridor({state});
 return copy({
  classification:'narrator_private_single_corridor_draft',
  planId:plan.plan_id,site:'Railgarden–Market Row only',
  nodes:plan.nodes,links:plan.links,frontageBands:plan.bands,
  crossSection:plan.cross_section_review,
  nextSectionBlockedUntilReview:true,
  canonicalStateUnchanged:true
 });
}
