// Market Row -> Crosswater Plaza: one detailed corridor, never canonical routing.
import {readFileSync} from 'node:fs';
import {validateMeridianBayRoadExpansion} from './meridian_bay_road_web_expansion.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const detail=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_MARKET_CROSSWATER_CORRIDOR_DETAIL_20261116.json'));
const parent=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'));
const canvas=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const transcript=read('../chapters/CH-000.transcript.json');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const copy=x=>structuredClone(x);
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>valid(a)&&valid(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;

export function validateMarketCrosswaterCorridor({state}={}){
 validateMeridianBayRoadExpansion({state});
 check(detail.schema_version===1&&
  detail.plan_id==='MB-MARKET-CROSSWATER-CORRIDOR-DETAIL-20261116-V1'&&
  detail.type==='single_corridor_micro_map'&&
  detail.status==='detailed_draft_not_story_canon'&&
  detail.source.inherited_second_slice==='docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'&&
  detail.source.story_evidence==='docs/01_world/MERIDIAN_BAY_STORY_MAP_EVIDENCE_20261116.json',
  'Unreviewed or promoted Market–Crosswater draft');
 const segment=parent.segments.find(s=>s.id===detail.endpoints.draft_parent_segment_id);
 check(segment?.id==='MB-WEB-007'&&
  segment.from_id===detail.endpoints.from_location_id&&
  segment.to_id===detail.endpoints.to_location_id&&
  detail.endpoints.existing_world_graph_link===true,
  'Detail must inherit exactly the story-backed Market–Crosswater connection');
 const world=prepareMeridianBayWorld({state}).world.locations;
 check(world[segment.from_id].connected_ids.includes(segment.to_id)&&
  world[segment.to_id].connected_ids.includes(segment.from_id),
  'Unrecognized district-to-plaza road');
 const anchors=new Map(canvas.locations.map(x=>[x.id,x.reference_xy_units]));
 const points=[anchors.get(segment.from_id),...segment.via_xy_units,anchors.get(segment.to_id)];
 check(points.length===5&&points.every(valid)&&
  detail.nodes.length===5&&detail.links.length===4&&detail.bands.length===4,
  'One corridor must contain five nodes and four detailed intervals');
 const nodeIds=new Set();
 for(let i=0;i<detail.nodes.length;i++){
  const node=detail.nodes[i];
  check(typeof node.id==='string'&&!nodeIds.has(node.id)&&same(node.xy,points[i])&&
   typeof node.name_provisional==='string'&&node.name_provisional.length>4&&
   typeof node.narrative_land_use==='string'&&node.narrative_land_use.length>20&&
   typeof node.junction_design==='string'&&node.junction_design.length>20,
   'Unreviewed geometry or blank in-between node');
  nodeIds.add(node.id);
  if(i===0||i===4)
   check(node.kind==='district_approach_anchor'&&
    node.location_id===(i===0?segment.from_id:segment.to_id),
    'Detail must use established district endpoints');
  else
   check(node.kind==='intermediate_geometry_node'&&node.location_id===null&&
    !Object.hasOwn(world,node.id),
    'Planning bend must never create a new story location');
 }
 const bandIds=new Set(),linkIds=new Set();
 for(let i=0;i<detail.links.length;i++){
  const link=detail.links[i],band=detail.bands[i];
  check(!linkIds.has(link.id)&&link.from===detail.nodes[i].id&&
   link.to===detail.nodes[i+1].id&&
   link.type==='single_continuous_candidate_corridor'&&
   typeof link.street_character==='string'&&link.street_character.length>12&&
   typeof link.pedestrian_edge==='string'&&link.pedestrian_edge.length>15&&
   typeof link.access_notes==='string'&&link.access_notes.length>25&&
   link.traffic_flow==='unknown'&&link.estimated_minutes===null,
   'Interval is disconnected or overstates access or travel time');
  linkIds.add(link.id);
  check(!bandIds.has(band.id)&&band.id===link.buildings_zone&&
   band.link_id===link.id&&band.physical_building_footprints_confirmed===false&&
   typeof band.relative_sides?.A==='string'&&band.relative_sides.A.length>15&&
   typeof band.relative_sides?.B==='string'&&band.relative_sides.B.length>15,
   'A frontage band is missing, duplicated or falsely treated as built');
  bandIds.add(band.id);
 }
 const c=detail.coordinate_policy,x=detail.cross_section_review,s=detail.story_consistency,g=detail.review_gate;
 check(c.coordinates_are_reversible===true&&
  c.true_cardinal_direction_known===false&&
  c.confirmed_street_centerline===false&&
  c.surveyed_road_right_of_way===false&&
  c.roadway_length_or_travel_minutes===null&&
  x.continuity_verified_against_actual_footprints===false&&
  x.accessible_crossings==='unknown'&&x.vehicle_access==='unknown'&&
  x.lanes==='not_fixed'&&x.building_heights==='not_fixed',
  'Unknown road or parcel geometry must remain unknown');
 check(s.terminal_glow_must_remain_plausible===true&&
  s.direct_sightline_verified===false&&s.building_massing_surveyed===false&&
  s.cafe_frontage_does_not_move===true&&s.no_retroactive_player_route===true&&
  Array.isArray(s.required_literal_fragments)&&s.required_literal_fragments.length===3&&
  s.required_literal_fragments.every(t=>transcript.includes(t))&&
  JSON.stringify(s.arrival_sequence)===JSON.stringify([
   'LOC-CROSSWATER-PLAZA','LOC-COMMERCIAL-DISTRICT','LOC-CAFE-BRUMA'
  ]),'Crosswater approach contradicts played café scene or invents a sightline');
 check(g.can_create_story_events===false&&
  g.can_author_new_canonical_places===false&&
  g.can_assign_npc_schedules===false&&
  g.may_advance_time===false&&g.may_promote_to_playable_navigation===false,
  'Detailed street planning cannot move the story');
 return true;
}

export function previewMarketCrosswaterCorridor({state,fromId,toId}={}){
 validateMarketCrosswaterCorridor({state});
 const ids=detail.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={
  classification:'narrator_private_single_corridor_draft',
  planId:detail.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,frontageBands:null,
  cafeToTerminalSightlineVerified:false,roadNames:null,walkingMinutes:null,
  canonicalNavigationAuthorized:false,playerMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false
 };
 if(a<0||b<0)return copy(result);
 const indices=[],step=a<=b?1:-1;
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const linkIds=[];
 for(let i=0;i<indices.length-1;i++)
  linkIds.push(detail.links[Math.min(indices[i],indices[i+1])].id);
 return copy({...result,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds,
  frontageBands:linkIds.map(id=>detail.links.find(x=>x.id===id).buildings_zone)});
}

export function inspectMarketCrosswaterCorridor({state}={}){
 validateMarketCrosswaterCorridor({state});
 return copy({
  classification:'narrator_private_single_corridor_draft',
  planId:detail.plan_id,site:'Market Row–Crosswater Plaza only',
  nodes:detail.nodes,links:detail.links,frontageBands:detail.bands,
  crossSection:detail.cross_section_review,
  storyConstraints:detail.story_consistency,
  nextSectionBlockedUntilReview:true,canonicalStateUnchanged:true
 });
}
