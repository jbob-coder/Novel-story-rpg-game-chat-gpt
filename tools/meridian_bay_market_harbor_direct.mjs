// Read-only review of the existing direct Market Row ↔ Harbor Walk adjacency.
// Never creates real roads, saved places, travel events, sightlines or port access.
import {readFileSync} from 'node:fs';
import {validateCrosswaterHarborCorridor} from './meridian_bay_cross_harbor_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const data=path=>JSON.parse(read(path));
const detail=data('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_DIRECT_DETAIL_20261116.json');
const scale=data('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const prior=[
 data('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'),
 data('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'),
 data('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE3_20261116.json')
];
const source=new Map([
 ['game/STARTING_LOCATIONS.md',read('../game/STARTING_LOCATIONS.md')],
 ['chapters/CH-000.transcript.json',read('../chapters/CH-000.transcript.json')]
]);
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
const clone=x=>structuredClone(x);
const point=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const eq=(a,b)=>point(a)&&point(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8 &&
 orient(c,d,a)*orient(c,d,b)<-1e-8;
const pair=(a,b)=>[a,b].sort().join('|');

export function validateMarketHarborDirectCorridor({state}={}){
 // Ensures the three previously detailed sections still satisfy their
 // saved-chapter constraints and were not displaced by this new draft.
 validateCrosswaterHarborCorridor({state});
 need(detail.schema_version===1&&
  detail.plan_id==='MB-MARKET-HARBOR-DIRECT-DETAIL-20261116-V1'&&
  detail.status==='detailed_draft_not_story_canon'&&
  detail.connection.proposed_sketch_segment_id==='MB-WEB-010'&&
  detail.connection.direct_reference_not_through_crosswater===true,
  'Direct Market-Harbor design must remain the current unadmitted section');
 const refs=new Map(scale.locations.map(x=>[x.id,x.reference_xy_units]));
 const graph=prepareMeridianBayWorld({state}).world.locations;
 const a=detail.connection.from_location_id,b=detail.connection.to_location_id;
 need(a==='LOC-COMMERCIAL-DISTRICT'&&b==='LOC-HARBOR-WALK'&&
  graph[a]?.connected_ids.includes(b)&&graph[b]?.connected_ids.includes(a)&&
  detail.connection.saved_graph_edge_exists===true,
  'Direct Market Row–Harbor Walk must use the existing saved graph link');
 need(graph['LOC-CROSSWATER-PLAZA'].connected_ids.includes(b)&&
  graph[a].connected_ids.includes('LOC-CROSSWATER-PLAZA'),
  'Keep the alternative path through Crosswater Plaza intact');
 const nodes=detail.nodes,links=detail.route_links,bands=detail.frontage_bands;
 need(nodes.length===5&&links.length===4&&bands.length===4,
  'Each completed corridor requires four in-between segments and frontages');
 const expected=[refs.get(a),{x:60,y:40.7},{x:64,y:38.1},{x:68,y:36.9},refs.get(b)];
 const uniqueNodes=new Set(),uniqueLinks=new Set(),uniqueBands=new Set();
 const core=scale.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 need(core,'Urban core review envelope is missing');
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];
  need(typeof n.id==='string'&&!uniqueNodes.has(n.id)&&
   eq(n.xy,expected[i])&&
   n.xy.x>=core.x_min&&n.xy.x<=core.x_max&&
   n.xy.y>=core.y_min&&n.xy.y<=core.y_max&&
   typeof n.street_transition==='string'&&n.street_transition.length>25&&
   typeof n.junction==='string'&&n.junction.length>25,
   'Missing or misplaced in-between planning node');
  uniqueNodes.add(n.id);
  if(i===0||i===nodes.length-1)
   need(n.type==='existing_district_reference'&&
    n.location_id===(i===0?a:b),'Wrong existing route endpoint');
  else
   need(n.type==='draft_route_waypoint'&&n.location_id===null&&
    !Object.hasOwn(graph,n.id),'A waypoint cannot turn into a canonical place');
 }
 let length=0;
 for(let i=0;i<links.length;i++){
  const l=links[i],f=bands[i];
  need(!uniqueLinks.has(l.id)&&
   l.from===nodes[i].id&&l.to===nodes[i+1].id&&
   l.frontage_id===f.id&&
   typeof l.character==='string'&&l.character.length>20&&
   typeof l.pedestrian_design==='string'&&l.pedestrian_design.length>25&&
   typeof l.unresolved==='string'&&l.unresolved.length>25&&
   l.passable_verified===false&&l.minutes===null,
   'Road detail is discontinuous or falsely certified');
  need(!uniqueBands.has(f.id)&&f.for_link===l.id&&
   f.side_a.length>25&&f.side_b.length>25&&
   f.scene_texture.length>25&&
   f.surveyed_building_footprints===false&&f.harbor_entry_granted===false,
   'Frontage missing or confers unauthorized port/building access');
  uniqueLinks.add(l.id);uniqueBands.add(f.id);
  const sectionLength=distance(nodes[i].xy,nodes[i+1].xy);
  need(sectionLength>0,'Zero-length intermediate corridor section');
  length+=sectionLength;
 }
 need(length/distance(expected[0],expected.at(-1))<=1.8,
  'Candidate corridor contains an excessive geometric detour');
 const oldSegments=prior.flatMap(x=>x.segments);
 const oldIds=new Set(oldSegments.map(x=>x.id));
 need(oldSegments.length===9&&oldIds.size===9&&
  !oldIds.has(detail.connection.proposed_sketch_segment_id),
  'Prior corridors must be preserved, not overwritten');
 const oldPairs=new Set(oldSegments.map(x=>pair(x.from_id,x.to_id)));
 need(!oldPairs.has(pair(a,b)),
  'New direct Market-Harbor geometry duplicates an already drawn road');
 for(const old of oldSegments){
  const segment=[refs.get(old.from_id),...old.via_xy_units,refs.get(old.to_id)];
  need(segment.every(point),'Missing prior street geometry');
  for(let i=1;i<expected.length;i++)
   for(let j=1;j<segment.length;j++)
    need(!crosses(expected[i-1],expected[i],segment[j-1],segment[j]),
     'Unregistered physical intersection with prior drafted road');
 }
 const safe=detail.review;
 need(Object.entries(safe).every(([k,v])=>k==='next_stage'?typeof v==='string'&&v.length>30:v===true),
  'The single-corridor safety policy was relaxed');
 need(detail.story_checks.length===6&&
  detail.story_checks.every(x=>source.get(x.source)?.includes(x.fragment)&&
   x.meaning.length>40),
  'A saved-story map or sightline constraint has no supporting source');
 need(detail.source.required_predecessor_details.length===3,
  'Previous detailed sections were not included as prerequisites');
 return true;
}

export function previewMarketHarborDirectCorridor({state,fromId,toId}={}){
 validateMarketHarborDirectCorridor({state});
 const names=detail.nodes.map(x=>x.id),a=names.indexOf(fromId),b=names.indexOf(toId);
 const out={
  classification:'narrator_private_single_corridor_draft',
  status:'outside_this_corridor',planId:detail.plan_id,
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,frontageIds:null,
  canonicalNavigationAuthorized:false,
  actualWalkingMinutes:null,roadNamesVerified:false,
  publicCrossingsVerified:false,portEntryAuthorized:false,
  buildingFootprintsSurveyed:false,
  playerMoved:false,npcsMoved:false,fictionalTimeAdvanced:false,
  newPlayerKnowledge:false
 };
 if(a<0||b<0)return clone(out);
 const step=a<=b?1:-1,idx=[];
 for(let i=a;;i+=step){idx.push(i);if(i===b)break}
 const route=idx.slice(1).map((_,i)=>detail.route_links[Math.min(idx[i],idx[i+1])]);
 return clone({...out,status:'proposed_connected',
  nodeIds:idx.map(i=>names[i]),linkIds:route.map(x=>x.id),
  frontageIds:route.map(x=>x.frontage_id)});
}
