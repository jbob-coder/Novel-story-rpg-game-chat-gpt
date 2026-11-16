// Read-only, proposal-only validation for Market Row's cultural passage frontage.
// Does not create a location, authorize a visit, advance a turn, or assign Elena.
import {readFileSync} from 'node:fs';
import {validateMarketDeliveryFrontage} from './meridian_bay_market_delivery_frontage.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const plan=read('../docs/01_world/MERIDIAN_BAY_MARKET_CULTURE_FRONTAGE_20261116.json');
const delivery=read('../docs/01_world/MERIDIAN_BAY_MARKET_DELIVERY_FRONTAGE_20261116.json');
const catalog=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const roadPlans=[1,2,3].map(n=>read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE'+n+'_20261116.json'));
const direct=read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_DIRECT_DETAIL_20261116.json');
const check=(value,why)=>{if(!value)throw Error(why);};
const point=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const equal=(a,b)=>point(a)&&point(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&orient(c,d,a)*orient(c,d,b)<-1e-8;
const clone=x=>structuredClone(x);

export function validateMarketCultureFrontage({state}={}){
 validateMarketDeliveryFrontage({state});
 check(plan.schema_version===1&&
  plan.plan_id==='MB-MARKET-CULTURE-FRONTAGE-20261116-V1'&&
  plan.status==='unadmitted_prepared_site_street_draft'&&
  plan.route_kind==='one_prepared_site_frontage'&&
  plan.endpoints.district_id==='LOC-COMMERCIAL-DISTRICT'&&
  plan.endpoints.prepared_site_id==='LOC-MARKET-CULTURE-PASSAGE'&&
  plan.endpoints.catalog_parent_id===plan.endpoints.district_id&&
  plan.endpoints.prepared_only_not_live_world===true,
  'Unexpected cultural passage map authority');
 const a=plan.endpoints.district_id,b=plan.endpoints.prepared_site_id;
 const site=catalog.places.find(p=>p.id===b);
 check(site?.parent_id===a&&site.connected_ids.length===1&&
  site.connected_ids[0]===a&&site.access_status==='public_confirmed'&&
  site.related_actor_id===null&&site.opening_hours===null&&site.travel_minutes===null,
  'Cultural passage draft is not the original prepared catalog site');
 const loc=prepareMeridianBayWorld({state}).world.locations;
 check(loc[a]?.connected_ids.includes(b)&&loc[b]?.connected_ids.includes(a)&&
  !Object.hasOwn(state.world.locations,b),
  'Cultural passage can be previewed only as an unadmitted prepared site');
 const refs=new Map(city.locations.map(p=>[p.id,p.reference_xy_units]));
 const n=plan.nodes,links=plan.links,bands=plan.frontage_bands;
 check(n.length===4&&links.length===3&&bands.length===3&&
  equal(n[0].xy,refs.get(a))&&equal(n[3].xy,refs.get(b))&&
  n[0].location_id===a&&n[3].location_id===b,
  'Cultural passage requires 3 contiguous in-between links and source endpoints');
 const box=city.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 check(box,'Missing conceptual Meridian Bay planning envelope');
 const nodeIds=new Set(),linkIds=new Set(),bandIds=new Set();
 for(let i=0;i<4;i++){
  const p=n[i];
  check(typeof p.id==='string'&&!nodeIds.has(p.id)&&
   point(p.xy)&&p.xy.x>=box.x_min&&p.xy.x<=box.x_max&&
   p.xy.y>=box.y_min&&p.xy.y<=box.y_max&&p.context.length>25&&
   p.junction_detail.length>30,
   'Missing cultural frontage intermediate position or setting');
  nodeIds.add(p.id);
  if(i>0&&i<3)check(p.kind==='draft_geometric_waypoint'&&
    p.location_id===null&&!Object.hasOwn(loc,p.id),
    'Cultural frontage waypoint is not a real game location');
 }
 let length=0;
 for(let i=0;i<3;i++){
  const link=links[i],band=bands[i];
  check(typeof link.id==='string'&&!linkIds.has(link.id)&&
   link.from===n[i].id&&link.to===n[i+1].id&&link.band_id===band.id&&
   link.street_role.length>15&&link.pedestrian_detail.length>35&&
   link.existing_street_crossing_confirmed===false&&link.travel_minutes===null,
   'Gap in cultural passage route or unsupported physical access claim');
  check(typeof band.id==='string'&&!bandIds.has(band.id)&&
   band.link_id===link.id&&band.side_a.length>25&&band.side_b.length>25&&
   band.activity_scope.length>25&&band.actual_buildings_confirmed===false,
   'Cultural frontage is missing its two-sided candidate context');
  linkIds.add(link.id);bandIds.add(band.id);
  const step=dist(n[i].xy,n[i+1].xy);
  check(step>0,'Zero-length cultural frontage link');
  length+=step;
 }
 check(length/dist(n[0].xy,n[3].xy)<=1.8,
  'Cultural passage draft uses unreasonable in-between detours');
 const prior=[
  ...roadPlans.flatMap(x=>x.segments).map(s=>
   [refs.get(s.from_id),...s.via_xy_units,refs.get(s.to_id)]),
  direct.nodes.map(x=>x.xy),delivery.provisional_geometry.nodes.map(x=>x.xy)
 ];
 for(const path of prior)for(let i=1;i<n.length;i++)for(let j=1;j<path.length;j++)
  check(!crosses(n[i-1].xy,n[i].xy,path[j-1],path[j]),
   'Cultural passage would cross an existing sketch without an intersection');
 check(Object.values(plan.story_safety).every(x=>x===true)&&
  Object.values(plan.checks).every(x=>x===true)&&
  Object.entries(plan.reference_only).every(([key,value])=>
   key==='city_canvas'?typeof value==='string'&&value.length>15:value===true),
  'Unplanned visit, characters, access or story-time changes cannot follow draft');
 return true;
}
export function previewMarketCultureFrontage({state,fromId,toId}={}){
 validateMarketCultureFrontage({state});
 const nodes=plan.nodes.map(x=>x.id),a=nodes.indexOf(fromId),b=nodes.indexOf(toId);
 const result={
  classification:'narrator_private_prepared_frontage',
  status:'outside_this_draft',planId:plan.plan_id,
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,bandIds:null,
  playableLocationAdmitted:false,elenaPresent:false,publicSiteOpenNow:false,
  activeExhibitionConfirmed:false,staffAssigned:false,
  realWalkingMinutes:null,canonicalNavigationAuthorized:false,
  playerMoved:false,npcsMoved:false,fictionalTimeAdvanced:false,
  playerKnowledgeChanged:false
 };
 if(a<0||b<0)return clone(result);
 const step=a<=b?1:-1,indices=[];
 for(let i=a;;i+=step){indices.push(i);if(i===b)break}
 const links=indices.slice(1).map((_,i)=>plan.links[Math.min(indices[i],indices[i+1])]);
 return clone({...result,status:'proposed_connected',
  nodeIds:indices.map(i=>nodes[i]),linkIds:links.map(x=>x.id),
  bandIds:links.map(x=>x.band_id)});
}
