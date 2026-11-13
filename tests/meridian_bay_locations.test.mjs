import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {worldRoute} from '../tools/living_world_routines.mjs';
import {inspectPrebuiltMeridianBay,prepareMeridianBayWorld,
 applyReviewedPlaceDiscovery,inspectSceneEstablishedPlaces,
 verifyReviewedPlaceHistory} from '../tools/meridian_bay_locations.mjs';
import {inspectEstablishedServices} from '../tools/meridian_bay_services.mjs';
import {inspectMeridianBay} from '../tools/meridian_bay_city.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic}
 from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const world=JSON.parse(read('game/MERIDIAN_BAY_PREBUILT.json'));
const noah='LOC-MARKET-NOAH-REPAIR';
const grocery='LOC-RAILGARDEN-ABARROTES';
const routeToNoah=['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
 'LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT',noah];
const sceneQuote='Jack can see a repair-and-components shop on the Market Row pedestrian frontage.';
const accessQuote='The shop has a public-facing door connecting directly to the Market Row sidewalk.';
const observation=(id=noah)=>({
 id,anchor_id:'LOC-COMMERCIAL-DISTRICT',
 opportunity_id:'BAY-MARKET-PARTS',
 reviewed:true,public_access_confirmed:true,
 scene_quote:sceneQuote,access_quote:accessQuote
});
const input=(changes=[],discoveries=[],key='qa-prebuilt-first-001')=>({
 key,
 intent:'Jack travels on his chosen route through existing Meridian Bay streets.',
 outcome:'He checks public space without making a purchase or accepting an offer.',
 player_text:'I visit an existing place only if I decide to walk there.',
 narration_messages:[sceneQuote,accessQuote,
  'Market Row continues its ordinary activity without inventing another character encounter.'],
 elapsed_days:0,elapsed_minutes:30,changes,location_discoveries:discoveries
});
const stage=(turn=input(),snapshot=baseline)=>
 stageLivingWorldTurn({snapshot,turn,observedHead:'a'.repeat(40),npcResolutions:[]});

test('authoritative checkpoint remains untouched at turn 9 while prebuilt sites already exist for narrator',()=>{
 const before=JSON.stringify(baseline);
 assert.equal(baseline.manifest.last_completed_turn,9);
 assert.equal(Object.keys(baseline.state.world.locations).length,9);
 assert.equal(world.places.length,6);
 const described=inspectPrebuiltMeridianBay({state:baseline.state,
   fromId:'LOC-WILSON-WORKSHOP'});
 assert.equal(described.length,6);
 assert.ok(described.every(x=>x.preexistsPlayerObservation===true));
 assert.ok(described.every(x=>x.route?.at(-1)===x.locationId));
 assert.ok(described.every(x=>x.openingHours===null&&x.travelMinutes===null));
 assert.equal(inspectSceneEstablishedPlaces({state:baseline.state}).length,0);
 assert.equal(JSON.stringify(baseline),before);
});
test('world is preconstructed independently of any player turn, idempotently and without actor movement',()=>{
 const before=JSON.stringify(baseline.state),s=prepareMeridianBayWorld({state:baseline.state});
 assert.equal(Object.keys(s.world.locations).length,15);
 assert.equal(prepareMeridianBayWorld({state:s}).world.locations[noah].name,
  s.world.locations[noah].name);
 assert.equal(s.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.deepEqual(Object.keys(s.world.actors),Object.keys(baseline.state.world.actors));
 assert.equal(s.time.day,baseline.state.time.day);
 assert.equal(JSON.stringify(baseline.state),before);
 const names=new Set(),opportunities=new Set();
 for(const p of world.places){
  assert.ok(!names.has(p.id));names.add(p.id);
  assert.ok(!opportunities.has(p.origin_opportunity_id));
  opportunities.add(p.origin_opportunity_id);
  assert.deepEqual(s.world.locations[p.id],p);
  assert.deepEqual(p.connected_ids,[p.parent_id]);
  assert.ok(s.world.locations[p.parent_id].connected_ids.includes(p.id));
  assert.equal(p.opening_hours,null);
  assert.equal(p.travel_minutes,null);
 }
});
test('city inspector identifies authored sites as already existing before Jack learns them',()=>{
 const areas=inspectMeridianBay({state:baseline.state}).areas.flatMap(a=>a.opportunities);
 const mapped=areas.filter(a=>a.status==='prebuilt_world');
 assert.equal(mapped.length,6);
 assert.deepEqual(new Set(mapped.map(x=>x.locationId)),
  new Set(world.places.map(x=>x.id)));
 assert.ok(mapped.every(x=>x.establishmentEventId===null&&x.verifiedAccessible===true));
 assert.ok(areas.find(x=>x.id==='BAY-RAIL-SCHOOL').status==='proposed_not_canon');
 assert.equal(baseline.state.world.locations[noah],undefined);
});
test('staging a real player action uses the already-authored map without creating it from that action',()=>{
 const staged=stage();
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(verifyReviewedPlaceHistory(staged),true);
 assert.equal(staged.manifest.last_completed_turn,10);
 assert.equal(Object.keys(staged.state.world.locations).length,15);
 assert.ok(staged.events.events.at(-1).state_changes.every(c=>
  c.field!=='world_location'&&c.field!=='world_location_link'));
 assert.deepEqual(inspectSceneEstablishedPlaces({state:staged.state}),[]);
 assert.equal(baseline.manifest.last_completed_turn,9);
 assert.equal(baseline.state.world.locations[noah],undefined);
});
test('Jack may navigate existing sites by a legitimate saved route without discovering a new object',()=>{
 const travel={field:'location_id',before:'LOC-WILSON-WORKSHOP',after:noah,
  route:routeToNoah};
 const next=stage(input([travel]));
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.equal(next.state.player.location_id,noah);
 assert.deepEqual(worldRoute(next.state,'LOC-WILSON-WORKSHOP',noah),routeToNoah);
 assert.deepEqual(worldRoute(next.state,noah,'LOC-WILSON-APARTMENT'),
  [noah,'LOC-COMMERCIAL-DISTRICT','LOC-RAILGARDEN-RESIDENTIAL',
   'LOC-WILSON-APARTMENT']);
 assert.equal(next.events.events.at(-1).state_changes[0].field,'location_id');
 assert.equal(inspectSceneEstablishedPlaces({state:next.state}).length,0);
});
test('a witnessed public entrance changes player knowledge, never world topology',()=>{
 const next=stage(input([], [observation()]));
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.equal(verifyReviewedPlaceHistory(next),true);
 assert.deepEqual(next.state.world.locations[noah],world.places[0]);
 assert.equal(next.events.events.at(-1).state_changes.length,1);
 assert.equal(next.events.events.at(-1).state_changes[0].field,'knowledge');
 const seen=inspectSceneEstablishedPlaces({state:next.state,
  fromId:'LOC-WILSON-WORKSHOP'});
 assert.equal(seen.length,1);
 assert.equal(seen[0].locationId,noah);
 assert.equal(seen[0].publicAccessConfirmed,true);
 assert.equal(seen[0].openingHours,null);
 assert.equal(seen[0].route.at(-1),noah);
 const service=inspectEstablishedServices({state:next.state});
 assert.equal(service.length,3);
 assert.ok(service.every(x=>x.serviceNow==='unknown'));
});
test('no new place can spring into existence because prose describes a fictitious name',()=>{
 const fake=observation('LOC-MARKET-NONEXISTENT');
 assert.throws(()=>stage(input([], [fake])),/must already exist/);
 const wrong=observation();
 wrong.anchor_id='LOC-HARBOR-WALK';
 assert.throws(()=>stage(input([], [wrong])),/different saved district/);
 const other=observation();
 other.opportunity_id='BAY-MARKET-DELIVERY';
 assert.throws(()=>stage(input([], [other])),/disagrees with prebuilt place/);
 assert.equal(Object.keys(baseline.state.world.locations).length,9);
});
test('unreviewed or unsupported place sightings do not reveal knowledge',()=>{
 const notReviewed={...observation(),reviewed:false};
 assert.throws(()=>stage(input([], [notReviewed])),/Narrator-reviewed/);
 const noAccess={...observation(),public_access_confirmed:false};
 assert.throws(()=>stage(input([], [noAccess])),/Narrator-reviewed/);
 const missingQuote={...observation(),access_quote:'A different public facing entry seen at this time.'};
 assert.throws(()=>stage(input([], [missingQuote])),/appear literally/);
 const invalid={...observation(),id:'LOC-CAFE-BRUMA'};
 assert.throws(()=>stage(input([], [invalid])),/must already exist/);
 assert.throws(()=>stage(input([], [observation(),observation()],
  'qa-prebuilt-duplicate')),/must already exist/);
});
test('routing cannot teleport Jack or assign activity to unrelated NPCs',()=>{
 const before=JSON.stringify(baseline);
 const shortcut={field:'location_id',before:'LOC-WILSON-WORKSHOP',after:noah,
  route:['LOC-WILSON-WORKSHOP',noah]};
 assert.throws(()=>stage(input([shortcut])),/Nonadjacent travel without route/);
 const next=stage(input([{field:'location_id',before:'LOC-WILSON-WORKSHOP',
  after:grocery,route:['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
  'LOC-RAILGARDEN-RESIDENTIAL',grocery]}]));
 assert.equal(verifyNarrativeSnapshot(next),true);
 assert.equal(next.state.player.location_id,grocery);
 assert.deepEqual(Object.keys(next.state.world.actors),
  Object.keys(baseline.state.world.actors));
 assert.equal(JSON.stringify(baseline),before);
});
test('readback rejects changed authored places and unsupported world creation effects',()=>{
 const snap=stage(input([], [observation()]));
 const corrupted=structuredClone(snap);
 corrupted.state.world.locations[noah].name='An unapproved renamed shop';
 assert.throws(()=>verifyReviewedPlaceHistory(corrupted),/must preexist/);
 const missing=structuredClone(snap);
 missing.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  missing.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids
   .filter(x=>x!==noah);
 assert.throws(()=>verifyReviewedPlaceHistory(missing),/missing reciprocal/);
 const invented=structuredClone(snap);
 invented.events.events.at(-1).state_changes.push({
  field:'world_location',actor_id:invented.state.player.id,
  location_id:'LOC-IMPOSSIBLE',before:null,after:{id:'LOC-IMPOSSIBLE'}});
 assert.throws(()=>verifyReviewedPlaceHistory(invented),/cannot create/);
 const erased=structuredClone(snap);
 erased.transcript.entries.forEach(x=>{
  if(x.turn===10&&x.role==='assistant')x.text='There is no shop visible.';
 });
 assert.throws(()=>verifyReviewedPlaceHistory(erased),/source missing/);
});
test('a later separate player turn preserves the prebuilt map without multiplying destinations',()=>{
 const first=stage();
 const second=stage(input([], [observation()],'qa-prebuilt-followup-002'),first);
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(second.manifest.last_completed_turn,11);
 assert.equal(Object.keys(second.state.world.locations).length,15);
 assert.equal(new Set(Object.keys(second.state.world.locations)).size,15);
 assert.equal(second.events.events.filter(e=>e.state_changes.some(c=>
  c.field==='world_location')).length,0);
 const diagnostic=inspectLivingWorld({snapshot:second,actorIds:['NPC-006'],
  elapsedMinutes:25});
 assert.equal(diagnostic.observedPublicPlaces.length,1);
 const safe=playerVisibleDiagnostic(diagnostic);
 assert.equal('observedPublicPlaces' in safe,false);
 assert.equal(JSON.stringify(baseline.state.world.locations).includes(noah),false);
});
