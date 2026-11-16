// Railgarden ↔ grocery is a *prebuilt design* link, not a visited or open shop.
// The review only validates one short drawn frontage on a detached world copy.
import {readFileSync} from 'node:fs';
import {validateWilsonRailgardenDetail} from './meridian_bay_wilson_railgarden_detail.mjs';
import {prepareMeridianBayWorld,meridianBayDesign} from './meridian_bay_locations.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const plan=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL_20261116.json'));
const one=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json'));
const city=JSON.parse(read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const fail=(ok,message)=>{if(!ok)throw Error(message);};
const deep=x=>structuredClone(x);
const valid=p=>p!==null&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>valid(a)&&valid(b)&&Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9;
export function validateRailgardenGroceryDetail({state}={}){
 validateWilsonRailgardenDetail({state});
 fail(plan.schema_version===1&&
  plan.plan_id==='MB-RAILGARDEN-GROCERY-APPROACH-20261116-V1'&&
  plan.type==='single_shop_frontage_approach'&&
  plan.status==='detailed_draft_not_story_canon'&&
  plan.sources.previous_detail==='docs/01_world/MERIDIAN_BAY_WILSON_RAILGARDEN_DETAIL_20261116.json'&&
  plan.endpoints.parent_segment==='MB-WEB-003',
  'Unknown or promoted grocery frontage draft');
 const segment=one.segments.find(s=>s.id===plan.endpoints.parent_segment);
 const from=plan.endpoints.from_id,to=plan.endpoints.to_id;
 fail(segment?.from_id===from&&segment?.to_id===to&&
  from==='LOC-RAILGARDEN-RESIDENTIAL'&&to==='LOC-RAILGARDEN-ABARROTES'&&
  segment.known_graph_connection===true&&segment.assumed_bidirectional===true&&
  segment.via_xy_units.length===1&&
  segment.established_street_name===null&&segment.travel_minutes===null,
  'The draft cannot invent a Railgarden grocery shortcut or street');
 const catalog=meridianBayDesign();
 const place=catalog.places.find(x=>x.id===to);
 fail(place&&catalog.world_design_id===plan.endpoints.design_id&&
  place.world_design_id===plan.endpoints.design_id&&
  place.parent_id===from&&place.public_area===true&&
  place.access_status==='public_confirmed'&&
  place.related_actor_id===null&&
  place.opening_hours===null&&place.travel_minutes===null&&
  place.connected_ids.length===1&&place.connected_ids[0]===from,
  'Grocery facts must match preauthored catalog without staff or hours');
 // The saved checkpoint has not admitted the six new sites.
 fail(!Object.hasOwn(state.world.locations,to),
  'This draft is for the not-yet-admitted source checkpoint');
 const prepared=prepareMeridianBayWorld({state});
 fail(prepared!==state&&
  prepared.world.locations[from].connected_ids.includes(to)&&
  prepared.world.locations[to].connected_ids.includes(from)&&
  !Object.hasOwn(state.world.locations,to)&&
  state.world.locations[from].connected_ids.includes('LOC-WILSON-APARTMENT'),
  'Detached prepared catalog or original household link is inconsistent');
 const positions=new Map(city.locations.map(x=>[x.id,x.reference_xy_units]));
 const pts=[positions.get(from),...segment.via_xy_units,positions.get(to)];
 const core=city.planning_regions.find(x=>x.id==='MB-REG-CORE')?.box;
 fail(pts.length===3&&pts.every(valid)&&core&&plan.nodes.length===3&&
  plan.links.length===2&&plan.bands.length===2,'Two-section grocery frontage is incomplete');
 for(let i=0;i<pts.length;i++){
  const p=pts[i],n=plan.nodes[i];
  fail(p.x>=core.x_min&&p.x<=core.x_max&&
   p.y>=core.y_min&&p.y<=core.y_max&&
   n.id==='MB-RG-N'+i&&same(n.xy,p)&&
   typeof n.name_provisional==='string'&&n.name_provisional.length>8&&
   typeof n.land_use==='string'&&n.land_use.length>35&&
   typeof n.junction_note==='string'&&n.junction_note.length>35,
   'Incorrect or unreviewed site approach geometry');
  if(i===0)fail(n.kind==='source_location_anchor'&&n.location_id===from,
    'Railgarden source endpoint changed');
  if(i===1)fail(n.kind==='noncanonical_intermediate_frontage_marker'&&
    n.location_id===null&&!Object.hasOwn(prepared.world.locations,n.id),
    'Intermediate planning point cannot become a new street location');
  if(i===2)fail(n.kind==='draft_design_location_anchor'&&n.location_id===to,
    'Designed grocery cannot be replaced by a new location ID');
 }
 for(let i=0;i<2;i++){
  const link=plan.links[i],band=plan.bands[i];
  fail(link.id==='MB-RG-L'+(i+1)&&
   link.from===plan.nodes[i].id&&link.to===plan.nodes[i+1].id&&
   link.type==='one_existing_draft_neighborhood_link'&&
   link.band_id==='MB-RG-B'+(i+1)&&
   typeof link.character==='string'&&link.character.length>25&&
   typeof link.pedestrian_context==='string'&&link.pedestrian_context.length>35&&
   typeof link.access_notes==='string'&&link.access_notes.length>40&&
   link.traffic_flow==='unknown'&&link.approximate_minutes===null,
   'Frontage segment is incomplete or asserts a verified travel time');
  fail(band.id===link.band_id&&band.link_id===link.id&&
   typeof band.sides?.A==='string'&&band.sides.A.length>35&&
   typeof band.sides?.B==='string'&&band.sides.B.length>35&&
   band.footprints_verified===false,
   'Two-sided provisional frontage missing or falsely surveyed');
 }
 const s=plan.site_semantics,sp=plan.spatial_policy,g=plan.review_gate;
 fail(s.exists_in_catalog===true&&
  s.requires_no_saved_world_admission_for_draft===true&&
  s.existing_in_saved_checkpoint===false&&
  s.public_entrance_in_design===true&&
  s.open_now==='unknown'&&s.staff_now==='unknown'&&
  s.goods_available_now==='unknown'&&
  s.user_discovered===null&&s.visit_recorded===false&&
  s.npc_presence_inferred===false&&s.travel_time_minutes===null&&
  sp.reversible_canvas===true&&sp.source_parent_polyline_must_match===true&&
  Object.entries(sp).filter(([k])=>!['reversible_canvas','source_parent_polyline_must_match'].includes(k))
   .every(([,v])=>v===false)&&
  Object.entries(g).filter(([k])=>k!=='next_section').every(([,v])=>v===true),
  'Catalog access may not imply open business, player knowledge, or a new event');
 return true;
}
export function previewRailgardenGroceryDetail({state,fromId,toId}={}){
 validateRailgardenGroceryDetail({state});
 const ids=plan.nodes.map(x=>x.id),a=ids.indexOf(fromId),b=ids.indexOf(toId);
 const result={classification:'narrator_private_neighborhood_shop_draft',
  planId:plan.plan_id,status:'outside_this_corridor',
  fromId:fromId??null,toId:toId??null,nodeIds:null,linkIds:null,frontageBands:null,
  savedWorldLocationAdmitted:false,publicEntranceInDesign:true,
  openNow:'unknown',staffNow:'unknown',inventoryNow:'unknown',
  playerDiscoveryConfirmed:false,visitRecorded:false,travelMinutes:null,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  canonicalNavigationAuthorized:false};
 if(a<0||b<0)return deep(result);
 const path=[],step=a<=b?1:-1;
 for(let i=a;;i+=step){path.push(i);if(i===b)break;}
 const linkIds=[];
 for(let i=0;i<path.length-1;i++)
  linkIds.push(plan.links[Math.min(path[i],path[i+1])].id);
 return deep({...result,status:'proposed_connected',nodeIds:path.map(i=>ids[i]),
  linkIds,frontageBands:linkIds.map(id=>plan.links.find(x=>x.id===id).band_id)});
}
