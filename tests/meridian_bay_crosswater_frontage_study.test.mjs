import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sketchRibbon,pointOnDraftSegment,inspectCrosswaterFrontageStudy}
 from '../tools/meridian_bay_crosswater_frontage_study.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
const source=n=>'../docs/01_world/'+n+'.json';
const state=()=>json('../game/STATE.json');
const manifest=()=>json(source('MERIDIAN_BAY_CROSSWATER_FRONTAGE_STREET_STUDY_20261122'));
const inspect=()=>inspectCrosswaterFrontageStudy({state:state()});
const near=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,String(a)+' != '+String(b));
const area=poly=>Math.abs(poly.reduce((s,p,i)=>{
 const q=poly[(i+1)%poly.length];
 return s+(p.x*q.y-q.x*p.y);
},0))/2;

test('parent PR140 study manifest and source city/land/coast Git blobs are immutable',()=>{
 const checks=[
  ['MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122','b411fe76cef5c87237805725feb2b425acefc785'],
  ['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112','2e8c5ff412436a6e7d526bc0172adfca77107263'],
  ['SOURCE_PR69_LAND_03_20261120','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
  ['SOURCE_PR67_COAST_01_20261120','7cb79b2113bfef7b7fbbc39539c17fd80a275cd7']
 ];
 for(const [name,expected]of checks)assert.equal(sha(raw(source(name))),expected);
});

test('new review manifest distinguishes source anchors, derived geometry and new original proposals',()=>{
 const m=manifest();
 assert.equal(m.authority,'new_original_design_hypothesis_not_saved_canon');
 assert.equal(m.status,'review_only_non_playable');
 assert.equal(m.diagram_parameters.review_pedestrian_half_width_canvas,0.12);
 assert.equal(m.diagram_parameters.frontage_investigation_outer_offset_canvas,0.45);
 assert.equal(m.diagram_parameters.physical_width_meters,null);
 assert.equal(m.diagram_parameters.length_to_meters_conversion,null);
 assert.ok(Object.values(m.invariants).every(x=>x===true));
 assert.equal(m.approval.story_integration,false);
});

test('common centerline remains the historical undetailed Plaza approach',()=>{
 const x=inspect();
 assert.deepEqual(x.sharedCenterline,[{x:65,y:42},{x:66.9,y:40.6}]);
 assert.deepEqual(x.variantStudyBands.map(k=>k.id),['PR106_A','PR103_SIBLING']);
 assert.deepEqual(x.variantStudyBands.map(k=>k.centerline[1]),
  [{x:68,y:39.94814814814815},{x:68,y:38.635714285714286}]);
});

test('shared hypothetical pedestrian ribbon has symmetric 0.12 canvas-unit sides',()=>{
 const x=inspect(),r=x.sharedReviewPedestrianRibbon;
 assert.equal(r.length,4);
 near(area(r),2.360084744241193*0.24,1e-4);
 const a=x.sharedCenterline[0],b=x.sharedCenterline[1];
 const normal={x:-(b.y-a.y)/2.360084744241193,
  y:(b.x-a.x)/2.360084744241193};
 near((r[0].x-a.x)*normal.x+(r[0].y-a.y)*normal.y,0.12);
 near((r[3].x-a.x)*normal.x+(r[3].y-a.y)*normal.y,-0.12);
 assert.equal(x.physicalWidthMeters,null);
});

test('frontage study regions are two distinct non-parcel ribbons outside the centerline band',()=>{
 const x=inspect(),f=x.leftRightFrontageResearch;
 assert.deepEqual(f.map(z=>z.id),['CW-FRONT-LEFT','CW-FRONT-RIGHT']);
 for(const side of f){
  assert.equal(side.sourceClass,'new_proposal');
  assert.equal(side.propertyOwnerKnown,false);
  assert.equal(side.buildingLineKnown,false);
  near(area(side.polygon),2.360084744241193*0.33,1e-4);
 }
 assert.deepEqual(x.confirmedParcels,[]);
});

test('new original geometry is never said to represent measured sidewalk clearance',()=>{
 const x=inspect();
 assert.ok(x.candidateSketchBuildingMinGapSharedCanvas>0.12);
 for(const option of x.variantStudyBands){
  assert.equal(option.reviewBand.length,4);
  assert.ok(area(option.reviewBand)>0.25);
  assert.equal(option.possibleBuildingOverlapInReviewedDraft,false);
  assert.equal(option.physicalClearanceKnown,false);
  assert.equal(option.legalPublicAccessVerified,false);
  assert.equal(option.selected,false);
 }
 assert.equal(x.realTravelMinutes,null);
});

test('plaza crossing study marker is only a source anchor, not an installed crossing',()=>{
 const x=inspect(),p=x.crossingReviewStations[0];
 assert.deepEqual(p.xy,{x:65,y:42});
 assert.equal(p.evidenceClass,'anchor');
 assert.equal(p.crossingExisting,false);
 assert.equal(p.placementProposalOnly,true);
});

test('terminal-related station is a projection of a rough location reference, not its entrance',()=>{
 const x=inspect(),p=x.crossingReviewStations[1];
 assert.equal(p.id,'CW-X-TERMINAL-REVIEW');
 near(p.xy.x,65.648115);
 near(p.xy.y,41.522442);
 near(p.lineFraction,0.341113);
 near(p.perpendicularGapCanvas,0.593199);
 assert.equal(p.evidenceClass,'derived');
 assert.equal(p.crossingExisting,false);
 assert.equal(p.placementProposalOnly,true);
});

test('projection clamps beyond segment endpoints and handles reference on the line',()=>{
 const a={x:0,y:0},b={x:2,y:0};
 assert.deepEqual(pointOnDraftSegment({x:3,y:1},a,b).point,{x:2,y:0});
 assert.deepEqual(pointOnDraftSegment({x:-1,y:1},a,b).point,{x:0,y:0});
 near(pointOnDraftSegment({x:1,y:0},a,b).distanceCanvas,0);
});

test('schematic ribbon geometry rejects zero-length route and invalid offsets or side',()=>{
 const a={x:0,y:0},b={x:0,y:0};
 assert.throws(()=>sketchRibbon(a,b,0.12,0.45,'left'),/Nonzero finite/);
 assert.throws(()=>sketchRibbon({x:0,y:0},{x:1,y:0},0.5,0.1,'left'),/Positive bounded/);
 assert.throws(()=>sketchRibbon({x:0,y:0},{x:1,y:0},0.12,0.45,'forward'),/Positive bounded/);
 assert.throws(()=>pointOnDraftSegment({x:0,y:0},a,b),/Nonzero finite/);
});

test('tampered proposal cannot turn graphical width into real meters',()=>{
 const m=manifest();
 m.diagram_parameters.physical_width_meters=1.5;
 assert.throws(()=>inspectCrosswaterFrontageStudy({state:state(),proposal:m}),
  /Proposed widths/);
});

test('tampered proposed crosswalk flag is rejected as unsupported physical authority',()=>{
 const m=manifest();
 m.crossing_review_stations[1].crosswalk_verified=true;
 assert.throws(()=>inspectCrosswaterFrontageStudy({state:state(),proposal:m}),
  /Crossing review markers/);
});

test('tampered parcel IDs or surveyed geometry must fail closed',()=>{
 const m=manifest();m.frontage_study_sides[0].identified_parcels=['LOT-FAKE'];
 assert.throws(()=>inspectCrosswaterFrontageStudy({state:state(),proposal:m}),
  /Hypothetical frontage/);
 const n=manifest();n.survey_ledger[0].physical_geometry=[{x:65,y:42}];
 assert.throws(()=>inspectCrosswaterFrontageStudy({state:state(),proposal:n}),
  /Missing source evidence/);
});

test('removed canonical Harbor place graph connection is not fabricated by the study',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=[];
 assert.throws(()=>inspectCrosswaterFrontageStudy({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('inspection is cloned, read-only, and does not edit save, sources, time or NPCs',()=>{
 const paths=[
  source('MERIDIAN_BAY_CROSSWATER_FRONTAGE_STREET_STUDY_20261122'),
  source('MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122'),
  '../game/STATE.json','../game/SAVE_MANIFEST.json'
 ];
 const before=paths.map(x=>sha(raw(x))),s=state(),saved=JSON.stringify(s);
 const a=inspectCrosswaterFrontageStudy({state:s});
 a.crossingReviewStations[0].xy.x=999;
 a.leftRightFrontageResearch[0].polygon[0].x=999;
 const again=inspectCrosswaterFrontageStudy({state:s});
 assert.equal(again.crossingReviewStations[0].xy.x,65);
 assert.notEqual(again.leftRightFrontageResearch[0].polygon[0].x,999);
 assert.deepEqual(paths.map(x=>sha(raw(x))),before);
 assert.equal(JSON.stringify(s),saved);
 assert.equal(a.chosenRoute,null);
 assert.deepEqual(a.newSavedWorldLinks,[]);
 assert.deepEqual(a.confirmedCrosswalks,[]);
 assert.equal(a.geometryAdmitted,false);
 assert.equal(a.playerMoved,false);
 assert.equal(a.npcMoved,false);
 assert.equal(a.fictionalTimeAdvanced,false);
 assert.equal(a.editorialReviewRequired,true);
 assert.equal(s.pending.type,'await_player_action');
});
