import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {minimumRouteFootprintGap,minimumRouteLineGap,
 segmentDistance,routeStudyCoverage,routeRouteContacts,
 inspectPlazaHarborCrossstackCoverage}
 from '../tools/meridian_bay_plaza_harbor_crossstack_coverage.mjs';
const raw=path=>readFileSync(new URL(path,import.meta.url));
const json=path=>JSON.parse(raw(path));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
const source='../docs/01_world/';
const state=()=>json('../game/STATE.json');
const read=()=>inspectPlazaHarborCrossstackCoverage({state:state()});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' differs from '+b);
test('PR103 sibling source is a byte-identical snapshot pinned to historical Git SHA',()=>{
 assert.equal(sha(raw(source+'SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json')),
  'aae66aae315603e37e8cb88034600446bf46d21d');
});
test('both historical routes remain distinct noncanon choices with same protected endpoints',()=>{
 const x=read();
 assert.deepEqual(x.reviews.map(v=>v.plazaRouteWaypointN2),
  [{x:69.6,y:39},{x:68.3,y:38.1}]);
 assert.deepEqual(x.reviews.map(v=>v.source),['PR106_A','PR103_PLAZA']);
 assert.equal(x.selectedPhysicalRoute,null);
});
test('PR106 option A minimum candidate building gap is narrow but strictly positive',()=>{
 const a=read().reviews[0];
 near(a.candidateBuildingGaps.find(x=>x.id==='HC-B-01').gapCanvas,0.079745);
 near(a.candidateBuildingGaps.find(x=>x.id==='HC-B-02').gapCanvas,0.111803);
 near(a.oldStreetCandidateGapCanvas,0.166960);
});
test('sibling PR103 variant has larger local gaps to B01, B02 and old street',()=>{
 const [a,b]=read().reviews;
 near(b.candidateBuildingGaps.find(x=>x.id==='HC-B-01').gapCanvas,0.293021);
 near(b.candidateBuildingGaps.find(x=>x.id==='HC-B-02').gapCanvas,0.829699);
 near(b.oldStreetCandidateGapCanvas,0.851566);
 for(const name of ['HC-B-01','HC-B-02'])
  assert.ok(b.candidateBuildingGaps.find(x=>x.id===name).gapCanvas>
   a.candidateBuildingGaps.find(x=>x.id===name).gapCanvas);
});
test('coast01/land03/coast02 bounding rectangles leave important route stretches uncharted',()=>{
 const [a,b]=read().reviews;
 near(a.routeCanvasLength,7.990491);
 near(a.uncoveredByStudyRectanglesCanvas,3.638721);
 near(a.unchartedStudyRectanglePct,45.53814);
 near(b.routeCanvasLength,8.280615);
 near(b.uncoveredByStudyRectanglesCanvas,4.6114);
 near(b.unchartedStudyRectanglePct,55.689098);
 assert.equal(a.regionSegments[0].outsideCanvas,2.360085);
 assert.equal(b.regionSegments[0].outsideCanvas,2.360085);
});
test('route coverage handles overlapping boxes by interval union (no double counting)',()=>{
 const path=[{x:0,y:0},{x:10,y:0}];
 const x=routeStudyCoverage(path,[
  {x_min:0,x_max:7,y_min:-1,y_max:1},
  {x_min:3,x_max:8,y_min:-1,y_max:1}
 ]);
 near(x.totalCanvas,10);near(x.coveredCanvas,8);near(x.uncoveredCanvas,2);
 const y=routeStudyCoverage(path,[{x_min:10,x_max:12,y_min:-1,y_max:1}]);
 near(y.coveredCanvas,0);
});
test('minimal segment distance detects strict crossing, boundary touch and parallel gap',()=>{
 near(segmentDistance({x:0,y:0},{x:2,y:0},
  {x:1,y:-1},{x:1,y:1}),0);
 near(segmentDistance({x:0,y:0},{x:2,y:0},
  {x:2,y:0},{x:3,y:1}),0);
 near(segmentDistance({x:0,y:0},{x:2,y:0},
  {x:0,y:1},{x:2,y:1}),1);
});
test('route inside building polygon cannot be mistaken for safe clearance',()=>{
 const poly=[{x:0,y:0},{x:3,y:0},{x:3,y:3},{x:0,y:3}];
 near(minimumRouteFootprintGap([{x:1,y:1},{x:2,y:2}],poly),0);
 near(minimumRouteFootprintGap([{x:-1,y:4},{x:4,y:4}],poly),1);
 near(minimumRouteLineGap([{x:0,y:0},{x:2,y:0}],
  [{x:1,y:2},{x:1,y:3}]),2);
});
test('both approaches meet sibling market line only at protected Harbor end',()=>{
 const reviews=read().reviews;
 for(const r of reviews){
  assert.deepEqual(r.sharedMarketReview.strictCrossings,[]);
  assert.equal(r.sharedMarketReview.contacts.length,1);
  assert.equal(r.sharedMarketReview.contacts[0].sharedTerminalOnly,true);
 }
});
test('malformed studies and points fail closed instead of implying full coverage',()=>{
 assert.throws(()=>routeStudyCoverage([{x:0,y:0},{x:1,y:0}],
  [{x_min:3,x_max:2,y_min:0,y_max:1}]),/Valid study rectangle/);
 assert.throws(()=>minimumRouteFootprintGap([{x:0,y:0}],[
  {x:0,y:0},{x:1,y:0},{x:1,y:1}]),/at least two/);
 assert.throws(()=>segmentDistance({x:0,y:0},{x:1,y:0},
  {x:NaN,y:0},{x:2,y:0}),/Valid finite/);
 assert.throws(()=>routeRouteContacts([{x:0,y:0},{x:0,y:0}],
  [{x:1,y:0},{x:2,y:0}]),/distinct finite/);
});
test('forged live saved graph link is rejected before rendering options',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=[];
 assert.throws(()=>inspectPlazaHarborCrossstackCoverage({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});
test('private result cannot change live save or source records; no route admission',()=>{
 const snapshots=[
  source+'SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122.json',
  source+'SOURCE_PR56_PLAZA_HARBOR_20261120.json',
  source+'SOURCE_PR67_COAST_01_20261120.json',
  '../game/STATE.json','../game/SAVE_MANIFEST.json'];
 const hashes=snapshots.map(f=>sha(raw(f))),s=state(),before=JSON.stringify(s);
 const a=inspectPlazaHarborCrossstackCoverage({state:s});
 a.reviews[0].candidateBuildingGaps[0].gapCanvas=999;
 assert.ok(inspectPlazaHarborCrossstackCoverage({state:s}).reviews[0].candidateBuildingGaps[0].gapCanvas<2);
 assert.deepEqual(snapshots.map(f=>sha(raw(f))),hashes);
 assert.equal(JSON.stringify(s),before);
 assert.equal(a.worldMapAdmitted,false);
 assert.equal(a.playerMoved,false);assert.equal(a.npcMoved,false);
 assert.equal(a.fictionalTimeAdvanced,false);assert.deepEqual(a.newSavedEdges,[]);
 assert.equal(a.requiresEditorialReview,true);
 assert.equal(s.pending.type,'await_player_action');
});
