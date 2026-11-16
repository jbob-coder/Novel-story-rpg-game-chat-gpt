// Read-only, short plaza-to-terminal pedestrian interface detail.
import {readFileSync} from 'node:fs';
import {validateMarketCrosswaterCorridor} from './meridian_bay_market_crosswater_corridor.mjs';
import {prepareMeridianBayWorld} from './meridian_bay_locations.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const plan=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL_20261116.json'));
const source=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE2_20261116.json'));
const map=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const story=read('../game/STARTING_LOCATIONS.md');
const check=(p,m)=>{if(!p)throw Error(m);};
const clone=x=>structuredClone(x);
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>valid(a)&&valid(b)&&Math.hypot(a.x-b.x,a.y-b.y)<1e-9;
export function validatePlazaTerminalDetail({state}={}){
 validateMarketCrosswaterCorridor({state});
 check(plan.schema_version===1&&
  plan.plan_id==='MB-PLAZA-TERMINAL-APPROACH-20261116-V1'&&
  plan.status==='detailed_draft_not_story_canon'&&
  plan.type==='single_short_pedestrian_approach'&&
  plan.parent_segment==='MB-WEB-008'&&
  plan.source_plan===source.plan_id,
  'Unknown transit-forecourt draft or source plan');
 const seg=source.segments.find(x=>x.id===plan.parent_segment);
 check(seg&&seg.from_id===plan.from_id&&seg.to_id===plan.to_id&&
  seg.from_id==='LOC-CROSSWATER-PLAZA'&&
  seg.to_id==='LOC-TRANSIT-TERMINAL'&&
  seg.known_graph_connection===true&&seg.via_xy_units.length===0,
  'Do not invent a second plaza-station route');
 const graph=prepareMeridianBayWorld({state}).world.locations;
 check(graph[seg.from_id].connected_ids.includes(seg.to_id)&&
  graph[seg.to_id].connected_ids.includes(seg.from_id),
  'Missing original plaza-to-terminal connection');
 const refs=new Map(map.locations.map(x=>[x.id,x.reference_xy_units]));
 const p=refs.get(seg.from_id),q=refs.get(seg.to_id);
 check(valid(p)&&valid(q)&&plan.nodes.length===3&&plan.links.length===2,
  'Invalid forecourt study geometry');
 check(same(plan.nodes[0].xy,p)&&same(plan.nodes[2].xy,q)&&
  plan.nodes[0].location_id===seg.from_id&&
  plan.nodes[2].location_id===seg.to_id,
  'Terminal and plaza anchors must not move');
 const m=plan.nodes[1],dx=q.x-p.x,dy=q.y-p.y;
 const cross=(m.xy.x-p.x)*dy-(m.xy.y-p.y)*dx;
 const t=((m.xy.x-p.x)*dx+(m.xy.y-p.y)*dy)/(dx*dx+dy*dy);
 check(valid(m.xy)&&Math.abs(cross)<1e-9&&t>0&&t<1&&
  m.kind==='noncanonical_approach_point'&&m.location_id===null&&
  !Object.hasOwn(graph,m.id),
  'Intermediate entrance approach must lie between original endpoints, without becoming a place');
 const ids=new Set(),sides=new Set();
 for(let i=0;i<2;i++){
  const link=plan.links[i];
  check(!ids.has(link.id)&&link.from===plan.nodes[i].id&&
   link.to===plan.nodes[i+1].id&&
   typeof link.character==='string'&&link.character.length>15&&
   typeof link.sideA==='string'&&link.sideA.length>15&&
   typeof link.sideB==='string'&&link.sideB.length>15&&
   link.walking_access==='possible_from_original_graph_not_surveyed'&&
   link.traffic_crossing_status==='unknown'&&link.minutes===null,
   'Forecourt link lacks continuity or claims verified physical access');
  ids.add(link.id);
  sides.add(link.sideA);sides.add(link.sideB);
 }
 check(sides.size===4,'Both frontage sides require distinct review');
 const x=plan.pedestrian_interface,limits=plan.world_constraints;
 check(x.conceptual_continuity===true&&
  x.verified_accessibility===false&&
  x.verified_crosswalk===false&&
  x.verified_vehicle_conflict_free===false&&
  x.verified_ticketed_boundary===false&&
  x.terminal_glass_entrance_story_confirmed===true&&
  x.sightline_to_cafe_confirmed===false&&
  x.exact_plaza_area_and_station_footprint_unknown===true&&
  Object.values(limits).every(v=>v===false),
  'Unknown accessibility, access control or canon must remain unconfirmed');
 check(Array.isArray(plan.narrative_evidence_required)&&
  plan.narrative_evidence_required.length===2&&
  plan.narrative_evidence_required.every(x=>story.includes(x)),
  'The described terminal approach lacks source evidence');
 return true;
}

export function previewPlazaTerminalDetail({state,fromId,toId}={}){
 validatePlazaTerminalDetail({state});
 const ids=plan.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={classification:'narrator_private_plaza_terminal_draft',
  status:'outside_this_section',fromId:fromId??null,toId:toId??null,
  nodeIds:null,linkIds:null,
  certifiedPedestrianRoute:false,accessibleCrossingConfirmed:false,
  walkingMinutes:null,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,canonicalAdmission:false};
 if(a<0||b<0)return clone(result);
 const indices=[],step=a<=b?1:-1;
 for(let i=a;;i+=step){indices.push(i);if(i===b)break;}
 const links=[];
 for(let i=0;i<indices.length-1;i++)
  links.push(plan.links[Math.min(indices[i],indices[i+1])].id);
 return clone({...result,status:'proposed_connected',
  nodeIds:indices.map(i=>ids[i]),linkIds:links});
}
