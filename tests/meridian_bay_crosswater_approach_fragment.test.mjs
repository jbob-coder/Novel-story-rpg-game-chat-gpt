import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectCrosswaterProvisionalFragment,validateCrosswaterStudyManifest}
 from '../tools/meridian_bay_crosswater_approach_fragment.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0'))
 .update(b).digest('hex');
const source=n=>'../docs/01_world/'+n+'.json';
const saved=()=>json('../game/STATE.json');
const manifest=()=>json(source('MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122'));
const inspect=()=>inspectCrosswaterProvisionalFragment({state:saved()});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,String(a)+' != '+String(b));

test('source pins match all six archived historical Git blob identities',()=>{
 const known=[
  ['scale','MERIDIAN_BAY_CITY_SCALE_PLAN_20261112'],
  ['plaza','SOURCE_PR56_PLAZA_HARBOR_20261120'],
  ['sibling','SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122'],
  ['coast01','SOURCE_PR67_COAST_01_20261120'],
  ['land03','SOURCE_PR69_LAND_03_20261120'],
  ['coast02','SOURCE_PR67_COAST_02_20261120']
 ];
 const m=manifest();
 for(const [key,file]of known)assert.equal(sha(raw(source(file))),m.source_blobs[key]);
});

test('the study envelope is a derived bounding rectangle and never an admitted parcel',()=>{
 const v=inspect();
 assert.equal(v.classification,'narrator_private_noncanonical_crosswater_approach_fragment');
 assert.equal(v.reviewWindow.interpretation,'derived_bounding_window_only_not_parcel_or_road');
 assert.equal(v.reviewWindow.x_min,65);
 assert.equal(v.reviewWindow.x_max,68);
 near(v.reviewWindow.y_min,38.635714);
 assert.equal(v.reviewWindow.y_max,42);
 assert.equal(v.mapAdmitted,false);
 assert.deepEqual(v.newWorldLocations,[]);
 assert.deepEqual(v.newSavedWorldEdges,[]);
});

test('both candidates reuse unchanged archived Plaza-to-N1 drawing',()=>{
 const v=inspect();
 assert.deepEqual(v.commonLeg.from,{x:65,y:42});
 assert.deepEqual(v.commonLeg.to,{x:66.9,y:40.6});
 assert.deepEqual(v.variants.map(x=>x.id),['PR106_A','PR103_SIBLING']);
 for(const r of v.variants){
  assert.deepEqual(r.centerlineOnly.slice(0,2),[{x:65,y:42},{x:66.9,y:40.6}]);
  near(r.sharedLegCanvas,2.360085);
  assert.equal(r.physicalPassageVerified,false);
  assert.equal(r.routeApproved,false);
 }
});

test('PR106 A coastal study-box handoff and uncharted length match prior source audit',()=>{
 const x=inspect().variants[0];
 near(x.coastReviewEntry.x,68);
 near(x.coastReviewEntry.y,39.948148);
 near(x.optionLegCanvas,1.278636);
 near(x.undetailedTotalCanvas,3.638721);
 near(x.outsideAllBroadFocusCanvas,0);
});

test('PR103 sibling handoff and missing focus gap match the preserved sibling plan',()=>{
 const x=inspect().variants[1];
 near(x.coastReviewEntry.x,68);
 near(x.coastReviewEntry.y,38.635714);
 near(x.optionLegCanvas,2.251315);
 near(x.undetailedTotalCanvas,4.6114);
 near(x.outsideAllBroadFocusCanvas,0.417517);
});

test('neighboring two draft roads only touch at shared Plaza reference, not a proved crossing',()=>{
 const r=inspect().neighboringDraftStreets;
 assert.deepEqual(r.map(x=>x.id),['MX-A-MARKET-PLAZA','MX-A-PLAZA-TERM']);
 assert.ok(r.every(x=>x.strictCrossings===0&&x.verifiedCrosswalk===false));
 assert.deepEqual(r[0].sharedPlazaReferenceOnly,{x:65,y:42});
});

test('terminal approximate anchor cannot authorize public passage through its grounds',()=>{
 const result=inspect();
 assert.deepEqual(result.terminalApproximateAnchor,{x:66,y:42});
 near(result.terminalCenterlineGapCanvas,0.593199);
 assert.equal(result.mapAdmitted,false);
});

test('six unknown obstacle categories are not promoted to verified buildings or hazards',()=>{
 const result=inspect();
 assert.deepEqual(result.confirmedObstacles,[]);
 assert.equal(result.unknownPhysicalObstaclesAndParcels.length,6);
 assert.ok(result.unknownPhysicalObstaclesAndParcels.every(x=>
  x.status==='unknown'&&x.confirmed===false&&x.geometry===null));
 assert.equal(result.ownerOrDesignerDecisionsOpen.length,4);
});

test('forged physical obstruction claim is rejected before displaying the fragment',()=>{
 const m=manifest();
 m.unknown_obstruction_and_parcel_checks[0].geometry=[{x:65,y:42},{x:66,y:42}];
 assert.throws(()=>inspectCrosswaterProvisionalFragment({state:saved(),manifest:m}),
  /Unknown obstacles/);
});

test('changing a source blob, original anchor or neighboring-road approval fails closed',()=>{
 const a=manifest();a.source_blobs.plaza='invalid';
 assert.throws(()=>validateCrosswaterStudyManifest(a),/source identity/);
 const b=manifest();b.common_undetailed_leg.from.x=64;
 assert.throws(()=>inspectCrosswaterProvisionalFragment({state:saved(),manifest:b}),
  /Shared missing route leg/);
 const c=manifest();c.adjacent_source_sketches[1].physical_crossing_verified=true;
 assert.throws(()=>validateCrosswaterStudyManifest(c),/must not imply/);
});

test('repointing either Coast01 entry without source authority is rejected',()=>{
 const m=manifest();m.variant_exit_legs[0].coast_study_entry.y+=0.1;
 assert.throws(()=>inspectCrosswaterProvisionalFragment({state:saved(),manifest:m}),
  /Derived candidate centerline/);
});

test('missing saved Harbor link rejects the draft rather than creating a new graph edge',()=>{
 const s=saved();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=[];
 assert.throws(()=>inspectCrosswaterProvisionalFragment({state:s}),
  /Saved Harbor Walk connections|four existing saved-world links/);
});

test('the inspector clones output, leaves historical files and save unchanged, advances no time',()=>{
 const protectedFiles=[
  source('MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122'),
  source('SOURCE_PR56_PLAZA_HARBOR_20261120'),
  source('SOURCE_PR103_HARBOR_ACCESS_RECONCILIATION_20261122'),
  '../game/STATE.json','../game/SAVE_MANIFEST.json'
 ];
 const before=protectedFiles.map(x=>sha(raw(x))),s=saved(),stateBefore=JSON.stringify(s);
 const result=inspectCrosswaterProvisionalFragment({state:s});
 result.variants[0].centerlineOnly[0].x=999;
 result.unknownPhysicalObstaclesAndParcels[0].status='verified';
 const repeated=inspectCrosswaterProvisionalFragment({state:s});
 assert.equal(repeated.variants[0].centerlineOnly[0].x,65);
 assert.equal(repeated.unknownPhysicalObstaclesAndParcels[0].status,'unknown');
 assert.deepEqual(protectedFiles.map(x=>sha(raw(x))),before);
 assert.equal(JSON.stringify(s),stateBefore);
 assert.equal(result.chosenPhysicalRoute,null);
 assert.equal(result.playerMoved,false);
 assert.equal(result.npcMoved,false);
 assert.equal(result.fictionalTimeAdvanced,false);
 assert.equal(result.requiresEditorialReview,true);
 assert.equal(s.pending.type,'await_player_action');
});
