import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
 countHarborShorelineIntersections,validateHarborCoastFragment,
 inspectHarborCoastFragment,previewHarborCoastSavedTail
} from '../tools/meridian_bay_harbor_coast_review.mjs';

const raw=path=>readFileSync(new URL(path,import.meta.url));
const read=path=>JSON.parse(raw(path));
const state=()=>read('../game/STATE.json');
const original=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
const revised=()=>read('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_REVIEW_20261120.json');
const harbor='LOC-HARBOR-WALK',market='LOC-COMMERCIAL-DISTRICT',plaza='LOC-CROSSWATER-PLAZA';

test('original historic PR66 geometry has exact Git blob identity',()=>{
 const contents=raw('../docs/01_world/MERIDIAN_BAY_HARBOR_COAST_FRAGMENT_01_20261117.json');
 const sha=createHash('sha1').update(Buffer.from('blob '+contents.length+'\0')).update(contents).digest('hex');
 assert.equal(sha,'81ef8da51951205394ba050fe6f867bfc00d7244');
 assert.equal(original().status,'editable_fragment_draft_not_admitted_to_saved_world');
 assert.equal(revised().review_2026_11_20.historical_head_sha,
  'd5f8af27779aa49ecfa082e091f6bb57308a146a');
});

test('coastal patch crossing defect is exactly reproduced then eliminated in reviewed draft',()=>{
 const baseline=original(),adapted=revised();
 const origCross=countHarborShorelineIntersections(baseline);
 assert.equal(origCross.length,2);
 assert.ok(origCross.every(x=>x.shapeId==='HC-Z-FREIGHT'));
 assert.deepEqual(countHarborShorelineIntersections(adapted),[]);
 assert.equal(validateHarborCoastFragment({state:state()}),true);
});

test('only two freight-zone control vertices differ from the immutable draft',()=>{
 const before=original(),after=revised();
 const s=after.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT');
 assert.deepEqual(s.polygon.slice(3,5),[{x:71.8,y:34.6},{x:72.02,y:35.1}]);
 const check=structuredClone(after);delete check.review_2026_11_20;
 check.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon=
  structuredClone(before.land_use_patches.find(x=>x.id==='HC-Z-FREIGHT').polygon);
 assert.deepEqual(check,before);
 assert.equal(s.polygon.length,9);
});

test('source coastline remains provisional, non-geographic and open at both future seams',()=>{
 const s=state(),p=revised(),before=JSON.stringify(s);
 const view=inspectHarborCoastFragment({state:s});
 assert.equal(p.study_box.north_unknown,true);
 assert.equal(p.study_box.canvas,'fictional_100x80_not_real_measurement');
 assert.equal(p.proposed_coast.real_shoreline_verified,false);
 assert.equal(view.coastlineVerified,false);
 assert.equal(view.cardinalDirectionVerified,false);
 assert.equal(view.detailedRoadsVerified,false);
 assert.equal(view.requiresEditorialReview,true);
 assert.deepEqual([view.shorelineVertices,view.landUsePatches,
  view.candidateBuildings,view.candidateStreetAlignments],[16,4,6,6]);
 assert.equal(p.assembly_seams.length,4);
 assert.equal(JSON.stringify(s),before);
});

test('opt-in draft geometry is detached, not exposed by default or persisted',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.equal('geometry' in inspectHarborCoastFragment({state:s}),false);
 const view=inspectHarborCoastFragment({state:s,includeDraftGeometry:true});
 assert.equal(view.geometry.proposed_coast.shoreline.length,16);
 assert.equal(view.geometry.land_use_patches.length,4);
 assert.equal(view.geometry.building_footprints.length,6);
 assert.equal(view.geometry.street_alignments.length,6);
 view.geometry.proposed_coast.shoreline[0].x=999;
 view.geometry.building_footprints[0].polygon[0].x=999;
 const next=inspectHarborCoastFragment({state:s,includeDraftGeometry:true});
 assert.notEqual(next.geometry.proposed_coast.shoreline[0].x,999);
 assert.notEqual(next.geometry.building_footprints[0].polygon[0].x,999);
 assert.equal(JSON.stringify(s),before);
});

test('saved graph has exactly two supported separate tails into Harbor Walk',()=>{
 const s=state(),before=JSON.stringify(s);
 const a=previewHarborCoastSavedTail({state:s,fromId:market});
 const b=previewHarborCoastSavedTail({state:s,fromId:plaza});
 assert.equal(a.status,'known_graph_edge_provisional_geometry');
 assert.equal(b.status,'known_graph_edge_provisional_geometry');
 assert.equal(a.graphLinkExists,true);
 assert.equal(b.graphLinkExists,true);
 assert.equal(a.authoredTailId,'HC-A-MARKET');
 assert.equal(b.authoredTailId,'HC-A-PLAZA');
 assert.deepEqual(a.draftPolyline,[{x:69.5,y:36.7},{x:71,y:37}]);
 assert.deepEqual(b.draftPolyline,[{x:70.1,y:37.85},{x:71,y:37}]);
 assert.notDeepEqual(a.draftPolyline,b.draftPolyline);
 for(const r of [a,b]){
  assert.equal(r.toId,harbor);
  assert.equal(r.noRouteConflictResolution,true);
  assert.equal(r.canonicalNavigationAuthorized,false);
  assert.equal(r.travelTimeMinutes,null);
  assert.equal(r.streetAccessVerified,false);
  assert.equal(r.playerMoved,false);
  assert.equal(r.npcMoved,false);
  assert.equal(r.fictionalTimeAdvanced,false);
  assert.equal(r.requiresPlayerAction,true);
 }
 assert.equal(JSON.stringify(s),before);
});

test('two physical route tails are unmerged candidate geometries, never route authorization',()=>{
 const v=inspectHarborCoastFragment({state:state()});
 assert.equal(v.marketTail,'unmerged_competing_geometry');
 assert.equal(v.plazaTail,'unmerged_draft_geometry');
 assert.deepEqual(v.existingSavedEdgesOnly,[[market,harbor],[plaza,harbor]]);
 assert.deepEqual(v.newlyAuthorizedEdges,[]);
 assert.equal(v.actualWalkingMinutes,null);
 assert.equal(v.accessCertification,null);
 assert.equal(v.canonicalNavigationAuthorized,false);
 assert.equal(v.actionCompleted,false);
});

test('unknown origin, proposed ferry, or street marker cannot become a route',()=>{
 const s=state();
 for(const fromId of ['HC-A-WALK','MB-MH-N4','LOC-PORT-GATE-UNMAPPED',
  'LOC-WILSON-WORKSHOP',null]){
  const r=previewHarborCoastSavedTail({state:s,fromId});
  assert.equal(r.status,'no_supported_tail');
  assert.equal(r.graphLinkExists,false);
  assert.equal(r.draftPolyline,null);
  assert.equal(r.authoredTailId,null);
  assert.equal(r.canonicalNavigationAuthorized,false);
 }
});

test('removing either direction of saved Market/Plaza Harbor connections fails closed',()=>{
 for(const [from,to] of [[harbor,market],[market,harbor],[harbor,plaza],[plaza,harbor]]){
  const s=state();
  s.world.locations[from].connected_ids=s.world.locations[from].connected_ids.filter(id=>id!==to);
  assert.throws(()=>validateHarborCoastFragment({state:s}),
   /Saved Harbor Walk connections are missing or duplicated/);
 }
});

test('duplicating either arrival edge is rejected as inconsistent saved-world graph',()=>{
 for(const [from,to] of [[harbor,market],[market,harbor],[harbor,plaza],[plaza,harbor]]){
  const s=state();s.world.locations[from].connected_ids.push(to);
  assert.throws(()=>inspectHarborCoastFragment({state:s}),
   /Saved Harbor Walk connections are missing or duplicated/);
 }
});

test('a changed Harbor Walk anchor cannot silently rewrite the saved map',()=>{
 const s=state(),p=read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');
 assert.deepEqual(p.locations.find(x=>x.id===harbor).reference_xy_units,{x:71,y:37});
 s.world.locations[harbor].id='LOC-FORGED-COAST';
 assert.throws(()=>validateHarborCoastFragment({state:s}),/Harbor and saved-player identities must exist/);
});

test('missing world, corrupt player location and unsupported geometry flag fail closed',()=>{
 assert.throws(()=>inspectHarborCoastFragment({}),/saved world and player/);
 const s=state();s.player.location_id='LOC-UNSAVED-PIER';
 assert.throws(()=>validateHarborCoastFragment({state:s}),/Harbor and saved-player identities must exist/);
 assert.throws(()=>inspectHarborCoastFragment({state:state(),includeDraftGeometry:'yes'}),
  /Invalid geometry inclusion switch/);
});

test('six candidate footprints are not established buildings or site ownership',()=>{
 const p=revised(),s=state(),before=JSON.stringify(s);
 assert.ok(p.building_footprints.every(x=>x.status==='candidate_only_not_established'));
 assert.ok(p.land_use_patches.every(x=>x.status==='provisional'));
 assert.ok(p.street_alignments.every(x=>x.registered_as_new_story_link===false));
 assert.equal(p.limits.no_building_ownership_or_tenant_facts,true);
 assert.equal(p.limits.no_confirmed_port_gate_berth_or_pier,true);
 assert.equal(p.limits.not_all_city_or_complete_harbor,true);
 assert.equal(validateHarborCoastFragment({state:s}),true);
 assert.equal(JSON.stringify(s),before);
});

test('archived SVG stays explicitly historical, not the corrected authoritative drawing',()=>{
 const p=revised();
 assert.equal(p.review_2026_11_20.approval.startsWith('not_admitted'),true);
 assert.equal(p.review_2026_11_20.source_market_tail_dependency.includes('#58'),true);
 assert.equal(p.review_2026_11_20.source_plaza_tail_dependency.includes('#56'),true);
 assert.equal(p.review_2026_11_20.historical_json_blob_sha,
  '81ef8da51951205394ba050fe6f867bfc00d7244');
 // The historical SVG is preserved on PR #66. The corrected JSON has no
 // promoted SVG/road authority; a new image needs a separately verified render.
 assert.equal(p.status,'editable_fragment_draft_not_admitted_to_saved_world');
});

test('source validation does not change played chapter, player position or fiction time',()=>{
 const s=state(),before=JSON.stringify(s);
 const preview=inspectHarborCoastFragment({state:s,includeDraftGeometry:true});
 assert.equal(preview.playerMoved,false);
 assert.equal(preview.npcMoved,false);
 assert.equal(preview.fictionalTimeAdvanced,false);
 assert.equal(preview.actionCompleted,false);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.equal(s.pending.type,'await_player_action');
 assert.equal(JSON.stringify(s),before);
});
