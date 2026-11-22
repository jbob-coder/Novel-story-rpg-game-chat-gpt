import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 clipToStudyBox,analyzeStudyBoxCoverage,candidateBuildingContacts,
 inspectHarborRegionalCoverage
} from '../tools/meridian_harbor_region_coverage.mjs';

const raw=path=>readFileSync(new URL(path,import.meta.url));
const json=path=>JSON.parse(raw(path));
const state=()=>json('../game/STATE.json');
const root='../docs/01_world/';
const source=path=>json(root+path);
const base=()=>source('MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json');
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' differs from '+b);
const box=(x1,x2,y1,y2)=>({x_min:x1,x_max:x2,y_min:y1,y_max:y2});

test('four independent source Git blob hashes must match exact archived data',()=>{
 const sources={
  'MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json':
   'aae66aae315603e37e8cb88034600446bf46d21d',
  'MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json':
   '139c3687c98285aff886d28422544d082768217d',
  'SOURCE_PR67_COAST_02_20261120.json':
   '325a0acde67a1ce3b44576860824657a3db41695',
  'SOURCE_PR69_LAND_03_20261120.json':
   '2a95eb9e50f69436cb65711daf8ff586f4ef4279'
 };
 for(const [name,expected] of Object.entries(sources)){
  assert.equal(sha(raw(root+name)),expected,name);
 }
 assert.equal(inspectHarborRegionalCoverage({state:state()}).sourcePr,103);
});

test('segment against region rectangle is clipped at exact entry and exit parameters',()=>{
 const clip=clipToStudyBox({x:-1,y:0.5},{x:2,y:0.5},box(0,1,0,1));
 close(clip[0],1/3);close(clip[1],2/3);
 const reverse=clipToStudyBox({x:2,y:0.5},{x:-1,y:0.5},box(0,1,0,1));
 close(reverse[0],1/3);close(reverse[1],2/3);
});

test('point-only study-box corner contact never pretends to cover a route length',()=>{
 assert.equal(clipToStudyBox({x:-1,y:-1},{x:0,y:0},box(0,1,0,1)),null);
 const result=analyzeStudyBoxCoverage([{x:-1,y:-1},{x:0,y:0}],
  [{id:'A',box:box(0,1,0,1)}]);
 assert.equal(result.insideStudyBoxesCanvasUnits,0);
 assert.equal(result.fractionOutsideStudyBoxes,1);
});

test('boundary line is reported as mathematically inside a study box but not passable',()=>{
 const result=analyzeStudyBoxCoverage([{x:0,y:0.25},{x:0,y:0.75}],
  [{id:'box',box:box(0,1,0,1)}]);
 assert.equal(result.fractionInsideStudyBoxes,1);
 assert.deepEqual(result.segments[0].pieces[0].studyBoxes,['box']);
 assert.equal(result.segments[0].pieces[0].physicalPassabilityVerified,false);
 assert.equal(result.coverageIsNotPassability,true);
});

test('overlapping rectangles use union, not a double-counted length',()=>{
 const result=analyzeStudyBoxCoverage([{x:0,y:0},{x:3,y:0}],
  [{id:'A',box:box(0,2,-1,1)},{id:'B',box:box(1,3,-1,1)}]);
 assert.equal(result.totalCanvasUnits,3);
 assert.equal(result.insideStudyBoxesCanvasUnits,3);
 assert.equal(result.fractionInsideStudyBoxes,1);
 assert.ok(result.segments[0].pieces.some(p=>
  p.studyBoxes.includes('A')&&p.studyBoxes.includes('B')));
});

test('Market Row to Harbor is mostly OUTSIDE the three archived region rectangles',()=>{
 const v=inspectHarborRegionalCoverage({state:state()});
 const market=v.routes[0].coverage;
 assert.equal(v.routes[0].id,'market_review_PR44');
 assert.equal(market.segments.length,5);
 close(market.totalCanvasUnits,15.303534);
 close(market.insideStudyBoxesCanvasUnits,4.633913);
 close(market.outsideStudyBoxesCanvasUnits,10.669621);
 close(market.fractionInsideStudyBoxes,0.3028);
 close(market.fractionOutsideStudyBoxes,0.6972);
 assert.equal(v.routes[0].missingStudyGeometryBlocksPhysicalApproval,true);
});

test('Market segments identify land03 tip, undocumented urban corridor and Coast01 tail',()=>{
 const result=inspectHarborRegionalCoverage({state:state()}).routes[0].coverage;
 const s=result.segments;
 assert.deepEqual(s[0].pieces.map(p=>p.studyBoxes),[['land03'],[]]);
 assert.deepEqual(s[0].pieces[0].to,{x:58.869565,y:42});
 assert.deepEqual(s[1].pieces[0].studyBoxes,[]);
 assert.deepEqual(s[2].pieces[0].studyBoxes,[]);
 assert.deepEqual(s[3].pieces.map(x=>x.studyBoxes),[['coast01']]);
 assert.deepEqual(s[4].pieces.map(x=>x.studyBoxes),[['coast01']]);
 assert.ok(s[1].pieces[0].undocumentedByAvailableStudyBoxes);
});

test('Plaza to Harbor crosses an unsurveyed map gap before entering Coast01',()=>{
 const v=inspectHarborRegionalCoverage({state:state()});
 const c=v.routes[1].coverage;
 assert.equal(v.routes[1].id,'plaza_review_PR56');
 assert.equal(c.segments.length,4);
 close(c.totalCanvasUnits,8.280615);
 close(c.insideStudyBoxesCanvasUnits,3.669215);
 close(c.outsideStudyBoxesCanvasUnits,4.6114);
 close(c.fractionInsideStudyBoxes,0.443109);
 close(c.fractionOutsideStudyBoxes,0.556891);
 assert.deepEqual(c.segments[0].pieces.map(p=>p.studyBoxes),[[]]);
 assert.deepEqual(c.segments[1].pieces.map(p=>p.studyBoxes),[[],['coast01']]);
 assert.deepEqual(c.segments[1].pieces[1].from,{x:68,y:38.635714});
 assert.deepEqual(c.segments[2].pieces.map(p=>p.studyBoxes),[['coast01']]);
 assert.deepEqual(c.segments[3].pieces.map(p=>p.studyBoxes),[['coast01']]);
});

test('Coast02 is not on either drawn corridor and no other region is invented',()=>{
 const result=inspectHarborRegionalCoverage({state:state()});
 assert.deepEqual(result.studies.map(x=>x.id),['land03','coast02','coast01']);
 assert.ok(result.studies.every(x=>x.notSurveyed));
 for(const route of result.routes){
  assert.deepEqual(route.coverage.studiedBoxes,['coast01','coast02','land03']);
  assert.ok(route.coverage.segments.flatMap(x=>x.pieces).every(p=>
   !p.studyBoxes.includes('coast02')));
 }
 assert.equal(result.missingRegionStudy,
  'urban_connector_below_y42_between_Market_Plaza_and_Coast01');
 assert.equal(result.missingRegionIsUnprovenNotBlocked,true);
});

test('no tested route crosses one of the 28 archived *candidate* footprints',()=>{
 const result=inspectHarborRegionalCoverage({state:state()});
 const n=[
  source('MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json'),
  source('SOURCE_PR67_COAST_02_20261120.json'),
  source('SOURCE_PR69_LAND_03_20261120.json')
 ].reduce((s,x)=>s+x.building_footprints.length,0);
 assert.equal(n,28);
 assert.ok(result.routes.every(x=>x.knownDraftBuildingContacts.length===0));
 assert.ok(result.routes.every(x=>x.physicalRouteSelected===false));
});

test('known-building checker catches crossings and entirely internal route segments',()=>{
 const square=[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}];
 const region=[{id:'test',buildings:[{id:'B',polygon:square}]}];
 const crossing=candidateBuildingContacts([{x:-1,y:1},{x:3,y:1}],region);
 assert.ok(crossing.filter(x=>x.type==='draft_footprint_boundary_contact').length>=2);
 assert.ok(crossing.some(x=>x.type==='draft_footprint_interior'));
 const internal=candidateBuildingContacts([{x:0.5,y:0.5},{x:1.5,y:1.5}],region);
 assert.ok(internal.every(x=>x.type==='draft_footprint_interior'));
 assert.ok(internal.length>=2);
});

test('boundary tangency is visible in building checker, not misclassified as free passage',()=>{
 const square=[{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}];
 const out=candidateBuildingContacts([{x:-1,y:0},{x:0,y:0}],
  [{id:'test',buildings:[{id:'B',polygon:square}]}]);
 assert.ok(out.some(x=>x.type==='draft_footprint_boundary_contact'));
});

test('invalid geometry, duplicate rectangles or degenerate paths fail closed',()=>{
 assert.throws(()=>clipToStudyBox({x:0,y:0},{x:0,y:0},box(0,1,0,1)),
  /Segment endpoints/);
 assert.throws(()=>analyzeStudyBoxCoverage([{x:0,y:0},{x:1,y:0}],
  [{id:'A',box:box(1,1,0,1)}]),/Invalid or duplicated/);
 assert.throws(()=>analyzeStudyBoxCoverage([{x:0,y:0},{x:1,y:0}],
  [{id:'A',box:box(0,1,0,1)},{id:'A',box:box(0,2,0,2)}]),
  /Invalid or duplicated/);
 assert.throws(()=>analyzeStudyBoxCoverage([{x:0,y:0},{x:0,y:0}],
  [{id:'A',box:box(0,2,0,2)}]),/Zero-length/);
 assert.throws(()=>analyzeStudyBoxCoverage([{x:NaN,y:0},{x:0,y:0}],
  [{id:'A',box:box(0,2,0,2)}]),/Finite route/);
});

test('saved graph deletion is rejected before reporting route coverage',()=>{
 const altered=state();
 altered.world.locations['LOC-HARBOR-WALK'].connected_ids=
  altered.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(x=>
   x!=='LOC-CROSSWATER-PLAZA');
 assert.throws(()=>inspectHarborRegionalCoverage({state:altered}));
 assert.throws(()=>inspectHarborRegionalCoverage({}));
});

test('no turn, clock, NPC, navigation or source data mutation by repeated audit',()=>{
 const s=state(),initial=JSON.stringify(s);
 const first=inspectHarborRegionalCoverage({state:s});
 assert.equal(first.worldGeometryAdmitted,false);
 assert.equal(first.savedWorldChanged,false);
 assert.equal(first.playerMoved,false);
 assert.equal(first.npcMoved,false);
 assert.equal(first.fictionalTimeAdvanced,false);
 assert.equal(first.roadDistancesKm,null);
 assert.equal(first.travelMinutes,null);
 assert.equal(first.selectedPhysicalCorridors,null);
 assert.deepEqual(first.newSavedEdges,[]);
 assert.equal(first.requiresFurtherCartographicReview,true);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 first.routes[0].coverage.segments[0].pieces[0].studyBoxes.push('FAKE');
 const second=inspectHarborRegionalCoverage({state:s});
 assert.deepEqual(second.routes[0].coverage.segments[0].pieces[0].studyBoxes,['land03']);
 assert.equal(JSON.stringify(s),initial);
});

test('five canonical narrative files still equal immutable main Git blobs',()=>{
 const expected={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [name,blob] of Object.entries(expected))assert.equal(sha(raw(name)),blob,name);
});
