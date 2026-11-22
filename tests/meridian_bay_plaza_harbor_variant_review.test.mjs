import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectBuildingZone,buildPlazaHarborReviewVariants,
 inspectPlazaHarborVariantOptions}
 from '../tools/meridian_bay_plaza_harbor_variant_review.mjs';
import {screenDraftRoute} from '../tools/meridian_bay_harbor_route_comparison.mjs';
const raw=p=>readFileSync(new URL(p,import.meta.url));
const load=p=>JSON.parse(raw(p));
const sha=x=>createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const source='../docs/01_world/';
const state=()=>load('../game/STATE.json');
const inspect=()=>inspectPlazaHarborVariantOptions({state:state()});

test('historical PR56 and PR67 files retain original Git blob identities',()=>{
 assert.equal(sha(raw(source+'SOURCE_PR56_PLAZA_HARBOR_20261120.json')),
  'a5ac772922b4717797118b15f182207be1d1a7fb');
 assert.equal(sha(raw(source+'SOURCE_PR67_COAST_01_20261120.json')),
  '7cb79b2113bfef7b7fbbc39539c17fd80a275cd7');
});

test('review-only manifest enumerates exactly two noncanonical reversible patches',()=>{
 const spec=load(source+'MERIDIAN_BAY_PLAZA_HARBOR_VARIANT_OPTIONS_20261122.json');
 assert.equal(spec.status,'hypothetical_options_only_not_approved_or_admitted');
 assert.deepEqual(spec.options.map(x=>x.id),
  ['ROUTE_N2_EAST_GAP','BUILDING_B01_SOUTH']);
 assert.ok(Object.values(spec.constraints).every(x=>x===true));
});

test('source PR56 corridor is not changed and baseline still has two building conflicts',()=>{
 const v=buildPlazaHarborReviewVariants();
 assert.equal(screenDraftRoute(v.historicalRoute,v.historicalCoast).findings.length,2);
 assert.deepEqual(v.historicalRoute.nodes.map(x=>x.xy),[
  {x:65,y:42},{x:66.9,y:40.6},{x:68.9,y:39.15},
  {x:70.1,y:37.85},{x:71,y:37}]);
});

test('route variant moves only N2, keeps old building and existing Harbor tail',()=>{
 const v=buildPlazaHarborReviewVariants();
 const c=v.routeAlternative;
 assert.deepEqual(c.nodes[2].xy,{x:69.6,y:39});
 assert.equal(c.nodes.length,5);
 assert.deepEqual(c.nodes.slice(3),v.historicalRoute.nodes.slice(3));
 assert.deepEqual(v.historicalCoast.building_footprints,
  load(source+'SOURCE_PR67_COAST_01_20261120.json').building_footprints);
 assert.deepEqual(screenDraftRoute(c,v.historicalCoast).findings,[]);
});

test('route variant is 1.95% longer in unmeasured illustration units, not km',()=>{
 const option=inspect().options[0];
 assert.equal(option.draftCanvasLength,7.990491);
 assert.equal(option.additionalDraftCanvasUnits,0.15296);
 assert.equal(option.relativeDraftLengthIncreasePct,1.951637);
 assert.equal(option.preservedHarborTail,true);
 assert.equal(option.physicalWidthVerified,false);
});

test('building variant moves all four vertices equally and preserves exact route points',()=>{
 const v=buildPlazaHarborReviewVariants();
 const old=v.historicalCoast.building_footprints.find(x=>x.id==='HC-B-01').polygon;
 const changed=v.footprintAlternative.building_footprints.find(x=>x.id==='HC-B-01').polygon;
 assert.deepEqual(changed,old.map(x=>({x:x.x,y:Math.round((x.y-.55)*1e6)/1e6})));
 assert.deepEqual(v.historicalRoute.nodes,
  load(source+'SOURCE_PR56_PLAZA_HARBOR_20261120.json').nodes);
 assert.deepEqual(screenDraftRoute(v.historicalRoute,v.footprintAlternative).findings,[]);
});

test('building-shift option clears route but creates two zoning boundary crossings',()=>{
 const audit=inspect();
 assert.deepEqual(audit.options[1].outsideOriginalZoneVertexIndices,[0,1]);
 assert.equal(audit.options[1].zoneStrictBoundaryCrossings.length,2);
 assert.equal(audit.options[1].leavesCandidateZoningBoundary,true);
 assert.equal(audit.options[0].zoningBoundaryIssueCreated,false);
});

test('independent polygon checker detects interior, boundary, and exterior',()=>{
 const zone={polygon:[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}]};
 const inside={polygon:[{x:.5,y:.5},{x:1.5,y:.5},{x:1.5,y:1.5},{x:.5,y:1.5}]};
 const outside={polygon:[{x:1.5,y:1.5},{x:2.5,y:1.5},{x:2.5,y:2.5},{x:1.5,y:2.5}]};
 assert.equal(inspectBuildingZone(inside,zone).whollyWithinCandidateZone,true);
 assert.equal(inspectBuildingZone(outside,zone).whollyWithinCandidateZone,false);
 assert.equal(inspectBuildingZone(outside,zone).outsideVertexIndices.length,3);
 assert.throws(()=>inspectBuildingZone({},zone),/Draft footprint/);
});

test('review is read-only and cannot mutate plan, loaded save, or source files',()=>{
 const sourcePaths=['SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  'SOURCE_PR67_COAST_01_20261120.json'];
 const before=sourcePaths.map(p=>sha(raw(source+p)));
 const s=state(),stateBefore=JSON.stringify(s);
 const v=inspectPlazaHarborVariantOptions({state:s});
 v.options[0].candidateXY.x=999;
 assert.equal(inspectPlazaHarborVariantOptions({state:s}).options[0].candidateXY.x,69.6);
 assert.deepEqual(sourcePaths.map(p=>sha(raw(source+p))),before);
 assert.equal(JSON.stringify(s),stateBefore);
});

test('forged world graph link fails closed before any variant becomes visible',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=[];
 assert.throws(()=>inspectPlazaHarborVariantOptions({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('neither variant authorizes movement, world admission, distances, or route selection',()=>{
 const result=inspect();
 assert.equal(result.selectedCanonicalPhysicalRoute,null);
 assert.deepEqual(result.newSavedGraphEdges,[]);
 assert.equal(result.worldGeometryAdmitted,false);
 assert.equal(result.playerMoved,false);
 assert.equal(result.npcMoved,false);
 assert.equal(result.fictionalTimeAdvanced,false);
 assert.equal(result.realDistanceKm,null);
 assert.equal(result.travelMinutes,null);
 assert.equal(result.requiresEditorialReview,true);
 assert.equal(result.lowerCollateralChangeIsNotApproval,true);
 assert.equal(state().pending.type,'await_player_action');
});
