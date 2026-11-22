import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 validateHarborAccessReconciliation,inspectHarborAccessReconciliation,
 inspectRouteAgainstCoast,renderHarborAccessReconciliationSvg,
 verifyHarborAccessReconciliationSvg
} from '../tools/meridian_bay_harbor_access_reconciliation.mjs';
import {validatePr67CoastCandidate} from '../tools/render_harbor_coast_pr67_candidate.mjs';

const raw=p=>readFileSync(new URL(p,import.meta.url));
const json=p=>JSON.parse(raw(p));
const state=()=>json('../game/STATE.json');
const coast=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json');
const overlay=()=>json('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json');
const route=(p)=>json('../docs/01_world/SOURCE_'+p+'_20261120.json').nodes.map(n=>n.xy);
const svg=()=>raw('../docs/01_world/MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.svg').toString('utf8');
const sha=b=>{const bytes=Buffer.from(b);return createHash('sha1')
 .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');};
const expectGeometry=out=>{
 assert.equal(out.buildingCrossings.length,0);
 assert.equal(out.buildingInterior.length,0);
 assert.equal(out.freightCrossings.length,0);
 assert.equal(out.freightInterior.length,0);
 assert.equal(out.traceCrossings.length,0);
 assert.equal(out.coastCrossings.length,0);
 assert.ok(out.nearestCandidateBuildingDistance>0.2);
 assert.ok(out.nearestBlockedTraceDistance>0.18);
};
const renderedShapeMap=(tag)=>new Map([...svg().matchAll(new RegExp(
 '<'+tag+'\\s+points="([^"]+)"\\s+data-map-id="([^"]+)"','g'))]
 .map(m=>[m[2],m[1].split(/\s+/).map(x=>x.split(',').map(Number))]));
const xy=p=>[80+(p.x-58)*60,96+(43-p.y)*60];
function compareGraphic(map,id,shape){
 const pts=map.get(id);
 assert.ok(pts,id+' feature absent from SVG');
 assert.equal(pts.length,shape.length,id+' point count');
 for(let i=0;i<shape.length;i++){
  const expected=xy(shape[i]);
  for(let j=0;j<2;j++)assert.ok(Number.isFinite(pts[i][j])&&
   Math.abs(pts[i][j]-expected[j])<=0.051,
   id+' vertex '+i+' component '+j+' differs from JSON');
 }
}

test('actual immutable route and safer coast sources match historical Git blob SHAs',()=>{
 const sources=[
 ['SOURCE_PR44_MARKET_HARBOR_20261120.json','e8efe8e5f6a746ab4e628f76a9deb5f71061010d'],
 ['SOURCE_PR58_MARKET_HARBOR_20261120.json','280a444f6eed99a33027aea2edb48af70cc67bd0'],
 ['SOURCE_PR56_PLAZA_HARBOR_20261120.json','a5ac772922b4717797118b15f182207be1d1a7fb'],
 ['MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json','139c3687c98285aff886d28422544d082768217d']
 ];
 for(const [p,hash] of sources)assert.equal(
  sha(raw('../docs/01_world/'+p)),hash,p);
 assert.equal(validateHarborAccessReconciliation({state:state()}),true);
});

test('unchanged historical PR44 approaches blocked trace but avoids freight candidate zone',()=>{
 const out=inspectRouteAgainstCoast(route('PR44_MARKET_HARBOR'));
 assert.equal(out.traceCrossings.length,1);
 assert.equal(out.freightCrossings.length,0);
 assert.equal(out.freightInterior.length,0);
 assert.equal(out.buildingCrossings.length,0);
});

test('historical PR58 candidate crosses both blocked trace and freight zone',()=>{
 const out=inspectRouteAgainstCoast(route('PR58_MARKET_HARBOR'));
 assert.equal(out.traceCrossings.length,1);
 assert.equal(out.freightCrossings.length,2);
 assert.deepEqual(out.freightInterior,[4]);
 assert.equal(out.buildingCrossings.length,0);
});

test('historical PR56 Plaza-to-Harbor route intersects candidate building HC-B-01 twice',()=>{
 const out=inspectRouteAgainstCoast(route('PR56_PLAZA_HARBOR'));
 assert.deepEqual(out.buildingCrossings.map(x=>x.id),['HC-B-01','HC-B-01']);
 assert.equal(out.traceCrossings.length,0);
 assert.equal(out.coastCrossings.length,0);
});

test('reviewed PR44 inserts exactly one noncanonical waypoint at (69,37.6)',()=>{
 const plan=overlay(),before=json('../docs/01_world/SOURCE_PR44_MARKET_HARBOR_20261120.json');
 const target=plan.market_to_harbor.nodes;
 assert.equal(target.length,before.nodes.length+1);
 assert.deepEqual(target.slice(0,-2),before.nodes.slice(0,-1).map(n=>({id:n.id,xy:n.xy})));
 assert.deepEqual(target.at(-2),{id:'MB-MH-REVIEW-BEND-20261122',xy:{x:69,y:37.6}});
 assert.deepEqual(target.at(-1),{id:'MB-MH-N4',xy:{x:71,y:37}});
 assert.deepEqual(plan.market_to_harbor.local_coast_tail_overlay.points,
  [{x:69,y:37.6},{x:71,y:37}]);
 expectGeometry(inspectRouteAgainstCoast(target.map(x=>x.xy)));
});

test('reviewed PR56 replaces only the position of intermediate MB-PH-N2',()=>{
 const source=json('../docs/01_world/SOURCE_PR56_PLAZA_HARBOR_20261120.json');
 const proposed=overlay().plaza_to_harbor.nodes;
 assert.equal(proposed.length,source.nodes.length);
 for(let i=0;i<source.nodes.length;i++){
  assert.equal(proposed[i].id,source.nodes[i].id);
  if(source.nodes[i].id!=='MB-PH-N2')assert.deepEqual(proposed[i].xy,source.nodes[i].xy);
 }
 assert.deepEqual(source.nodes[2].xy,{x:68.9,y:39.15});
 assert.deepEqual(proposed[2].xy,{x:68.3,y:38.1});
 expectGeometry(inspectRouteAgainstCoast(proposed.map(x=>x.xy)));
});

test('adjusting Harbor Walk market tail changes only detached overlay, not PR89 coast source',()=>{
 const s=state(),a=overlay(),f=coast();
 const original=f.street_alignments.find(x=>x.id==='HC-A-MARKET');
 assert.deepEqual(original.points,[{x:69.5,y:36.7},{x:71,y:37}]);
 assert.deepEqual(a.market_to_harbor.local_coast_tail_overlay.source_coast_pr67_tail,
  original.points);
 assert.equal(a.market_to_harbor.local_coast_tail_overlay.changed_only_in_this_overlay,true);
 assert.equal(validatePr67CoastCandidate({state:s}),true);
 assert.equal(validateHarborAccessReconciliation({state:s}),true);
});

test('composed draft routes have no strict unregistered crossings before harbor',()=>{
 const v=inspectHarborAccessReconciliation({state:state()});
 assert.equal(v.marketComparison.preferredForLocalSketch,44);
 assert.equal(v.marketComparison.canonicalRouteSelected,false);
 assert.equal(v.plazaComparison.canonicalRouteSelected,false);
 expectGeometry(v.marketComparison.reviewed44Detour);
 expectGeometry(v.plazaComparison.reviewed56Detour);
});

test('both new review approaches retain real, bidirectional original graph edges',()=>{
 const s=state(),p=overlay();
 for(const section of [p.market_to_harbor,p.plaza_to_harbor]){
  const {from,to,existing}=section.source_graph_link;
  assert.equal(existing,true);
  assert.ok(s.world.locations[from].connected_ids.includes(to));
  assert.ok(s.world.locations[to].connected_ids.includes(from));
  assert.deepEqual(section.nodes.at(-1).xy,{x:71,y:37});
 }
 assert.deepEqual(inspectHarborAccessReconciliation({state:s}).newSavedEdges,[]);
});

test('SVG is an exact reproducible function of reviewed JSON and immutable sources',()=>{
 const s=state();
 assert.equal(verifyHarborAccessReconciliationSvg({state:s}),true);
 assert.equal(svg(),renderHarborAccessReconciliationSvg({state:s}));
 assert.equal(renderHarborAccessReconciliationSvg({state:s}),
  renderHarborAccessReconciliationSvg({state:s}));
});

test('all eight overview SVG polygons correspond to exactly the source geometries',()=>{
 const map=renderedShapeMap('polygon'),f=coast();
 assert.equal(map.size,8);
 compareGraphic(map,'HC-WATER',[
  ...f.proposed_coast.shoreline,{x:77,y:42},{x:77,y:32}]);
 compareGraphic(map,'HC-Z-FREIGHT',f.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon);
 for(const b of f.building_footprints)compareGraphic(map,b.id,b.polygon);
});

test('all eight historical/candidate SVG polylines correspond to source JSON coordinates',()=>{
 const map=renderedShapeMap('polyline'),f=coast(),p=overlay();
 assert.equal(map.size,8);
 compareGraphic(map,'HC-COAST',f.proposed_coast.shoreline);
 compareGraphic(map,'HC-A-OLDTRACE',f.street_alignments.find(x=>x.id==='HC-A-OLDTRACE').points);
 compareGraphic(map,'SOURCE-PR44',route('PR44_MARKET_HARBOR'));
 compareGraphic(map,'SOURCE-PR58',route('PR58_MARKET_HARBOR'));
 compareGraphic(map,'SOURCE-PR56',route('PR56_PLAZA_HARBOR'));
 compareGraphic(map,'REVIEW-MARKET',p.market_to_harbor.nodes.map(x=>x.xy));
 compareGraphic(map,'REVIEW-PLAZA',p.plaza_to_harbor.nodes.map(x=>x.xy));
 compareGraphic(map,'REVIEW-MARKET-TAIL',p.market_to_harbor.local_coast_tail_overlay.points);
});

test('SVG visibly declares that no usable, surveyed or canonical route has been established',()=>{
 const text=svg();
 assert.ok(text.includes('NO CANÓNICAS'));
 assert.ok(text.includes('SIN CANON'));
 assert.ok(text.includes('NO VERIFICADOS.'));
 assert.ok(text.includes('data-admitted="false"'));
 assert.ok(text.includes('data-story-action="false"'));
 assert.ok(text.includes('PR58 alternativo'));
 assert.ok(!text.includes('data-admitted="true"'));
});

test('forged waypoints and route-tail mismatch are rejected before map admission',()=>{
 const s=state(),p=overlay();
 p.market_to_harbor.nodes.at(-2).xy={x:69.5,y:36.7};
 assert.throws(()=>validateHarborAccessReconciliation({state:s,candidate:p}),
  /Unreviewed waypoint insertion/);
 const q=overlay();
 q.market_to_harbor.local_coast_tail_overlay.points[0]={x:69.5,y:36.7};
 assert.throws(()=>validateHarborAccessReconciliation({state:s,candidate:q}),
  /Coast01 route tails/);
});

test('attempted canonical promotion, missing link and forged source are fail-closed',()=>{
 const s=state(),p=overlay();
 p.limitations.no_new_saved_graph_edge=false;
 assert.throws(()=>validateHarborAccessReconciliation({state:s,candidate:p}),
  /incorrectly admitted/);
 const q=overlay();q.historical_sources.market_44.blob='fake';
 assert.throws(()=>validateHarborAccessReconciliation({state:s,candidate:q}),
  /provenance mismatch/);
 const changed=state();
 changed.world.locations['LOC-HARBOR-WALK'].connected_ids=
  changed.world.locations['LOC-HARBOR-WALK'].connected_ids.filter(
   x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateHarborAccessReconciliation({state:changed}));
});

test('checkpoint remains frozen during repeated read-only regional diagnosis',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=inspectHarborAccessReconciliation({state:s});
 a.reviewedOverlayMarketTail.points[0].x=999;
 const b=inspectHarborAccessReconciliation({state:s});
 assert.deepEqual(b.reviewedOverlayMarketTail.points[0],{x:69,y:37.6});
 assert.equal(b.savedGraphUnchanged,true);
 assert.equal(b.travelMinutes,null);
 assert.equal(b.certifiedAccess,false);
 assert.equal(b.requiresFullCityReview,true);
 assert.equal(b.playerMoved,false);
 assert.equal(b.npcMoved,false);
 assert.equal(b.fictionalTimeAdvanced,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});
