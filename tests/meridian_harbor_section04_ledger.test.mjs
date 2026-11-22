import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 deriveHarborSection04Study,validateHarborSection04Study,inspectHarborSection04Study
} from '../tools/meridian_harbor_section04_ledger.mjs';
import {measurePhysicalDraftCoverage} from '../tools/meridian_bay_harbor_region_coverage.mjs';

const raw=path=>readFileSync(new URL(path,import.meta.url));
const json=path=>JSON.parse(raw(path));
const state=()=>json('../game/STATE.json');
const ledger=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_SECTION04_STUDY_20261122.json');
const source=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json');
const gitBlob=data=>createHash('sha1').update(Buffer.from('blob '+data.length+'\0'))
 .update(data).digest('hex');
const exact=(a,b)=>assert.deepEqual(a,b);

test('section study is regenerated exactly from unchanged pinned historical route sources',()=>{
 const s=state(),before=JSON.stringify(s);
 exact(deriveHarborSection04Study({state:s}),ledger());
 assert.equal(validateHarborSection04Study({state:s}),true);
 assert.equal(JSON.stringify(s),before);
 assert.equal(gitBlob(raw('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json')),
  'aae66aae315603e37e8cb88034600446bf46d21d');
});

test('exactly five unknown subsections retain their source IDs without adding streets',()=>{
 const v=inspectHarborSection04Study({state:state()});
 assert.equal(v.schema_version,1);
 assert.equal(v.baseReviewPr,112);
 assert.equal(v.status,'source_derived_section_ledger_not_a_physical_fragment');
 exact(v.sections.map(x=>x.id),
  ['MB-04-M1','MB-04-M2','MB-04-M3','MB-04-P1','MB-04-P2']);
 exact(v.sections.map(x=>x.sourceSegmentIndex),[0,1,2,0,1]);
 exact(v.routes.map(x=>x.sectionIds),
  [['MB-04-M1','MB-04-M2','MB-04-M3'],['MB-04-P1','MB-04-P2']]);
 assert.ok(v.sections.every(x=>x.canNavigate===false));
});

test('Market study 3 sections connect exactly to old land03 and coast01 boundary',()=>{
 const [a,b,c]=ledger().sections.slice(0,3);
 exact([a.from,a.to],[{x:58.869565,y:42},{x:60,y:40.7}]);
 exact(b.from,a.to);
 exact(b.to,{x:64,y:38.1});
 exact(c.from,b.to);
 exact(c.to,{x:68,y:36.9});
 exact(a.sourceWaypointIds,['MB-MH-N0','MB-MH-N1']);
 exact(b.sourceWaypointIds,['MB-MH-N1','MB-MH-N2']);
 exact(c.sourceWaypointIds,['MB-MH-N2','MB-MH-N3']);
});

test('Plaza study 2 sections preserve original plaza start and Coast01 entry',()=>{
 const [a,b]=ledger().sections.slice(3);
 exact(a.from,{x:65,y:42});
 exact(a.to,{x:66.9,y:40.6});
 exact(b.from,a.to);
 exact(b.to,{x:68,y:38.635714});
 exact(a.sourceWaypointIds,['MB-PH-N0','MB-PH-N1']);
 exact(b.sourceWaypointIds,['MB-PH-N1','MB-PH-N2']);
});

test('study sections cover exactly the portions NOT inside archived physical-study boxes',()=>{
 const l=ledger(),plan=source();
 for(const [key,ids] of [['market_to_harbor',['MB-04-M1','MB-04-M2','MB-04-M3']],
   ['plaza_to_harbor',['MB-04-P1','MB-04-P2']]]){
  const study=measurePhysicalDraftCoverage(plan[key].nodes.map(n=>n.xy));
  const uncovered=study.sections.filter(x=>x.regionIds.length===0);
  assert.equal(uncovered.length,ids.length);
  for(const [i,s] of uncovered.entries()){
   const recorded=l.sections.find(x=>x.id===ids[i]);
   assert.equal(recorded.sourceSegmentIndex,s.segmentIndex);
   assert.equal(recorded.hypotheticalLengthUnits,s.hypotheticalLengthUnits);
   exact(recorded.from,{x:Math.round(s.from.x*1e6)/1e6,y:Math.round(s.from.y*1e6)/1e6});
   exact(recorded.to,{x:Math.round(s.to.x*1e6)/1e6,y:Math.round(s.to.y*1e6)/1e6});
  }
 }
});

test('each missing section is unbuilt and unknown; a blank map is not empty terrain',()=>{
 const l=ledger();
 assert.equal(l.summary.distinctUnstudiedSections,5);
 assert.equal(l.summary.notYetStudiedMarketCanvasUnits,10.669621);
 assert.equal(l.summary.notYetStudiedPlazaCanvasUnits,4.6114);
 assert.equal(l.summary.coast02RouteLengthCovered,0);
 assert.equal(l.summary.sharedPhysicalStreetSelected,false);
 for(const s of l.sections){
  assert.equal(s.buildingFootprints,null);
  assert.equal(s.landUse,null);
  assert.equal(s.publicEasement,null);
  assert.equal(s.measuredWidth,null);
  assert.equal(s.canNavigate,false);
  assert.equal(s.status,'line_from_unapproved_source_only_missing_physical_region_study');
 }
});

test('bounding window is explicitly a proposal, never a new surveyed region',()=>{
 const v=inspectHarborSection04Study({state:state()});
 exact(v.explorationWindow,{
  x_min:58,x_max:68,y_min:36.9,y_max:42,
  classification:'source_endpoint_bounding_window_not_zoning_or_survey'
 });
 assert.ok(Object.values(v.evidenceBoundary).every(Boolean));
 assert.equal(v.routePassabilityVerified,false);
 assert.equal(v.canonicalWorldChanged,false);
});

test('all canonical graph edges are preserved and no new saved world identity is minted',()=>{
 const s=state(),v=inspectHarborSection04Study({state:s});
 for(const route of v.routes){
  assert.equal(route.toLocationId,'LOC-HARBOR-WALK');
  assert.ok(s.world.locations[route.fromLocationId].connected_ids.includes(route.toLocationId));
  assert.ok(s.world.locations[route.toLocationId].connected_ids.includes(route.fromLocationId));
  assert.equal(route.playable,false);
 }
 assert.equal(v.evidenceBoundary.noNewSavedGraphEdges,true);
});

test('forged public accessibility or a fabricated building is rejected before preview',()=>{
 const s=state(),v=ledger();
 v.sections[0].canNavigate=true;
 assert.throws(()=>validateHarborSection04Study({state:s,study:v}),
  /diverges/);
 const p=ledger();
 p.sections[2].buildingFootprints=[{id:'UNVERIFIED'}];
 assert.throws(()=>validateHarborSection04Study({state:s,study:p}),
  /diverges/);
 const q=ledger();
 q.routes[1].playable=true;
 assert.throws(()=>validateHarborSection04Study({state:s,study:q}),
  /diverges/);
});

test('forged seams, extra route and location IDs fail source equality',()=>{
 const s=state(),v=ledger();v.sections[3].to.x=69;
 assert.throws(()=>validateHarborSection04Study({state:s,study:v}),/diverges/);
 const p=ledger();p.sections.push({...p.sections[0],id:'UNREVIEWED'});
 assert.throws(()=>validateHarborSection04Study({state:s,study:p}),/diverges/);
 const q=ledger();q.routes[0].fromLocationId='LOC-FAKE';
 assert.throws(()=>validateHarborSection04Study({state:s,study:q}),/diverges/);
});

test('removed real graph edges and missing world fail closed',()=>{
 assert.throws(()=>inspectHarborSection04Study({}),/saved world|required/i);
 const s=state();
 s.world.locations['LOC-HARBOR-WALK'].connected_ids=
  s.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(
   x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>inspectHarborSection04Study({state:s}));
});

test('read-only inspection cannot mutate source, player, NPC, time or checkpoint',()=>{
 const s=state(),before=JSON.stringify(s),a=inspectHarborSection04Study({state:s});
 a.sections[0].from.x=999;a.routes[0].sectionIds.push('FORGED');
 const b=inspectHarborSection04Study({state:s});
 assert.equal(b.sections[0].from.x,58.869565);
 assert.equal(b.routes[0].sectionIds.length,3);
 assert.equal(b.playerMoved,false);
 assert.equal(b.npcMoved,false);
 assert.equal(b.storyTurnAdvanced,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});

test('five protected narrative blobs are identical to canonical main',()=>{
 const expected={
  '../game/SAVE_MANIFEST.json':'897ec2e77ece4f8edf506c7058552a5dd3cdb320',
  '../game/STATE.json':'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  '../chapters/CH-000.events.json':'1f40c724e44f70c9b45814dc11ff1f73262c5a5f',
  '../chapters/CH-000.transcript.json':'1350916ead7fb1f2f15fdd635dda42e69a0a3fed',
  '../chapters/CH-000.md':'e4c11953eae355c2e06b0a1c7aa01ade3d28e4d4'
 };
 for(const [path,sha] of Object.entries(expected))assert.equal(gitBlob(raw(path)),sha,path);
});
