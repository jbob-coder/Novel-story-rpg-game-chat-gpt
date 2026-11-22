import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 makeSchematicBand,clipPolygonToStudyBox,polygonsContact,
 deriveMarketM1FrontageEnvelope,validateMarketM1FrontageEnvelope,
 inspectMarketM1FrontageEnvelope
} from '../tools/meridian_market_m1_frontage_envelope.mjs';
const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const saved=()=>json('../game/STATE.json');
const report=()=>json('../docs/01_world/MERIDIAN_BAY_MARKET_M1_FRONTAGE_ENVELOPE_20261122.json');
const source=p=>json('../docs/01_world/'+p);
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const approx=(actual,expected,eps=0.000002)=>assert.ok(
 Math.abs(actual-expected)<eps,actual+' differs from '+expected);

test('M1 frontage JSON is reproduced from pinned sources without save edits',()=>{
 const s=saved(),before=JSON.stringify(s);
 assert.deepEqual(deriveMarketM1FrontageEnvelope({state:s}),report());
 assert.equal(validateMarketM1FrontageEnvelope({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});
test('six original source blobs are exact and remain explicitly noncanonical',()=>{
 const all={
  'MERIDIAN_BAY_M1_P1_INTERFACE_CONCEPTS_20261122.json':
   '593b332e69e4eecdfeaa5217ad7464a230e1bad2',
  'MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json':
   'a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b',
  'SOURCE_PR44_MARKET_HARBOR_20261120.json':
   'e8efe8e5f6a746ab4e628f76a9deb5f71061010d',
  'SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json':
   '904983876226ba82451bf9e3b5d6aed8e7885d6a',
  'SOURCE_PR69_LAND_03_20261120.json':
   '2a95eb9e50f69436cb65711daf8ff586f4ef4279',
  'MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json':
   '2e8c5ff412436a6e7d526bc0172adfca77107263'
 };
 for(const [name,hash] of Object.entries(all))assert.equal(
  sha(raw('../docs/01_world/'+name)),hash,name);
 assert.equal(source('SOURCE_PR44_MARKET_HARBOR_20261120.json').status,
  'detailed_draft_not_story_canon');
 assert.equal(source('SOURCE_PR40_MARKET_CROSS_ACCESS_20261122.json').status,
  'detailed_draft_not_story_canon');
});
test('M1 line remains the exact y42 crop of historic PR44 Market route',()=>{
 const old=source('SOURCE_PR44_MARKET_HARBOR_20261120.json');
 const a=old.nodes[0].xy,b=old.nodes[1].xy,t=(42-a.y)/(b.y-a.y);
 const crop={x:Math.round((a.x+t*(b.x-a.x))*1e6)/1e6,y:42};
 assert.deepEqual(crop,{x:58.869565,y:42});
 const r=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.deepEqual(r.originalSourceSegment,[a,b]);
 assert.deepEqual(r.clippedCenterline,[crop,b]);
 assert.equal(r.sourcePr44FirstLegId,'MB-MH-L1');
 assert.equal(old.route_links[0].passable_verified,false);
});
test('pure offset band has exact reversible perpendicular geometry on a simple axis',()=>{
 const band=makeSchematicBand({x:0,y:0},{x:3,y:0},-1,1);
 assert.deepEqual(band,[
  {x:0,y:-1},{x:3,y:-1},{x:3,y:1},{x:0,y:1}
 ]);
 const reverse=makeSchematicBand({x:3,y:0},{x:0,y:0},-1,1);
 assert.deepEqual(reverse,[
  {x:3,y:1},{x:0,y:1},{x:0,y:-1},{x:3,y:-1}
 ]);
});
test('diagonal band offsets retain the M1 source endpoint geometry',()=>{
 const r=report(),bands=r.ribbonAndInquiryBands;
 assert.equal(bands.length,3);
 assert.deepEqual(bands[0].polygonIllustrativeCanvas,[
  {x:58.779012,y:41.921259},{x:59.909447,y:40.621259},
  {x:60.090553,y:40.778741},{x:58.960118,y:42.078741}
 ]);
 assert.deepEqual(bands[1].polygonIllustrativeCanvas[0],
  bands[0].polygonIllustrativeCanvas[3]);
 assert.deepEqual(bands[2].polygonIllustrativeCanvas[3],
  bands[0].polygonIllustrativeCanvas[0]);
});
test('no caller can supply zero-length or non-finite offset geometry',()=>{
 assert.throws(()=>makeSchematicBand({x:0,y:0},{x:0,y:0},-1,1),/zero-length/);
 assert.throws(()=>makeSchematicBand({x:0,y:0},{x:1,y:0},2,1),
  /ordered lateral/);
 assert.throws(()=>makeSchematicBand({x:0,y:0},{x:1,y:0},NaN,1),
  /ordered lateral/);
 assert.throws(()=>makeSchematicBand({x:0,y:0},{x:Infinity,y:1},0,1),
  /ordered lateral/);
});
test('rectangular clipping works for partially covered and wholly exterior bands',()=>{
 const r=clipPolygonToStudyBox(
  [{x:0,y:0},{x:3,y:0},{x:3,y:2},{x:0,y:2}],
  {x_min:1,x_max:2,y_min:0.5,y_max:1.5}
 );
 assert.equal(r.length,4);
 for(const p of r){
  assert.ok(p.x>=1&&p.x<=2&&p.y>=0.5&&p.y<=1.5);
 }
 const empty=clipPolygonToStudyBox(
  [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}],
  {x_min:2,x_max:4,y_min:0,y_max:2}
 );
 assert.deepEqual(empty,[]);
});
test('invalid study rectangles and non-finite polygon vertices fail closed',()=>{
 const s=[{x:0,y:0},{x:1,y:0},{x:1,y:1}];
 assert.throws(()=>clipPolygonToStudyBox(s,{x_min:1,x_max:1,y_min:0,y_max:2}),
  /Invalid/);
 assert.throws(()=>clipPolygonToStudyBox(
  [{x:NaN,y:0},{x:1,y:0},{x:1,y:1}],
  {x_min:0,x_max:1,y_min:0,y_max:1}),/Invalid/);
});
test('polygon intersection flags crossing, edge touches and full containment',()=>{
 const p=[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}];
 const crossing=[{x:1,y:-1},{x:3,y:-1},{x:3,y:1},{x:1,y:1}];
 const touch=[{x:2,y:0},{x:3,y:0},{x:3,y:1},{x:2,y:1}];
 const inside=[{x:.2,y:.2},{x:.8,y:.2},{x:.8,y:.8},{x:.2,y:.8}];
 const clear=[{x:3,y:3},{x:4,y:3},{x:4,y:4},{x:3,y:4}];
 for(const b of [crossing,touch,inside])assert.equal(polygonsContact(p,b),true);
 assert.equal(polygonsContact(p,clear),false);
 assert.equal(polygonsContact(clear,p),false);
});
test('degenerate polygon contact input is rejected',()=>{
 const q=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
 assert.throws(()=>polygonsContact(q,[{x:0,y:0}]),/valid polygons/);
 assert.throws(()=>polygonsContact([{x:NaN,y:0},{x:2,y:0},{x:1,y:2}],q),
  /valid polygons/);
});
test('thin ribbon straddles y42 Land03 seam despite centerline only touching it',()=>{
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.equal(v.centerlineTouchesLand03AtStartOnly,true);
 assert.equal(v.ribbonHasPositiveGraphicAreaAcrossStudyBoundary,true);
 const areas=v.ribbonAndInquiryBands.map(x=>x.graphicalAreaOverLand03StudyBoxSqUnits);
 assert.deepEqual(areas,[0.006261,0.081782,0]);
 assert.ok(v.ribbonAndInquiryBands[0].land03StudyBoxClippedPolygon.length>=3);
 assert.equal(v.ribbonAndInquiryBands[2].land03StudyBoxClippedPolygon.length,0);
 assert.equal(v.land03StudyBoxNotAParcel,true);
});
test('all three illustrative zones remain inside Market focus, not surveyed parcel',()=>{
 const plan=source('MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const focus=plan.focus_area_envelopes.find(x=>x.id==='MB-FOCUS-MARKET');
 assert.equal(focus.boundary_confirmed,false);
 assert.equal(plan.planning_envelope.georeferenced,false);
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.equal(v.marketFocusEnvelopeId,focus.id);
 assert.ok(v.ribbonAndInquiryBands.every(x=>
  x.fullyWithinUnsurveyedMarketFocusEnvelope===true));
});
test('exactly twelve provisional Land03 footprints were screened, with no overlap',()=>{
 const inland=source('SOURCE_PR69_LAND_03_20261120.json');
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.equal(inland.building_footprints.length,12);
 for(const band of v.ribbonAndInquiryBands){
  assert.deepEqual(band.candidateLand03BuildingsScreened,
   inland.building_footprints.map(x=>x.id));
  assert.deepEqual(band.recordedHistoricalBuildingShapeContacts,[]);
  assert.equal(band.physicalBuildingClearanceVerified,false);
  for(const b of inland.building_footprints)assert.equal(
   polygonsContact(band.polygonIllustrativeCanvas,b.polygon),false);
 }
 assert.equal(v.unknownUnmappedM1BuildingFootprints,null);
});
test('the café and office references cannot become confirmed doorways',()=>{
 const plan=source('MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 const cafes=plan.locations.filter(x=>['LOC-CAFE-BRUMA',
  'LOC-MARKET-BUSINESS-OFFICES'].includes(x.id));
 assert.equal(cafes.length,2);
 assert.ok(cafes.every(x=>x.physical_footprint_defined===false));
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.equal(v.cafeEntranceAndLoadingConfiguration,null);
 assert.equal(v.publicMarketExitApproved,false);
});
test('drawing offsets are explicitly illustration values, never metres',()=>{
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.deepEqual(v.ribbonAndInquiryBands.map(x=>x.lateralOffsetsCanvasUnits),
  [[-0.12,0.12],[0.12,0.45],[-0.45,-0.12]]);
 for(const band of v.ribbonAndInquiryBands){
  assert.equal(band.graphicOffsetsAreMeters,false);
  assert.equal(band.actualPedestrianWidthVerified,false);
  assert.equal(band.passageFromMarketRowVerified,false);
  assert.equal(band.streetApproved,false);
 }
 assert.equal(v.realDimensionsMeters,null);
 assert.equal(v.realRouteSafetyVerified,false);
});
test('no P1, M2, M3, P2 or other agent route changes occur',()=>{
 const v=inspectMarketM1FrontageEnvelope({state:saved()});
 assert.deepEqual(v.preservedOtherSectionIds,['MB-04-P1','MB-04-P2',
  'MB-04-M2','MB-04-M3']);
 assert.deepEqual(v.reviewedConceptIds,['M1-A','M1-B']);
 assert.deepEqual(v.newSavedGraphEdges,[]);
 assert.deepEqual(v.newBuildings,[]);
 assert.equal(v.selectedConstruction,null);
});
test('forged building clearance, real street width and approval are rejected',()=>{
 const s=saved(),a=report();a.realRouteSafetyVerified=true;
 assert.throws(()=>validateMarketM1FrontageEnvelope({state:s,candidate:a}),
  /Unapproved/);
 const b=report();b.ribbonAndInquiryBands[0].actualPedestrianWidthVerified=true;
 assert.throws(()=>validateMarketM1FrontageEnvelope({state:s,candidate:b}),
  /Unapproved/);
 const c=report();c.ribbonAndInquiryBands[0].polygonIllustrativeCanvas[0].x=3;
 assert.throws(()=>validateMarketM1FrontageEnvelope({state:s,candidate:c}),
  /Unapproved/);
});
test('saved graph corruption or missing world fails rather than certifying M1',()=>{
 assert.throws(()=>inspectMarketM1FrontageEnvelope({state:{}}));
 const s=saved();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(x=>
   x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>inspectMarketM1FrontageEnvelope({state:s}));
});
test('private readout clones and never changes chapter, player, NPC or fictional time',()=>{
 const s=saved(),before=JSON.stringify(s),v=inspectMarketM1FrontageEnvelope({state:s});
 v.ribbonAndInquiryBands[0].polygonIllustrativeCanvas[0].x=-999;
 const fresh=inspectMarketM1FrontageEnvelope({state:s});
 assert.equal(fresh.ribbonAndInquiryBands[0].polygonIllustrativeCanvas[0].x,58.779012);
 assert.equal(fresh.playerMoved,false);
 assert.equal(fresh.npcMoved,false);
 assert.equal(fresh.timeAdvanced,false);
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(JSON.stringify(s),before);
});
test('five immutable canonical story files retain their exact main Git blobs',()=>{
 const hashes={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [file,hash] of Object.entries(hashes))assert.equal(sha(raw(file)),hash,file);
});
