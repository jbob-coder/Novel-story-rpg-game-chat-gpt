// Draft-world evidence audit only. Broad planning boxes are NOT physical paths.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildPlazaHarborReviewVariants} from './meridian_bay_plaza_harbor_variant_review.mjs';
import {inspectPlazaHarborCrossstackCoverage} from './meridian_bay_plaza_harbor_crossstack_coverage.mjs';

const sources={
 scale:['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','2e8c5ff412436a6e7d526bc0172adfca77107263'],
 plaza:['SOURCE_PR56_PLAZA_HARBOR_20261120.json','a5ac772922b4717797118b15f182207be1d1a7fb'],
 sibling:['SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json','aae66aae315603e37e8cb88034600446bf46d21d'],
 coast:['SOURCE_PR67_COAST_01_20261120.json','7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'],
 land:['SOURCE_PR69_LAND_03_20261120.json','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
 coast02:['SOURCE_PR67_COAST_02_20261120.json','325a0acde67a1ce3b44576860824657a3db41695']
};
const records={};
const requireFact=(ok,message)=>{if(!ok)throw Error(message)};
const round=x=>Math.round(x*1e6)/1e6;
const clone=x=>structuredClone(x);
for(const [key,[name,expected]] of Object.entries(sources)){
 const bytes=readFileSync(new URL('../docs/01_world/'+name,import.meta.url));
 const hash=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
 requireFact(hash===expected,'Immutable candidate planning source changed: '+key);
 records[key]=JSON.parse(bytes);
}
const E=1e-10;
const good=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const same=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const boxGood=b=>b&&['x_min','x_max','y_min','y_max']
 .every(k=>Number.isFinite(b[k]))&&b.x_min<b.x_max&&b.y_min<b.y_max;
const routeGood=r=>Array.isArray(r)&&r.length>=2&&r.every(good)&&
 r.slice(1).every((p,i)=>!same(p,r[i]));
const point=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

/** Return parametric overlap of segment AB with an illustrative study box. */
export function clipStudyBox(a,b,box){
 requireFact(good(a)&&good(b)&&!same(a,b),'Finite nonzero segment required');
 requireFact(boxGood(box),'Valid increasing study rectangle required');
 const dx=b.x-a.x,dy=b.y-a.y;
 let lo=0,hi=1;
 for(const [p,q] of [[-dx,a.x-box.x_min],[dx,box.x_max-a.x],
  [-dy,a.y-box.y_min],[dy,box.y_max-a.y]]){
  if(Math.abs(p)<E){if(q<-E)return null;}
  else {
   const t=q/p;
   if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
  }
 }
 return hi>lo+E?[lo,hi]:null;
}
function merge(intervals){
 const sorted=intervals.sort((a,b)=>a[0]-b[0]),merged=[];
 for(const [a,b]of sorted){
  if(!merged.length||a>merged.at(-1)[1]+E)merged.push([a,b]);
  else merged.at(-1)[1]=Math.max(merged.at(-1)[1],b);
 }
 return merged;
}
const intervals=(a,b,boxes)=>merge(boxes.map(x=>clipStudyBox(a,b,x)).filter(Boolean));
function missingIntervals(xs){
 const gaps=[];let end=0;
 for(const [a,b]of xs){if(a>end+E)gaps.push([end,a]);end=Math.max(end,b);}
 if(end<1-E)gaps.push([end,1]);
 return gaps;
}
function overlapLength([a,b],ys,len){
 return ys.reduce((sum,[c,d])=>sum+Math.max(0,Math.min(b,d)-Math.max(a,c))*len,0);
}
/** Missing physical detail remains missing even when a broad focus box covers it. */
export function inspectEvidenceCoverage(route,detailedBoxes,focusBoxes){
 requireFact(routeGood(route),'Finite distinct route points required');
 requireFact(Array.isArray(detailedBoxes)&&detailedBoxes.length>0&&
  Array.isArray(focusBoxes)&&focusBoxes.length>0&&
  [...detailedBoxes,...focusBoxes].every(boxGood),
  'Detailed and focus rectangles required');
 let total=0,missing=0,inFocus=0;
 const spans=[];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],len=Math.hypot(b.x-a.x,b.y-a.y);
  const detailed=intervals(a,b,detailedBoxes);
  const focus=intervals(a,b,focusBoxes);
  total+=len;
  for(const [start,end]of missingIntervals(detailed)){
   const spanLen=(end-start)*len,focused=overlapLength([start,end],focus,len);
   missing+=spanLen;inFocus+=focused;
   spans.push({segment:i,start:point(a,b,start),end:point(a,b,end),
    canvasLength:round(spanLen),withinBroadFocusCanvas:round(focused),
    outsideBothCanvas:round(Math.max(0,spanLen-focused))});
  }
 }
 return {fullCanvas:round(total),missingDetailedCanvas:round(missing),
  broadFocusWithoutDetailCanvas:round(inFocus),
  outsideDetailedAndFocusCanvas:round(Math.max(0,missing-inFocus)),
  missingDetailedPct:round(100*missing/total),spans};
}
/** First positive path length in the coastal study box, not a street entry. */
export function firstCoastBoxEntry(route,coastBox){
 requireFact(routeGood(route),'Finite distinct route points required');
 requireFact(boxGood(coastBox),'Valid increasing study rectangle required');
 for(let i=0;i<route.length-1;i++){
  const hit=clipStudyBox(route[i],route[i+1],coastBox);
  if(hit)return {segment:i,param:round(hit[0]),
   xy:point(route[i],route[i+1],hit[0])};
 }
 return null;
}
export function inspectPlazaApproachEvidenceGap({state}={}){
 // Upstream audit checks actual saved graph, all route and sibling sources.
 const upstream=inspectPlazaHarborCrossstackCoverage({state});
 const {routeAlternative,historicalRoute}=buildPlazaHarborReviewVariants();
 const a=routeAlternative.nodes.map(n=>clone(n.xy));
 const b=records.sibling.plaza_to_harbor.nodes.map(n=>clone(n.xy));
 const historical=historicalRoute.nodes.map(n=>clone(n.xy));
 requireFact(historical.length===5&&same(historical[0],{x:65,y:42})&&
  same(historical.at(-1),{x:71,y:37})&&
  same(a[2],{x:69.6,y:39})&&same(b[2],{x:68.3,y:38.1})&&
  a.every((p,i)=>i===2||same(p,historical[i]))&&
  b.every((p,i)=>i===2||same(p,historical[i])),
  'Unreviewed Plaza geometry or location references changed');
 const plan=records.scale;
 requireFact(plan.rules?.existing_graph_is_authoritative===true&&
  plan.rules?.coordinate_proximity_does_not_create_road===true&&
  plan.rules?.street_network_geometry_not_yet_mapped===true,
  'City planning disclaimer changed');
 const cross=plan.locations.find(x=>x.id==='LOC-CROSSWATER-PLAZA');
 const terminal=plan.locations.find(x=>x.id==='LOC-TRANSIT-TERMINAL');
 requireFact(cross&&terminal&&same(cross.reference_xy_units,{x:65,y:42})&&
  same(terminal.reference_xy_units,{x:66,y:42})&&
  cross.physical_footprint_defined===false&&
  terminal.physical_footprint_defined===false,
  'Place reference unexpectedly became physically verified');
 const focus=plan.focus_area_envelopes.filter(x=>[
  'MB-FOCUS-CROSS','MB-FOCUS-TERM','MB-FOCUS-HARBOR'].includes(x.id));
 requireFact(focus.length===3&&focus.every(x=>x.boundary_confirmed===false),
  'Expected three unconfirmed broad planning envelopes');
 const detailed=[records.coast.study_box,records.land.study_box,
  records.coast02.study_box];
 const variants=[['PR106_A',a],['PR103_SIBLING',b]].map(([source,route],i)=>{
  const v=inspectEvidenceCoverage(route,detailed,focus.map(x=>x.box));
  requireFact(Math.abs(v.missingDetailedCanvas-
   upstream.reviews[i].uncoveredByStudyRectanglesCanvas)<1e-5,
   'Local detailed coverage conflicts with prior audited geometry');
  return {source,N2:clone(route[2]),coastBoxEntry:firstCoastBoxEntry(
   route,records.coast.study_box),...v,
   broadFocusIsNotAStreet:true,physicalAccessCertified:false};
 });
 requireFact(variants[0].spans.length===2&&variants[1].spans.length===2&&
  variants[0].outsideDetailedAndFocusCanvas===0&&
  variants[1].outsideDetailedAndFocusCanvas>0.4&&
  variants.every(v=>v.spans[0].segment===0&&
   same(v.spans[0].start,{x:65,y:42})&&
   same(v.spans[0].end,{x:66.9,y:40.6})),
  'Known Plaza approach evidence gap changed unexpectedly');
 return clone({
  classification:'noncanonical_plaza_to_coast_evidence_gap',
  sourceBlobs:Object.fromEntries(Object.entries(sources).map(
   ([key,[,hash]])=>[key,hash])),
  existingSavedPlaceLinkOnly:['LOC-CROSSWATER-PLAZA','LOC-HARBOR-WALK'],
  terminalApproximateReference:clone(terminal.reference_xy_units),
  terminalFootprintSurveyed:false,
  focusIds:focus.map(x=>x.id),
  detailedRegions:['Coast01','Land03','Coast02'],
  variants,
  unknowns:['Physical parcels/building footprints on approach',
   'Crosswalk and transit access','Accessible sidewalk or clear width',
   'Legal public right-of-way and port boundary'],
  decision:'Document missing approach before selecting a physical corridor',
  routeApproved:false,newSavedEdges:[],worldGeometryAdmitted:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false
 });
}
