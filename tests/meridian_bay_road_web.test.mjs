import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectMeridianBayRoadWeb,previewMeridianBayRoadWeb,
 validateMeridianBayRoadWeb} from '../tools/meridian_bay_road_web.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const state=()=>read('../game/STATE.json');
const data=()=>read('../docs/01_world/MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json');

test('first street web validates without changing canonical state',()=>{
 const s=state(),before=JSON.stringify(s);
 assert.equal(validateMeridianBayRoadWeb({state:s}),true);
 const view=inspectMeridianBayRoadWeb({state:s});
 assert.equal(view.classification,'narrator_private_street_geometry_draft');
 assert.equal(view.status,'draft_review_only');
 assert.equal(view.segments.length,6);
 assert.equal(view.origin,'LOC-RAILGARDEN-RESIDENTIAL');
 assert.equal(view.noSavedWorldMutation,true);
 assert.equal(view.noApprovedRoadDistance,true);
 assert.equal(JSON.stringify(s),before);
});

test('Railgarden to Market Row spine branches without inventing shortcuts',()=>{
 const s=state();
 const view=inspectMeridianBayRoadWeb({state:s});
 const edge=view.segments.find(x=>x.id==='MB-WEB-002');
 assert.deepEqual([edge.from_id,edge.to_id],
  ['LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT']);
 assert.deepEqual(
  previewMeridianBayRoadWeb({state:s,
   fromId:'LOC-WILSON-APARTMENT',toId:'LOC-CAFE-BRUMA'}).routeIds,
  ['LOC-WILSON-APARTMENT','LOC-RAILGARDEN-RESIDENTIAL',
   'LOC-COMMERCIAL-DISTRICT','LOC-CAFE-BRUMA']);
 assert.deepEqual(
  previewMeridianBayRoadWeb({state:s,
   fromId:'LOC-RAILGARDEN-CLINIC',toId:'LOC-MARKET-NOAH-REPAIR'}).routeIds,
  ['LOC-RAILGARDEN-CLINIC','LOC-RAILGARDEN-RESIDENTIAL',
   'LOC-COMMERCIAL-DISTRICT','LOC-MARKET-NOAH-REPAIR']);
});

test('mapping never grants travel, discovery, time, business access or canon',()=>{
 const s=state(),before=JSON.stringify(s);
 const x=previewMeridianBayRoadWeb({state:s,
  fromId:'LOC-RAILGARDEN-ABARROTES',toId:'LOC-MARKET-NOAH-REPAIR'});
 assert.equal(x.status,'proposed_connected');
 assert.equal(x.usableForCanonicalTravel,false);
 assert.equal(x.referenceDistanceKm,null);
 assert.equal(x.walkingMinutes,null);
 assert.equal(x.openingHours,null);
 assert.equal(x.playerMoved,false);
 assert.equal(x.fictionalTimeAdvanced,false);
 assert.equal(x.playerKnowledgeChanged,false);
 assert.equal(x.admissionAuthorized,false);
 assert.equal(JSON.stringify(s),before);
 assert.equal(data().authority,'proposed_street_geometry_not_saved_canon');
});

test('only authored connections are usable in this first sketch slice',()=>{
 const s=state();
 const x=previewMeridianBayRoadWeb({state:s,
  fromId:'LOC-RAILGARDEN-RESIDENTIAL',toId:'LOC-CROSSWATER-PLAZA'});
 assert.equal(x.status,'outside_draft_slice');
 assert.equal(x.routeIds,null);
 const school=previewMeridianBayRoadWeb({state:s,
  fromId:'LOC-WILSON-APARTMENT',toId:'LOC-SCHOOL-UNMAPPED'});
 assert.equal(school.routeIds,null);
});

test('a missing authoritative link fails closed, even though coordinates exist',()=>{
 const s=state(),district='LOC-RAILGARDEN-RESIDENTIAL';
 s.world.locations[district].connected_ids=
  s.world.locations[district].connected_ids.filter(x=>x!=='LOC-COMMERCIAL-DISTRICT');
 assert.throws(()=>validateMeridianBayRoadWeb({state:s}),
  /Unverified road or invented shortcut/);
});

test('the interior workshop is deliberately not a street vertex',()=>{
 const s=state();
 assert.equal(previewMeridianBayRoadWeb({state:s,
  fromId:'LOC-WILSON-WORKSHOP',toId:'LOC-CAFE-BRUMA'}).routeIds,null);
 const d=data();
 assert.ok(!d.segments.some(e=>
  [e.from_id,e.to_id].includes('LOC-WILSON-WORKSHOP')));
 assert.equal(d.hard_limits.no_story_actions,true);
 assert.equal(d.hard_limits.no_new_location_ids,true);
 assert.equal(d.hard_limits.no_new_graph_links,true);
});
