// Selective adaptation of historical Railgarden grocery frontage PR #62.
// Private cartographic review only: the grocery is already admitted to the
// saved world; this module does not admit it, play a scene, or move an actor.
import {readFileSync} from 'node:fs';
import {isDeepStrictEqual as same} from 'node:util';
import {meridianBayDesign,verifyMeridianBayWorld} from './meridian_bay_locations.mjs';
import {locationAvailability} from './location_state.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const plan=read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_GROCERY_FRONTAGE_REVIEW_20261120.json');
const city=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
const need=(ok,message)=>{if(!ok)throw Error(message);};
const has=(obj,key)=>Object.hasOwn(obj,key);
const numberPoint=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Number.isFinite(p.x)&&Number.isFinite(p.y);
const deep=value=>structuredClone(value);
const from='LOC-RAILGARDEN-RESIDENTIAL';
const to='LOC-RAILGARDEN-ABARROTES';
const home='LOC-WILSON-APARTMENT';
const workshop='LOC-WILSON-WORKSHOP';

// No optional "plan" argument: callers cannot promote unreviewed geometry.
function validateFrozenGeometry(){
 const catalog=meridianBayDesign();
 need(plan.schema_version===1&&
  plan.plan_id==='MB-RAILGARDEN-GROCERY-ADMITTED-FRONTAGE-20261120-V1'&&
  plan.status==='private_spatial_draft_not_story_canon'&&
  plan.source_catalog==='docs/01_world/MERIDIAN_BAY_PREBUILT_DESIGN.json'&&
  plan.source_plan==='docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'&&
  plan.provenance?.historical_head==='3bad47131f631d7edb472ef57dc8495226a22835'&&
  plan.provenance?.historical_plan_blob_sha==='c2c4881a2432f4be447200d9305ae375b8545ee1'&&
  plan.endpoints?.from_id===from&&plan.endpoints?.to_id===to&&
  plan.endpoints.design_id===catalog.world_design_id&&
  plan.endpoints.historical_parent_segment==='MB-WEB-003'&&
  plan.endpoints.saved_world_admission_required===true,
  'Unverified grocery frontage provenance or endpoint authority');
 need(plan.limits&&Object.keys(plan.limits).length===12&&
  Object.values(plan.limits).every(value=>value===false),
  'A map draft cannot grant a route, fictional action or service fact');
 const refs=new Map(city.locations.map(place=>[place.id,place.reference_xy_units]));
 const core=city.planning_regions.find(region=>region.id==='MB-REG-CORE')?.box;
 const expected=[refs.get(from),{x:47.72,y:44.15},refs.get(to)];
 need(core&&expected.every(numberPoint)&&plan.nodes?.length===3&&
  plan.links?.length===2&&plan.bands?.length===2,
  'Missing approved planning references for a two-part frontage');
 const kinds=['saved_district_anchor','private_draft_waypoint_only','saved_public_site_anchor'];
 for(let i=0;i<3;i++){
  const node=plan.nodes[i],pos=expected[i],id='MB-RG-N'+i;
  need(node?.id===id&&node.kind===kinds[i]&&
   node.location_id===(i===0?from:i===2?to:null)&&
   same(node.xy,pos)&&pos.x>=core.x_min&&pos.x<=core.x_max&&
   pos.y>=core.y_min&&pos.y<=core.y_max,
   'Provisional grocery waypoint differs from source design');
 }
 for(let i=0;i<2;i++){
  const link=plan.links[i],band=plan.bands[i],index=i+1;
  need(link?.id==='MB-RG-L'+index&&
   link.from===plan.nodes[i].id&&link.to===plan.nodes[i+1].id&&
   link.band_id==='MB-RG-B'+index&&link.approximate_minutes===null&&
   band?.id===link.band_id&&band.footprints_verified===false&&
   typeof band.sides?.A==='string'&&band.sides.A.length>=35&&
   typeof band.sides?.B==='string'&&band.sides.B.length>=35,
   'Broken provisional grocery frontage segment or unsupported survey claim');
 }
 return true;
}

export function validateRailgardenGroceryFrontage({state}={}){
 need(state?.world?.locations&&state?.player?.location_id,
  'Verified saved world and player required');
 // The canonical site is admitted already. Pre-admission fixtures are NOT
 // appropriate for this module; verifyMeridianBayWorld checks all six sites.
 const catalog=meridianBayDesign();
 need(state.world.prebuilt_design_id===catalog.world_design_id&&
  state.world.prebuilt_design_review?.reviewed===true&&
  state.world.prebuilt_design_review?.operation==='world_admission',
  'This frontage requires the admitted city design and reviewed world checkpoint');
 verifyMeridianBayWorld(state);
 const sites=state.world.locations;
 need(has(sites,state.player.location_id)&&
  has(sites,from)&&has(sites,to)&&has(sites,home)&&has(sites,workshop),
  'The saved player and household-city anchors must exist');
 const grocery=catalog.places.find(place=>place.id===to);
 need(grocery&&same(sites[to],grocery)&&
  sites[to].access_status==='public_confirmed'&&
  sites[to].opening_hours===null&&sites[to].travel_minutes===null,
  'Grocery design or unknown service facts cannot be overwritten by draft');
 for(const [a,b] of [[from,to],[from,home],[home,workshop]]){
  need(sites[a].connected_ids.filter(id=>id===b).length===1&&
   sites[b].connected_ids.filter(id=>id===a).length===1,
   'Missing or duplicated saved district, household or grocery connection');
 }
 validateFrozenGeometry();
 need(!has(sites,plan.nodes[1].id)&&plan.nodes[1].location_id===null,
  'Draft waypoint cannot be admitted as a street location');
 return true;
}

export function previewRailgardenGroceryFrontage({state,fromId=null,toId=null}={}){
 validateRailgardenGroceryFrontage({state});
 const available=locationAvailability({state,locationId:to});
 const ids=plan.nodes.map(x=>x.id);
 const start=ids.indexOf(fromId),end=ids.indexOf(toId);
 const result={
  classification:'narrator_private_grocery_frontage_review',
  planId:plan.plan_id,
  status:'outside_this_frontage',
  fromId,toId,nodeIds:null,linkIds:null,frontageBandIds:null,
  savedWorldLocationAdmitted:true,publicAccessConfirmed:true,
  graphSource:'admitted_world_link_draft_waypoints',
  openNow:available.status,openingEvidenceSource:available.source,
  staffNow:'unknown',inventoryNow:'unknown',
  playerDiscoveryConfirmed:null,visitRecorded:null,
  travelMinutes:null,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,canonicalNavigationAuthorized:false,
  actionCompleted:false,requiresPlayerAction:true
 };
 if(start<0||end<0)return deep(result);
 const positions=[],step=start<=end?1:-1;
 for(let i=start;;i+=step){positions.push(i);if(i===end)break;}
 const linkIds=[];
 for(let i=1;i<positions.length;i++){
  linkIds.push(plan.links[Math.min(positions[i-1],positions[i])].id);
 }
 return deep({...result,status:'draft_segment_sequence',
  nodeIds:positions.map(i=>ids[i]),linkIds,
  frontageBandIds:linkIds.map(id=>plan.links.find(x=>x.id===id).band_id)});
}
