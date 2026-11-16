// Single-section Market Row to Crosswater detail; never admits roads into canon.
import {readFileSync} from 'node:fs';
import {validateMeridianBayRoadExpansion} from './meridian_bay_road_web_expansion.mjs';
import {validateRailgardenMarketCorridor} from './meridian_bay_rail_market_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const detail=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_MARKET_CROSS_CORRIDOR_DETAIL_20261116.json'));
const sketch=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'));
const scale=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const preceding=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL_20261116.json'));
const chapter=read('../chapters/CH-000.transcript.json');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const clone=value=>structuredClone(value);
const isPoint=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const samePoint=(a,b)=>isPoint(a)&&isPoint(b)&&
 Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;

export function validateMarketCrosswaterCorridor({state}={}){
 validateRailgardenMarketCorridor({state});
 validateMeridianBayRoadExpansion({state});
 assert(detail.schema_version===1&&
  detail.plan_id==='MB-MARKET-CROSS-CORRIDOR-DETAIL-20261116-V1'&&
  detail.status==='detailed_draft_not_story_canon'&&
  detail.type==='single_corridor_micro_map'&&
  detail.policy==='complete_this_section_before_designing_next_section',
  'Market-Crosswater must stay an isolated draft section');
 assert(detail.source.parent_road_sketch==='docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'&&
  detail.source.preceding_detail==='docs/01_world/MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL_20261116.json'&&
  preceding.plan_id==='MB-RAIL-MARKET-CORRIDOR-DETAIL-20261116-V1',
  'Previous reviewed road section was displaced');
 const parent=sketch.segments.find(x=>x.id===detail.endpoints.parent_segment_id);
 assert(parent?.id==='MB-WEB-007'&&
  parent.from_id===detail.endpoints.from_location_id&&
  parent.to_id===detail.endpoints.to_location_id&&
  parent.from_id==='LOC-COMMERCIAL-DISTRICT'&&
  parent.to_id==='LOC-CROSSWATER-PLAZA',
  'Detailed corridor does not match the existing Market Row–Crosswater link');
 const locations=prepareMeridianBayWorld({state}).world.locations;
 assert(locations[parent.from_id].connected_ids.includes(parent.to_id)&&
  locations[parent.to_id].connected_ids.includes(parent.from_id),
  'Existing story graph does not support this corridor');
 const ref=new Map(scale.locations.map(x=>[x.id,x.reference_xy_units]));
 const polyline=[ref.get(parent.from_id),...parent.via_xy_units,ref.get(parent.to_id)];
 assert(polyline.every(isPoint)&&polyline.length===5&&
  detail.nodes.length===5&&detail.links.length===4&&
  detail.frontage_bands.length===4,
  'Corridor needs five ordered points and four detailed spans');
 const nodeIds=new Set(),linkIds=new Set(),bandIds=new Set();
 for(let i=0;i<detail.nodes.length;i++){
  const n=detail.nodes[i];
  assert(typeof n.id==='string'&&!nodeIds.has(n.id)&&samePoint(n.xy,polyline[i])&&
   typeof n.site==='string'&&n.site.length>8&&
   typeof n.street_role==='string'&&n.street_role.length>20&&
   typeof n.junction==='string'&&n.junction.length>20,
   'Section node is disconnected or missing design context');
  nodeIds.add(n.id);
  if(i===0||i===4){
   assert(n.kind==='district_approach_anchor'&&
    n.location_id===(i===0?parent.from_id:parent.to_id),
    'Corridor endpoints cannot move');
  }else{
   assert(n.kind==='intermediate_geometry_node'&&n.location_id===null&&
    !Object.hasOwn(locations,n.id),'Intermediate geometry must not create a story place');
  }
 }
 for(let i=0;i<4;i++){
  const l=detail.links[i],b=detail.frontage_bands[i];
  assert(!linkIds.has(l.id)&&l.from===detail.nodes[i].id&&l.to===detail.nodes[i+1].id&&
   l.frontage_band===b.id&&l.character.length>12&&
   l.pedestrian_concept.length>20&&l.site_access.length>20&&
   l.crossing_verified===false&&l.vehicle_rules==='unknown'&&
   l.time_minutes===null,
   'Gap, duplicated segment, or falsely confirmed travel access');
  assert(!bandIds.has(b.id)&&b.link_id===l.id&&
   typeof b.side_a==='string'&&b.side_a.length>15&&
   typeof b.side_b==='string'&&b.side_b.length>15&&
   typeof b.activity_scope==='string'&&
   b.physical_buildings_confirmed===false&&b.visual_openings_verified===false,
   'Missing or prematurely approved two-sided frontage');
  linkIds.add(l.id);bandIds.add(b.id);
 }
 const controls=detail.sketch_limits,gate=detail.validation_gate,v=detail.visibility_gate;
 assert(Object.values(controls).every(x=>x===true)&&
  gate.parent_geometry_must_match_exactly===true&&
  gate.one_continuous_corridor_only===true&&
  gate.each_link_has_two_sided_frontage===true&&
  gate.missing_source_graph_link_must_fail===true&&
  gate.previous_rail_market_detail_unchanged===true&&
  gate.no_automatic_game_state_changes===true&&
  gate.no_npc_placements===true&&gate.no_story_advance===true,
  'Story preservation and incremental section gates are mandatory');
 assert(v.origin_location_id==='LOC-CAFE-BRUMA'&&
  v.related_area_id==='LOC-TRANSIT-TERMINAL'&&
  v.exact_corner_unknown===true&&v.building_massing_unknown===true&&
  v.raycast_or_sightline_completed===false&&
  v.block_new_obstructing_building_canon_until_review===true&&
  v.do_not_claim_direct_line_of_sight===true,
  'Café terminal glow must remain possible but not physically certified');
 const requirements=new Set();
 assert(detail.story_requirements.length===3,'Story evidence is incomplete');
 for(const requirement of detail.story_requirements){
  assert(!requirements.has(requirement.id)&&
   typeof requirement.fragment==='string'&&
   chapter.includes(requirement.fragment)&&
   typeof requirement.meaning==='string'&&requirement.meaning.length>25,
   'Missing source-backed CH-000 scene fact');
  requirements.add(requirement.id);
 }
 return true;
}

export function previewMarketCrosswaterCorridor({state,fromId,toId}={}){
 validateMarketCrosswaterCorridor({state});
 const nodes=detail.nodes.map(x=>x.id),start=nodes.indexOf(fromId),end=nodes.indexOf(toId);
 const response={
  classification:'narrator_private_single_corridor_draft',
  status:'outside_this_corridor',
  planId:detail.plan_id,fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,frontageBands:null,walkingMinutes:null,
  roadNames:null,buildingGeometryVerified:false,
  cafeTerminalSightlineVerified:false,
  canonicalNavigationAuthorized:false,
  playerMoved:false,fictionalTimeAdvanced:false,playerKnowledgeChanged:false
 };
 if(start<0||end<0)return clone(response);
 const indices=[],delta=start<=end?1:-1;
 for(let i=start;;i+=delta){indices.push(i);if(i===end)break;}
 const links=[];
 for(let i=0;i<indices.length-1;i++)links.push(detail.links[Math.min(indices[i],indices[i+1])]);
 return clone({...response,status:'proposed_connected',
  nodeIds:indices.map(i=>nodes[i]),linkIds:links.map(x=>x.id),
  frontageBands:links.map(x=>x.frontage_band)});
}

export function inspectMarketCrosswaterCorridor({state}={}){
 validateMarketCrosswaterCorridor({state});
 return clone({classification:'narrator_private_single_corridor_draft',
  planId:detail.plan_id,status:detail.status,
  nodes:detail.nodes,links:detail.links,frontageBands:detail.frontage_bands,
  unresolvedVisibility:detail.visibility_gate,storyRequirements:detail.story_requirements,
  noSavedWorldMutation:true,
  futureSectionBlockedUntilReview:true});
}
