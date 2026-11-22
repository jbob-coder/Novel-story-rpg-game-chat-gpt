// Source-derived section register for an UNMAPPED urban connector, NOT a street plan.
// No new LOC identifiers, buildings, world links, navigation, time or player knowledge.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual as same} from 'node:util';
import {
  validateHarborRegionalCoverage,measurePhysicalDraftCoverage
} from './meridian_bay_harbor_region_coverage.mjs';

const root=new URL('../docs/01_world/',import.meta.url);
const source={
  routes:['MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json',
   'aae66aae315603e37e8cb88034600446bf46d21d'],
  coast01:['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',
   '139c3687c98285aff886d28422544d082768217d'],
  coast02:['SOURCE_PR67_COAST_02_20261120.json',
   '325a0acde67a1ce3b44576860824657a3db41695'],
  land03:['SOURCE_PR69_LAND_03_20261120.json',
   '2a95eb9e50f69436cb65711daf8ff586f4ef4279']
};
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
const clone=value=>structuredClone(value);
const round6=n=>Math.round(n*1e6)/1e6;
const xy=p=>({x:round6(p.x),y:round6(p.y)});
const refs={};
for(const [key,[file,expected]] of Object.entries(source)){
  const bytes=readFileSync(new URL(file,root));
  const sha=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0'))
    .update(bytes).digest('hex');
  check(sha===expected,'Fixed section source changed: '+key);
  refs[key]=JSON.parse(bytes.toString('utf8'));
}
const frozen=JSON.parse(readFileSync(new URL(
 'MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json',root),'utf8'));
const expectedIds={
 market:['MB-04-M1','MB-04-M2','MB-04-M3'],
 plaza:['MB-04-P1','MB-04-P2']
};
const specs=[
 {key:'market',property:'market_to_harbor',start:'LOC-COMMERCIAL-DISTRICT',
  uncharted:10.669621,total:15.303534,sourceRoute:44},
 {key:'plaza',property:'plaza_to_harbor',start:'LOC-CROSSWATER-PLAZA',
  uncharted:4.611400,total:8.280615,sourceRoute:56}
];

export function deriveHarborSection04Study({state}={}){
  validateHarborRegionalCoverage({state});
  const segments=[],routes=[];
  for(const spec of specs){
    const nodes=refs.routes[spec.property].nodes;
    const coverage=measurePhysicalDraftCoverage(nodes.map(n=>n.xy));
    check(Math.abs(coverage.hypotheticalLengthUnits-spec.total)<0.000002&&
      Math.abs(coverage.outsideKnownStudyBoxesUnits-spec.uncharted)<0.000002,
      'Section 04 source lengths changed; rerun the regional audit');
    const missing=coverage.sections.filter(s=>s.regionIds.length===0);
    check(missing.length===expectedIds[spec.key].length&&
      missing.every((s,i)=>s.segmentIndex===i),
      'Unexpected unstudied section layout: '+spec.key);
    const names=[];
    for(const [i,s] of missing.entries()){
      const id=expectedIds[spec.key][i],from=xy(s.from),to=xy(s.to);
      check(from.x>=58&&to.x<=68&&from.y<=42&&to.y>=36.9,
        'Study portion escapes source-defined exploration extent');
      const first=nodes[s.segmentIndex],second=nodes[s.segmentIndex+1];
      check(first&&second,'Original source segment lost');
      segments.push({
        id,route:spec.key,sourcePr103Property:spec.property,
        sourceSegmentIndex:s.segmentIndex,
        sourceWaypointIds:[first.id,second.id],
        from,to,hypotheticalLengthUnits:s.hypotheticalLengthUnits,
        status:'line_from_unapproved_source_only_missing_physical_region_study',
        buildingFootprints:null,landUse:null,publicEasement:null,
        measuredWidth:null,canNavigate:false
      });
      names.push(id);
    }
    routes.push({
      key:spec.key,fromLocationId:spec.start,toLocationId:'LOC-HARBOR-WALK',
      originalRouteSourcePr:spec.sourceRoute,
      sectionIds:names,missingStudyLengthCanvasUnits:spec.uncharted,
      totalCandidateLengthCanvasUnits:spec.total,
      playable:false
    });
  }
  const [m0,m1,m2,p0,p1]=segments;
  const exact=(p,a,b)=>p.x===a&&p.y===b;
  check(
    exact(m0.from,58.869565,42)&&exact(m0.to,60,40.7)&&
    exact(m1.from,60,40.7)&&exact(m1.to,64,38.1)&&
    exact(m2.from,64,38.1)&&exact(m2.to,68,36.9)&&
    exact(p0.from,65,42)&&exact(p0.to,66.9,40.6)&&
    exact(p1.from,66.9,40.6)&&exact(p1.to,68,38.635714),
    'Section 04 boundary seams no longer match the source audit');
  check(state.world.locations[m0.route==='market'
     ?'LOC-COMMERCIAL-DISTRICT':'LOC-INVALID']?.connected_ids?.includes(
      'LOC-HARBOR-WALK')&&
    state.world.locations['LOC-CROSSWATER-PLAZA']?.connected_ids?.includes(
      'LOC-HARBOR-WALK'),
    'Saved graph is not an authority for the two existing broad connections');
  return clone({
    schema_version:1,id:'MB-URBAN-CONNECTOR-SECTION04-STUDY-20261122',
    status:'source_derived_section_ledger_not_a_physical_fragment',
    baseReviewPr:112,
    sourceGitBlobs:Object.fromEntries(Object.entries(source).map(
      ([key,[,sha]])=>[key,sha])),
    explorationWindow:{
      x_min:58,x_max:68,y_min:36.9,y_max:42,
      classification:'source_endpoint_bounding_window_not_zoning_or_survey'
    },
    routes,sections:segments,
    summary:{
      distinctUnstudiedSections:5,
      notYetStudiedMarketCanvasUnits:10.669621,
      notYetStudiedPlazaCanvasUnits:4.611400,
      land03Exit:xy(m0.from),
      plazaStart:xy(p0.from),
      coast01Entries:[xy(m2.to),xy(p1.to)],
      coast02RouteLengthCovered:0,
      sharedPhysicalStreetSelected:false
    },
    evidenceBoundary:{
      noBuildingsDrawn:true,noCadastralClaims:true,noPublicRightOfWayAssumed:true,
      noNewSavedGraphEdges:true,noStreetAuthorized:true,
      noSurveysCompleted:true,noFictionalTimeAdvanced:true
    },
    proposedNextReview:[
      'study_unknown_parcels_and_legal_access_with_sources',
      'verify_market_section_boundary_from_land03',
      'verify_plaza_start_and_coast01_entries_without_invented_links',
      'review_urban_footprints_without_treating_blank_area_as_empty',
      'reconcile_parallel_PR110_and_PR112_before_any_merges'
    ],
    canonicalWorldChanged:false,playerMoved:false,npcMoved:false,
    routePassabilityVerified:false,storyTurnAdvanced:false
  });
}
export function validateHarborSection04Study({state,study=frozen}={}){
  const expected=deriveHarborSection04Study({state});
  check(same(study,expected),
    'Section 04 register diverges from source geometry or proposes forbidden authority');
  return true;
}
export function inspectHarborSection04Study({state}={}){
  validateHarborSection04Study({state});
  return clone(frozen);
}
