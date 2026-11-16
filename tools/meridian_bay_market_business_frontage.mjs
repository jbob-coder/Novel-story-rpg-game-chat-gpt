// Private, read-only review of one prepared business-services arcade frontage.
import {readFileSync} from 'node:fs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
import {validateMarketCultureFrontage} from './meridian_bay_market_culture_frontage.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const plan=read('../docs/01_world/MERIDIAN_BAY_MARKET_BUSINESS_FRONTAGE_20261116.json');
const catalog=read('../docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json');
const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const delivery=read('../docs/01_world/MERIDIAN_BAY_MARKET_DELIVERY_FRONTAGE_20261116.json');
const culture=read('../docs/01_world/MERIDIAN_BAY_MARKET_CULTURE_FRONTAGE_20261116.json');
const direct=read('../docs/01_world/MERIDIAN_BAY_MARKET_HARBOR_DIRECT_DETAIL_20261116.json');
const sketches=[1,2,3].map(n=>read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE'+n+'_20261116.json'));
const need=(ok,m)=>{if(!ok)throw Error(m)};
const validPoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>validPoint(a)&&validPoint(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const o=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>o(a,b,c)*o(a,b,d)<-1e-8&&o(c,d,a)*o(c,d,b)<-1e-8;
const clone=x=>structuredClone(x);

export function validateMarketBusinessFrontage({state}={}){
 validateMarketCultureFrontage({state});
 need(plan.schema_version===1&&
  plan.plan_id==='MB-MARKET-BUSINESS-FRONTAGE-20261116-V1'&&
  plan.status==='draft_unadmitted'&&
  plan.endpoints.from==='LOC-COMMERCIAL-DISTRICT'&&
  plan.endpoints.to==='LOC-MARKET-BUSINESS-OFFICES'&&
  plan.endpoints.prepared_parent_link===true&&
  plan.endpoints.live_canonical_admission===false,
  'Unexpected business-frontage source or status');
 const a=plan.endpoints.from,b=plan.endpoints.to;
 const item=catalog.places.find(p=>p.id===b);
 need(item?.parent_id===a&&item.connected_ids.length===1&&
  item.connected_ids[0]===a&&item.related_actor_id===null&&
  item.access_status==='public_confirmed'&&item.opening_hours===null&&
  item.travel_minutes===null,'Business arcade is not the prepared public site');
 const world=prepareMeridianBayWorld({state}).world.locations;
 need(world[a]?.connected_ids.includes(b)&&
  world[b]?.connected_ids.includes(a)&&
  !Object.hasOwn(state.world.locations,b),
  'Business office access must remain an unadmitted catalog-only link');
 const pos=new Map(city.locations.map(p=>[p.id,p.reference_xy_units]));
 const nodes=plan.nodes,links=plan.links,bands=plan.bands;
 need(nodes.length===4&&links.length===3&&bands.length===3&&
  same(nodes[0].xy,pos.get(a))&&same(nodes.at(-1).xy,pos.get(b))&&
  nodes[0].location_id===a&&nodes.at(-1).location_id===b,
  'Business approach must connect the actual catalog endpoints');
 const box=city.planning_regions.find(p=>p.id==='MB-REG-CORE')?.box;
 need(box,'Draft core map envelope missing');
 const ids=new Set();
 for(let i=0;i<4;i++){
  const n=nodes[i];
  need(typeof n.id==='string'&&!ids.has(n.id)&&validPoint(n.xy)&&
   n.xy.x>=box.x_min&&n.xy.x<=box.x_max&&n.xy.y>=box.y_min&&n.xy.y<=box.y_max&&
   n.context.length>25&&n.junction.length>25,
   'Missing or bad business-frontage reference geometry');
  ids.add(n.id);
  if(i>0&&i<3)need(n.kind==='waypoint_only'&&n.location_id===null&&
   !Object.hasOwn(world,n.id),
   'Intermediate geometry must not be admitted as saved location');
 }
 const lid=new Set(),bid=new Set();
 let length=0;
 for(let i=0;i<links.length;i++){
  const l=links[i],v=bands[i];
  need(!lid.has(l.id)&&l.from===nodes[i].id&&l.to===nodes[i+1].id&&
   l.band===v.id&&l.character.length>20&&l.pedestrian_detail.length>35&&
   l.travel_minutes===null&&l.crossing_verified===false,
   'Invalid or invented business-approach segment');
  need(!bid.has(v.id)&&v.link===l.id&&v.side_a.length>30&&
   v.side_b.length>30&&v.activity.length>25&&
   v.physical_buildings_confirmed===false,
   'Missing or falsely verified business frontage');
  lid.add(l.id);bid.add(v.id);
  const step=dist(nodes[i].xy,nodes[i+1].xy);
  need(step>0,'Zero-length business frontage');length+=step;
 }
 need(length/dist(nodes[0].xy,nodes.at(-1).xy)<=1.8,
  'Unreasonable office-approach sketch detour');
 const prior=[
  ...sketches.flatMap(x=>x.segments).map(s=>
   [pos.get(s.from_id),...s.via_xy_units,pos.get(s.to_id)]),
  direct.nodes.map(x=>x.xy),delivery.provisional_geometry.nodes.map(x=>x.xy),
  culture.nodes.map(x=>x.xy)
 ];
 for(const path of prior)for(let i=1;i<nodes.length;i++)
  for(let j=1;j<path.length;j++)
   need(!crosses(nodes[i-1].xy,nodes[i].xy,path[j-1],path[j]),
    'Unregistered geometric crossing with earlier streets or frontages');
 need(Object.values(plan.narrative_guards).every(x=>x===true)&&
  Object.values(plan.map_guards).every(x=>x===true),
  'Business frontage may not set opening hours, arrivals or story state');
 return true;
}

export function previewMarketBusinessFrontage({state,fromId,toId}={}){
 validateMarketBusinessFrontage({state});
 const names=plan.nodes.map(x=>x.id),a=names.indexOf(fromId),b=names.indexOf(toId);
 const out={classification:'narrator_private_prepared_frontage',
  status:'outside_this_draft',planId:plan.plan_id,
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,bandIds:null,
  siteAdmitted:false,staffConfirmed:false,companiesConfirmed:false,siteOpenNow:false,
  walkingMinutes:null,playerMoved:false,npcsMoved:false,storyTimeAdvanced:false,
  playerKnowledgeChanged:false,canonicalNavigationAuthorized:false};
 if(a<0||b<0)return clone(out);
 const step=a<=b?1:-1,seq=[];
 for(let i=a;;i+=step){seq.push(i);if(i===b)break;}
 const chosen=seq.slice(1).map((_,i)=>plan.links[Math.min(seq[i],seq[i+1])]);
 return clone({...out,status:'proposed_connected',
  nodeIds:seq.map(i=>names[i]),linkIds:chosen.map(x=>x.id),
  bandIds:chosen.map(x=>x.band)});
}
