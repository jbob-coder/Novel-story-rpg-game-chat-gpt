import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 clipSegmentToStudyBox,measurePhysicalDraftCoverage,inspectStudiedRegionContacts,
 validateHarborRegionalCoverage,inspectHarborRegionalCoverage,
 renderHarborRegionalCoverageSvg,verifyHarborRegionalCoverageSvg
} from '../tools/meridian_bay_harbor_region_coverage.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const state=()=>json('../game/STATE.json');
const proposal=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json');
const land=()=>json('../docs/01_world/SOURCE_PR69_LAND_03_20261120.json');
const coast=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json');
const svg=()=>raw('../docs/01_world/MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_20261122.svg').toString('utf8');
const blob=bytes=>{const b=Buffer.from(bytes);return createHash('sha1')
 .update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');};
const near=(a,b,eps=0.000002)=>assert.ok(Math.abs(a-b)<eps,`Expected ${a} near ${b}`);
const syntheticBox=(x_min,x_max,y_min,y_max)=>({x_min,x_max,y_min,y_max});
const syntheticRegion=(box,other={})=>[{id:'TEST',status:'unadmitted',
 data:{study_box:box,building_footprints:[],street_alignments:[],...other}}];
const route=id=>proposal()[id].nodes.map(x=>x.xy);

test('all four original source JSON blobs are unchanged and pinned',()=>{
 const files=[
 ['MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json',
  'aae66aae315603e37e8cb88034600446bf46d21d'],
 ['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json',
  '139c3687c98285aff886d28422544d082768217d'],
 ['SOURCE_PR67_COAST_02_20261120.json',
  '325a0acde67a1ce3b44576860824657a3db41695'],
 ['SOURCE_PR69_LAND_03_20261120.json',
  '2a95eb9e50f69436cb65711daf8ff586f4ef4279']
 ];
 for(const [name,expected] of files)assert.equal(
  blob(raw('../docs/01_world/'+name)),expected,name);
 assert.equal(validateHarborRegionalCoverage({state:state()}),true);
});

test('Market route has 69.72% uncovered length and only a short Land03 beginning',()=>{
 const r=measurePhysicalDraftCoverage(route('market_to_harbor'));
 near(r.hypotheticalLengthUnits,15.303534);
 near(r.coveredByAtLeastOneStudyBoxUnits,4.633912);
 near(r.outsideKnownStudyBoxesUnits,10.669621);
 near(r.outsideKnownStudyBoxesFraction,0.6972);
 near(r.studiedRegionUnits['LAND-03'],1.325196);
 near(r.studiedRegionUnits['COAST-01'],3.308717);
 assert.equal(r.studiedRegionUnits['COAST-02'],0);
 assert.equal(r.allRouteGeometryStudied,false);
 assert.equal(r.passabilityCertified,false);
});

test('Plaza route has 55.69% uncovered length and no positive-length Land03 portion',()=>{
 const r=measurePhysicalDraftCoverage(route('plaza_to_harbor'));
 near(r.hypotheticalLengthUnits,8.280615);
 near(r.coveredByAtLeastOneStudyBoxUnits,3.669215);
 near(r.outsideKnownStudyBoxesUnits,4.6114);
 near(r.outsideKnownStudyBoxesFraction,0.556891);
 assert.equal(r.studiedRegionUnits['LAND-03'],0);
 assert.equal(r.studiedRegionUnits['COAST-02'],0);
 near(r.studiedRegionUnits['COAST-01'],3.669215);
});

test('Market Land03 covered piece stops at y42 then sections 1 and 2 are entirely uncharted',()=>{
 const r=measurePhysicalDraftCoverage(route('market_to_harbor'));
 const land=r.sections.filter(s=>s.regionIds.includes('LAND-03'));
 assert.equal(land.length,1);
 assert.equal(land[0].segmentIndex,0);
 near(land[0].tEnd,0.434783);
 near(land[0].to.x,58.869565217391305);
 assert.equal(land[0].to.y,42);
 const unknown=r.sections.filter(s=>!s.regionIds.length);
 assert.deepEqual(unknown.map(x=>x.segmentIndex),[0,1,2]);
 near(unknown[0].from.y,42);
 near(unknown.at(-1).to.x,68);
 near(unknown.at(-1).to.y,36.9);
});

test('Plaza route begins at study-box boundary with zero covered length and enters Coast01 later',()=>{
 const r=measurePhysicalDraftCoverage(route('plaza_to_harbor'));
 assert.deepEqual(r.sections.filter(s=>!s.regionIds.length).map(s=>s.segmentIndex),[0,1]);
 const coastEntry=r.sections.find(s=>s.regionIds.includes('COAST-01'));
 assert.equal(coastEntry.segmentIndex,1);
 near(coastEntry.from.x,68);
 near(coastEntry.from.y,38.635714285714286);
 assert.equal(r.sections[0].classification,'no_physical_fragment_coverage');
});

test('Liang–Barsky source box clipping handles segments, tangencies and absent spans',()=>{
 const b=syntheticBox(0,2,0,2);
 assert.deepEqual(clipSegmentToStudyBox({x:-1,y:1},{x:3,y:1},b),[0.25,0.75]);
 assert.deepEqual(clipSegmentToStudyBox({x:1,y:-1},{x:1,y:3},b),[0.25,0.75]);
 assert.deepEqual(clipSegmentToStudyBox({x:0,y:0},{x:2,y:0},b),[0,1]);
 assert.equal(clipSegmentToStudyBox({x:-1,y:-1},{x:0,y:0},b),null);
 assert.equal(clipSegmentToStudyBox({x:3,y:3},{x:4,y:4},b),null);
 assert.equal(clipSegmentToStudyBox({x:1,y:1},{x:1,y:1},b),null);
});

test('the candidate Plaza path touching Land03 only at its start is NOT covered',()=>{
 const box=land().study_box;
 assert.equal(clipSegmentToStudyBox({x:65,y:42},{x:66.9,y:40.6},box),null);
});

test('overlapping study boxes count the union once, not twice',()=>{
 const boxes=[
 ...syntheticRegion(syntheticBox(0,2,0,2)),
 {id:'TEST2',status:'unadmitted',data:{study_box:syntheticBox(1,3,0,2)}}];
 const out=measurePhysicalDraftCoverage([{x:0,y:1},{x:3,y:1}],boxes);
 near(out.hypotheticalLengthUnits,3);
 near(out.coveredByAtLeastOneStudyBoxUnits,3);
 near(out.outsideKnownStudyBoxesUnits,0);
 near(out.studiedRegionUnits['TEST'],2);
 near(out.studiedRegionUnits['TEST2'],2);
 assert.equal(out.allRouteGeometryStudied,true);
 assert.equal(out.passabilityCertified,false);
 const overlaps=out.sections.filter(x=>x.regionIds.length===2);
 assert.equal(overlaps.length,1);
 near(overlaps[0].hypotheticalLengthUnits,1);
});

test('fully outside source region is reported uncharted rather than clear',()=>{
 const out=measurePhysicalDraftCoverage([{x:3,y:3},{x:4,y:4}],
  syntheticRegion(syntheticBox(0,2,0,2)));
 assert.equal(out.studiedRegionUnits.TEST,0);
 assert.equal(out.outsideKnownStudyBoxesFraction,1);
 assert.equal(out.sections[0].classification,'no_physical_fragment_coverage');
 assert.equal(out.allRouteGeometryStudied,false);
});

test('nonfinite, duplicate, missing and degenerate source paths fail closed',()=>{
 const box=syntheticRegion(syntheticBox(0,2,0,2));
 assert.throws(()=>measurePhysicalDraftCoverage([{x:0,y:1}],box),/At least two finite/);
 assert.throws(()=>measurePhysicalDraftCoverage([{x:0,y:1},{x:NaN,y:1}],box),
  /At least two finite/);
 assert.throws(()=>measurePhysicalDraftCoverage([{x:0,y:1},{x:0,y:1}],box),
  /Zero-length segment/);
 assert.throws(()=>measurePhysicalDraftCoverage([{x:0,y:1},{x:1,y:1}],
  [...box,...box]),/Duplicate or invalid/);
 assert.throws(()=>clipSegmentToStudyBox({x:0,y:0},{x:1,y:1},
  syntheticBox(2,1,0,1)),/valid study rectangle/);
});

test('existing historic physical fragments do not intersect approved draft building footprints',()=>{
 const s=state(),a=inspectHarborRegionalCoverage({state:s});
 assert.deepEqual(a.marketContacts.collisions,[]);
 assert.deepEqual(a.plazaContacts.collisions,[]);
 assert.equal(a.marketContacts.noCertificateBeyondStudyBoxes,true);
 assert.equal(a.plazaContacts.noCertificateBeyondStudyBoxes,true);
 assert.deepEqual(a.marketContacts.positivelyCoveredSegmentIndices,[0,3,4]);
 assert.deepEqual(a.plazaContacts.positivelyCoveredSegmentIndices,[1,2,3]);
});

test('a covered synthetic candidate building collision is reported rather than suppressed',()=>{
 const box=syntheticBox(0,2,0,2);
 const regs=syntheticRegion(box,{building_footprints:[{
  id:'B',polygon:[{x:0.7,y:0.7},{x:1.3,y:0.7},
  {x:1.3,y:1.3},{x:0.7,y:1.3}]
 }]});
 const out=inspectStudiedRegionContacts([{x:0,y:1},{x:2,y:1}],regs);
 assert.deepEqual(out.collisions,[{studyRegion:'TEST',segmentIndex:0,
  shapeId:'B',kind:'candidate_building_contact'}]);
});

test('covered synthetic blocked road and shoreline crossings are never treated clear',()=>{
 const regions=syntheticRegion(syntheticBox(0,2,0,2),{
  street_alignments:[{id:'BLOCK',mode:'blocked_historic_trace',
   points:[{x:1,y:0},{x:1,y:2}]}],
  proposed_coast:{shoreline:[{x:1.5,y:0},{x:1.5,y:2}]}
 });
 const out=inspectStudiedRegionContacts([{x:0,y:1},{x:2,y:1}],regions);
 assert.deepEqual(out.collisions.map(x=>x.kind).sort(),[
  'candidate_historical_blocked_trace_contact','draft_shoreline_contact']);
});

test('endpoint and building boundary contact stays unresolved even without strict crossing',()=>{
 const reg=syntheticRegion(syntheticBox(0,2,0,2),{
  building_footprints:[{id:'TOUCH',polygon:[{x:1,y:1},
   {x:1.5,y:1},{x:1.5,y:1.5},{x:1,y:1.5}]}]
 });
 const out=inspectStudiedRegionContacts([{x:0,y:1},{x:1,y:1}],reg);
 assert.equal(out.collisions.length,1);
 assert.equal(out.collisions[0].shapeId,'TOUCH');
});

test('read-only audit rejects invalid saved-state context before interpreting regional drafts',()=>{
 assert.throws(()=>validateHarborRegionalCoverage({}),/Canonical saved world required/);
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(
   id=>id!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateHarborRegionalCoverage({state:s}));
});

test('private diagnostic exposes coverage gaps without new streets, time or player actions',()=>{
 const s=state(),before=JSON.stringify(s),r=inspectHarborRegionalCoverage({state:s});
 assert.equal(r.classification,'narrator_private_regional_spatial_coverage_audit');
 assert.equal(r.verdict,'INCOMPLETE_PHYSICAL_REGION_COVERAGE');
 assert.equal(r.mapStudyNotSurvey,true);
 assert.equal(r.certifiedRoads.length,0);
 assert.deepEqual(r.newCanonicalGraphEdges,[]);
 assert.equal(r.travelMinutes,null);
 assert.equal(r.surveyedDistanceKm,null);
 assert.equal(r.playerMoved,false);
 assert.equal(r.npcMoved,false);
 assert.equal(r.fictionalTimeAdvanced,false);
 r.market.sections[0].from.x=999;
 assert.notEqual(inspectHarborRegionalCoverage({state:s}).market.sections[0].from.x,999);
 assert.equal(JSON.stringify(s),before);
});

test('overview SVG is exactly, repeatedly regenerated from unchanged source JSON',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.equal(verifyHarborRegionalCoverageSvg({state:s}),true);
 assert.equal(svg(),renderHarborRegionalCoverageSvg({state:s}));
 assert.equal(renderHarborRegionalCoverageSvg({state:s}),
  renderHarborRegionalCoverageSvg({state:s}));
 assert.equal(JSON.stringify(s),before);
});

test('coverage SVG shows three boxes and exact 11 colored or dashed source segments',()=>{
 const text=svg(),r=inspectHarborRegionalCoverage({state:state()});
 for(const id of ['LAND-03','COAST-02','COAST-01'])
  assert.ok(text.includes('data-map-id="'+id+'"'));
 const matches=[...text.matchAll(/<polyline data-map-id="([^"]+)" points="([^"]+)"/g)];
 assert.equal(matches.length,r.market.sections.length+r.plaza.sections.length);
 assert.equal(matches.length,11);
 for(const m of matches){
  const key=m[1].startsWith('MARKET-')?'market':'plaza';
  const row=r[key].sections.find(s=>m[1]===
   (key==='market'?'MARKET':'PLAZA')+'-SEG'+s.segmentIndex+'-T'+s.tStart+'-'+s.tEnd);
  assert.ok(row,m[1]);
  const actual=m[2].split(' ').map(v=>v.split(',').map(Number));
  const expected=[row.from,row.to].map(p=>[100+(p.x-58)*42,120+(51-p.y)*42]);
  for(let i=0;i<2;i++)for(let j=0;j<2;j++)
   assert.ok(Math.abs(actual[i][j]-expected[i][j])<=0.0051);
 }
});

test('figure explicitly distinguishes uncharted source coverage from proven physical access',()=>{
 const text=svg();
 assert.ok(text.includes('INCOMPLETA'));
 assert.ok(text.includes('SIN plano físico conocido.'));
 assert.ok(text.includes('No inventar edificios o calles.'));
 assert.ok(text.includes('data-admitted="false"'));
 assert.ok(text.includes('data-story-action="false"'));
 assert.ok(!text.includes('data-admitted="true"'));
});
