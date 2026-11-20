// Read-only cross-PR seam and route-conflict audit. No source branch merges.
// PR86 is the inherited first-fragment draft, NOT a repaired street survey.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {validateHarborCoastFragment} from './meridian_bay_harbor_coast_review.mjs';

const source={
 pr66:{file:'MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json',sha:'81ef8da51951205394ba050fe6f867bfc00d7244'},
 pr86:{file:'MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json',sha:'dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9'},
 pr67:{file:'SOURCE_PR67_COAST_01_20261120.json',sha:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'},
 coast02:{file:'SOURCE_PR67_COAST_02_20261120.json',sha:'325a0acde67a1ce3b44576860824657a3db41695'},
 land03:{file:'SOURCE_PR69_LAND_03_20261120.json',sha:'2a95eb9e50f69436cb65711daf8ff586f4ef4279'},
 market44:{file:'SOURCE_PR44_MARKET_HARBOR_20261120.json',sha:'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'},
 market58:{file:'SOURCE_PR58_MARKET_HARBOR_20261120.json',sha:'280a444f6eed99a33027aea2edb48af70cc67bd0'},
 plaza56:{file:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',sha:'a5ac772922b4717797118b15f182207be1d1a7fb'}
};
const requireFact=(condition,message)=>{if(!condition)throw Error(message);};
const clone=value=>structuredClone(value);
const fixed={};
for(const [key,ref] of Object.entries(source)){
 const raw=readFileSync(new URL('../docs/01_world/'+ref.file,import.meta.url));
 const hash=createHash('sha1').update(Buffer.from('blob '+raw.length+'\0')).update(raw).digest('hex');
 requireFact(hash===ref.sha,'Immutable historical geometry source changed: '+key);
 fixed[key]=JSON.parse(raw.toString('utf8'));
}
const records=Object.freeze(fixed);
const eps=1e-7;
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const proper=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-eps&&
 orient(c,d,a)*orient(c,d,b)<-eps;
const inside=(p,poly)=>{
 let ok=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)ok=!ok;
 }
 return ok;
};
const equal=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const connections=(s,a,b)=>s[a]?.connected_ids?.filter(id=>id===b).length===1&&
 s[b]?.connected_ids?.filter(id=>id===a).length===1;
const market='LOC-COMMERCIAL-DISTRICT',plaza='LOC-CROSSWATER-PLAZA',
 terminal='LOC-TRANSIT-TERMINAL',harbor='LOC-HARBOR-WALK';
const isBlocked=r=>/blocked|trace/.test(r.mode);
const points=plan=>plan.nodes.map(node=>node.xy);

export function coastRoadBuildingConflicts(fragment){
 requireFact(fragment?.street_alignments&&fragment?.building_footprints,
  'Coast region with roads and buildings required');
 const result=[];
 for(const road of fragment.street_alignments){
  if(isBlocked(road))continue;
  for(const building of fragment.building_footprints){
   const p=building.polygon,route=road.points;
   for(let i=0;i<route.length-1;i++)for(let j=0;j<p.length;j++)
    if(proper(route[i],route[i+1],p[j],p[(j+1)%p.length]))
     result.push({roadId:road.id,buildingId:building.id,
      roadSegment:i,buildingEdge:j,kind:'strict_boundary_crossing'});
   for(let i=0;i<route.length;i++)if(inside(route[i],p))
    result.push({roadId:road.id,buildingId:building.id,
     roadPoint:i,kind:'road_point_inside_candidate_building'});
  }
 }
 return result;
}

export function coastalWaterConflicts(fragment){
 requireFact(fragment?.proposed_coast?.shoreline?.length>=2&&
  fragment.land_use_patches&&fragment.building_footprints&&fragment.street_alignments,
  'Coastal source geometry required');
 const shore=fragment.proposed_coast.shoreline;
 const shoreX=y=>{
  for(let i=0;i<shore.length-1;i++){
   const a=shore[i],b=shore[i+1];
   if(y>=a.y-eps&&y<=b.y+eps)return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);
  }
  return null;
 };
 const hits=[];
 const shapes=[...fragment.land_use_patches,...fragment.building_footprints,
  ...fragment.street_alignments];
 for(const shape of shapes){
  const coords=shape.polygon??shape.points;
  for(let i=0;i<coords.length-(shape.polygon?0:1);i++){
   const a=coords[i],b=coords[(i+1)%coords.length],ys=[
    a.y,b.y,...shore.map(p=>p.y).filter(y=>y>Math.min(a.y,b.y)&&y<Math.max(a.y,b.y))
   ];
   for(const y of ys){
    const x=Math.abs(b.y-a.y)<eps?Math.max(a.x,b.x):
     a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y),edgeX=shoreX(y);
    if(edgeX===null||x>edgeX+eps){
     hits.push({shapeId:shape.id,segment:i,y,x,shorelineX:edgeX});break;
    }
   }
  }
 }
 return hits;
}

export function candidateRouteCrossings(plan,fragment){
 requireFact(plan?.nodes&&fragment?.building_footprints&&
  fragment.street_alignments&&fragment.land_use_patches,
  'Route and coast drafts required');
 const route=points(plan),result=[];
 for(let i=0;i<route.length-1;i++){
  for(const building of fragment.building_footprints){
   const p=building.polygon;
   for(let j=0;j<p.length;j++)if(proper(route[i],route[i+1],p[j],p[(j+1)%p.length]))
    result.push({segment:i,candidateType:'building',candidateId:building.id,edge:j});
  }
  for(const road of fragment.street_alignments){
   if(!isBlocked(road))continue;
   for(let j=0;j<road.points.length-1;j++)
    if(proper(route[i],route[i+1],road.points[j],road.points[j+1]))
     result.push({segment:i,candidateType:'blocked_historic_trace',candidateId:road.id,edge:j});
  }
 }
 return result;
}

function verifySourceRelationships(){
 const {pr66,pr67,pr86,coast02,land03,market44,market58,plaza56}=records;
 // The PR67 source makes EXACTLY three scalar fixes over original PR66
 // (one freight x and two old-road y). No arbitrary global merge is allowed.
 const proposed=clone(pr66);
 proposed.land_use_patches.find(p=>p.id==='HC-Z-FREIGHT').polygon[3].x=72.25;
 const street=proposed.street_alignments.find(p=>p.id==='HC-A-OLD');
 street.points[3].y=39.95;street.points[4].y=39.3;
 requireFact(same(proposed,pr67),
  'PR67 coast 01 no longer matches the three reviewed historical corrections');
 requireFact(coastalWaterConflicts(pr66).some(x=>x.shapeId==='HC-Z-FREIGHT')&&
  coastalWaterConflicts(pr67).length===0&&coastalWaterConflicts(pr86).length===0&&
  coastalWaterConflicts(coast02).length===0,
  'Fragment-coast land use is not geometrically consistent');
 const collisions86=coastRoadBuildingConflicts(pr86);
 const collisions67=coastRoadBuildingConflicts(pr67);
 requireFact(collisions86.length===3&&
  collisions86.every(x=>x.roadId==='HC-A-OLD'&&x.buildingId==='HC-B-02')&&
  collisions67.length===0,
  'Historical safer road-vs-building alternative changed');
 const a=pr86.proposed_coast.shoreline.at(-1);
 const b=coast02.proposed_coast.shoreline[0];
 const seam1=pr86.assembly_seams.find(x=>x.id==='COAST-HIGH');
 const seam2=coast02.assembly_seams.find(x=>x.id==='COAST-02-START');
 requireFact(equal(a,b)&&equal(a,{x:75.1,y:42})&&
  equal(seam1,a)&&equal(seam2?.xy,b)&&
  equal(pr67.proposed_coast.shoreline.at(-1),a)&&
  pr86.study_box.y_max===coast02.study_box.y_min,
  'Coastal fragment 01 -> 02 seam changed');
 const joinPairs=[['MX-A-OLD-SEAM','HN-A-OLD','MX-EAST-OLD',{x:68.1,y:43.8}],
 ['MX-A-LATER-BYPASS','HN-A-NEW','MX-EAST-BYPASS',{x:68.2,y:46.65}]];
 for(const [landRoad,coastRoad,joinId,expected] of joinPairs){
  const end=land03.street_alignments.find(x=>x.id===landRoad)?.points.at(-1);
  const start=coast02.street_alignments.find(x=>x.id===coastRoad)?.points[0];
  const join=land03.boundary_interfaces.find(x=>x.id===joinId);
  requireFact(equal(end,expected)&&equal(start,expected)&&
   equal(join?.point,expected)&&join?.connects_to===coastRoad&&
   join.transport_status==='candidate_not_saved_route',
   'Historical coastal/inland street seam mismatched: '+joinId);
 }
 requireFact(land03.region_type==='land_only_no_water_or_new_shoreline'&&
  land03.proposed_coast===undefined&&
  coast02.proposed_coast.shoreline.length===22&&
  land03.street_alignments.length===8,
  'Historical fragments cannot create a new shoreline or playable highway');
 requireFact(market44.nodes.length===5&&market58.nodes.length===6&&
  plaza56.nodes.length===5,'Unexpected historical route granularity');
 const tailMarket44=points(market44).at(-1),tailMarket58=points(market58).at(-1),
  tailPlaza56=points(plaza56).at(-1);
 requireFact(equal(tailMarket44,{x:71,y:37})&&
  equal(tailMarket58,tailMarket44)&&equal(tailPlaza56,tailMarket44)&&
  equal(points(market58).at(-2),pr86.reference_anchors.find(x=>x.id==='MB-MH-N4'))&&
  equal(points(plaza56).at(-2),pr86.reference_anchors.find(x=>x.id==='MB-PH-N3'))&&
  !equal(points(market44).at(-2),points(market58).at(-2)),
  'Competing Market or Plaza corridor design relation changed');
 const collisionPlaza=candidateRouteCrossings(plaza56,pr67).filter(x=>
  x.candidateType==='building');
 requireFact(collisionPlaza.length===2&&
  collisionPlaza.every(x=>x.candidateId==='HC-B-01'),
  'Plaza route has an unreviewed collision with a candidate building');
 for(const part of [pr66,pr67,pr86,coast02])requireFact(
  Object.values(part.limits).every(v=>v===true),
  'A coast fragment gained implicit story authority');
 requireFact(Object.values(land03.preservation_rules).every(v=>v===true),
  'Inland fragment lacks the no-story-change guard');
 return true;
}

export function validateMeridianRegionalSeams({state}={}){
 requireFact(state?.world?.locations&&state?.player?.location_id,
  'Existing saved world and player required');
 validateHarborCoastFragment({state});
 const l=state.world.locations;
 requireFact(Object.hasOwn(l,state.player.location_id)&&
  connections(l,market,harbor)&&connections(l,plaza,harbor)&&
  connections(l,market,plaza)&&connections(l,plaza,terminal),
  'Only the real four existing saved-world links have authority');
 const anchors=new Map([
  [market,{x:58,y:43}],[plaza,{x:65,y:42}],[terminal,{x:66,y:42}],[harbor,{x:71,y:37}]
 ]);
 for(const anchor of records.land03.source_existing_places)requireFact(
  equal(anchor.xy,anchors.get(anchor.id)),
  'Land region proposal moved an existing place');
 requireFact(records.coast02.street_alignments.every(x=>
   x.registered_as_new_story_link===false),
  'Coastal region tried to add a playable route');
 return verifySourceRelationships();
}

export function inspectMeridianRegionalSeams({state}={}){
 validateMeridianRegionalSeams({state});
 const {pr67,pr86,coast02,market44,market58,plaza56}=records;
 const marketRoutes=[['PR44',market44],['PR58',market58]].map(([id,plan])=>({
  source:id,pointCount:plan.nodes.length,segmentCount:plan.nodes.length-1,
  penultimate:clone(points(plan).at(-2)),
  harbor:clone(points(plan).at(-1)),
  exactMatchWithCoast01MarketTail:equal(points(plan).at(-2),
   pr86.street_alignments.find(x=>x.id==='HC-A-MARKET').points[0]),
  candidateIntersections:candidateRouteCrossings(plan,pr67),
  approved:false
 }));
 const plazaRoute={
  source:'PR56',pointCount:plaza56.nodes.length,segmentCount:plaza56.nodes.length-1,
  exactMatchWithCoast01PlazaTail:equal(points(plaza56).at(-2),
   pr86.street_alignments.find(x=>x.id==='HC-A-PLAZA').points[0]),
  candidateIntersections:candidateRouteCrossings(plaza56,pr67),
  approved:false
 };
 return clone({
  classification:'narrator_private_three_region_geometry_audit',
  sourceStatus:'historical_drafts_only_no_game_admission',
  coastlineSeam:{from:'coast01',to:'coast02',xy:{x:75.1,y:42},coordinatesMatch:true,
   verifiedPhysicalShore:false},
  inlandSeams:[
   {from:'land03',to:'coast02',xy:{x:68.1,y:43.8},coordinatesMatch:true,
    playableRouteAuthorized:false},
   {from:'land03',to:'coast02',xy:{x:68.2,y:46.65},coordinatesMatch:true,
    playableRouteAuthorized:false}
  ],
  coast01Alternatives:{
   inheritedPr86:{coastalWaterViolations:coastalWaterConflicts(pr86).length,
    roadBuildingCandidateConflicts:coastRoadBuildingConflicts(pr86).length,
    physicalIntegrationReady:false},
   historicPr67:{coastalWaterViolations:coastalWaterConflicts(pr67).length,
    roadBuildingCandidateConflicts:coastRoadBuildingConflicts(pr67).length,
    technicalPreference:'safer_source_candidate_requiring_separate_integration',
    playableAdmission:false}
  },
  coast02:{shorelineVertices:coast02.proposed_coast.shoreline.length,
   waterViolations:coastalWaterConflicts(coast02).length,verifiedShoreline:false},
  land03:{source:'PR69',proposedRoads:records.land03.street_alignments.length,
   newCanonicalConnections:0},
  marketHarborAlternatives:marketRoutes,plazaHarborProposal:plazaRoute,
  existingSavedGraphEdgesOnly:[[market,harbor],[plaza,harbor],[market,plaza],
   [plaza,terminal]],
  unresolvedConflictCount:coastRoadBuildingConflicts(pr86).length+
   plazaRoute.candidateIntersections.length,
  selectedPhysicalRoute:null,newSavedEdges:[],
  roadDistancesKm:null,travelMinutes:null,
  canonicalNavigationAuthorized:false,worldMapAdmitted:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  requiresEditorialReview:true
 });
}
