// Private schematic overlay. No physical street, parcel, sidewalk or crossing admission.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {inspectCrosswaterProvisionalFragment} from './meridian_bay_crosswater_approach_fragment.mjs';
import {minimumRouteFootprintGap} from './meridian_bay_plaza_harbor_crossstack_coverage.mjs';

const expected={
 parent:['MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122.json',
  'b411fe76cef5c87237805725feb2b425acefc785'],
 city:['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json',
  '2e8c5ff412436a6e7d526bc0172adfca77107263'],
 land:['SOURCE_PR69_LAND_03_20261120.json',
  '2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
 coast:['SOURCE_PR67_COAST_01_20261120.json',
  '7cb79b2113bfef7b7fbbc39539c17fd80a275cd7']
};
const need=(ok,message)=>{if(!ok)throw Error(message)};
const clone=x=>structuredClone(x);
const round=n=>Math.round(n*1e6)/1e6;
const files={};
for(const [key,[name,sha]] of Object.entries(expected)){
 const bytes=readFileSync(new URL('../docs/01_world/'+name,import.meta.url));
 const got=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
  .update(bytes).digest('hex');
 need(got===sha,'Historic review source SHA mismatch: '+key);
 files[key]=JSON.parse(bytes.toString('utf8'));
}
const manifest=JSON.parse(readFileSync(new URL(
 '../docs/01_world/MERIDIAN_BAY_CROSSWATER_FRONTAGE_STREET_STUDY_20261122.json',
 import.meta.url),'utf8'));
const EPS=1e-8;
const pointOK=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const coordsEqual=(a,b)=>pointOK(a)&&pointOK(b)&&
 Math.abs(a.x-b.x)<EPS&&Math.abs(a.y-b.y)<EPS;
const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function noAuthChange(study){
 need(study?.schema_version===1&&
  study.id==='MB-CROSSWATER-FRONTAGE-REVIEW-20261122'&&
  study.authority==='new_original_design_hypothesis_not_saved_canon'&&
  study.status==='review_only_non_playable'&&
  study.parent_pr140_head==='190cff8a4eb1d3bdb9a8e44a76b57255fe91e245'&&
  isDeepStrictEqual(study.parent_fragment,{
   path:'docs/01_world/MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122.json',
   git_blob_sha:expected.parent[1]}),
  'Review source identity or noncanonical status changed');
 const p=study.diagram_parameters;
 need(p?.review_pedestrian_half_width_canvas===0.12&&
  p.frontage_investigation_outer_offset_canvas===0.45&&
  p.physical_width_meters===null&&
  p.length_to_meters_conversion===null&&
  p.design_source==='new_proposal'&&
  p.declared_feasibility===false&&
  p.meaning==='symmetric_overlay_bands_only_not_sidewalk_or_legal_parcel',
  'Proposed widths are schematic and cannot become measurements');
 need(isDeepStrictEqual(study.provenance_classes,{
  anchor:'preexisting_fictional_approximate_place_reference_not_physical_coordinate',
  derived:'calculated_from_existing_unapproved_draft_line_and_study_rectangle',
  new_proposal:'invented_schematic_geometry_only_for_design_review',
  unknown:'unmeasured_unverified_building_parcel_or_access_fact'
 }), 'All source classes required for candidate zoning');
 need(study.shared_approach?.source_id==='CW-GAP-S0'&&
  study.coastal_handoffs?.length===2&&
  study.coastal_handoffs.map(x=>x.source_id).join(',')==='PR106_A,PR103_SIBLING'&&
  study.coastal_handoffs.every(x=>x.status==='unselected_hypothesis'),
  'Both source route alternatives remain unselected');
 need(study.frontage_study_sides?.length===2&&
  study.frontage_study_sides.map(x=>x.id).join(',')==='CW-FRONT-LEFT,CW-FRONT-RIGHT'&&
  study.frontage_study_sides[0].side==='left'&&
  study.frontage_study_sides[1].side==='right'&&
  study.frontage_study_sides.every(x=>x.evidence_class==='new_proposal'&&
   Array.isArray(x.identified_parcels)&&x.identified_parcels.length===0&&
   x.physical_property_line===null),
  'Hypothetical frontage ribbon cannot assert real property');
 const crossings=study.crossing_review_stations;
 need(crossings?.length===2&&
  crossings[0].id==='CW-X-PLAZA-REVIEW'&&
  crossings[0].method==='source_plaza_anchor'&&
  crossings[0].evidence_class==='anchor'&&
  crossings[1].id==='CW-X-TERMINAL-REVIEW'&&
  crossings[1].method===
   'orthogonal_projection_of_approximate_terminal_reference_onto_shared_centerline'&&
  crossings[1].evidence_class==='derived'&&
  crossings.every(x=>x.crosswalk_verified===false&&x.vehicle_flow_verified===false),
  'Crossing review markers are not constructed crossings');
 const topics=['parcel_and_public_right_of_way',
  'building_walls_and_entrances','sidewalk_slope_width_accessibility',
  'traffic_and_transit_crosswalks','public_or_restricted_harbor_access'];
 need(study.survey_ledger?.length===topics.length&&
  study.survey_ledger.every((x,i)=>x.topic===topics[i]&&
   x.confirmed===false&&x.physical_geometry===null&&x.required),
  'Missing source evidence may not become surveyed features');
 need(study.decisions_open?.length===4&&
  study.decisions_open.every(x=>x.owner_decision_required===true&&x.question)&&
  Object.keys(study.invariants??{}).length===10&&
  Object.values(study.invariants).every(v=>v===true)&&
  isDeepStrictEqual(study.approval,{
   physical_walkability:'not_verified',editorial:'pending',story_integration:false
  }), 'Original design hypothesis must stay unapproved');
 return p;
}
const normal=(a,b)=>{
 need(pointOK(a)&&pointOK(b)&&distance(a,b)>EPS,'Nonzero finite line required');
 const len=distance(a,b);
 return {x:-(b.y-a.y)/len,y:(b.x-a.x)/len};
};
const offset=(p,n,d)=>({x:round(p.x+n.x*d),y:round(p.y+n.y*d)});
const ringArea=ring=>Math.abs(ring.reduce((sum,p,i)=>{
 const q=ring[(i+1)%ring.length];
 return sum+p.x*q.y-q.x*p.y;
},0))/2;
/** Offset ribbon is a study patch, not a mapped sidewalk or legal parcel. */
export function sketchRibbon(a,b,inner,outer,side){
 need(Number.isFinite(inner)&&Number.isFinite(outer)&&inner>=0&&
  outer>inner&&outer<=1&&['left','right'].includes(side),
  'Positive bounded research offsets and a side required');
 const n=normal(a,b),s=side==='left'?1:-1;
 const polygon=[
  offset(a,n,s*inner),offset(b,n,s*inner),
  offset(b,n,s*outer),offset(a,n,s*outer)
 ];
 need(ringArea(polygon)>EPS,'Nondegenerate band required');
 return polygon;
}
export function pointOnDraftSegment(p,a,b){
 const n=normal(a,b);
 const dx=b.x-a.x,dy=b.y-a.y;
 const t=Math.max(0,Math.min(1,
  ((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
 const projected={x:round(a.x+t*dx),y:round(a.y+t*dy)};
 return {point:projected,t:round(t),distanceCanvas:round(distance(projected,p)),
  normal:n};
}
export function inspectCrosswaterFrontageStudy({state,proposal=manifest}={}){
 const p=noAuthChange(proposal);
 const parent=inspectCrosswaterProvisionalFragment({state});
 const a=parent.commonLeg.from,b=parent.commonLeg.to;
 need(coordsEqual(a,files.parent.common_undetailed_leg.from)&&
  coordsEqual(b,files.parent.common_undetailed_leg.to)&&
  parent.variants.length===2&&
  parent.variants.map(x=>x.id).join(',')==='PR106_A,PR103_SIBLING'&&
  parent.confirmedObstacles.length===0,
  'Parent review no longer has exactly two source-backed undetailed routes');
 const n=normal(a,b);
 const sharedWalkingRibbon=[
  offset(a,n,p.review_pedestrian_half_width_canvas),
  offset(b,n,p.review_pedestrian_half_width_canvas),
  offset(b,n,-p.review_pedestrian_half_width_canvas),
  offset(a,n,-p.review_pedestrian_half_width_canvas)
 ];
 const frontage=proposal.frontage_study_sides.map(x=>({
  id:x.id,role:'unverified_frontage_survey_polygon_not_parcel',
  sourceClass:'new_proposal',polygon:sketchRibbon(a,b,
   p.review_pedestrian_half_width_canvas,
   p.frontage_investigation_outer_offset_canvas,x.side),
  propertyOwnerKnown:false,buildingLineKnown:false
 }));
 const plaza=files.city.locations.find(x=>x.id==='LOC-CROSSWATER-PLAZA');
 const terminal=files.city.locations.find(x=>x.id==='LOC-TRANSIT-TERMINAL');
 need(coordsEqual(plaza?.reference_xy_units,a)&&
  coordsEqual(terminal?.reference_xy_units,{x:66,y:42})&&
  plaza.physical_footprint_defined===false&&
  terminal.physical_footprint_defined===false&&
  files.city.rules?.coordinate_proximity_does_not_create_road===true,
  'Approximate city location reference unexpectedly became real street geometry');
 const station=pointOnDraftSegment(terminal.reference_xy_units,a,b);
 const crossingReview=[
  {id:'CW-X-PLAZA-REVIEW',xy:clone(a),evidenceClass:'anchor',
   crossingExisting:false,placementProposalOnly:true},
  {id:'CW-X-TERMINAL-REVIEW',xy:clone(station.point),
   evidenceClass:'derived',perpendicularGapCanvas:station.distanceCanvas,
   lineFraction:station.t,crossingExisting:false,placementProposalOnly:true}
 ];
 const candidates=[
  ...files.land.building_footprints.map(x=>({id:x.id,polygon:x.polygon})),
  ...files.coast.building_footprints.map(x=>({id:x.id,polygon:x.polygon}))
 ];
 const sharedMin=Math.min(...candidates.map(x=>
  minimumRouteFootprintGap([a,b],x.polygon)));
 const routeOptions=parent.variants.map(x=>{
  const c=x.coastReviewEntry,segment=[b,c];
  const minCandidateGap=Math.min(...candidates.map(k=>
   minimumRouteFootprintGap(segment,k.polygon)));
  const band=[
   offset(b,normal(b,c),p.review_pedestrian_half_width_canvas),
   offset(c,normal(b,c),p.review_pedestrian_half_width_canvas),
   offset(c,normal(b,c),-p.review_pedestrian_half_width_canvas),
   offset(b,normal(b,c),-p.review_pedestrian_half_width_canvas)
  ];
  return {id:x.id,centerline:clone(segment),reviewBand:band,
   minGapToOtherCandidateBuildingCanvas:round(minCandidateGap),
   possibleBuildingOverlapInReviewedDraft:
    minCandidateGap<=p.review_pedestrian_half_width_canvas,
   physicalClearanceKnown:false,
   legalPublicAccessVerified:false,selected:false};
 });
 need(ringArea(sharedWalkingRibbon)>EPS&&
  sharedMin>p.review_pedestrian_half_width_canvas&&
  routeOptions.every(x=>!x.possibleBuildingOverlapInReviewedDraft),
  'Candidate schematic strip collides with an existing draft building footprint');
 const draftPlaza=files.land.street_alignments.find(x=>x.id==='MX-A-MARKET-PLAZA');
 const draftTerm=files.land.street_alignments.find(x=>x.id==='MX-A-PLAZA-TERM');
 need(coordsEqual(draftPlaza?.points.at(-1),a)&&
  coordsEqual(draftTerm?.points[0],a)&&
  parent.neighboringDraftStreets.every(x=>x.strictCrossings===0),
  'Plaza draft road contact differs from verified source-only reference');
 return clone({
  classification:'private_noncanonical_crosswater_frontage_street_review',
  sourceGitBlobs:Object.fromEntries(Object.entries(expected).map(
   ([key,[,hash]])=>[key,hash])),
  designLineage:{anchor:'source',ribbon:'new_proposal',
   crossingMarker:'derived_question_only',parcelBoundary:'unknown'},
  sharedCenterline:clone([a,b]),
  sharedReviewPedestrianRibbon:sharedWalkingRibbon,
  leftRightFrontageResearch:frontage,
  crossingReviewStations:crossingReview,
  candidateSketchBuildingMinGapSharedCanvas:round(sharedMin),
  variantStudyBands:routeOptions,
  physicalWidthMeters:null,realTravelMinutes:null,
  confirmedParcels:[],confirmedCrosswalks:[],confirmedObstacles:[],
  sourceObstructionSurvey:clone(proposal.survey_ledger),
  decisionsPending:clone(proposal.decisions_open),
  chosenRoute:null,newSavedWorldLinks:[],
  geometryAdmitted:false,playerMoved:false,npcMoved:false,
  fictionalTimeAdvanced:false,editorialReviewRequired:true
 });
}
