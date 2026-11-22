import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {clipStudyBox,firstCoastBoxEntry,inspectEvidenceCoverage,
 inspectPlazaApproachEvidenceGap}
 from '../tools/meridian_bay_plaza_approach_evidence_gap.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
const src=n=>'../docs/01_world/'+n+'.json';
const state=()=>json('../game/STATE.json');
const inspect=()=>inspectPlazaApproachEvidenceGap({state:state()});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,String(a)+' differs from '+String(b));

test('six historical city/route/region sources retain their Git blob identities',()=>{
 const sources=[
  ['MERIDIAN_BAY_CITY_SCALE_PLAN_20261112','2e8c5ff412436a6e7d526bc0172adfca77107263'],
  ['SOURCE_PR56_PLAZA_HARBOR_20261120','a5ac772922b4717797118b15f182207be1d1a7fb'],
  ['SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122','aae66aae315603e37e8cb88034600446bf46d21d'],
  ['SOURCE_PR67_COAST_01_20261120','7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'],
  ['SOURCE_PR69_LAND_03_20261120','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
  ['SOURCE_PR67_COAST_02_20261120','325a0acde67a1ce3b44576860824657a3db41695']
 ];
 for(const [name,expected]of sources)assert.equal(sha(raw(src(name))),expected);
});

test('the two Plaza variants are independent draft alternatives, not saved-world routes',()=>{
 const v=inspect();
 assert.equal(v.classification,'noncanonical_plaza_to_coast_evidence_gap');
 assert.deepEqual(v.variants.map(x=>x.source),['PR106_A','PR103_SIBLING']);
 assert.deepEqual(v.variants.map(x=>x.N2),[{x:69.6,y:39},{x:68.3,y:38.1}]);
 assert.deepEqual(v.existingSavedPlaceLinkOnly,['LOC-CROSSWATER-PLAZA','LOC-HARBOR-WALK']);
 assert.deepEqual(v.newSavedEdges,[]);
});

test('both variants have fully undetailed first Plaza-to-approach segment',()=>{
 const v=inspect();
 for(const item of v.variants){
  assert.equal(item.spans.length,2);
  assert.equal(item.spans[0].segment,0);
  assert.deepEqual(item.spans[0].start,{x:65,y:42});
  assert.deepEqual(item.spans[0].end,{x:66.9,y:40.6});
  near(item.spans[0].canvasLength,2.360085);
  near(item.spans[0].outsideBothCanvas,0);
 }
});

test('option A enters Coast 01 at (68,39.948148) with no extra gap beyond broad focus',()=>{
 const item=inspect().variants[0];
 assert.equal(item.coastBoxEntry.segment,1);
 near(item.coastBoxEntry.param,0.407407);
 near(item.coastBoxEntry.xy.x,68);
 near(item.coastBoxEntry.xy.y,39.948148);
 near(item.fullCanvas,7.990491);
 near(item.missingDetailedCanvas,3.638721);
 near(item.broadFocusWithoutDetailCanvas,3.638721);
 near(item.outsideDetailedAndFocusCanvas,0);
});

test('sibling option enters Coast 01 lower and lacks even broad focus for 0.417517 units',()=>{
 const item=inspect().variants[1];
 assert.equal(item.coastBoxEntry.segment,1);
 near(item.coastBoxEntry.param,0.785714);
 near(item.coastBoxEntry.xy.x,68);
 near(item.coastBoxEntry.xy.y,38.635714);
 near(item.fullCanvas,8.280615);
 near(item.missingDetailedCanvas,4.6114);
 near(item.broadFocusWithoutDetailCanvas,4.193883);
 near(item.outsideDetailedAndFocusCanvas,0.417517);
});

test('the missing portion is not filled by city core, focus or approximate terminal reference',()=>{
 const v=inspect();
 assert.deepEqual(v.focusIds,
  ['MB-FOCUS-CROSS','MB-FOCUS-TERM','MB-FOCUS-HARBOR']);
 assert.deepEqual(v.terminalApproximateReference,{x:66,y:42});
 assert.equal(v.terminalFootprintSurveyed,false);
 assert.equal(v.routeApproved,false);
 assert.ok(v.variants.every(x=>x.broadFocusIsNotAStreet&&
  x.physicalAccessCertified===false));
 assert.ok(v.unknowns.some(x=>x.includes('Crosswalk')));
});

test('simple rectangular clip includes only the parametric interval within bounds',()=>{
 const box={x_min:0,x_max:2,y_min:0,y_max:2};
 assert.deepEqual(clipStudyBox({x:-1,y:1},{x:3,y:1},box),[.25,.75]);
 assert.equal(clipStudyBox({x:-1,y:3},{x:3,y:3},box),null);
 assert.deepEqual(clipStudyBox({x:1,y:1},{x:1,y:3},box),[0,.5]);
});

test('study clip fails closed for invalid geometry or impossible rectangular bounds',()=>{
 const box={x_min:0,x_max:2,y_min:0,y_max:2};
 assert.throws(()=>clipStudyBox({x:0,y:0},{x:0,y:0},box),/Finite nonzero/);
 assert.throws(()=>clipStudyBox({x:NaN,y:0},{x:1,y:1},box),/Finite nonzero/);
 assert.throws(()=>clipStudyBox({x:0,y:0},{x:1,y:1},
  {x_min:2,x_max:1,y_min:0,y_max:1}),/Valid increasing/);
});

test('overlapping detailed boxes are unioned rather than counted twice',()=>{
 const r=[{x:0,y:0},{x:10,y:0}];
 const detailed=[{x_min:0,x_max:2,y_min:-1,y_max:1},
  {x_min:1,x_max:4,y_min:-1,y_max:1}];
 const focus=[{x_min:3,x_max:7,y_min:-1,y_max:1},
  {x_min:6,x_max:9,y_min:-1,y_max:1}];
 const x=inspectEvidenceCoverage(r,detailed,focus);
 near(x.fullCanvas,10);
 near(x.missingDetailedCanvas,6);
 near(x.broadFocusWithoutDetailCanvas,5);
 near(x.outsideDetailedAndFocusCanvas,1);
});

test('a corridor in broad planning focus still has no detailed road evidence',()=>{
 const route=[{x:0,y:0},{x:2,y:0}];
 const far={x_min:3,x_max:5,y_min:-1,y_max:1};
 const broad={x_min:-1,x_max:3,y_min:-1,y_max:1};
 const x=inspectEvidenceCoverage(route,[far],[broad]);
 near(x.missingDetailedCanvas,2);
 near(x.broadFocusWithoutDetailCanvas,2);
 near(x.outsideDetailedAndFocusCanvas,0);
});

test('fully detailed corridor has no missing intervals and a valid first box entry',()=>{
 const route=[{x:0,y:0},{x:2,y:0}];
 const box={x_min:-1,x_max:3,y_min:-1,y_max:1};
 const x=inspectEvidenceCoverage(route,[box],[box]);
 assert.deepEqual(x.spans,[]);
 near(x.missingDetailedCanvas,0);
 assert.deepEqual(firstCoastBoxEntry(route,box),
  {segment:0,param:0,xy:{x:0,y:0}});
});

test('bad route or missing planning evidence is rejected, not interpreted as access',()=>{
 const route=[{x:0,y:0},{x:2,y:0}];
 const box={x_min:-1,x_max:3,y_min:-1,y_max:1};
 assert.throws(()=>inspectEvidenceCoverage(route,[box],[]),/required/);
 assert.throws(()=>inspectEvidenceCoverage([{x:0,y:0},{x:NaN,y:0}],[box],[box]),
  /Finite distinct/);
 assert.throws(()=>firstCoastBoxEntry([{x:0,y:0}],box),/Finite distinct/);
 assert.equal(firstCoastBoxEntry(route,{x_min:3,x_max:4,y_min:0,y_max:1}),null);
});

test('saved graph corruption fails closed before the new review is displayed',()=>{
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=[];
 assert.throws(()=>inspectPlazaApproachEvidenceGap({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('source archives and canonical save remain unchanged and no story action occurs',()=>{
 const paths=[
  src('SOURCE_PR56_PLAZA_HARBOR_20261120'),
  src('SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122'),
  src('MERIDIAN_BAY_CITY_SCALE_PLAN_20261112'),
  '../game/STATE.json','../game/SAVE_MANIFEST.json'
 ];
 const before=paths.map(x=>sha(raw(x)));
 const s=state(),stateBefore=JSON.stringify(s);
 const result=inspectPlazaApproachEvidenceGap({state:s});
 result.variants[0].spans[0].start.x=999;
 assert.equal(inspectPlazaApproachEvidenceGap({state:s})
  .variants[0].spans[0].start.x,65);
 assert.deepEqual(paths.map(x=>sha(raw(x))),before);
 assert.equal(JSON.stringify(s),stateBefore);
 assert.equal(result.routeApproved,false);
 assert.equal(result.worldGeometryAdmitted,false);
 assert.equal(result.playerMoved,false);
 assert.equal(result.npcMoved,false);
 assert.equal(result.fictionalTimeAdvanced,false);
 assert.equal(s.pending.type,'await_player_action');
});
