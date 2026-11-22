// Provisional Market Row M1 envelope geometry, NOT a physical street, parcel or easement.
// No additions to the saved graph, no travel, and no historical story mutations.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateM1P1InterfaceConcepts} from './meridian_m1_p1_interface_concepts.mjs';

const dir=new URL('../docs/01_world/',import.meta.url);
const pins={
  concepts:['MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json','593b332e69e4eecdfeaa5217ad7464a230e1bad2'],
  section04:['MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json','a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
  marketHarbor:['SOURCE_PR44_MARKET_HARBOR_20261120.json','e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
  marketCross:['SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json','904983876226ba82451bf9e3b5d6aed8e7885d6a'],
  inland:['SOURCE_PR69_LAND_03_20261120.json','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
  city:['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json','2e8c5ff412436a6e7d526bc0172adfca77107263']
};
const ensure=(v,m)=>{if(!v)throw Error(m);};
const clone=x=>structuredClone(x);
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const round=x=>Math.round(x*1e6)/1e6;
const equal=(a,b)=>isDeepStrictEqual(a,b);
const documents={};
for(const [id,[name,expected]] of Object.entries(pins)){
 const bytes=readFileSync(new URL(name,dir));
 const found=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
   .update(bytes).digest('hex');
 ensure(found===expected,'Original Market M1 geometry evidence changed: '+id);
 documents[id]=JSON.parse(bytes.toString('utf8'));
}
const savedRecord=JSON.parse(readFileSync(new URL(
 'MERIDIAN_BAY_MARKET_M1_FRONTAGE_ENVELOPE_20261122.json',dir),'utf8'));
const EPS=1e-9;

export function makeSchematicBand(a,b,leftOffset,rightOffset){
 ensure(point(a)&&point(b)&&Number.isFinite(leftOffset)&&
  Number.isFinite(rightOffset)&&leftOffset<rightOffset,
  'Finite segment and two ordered lateral drawing offsets required');
 const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
 ensure(len>EPS,'Cannot offset a zero-length candidate line');
 const normal={x:-dy/len,y:dx/len};
 const move=(p,k)=>({x:round(p.x+normal.x*k),y:round(p.y+normal.y*k)});
 return [move(a,leftOffset),move(b,leftOffset),move(b,rightOffset),move(a,rightOffset)];
}
const area=p=>Math.abs(p.reduce((sum,v,i)=>{
 const n=p[(i+1)%p.length];return sum+v.x*n.y-n.x*v.y;
},0))/2;
export function clipPolygonToStudyBox(vertices,box){
 ensure(Array.isArray(vertices)&&vertices.length>=3&&vertices.every(point)&&
  box&&['x_min','x_max','y_min','y_max'].every(k=>Number.isFinite(box[k]))&&
  box.x_max>box.x_min&&box.y_max>box.y_min,'Invalid study polygon or rectangle');
 let p=clone(vertices);
 for(const [axis,limit,keepHigher] of [
  ['x',box.x_min,true],['x',box.x_max,false],
  ['y',box.y_min,true],['y',box.y_max,false]
 ]){
  const inside=a=>keepHigher?a[axis]>=limit-EPS:a[axis]<=limit+EPS;
  const intersection=(a,b)=>{
   const span=b[axis]-a[axis];ensure(Math.abs(span)>EPS,
    'Unexpected parallel clip intersection');
   const t=(limit-a[axis])/span;
   return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  };
  const output=[];
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],ia=inside(a),ib=inside(b);
   if(ia&&ib)output.push(b);
   else if(ia&&!ib)output.push(intersection(a,b));
   else if(!ia&&ib)output.push(intersection(a,b),b);
  }
  p=output;
  if(!p.length)break;
 }
 return p.map(v=>({x:round(v.x),y:round(v.y)}));
}
const onEdge=(p,a,b)=>Math.abs((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))<=EPS&&
 p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
 p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
function containsOrTouches(p,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];
  if(onEdge(p,a,b))return true;
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function segmentsContact(a,b,c,d){
 const o1=cross(a,b,c),o2=cross(a,b,d),o3=cross(c,d,a),o4=cross(c,d,b);
 if((o1>EPS&&o2<-EPS||o1<-EPS&&o2>EPS)&&
    (o3>EPS&&o4<-EPS||o3<-EPS&&o4>EPS))return true;
 return (Math.abs(o1)<=EPS&&onEdge(c,a,b))||
  (Math.abs(o2)<=EPS&&onEdge(d,a,b))||
  (Math.abs(o3)<=EPS&&onEdge(a,c,d))||
  (Math.abs(o4)<=EPS&&onEdge(b,c,d));
}
export function polygonsContact(a,b){
 ensure(Array.isArray(a)&&a.length>=3&&a.every(point)&&
  Array.isArray(b)&&b.length>=3&&b.every(point),'Two valid polygons required');
 for(let i=0;i<a.length;i++)
  for(let j=0;j<b.length;j++)
   if(segmentsContact(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))
    return true;
 return a.some(p=>containsOrTouches(p,b))||
  b.some(p=>containsOrTouches(p,a));
}
const fixedBands=[
 {id:'M1-CLEAR-STRIP-INQUIRY',left:-0.12,right:0.12,
  kind:'pedestrian_strip_illustration_not_width_or_legal_access'},
 {id:'M1-LATERAL-A-INQUIRY',left:0.12,right:0.45,
  kind:'frontage_screening_only_occupancy_and_side_unknown'},
 {id:'M1-LATERAL-B-INQUIRY',left:-0.45,right:-0.12,
  kind:'frontage_screening_only_occupancy_and_side_unknown'}
];
export function deriveMarketM1FrontageEnvelope({state}={}){
 validateM1P1InterfaceConcepts({state});
 const opts=documents.concepts.alternatives;
 const m1a=opts.find(x=>x.id==='M1-A'),m1b=opts.find(x=>x.id==='M1-B');
 const m1=documents.section04.sections.find(x=>x.id==='MB-04-M1');
 const old=documents.marketHarbor.nodes;
 const inland=documents.inland;
 const commercial=documents.city.focus_area_envelopes.find(x=>x.id==='MB-FOCUS-MARKET');
 ensure(m1a&&m1b&&m1&&commercial&&old.length===5&&
  equal(m1a.sourceLineFrom,m1.from)&&equal(m1a.sourceLineTo,m1.to)&&
  equal(m1b.sourceLineFrom,m1.from)&&equal(m1b.sourceLineTo,m1.to)&&
  m1.canNavigate===false&&m1.buildingFootprints===null&&
  m1.publicEasement===null&&m1.measuredWidth===null&&
  documents.marketHarbor.route_links[0].passable_verified===false,
  'M1 original unbuilt line or option conditions have drifted');
 const t=(inland.study_box.y_min-old[0].xy.y)/(old[1].xy.y-old[0].xy.y);
 ensure(equal(m1.from,{x:round(old[0].xy.x+t*(old[1].xy.x-old[0].xy.x)),
  y:inland.study_box.y_min})&&equal(m1.to,old[1].xy)&&
  documents.marketCross.visibility_gate.exact_corner_unknown===true&&
  commercial.boundary_confirmed===false&&
  documents.city.planning_envelope.georeferenced===false,
  'Unproven market exit must stay on the correct historical seam');
 const buildings=inland.building_footprints;
 ensure(buildings.length===12,'Land03 building-source list changed');
 const candidates=fixedBands.map(x=>{
  const polygon=makeSchematicBand(m1.from,m1.to,x.left,x.right);
  const recordedHits=buildings.filter(b=>polygonsContact(polygon,b.polygon)).map(b=>b.id);
  // This only assesses the 12 historical Land03 draft shapes, not the unmapped area.
  ensure(recordedHits.length===0,'New candidate building contact requires review: '+x.id);
  const overlap=clipPolygonToStudyBox(polygon,inland.study_box);
  const insideArea=overlap.length>=3?round(area(overlap)):0;
  const insideFocus=polygon.every(p=>
    p.x>=commercial.box.x_min-EPS&&p.x<=commercial.box.x_max+EPS&&
    p.y>=commercial.box.y_min-EPS&&p.y<=commercial.box.y_max+EPS);
  ensure(insideFocus,'M1 illustrative envelope moved outside known focus');
  return {
   id:x.id,kind:x.kind,lateralOffsetsCanvasUnits:[x.left,x.right],
   polygonIllustrativeCanvas:polygon,
   land03StudyBoxClippedPolygon:overlap,
   graphicalAreaOverLand03StudyBoxSqUnits:insideArea,
   fullyWithinUnsurveyedMarketFocusEnvelope:insideFocus,
   candidateLand03BuildingsScreened:buildings.map(b=>b.id),
   recordedHistoricalBuildingShapeContacts:recordedHits,
   physicalBuildingClearanceVerified:false,
   parcelOwnershipVerified:false,
   actualPedestrianWidthVerified:false,
   passageFromMarketRowVerified:false,
   graphicOffsetsAreMeters:false,
   streetApproved:false
  };
 });
 ensure(candidates[0].graphicalAreaOverLand03StudyBoxSqUnits>0&&
  candidates[1].graphicalAreaOverLand03StudyBoxSqUnits>0&&
  candidates[2].graphicalAreaOverLand03StudyBoxSqUnits===0,
  'M1 lateral sketch overlap with Land03 study boundary changed');
 return clone({
  schema_version:1,
  id:'MB-SECTION04-M1-MARKET-FRONTAGE-ILLUSTRATIVE-CLEARANCE-20261122',
  status:'noncanonical_graphical_screen_no_physical_right_of_way',
  sourceGitBlobs:Object.fromEntries(Object.entries(pins).map(([k,[,sha]])=>[k,sha])),
  studySection:'MB-04-M1',sourcePr44FirstLegId:'MB-MH-L1',
  originalSourceSegment:[clone(old[0].xy),clone(old[1].xy)],
  clippedCenterline:[clone(m1.from),clone(m1.to)],
  screenOnlyAgainst:'PR69_Land03_12_candidate_footprints_not_M1_unknown_parcels',
  marketFocusEnvelopeId:commercial.id,
  reviewedConceptIds:['M1-A','M1-B'],
  ribbonAndInquiryBands:candidates,
  centerlineTouchesLand03AtStartOnly:true,
  ribbonHasPositiveGraphicAreaAcrossStudyBoundary:true,
  candidateKnownLand03BuildingContacts:[],
  unknownUnmappedM1BuildingFootprints:null,
  publicMarketExitApproved:false,
  cafeEntranceAndLoadingConfiguration:null,
  legalRightOfWayVerified:false,
  physicalCrossingsVerified:false,
  realRouteSafetyVerified:false,
  realDimensionsMeters:null,
  land03StudyBoxNotAParcel:true,
  noPortOrTerminalAccessInferred:true,
  selectedConstruction:null,
  preservedOtherSectionIds:['MB-04-P1','MB-04-P2','MB-04-M2','MB-04-M3'],
  newSavedGraphEdges:[],newBuildings:[],
  playerMoved:false,npcMoved:false,timeAdvanced:false
 });
}
export function validateMarketM1FrontageEnvelope({state,candidate=savedRecord}={}){
 ensure(equal(deriveMarketM1FrontageEnvelope({state}),candidate),
  'Unapproved M1 frontage geometry or source custody altered');
 return true;
}
export function inspectMarketM1FrontageEnvelope({state}={}){
 validateMarketM1FrontageEnvelope({state});
 return clone(savedRecord);
}
