import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateRailgardenMarketCorridor, previewRailgardenMarketCorridor,
 inspectRailgardenMarketCorridor} from '../tools/meridian_bay_rail_market_corridor.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL_20261116.json');

test('detailed segment subdivides the original Railgarden–Market link without modifying state',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 assert.equal(validateRailgardenMarketCorridor({state}),true);
 const p=plan(),base=read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');
 const parent=base.segments.find(x=>x.id==='MB-WEB-002');
 assert.deepEqual(p.nodes.map(x=>x.xy),[
  {x:48,y:44},...parent.via_xy_units,{x:58,y:43}
 ]);
 assert.equal(p.endpoints.from_location_id,parent.from_id);
 assert.equal(p.endpoints.to_location_id,parent.to_id);
 assert.equal(JSON.stringify(state),before);
});

test('the four linked parts are contiguous, with an adjacent frontage band on each',()=>{
 const state=checkpoint(),p=plan();
 const view=inspectRailgardenMarketCorridor({state});
 assert.equal(view.nodes.length,5);
 assert.equal(view.links.length,4);
 assert.equal(view.frontageBands.length,4);
 assert.deepEqual(p.links.map(x=>x.from),p.nodes.slice(0,-1).map(x=>x.id));
 assert.deepEqual(p.links.map(x=>x.to),p.nodes.slice(1).map(x=>x.id));
 assert.deepEqual(p.bands.map(x=>x.link_id),p.links.map(x=>x.id));
 assert.ok(p.bands.every(x=>x.relative_sides.A&&x.relative_sides.B));
 assert.ok(p.links.every(x=>x.estimated_minutes===null&&x.traffic_flow==='unknown'));
 assert.equal(view.nextSectionBlockedUntilReview,true);
});

test('a preview traverses every intermediate section in either direction',()=>{
 const state=checkpoint();
 const forward=previewRailgardenMarketCorridor({state,fromId:'MB-RM-N0',toId:'MB-RM-N4'});
 assert.equal(forward.status,'proposed_connected');
 assert.deepEqual(forward.nodeIds,['MB-RM-N0','MB-RM-N1','MB-RM-N2','MB-RM-N3','MB-RM-N4']);
 assert.deepEqual(forward.linkIds,['MB-RM-L1','MB-RM-L2','MB-RM-L3','MB-RM-L4']);
 assert.deepEqual(forward.frontageBands,['MB-RM-B1','MB-RM-B2','MB-RM-B3','MB-RM-B4']);
 const reverse=previewRailgardenMarketCorridor({state,fromId:'MB-RM-N4',toId:'MB-RM-N0'});
 assert.deepEqual(reverse.nodeIds,[...forward.nodeIds].reverse());
 assert.deepEqual(reverse.linkIds,[...forward.linkIds].reverse());
 assert.deepEqual(reverse.frontageBands,[...forward.frontageBands].reverse());
 assert.equal(forward.canonicalNavigationAuthorized,false);
 assert.equal(forward.playerMoved,false);
 assert.equal(reverse.fictionalTimeAdvanced,false);
 assert.equal(forward.walkingMinutes,null);
});

test('an unrelated or hypothetical street location cannot be used as an endpoint',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 const x=previewRailgardenMarketCorridor({state,fromId:'LOC-CROSSWATER-PLAZA',toId:'MB-RM-N1'});
 assert.equal(x.status,'outside_this_corridor');
 assert.equal(x.linkIds,null);
 const y=previewRailgardenMarketCorridor({state,fromId:'MB-RM-N2',toId:'LOC-CAFE-BRUMA'});
 assert.equal(y.status,'outside_this_corridor');
 assert.equal(JSON.stringify(state),before);
});

test('intermediate bends remain noncanonical and cannot become new saved-world locations',()=>{
 const p=plan(),state=checkpoint();
 assert.equal(p.nodes.filter(x=>x.location_id===null).length,3);
 assert.ok(p.nodes.slice(1,-1).every(x=>x.kind==='intermediate_geometry_node'));
 assert.ok(p.nodes.slice(1,-1).every(x=>!(x.id in state.world.locations)));
 assert.equal(p.coordinate_policy.confirmed_street_centerline,false);
 assert.equal(p.coordinate_policy.surveyed_road_right_of_way,false);
 assert.equal(p.coordinate_policy.true_cardinal_direction_known,false);
 assert.equal(p.review_gate.can_author_new_canonical_places,false);
 assert.equal(p.review_gate.may_advance_time,false);
});

test('story-consistent change from offices to Railgarden residences is source-backed',()=>{
 const p=plan();
 const chapter=readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8');
 assert.ok(chapter.includes(p.story_consistency.required_literal_fragment));
 assert.deepEqual(p.story_consistency.return_sequence,[
  'LOC-COMMERCIAL-DISTRICT','LOC-RAILGARDEN-RESIDENTIAL','LOC-WILSON-APARTMENT'
 ]);
 assert.match(p.bands[0].visual_character,/housing|shops/i);
 assert.match(p.bands[3].visual_character,/offices|commercial|delivery/i);
 assert.equal(p.story_consistency.no_retroactive_player_route,true);
});

test('missing baseline city connection is rejected, even with unchanged line geometry',()=>{
 const state=checkpoint();
 state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids
   .filter(id=>id!=='LOC-RAILGARDEN-RESIDENTIAL');
 assert.throws(()=>validateRailgardenMarketCorridor({state}),
  /Unverified road or invented shortcut|District road absent/);
});
