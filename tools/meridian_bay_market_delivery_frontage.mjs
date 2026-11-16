// Read-only frontage planner. No modifications to canon, NPC activity, or fictional time.
import {readFileSync} from 'node:fs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
import {validateMarketHarborDirectCorridor} from './meridian_bay_market_harbor_direct.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const plan=read('../docs/01_world/MERIDIAN_BAY_MARKET_DELIVERY_FRONTAGE_20261116.json');
const catalog=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const road1=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');
const road2=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json');
const road3=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE3_20261116.json');
const direct=read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_DIRECT_DETAIL_20261116.json');
const need=(ok,m)=>{if(!ok)throw Error(m);};
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>point(a)&&point(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&orient(c,d,a)*orient(c,d,b)<-1e-8;
const clone=x=>structuredClone(x);

export function validateMarketDeliveryFrontage({state}={}){
 validateMarketHarborDirectCorridor({state});
 const e=plan.endpoints,geometry=plan.provisional_geometry;
 need(plan.schema_version===1&&plan.plan_id==='MB-MARKET-DELIVERY-FRONTAGE-20261116-V1'&&
  plan.status==='draft_not_playable_canon'&&
  plan.route_kind==='one_prepared_establishment_frontage'&&
  e.from==='LOC-COMMERCIAL-DISTRICT'&&e.to==='LOC-MARKET-DELIVERY-POINT'&&
  e.parent_id===e.from&&e.existing_design_link===true&&
  e.canonical_admission_required_for_live_travel===true,
  'Delivery frontage is not an isolated, unadmitted prepared-site link');
 const item=catalog.places.find(p=>p.id===e.to);
 need(item&&item.parent_id===e.from&&
  item.connected_ids.length===1&&item.connected_ids[0]===e.from&&
  item.opening_hours===null&&item.travel_minutes===null&&
  item.access_status==='public_confirmed'&&
  item.related_actor_id===null,
  'Proposed delivery site is not the unchanged preauthored public site');
 const prepared=prepareMeridianBayWorld({state}).world.locations;
 need(prepared[e.from]?.connected_ids.includes(e.to)&&
  prepared[e.to]?.connected_ids.includes(e.from)&&
  !Object.hasOwn(state.world.locations,e.to),
  'Public site may be connected for draft review but not silently admitted');
 const pos=new Map(city.locations.map(l=>[l.id,l.reference_xy_units]));
 const nodes=geometry.nodes,links=geometry.links,bands=geometry.frontage_bands;
 need(nodes.length===4&&links.length===3&&bands.length===3,
  'This frontage requires three contiguous in-between segments');
 need(same(nodes[0].xy,pos.get(e.from))&&
  same(nodes.at(-1).xy,pos.get(e.to))&&
  nodes[0].location_id===e.from&&nodes.at(-1).location_id===e.to,
  'Delivery frontage endpoints drifted from prepared map anchors');
 const ids=new Set(),linkIds=new Set(),bandIds=new Set();
 const core=city.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 need(core,'Missing city-core drafting envelope');
 for(let i=0;i<nodes.length;i++){
  const n=nodes[i];
  need(!ids.has(n.id)&&point(n.xy)&&
   n.xy.x>=core.x_min&&n.xy.x<=core.x_max&&
   n.xy.y>=core.y_min&&n.xy.y<=core.y_max&&
   n.context.length>25&&n.junction.length>25,
   'Malformed or out-of-envelope delivery point');
  ids.add(n.id);
  if(i>0&&i<nodes.length-1)need(n.kind==='draft_waypoint'&&
    n.location_id===null&&!Object.hasOwn(prepared,n.id),
    'Intermediate node is not a new location');
 }
 for(let i=0;i<links.length;i++){
  const l=links[i],b=bands[i];
  need(!linkIds.has(l.id)&&l.from===nodes[i].id&&
   l.to===nodes[i+1].id&&l.frontage_band_id===b.id&&
   l.role.length>15&&l.pedestrian_context.length>35&&
   l.known_crossing===false&&l.travel_minutes===null&&
   dist(nodes[i].xy,nodes[i+1].xy)>0,
   'Gap, false crossing or guessed time in frontage');
  need(!bandIds.has(b.id)&&b.link_id===l.id&&
   b.side_a.length>30&&b.side_b.length>30&&
   b.activity.length>20&&b.building_positions_verified===false,
   'Missing two-sided frontage detail or invented building parcel');
  linkIds.add(l.id);bandIds.add(b.id);
 }
 const length=links.reduce((sum,_,i)=>sum+dist(nodes[i].xy,nodes[i+1].xy),0);
 need(length/dist(nodes[0].xy,nodes.at(-1).xy)<=1.8,
  'Delivery approach takes an unreasonable detour on reference canvas');
 const prior=[...road1.segments,...road2.segments,...road3.segments].map(s=>
  [pos.get(s.from_id),...s.via_xy_units,pos.get(s.to_id)]);
 prior.push(direct.nodes.map(n=>n.xy));
 for(const path of prior)
  for(let i=1;i<nodes.length;i++)
   for(let j=1;j<path.length;j++)
    need(!crosses(nodes[i-1].xy,nodes[i].xy,path[j-1],path[j]),
     'Delivery approach would cross a previously sketched road without an intersection');
 need(Object.values(plan.narrative_constraints).every(x=>x===true)&&
  Object.values(plan.verification).every(x=>x===true||typeof x==='string'),
  'A draft cannot assign Darius, staffing, route time or canonical discovery');
 return true;
}

export function previewMarketDeliveryFrontage({state,fromId,toId}={}){
 validateMarketDeliveryFrontage({state});
 const ids=plan.provisional_geometry.nodes.map(x=>x.id);
 const a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={classification:'narrator_private_prepared_frontage',
  status:'outside_this_draft',planId:plan.plan_id,fromId:fromId??null,
  toId:toId??null,nodeIds:null,linkIds:null,frontageIds:null,
  ownerVisitRecorded:false,deliveriesConfirmed:false,staffConfirmed:false,
  publicSiteOpenNow:false,walkingMinutes:null,
  canonicalNavigationAuthorized:false,playerMoved:false,npcsMoved:false,
  fictionalTimeAdvanced:false,playerKnowledgeChanged:false};
 if(a<0||b<0)return clone(result);
 const step=a<=b?1:-1,indices=[];
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const links=indices.slice(1).map((_,i)=>plan.provisional_geometry.links[
  Math.min(indices[i],indices[i+1])]);
 return clone({...result,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds:links.map(x=>x.id),
  frontageIds:links.map(x=>x.frontage_band_id)});
}
