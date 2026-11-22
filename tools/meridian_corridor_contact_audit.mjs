// Private, read-only geometry audit of three competing historical corridor drafts.
// Sketch intersections are NOT legal/physical road closures or saved-world navigation.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validatePr67CoastCandidate} from './render_harbor_coast_pr67_candidate.mjs';
import {candidateRouteCrossings} from './meridian_bay_three_region_seams.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const sources={
 coast:{file:'MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',
  blob:'139c3687c98285aff886d28422544d082768217d'},
 market44:{file:'SOURCE_PR44_MARKET_HARBOR_20261120.json',
  blob:'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'},
 market58:{file:'SOURCE_PR58_MARKET_HARBOR_20261120.json',
  blob:'280a444f6eed99a33027aea2edb48af70cc67bd0'},
 plaza56:{file:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  blob:'a5ac772922b4717797118b15f182207be1d1a7fb'}
};
const demand=(condition,message)=>{if(!condition)throw Error(message);};
const copy=value=>structuredClone(value);
const evidence={};
for(const [key,{file,blob}] of Object.entries(sources)){
 const bytes=readFileSync(new URL(file,root));
 const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
 demand(actual===blob,'Immutable candidate/route source changed: '+key);
 evidence[key]=JSON.parse(bytes.toString('utf8'));
}
const EPS=1e-9;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const point=(p)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const round=n=>Math.round(n*10000)/10000;
const rounded=p=>({x:round(p.x),y:round(p.y)});
const samePoint=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const between=(t)=>t>=-EPS&&t<=1+EPS;
const strict=t=>t>EPS&&t<1-EPS;
const interpolate=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function segmentContact(a,b,c,d){
 demand([a,b,c,d].every(point),'Segment coordinates must be finite points');
 const r=subtract(b,a),s=subtract(d,c);
 const rr=dot(r,r),ss=dot(s,s);
 demand(rr>EPS*EPS&&ss>EPS*EPS,'Zero-length segment is invalid');
 const offset=subtract(c,a),den=cross(r,s);
 if(Math.abs(den)<=EPS){
  if(Math.abs(cross(offset,r))>EPS)return null;
  const t0=dot(offset,r)/rr,t1=dot(subtract(d,a),r)/rr;
  const low=Math.max(0,Math.min(t0,t1)),high=Math.min(1,Math.max(t0,t1));
  if(high<low-EPS)return null;
  if(high-low<=EPS)return {
   kind:'boundary_touch',point:rounded(interpolate(a,b,low)),t:round(low)
  };
  return {
   kind:'collinear_overlap',start:rounded(interpolate(a,b,low)),
   end:rounded(interpolate(a,b,high)),tRange:[round(low),round(high)]
  };
 }
 const t=cross(offset,s)/den,u=cross(offset,r)/den;
 if(!between(t)||!between(u))return null;
 return {kind:strict(t)&&strict(u)?'strict_cross':'boundary_touch',
  point:rounded(interpolate(a,b,t)),t:round(t),u:round(u)};
}
const onSegment=(p,a,b)=>{
 const v=subtract(b,a),w=subtract(p,a);
 return Math.abs(cross(v,w))<=EPS&&dot(w,v)>=-EPS&&
  dot(w,v)<=dot(v,v)+EPS;
};
export function strictlyInsidePolygon(p,poly){
 demand(point(p)&&Array.isArray(poly)&&poly.length>=3&&poly.every(point),
  'Finite polygon with at least three vertices required');
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];
  if(onSegment(p,a,b))return false; // shared boundary is a touch, not containment
  if((a.y>p.y)!==(b.y>p.y)&&
   p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
// This helper is deliberately generic so synthetic edge/tangent cases are testable.
export function inspectRouteContacts(route,buildings,blockedTraces){
 demand(Array.isArray(route)&&route.length>=2&&route.every(point),
  'Finite route with at least two points required');
 demand(Array.isArray(buildings)&&Array.isArray(blockedTraces),
  'Building polygons and blocked traces required');
 const results=[];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1];
  demand(dot(subtract(b,a),subtract(b,a))>EPS*EPS,
   'Duplicated consecutive route node');
  for(const building of buildings){
   demand(typeof building?.id==='string'&&
    Array.isArray(building.polygon)&&building.polygon.length>=3,
    'Malformed candidate building');
   const poly=building.polygon;
   for(let j=0;j<poly.length;j++){
    const hit=segmentContact(a,b,poly[j],poly[(j+1)%poly.length]);
    if(hit)results.push({routeSegment:i,category:'candidate_building',
     candidateId:building.id,edge:j,...hit});
   }
   if(strictlyInsidePolygon(a,poly))results.push({
    routeSegment:i,category:'candidate_building',candidateId:building.id,
    kind:'route_node_inside',node:i,point:rounded(a)
   });
   // The last node only belongs to the final leg for a unique finding.
   if(i===route.length-2&&strictlyInsidePolygon(b,poly))results.push({
    routeSegment:i,category:'candidate_building',candidateId:building.id,
    kind:'route_node_inside',node:i+1,point:rounded(b)
   });
  }
  for(const trace of blockedTraces){
   demand(typeof trace?.id==='string'&&Array.isArray(trace.points)&&
    trace.points.length>=2,'Malformed candidate blocked trace');
   for(let j=0;j<trace.points.length-1;j++){
    const hit=segmentContact(a,b,trace.points[j],trace.points[j+1]);
    if(hit)results.push({routeSegment:i,category:'candidate_blocked_trace',
     candidateId:trace.id,edge:j,...hit});
   }
  }
 }
 return results;
}
const linksAreCoherent=(plan)=>{
 const nodes=plan.nodes,links=plan.route_links??plan.links;
 demand(Array.isArray(nodes)&&Array.isArray(links)&&links.length===nodes.length-1,
  'Corridor topology does not match its candidate route');
 const ids=new Set(nodes.map(x=>x.id));
 demand(ids.size===nodes.length&&nodes.every(x=>point(x.xy)&&
  x.xy.x>=0&&x.xy.x<=100&&x.xy.y>=0&&x.xy.y<=80),
  'Route has duplicate or invalid waypoint identities');
 for(let i=0;i<links.length;i++){
  demand(links[i].from===nodes[i].id&&links[i].to===nodes[i+1].id,
   'Candidate corridor has a disconnected or reordered link');
  demand((links[i].estimated_minutes??links[i].minutes??null)===null&&
   links[i].passable_verified!==true,
   'Draft corridor contains unverified access or travel-time claim');
 }
};
const routePoints=plan=>plan.nodes.map(x=>x.xy);
const market='LOC-COMMERCIAL-DISTRICT';
const plaza='LOC-CROSSWATER-PLAZA';
const harbor='LOC-HARBOR-WALK';
const definitions=[
 {key:'market44',name:'PR44',from:market,to:harbor,tail:'HC-A-MARKET'},
 {key:'market58',name:'PR58',from:market,to:harbor,tail:'HC-A-MARKET'},
 {key:'plaza56',name:'PR56',from:plaza,to:harbor,tail:'HC-A-PLAZA'}
];

export function inspectMeridianCorridorContacts({state}={}){
 validatePr67CoastCandidate({state,fragment:evidence.coast});
 const coast=evidence.coast;
 const blocked=coast.street_alignments.filter(x=>/blocked|trace/.test(x.mode));
 demand(blocked.length===1&&blocked[0].id==='HC-A-OLDTRACE',
  'Candidate old-street obstruction classifications changed');
 const out=definitions.map(def=>{
  const plan=evidence[def.key];
  linksAreCoherent(plan);
  const nodes=plan.nodes,pts=routePoints(plan);
  demand(nodes[0].location_id===def.from&&nodes.at(-1).location_id===def.to&&
   samePoint(pts.at(-1),{x:71,y:37}),
   'Corridor endpoints no longer match admitted location anchors');
  const proposalTail=coast.street_alignments.find(x=>x.id===def.tail);
  demand(proposalTail&&samePoint(proposalTail.points.at(-1),pts.at(-1)),
   'Candidate coast tail no longer ends at Harbor Walk');
  const hits=inspectRouteContacts(pts,coast.building_footprints,blocked);
  const strictExisting=candidateRouteCrossings(plan,coast);
  const strictNew=hits.filter(x=>x.kind==='strict_cross');
  demand(strictNew.length===strictExisting.length&&
   strictNew.every(x=>strictExisting.some(e=>e.segment===x.routeSegment&&
    e.candidateId===x.candidateId&&e.edge===x.edge)),
   'Expanded contact check disagrees with legacy strict-crossing audit');
  return {
   source:def.name,waypointCount:nodes.length,segmentCount:pts.length-1,
   evidenceGitBlob:sources[def.key].blob,
   fromLocationId:def.from,toLocationId:def.to,
   finalApproachMatchesPriorSketch:samePoint(pts.at(-2),proposalTail.points[0]),
   contacts:hits,
   candidateBuildingIntersections:hits.filter(x=>
    x.category==='candidate_building').length,
   blockedTraceCrossings:hits.filter(x=>
    x.category==='candidate_blocked_trace').length,
   approved:false
  };
 });
 const [a,b,c]=out;
 demand(a.waypointCount===5&&b.waypointCount===6&&c.waypointCount===5&&
  a.finalApproachMatchesPriorSketch===false&&
  b.finalApproachMatchesPriorSketch===true&&
  c.finalApproachMatchesPriorSketch===true&&
  a.candidateBuildingIntersections===0&&b.candidateBuildingIntersections===0&&
  c.candidateBuildingIntersections===2&&a.blockedTraceCrossings===1&&
  b.blockedTraceCrossings===1&&c.blockedTraceCrossings===0,
  'Reviewed historical corridor conflicts changed; halt approval');
 demand(out.every(x=>x.contacts.every(h=>h.kind==='strict_cross')),
  'New tangent, overlap or containment requires additional review');
 return copy({
  classification:'private_candidate_geometry_contact_audit',
  worldAuthority:'saved_location_graph_only_not_candidate_geometry',
  geometrySource:'PR67_noncanonical_coast01_candidate',
  historicalSources:['PR44','PR58','PR56'],
  options:out,selectedMarketHarborRoute:null,selectedPlazaHarborRoute:null,
  issueSummary:{
   competingDirectMarketRoutes:2,
   blockedTraceCrossings:a.blockedTraceCrossings+b.blockedTraceCrossings,
   plazaCandidateBuildingCrossings:c.candidateBuildingIntersections
  },
  issuesRequireSiteSurveyOrEditorialDecision:true,
  roadLengthsKm:null,travelMinutes:null,
  savedWorldRoutesAdded:[],physicalMapApproved:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false
 });
}
