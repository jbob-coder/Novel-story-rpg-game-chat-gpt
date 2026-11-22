// Read-only, source-locked coverage and clearance audit. No route admission or movement.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {buildPlazaHarborReviewVariants} from './meridian_bay_plaza_harbor_variant_review.mjs';
import {screenDraftRoute} from './meridian_bay_harbor_route_comparison.mjs';
import {validateMeridianRegionalSeams} from './meridian_bay_three_region_seams.mjs';

const fixed={
 sibling:{path:'SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json',
  sha:'aae66aae315603e37e8cb88034600446bf46d21d'},
 route:{path:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  sha:'a5ac772922b4717797118b15f182207be1d1a7fb'},
 coast:{path:'SOURCE_PR67_COAST_01_20261120.json',
  sha:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'},
 market:{path:'SOURCE_PR44_MARKET_HARBOR_20261120.json',
  sha:'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'},
 land:{path:'SOURCE_PR69_LAND_03_20261120.json',
  sha:'2a95eb9e50f69436cb65711daf8ff586f4ef4279'},
 coast02:{path:'SOURCE_PR67_COAST_02_20261120.json',
  sha:'325a0acde67a1ce3b44576860824657a3db41695'}
};
const need=(ok,message)=>{if(!ok)throw Error(message)};
const clone=x=>structuredClone(x);
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const records={};
for(const [name,source] of Object.entries(fixed)){
 const raw=readFileSync(new URL('../docs/01_world/'+source.path,import.meta.url));
 need(sha(raw)===source.sha,'Cross-stack immutable source mismatch '+name);
 records[name]=JSON.parse(raw);
}
const EPS=1e-9;
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const equal=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const delta=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const on=(a,b,p)=>Math.abs(orient(a,b,p))<=EPS&&
 p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
 p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-EPS&&
 orient(c,d,a)*orient(c,d,b)<-EPS;
const contact=(a,b,c,d)=>crosses(a,b,c,d)||
 on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const pointSegment=(p,a,b)=>{
 const ab=delta(b,a),ap=delta(p,a),d=dot(ab,ab);
 const t=d===0?0:Math.max(0,Math.min(1,dot(ap,ab)/d));
 return length(p,{x:a.x+ab.x*t,y:a.y+ab.y*t});
};
export function segmentDistance(a,b,c,d){
 need([a,b,c,d].every(finite),'Valid finite segment coordinates required');
 if(contact(a,b,c,d))return 0;
 return Math.min(pointSegment(a,c,d),pointSegment(b,c,d),
  pointSegment(c,a,b),pointSegment(d,a,b));
}
const polygonPoint=(p,poly)=>{
 if(poly.some((a,i)=>on(a,poly[(i+1)%poly.length],p)))return 'boundary';
 let result=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)
   result=!result;
 }
 return result?'inside':'outside';
};
const routePoints=plan=>plan.nodes.map(n=>n.xy);
const verifyRoute=route=>need(Array.isArray(route)&&route.length>=2&&
 route.every(finite)&&route.slice(1).every((p,i)=>!equal(p,route[i])),
 'Route needs at least two distinct finite successive points');
export function minimumRouteFootprintGap(route,polygon){
 verifyRoute(route);
 need(Array.isArray(polygon)&&polygon.length>=3&&polygon.every(finite),
  'Candidate building polygon required');
 if(route.some(p=>polygonPoint(p,polygon)!=='outside'))return 0;
 let min=Infinity;
 for(let i=0;i<route.length-1;i++)for(let j=0;j<polygon.length;j++)
  min=Math.min(min,segmentDistance(route[i],route[i+1],
   polygon[j],polygon[(j+1)%polygon.length]));
 return min;
}
export function minimumRouteLineGap(route,trace){
 verifyRoute(route);verifyRoute(trace);
 let min=Infinity;
 for(let i=0;i<route.length-1;i++)for(let j=0;j<trace.length-1;j++)
  min=Math.min(min,segmentDistance(route[i],route[i+1],trace[j],trace[j+1]));
 return min;
}
// Axis-aligned study-box clipping, NOT property/road/real-world coverage.
function clipToBox(a,b,box){
 need(['x_min','x_max','y_min','y_max'].every(k=>Number.isFinite(box?.[k]))&&
  box.x_min<box.x_max&&box.y_min<box.y_max,'Valid study rectangle required');
 const dx=b.x-a.x,dy=b.y-a.y;
 let low=0,high=1;
 for(const [p,q] of [[-dx,a.x-box.x_min],[dx,box.x_max-a.x],
  [-dy,a.y-box.y_min],[dy,box.y_max-a.y]]){
  if(Math.abs(p)<=EPS){if(q<0)return null;}
  else{
   const t=q/p;
   if(p<0)low=Math.max(low,t);else high=Math.min(high,t);
  }
 }
 return high>low?[low,high]:null;
}
export function routeStudyCoverage(route,studyBoxes){
 verifyRoute(route);
 need(Array.isArray(studyBoxes)&&studyBoxes.length>0,
  'At least one explicit candidate study box required');
 let total=0,covered=0;
 const segments=[];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],len=length(a,b);
  const hits=studyBoxes.map(box=>clipToBox(a,b,box)).filter(Boolean)
   .sort((x,y)=>x[0]-y[0]);
  const joined=[];
  for(const [start,end]of hits){
   if(!joined.length||start>joined.at(-1)[1]+EPS)joined.push([start,end]);
   else joined.at(-1)[1]=Math.max(joined.at(-1)[1],end);
  }
  const coveredLen=joined.reduce((sum,[s,e])=>sum+(e-s)*len,0);
  total+=len;covered+=coveredLen;
  segments.push({index:i,lengthCanvas:len,insideStudyBoxesCanvas:coveredLen,
   outsideStudyBoxesCanvas:len-coveredLen});
 }
 return {totalCanvas:total,coveredCanvas:covered,uncoveredCanvas:total-covered,
  uncoveredPct:100*(total-covered)/total,segments};
}
export function routeRouteContacts(first,second){
 verifyRoute(first);verifyRoute(second);
 const strict=[],other=[];
 for(let i=0;i<first.length-1;i++)for(let j=0;j<second.length-1;j++){
  const a=first[i],b=first[i+1],c=second[j],d=second[j+1];
  if(crosses(a,b,c,d))strict.push({firstSegment:i,secondSegment:j});
  else if(contact(a,b,c,d)){
   // Terminal-only meeting is expected, but any additional touch must be reviewed.
   const terminalOnly=i===first.length-2&&j===second.length-2&&
    equal(b,d)&&!on(a,b,c)&&!on(c,d,a)&&!equal(a,c);
   // Shared terminal is permitted; overlapping or touching elsewhere is not.
   const shared=terminalOnly;
   other.push({firstSegment:i,secondSegment:j,sharedTerminalOnly:shared});
  }
 }
 return {strict,other};
}
function validateSiblingSource(){
 const x=records.sibling,plaza=x.plaza_to_harbor,market=x.market_to_harbor;
 need(x.status==='review_only_not_admitted_to_saved_world'&&
  x.historical_sources?.plaza_56?.blob===fixed.route.sha&&
  x.historical_sources?.market_44?.blob===fixed.market.sha&&
  x.historical_sources?.coast_pr67_variant?.blob===
   '139c3687c98285aff886d28422544d082768217d'&&
  Object.values(x.limitations??{}).every(v=>v===true),
  'Sibling PR103 historical metadata or review restrictions changed');
 const expectedPlaza=records.route.nodes.map(n=>({id:n.id,xy:clone(n.xy)}));
 need(plaza.nodes.length===5&&
  same(plaza.change,{kind:'relocate_intermediate_waypoint',
   node_id:'MB-PH-N2',from:{x:68.9,y:39.15},to:{x:68.3,y:38.1}}),
  'Sibling Plaza variant changed');
 expectedPlaza[2].xy={x:68.3,y:38.1};
 need(same(expectedPlaza,plaza.nodes),'Sibling Plaza source has undisclosed edits');
 const expectedMarket=records.market.nodes.map(n=>({id:n.id,xy:clone(n.xy)}));
 expectedMarket.splice(4,0,{id:'MB-MH-REVIEW-BEND-20261122',xy:{x:69,y:37.6}});
 need(same(expectedMarket,market.nodes)&&
  same(market.local_coast_tail_overlay?.points,[{x:69,y:37.6},{x:71,y:37}])&&
  market.local_coast_tail_overlay?.changed_only_in_this_overlay===true,
  'Sibling Market comparison deviates from archived PR44 and local-only tail');
 return true;
}
const rounded=n=>Math.round(n*1e6)/1e6;
export function inspectPlazaHarborCrossstackCoverage({state}={}){
 validateMeridianRegionalSeams({state});
 validateSiblingSource();
 const {historicalRoute,historicalCoast,routeAlternative}=buildPlazaHarborReviewVariants();
 const a=routePoints(routeAlternative);
 const b=records.sibling.plaza_to_harbor.nodes.map(n=>clone(n.xy));
 const market=records.sibling.market_to_harbor.nodes.map(n=>clone(n.xy));
 need(equal(a[0],b[0])&&equal(a.at(-1),b.at(-1))&&
  a.length===5&&b.length===5&&
  equal(a[2],{x:69.6,y:39})&&equal(b[2],{x:68.3,y:38.1})&&
  same(a.slice(3),b.slice(3)),
  'Cross-stack proposal endpoints or Harbor tail differ');
 need(screenDraftRoute(routeAlternative,historicalCoast).findings.length===0&&
  screenDraftRoute({nodes:records.sibling.plaza_to_harbor.nodes},historicalCoast)
   .findings.length===0,'Source drafts have contact conflicts with candidate buildings');
 const zones=[historicalCoast.study_box,records.land.study_box,
  records.coast02.study_box];
 const oldStreet=historicalCoast.street_alignments.find(x=>x.id==='HC-A-OLD');
 const buildings=historicalCoast.building_footprints;
 const reviews=[['PR106_A',a],['PR103_PLAZA',b]].map(([source,route])=>{
  const region=routeStudyCoverage(route,zones);
  const gap=buildings.map(building=>({
   id:building.id,
   gapCanvas:rounded(minimumRouteFootprintGap(route,building.polygon))
  })).sort((x,y)=>x.gapCanvas-y.gapCanvas);
  const oldRoadGap=minimumRouteLineGap(route,oldStreet.points);
  const marketMeeting=routeRouteContacts(route,market);
  return {
   source,plazaRouteWaypointN2:clone(route[2]),
   candidateBuildingGaps:gap,
   oldStreetCandidateGapCanvas:rounded(oldRoadGap),
   routeCanvasLength:rounded(region.totalCanvas),
   coveredWithinStudyRectanglesCanvas:rounded(region.coveredCanvas),
   uncoveredByStudyRectanglesCanvas:rounded(region.uncoveredCanvas),
   unchartedStudyRectanglePct:rounded(region.uncoveredPct),
   regionSegments:region.segments.map(x=>({
    index:x.index,outsideCanvas:rounded(x.outsideStudyBoxesCanvas)})),
   sharedMarketReview:{strictCrossings:marketMeeting.strict,
    contacts:marketMeeting.other},
   legalRightOfWayVerified:false,physicalClearanceVerified:false,
   outsideStudyRegionGeometryVerified:false
  };
 });
 need(reviews[0].candidateBuildingGaps.some(x=>x.id==='HC-B-01'&&x.gapCanvas>0)&&
  reviews[0].candidateBuildingGaps.some(x=>x.id==='HC-B-02'&&x.gapCanvas>0)&&
  reviews[0].unchartedStudyRectanglePct>40&&
  reviews[1].unchartedStudyRectanglePct>50&&
  reviews.every(x=>x.sharedMarketReview.strictCrossings.length===0&&
   x.sharedMarketReview.contacts.length===1&&
   x.sharedMarketReview.contacts[0].sharedTerminalOnly),
  'Unexpected local candidate clearance or cross-stack coverage relation');
 return clone({
  classification:'private_noncanonical_plaza_crossstack_coverage_audit',
  historicalOnly:true,geometryCanvasNotSurvey:true,
  sourceBlobs:{PR103:fixed.sibling.sha,PR56:fixed.route.sha,
   PR67:fixed.coast.sha,PR44:fixed.market.sha,
   land03:fixed.land.sha,coast02:fixed.coast02.sha},
  coverageRegions:['Coast01','Land03','Coast02'],
  reviews,marketSiblingSource:'PR103_LOCAL_MARKET_REVIEW',
  conclusions:{
   PR106AHasLessUnchartedCanvasThanPR103:true,
   PR103HasLargerCandidateBuildingGaps:true,
   candidateWidthAndAccessRemainUnknown:true,
   noCoordinateVariantApproved:true,
   reviewUnchartedGapFirst:true
  },
  selectedPhysicalRoute:null,newSavedEdges:[],
  worldMapAdmitted:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,requiresEditorialReview:true
 });
}
