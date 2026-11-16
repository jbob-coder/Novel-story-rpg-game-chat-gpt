// Synthetic observation histories only; no story file is written.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {admitMeridianBayWorld,meridianBayDesign} from '../tools/meridian_bay_locations.mjs';
import {applyReviewedPlaceDiscovery,inspectSceneEstablishedPlaces,
 verifyReviewedPlaceHistory} from '../tools/meridian_bay_discovery.mjs';
import {applyStateChanges} from '../tools/state_changes.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const baseline={state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')};
const id='LOC-MARKET-NOAH-REPAIR',parent='LOC-COMMERCIAL-DISTRICT';
const scene='SYNTHETIC: a repair shop frontage is visible along Market Row.';
const access='SYNTHETIC: its public entrance faces the district sidewalk.';
const observed=(overrides={})=>({id,observed_from:parent,reviewed:true,
 public_access_confirmed:true,scene_quote:scene,access_quote:access,...overrides});
const route=['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
 'LOC-RAILGARDEN-RESIDENTIAL',parent];

function fixture(){
 const snapshot=structuredClone(baseline);
 snapshot.state=admitMeridianBayWorld({state:snapshot.state,observedHead:'a'.repeat(40),nextTurn:10,
  designReview:{reviewed:true,design_id:meridianBayDesign().world_design_id,
   source_commit:'a'.repeat(40),reason:'Synthetic editorial admission for observation QA.'}});
 return snapshot;
}
function eventFor(snapshot){
 const event={id:'EV-'+String(snapshot.events.events.length+1).padStart(6,'0'),
  chapter_id:snapshot.manifest.chapter_id,turn:10,kind:'player_action',
  actor_ids:[snapshot.state.player.id],known_to:[snapshot.state.player.id],state_changes:[]};
 snapshot.events.events.push(event);
 return event;
}
function move(snapshot,event,after,path){
 applyStateChanges(snapshot.state,event,[{field:'location_id',before:snapshot.state.player.location_id,
  after,route:path}]);
}
function describe(snapshot,event,observations=[observed()]){
 applyReviewedPlaceDiscovery({state:snapshot.state,event,discoveries:observations,
  narrationMessages:[scene,access]});
 snapshot.transcript.entries.push({id:'TXT-000021',chapter_id:event.chapter_id,
  turn:event.turn,role:'assistant',event_ids:[event.id],text:scene+'\n'+access});
}
function witnessed(){
 const snapshot=fixture(),event=eventFor(snapshot);
 move(snapshot,event,parent,route);describe(snapshot,event);
 return snapshot;
}

test('the world catalog does not grant observations, visits or player knowledge',()=>{
 const snapshot=fixture(),before=JSON.stringify(snapshot);
 assert.deepEqual(inspectSceneEstablishedPlaces({snapshot}),[]);
 assert.equal(JSON.stringify(snapshot),before);
 assert.deepEqual(snapshot.state.player.knowledge,baseline.state.player.knowledge);
});

test('a shop cannot be witnessed while Jack remains in his workshop',()=>{
 const snapshot=fixture(),event=eventFor(snapshot),before=JSON.stringify(snapshot);
 assert.throws(()=>describe(snapshot,event),/not at the recorded observation position/);
 assert.equal(JSON.stringify(snapshot),before);
});

test('observation evidence cannot be backdated before world admission',()=>{
 const snapshot=witnessed();
 snapshot.state.world.prebuilt_design_review.effective_from_turn=11;
 assert.throws(()=>verifyReviewedPlaceHistory(snapshot),/predate world design/);
});

test('a district-frontage observation grants knowledge without inventing a visit or opening',()=>{
 const snapshot=witnessed();
 assert.equal(verifyReviewedPlaceHistory(snapshot),true);
 const [place]=inspectSceneEstablishedPlaces({snapshot,fromId:parent});
 assert.equal(place.locationId,id);
 assert.equal(place.evidenceEventId,'EV-000030');
 assert.deepEqual(place.evidenceEventIds,['EV-000030']);
 assert.equal(place.visited,false);
 assert.deepEqual(place.visitEventIds,[]);
 assert.equal(place.accessNow,'unknown');
 assert.deepEqual(place.route,[parent,id]);
 assert.equal(snapshot.state.player.location_id,parent);
 const change=snapshot.events.events.at(-1).state_changes.at(-1);
 assert.equal(change.place_observation.observed_from,parent);
 assert.ok(change.after.endsWith('; EV-000030)'));
});

test('a later actual arrival records a visit without manufacturing another discovery',()=>{
 const snapshot=witnessed(),event=eventFor(snapshot);event.turn=11;
 move(snapshot,event,id,[parent,id]);
 const [place]=inspectSceneEstablishedPlaces({snapshot});
 assert.equal(place.visited,true);
 assert.deepEqual(place.visitEventIds,['EV-000031']);
 assert.deepEqual(place.evidenceEventIds,['EV-000030']);
 assert.equal(place.accessNow,'unknown');
});

test('a recorded route can support an observation even if Jack ends elsewhere',()=>{
 const snapshot=fixture(),event=eventFor(snapshot);
 move(snapshot,event,'LOC-CROSSWATER-PLAZA',[...route,'LOC-CROSSWATER-PLAZA']);
 describe(snapshot,event);
 assert.equal(verifyReviewedPlaceHistory(snapshot),true);
 assert.equal(inspectSceneEstablishedPlaces({snapshot})[0].visited,false);
});

test('a failed observation batch leaves knowledge and history unchanged',()=>{
 const snapshot=fixture(),event=eventFor(snapshot);move(snapshot,event,parent,route);
 const before=JSON.stringify(snapshot);
 assert.throws(()=>describe(snapshot,event,[observed(),observed({id:'LOC-UNAPPROVED-SHOP'})]),
  /preexisting admitted/);
 assert.equal(JSON.stringify(snapshot),before);
});

test('unreviewed observations, absent quotes and unsupported positions are rejected',()=>{
 for(const [overrides,message] of [
  [{reviewed:false},/Reviewed/],
  [{observed_from:'LOC-WILSON-WORKSHOP'},/place or its district/],
  [{scene_quote:'SYNTHETIC: a different unseen shop frontage.'},/literally/],
  [{anchor_id:'LOC-HARBOR-WALK'},/district disagrees/]
 ]){
  const snapshot=fixture(),event=eventFor(snapshot);move(snapshot,event,parent,route);
  assert.throws(()=>describe(snapshot,event,[observed(overrides)]),message);
 }
});

test('historical observations require structured metadata and exact linked transcript evidence',()=>{
 for(const mutate of [
  snapshot=>{delete snapshot.events.events.at(-1).state_changes.at(-1).place_observation;},
  snapshot=>{snapshot.events.events.at(-1).state_changes.at(-1).source='An invented explanation';},
  snapshot=>{snapshot.transcript.entries.at(-1).event_ids=[];},
  snapshot=>{snapshot.transcript.entries.at(-1).text='SYNTHETIC: no relevant observation here.';},
  snapshot=>{snapshot.events.events.at(-1).state_changes.at(-1).place_observation.observed_from=id;}
 ]){
  const snapshot=witnessed();mutate(snapshot);
  assert.throws(()=>verifyReviewedPlaceHistory(snapshot),/observation|Observation|Jack was not/);
 }
});

test('knowledge prefixes without an observation event cannot manufacture known places',()=>{
 const snapshot=fixture();
 snapshot.state.player.knowledge.push('Observed public access at '+id+' (source: invented; EV-000001)');
 assert.throws(()=>inspectSceneEstablishedPlaces({snapshot}),/lacks structured event evidence/);
});

test('observations retain archived event and transcript evidence after a chapter boundary',()=>{
 const snapshot=witnessed();
 snapshot.state.history.completed_chapters=[{id:'CH-000'}];
 snapshot.archives={'CH-000':{events:snapshot.events,transcript:snapshot.transcript,
  chapter:snapshot.chapter}};
 snapshot.events={chapter_id:'CH-001',events:[]};
 snapshot.transcript={chapter_id:'CH-001',entries:[]};
 snapshot.manifest.chapter_id='CH-001';
 assert.equal(inspectSceneEstablishedPlaces({snapshot})[0].evidenceEventId,'EV-000030');
 snapshot.archives['CH-000'].transcript.entries.at(-1).text='SYNTHETIC erased testimony.';
 assert.throws(()=>verifyReviewedPlaceHistory(snapshot),/event-linked transcript/);
});
