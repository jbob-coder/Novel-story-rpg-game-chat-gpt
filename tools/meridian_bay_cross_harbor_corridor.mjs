// Draft-only Crosswater Plaza → Harbor Walk corridor review.
// Geometry-only waypoints are not saved locations, and no story time advances.
import {readFileSync} from 'node:fs';
import {validateMarketCrosswaterCorridor} from './meridian_bay_market_cross_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const obj=p=>JSON.parse(read(p));
const detail=obj('../docs/01_world/MERIDIAN_BAY_CROSS_HARBOR_CORRIDOR_DETAIL_20261116.json');
const parent=obj('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE3_20261116.json');
const evidence=obj('../docs/01_world/MERIDIAN_BAY_WATERFRONT_STORY_EVIDENCE_20261116.json');
const scale=obj('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const sources=new Map([
 ['game/STARTING_LOCATIONS.md',read('../game/STARTING_LOCATIONS.md')],
 ['chapters/CH-000.transcript.json',read('../chapters/CH-000.transcript.json')]
]);
const need=(pass,message)=>{if(!pass)throw Error(message);};
const copy=x=>structuredClone(x);
const numeric=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>numeric(a)&&numeric(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const properlyCross=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&
 orient(c,d,a)*orient(c,d,b)<-1e-8;

export function validateCrosswaterHarborCorridor({state}={}){
 validateMarketCrosswaterCorridor({state});
 need(detail.schema_version===1&&
  detail.plan_id==='MB-CROSS-HARBOR-CORRIDOR-DETAIL-20261116-V1'&&
  detail.type==='single_corridor_micro_map'&&
  detail.status==='detailed_draft_not_story_canon'&&
  detail.scope==='Crosswater Plaza to Harbor Walk only; detailed in-between',
  'Expected isolated Crosswater–Harbor design');
 need(detail.preceding_detail_ids.length===2&&
  detail.preceding_detail_ids[0]==='MB-RAIL-MARKET-CORRIDOR-DETAIL-20261116-V1'&&
  detail.preceding_detail_ids[1]==='MB-MARKET-CROSS-CORRIDOR-DETAIL-20261116-V1'&&
  detail.dependencies.parent_outline==='docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE3_20261116.json'&&
  detail.dependencies.waterfront_evidence==='docs/01_world/MERIDIAN_BAY_WATERFRONT_STORY_EVIDENCE_20261116.json',
  'Cannot discard prior detailed sections or story-source authority');
 need(parent.plan_id==='MB-ROAD-WEB-SLICE3-20261116'&&
  parent.source_evidence===evidence.id&&
  evidence.id==='MB-WATERFRONT-STORY-EVIDENCE-CH000-20261116',
  'Waterfront outline or story evidence mismatch');
 const link=parent.segments.find(s=>s.id===detail.endpoints.parent_segment_id);
 need(parent.segments.length===1&&link?.id==='MB-WEB-009'&&
  link.from_id==='LOC-CROSSWATER-PLAZA'&&link.to_id==='LOC-HARBOR-WALK'&&
  detail.endpoints.from===link.from_id&&detail.endpoints.to===link.to_id&&
  link.connected_graph_edge_existing===true,
  'Not the pre-established public waterfront connection');
 const saved=prepareMeridianBayWorld({state}).world.locations;
 need(saved[link.from_id]?.connected_ids.includes(link.to_id)&&
  saved[link.to_id]?.connected_ids.includes(link.from_id),
  'Waterfront link is absent from the saved world graph');
 need(saved['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes('LOC-HARBOR-WALK')&&
  saved['LOC-HARBOR-WALK'].connected_ids.includes('LOC-COMMERCIAL-DISTRICT'),
  'The separate Market Row–Harbor Walk graph link must not disappear');
 const pos=new Map(scale.locations.map(x=>[x.id,x.reference_xy_units]));
 const polyline=[pos.get(link.from_id),...link.via_xy_units,pos.get(link.to_id)];
 need(detail.nodes.length===5&&detail.links.length===4&&
  detail.frontage_bands.length===4&&polyline.length===5,
  'Expected four detailed intermediate route links');
 const ids=new Set();
 for(let i=0;i<5;i++){
  const node=detail.nodes[i];
  need(typeof node.id==='string'&&!ids.has(node.id)&&
   same(node.xy,polyline[i])&&node.name.length>10&&
   node.existing_story_context.length>30&&
   node.proposed_junction_detail.length>25,
   'Waterfront detail node deviates from parent geometry or lacks site context');
  ids.add(node.id);
  if(i===0||i===4){
   need(node.kind==='existing_location_reference'&&
    node.location_id===(i===0?link.from_id:link.to_id),
    'Corridor endpoints must be established world locations');
  } else {
   need(node.kind==='draft_waypoint_only'&&node.location_id===null&&
    !Object.hasOwn(saved,node.id),
    'An intermediate planning point cannot become a canonical place');
  }
 }
 const usedLinks=new Set(),usedBands=new Set();
 for(let i=0;i<4;i++){
  const segment=detail.links[i],band=detail.frontage_bands[i];
  need(!usedLinks.has(segment.id)&&
   segment.from===detail.nodes[i].id&&segment.to===detail.nodes[i+1].id&&
   segment.band_id===band.id&&segment.street_character.length>20&&
   segment.pedestrian_continuity.length>25&&
   segment.crossing_type==='not_established'&&
   segment.public_access_verified===false&&segment.travel_minutes===null,
   'Missing or unverified waterfront section detail');
  need(!usedBands.has(band.id)&&band.link_id===segment.id&&
   band.side_a.length>20&&band.side_b.length>20&&
   band.general_view.length>25&&
   band.footprints_verified===false&&band.water_access_granted===false,
   'Frontage was not described or wrongly grants access to secure port');
  usedLinks.add(segment.id);usedBands.add(band.id);
 }
 const byId=new Map(detail.source_requirements.map(x=>[x.id,x]));
 need(byId.size===5&&evidence.requirements.length===4,
  'Missing chapter-linked spatial constraints');
 for(const requirement of detail.source_requirements){
  const source=sources.get(requirement.source);
  need(typeof source==='string'&&
   typeof requirement.fragment==='string'&&source.includes(requirement.fragment)&&
   requirement.rule.length>25,
   'Waterfront story detail is not present in the saved source');
 }
 for(const requirement of evidence.requirements){
  const source=sources.get(requirement.path);
  need(source&&requirement.literal_fragments.every(x=>source.includes(x)),
   'Original waterfront evidence has drifted');
 }
 const limits=detail.layout_policy,v=detail.visibility_review,g=detail.review_gate;
 need(Object.entries(limits).every(([k,val])=>
  k==='road_travel_minutes'?val===null:((k==='bidirectional_pedestrian_candidate')?val===true:
  (k==='real_shoreline_unknown'?val===true:typeof val==='boolean')))&&
  limits.planning_nodes_are_not_locations===true&&
  limits.existing_connected_ids_unchanged===true&&
  limits.no_new_streets_or_shortcuts===true&&
  limits.accessibility_verified===false&&
  limits.harbor_facility_access_verified===false,
  'Corridor cannot claim surveyed routes, port access or a world-state update');
 need(v.visibility_ray_verified===false&&
  v.frontage_height_unknown===true&&
  v.waterfront_outline_unknown===true&&
  v.public_shipyard_dock_entry_approved===false&&
  v.do_not_introduce_buildings_blocking_existing_story_view===true&&
  g.detailed_section_must_match_parent_outline===true&&
  g.preserve_market_harbor_direct_graph_edge===true&&
  g.no_new_canon_locations===true&&
  g.no_story_time_progress===true&&g.no_player_or_npc_movement===true,
  'Visibility, access and story safety gates missing');
 // Prior street sketches are separate connections and must not create
 // invisible X-shaped crossings with this corridor; shared endpoints are okay.
 const prior=[
  ...obj('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json').segments,
  ...obj('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json').segments
 ];
 for(const old of prior){
  const oldPts=[pos.get(old.from_id),...old.via_xy_units,pos.get(old.to_id)];
  for(let i=1;i<polyline.length;i++)for(let j=1;j<oldPts.length;j++)
   need(!properlyCross(polyline[i-1],polyline[i],oldPts[j-1],oldPts[j]),
    'Unregistered geometric crossing between detailed sections');
 }
 return true;
}

export function previewCrosswaterHarborCorridor({state,fromId,toId}={}){
 validateCrosswaterHarborCorridor({state});
 const names=detail.nodes.map(x=>x.id),a=names.indexOf(fromId),b=names.indexOf(toId);
 const preview={classification:'narrator_private_single_corridor_draft',
  planId:detail.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,bandIds:null,
  playerMoved:false,fictionalTimeAdvanced:false,
  playerKnowledgeChanged:false,portEntryAuthorized:false,
  verifiedSightline:false,canonicalNavigationAuthorized:false,
  actualWalkingMinutes:null};
 if(a===-1||b===-1)return copy(preview);
 const delta=a<=b?1:-1,indices=[];
 for(let i=a;;i+=delta){indices.push(i);if(i===b)break;}
 const links=indices.slice(1).map((_,i)=>detail.links[Math.min(indices[i],indices[i+1])]);
 return copy({...preview,status:'proposed_connected',nodeIds:indices.map(i=>names[i]),
  linkIds:links.map(x=>x.id),bandIds:links.map(x=>x.band_id)});
}
