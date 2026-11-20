import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 validateMeridianRegionalSeams,inspectMeridianRegionalSeams,
 coastalWaterConflicts,coastRoadBuildingConflicts,candidateRouteCrossings
} from '../tools/meridian_bay_three_region_seams.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const bytes=path=>readFileSync(new URL(path,import.meta.url));
const state=()=>read('../game/STATE.json');
const source=name=>read('../docs/01_world/SOURCE_'+name+'_20261120.json');
const old=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const pr86=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json');
const market='LOC-COMMERCIAL-DISTRICT',harbor='LOC-HARBOR-WALK';
const plaza='LOC-CROSSWATER-PLAZA',terminal='LOC-TRANSIT-TERMINAL';

test('eight immutable archive sources are verified against their actual Git blob identity',()=>{
 const pairs=[
  ['MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json','81ef8da51951205394ba050fe6f867bfc00d7244'],
  ['MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json','dae1ea04e1addcaa1ed71b1a96e0e2171e0c7ac9'],
  ['SOURCE_PR67_COAST_01_20261120.json','7cb79b2113bfef7b7fbbc39539c17fd80a275cd7'],
  ['SOURCE_PR67_COAST_02_20261120.json','325a0acde67a1ce3b44576860824657a3db41695'],
  ['SOURCE_PR69_LAND_03_20261120.json','2a95eb9e50f69436cb65711daf8ff586f4ef4279'],
  ['SOURCE_PR44_MARKET_HARBOR_20261120.json','e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
  ['SOURCE_PR58_MARKET_HARBOR_20261120.json','280a444f6eed99a33027aea2edb48af70cc67bd0'],
  ['SOURCE_PR56_PLAZA_HARBOR_20261120.json','a5ac772922b4717797118b15f182207be1d1a7fb']
 ];
 for(const [file,expected] of pairs){
  const buf=bytes('../docs/01_world/'+file);
  const sha=createHash('sha1').update(Buffer.from('blob '+buf.length+'\0'))
   .update(buf).digest('hex');
  assert.equal(sha,expected,file);
 }
 assert.equal(validateMeridianRegionalSeams({state:state()}),true);
});

test('original Coast01 violates draft water geometry, both later variants correct it',()=>{
 const sourceFault=coastalWaterConflicts(old());
 assert.ok(sourceFault.length>0);
 assert.ok(sourceFault.some(x=>x.shapeId==='HC-Z-FREIGHT'));
 assert.deepEqual(coastalWaterConflicts(pr86()),[]);
 assert.deepEqual(coastalWaterConflicts(source('PR67_COAST_01')),[]);
 assert.deepEqual(coastalWaterConflicts(source('PR67_COAST_02')),[]);
});

test('PR67 has exactly three scalar edits over original PR66, no hidden relocations',()=>{
 const a=old(),b=source('PR67_COAST_01');
 a.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon[3].x=72.25;
 const road=a.street_alignments.find(x=>x.id==='HC-A-OLD');
 road.points[3].y=39.95;
 road.points[4].y=39.3;
 assert.deepEqual(a,b);
 assert.deepEqual(b.proposed_coast.shoreline,pr86().proposed_coast.shoreline);
});

test('PR86 repairs coast but retains 3 recorded candidate road/building conflicts',()=>{
 const out=coastRoadBuildingConflicts(pr86());
 assert.equal(out.length,3);
 assert.equal(out.filter(x=>x.kind==='strict_boundary_crossing').length,2);
 assert.equal(out.filter(x=>x.kind==='road_point_inside_candidate_building').length,1);
 assert.ok(out.every(x=>x.roadId==='HC-A-OLD'&&x.buildingId==='HC-B-02'));
});

test('PR67 alternative clears water and building conflicts without admitting a physical map',()=>{
 const alt=source('PR67_COAST_01');
 assert.deepEqual(coastalWaterConflicts(alt),[]);
 assert.deepEqual(coastRoadBuildingConflicts(alt),[]);
 const view=inspectMeridianRegionalSeams({state:state()});
 assert.equal(view.coast01Alternatives.inheritedPr86.physicalIntegrationReady,false);
 assert.equal(view.coast01Alternatives.historicPr67.playableAdmission,false);
 assert.equal(view.coast01Alternatives.historicPr67.roadBuildingCandidateConflicts,0);
 assert.equal(view.coast01Alternatives.historicPr67.coastalWaterViolations,0);
});

test('coast01 and coast02 shoreline seams match exact (75.1,42)',()=>{
 const a=pr86(),b=source('PR67_COAST_02');
 assert.deepEqual(a.proposed_coast.shoreline.at(-1),{x:75.1,y:42});
 assert.deepEqual(b.proposed_coast.shoreline[0],{x:75.1,y:42});
 assert.equal(a.study_box.y_max,b.study_box.y_min);
 assert.deepEqual(source('PR67_COAST_01').proposed_coast.shoreline.at(-1),
  a.proposed_coast.shoreline.at(-1));
 const view=inspectMeridianRegionalSeams({state:state()});
 assert.equal(view.coastlineSeam.coordinatesMatch,true);
 assert.equal(view.coastlineSeam.verifiedPhysicalShore,false);
 assert.equal(view.coast02.shorelineVertices,22);
});

test('two coast02 / land03 street coordinates match but do not authorize travel',()=>{
 const c=source('PR67_COAST_02'),l=source('PR69_LAND_03');
 const matches=[
  ['MX-A-OLD-SEAM','HN-A-OLD','MX-EAST-OLD',{x:68.1,y:43.8}],
  ['MX-A-LATER-BYPASS','HN-A-NEW','MX-EAST-BYPASS',{x:68.2,y:46.65}]
 ];
 for(const [landRoad,coastRoad,seam,p] of matches){
  assert.deepEqual(l.street_alignments.find(x=>x.id===landRoad).points.at(-1),p);
  assert.deepEqual(c.street_alignments.find(x=>x.id===coastRoad).points[0],p);
  assert.deepEqual(l.boundary_interfaces.find(x=>x.id===seam).point,p);
  assert.equal(l.boundary_interfaces.find(x=>x.id===seam).transport_status,
   'candidate_not_saved_route');
 }
 const v=inspectMeridianRegionalSeams({state:state()});
 assert.equal(v.inlandSeams.length,2);
 assert.ok(v.inlandSeams.every(x=>x.coordinatesMatch===true&&
  x.playableRouteAuthorized===false));
});

test('both Market-Harbor alternatives end at existing Harbor Walk but have different final legs',()=>{
 const a=source('PR44_MARKET_HARBOR'),b=source('PR58_MARKET_HARBOR');
 const p=inspectMeridianRegionalSeams({state:state()});
 assert.equal(a.nodes.length,5);
 assert.equal(b.nodes.length,6);
 assert.deepEqual(a.nodes.at(-1).xy,b.nodes.at(-1).xy);
 assert.deepEqual(a.nodes.at(-2).xy,{x:68,y:36.9});
 assert.deepEqual(b.nodes.at(-2).xy,{x:69.5,y:36.7});
 assert.deepEqual(p.marketHarborAlternatives.map(x=>x.exactMatchWithCoast01MarketTail),
  [false,true]);
 assert.equal(p.selectedPhysicalRoute,null);
 assert.ok(p.marketHarborAlternatives.every(x=>x.approved===false));
});

test('Plaza-Harbor candidate meets coastline tail but intersects candidate building twice',()=>{
 const p=source('PR56_PLAZA_HARBOR');
 const intersections=candidateRouteCrossings(p,source('PR67_COAST_01'));
 assert.equal(intersections.filter(x=>x.candidateType==='building').length,2);
 assert.ok(intersections.filter(x=>x.candidateType==='building')
  .every(x=>x.candidateId==='HC-B-01'));
 const v=inspectMeridianRegionalSeams({state:state()});
 assert.equal(v.plazaHarborProposal.exactMatchWithCoast01PlazaTail,true);
 assert.equal(v.plazaHarborProposal.approved,false);
 assert.equal(v.plazaHarborProposal.segmentCount,4);
});

test('Market direct options both cross a blocked historic street trace, not an approved barrier',()=>{
 const v=inspectMeridianRegionalSeams({state:state()});
 assert.deepEqual(v.marketHarborAlternatives.map(x=>x.segmentCount),[4,5]);
 for(const opt of v.marketHarborAlternatives){
  assert.ok(opt.candidateIntersections.some(x=>x.candidateType==='blocked_historic_trace'));
  assert.equal(opt.harbor.x,71);
  assert.equal(opt.harbor.y,37);
  assert.equal(opt.approved,false);
 }
 assert.equal(v.marketHarborAlternatives[0].exactMatchWithCoast01MarketTail,false);
});

test('the saved graph retains four actual edges without importing any candidate roads',()=>{
 const s=state(),v=inspectMeridianRegionalSeams({state:s});
 assert.deepEqual(v.existingSavedGraphEdgesOnly,[[market,harbor],[plaza,harbor],
  [market,plaza],[plaza,terminal]]);
 assert.deepEqual(v.newSavedEdges,[]);
 assert.equal(v.worldMapAdmitted,false);
 assert.equal(v.canonicalNavigationAuthorized,false);
 assert.equal(v.roadDistancesKm,null);
 assert.equal(v.travelMinutes,null);
});

test('deleting a saved Harbor or transit connection causes fail-closed source review',()=>{
 for(const [a,b] of [[harbor,market],[market,harbor],[plaza,harbor],
  [market,plaza],[plaza,terminal]]){
  const s=state();
  s.world.locations[a].connected_ids=
   s.world.locations[a].connected_ids.filter(id=>id!==b);
  assert.throws(()=>validateMeridianRegionalSeams({state:s}),
   /four existing saved-world links|Saved Harbor Walk connections/);
 }
});

test('duplicate graph edges cannot be disguised as region interface joins',()=>{
 const s=state();s.world.locations[harbor].connected_ids.push(plaza);
 assert.throws(()=>inspectMeridianRegionalSeams({state:s}),
  /Saved Harbor Walk connections/);
});

test('missing world, forged map anchor and nonexistent player location are rejected',()=>{
 assert.throws(()=>validateMeridianRegionalSeams({}),
  /Existing saved world and player required/);
 const bad=state();bad.player.location_id='LOC-UNPLAYED-PORT';
 assert.throws(()=>validateMeridianRegionalSeams({state:bad}),
  /four existing saved-world links|Harbor and saved-player identities must exist/);
 const missing=state();missing.world.locations[market].id='LOC-FAKE-MARKET';
 assert.throws(()=>validateMeridianRegionalSeams({state:missing}),
  /Scale plan|Harbor|source|does not match|identities|Missing saved district anchor/);
});

test('all previews are cloned and do not mutate the current checkpoint or the archive',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=inspectMeridianRegionalSeams({state:s});
 a.inlandSeams[0].xy.x=999;a.marketHarborAlternatives[0].penultimate.x=999;
 const b=inspectMeridianRegionalSeams({state:s});
 assert.deepEqual(b.inlandSeams[0].xy,{x:68.1,y:43.8});
 assert.deepEqual(b.marketHarborAlternatives[0].penultimate,{x:68,y:36.9});
 assert.equal(JSON.stringify(s),before);
});

test('audit never promotes candidate roads to story actions or changes the played turn',()=>{
 const s=state(),v=inspectMeridianRegionalSeams({state:s});
 assert.equal(v.classification,'narrator_private_three_region_geometry_audit');
 assert.equal(v.sourceStatus,'historical_drafts_only_no_game_admission');
 assert.equal(v.requiresEditorialReview,true);
 assert.equal(v.playerMoved,false);
 assert.equal(v.npcMoved,false);
 assert.equal(v.fictionalTimeAdvanced,false);
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.world.locations[harbor].connected_ids.length,2);
 assert.equal(v.selectedPhysicalRoute,null);
});
