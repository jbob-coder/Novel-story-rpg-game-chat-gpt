import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preAdmissionStateForQA} from './helpers/meridian_bay_fixture.mjs';
import {prepareMeridianBayWorld,admitMeridianBayWorld,meridianBayDesign,
 verifyMeridianBayWorld,inspectPrebuiltMeridianBay} from '../tools/meridian_bay_locations.mjs';
const baseline=preAdmissionStateForQA(JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8')));
const sha='a'.repeat(40),design=meridianBayDesign();
const review={reviewed:true,source_commit:sha,design_id:design.world_design_id,
 reason:'Synthetic explicit review of the authored city design.'};
const admit=(state=baseline,designReview=review)=>admitMeridianBayWorld({state,designReview,
 observedHead:sha,nextTurn:10});

test('six authored sites connect to saved districts without changing people, time or knowledge',()=>{
 const before=JSON.stringify(baseline),prepared=prepareMeridianBayWorld({state:baseline});
 assert.equal(Object.keys(prepared.world.locations).length,15);
 assert.equal(design.places.filter(p=>p.parent_id==='LOC-RAILGARDEN-RESIDENTIAL').length,2);
 assert.equal(design.places.filter(p=>p.parent_id==='LOC-COMMERCIAL-DISTRICT').length,4);
 assert.deepEqual(prepared.player,baseline.player);
 assert.deepEqual(prepared.world.actors,baseline.world.actors);
 assert.deepEqual(prepared.time,baseline.time);
 for(const place of design.places){
  assert.deepEqual(prepared.world.locations[place.id],place);
  assert.ok(prepared.world.locations[place.parent_id].connected_ids.includes(place.id));
 }
 assert.deepEqual(prepareMeridianBayWorld({state:prepared}),prepared);
 assert.equal(JSON.stringify(baseline),before);
});

test('a prepared design is not an admitted checkpoint and stale or unreviewed admission fails',()=>{
 const prepared=prepareMeridianBayWorld({state:baseline});
 assert.throws(()=>verifyMeridianBayWorld(prepared),/admission required/);
 assert.throws(()=>admit(baseline,{...review,source_commit:'b'.repeat(40)}),/HEAD differs/);
 assert.throws(()=>admit(baseline,{...review,reviewed:false}),/admission required/);
 assert.throws(()=>admit(baseline,{...review,design_id:'OTHER-DESIGN'}),/admission required/);
 assert.equal(verifyMeridianBayWorld(baseline),true);
});

test('reviewed admission preserves original facts and is persistent without repeated adoption',()=>{
 const state=admit();
 assert.equal(verifyMeridianBayWorld(state),true);
 assert.equal(state.world.prebuilt_design_review.effective_from_turn,10);
 assert.deepEqual(admitMeridianBayWorld({state,observedHead:'b'.repeat(40),nextTurn:11}),state);
 assert.throws(()=>admit(state),/already admitted/);
 for(const [id,original] of Object.entries(baseline.world.locations)){
  const {connected_ids:oldLinks,...oldRest}=original;
  const {connected_ids:newLinks,...newRest}=state.world.locations[id];
  assert.deepEqual(newRest,oldRest);
  assert.deepEqual(newLinks?.filter(link=>!design.places.some(place=>place.id===link)),oldLinks);
 }
});

test('catalog conflicts, missing anchors and duplicate connections are rejected without mutation',()=>{
 const collision=structuredClone(baseline);
 collision.world.locations[design.places[0].id]={name:'Another place'};
 assert.throws(()=>prepareMeridianBayWorld({state:collision}),/conflicts/);
 const missing=structuredClone(baseline);
 delete missing.world.locations['LOC-COMMERCIAL-DISTRICT'];
 assert.throws(()=>prepareMeridianBayWorld({state:missing}),/district anchor/);
 const duplicate=admit(),parent=design.places[0].parent_id;
 duplicate.world.locations[parent].connected_ids.push(design.places[0].id);
 const before=JSON.stringify(duplicate);
 assert.throws(()=>verifyMeridianBayWorld(duplicate),/duplicated district/);
 assert.equal(JSON.stringify(duplicate),before);
});

test('readback rejects changed catalog/version while allowing a separately defined future place',()=>{
 const state=admit(),id=design.places[0].id;
 state.world.locations[id].name='Unexpected alteration';
 assert.throws(()=>verifyMeridianBayWorld(state),/altered authored/);
 const version=admit();version.world.prebuilt_design_id='OTHER';
 assert.throws(()=>verifyMeridianBayWorld(version),/design version/);
 const future=admit();future.world.locations['LOC-FUTURE-PLACE']={id:'LOC-FUTURE-PLACE',
  name:'Synthetic independent future design',connected_ids:[]};
 assert.equal(verifyMeridianBayWorld(future),true);
});

test('private design inspection separates existence from current access and does not invent encounters',()=>{
 const preview=inspectPrebuiltMeridianBay({state:baseline,fromId:baseline.player.location_id});
 assert.equal(preview.length,6);
 assert.ok(preview.every(place=>place.existsInDesign&&!place.existsInSavedWorld&&
  place.accessNow==='unknown'&&place.travelMinutes===null&&place.openingHours===null));
 assert.ok(preview.every(place=>place.route.at(-1)===place.locationId));
 assert.ok(inspectPrebuiltMeridianBay({state:admit()}).every(place=>place.existsInSavedWorld));
});
