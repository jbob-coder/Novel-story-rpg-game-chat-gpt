// Noncanonical, read-only M1/P1 access evidence; proximity is NOT street geometry.
// Never admits roads, businesses, legal access or narrative state.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {validateHarborSection04Study} from './meridian_harbor_section04_ledger.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const refs={
  sections:['MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json',
    'a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b'],
  city:['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json',
    '2e8c5ff412436a6e7d526bc0172adfca77107263'],
  inland:['SOURCE_PR69_LAND_03_20261120.json',
    '2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
  prebuilt:['MERIDIAN_BAY_PREBUILT_DESIGN.json',
    '014586f9c2996501f3bf16b9bfb8aebaf44fd462']
};
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const data={};
for(const [key,[path,hash]] of Object.entries(refs)){
  const bytes=readFileSync(new URL(path,root));
  const actual=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
    .update(bytes).digest('hex');
  assert(actual===hash,'Historical M1/P1 source blob changed: '+key);
  data[key]=JSON.parse(bytes.toString('utf8'));
}
const review=JSON.parse(readFileSync(new URL(
  'MERIDIAN_BAY_M1_P1_ACCESS_EVIDENCE_20261122.json',root),'utf8'));
const copy=x=>structuredClone(x);
const round6=n=>Math.round(n*1e6)/1e6;
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const equal=(a,b)=>a?.x===b?.x&&a?.y===b?.y;
const EPS=1e-9;

export function closestPointToSection(p,a,b){
  assert(valid(p)&&valid(a)&&valid(b),'Three finite 2D points required');
  const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
  assert(len2>EPS*EPS,'Cannot project onto a zero-length segment');
  const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2));
  const q={x:a.x+t*dx,y:a.y+t*dy};
  return {distanceCanvasUnits:round6(Math.hypot(p.x-q.x,p.y-q.y)),
    t:round6(t),closest:{x:round6(q.x),y:round6(q.y)}};
}
const onSegment=(p,a,b)=>{
  const orient=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  return Math.abs(orient)<=EPS&&
    p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&
    p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
};
const expected={
  'MB-04-M1':{
    route:'market',knownPlaceIds:[
      'LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT',
      'LOC-MARKET-BUSINESS-OFFICES'],
    sourceSketchEndpointIds:[],landUseBoundaryIds:[],
    nextQuestion:'verify_commercial_frontage_public_exit_and_cafe_boundary'
  },
  'MB-04-P1':{
    route:'plaza',knownPlaceIds:[
      'LOC-CROSSWATER-PLAZA','LOC-TRANSIT-TERMINAL'],
    sourceSketchEndpointIds:['MX-A-MARKET-PLAZA','MX-A-PLAZA-TERM'],
    landUseBoundaryIds:['MX-Z-TRANSIT'],
    nextQuestion:'verify_plaza_to_public_sidewalk_transition_outside_terminal'
  }
};
const protectedSections=Object.keys(expected);

export function deriveM1P1AccessEvidence({state}={}){
  validateHarborSection04Study({state});
  assert(data.city.authority&&Array.isArray(data.city.locations)&&
    data.city.planning_envelope.georeferenced===false,
    'Unverified city reference or mapping authority');
  assert(data.prebuilt.editorial_status==='review_design_not_automatically_admitted_to_saved_world'&&
    data.inland.region_type==='land_only_no_water_or_new_shoreline',
    'Historical design has become a physical access authority');
  const result=[];
  for(const id of protectedSections){
    const section=data.sections.sections.find(s=>s.id===id);
    const spec=expected[id];
    assert(section&&section.route===spec.route&&
      section.canNavigate===false&&section.buildingFootprints===null&&
      section.landUse===null&&section.publicEasement===null,
      'Unadmitted Section04 line unexpectedly changed');
    const anchors=[];
    for(const place of data.city.locations){
      const point=place.reference_xy_units,radius=place.placement_uncertainty_units;
      assert(typeof place.id==='string'&&valid(point)&&
        Number.isFinite(radius)&&radius>=0&&place.physical_footprint_defined===false,
        'City anchor is not an uncertain reference');
      const q=closestPointToSection(point,section.from,section.to);
      if(q.distanceCanvasUnits>radius+EPS)continue;
      const saved=state.world.locations[place.id];
      assert(saved,'A source city place is not in the saved world: '+place.id);
      const entry=data.prebuilt.places.find(p=>p.id===place.id);
      if(entry)assert(entry.access_status===saved.access_status&&
        entry.public_area===saved.public_area,
        'Prebuilt place access metadata diverged from saved graph');
      anchors.push({
        id:place.id,
        cityReference:copy(point),
        placementUncertaintyCanvasUnits:radius,
        nearestLineDistanceCanvasUnits:q.distanceCanvasUnits,
        lineProjection:q.closest,
        projectionT:q.t,
        cityAnchorKind:place.kind,
        locationPublicArea:saved.public_area===true,
        locationAccessStatus:saved.access_status??null,
        footprintDefined:false,
        evidence:'reference_uncertainty_disk_intersects_proposed_line',
        evidenceDoesNotEstablish:'doorway_sidewalk_crossing_easement_or_passable_route'
      });
    }
    anchors.sort((a,b)=>a.id.localeCompare(b.id,'en'));
    assert(isDeepStrictEqual(anchors.map(a=>a.id),spec.knownPlaceIds),
      'M1/P1 place candidate set changed; new source review required');
    const sketchEndpoints=[];
    for(const sketch of data.inland.street_alignments.filter(
      x=>x.mode==='existing_topology_sketch')){
      const matching=sketch.points
        .map((p,index)=>equal(section.from,p)?index:null).filter(x=>x!==null);
      if(matching.length)sketchEndpoints.push({
        id:sketch.id,pointIndex:matching[0],
        coordinate:copy(section.from),
        evidence:'same_illustrative_source_endpoint_not_a_new_street',
        usableStreetConfirmed:false
      });
    }
    sketchEndpoints.sort((a,b)=>a.id.localeCompare(b.id,'en'));
    assert(isDeepStrictEqual(sketchEndpoints.map(x=>x.id),
      spec.sourceSketchEndpointIds),
      'Historical street endpoints differ; investigate schematic continuity');
    const landUseBoundaryIds=data.inland.land_use_patches
      .filter(zone=>zone.polygon.some((a,i)=>onSegment(
        section.from,a,zone.polygon[(i+1)%zone.polygon.length])))
      .map(x=>x.id).sort();
    assert(isDeepStrictEqual(landUseBoundaryIds,spec.landUseBoundaryIds),
      'A candidate zoning boundary changed at the section start');
    result.push({
      sectionId:id,sectionType:spec.route,
      start:copy(section.from),end:copy(section.to),
      existingLocationReferenceCandidates:anchors,
      historicInlandStreetEndpointCoincidences:sketchEndpoints,
      startsOnDraftLandUseBoundaries:landUseBoundaryIds,
      schematicBoundaryY42:section.from.y===42,
      noPositiveLand03PhysicalCoverage:true,
      adjacentPublicSidewalkKnown:false,
      parcelOwnershipVerified:false,
      doorwayConnectionToRouteVerified:false,
      trafficOrGradeVerified:false,
      physicalAccessApproved:false,
      nextResearchQuestion:spec.nextQuestion
    });
  }
  assert(result[0].existingLocationReferenceCandidates.length===3&&
    result[1].existingLocationReferenceCandidates.length===2,
    'Unknown reference anchor classifications require review');
  return copy({
    schema_version:1,
    id:'MB-SECTION04-M1-P1-ACCESS-EVIDENCE-20261122',
    status:'source_only_access_evidence_no_physical_map_or_traversal',
    sources:Object.fromEntries(Object.entries(refs).map(
      ([key,[,sha]])=>[key,sha])),
    sectionEntries:result,
    sourceWarnings:[
      'location_public_area_is_not_route_access',
      'prebuilt_public_confirmed_is_only_the_place_not_new_street',
      'uncertainty_disk_overlap_is_not_a_building_or_doorway',
      'coincident_topology_sketch_endpoint_is_not_a_surveyed_junction',
      'land_use_boundary_is_unapproved_draft',
      'no_claim_about_unmapped_segment_land_use_or_obstacles'
    ],
    existingGraphModified:false,newPublicRoads:[],
    siteBuildingsProposed:[],travelMinutes:null,
    actualDistancesKm:null,playerMoved:false,npcMoved:false,
    fictionalTimeAdvanced:false,readyForPhysicalApproval:false
  });
}
export function validateM1P1AccessEvidence({state,candidate=review}={}){
  assert(isDeepStrictEqual(deriveM1P1AccessEvidence({state}),candidate),
    'M1/P1 evidence was altered or illicit public access asserted');
  return true;
}
export function inspectM1P1AccessEvidence({state}={}){
  validateM1P1AccessEvidence({state});
  return copy(review);
}
