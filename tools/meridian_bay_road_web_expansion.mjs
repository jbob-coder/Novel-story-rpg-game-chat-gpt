// Noncanonical extension of the reviewed Meridian Bay first road sketch.
// Never writes saved story data, assigns travel times, or proves sightlines.
import {readFileSync} from 'node:fs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
import {validateMeridianBayRoadWeb} from './meridian_bay_road_web.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const slice1=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');
const slice2=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json');
const cityPlan=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const refs=new Map(cityPlan.locations.map(p=>[p.id,p.reference_xy_units]));
const clone=x=>structuredClone(x);
const check=(ok,message)=>{if(!ok)throw Error(message);};
const finitePoint=p=>p!==null&&typeof p==='object'&&
 Number.isFinite(p.x)&&Number.isFinite(p.y);
const pair=(a,b)=>[a,b].sort().join('|');
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const properCross=(a,b,c,d)=>
 orient(a,b,c)*orient(a,b,d)<-1e-8&&
 orient(c,d,a)*orient(c,d,b)<-1e-8;

export function validateMeridianBayRoadExpansion({state}={}){
 validateMeridianBayRoadWeb({state});
 check(slice2.schema_version===1&&
  slice2.plan_id==='MB-ROAD-WEB-SLICE2-20261116'&&
  slice2.depends_on===slice1.plan_id&&
  slice2.source_crosswalk==='MB-STORY-MAP-ALIGNMENT-CH000-20261116'&&
  slice2.authority==='proposed_street_geometry_not_saved_canon'&&
  slice2.status==='draft_review_only',
  'Unsupported or unreviewed road web expansion');
 check(Object.values(slice2.invariants).every(x=>x===true)&&
  slice2.story_constraints.visibility_result==='not_verified'&&
  slice2.story_constraints.visibility_preservation_rule.includes('Do not introduce new buildings'),
  'Expansion must preserve story sightline constraints without claiming proof');
 const graph=prepareMeridianBayWorld({state}).world.locations;
 const root=cityPlan.planning_regions.find(x=>x.id==='MB-REG-CORE');
 check(root?.box,'Missing urban-core planning envelope');
 const allSegments=[...slice1.segments,...slice2.segments];
 check(slice2.segments.length===2&&allSegments.length===8&&
  slice2.mapped_world_nodes_after_this_slice===9&&
  slice2.mapped_corridor_edges_after_this_slice===8,
  'Unexpected phased road web size');
 const expectedLinks=[
  ['LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA'],
  ['LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL']
 ];
 check(slice2.segments.every((s,i)=>s.from_id===expectedLinks[i][0]&&
  s.to_id===expectedLinks[i][1]),
  'Next corridor must extend Market Row to the established transit plaza/terminal');
 const ids=new Set(),pairs=new Set(),nodes=new Set(),neighbors=new Map();
 for(const s of allSegments){
  check(typeof s.id==='string'&&!ids.has(s.id),
   'Duplicate segment ID');
  ids.add(s.id);
  check(Object.hasOwn(graph,s.from_id)&&Object.hasOwn(graph,s.to_id)&&
   refs.has(s.from_id)&&refs.has(s.to_id)&&s.from_id!==s.to_id,
   'Road contains an undefined location or city reference point');
  const p=pair(s.from_id,s.to_id);
  check(!pairs.has(p),'Repeated physical road segment');
  pairs.add(p);
  check(s.known_graph_connection===true&&
   graph[s.from_id].connected_ids.includes(s.to_id)&&
   graph[s.to_id].connected_ids.includes(s.from_id),
   'Proposed segment is absent from source story graph');
  check(Array.isArray(s.via_xy_units)&&s.via_xy_units.length<=8&&
   s.via_xy_units.every(finitePoint)&&
   (s.travel_minutes??null)===null,
   'Proposed road cannot contain fake times or invalid geometry');
  const vertices=[refs.get(s.from_id),...s.via_xy_units,refs.get(s.to_id)];
  for(const p of vertices)check(finitePoint(p)&&
   p.x>=root.box.x_min&&p.x<=root.box.x_max&&
   p.y>=root.box.y_min&&p.y<=root.box.y_max,
   'Road sketch extends outside the verified planning core');
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  let distanceUnits=0;
  for(let i=1;i<vertices.length;i++){
   const length=distance(vertices[i-1],vertices[i]);
   check(length>0,'Road contains a zero-length sketch edge');
   distanceUnits+=length;
  }
  check(distanceUnits/distance(vertices[0],vertices.at(-1))<=1.8,
   'Proposed segment requires an unreasonable sketch detour');
  for(const [u,v] of [[s.from_id,s.to_id],[s.to_id,s.from_id]]){
   if(!neighbors.has(u))neighbors.set(u,new Set());
   neighbors.get(u).add(v);
  }
  nodes.add(s.from_id);nodes.add(s.to_id);
 }
 // A line crossing outside a mapped node would require a junction whose
 // identity and traffic/access conditions have not yet been reviewed.
 for(let i=0;i<allSegments.length;i++)
  for(let j=i+1;j<allSegments.length;j++){
   const s=allSegments[i],t=allSegments[j],
    S=[refs.get(s.from_id),...s.via_xy_units,refs.get(s.to_id)],
    T=[refs.get(t.from_id),...t.via_xy_units,refs.get(t.to_id)];
   for(let p=1;p<S.length;p++)for(let q=1;q<T.length;q++)
    check(!properCross(S[p-1],S[p],T[q-1],T[q]),
     'New corridor creates an unregistered road crossing');
  }
 const seen=new Set([slice1.origin]),queue=[slice1.origin];
 for(const node of queue)for(const next of neighbors.get(node)||[])
  if(!seen.has(next)){seen.add(next);queue.push(next);}
 check(seen.size===nodes.size&&nodes.size===9,
  'Road expansion must connect both transit anchors to the existing web');
 check(slice2.routing.all_distances_unknown===true&&
  slice2.routing.actual_travel_not_performed===true&&
  slice2.routing.canonical_route_graph_unchanged===true,
  'Sketch cannot produce real travel or modify known paths');
 return true;
}

export function previewMeridianBayExpandedWeb({state,fromId,toId}={}){
 validateMeridianBayRoadExpansion({state});
 const neighbors=new Map();
 for(const s of [...slice1.segments,...slice2.segments]){
  for(const [u,v] of [[s.from_id,s.to_id],[s.to_id,s.from_id]]){
   if(!neighbors.has(u))neighbors.set(u,[]);
   neighbors.get(u).push(v);
  }
 }
 const result={
  classification:'narrator_private_street_geometry_draft',
  status:'outside_draft_slice',planId:slice2.plan_id,
  fromId:fromId??null,toId:toId??null,routeIds:null,
  usableForCanonicalTravel:false,streetGeometryConfirmed:false,
  cafeToTerminalSightlineVerified:false,travelMinutes:null,
  playerMoved:false,fictionalTimeAdvanced:false,
  playerKnowledgeChanged:false,admissionAuthorized:false
 };
 if(!neighbors.has(fromId)||!neighbors.has(toId))return clone(result);
 const visited=new Set([fromId]),queue=[[fromId]];
 for(const route of queue){
  const current=route.at(-1);
  if(current===toId)return clone({...result,status:'proposed_connected',routeIds:route});
  for(const next of neighbors.get(current)||[])if(!visited.has(next)){
   visited.add(next);queue.push([...route,next]);
  }
 }
 return clone(result);
}
