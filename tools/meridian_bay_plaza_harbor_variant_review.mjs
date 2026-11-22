// Reversible cross-PR geometry alternatives; read-only; never admits fictional map details.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {screenDraftRoute} from './meridian_bay_harbor_route_comparison.mjs';
import {validateMeridianRegionalSeams,coastRoadBuildingConflicts,
 coastalWaterConflicts} from './meridian_bay_three_region_seams.mjs';

const fixed={
 route:{path:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  sha:'a5ac772922b4717797118b15f182207be1d1a7fb'},
 coast:{path:'SOURCE_PR67_COAST_01_20261120.json',
  sha:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'}
};
const need=(ok,message)=>{if(!ok)throw Error(message)};
const clone=value=>structuredClone(value);
const blob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
 .update(bytes).digest('hex');
const read=name=>readFileSync(new URL('../docs/01_world/'+name,import.meta.url));
const sources={};
for(const [key,item]of Object.entries(fixed)){
 const raw=read(item.path);
 need(blob(raw)===item.sha,'Immutable historical Plaza–Harbor source changed: '+key);
 sources[key]=JSON.parse(raw);
}
const spec=JSON.parse(read('MERIDIAN_BAY_PLAZA_HARBOR_VARIANT_OPTIONS_20261122.json'));
const eps=1e-9;
const equal=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const strict=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-eps&&
 orient(c,d,a)*orient(c,d,b)<-eps;
const on=(a,b,p)=>Math.abs(orient(a,b,p))<=eps&&
 p.x>=Math.min(a.x,b.x)-eps&&p.x<=Math.max(a.x,b.x)+eps&&
 p.y>=Math.min(a.y,b.y)-eps&&p.y<=Math.max(a.y,b.y)+eps;
const position=(p,polygon)=>{
 if(polygon.some((a,i)=>on(a,polygon[(i+1)%polygon.length],p)))return 'boundary';
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside?'inside':'outside';
};
const length=route=>route.nodes.slice(1).reduce((total,node,i)=>{
 const a=route.nodes[i].xy,b=node.xy;
 return total+Math.hypot(b.x-a.x,b.y-a.y);
},0);
const round=n=>Math.round(n*1e6)/1e6;
const validateSpec=()=>{
 need(spec.schema_version===1&&
  spec.status==='hypothetical_options_only_not_approved_or_admitted'&&
  spec.source_pr56?.git_blob_sha===fixed.route.sha&&
  spec.source_pr67?.git_blob_sha===fixed.coast.sha&&
  spec.source_pr56.path==='docs/01_world/'+fixed.route.path&&
  spec.source_pr67.path==='docs/01_world/'+fixed.coast.path&&
  Object.values(spec.constraints??{}).every(v=>v===true),
  'Plaza review manifest lost its provenance or restrictions');
 const [a,b]=spec.options??[];
 need(spec.options.length===2&&a.id==='ROUTE_N2_EAST_GAP'&&
  a.kind==='edit_one_draft_route_waypoint'&&a.target_node==='MB-PH-N2'&&
  equal(a.source_xy,{x:68.9,y:39.15})&&equal(a.candidate_xy,{x:69.6,y:39})&&
  a.preserves_node_count===true&&a.preserves_harbor_tail===true&&
  b.id==='BUILDING_B01_SOUTH'&&b.kind==='translate_candidate_footprint_only'&&
  b.target_building==='HC-B-01'&&b.dx===0&&b.dy===-0.55&&
  b.preserves_route_points===true,
  'Unexpected geometry edit: only the two reviewed reversible variants are allowed');
 return {a,b};
};

/** Screen candidate building containment against draft zoning by vertices and strict edges. */
export function inspectBuildingZone(building,zone){
 need(Array.isArray(building?.polygon)&&building.polygon.length>=3&&
  Array.isArray(zone?.polygon)&&zone.polygon.length>=3,
  'Draft footprint and land-use polygon are required');
 const pts=building.polygon,area=zone.polygon;
 const externalVertices=pts.flatMap((p,i)=>
  position(p,area)==='outside'?[i]:[]);
 const strictBoundaryCrossings=[];
 for(let i=0;i<pts.length;i++)for(let j=0;j<area.length;j++)
  if(strict(pts[i],pts[(i+1)%pts.length],area[j],area[(j+1)%area.length]))
   strictBoundaryCrossings.push({footprintEdge:i,landUseEdge:j});
 return {outsideVertexIndices:externalVertices,
  strictBoundaryCrossings,whollyWithinCandidateZone:
   externalVertices.length===0&&strictBoundaryCrossings.length===0};
}

export function buildPlazaHarborReviewVariants(){
 const {a,b}=validateSpec();
 const route=sources.route,coast=sources.coast;
 need(route.status==='detailed_draft_not_story_canon'&&
  coast.status==='editable_fragment_draft_not_admitted_to_saved_world'&&
  Object.values(coast.limits).every(v=>v===true),
  'Only unpublished historical geometry can be inspected');
 need(route.nodes.length===5&&
  route.nodes[0].location_id==='LOC-CROSSWATER-PLAZA'&&
  route.nodes[4].location_id==='LOC-HARBOR-WALK'&&
  equal(route.nodes[0].xy,{x:65,y:42})&&
  equal(route.nodes[4].xy,{x:71,y:37}),
  'Protected canonical Plaza–Harbor graph anchors changed');
 need(route.nodes[2].id==='MB-PH-N2'&&equal(route.nodes[2].xy,a.source_xy)&&
  equal(route.nodes[3].xy,{x:70.1,y:37.85})&&
  coast.building_footprints.some(p=>p.id==='HC-B-01')&&
  coast.land_use_patches.some(p=>p.id==='HC-Z-OLD'),
  'Original source corridor/footprint anchors changed');
 const routeAlternative=clone(route);
 routeAlternative.nodes[2].xy=clone(a.candidate_xy);
 const footprintAlternative=clone(coast);
 const building=footprintAlternative.building_footprints.find(p=>p.id==='HC-B-01');
 building.polygon=building.polygon.map(p=>({x:p.x+b.dx,y:round(p.y+b.dy)}));
 const noOtherRouteChanges=clone(routeAlternative);
 noOtherRouteChanges.nodes[2].xy=clone(a.source_xy);
 need(isDeepStrictEqual(noOtherRouteChanges,route),
  'Unexpected modifications to route source structure');
 const noOtherCoastChanges=clone(footprintAlternative);
 noOtherCoastChanges.building_footprints.find(p=>p.id==='HC-B-01')
  .polygon=clone(coast.building_footprints.find(p=>p.id==='HC-B-01').polygon);
 need(isDeepStrictEqual(noOtherCoastChanges,coast),
  'Unexpected modifications to Coast 01 source structure');
 return {historicalRoute:clone(route),historicalCoast:clone(coast),
  routeAlternative,footprintAlternative};
}

export function inspectPlazaHarborVariantOptions({state}={}){
 validateMeridianRegionalSeams({state});
 const {historicalRoute, historicalCoast,routeAlternative,
  footprintAlternative}=buildPlazaHarborReviewVariants();
 const baseline=screenDraftRoute(historicalRoute,historicalCoast);
 const routeReview=screenDraftRoute(routeAlternative,historicalCoast);
 const footprintReview=screenDraftRoute(historicalRoute,footprintAlternative);
 const oldZone=historicalCoast.land_use_patches.find(x=>x.id==='HC-Z-OLD');
 const baseB=historicalCoast.building_footprints.find(x=>x.id==='HC-B-01');
 const shiftedB=footprintAlternative.building_footprints.find(x=>x.id==='HC-B-01');
 const originalBuildingZone=inspectBuildingZone(baseB,oldZone);
 const shiftedBuildingZone=inspectBuildingZone(shiftedB,oldZone);
 need(baseline.findings.filter(x=>x.type==='candidate_building_strict_cross').length===2&&
  routeReview.findings.length===0&&footprintReview.findings.length===0&&
  originalBuildingZone.whollyWithinCandidateZone&&
  !shiftedBuildingZone.whollyWithinCandidateZone&&
  shiftedBuildingZone.outsideVertexIndices.length===2&&
  shiftedBuildingZone.strictBoundaryCrossings.length===2&&
  coastRoadBuildingConflicts(historicalCoast).length===0&&
  coastRoadBuildingConflicts(footprintAlternative).length===0&&
  coastalWaterConflicts(historicalCoast).length===0&&
  coastalWaterConflicts(footprintAlternative).length===0,
  'Source-specific candidate comparison changed: needs further independent review');
 const preservedTail=isDeepStrictEqual(
  routeAlternative.nodes.slice(3).map(x=>x.xy),
  historicalRoute.nodes.slice(3).map(x=>x.xy));
 const routeLen=round(length(routeAlternative));
 const baseLen=round(length(historicalRoute));
 const detourPct=round((length(routeAlternative)/length(historicalRoute)-1)*100);
 return clone({
  classification:'narrator_private_noncanonical_plaza_variant_comparison',
  sourceBlobs:{PR56:fixed.route.sha,PR67:fixed.coast.sha},
  original:{strictDraftBuildingCrossings:2,
   candidateDistanceUnits:baseLen,
   originalCandidateBuildingWithinZoning:originalBuildingZone.whollyWithinCandidateZone},
  options:[
   {id:'ROUTE_N2_EAST_GAP',changeType:'one_provisional_waypoint_only',
    nodeId:'MB-PH-N2',originalXY:{x:68.9,y:39.15},candidateXY:{x:69.6,y:39},
    newStrictRouteFindings:routeReview.findings,
    draftCanvasLength:routeLen,additionalDraftCanvasUnits:round(routeLen-baseLen),
    relativeDraftLengthIncreasePct:detourPct,
    preservedHarborTail:preservedTail,preservedSourceFootprint:true,
    zoningBoundaryIssueCreated:false,physicalWidthVerified:false,
    reviewedForPlayableNavigation:false},
   {id:'BUILDING_B01_SOUTH',changeType:'translate_one_unapproved_building_polygon',
    buildingId:'HC-B-01',translation:{x:0,y:-0.55},
    newStrictRouteFindings:footprintReview.findings,
    outsideOriginalZoneVertexIndices:shiftedBuildingZone.outsideVertexIndices,
    zoneStrictBoundaryCrossings:shiftedBuildingZone.strictBoundaryCrossings,
    leavesCandidateZoningBoundary:!shiftedBuildingZone.whollyWithinCandidateZone,
    preservedRoute: true,buildingLocationVerified:false,
    reviewedForPlayableNavigation:false}
  ],
  lowerCollateralChangeForNextStudy:'ROUTE_N2_EAST_GAP',
  lowerCollateralChangeIsNotApproval:true,
  newSavedGraphEdges:[],selectedCanonicalPhysicalRoute:null,
  worldGeometryAdmitted:false,sourceArchivesUnchanged:true,
  privateOnly:true,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,realDistanceKm:null,travelMinutes:null,
  requiresEditorialReview:true
 });
}
