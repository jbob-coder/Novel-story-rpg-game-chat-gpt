// Boundary-coverage review for detached, NONCANONICAL Harbor Walk corridor sketches.
// A planning rectangle is not a surveyed land parcel or an approved sidewalk.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateHarborAccessReconciliation} from './meridian_bay_harbor_access_reconciliation.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const manifest={
 overlay:['MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json',
  'aae66aae315603e37e8cb88034600446bf46d21d'],
 coast01:['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',
  '139c3687c98285aff886d28422544d082768217d'],
 coast02:['SOURCE_PR67_COAST_02_20261120.json',
  '325a0acde67a1ce3b44576860824657a3db41695'],
 land03:['SOURCE_PR69_LAND_03_20261120.json',
  '2a95eb9e50f69436cb65711daf8ff586f4ef4279']
};
const check=(condition,message)=>{if(!condition)throw Error(message);};
const clone=value=>structuredClone(value);
const evidence={};
for(const [key,[name,expected]] of Object.entries(manifest)){
 const raw=readFileSync(new URL(name,root));
 const hash=createHash('sha1').update(Buffer.from('blob '+raw.length+'\0'))
  .update(raw).digest('hex');
 check(hash===expected,'Pinned regional source changed: '+key);
 evidence[key]=JSON.parse(raw.toString('utf8'));
}
const EPS=1e-10;
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const squaredDistance=(a,b)=>(b.x-a.x)**2+(b.y-a.y)**2;
const round=n=>Math.round((n+Number.EPSILON)*1e6)/1e6;
const roundPoint=p=>({x:round(p.x),y:round(p.y)});
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const isBox=b=>b&&['x_min','x_max','y_min','y_max'].every(k=>Number.isFinite(b[k]))&&
 b.x_min<b.x_max&&b.y_min<b.y_max;
const normalize=regions=>{
 check(Array.isArray(regions)&&regions.length>0,'At least one study rectangle required');
 const names=new Set();
 for(const region of regions){
  check(typeof region?.id==='string'&&region.id.length>0&&isBox(region.box)&&
   !names.has(region.id),'Invalid or duplicated planning rectangle');
  names.add(region.id);
 }
 return regions;
};

// A zero-length contact with a study rectangle does NOT count as route coverage.
export function clipToStudyBox(a,b,box){
 check(finitePoint(a)&&finitePoint(b)&&squaredDistance(a,b)>EPS**2&&
  isBox(box),'Segment endpoints and nondegenerate study rectangle required');
 let lo=0,hi=1;
 for(const [axis,min,max] of [['x','x_min','x_max'],['y','y_min','y_max']]){
  const delta=b[axis]-a[axis];
  if(Math.abs(delta)<EPS){
   if(a[axis]<box[min]-EPS||a[axis]>box[max]+EPS)return null;
   continue;
  }
  const p=(box[min]-a[axis])/delta,q=(box[max]-a[axis])/delta;
  lo=Math.max(lo,Math.min(p,q));
  hi=Math.min(hi,Math.max(p,q));
  if(hi<lo+EPS)return null;
 }
 return hi-lo>EPS?[Math.max(0,lo),Math.min(1,hi)]:null;
}
const defaultRegions=()=>[
 {id:'coast01',box:evidence.coast01.study_box},
 {id:'coast02',box:evidence.coast02.study_box},
 {id:'land03',box:evidence.land03.study_box}
];

// Each piece lists all covering rectangles; overlapping rectangles are counted ONCE.
export function analyzeStudyBoxCoverage(path,regions=defaultRegions()){
 check(Array.isArray(path)&&path.length>=2&&path.every(finitePoint),
  'Finite route with two or more vertices required');
 normalize(regions);
 const segments=[];
 let coveredLength=0,totalLength=0;
 for(let segment=0;segment<path.length-1;segment++){
  const a=path[segment],b=path[segment+1];
  const length=Math.sqrt(squaredDistance(a,b));
  check(length>EPS,'Zero-length candidate route segment not permitted');
  const clips=regions.flatMap(r=>{
   const interval=clipToStudyBox(a,b,r.box);
   return interval?[{id:r.id,interval}]:[];
  });
  const boundaries=[0,1,...clips.flatMap(x=>x.interval)].sort((x,y)=>x-y);
  const edges=[];
  for(const t of boundaries){
   if(edges.length===0||t-edges.at(-1)>EPS)edges.push(t);
  }
  const pieces=[];
  for(let j=0;j<edges.length-1;j++){
   const u=edges[j],v=edges[j+1];
   if(v-u<=EPS)continue;
   const mid=(u+v)/2;
   const regionIds=clips.filter(x=>
    x.interval[0]<=mid+EPS&&x.interval[1]>=mid-EPS).map(x=>x.id);
   const portion=length*(v-u);
   if(regionIds.length)coveredLength+=portion;
   pieces.push({
    interval:[round(u),round(v)],
    from:roundPoint(lerp(a,b,u)),to:roundPoint(lerp(a,b,v)),
    lengthCanvasUnits:round(portion),
    studyBoxes:regionIds,
    undocumentedByAvailableStudyBoxes:regionIds.length===0,
    physicalPassabilityVerified:false
   });
  }
  segments.push({segment,from:clone(a),to:clone(b),
   lengthCanvasUnits:round(length),pieces});
  totalLength+=length;
 }
 const uncoveredLength=Math.max(0,totalLength-coveredLength);
 return clone({
  totalCanvasUnits:round(totalLength),
  insideStudyBoxesCanvasUnits:round(coveredLength),
  outsideStudyBoxesCanvasUnits:round(uncoveredLength),
  fractionInsideStudyBoxes:round(coveredLength/totalLength),
  fractionOutsideStudyBoxes:round(uncoveredLength/totalLength),
  segments,studiedBoxes:regions.map(x=>x.id),
  coverageIsNotPassability:true
 });
}
const orient=(a,b,c)=>cross(sub(b,a),sub(c,a));
function segmentEdgeContact(a,b,c,d){
 const r=sub(b,a),s=sub(d,c),q=sub(c,a),den=cross(r,s);
 if(Math.abs(den)<EPS){
  if(Math.abs(cross(q,r))>EPS)return false;
  const rr=dot(r,r),t0=dot(q,r)/rr,t1=dot(sub(d,a),r)/rr;
  return Math.min(1,Math.max(t0,t1))>=
   Math.max(0,Math.min(t0,t1))-EPS;
 }
 const t=cross(q,s)/den,u=cross(q,r)/den;
 return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS;
}
function polygonInterior(p,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];
  if(Math.abs(orient(a,b,p))<EPS&&
   p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
   p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS)return false;
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
// Check known *candidate* footprints; missing geometry outside study boxes remains unknown.
export function candidateBuildingContacts(path,regions){
 check(Array.isArray(path)&&path.length>=2&&path.every(finitePoint),
  'A finite route is required');
 check(Array.isArray(regions),'Candidate building records required');
 const contacts=[];
 for(const region of regions){
  check(typeof region?.id==='string'&&Array.isArray(region.buildings),
   'Malformed candidate region');
  for(const building of region.buildings){
   const polygon=building?.polygon;
   check(typeof building?.id==='string'&&Array.isArray(polygon)&&
    polygon.length>=3&&polygon.every(finitePoint),'Invalid building footprint');
   for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1];
    check(squaredDistance(a,b)>EPS**2,'Zero-length route segment');
    for(let j=0;j<polygon.length;j++){
     if(segmentEdgeContact(a,b,polygon[j],polygon[(j+1)%polygon.length]))
      contacts.push({region:region.id,building:building.id,routeSegment:i,
       edge:j,type:'draft_footprint_boundary_contact'});
    }
    for(const [label,p] of [
     ['start',a],['midpoint',lerp(a,b,0.5)],
     ...(i===path.length-2?[['end',b]]:[])
    ]){
     if(polygonInterior(p,polygon))contacts.push({
      region:region.id,building:building.id,routeSegment:i,
      sample:label,type:'draft_footprint_interior'
     });
    }
   }
  }
 }
 return clone(contacts);
}
const proposedPaths=()=>[
 {id:'market_review_PR44',vertices:evidence.overlay.market_to_harbor.nodes.map(x=>x.xy),
  from:'LOC-COMMERCIAL-DISTRICT'},
 {id:'plaza_review_PR56',vertices:evidence.overlay.plaza_to_harbor.nodes.map(x=>x.xy),
  from:'LOC-CROSSWATER-PLAZA'}
];
const knownBuildings=()=>[
 {id:'coast01',buildings:evidence.coast01.building_footprints},
 {id:'coast02',buildings:evidence.coast02.building_footprints},
 {id:'land03',buildings:evidence.land03.building_footprints}
];

export function inspectHarborRegionalCoverage({state}={}){
 validateHarborAccessReconciliation({state});
 check(evidence.land03.region_type==='land_only_no_water_or_new_shoreline'&&
  evidence.coast02.proposed_coast.shoreline.length===22&&
  evidence.coast01.proposed_coast.shoreline.at(-1).x===75.1&&
  evidence.coast01.proposed_coast.shoreline.at(-1).y===42,
  'Regional planning archives changed beyond this review');
 const plans=proposedPaths().map(p=>{
  const coverage=analyzeStudyBoxCoverage(p.vertices);
  const contacts=candidateBuildingContacts(p.vertices,knownBuildings());
  check(contacts.length===0,
   'Candidate path intersects a known planned building; stop coverage approval: '+p.id);
  check(coverage.fractionOutsideStudyBoxes>0.5,
   'Previously undocumented portion changed; inspect new coverage before reuse');
  check(state.world.locations[p.from]?.connected_ids?.includes('LOC-HARBOR-WALK')&&
   state.world.locations['LOC-HARBOR-WALK']?.connected_ids?.includes(p.from),
   'Existing saved-world connection missing: '+p.id);
  return {id:p.id,existingLinkFrom:p.from,existingLinkTo:'LOC-HARBOR-WALK',
   coverage,knownDraftBuildingContacts:contacts,
   missingStudyGeometryBlocksPhysicalApproval:true,
   existingPlaceGraphConnectionPreserved:true,
   physicalRouteSelected:false};
 });
 const [market,plaza]=plans;
 check(Math.abs(market.coverage.fractionInsideStudyBoxes-0.3028)<0.000002&&
  Math.abs(plaza.coverage.fractionInsideStudyBoxes-0.443109)<0.000002,
  'Coverage ratios changed: rerun regional study before approval');
 return clone({
  classification:'narrator_private_multi_region_coverage_audit',
  sourcePr:103,sourceCommit:'a04712478fad6ab3f367d3af2eb1f14ee55013e2',
  sourceBlobs:Object.fromEntries(Object.entries(manifest).map(
   ([key,[,blob]])=>[key,blob])),
  studies:[
   {id:'land03',bounds:clone(evidence.land03.study_box),notSurveyed:true},
   {id:'coast02',bounds:clone(evidence.coast02.study_box),notSurveyed:true},
   {id:'coast01',bounds:clone(evidence.coast01.study_box),notSurveyed:true}
  ],
  routes:[market,plaza],
  missingRegionStudy:'urban_connector_below_y42_between_Market_Plaza_and_Coast01',
  missingRegionIsUnprovenNotBlocked:true,
  regionCoverageOnlyNotPublicRightOfWay:true,
  roadDistancesKm:null,travelMinutes:null,selectedPhysicalCorridors:null,
  worldGeometryAdmitted:false,newSavedEdges:[],
  savedWorldChanged:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,requiresFurtherCartographicReview:true
 });
}
