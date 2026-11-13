import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectMeridianBayScale,validateMeridianBayScalePlan,
 previewMeridianBayPlanningSpan} from '../tools/meridian_bay_scale_plan.mjs';
import {prepareMeridianBayWorld} from '../tools/meridian_bay_locations.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const checkpoint=()=>read('../game/STATE.json');
const plan=()=>read('../docs/01_world/MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json');

test('city reference canvas is roughly 10 x 8 km, not a surveyed municipal area',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 assert.equal(validateMeridianBayScalePlan({state}),true);
 const p=inspectMeridianBayScale({state});
 assert.equal(p.classification,'narrator_private_planning_hypothesis');
 assert.equal(p.isCanonicalDimension,false);
 assert.equal(p.envelope.illustrative_width_km,10);
 assert.equal(p.envelope.illustrative_height_km,8);
 assert.equal(p.envelope.illustrative_bounding_rectangle_km2,80);
 assert.equal(p.envelope.cardinal_orientation_confirmed,false);
 assert.equal(p.context.actual_city_area_km2,null);
 assert.equal(p.context.municipal_boundary_surveyed,false);
 assert.equal(p.context.shoreline_surveyed,false);
 assert.equal(p.context.population,null);
 assert.equal(JSON.stringify(state),before);
});
test('all eight saved locations and six preauthored sites are mapped once',()=>{
 const state=checkpoint(),p=inspectMeridianBayScale({state});
 const prepared=prepareMeridianBayWorld({state});
 const ids=p.districtReferences.map(x=>x.id);
 assert.equal(ids.length,14);
 assert.equal(new Set(ids).size,14);
 assert.deepEqual([...ids].sort(),
  Object.keys(prepared.world.locations).filter(id=>id.startsWith('LOC-')).sort());
 assert.equal(p.districtReferences.filter(x=>x.source==='checkpoint_location_anchor').length,8);
 assert.equal(p.districtReferences.filter(x=>x.source==='authored_prebuilt_catalog').length,6);
 const workshop=p.districtReferences.find(x=>x.id==='LOC-WILSON-WORKSHOP');
 const home=p.districtReferences.find(x=>x.id==='LOC-WILSON-APARTMENT');
 assert.deepEqual(workshop.reference_xy_units,home.reference_xy_units);
 assert.equal(workshop.physical_footprint_defined,false);
});
test('each prepared storefront stays inside its saved parent neighborhood',()=>{
 const state=checkpoint(),p=plan(),city=prepareMeridianBayWorld({state}).world.locations;
 for(const site of p.locations.filter(x=>x.parent_id)){
  assert.equal(site.parent_id,city[site.id].parent_id);
  assert.deepEqual(city[site.id].connected_ids,[site.parent_id]);
  assert.equal(city[site.parent_id].connected_ids.filter(id=>id===site.id).length,1);
  assert.ok(site.placement_uncertainty_units>0);
 }
 assert.equal(city['LOC-RAILGARDEN-RESIDENTIAL'].connected_ids.length,4);
 assert.equal(city['LOC-COMMERCIAL-DISTRICT'].connected_ids.length,8);
});
test('rough reference spans are not walking times, routes or a clock',()=>{
 const state=checkpoint(),before=JSON.stringify(state);
 const x=previewMeridianBayPlanningSpan({state,
  fromId:'LOC-RAILGARDEN-RESIDENTIAL',toId:'LOC-COMMERCIAL-DISTRICT'});
 assert.equal(x.classification,'illustrative_straight_line_span_not_route_length');
 assert.deepEqual([x.minimumReferenceKm,x.maximumReferenceKm],[0.4,1.6]);
 assert.deepEqual(x.routeIds,
  ['LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT']);
 assert.equal(x.roadDistanceKm,null);
 assert.equal(x.walkingMinutes,null);
 assert.equal(x.playerMoved,false);
 assert.equal(x.fictionalTimeElapsed,false);
 assert.equal(JSON.stringify(state),before);
});
test('nearby coordinates do not fabricate roads or shortcuts',()=>{
 const state=checkpoint();
 const p=previewMeridianBayPlanningSpan({state,
  fromId:'LOC-CAFE-BRUMA',toId:'LOC-MARKET-NOAH-REPAIR'});
 assert.deepEqual(p.routeIds,
  ['LOC-CAFE-BRUMA','LOC-COMMERCIAL-DISTRICT','LOC-MARKET-NOAH-REPAIR']);
 assert.equal(p.walkingMinutes,null);
 const w=previewMeridianBayPlanningSpan({state,
  fromId:'LOC-WILSON-WORKSHOP',toId:'LOC-RAILGARDEN-ABARROTES'});
 assert.deepEqual(w.routeIds,[
  'LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
  'LOC-RAILGARDEN-RESIDENTIAL','LOC-RAILGARDEN-ABARROTES']);
});
test('unmapped school, reserves and unknown destinations are never routable',()=>{
 const s=checkpoint(),p=inspectMeridianBayScale({state:s});
 assert.equal(p.unchartedRegions.length,5);
 assert.ok(p.unchartedRegions.every(r=>!r.id.startsWith('LOC-')));
 assert.equal(previewMeridianBayPlanningSpan({state:s,
  fromId:'LOC-WILSON-WORKSHOP',toId:'LOC-SCHOOL-UNMAPPED'}),null);
 assert.equal(previewMeridianBayPlanningSpan({state:s,
  fromId:'LOC-WILSON-WORKSHOP',toId:'MB-REG-NORTH'}),null);
 assert.equal(previewMeridianBayPlanningSpan({state:s,
  fromId:'CITY-MERIDIAN-BAY',toId:'LOC-HARBOR-WALK'}),null);
});
test('planned coordinates are nongeographic and never grant player knowledge',()=>{
 const s=checkpoint(),before=JSON.stringify(s);
 const p=inspectMeridianBayScale({state:s});
 assert.equal(p.fictionTimeElapsed,false);
 assert.equal(p.playerMoved,false);
 assert.equal(p.requiresEditorialReview,true);
 assert.equal(p.context.world_coordinates,null);
 assert.equal(p.envelope.measurement_accuracy,'illustrative_only');
 assert.equal(p.districtReferences.every(x=>x.physical_footprint_defined===false),true);
 assert.ok(!('playerKnowledge' in p));
 assert.equal(JSON.stringify(s),before);
});
test('invalid or absent state cannot be treated as a verified city scale',()=>{
 assert.throws(()=>validateMeridianBayScalePlan({state:{}}),
  /Saved world state is required/);
 assert.throws(()=>inspectMeridianBayScale({}),
  /Saved world state is required/);
 const invalid=checkpoint();delete invalid.world.locations['LOC-CROSSWATER-PLAZA'];
 assert.throws(()=>validateMeridianBayScalePlan({state:invalid}),
  /does not match the prepared location set|Saved city state|required|district anchor/);
});

test('five neighborhood study envelopes surround known hubs but are not boundaries',()=>{
 const s=checkpoint(),p=inspectMeridianBayScale({state:s});
 assert.equal(p.studyNeighborhoodEnvelopes.length,5);
 const byId=Object.fromEntries(p.studyNeighborhoodEnvelopes.map(x=>[x.location_id,x]));
 assert.equal(byId['LOC-RAILGARDEN-RESIDENTIAL'].rough_envelope_km.width,1.0);
 assert.equal(byId['LOC-RAILGARDEN-RESIDENTIAL'].rough_envelope_km.height,1.4);
 assert.equal(byId['LOC-COMMERCIAL-DISTRICT'].rough_envelope_km.width,0.9);
 assert.equal(byId['LOC-COMMERCIAL-DISTRICT'].rough_envelope_km.height,1.1);
 assert.ok(p.studyNeighborhoodEnvelopes.every(x=>x.boundary_confirmed===false));
 assert.equal('LOC-WILSON-WORKSHOP' in byId,false);
 assert.equal('LOC-SCHOOL-UNMAPPED' in byId,false);
 assert.equal(validateMeridianBayScalePlan({state:s}),true);
});
