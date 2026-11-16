// Read-only, noncanonical geometry review for the first Meridian Bay road web.
// This does not change the playable location graph, state, knowledge or time.
import {readFileSync} from 'node:fs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const roadPlan=JSON.parse(readFileSync(new URL(
 '../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json',import.meta.url),'utf8'));
const cityPlan=JSON.parse(readFileSync(new URL(
 '../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json',import.meta.url),'utf8'));
const check=(value,message)=>{if(!value)throw Error(message);};
const clone=value=>structuredClone(value);
const pointKey=p=>p.x+','+p.y;
const finitePoint=p=>p!==null&&typeof p==='object'&&
 Number.isFinite(p.x)&&Number.isFinite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const refPositions=new Map(cityPlan.locations.map(p=>[p.id,p.reference_xy_units]));
const locationPair=(a,b)=>[a,b].sort().join('|');

export function validateMeridianBayRoadWeb({state}={}){
 check(state?.world?.locations&&state.player?.location_id,
  'Verified narrative state is required');
 // A detached graph copy includes the six preauthored places without admitting
 // them into saved history. It preserves the original city graph.
 const draft=prepareMeridianBayWorld({state});
 const locations=draft.world.locations;
 const rules=roadPlan.hard_limits;
 check(roadPlan.schema_version===1&&
  roadPlan.plan_id==='MB-ROAD-WEB-SLICE1-20261116'&&
  roadPlan.authority==='proposed_street_geometry_not_saved_canon'&&
  roadPlan.status==='draft_review_only'&&
  roadPlan.prerequisites.base_city_plan===cityPlan.plan_id,
  'Unsupported road-web draft');
 check(Object.values(rules).every(x=>x===true)&&
  roadPlan.interpretation.reference_km_per_unit===
   cityPlan.planning_envelope.reference_km_per_unit,
  'Draft map must not become canonical navigation');
 check(Array.isArray(roadPlan.segments)&&roadPlan.segments.length===6,
  'Unexpected first-slice road count');

 const ids=new Set(),pairs=new Set(),edges=new Map(),knownNodes=new Set();
 const city=cityPlan.planning_regions.find(x=>x.id==='MB-REG-CORE');
 check(city?.box,'Missing core focus area');
 for(const seg of roadPlan.segments){
  check(typeof seg.id==='string'&&!ids.has(seg.id),'Duplicate road segment');
  ids.add(seg.id);
  check(seg.from_id!==seg.to_id&&
   Object.hasOwn(locations,seg.from_id)&&Object.hasOwn(locations,seg.to_id)&&
   refPositions.has(seg.from_id)&&refPositions.has(seg.to_id),
   'Road endpoint is unknown or unmapped');
  const pair=locationPair(seg.from_id,seg.to_id);
  check(!pairs.has(pair),'Duplicate physical connection');
  pairs.add(pair);
  check(locations[seg.from_id].connected_ids.includes(seg.to_id)&&
   locations[seg.to_id].connected_ids.includes(seg.from_id)&&
   seg.known_graph_connection===true&&seg.assumed_bidirectional===true,
   'Unverified road or invented shortcut');
  check(Array.isArray(seg.via_xy_units)&&seg.via_xy_units.length<=8&&
   seg.via_xy_units.every(finitePoint)&&
   seg.established_street_name===null&&seg.travel_minutes===null,
   'Street names, times, and geometry must remain tentative');
  const points=[refPositions.get(seg.from_id),...seg.via_xy_units,refPositions.get(seg.to_id)];
  for(const p of points){
   check(finitePoint(p)&&p.x>=city.box.x_min&&p.x<=city.box.x_max&&
    p.y>=city.box.y_min&&p.y<=city.box.y_max&&
    p.x>=0&&p.x<=cityPlan.planning_envelope.width_units&&
    p.y>=0&&p.y<=cityPlan.planning_envelope.height_units,
    'Proposed corridor exits the defined urban-core study region');
  }
  let travel=0;
  for(let i=1;i<points.length;i++){
   const step=dist(points[i-1],points[i]);
   check(step>0,'Coincident consecutive sketch points');
   travel+=step;
  }
  const straight=dist(points[0],points.at(-1));
  check(straight>0&&travel/straight<=1.8,
   'Draft route has an unreasonable detour against its sketch anchors');
  // Distances only assess the internal sketch; never interpret as travel
  // distance or time in the fictional world.
  for(const [u,v] of [[seg.from_id,seg.to_id],[seg.to_id,seg.from_id]]){
   if(!edges.has(u))edges.set(u,new Set());
   edges.get(u).add(v);
  }
  knownNodes.add(seg.from_id);knownNodes.add(seg.to_id);
 }
 check(roadPlan.origin==='LOC-RAILGARDEN-RESIDENTIAL'&&
  knownNodes.has(roadPlan.origin),'Unexpected growth origin');
 const seen=new Set([roadPlan.origin]),pending=[roadPlan.origin];
 for(const node of pending)for(const next of edges.get(node)??[])
  if(!seen.has(next)){seen.add(next);pending.push(next);}
 check(seen.size===knownNodes.size,'First road slice is disconnected');
 const stagedIds=roadPlan.stages.flatMap(x=>x.segment_ids);
 check(stagedIds.length===ids.size&&
  new Set(stagedIds).size===ids.size&&stagedIds.every(x=>ids.has(x)),
  'Growth stages do not account for every road');
 check(roadPlan.future_growth_queue.every(x=>
  x.candidate_neighbor===null||!knownNodes.has(x.candidate_neighbor)),
  'Future growth is already counted as mapped in this slice');
 return true;
}

export function previewMeridianBayRoadWeb({state,fromId,toId}={}){
 validateMeridianBayRoadWeb({state});
 const graph=new Map();
 for(const s of roadPlan.segments){
  for(const [u,v] of [[s.from_id,s.to_id],[s.to_id,s.from_id]]){
   if(!graph.has(u))graph.set(u,new Set());
   graph.get(u).add(v);
  }
 }
 const result={classification:'narrator_private_street_geometry_draft',
  status:'outside_draft_slice',planId:roadPlan.plan_id,
  fromId:fromId??null,toId:toId??null,routeIds:null,
  usableForCanonicalTravel:false,referenceDistanceKm:null,
  walkingMinutes:null,openingHours:null,playerMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false,
  admissionAuthorized:false};
 if(!graph.has(fromId)||!graph.has(toId))return clone(result);
 const queue=[[fromId]],visited=new Set([fromId]);
 for(const route of queue){
  const cur=route.at(-1);
  if(cur===toId)return clone({...result,status:'proposed_connected',
   routeIds:route});
  for(const neighbor of graph.get(cur)||[]){
   if(!visited.has(neighbor)){
    visited.add(neighbor);queue.push([...route,neighbor]);
   }
  }
 }
 return clone(result);
}

export function inspectMeridianBayRoadWeb({state}={}){
 validateMeridianBayRoadWeb({state});
 return clone({
  classification:'narrator_private_street_geometry_draft',
  planId:roadPlan.plan_id,status:roadPlan.status,
  origin:roadPlan.origin,
  stages:roadPlan.stages,
  segments:roadPlan.segments,
  futureGrowthQueue:roadPlan.future_growth_queue,
  noSavedWorldMutation:true,noApprovedRoadDistance:true,
  noPlayerKnowledgeOrTimeChange:true
 });
}
