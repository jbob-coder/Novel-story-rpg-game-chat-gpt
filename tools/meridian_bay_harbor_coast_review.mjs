// Isolated, read-only QA of Harbor Coast draft PR #66. Not a world/map
// admission, a survey, a navigation graph, or a player/NPC action.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {validateMeridianBayScalePlan} from './meridian_bay_scale_plan.mjs';

const readRaw=path=>readFileSync(new URL(path,import.meta.url));
const originalRaw=readRaw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const original=JSON.parse(originalRaw);
const reviewed=JSON.parse(readRaw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json'));
const scale=JSON.parse(readRaw('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json'));
const requireFact=(condition,message)=>{if(!condition)throw Error(message);};
const copy=value=>structuredClone(value);
const EPS=1e-9;
const market='LOC-COMMERCIAL-DISTRICT';
const plaza='LOC-CROSSWATER-PLAZA';
const harbor='LOC-HARBOR-WALK';
const isPoint=p=>p&&typeof p==='object'&&!Array.isArray(p)&&
 Number.isFinite(p.x)&&Number.isFinite(p.y);
const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const properCross=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-EPS&&
 orient(c,d,a)*orient(c,d,b)<-EPS;
const gitBlob=value=>{
 const bytes=Buffer.isBuffer(value)?value:Buffer.from(value);
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
};
const pointInsideBox=(p,box)=>isPoint(p)&&p.x>=box.x_min-EPS&&p.x<=box.x_max+EPS&&
 p.y>=box.y_min-EPS&&p.y<=box.y_max+EPS;
const polygons=[...reviewed.land_use_patches,...reviewed.building_footprints];
const roads=reviewed.street_alignments;
const polygonArea=points=>Math.abs(points.reduce((a,p,i)=>{
 const q=points[(i+1)%points.length];return a+(p.x*q.y-q.x*p.y);
},0)/2);

export function countHarborShorelineIntersections(fragment){
 const shore=fragment?.proposed_coast?.shoreline;
 requireFact(Array.isArray(shore)&&shore.length>=2&&shore.every(isPoint),
  'Shoreline vertices required for audit');
 const found=[];
 const shapes=[...(fragment.land_use_patches??[]),...(fragment.building_footprints??[]),
  ...(fragment.street_alignments??[])];
 for(const item of shapes){
  const pts=item.polygon??item.points;
  requireFact(Array.isArray(pts)&&pts.every(isPoint),'Incomplete Harbor Coast shape');
  const edges=pts.length-(item.polygon?0:1);
  for(let i=0;i<edges;i++)for(let j=0;j<shore.length-1;j++)
   if(properCross(pts[i],pts[(i+1)%pts.length],shore[j],shore[j+1]))
    found.push({shapeId:item.id,shapeEdge:i,coastEdge:j});
 }
 return found;
}

function shoreAtY(shore,y){
 for(let i=0;i<shore.length-1;i++){
  const a=shore[i],b=shore[i+1];
  if(y>=a.y-EPS&&y<=b.y+EPS)
   return a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y);
 }
 return null;
}

function verifyGeometry(){
 const p=reviewed,origin=original,meta=p.review_2026_11_20,box=p.study_box;
 requireFact(gitBlob(originalRaw)==='81ef8da51951205394ba050fe6f867bfc00d7244',
  'Historical Harbor Coast source blob changed');
 requireFact(meta?.historical_head_sha==='d5f8af27779aa49ecfa082e091f6bb57308a146a'&&
  meta.historical_json_blob_sha==='81ef8da51951205394ba050fe6f867bfc00d7244'&&
  meta.main_comparison_sha==='019175c6463ff31807a0f7013d91299add94913c'&&
  meta.scope==='READ_ONLY_EDITABLE_PROPOSAL_NOT_STORY_CANON'&&
  meta.approval.startsWith('not_admitted'),
  'Missing source provenance or provisional review classification');
 requireFact(p.schema_version===1&&
  p.id==='MB-HARBOR-COAST-FRAGMENT-01-20261117'&&
  p.status==='editable_fragment_draft_not_admitted_to_saved_world'&&
  p.proposed_coast.real_shoreline_verified===false&&
  p.proposed_coast.water_on_higher_x_side_in_this_fragment_only===true&&
  box.x_min===68&&box.x_max===77&&box.y_min===32&&box.y_max===42&&
  box.north_unknown===true&&box.canvas==='fictional_100x80_not_real_measurement',
  'The coastal study box must not be promoted to surveyed geography');
 const originalFreight=origin.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 const freight=p.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 requireFact(originalFreight?.polygon.length===7&&freight?.polygon.length===9&&
  same(freight.polygon.slice(3,5),[{x:71.8,y:34.6},{x:72.02,y:35.1}]),
  'Unexpected change to freight landward shoreline adjustment');
 const unpatched=copy(p);delete unpatched.review_2026_11_20;
 unpatched.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon=
  copy(originalFreight.polygon);
 requireFact(same(unpatched,origin),
  'Only the two extra freight-zone vertices may differ from archived source');
 requireFact(origin.proposed_coast.shoreline.length===16&&
  countHarborShorelineIntersections(origin).length===2&&
  countHarborShorelineIntersections(origin).every(x=>x.shapeId==='HC-Z-FREIGHT')&&
  countHarborShorelineIntersections(p).length===0,
  'Coastline correction did not remove the original two crossings');
 const shore=p.proposed_coast.shoreline;
 requireFact(shore.every((xy,i)=>pointInsideBox(xy,box)&&
  (i===0||xy.y>shore[i-1].y)),'Coastline must stay within a monotonic study box');
 requireFact(polygons.length===10&&p.land_use_patches.length===4&&
  p.building_footprints.length===6&&roads.length===6&&
  p.reference_anchors.length===3&&p.assembly_seams.length===4,
  'The historic regional draft has missing or extra objects');
 const allIds=[...p.land_use_patches,...p.building_footprints,...roads,
  ...p.reference_anchors,...p.assembly_seams].map(x=>x.id);
 requireFact(allIds.length===new Set(allIds).size,
  'Duplicate coastal feature identifier');
 for(const item of [...polygons,...roads]){
  const pts=item.polygon??item.points;
  requireFact(pts.length>=(item.polygon?3:2)&&pts.every(pt=>
   pointInsideBox(pt,box)&&pt.x<=shoreAtY(shore,pt.y)+EPS),
   'Candidate geometry outside landward study box');
  if(item.polygon){
   requireFact(polygonArea(pts)>1e-4,'Zero-area candidate physical footprint');
   for(let i=0;i<pts.length;i++)for(let j=i+2;j<pts.length;j++){
    if(i===0&&j===pts.length-1)continue;
    requireFact(!properCross(pts[i],pts[(i+1)%pts.length],pts[j],pts[(j+1)%pts.length]),
     'Self-intersecting candidate footprint');
   }
  }
 }
 requireFact(roads.every(x=>x.registered_as_new_story_link===false)&&
  p.land_use_patches.every(x=>x.status==='provisional')&&
  p.building_footprints.every(x=>x.status==='candidate_only_not_established')&&
  Object.values(p.limits).every(x=>x===true),
  'No historical draft can register a new route, building or fictional action');
 const anchor=p.reference_anchors.find(x=>x.id===harbor);
 const expected=scale.locations.find(x=>x.id===harbor)?.reference_xy_units;
 requireFact(anchor&&same({x:anchor.x,y:anchor.y},expected)&&
  roads.find(x=>x.id==='HC-A-MARKET')?.points.at(-1)?.x===anchor.x&&
  roads.find(x=>x.id==='HC-A-MARKET')?.points.at(-1)?.y===anchor.y&&
  roads.find(x=>x.id==='HC-A-PLAZA')?.points.at(-1)?.x===anchor.x&&
  roads.find(x=>x.id==='HC-A-PLAZA')?.points.at(-1)?.y===anchor.y,
  'Harbor reference anchor or provisional arrival tail changed');
 requireFact(p.assembly_seams.some(x=>x.id==='COAST-HIGH'&&
   same({x:x.x,y:x.y},shore.at(-1)))&&
  p.assembly_seams.some(x=>x.id==='COAST-LOW'&&
   same({x:x.x,y:x.y},shore[0])),
  'Shore end seams must remain open for future region stitching');
 return true;
}
export function validateHarborCoastFragment({state}={}){
 requireFact(state?.world?.locations&&state?.player?.location_id,
  'Read-only review requires the saved world and player');
 validateMeridianBayScalePlan({state});
 const sites=state.world.locations;
 requireFact(sites[harbor]?.id===harbor&&sites[market]?.id===market&&
  sites[plaza]?.id===plaza&&Object.hasOwn(sites,state.player.location_id),
  'Harbor and saved-player identities must exist');
 for(const from of [market,plaza])requireFact(
  sites[harbor].connected_ids.filter(id=>id===from).length===1&&
  sites[from].connected_ids.filter(id=>id===harbor).length===1,
  'Saved Harbor Walk connections are missing or duplicated');
 return verifyGeometry();
}

export function inspectHarborCoastFragment({state,includeDraftGeometry=false}={}){
 validateHarborCoastFragment({state});
 requireFact(typeof includeDraftGeometry==='boolean','Invalid geometry inclusion switch');
 const result={
  classification:'narrator_private_coastal_draft_review',
  id:reviewed.id,status:reviewed.status,
  geometrySource:'reviewed_unapproved_historical_fragment',
  coastlineVerified:false,cardinalDirectionVerified:false,
  detailedRoadsVerified:false,
  shorelineVertices:16,landUsePatches:4,candidateBuildings:6,
  candidateStreetAlignments:6,
  archivedStrictShoreCrossings:2,reviewStrictShoreCrossings:0,
  freightZoneRepair:'two landward vertices; no source rewrite',
  marketTail:'unmerged_competing_geometry',plazaTail:'unmerged_draft_geometry',
  existingSavedEdgesOnly:[[market,harbor],[plaza,harbor]],
  newlyAuthorizedEdges:[],
  actualWalkingMinutes:null,accessCertification:null,
  canonicalNavigationAuthorized:false,
  playerMoved:false,npcMoved:false,fictionalTimeAdvanced:false,
  actionCompleted:false,requiresEditorialReview:true
 };
 if(includeDraftGeometry)result.geometry=copy({
  study_box:reviewed.study_box,
  proposed_coast:reviewed.proposed_coast,
  land_use_patches:reviewed.land_use_patches,
  building_footprints:reviewed.building_footprints,
  street_alignments:reviewed.street_alignments,
  reference_anchors:reviewed.reference_anchors,
  assembly_seams:reviewed.assembly_seams
 });
 return copy(result);
}
export function previewHarborCoastSavedTail({state,fromId}={}){
 validateHarborCoastFragment({state});
 const allowed=[market,plaza].includes(fromId);
 const candidate=allowed?roads.find(x=>x.id===(fromId===market?'HC-A-MARKET':'HC-A-PLAZA')):null;
 return copy({
  classification:'narrator_private_harbor_graph_link_with_unverified_geometry',
  status:allowed?'known_graph_edge_provisional_geometry':'no_supported_tail',
  fromId:fromId??null,toId:harbor,
  graphLinkExists:allowed,
  authoredTailId:candidate?.id??null,
  draftPolyline:candidate?copy(candidate.points):null,
  draftGeometrySource:allowed?'unmerged_historical_design_not_canon':null,
  noRouteConflictResolution:true,
  travelTimeMinutes:null,streetAccessVerified:false,
  canonicalNavigationAuthorized:false,playerMoved:false,
  npcMoved:false,fictionalTimeAdvanced:false,requiresPlayerAction:true
 });
}
