// Noncanonical, read-only route alternative screening. Never admits a physical route.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateMeridianRegionalSeams} from './meridian_bay_three_region_seams.mjs';

const sources={
 PR44:{file:'SOURCE_PR44_MARKET_HARBOR_20261120.json',sha:'e8efe8e5f6a746ab4e628f76a9deb5f71061010d'},
 PR58:{file:'SOURCE_PR58_MARKET_HARBOR_20261120.json',sha:'280a444f6eed99a33027aea2edb48af70cc67bd0'},
 PR56:{file:'SOURCE_PR56_PLAZA_HARBOR_20261120.json',sha:'a5ac772922b4717797118b15f182207be1d1a7fb'},
 coast:{file:'SOURCE_PR67_COAST_01_20261120.json',sha:'7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'}
};
const need=(value,message)=>{if(!value)throw Error(message)};
const clone=value=>structuredClone(value);
const gitBlob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sourceData={};
for(const [key,source] of Object.entries(sources)){
 const raw=readFileSync(new URL('../docs/01_world/'+source.file,import.meta.url));
 need(gitBlob(raw)===source.sha,'Historic Harbor route/coast source mismatch: '+key);
 sourceData[key]=JSON.parse(raw);
}
const eps=1e-8;
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const proper=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<-eps&&cross(c,d,a)*cross(c,d,b)<-eps;
const onSegment=(a,b,c)=>Math.abs(cross(a,b,c))<=eps&&
 c.x>=Math.min(a.x,b.x)-eps&&c.x<=Math.max(a.x,b.x)+eps&&
 c.y>=Math.min(a.y,b.y)-eps&&c.y<=Math.max(a.y,b.y)+eps;
const touches=(a,b,c,d)=>onSegment(a,b,c)||onSegment(a,b,d)||onSegment(c,d,a)||onSegment(c,d,b);
const pointInPolygon=(p,polygon)=>{
 if(polygon.some((a,i)=>onSegment(a,polygon[(i+1)%polygon.length],p)))return 'boundary';
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside?'inside':'outside';
};
const round=n=>Math.round(n*1e6)/1e6;
const exact=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const location={market:'LOC-COMMERCIAL-DISTRICT',plaza:'LOC-CROSSWATER-PLAZA',harbor:'LOC-HARBOR-WALK'};
const anchors={
 PR44:{start:{id:location.market,xy:{x:58,y:43}},end:{id:location.harbor,xy:{x:71,y:37}},count:5},
 PR58:{start:{id:location.market,xy:{x:58,y:43}},end:{id:location.harbor,xy:{x:71,y:37}},count:6},
 PR56:{start:{id:location.plaza,xy:{x:65,y:42}},end:{id:location.harbor,xy:{x:71,y:37}},count:5}
};

/**
 * Screen sketch intersections: strict building crossings, inside/boundary
 * waypoints and strict/touching contacts with a hypothetical blocked trace.
 * Does not establish physical accessibility, land rights, or map authority.
 */
export function screenDraftRoute(plan,coast){
 need(Array.isArray(plan?.nodes)&&plan.nodes.length>=2&&
  Array.isArray(coast?.building_footprints)&&
  Array.isArray(coast?.street_alignments),'Draft corridor and Coast 01 required');
 const points=plan.nodes.map(node=>node?.xy);
 need(points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)),
  'Draft route contains invalid coordinates');
 need(points.slice(1).every((p,i)=>!exact(p,points[i])),
  'Zero-length draft route segment');
 const findings=[];
 for(const building of coast.building_footprints){
  need(Array.isArray(building.polygon)&&building.polygon.length>=3,
   'Candidate building must have a polygon');
  for(let i=0;i<points.length-1;i++){
   const a=points[i],b=points[i+1],shape=building.polygon;
   for(let edge=0;edge<shape.length;edge++){
    const c=shape[edge],d=shape[(edge+1)%shape.length];
    if(proper(a,b,c,d))findings.push({
     type:'candidate_building_strict_cross',candidateId:building.id,
     routeSegment:i,candidateEdge:edge
    });
    else if(touches(a,b,c,d))findings.push({
     type:'candidate_building_boundary_touch',candidateId:building.id,
     routeSegment:i,candidateEdge:edge
    });
   }
  }
  for(let i=0;i<points.length;i++){
   const status=pointInPolygon(points[i],building.polygon);
   if(status==='inside')findings.push({
    type:'candidate_building_waypoint_inside',candidateId:building.id,
    routeWaypoint:i
   });
  }
 }
 for(const alignment of coast.street_alignments){
  if(alignment.mode!=='blocked')continue;
  need(Array.isArray(alignment.points)&&alignment.points.length>=2,
   'Blocked historical trace missing coordinates');
  for(let i=0;i<points.length-1;i++)for(let j=0;j<alignment.points.length-1;j++){
   const [a,b]=[points[i],points[i+1]],
    [c,d]=[alignment.points[j],alignment.points[j+1]];
   if(proper(a,b,c,d))findings.push({
    type:'hypothetical_blocked_trace_strict_cross',candidateId:alignment.id,
    routeSegment:i,candidateSegment:j
   });
   else if(touches(a,b,c,d))findings.push({
    type:'hypothetical_blocked_trace_touch',candidateId:alignment.id,
    routeSegment:i,candidateSegment:j
   });
  }
 }
 const len=points.slice(1).reduce((v,p,i)=>v+Math.hypot(
  p.x-points[i].x,p.y-points[i].y),0);
 const straight=Math.hypot(points.at(-1).x-points[0].x,
  points.at(-1).y-points[0].y);
 return {
  pointCount:points.length,segmentCount:points.length-1,
  sketchCanvasLength:round(len),
  straightCanvasDistance:round(straight),
  draftDetourRatio:round(len/straight),
  findings,
  candidateGeometryIssues:findings.length,
  eligibleForPhysicalApproval:false,
  distanceKm:null,travelMinutes:null
 };
}

export function inspectHarborRouteAlternatives({state}={}){
 validateMeridianRegionalSeams({state});
 const coast=sourceData.coast;
 need(coast.status==='editable_fragment_draft_not_admitted_to_saved_world'&&
  Object.values(coast.limits).every(x=>x===true),
  'Coastal geometry cannot become playable authority');
 const candidates=[];
 for(const key of ['PR44','PR58','PR56']){
  const plan=sourceData[key],expect=anchors[key],nodes=plan.nodes;
  need(plan.status==='detailed_draft_not_story_canon'&&
   nodes.length===expect.count&&
   nodes[0].location_id===expect.start.id&&
   nodes.at(-1).location_id===expect.end.id&&
   exact(nodes[0].xy,expect.start.xy)&&exact(nodes.at(-1).xy,expect.end.xy)&&
   nodes.slice(1,-1).every(n=>n.location_id===null),
   'Historical route anchors or draft status changed: '+key);
  const screened=screenDraftRoute(plan,coast);
  candidates.push({
   source:key,
   originalSourceGitBlob:sources[key].sha,
   startLocationId:expect.start.id,endLocationId:expect.end.id,
   ...screened,
   registeredAsNewWorldLink:false,
   selected:false
  });
 }
 const market44=candidates[0],market58=candidates[1];
 need(market44.findings.filter(f=>f.type==='hypothetical_blocked_trace_strict_cross').length===1&&
  market58.findings.filter(f=>f.type==='hypothetical_blocked_trace_strict_cross').length===1&&
  candidates[2].findings.filter(f=>f.type==='candidate_building_strict_cross').length===2,
  'Unexpected historical route conflict pattern; review changed sources');
 return clone({
  classification:'narrator_private_noncanonical_corridor_review',
  historicalSourcesOnly:true,
  coastCandidate:'PR67_COAST_01_UNADMITTED',
  coastGitBlob:sources.coast.sha,
  candidates,
  marketDraftLengthOrder:market44.sketchCanvasLength<market58.sketchCanvasLength?
   ['PR44','PR58']:['PR58','PR44'],
  lengthOrderDoesNotAuthorizeSelection:true,
  blockedHistoricTraceIsNotCertifiedBarrier:true,
  plazaBuildingIsNotCertifiedPhysicalStructure:true,
  approvedPhysicalRoute:null,
  newSavedWorldLinks:[],
  routeAccessibilityVerified:false,
  newLocationRecorded:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  narrativeDeliveryAuthorized:false,
  requiresEditorialDecision:true
 });
}
