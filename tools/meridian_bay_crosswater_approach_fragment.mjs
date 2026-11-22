// Noncanonical source-locked study fragment; NEVER creates streets, parcels or world state.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {inspectPlazaApproachEvidenceGap} from './meridian_bay_plaza_approach_evidence_gap.mjs';

const sourcePaths={
 scale:'MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json',
 plaza:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',
 sibling:'SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json',
 coast01:'SOURCE_PR67_COAST_01_20261120.json',
 land03:'SOURCE_PR69_LAND_03_20261120.json',
 coast02:'SOURCE_PR67_COAST_02_20261120.json'
};
const sourceSHA={
 scale:'2e8c5ff412436a6e7d526bc0172adfca77107263',
 plaza:'a5ac772922b4717797118b15f182207be1d1a7fb',
 sibling:'aae66aae315603e37e8cb88034600446bf46d21d',
 coast01:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7',
 land03:'2a95eb9e50f69436cb65711daf8ff586f4ef4279',
 coast02:'325a0acde67a1ce3b44576860824657a3db41695'
};
const need=(pass,message)=>{if(!pass)throw Error(message)};
const clone=x=>structuredClone(x);
const round=n=>Math.round(n*1e6)/1e6;
const bytes=name=>readFileSync(new URL('../docs/01_world/'+name,import.meta.url));
const sha=raw=>createHash('sha1').update(Buffer.from('blob '+raw.length+'\0'))
 .update(raw).digest('hex');
const records={};
for(const [key,name] of Object.entries(sourcePaths)){
 const data=bytes(name);
 need(sha(data)===sourceSHA[key],'Historical fragment source changed: '+key);
 records[key]=JSON.parse(data.toString('utf8'));
}
const stored=JSON.parse(bytes('MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122.json'));
const EPS=1e-6;
const same=(a,b)=>a&&b&&Number.isFinite(a.x)&&Number.isFinite(a.y)&&
 Number.isFinite(b.x)&&Number.isFinite(b.y)&&
 Math.abs(a.x-b.x)<EPS&&Math.abs(a.y-b.y)<EPS;
const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
const on=(a,b,p)=>Math.abs(cross(a,b,p))<EPS&&
 p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
 p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
const strict=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<-EPS&&
 cross(c,d,a)*cross(c,d,b)<-EPS;
const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pointGap=(p,a,b)=>{
 const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,
  ((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
 return len(p,{x:a.x+t*dx,y:a.y+t*dy});
};
const knownUnknowns=new Set([
 'property_boundaries_and_easements',
 'actual_building_wall_and_door_locations',
 'walking_width_curb_and_accessibility',
 'terminal_entrance_and_crosswalk',
 'road_crossings_and_vehicle_flow',
 'public_vs_restricted_waterfront_transition'
]);
export function validateCrosswaterStudyManifest(manifest){
 need(manifest?.schema_version===1&&
  manifest.fragment_id==='MB-CROSSWATER-APPROACH-STUDY-20261122'&&
  manifest.authority==='provisional_study_overlay_not_admitted_world'&&
  manifest.kind==='dual_candidate_missing_geometry_work_package'&&
  manifest.applies_to==='LOC-CROSSWATER-PLAZA -> LOC-HARBOR-WALK existing saved place link only'&&
  manifest.source_review_head==='34898eb209472ad4f429c06e6d2b3df6c67f2d55'&&
  isDeepStrictEqual(manifest.source_blobs,sourceSHA),
  'Manifest source identity or review-only status changed');
 const box=manifest.study_window;
 need(box?.interpretation==='derived_bounding_window_only_not_parcel_or_road'&&
  box.x_min===65&&box.x_max===68&&box.y_max===42&&
  Math.abs(box.y_min-38.635714285714286)<EPS,
  'Derived study bounds cannot be promoted to physical parcels');
 const common=manifest.common_undetailed_leg;
 need(common?.id==='CW-GAP-S0'&&
  common.provenance==='PR56_undetailed_N0_to_N1'&&
  common.status==='source_route_centerline_hypothesis_only'&&
  same(common.from,{x:65,y:42})&&same(common.to,{x:66.9,y:40.6}),
  'Shared missing route leg no longer matches historical source');
 need(Array.isArray(manifest.variant_exit_legs)&&
  manifest.variant_exit_legs.length===2&&
  manifest.variant_exit_legs[0].id==='PR106_A'&&
  manifest.variant_exit_legs[1].id==='PR103_SIBLING'&&
  manifest.variant_exit_legs.every(x=>x.status==='derived_clip_not_a_new_street'&&
   same(x.from,common.to)),
  'Exactly two original candidate exits must be preserved');
 need(Array.isArray(manifest.obstacles_known_confirmed)&&
  manifest.obstacles_known_confirmed.length===0&&
  Array.isArray(manifest.unknown_obstruction_and_parcel_checks)&&
  manifest.unknown_obstruction_and_parcel_checks.length===knownUnknowns.size&&
  new Set(manifest.unknown_obstruction_and_parcel_checks.map(x=>x.issue)).size===knownUnknowns.size&&
  manifest.unknown_obstruction_and_parcel_checks.every(x=>
   knownUnknowns.has(x.issue)&&x.status==='unknown'&&
   x.confirmed===false&&x.geometry===null),
  'Unknown obstacles and parcel lines must not become verified without evidence');
 need(Array.isArray(manifest.decisions_unmade)&&
  manifest.decisions_unmade.length===4&&
  manifest.decisions_unmade.every(x=>x.id&&x.question&&x.requires)&&
  Object.keys(manifest.invariants??{}).length===9&&
  Object.values(manifest.invariants).every(v=>v===true)&&
  manifest.review_status==='requires_original_city_geometry_and_editorial_approval',
  'Mandatory open decisions and no-world-write guards changed');
 need(Array.isArray(manifest.adjacent_source_sketches)&&
  manifest.adjacent_source_sketches.length===2&&
  manifest.adjacent_source_sketches.map(x=>x.id).join(',')===
   'MX-A-MARKET-PLAZA,MX-A-PLAZA-TERM'&&
  manifest.adjacent_source_sketches.every(x=>x.source==='land03'&&
   x.contact_kind==='shared_plaza_reference_only'&&
   same(x.at,common.from)&&x.physical_crossing_verified===false),
  'Adjacent draft streets must not imply an approved crossing');
 return true;
}
function sourceRoadContacts(common,road){
 const found=[];
 for(let i=0;i<road.points.length-1;i++){
  const a=road.points[i],b=road.points[i+1];
  if(strict(common.from,common.to,a,b))found.push({segment:i,strict:true});
  else if(on(common.from,common.to,a)||on(common.from,common.to,b)||
   on(a,b,common.from)||on(a,b,common.to))found.push({segment:i,strict:false});
 }
 return found;
}
export function inspectCrosswaterProvisionalFragment({state,manifest=stored}={}){
 validateCrosswaterStudyManifest(manifest);
 const upstream=inspectPlazaApproachEvidenceGap({state});
 const base=records.plaza.nodes,common=manifest.common_undetailed_leg;
 need(base[0].location_id==='LOC-CROSSWATER-PLAZA'&&
  base[1].location_id===null&&
  base.at(-1).location_id==='LOC-HARBOR-WALK'&&
  same(base[0].xy,common.from)&&same(base[1].xy,common.to),
  'Historical route origin changed');
 const variants=manifest.variant_exit_legs.map((x,i)=>{
  const evidence=upstream.variants[i];
  need(x.id===evidence.source&&same(x.source_next_waypoint,evidence.N2)&&
   same(x.coast_study_entry,evidence.coastBoxEntry.xy)&&
   same(x.from,common.to)&&evidence.spans.length===2&&
   same(evidence.spans[0].start,common.from)&&
   same(evidence.spans[0].end,common.to)&&
   same(evidence.spans[1].start,common.to)&&
   same(evidence.spans[1].end,x.coast_study_entry),
   'Derived candidate centerline deviates from source evidence');
  const second=len(x.from,x.coast_study_entry);
  need(Math.abs(second-evidence.spans[1].canvasLength)<1e-5,
   'Second undetailed span no longer matches source clip');
  return {id:x.id,centerlineOnly:[clone(common.from),clone(common.to),
   clone(x.coast_study_entry)],coastReviewEntry:clone(x.coast_study_entry),
   sharedLegCanvas:round(len(common.from,common.to)),
   optionLegCanvas:round(second),
   undetailedTotalCanvas:round(second+len(common.from,common.to)),
   outsideAllBroadFocusCanvas:evidence.outsideDetailedAndFocusCanvas,
   physicalPassageVerified:false,routeApproved:false};
 });
 const scale=records.scale;
 const plaza=scale.locations.find(x=>x.id==='LOC-CROSSWATER-PLAZA');
 const terminal=scale.locations.find(x=>x.id==='LOC-TRANSIT-TERMINAL');
 need(same(plaza?.reference_xy_units,common.from)&&
  same(terminal?.reference_xy_units,{x:66,y:42})&&
  plaza.physical_footprint_defined===false&&
  terminal.physical_footprint_defined===false&&
  scale.rules?.street_network_geometry_not_yet_mapped===true,
  'Approximate terminal/place coordinates cannot prove real access');
 const streetContacts=manifest.adjacent_source_sketches.map(x=>{
  const road=records.land03.street_alignments.find(r=>r.id===x.id);
  need(road,'Missing nearby legacy street sketch');
  const hits=sourceRoadContacts(common,road);
  need(hits.length===1&&hits[0].strict===false&&
   (x.id==='MX-A-MARKET-PLAZA'?
    same(road.points.at(-1),common.from):
    same(road.points[0],common.from)),
   'Draft road contacts occur beyond the shared Plaza reference');
  return {id:x.id,sharedPlazaReferenceOnly:clone(common.from),
   strictCrossings:0,verifiedCrosswalk:false};
 });
 const box=manifest.study_window;
 need(box.x_min===common.from.x&&
  box.x_max===Math.max(...variants.map(x=>x.coastReviewEntry.x))&&
  Math.abs(box.y_min-Math.min(...variants.map(x=>x.coastReviewEntry.y)))<EPS&&
  box.y_max===common.from.y,
  'Study window must be derived from route evidence, not an invented parcel');
 return clone({
  classification:'narrator_private_noncanonical_crosswater_approach_fragment',
  sourceGitBlobs:sourceSHA,reviewWindow:box,commonLeg:common,variants,
  neighboringDraftStreets:streetContacts,
  terminalApproximateAnchor:terminal.reference_xy_units,
  terminalCenterlineGapCanvas:round(pointGap(terminal.reference_xy_units,
   common.from,common.to)),
  unknownPhysicalObstaclesAndParcels:manifest.unknown_obstruction_and_parcel_checks,
  confirmedObstacles:[],
  ownerOrDesignerDecisionsOpen:manifest.decisions_unmade,
  sourceAuthorityOnly:true,chosenPhysicalRoute:null,
  newWorldLocations:[],newSavedWorldEdges:[],
  mapAdmitted:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,requiresEditorialReview:true
 });
}
