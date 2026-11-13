import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageLivingWorldTurn} from '../tools/living_world_coordinator.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';
import {worldRoute} from '../tools/living_world_routines.mjs';
import {inspectSceneEstablishedPlaces,verifyReviewedPlaceHistory}
 from '../tools/meridian_bay_locations.mjs';
import {inspectEstablishedServices} from '../tools/meridian_bay_services.mjs';
import {inspectMeridianBay} from '../tools/meridian_bay_city.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const baseline={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const placeId='LOC-MARKET-SUPPLY-COUNTER-QA';
const sceneQuote='Jack sees a small, independently operated repair supply counter along Market Row.';
const accessQuote='A public entrance and a sign welcoming walk-in customers are visible from the street.';
const discovery=()=>({
 id:placeId,opportunity_id:'BAY-MARKET-PARTS',
 anchor_id:'LOC-COMMERCIAL-DISTRICT',
 name:'Synthetic Market Row supply counter',
 type:'public_repair_supply_counter',
 description:'Synthetic, observed shop interior with a small visible display of ordinary repair supplies.',
 scene_quote:sceneQuote,access_quote:accessQuote,
 public_access_confirmed:true,reviewed:true
});
const playerRoute=['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',
 'LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT',placeId];
const sourceText=()=>[sceneQuote,accessQuote,
 'Jack enters the public counter without assigning anyone a new shift.'].join(' ');
const turn=(changes=[],discoveries=[discovery()],key='qa-public-place-001')=>({
 key,intent:'Jack heads toward a supply counter he actually observes in Market Row.',
 outcome:'Jack enters an observed public counter without making an unrecorded purchase.',
 player_text:'I walk toward Market Row, inspect the repair supplies and enter the public counter.',
 narration_messages:[sourceText()],
 elapsed_days:0,elapsed_minutes:60,
 location_discoveries:discoveries,
 changes
});
const playerMove=()=>({
 field:'location_id',before:baseline.state.player.location_id,
 after:placeId,route:playerRoute
});
const stage=(input=turn([playerMove()]),snapshot=baseline)=>
 stageLivingWorldTurn({snapshot,turn:input,observedHead:'a'.repeat(40),
  npcResolutions:[]});
test('canonical checkpoint has no unplayed additions; planned storefront is not a destination',()=>{
 const before=JSON.stringify(baseline);
 assert.deepEqual(inspectSceneEstablishedPlaces({state:baseline.state}),[]);
 assert.equal(worldRoute(baseline.state,'LOC-COMMERCIAL-DISTRICT',placeId),null);
 assert.equal(Object.keys(baseline.state.world.locations).length,9);
 assert.equal(baseline.manifest.last_completed_turn,9);
 assert.equal(JSON.stringify(baseline),before);
});
test('one observed public place is added and Jack can navigate by real existing links',()=>{
 const before=JSON.stringify(baseline);
 const candidate=stage();
 assert.equal(verifyNarrativeSnapshot(candidate),true);
 assert.equal(verifyReviewedPlaceHistory(candidate),true);
 assert.equal(candidate.manifest.last_completed_turn,10);
 const loc=candidate.state.world.locations[placeId];
 assert.equal(loc.established_event_id,'EV-000030');
 assert.equal(loc.parent_id,'LOC-COMMERCIAL-DISTRICT');
 assert.deepEqual(loc.connected_ids,['LOC-COMMERCIAL-DISTRICT']);
 assert.equal(loc.opening_hours,null);
 assert.equal(loc.travel_minutes,null);
 assert.equal(loc.access_status,'public_confirmed');
 assert.ok(candidate.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.includes(placeId));
 assert.deepEqual(worldRoute(candidate.state,'LOC-WILSON-WORKSHOP',placeId),playerRoute);
 assert.deepEqual(worldRoute(candidate.state,placeId,'LOC-WILSON-APARTMENT'),
  [placeId,'LOC-COMMERCIAL-DISTRICT','LOC-RAILGARDEN-RESIDENTIAL','LOC-WILSON-APARTMENT']);
 assert.equal(candidate.state.player.location_id,placeId);
 const events=candidate.events.events.at(-1).state_changes;
 assert.equal(events[0].field,'world_location');
 assert.equal(events[1].field,'world_location_link');
 assert.ok(events.some(x=>x.field==='location_id'&&x.after===placeId));
 assert.equal(JSON.stringify(baseline),before);
});
test('read-only list separates known public access from unknown open hours and staff',()=>{
 const next=stage();
 const places=inspectSceneEstablishedPlaces({state:next.state,
  fromId:'LOC-WILSON-WORKSHOP'});
 assert.equal(places.length,1);
 assert.equal(places[0].publicAccessConfirmed,true);
 assert.equal(places[0].openingHours,null);
 assert.equal(places[0].travelMinutes,null);
 assert.equal(places[0].route.at(-1),placeId);
 assert.equal(places[0].evidenceEventId,'EV-000030');
 const services=inspectEstablishedServices({state:next.state});
 assert.equal(services.length,3);
 assert.ok(services.every(s=>s.serviceNow==='unknown'));
});
test('cannot establish a place that was not literally observed in the new scene',()=>{
 const request=turn([]);
 request.narration_messages=['There is only a vague street visible through the window.'];
 assert.throws(()=>stage(request),/appear literally in the current narrated scene/);
 request.narration_messages=[sceneQuote];
 assert.throws(()=>stage(request),/appear literally in the current narrated scene/);
 request.narration_messages=[accessQuote];
 assert.throws(()=>stage(request),/appear literally in the current narrated scene/);
});
test('private place, unknown access and unreviewed proposals never become visitable',()=>{
 const p=discovery();
 assert.throws(()=>stage(turn([],[{...p,reviewed:false}])),
  /Narrator-reviewed public access confirmation required/);
 assert.throws(()=>stage(turn([],[{...p,public_access_confirmed:false}])),
  /Narrator-reviewed public access confirmation required/);
 assert.throws(()=>stage(turn([],[{...p,access_quote:sceneQuote}])),
  /must appear literally|distinct scene/);
 assert.equal(baseline.state.world.locations[placeId],undefined);
});
test('no location may be added at the wrong anchor, with a fabricated proposal or duplicate ID',()=>{
 const p=discovery();
 assert.throws(()=>stage(turn([],[{...p,anchor_id:'LOC-RAILGARDEN-RESIDENTIAL'}])),
  /not backed by an opportunity/);
 assert.throws(()=>stage(turn([],[{...p,opportunity_id:'BAY-INVALID-OPPORTUNITY'}])),
  /not backed by an opportunity/);
 assert.throws(()=>stage(turn([],[{...p,id:'LOC-CAFE-BRUMA'}])),
  /invalid, duplicate, or already in canon/);
 assert.throws(()=>stage(turn([],[p,p])),
  /invalid, duplicate, or already in canon/);
});
test('a new place may be observed but actor movement still needs a connected, explicit route',()=>{
 const badMove={field:'location_id',before:'LOC-WILSON-WORKSHOP',
  after:placeId,route:['LOC-WILSON-WORKSHOP',placeId]};
 assert.throws(()=>stage(turn([badMove])),/Nonadjacent travel without route/);
 const spotted=stage(turn([]));
 assert.equal(verifyNarrativeSnapshot(spotted),true);
 assert.equal(spotted.state.player.location_id,'LOC-WILSON-WORKSHOP');
 assert.deepEqual(worldRoute(spotted.state,'LOC-WILSON-WORKSHOP',placeId),playerRoute);
});
test('saved provenance rejects detached place records, rewritten transcript and missing link',()=>{
 const candidate=stage();
 const missing=structuredClone(candidate);
 missing.events.events.at(-1).state_changes.shift();
 assert.throws(()=>verifyReviewedPlaceHistory(missing),/Place evidence and anchor link/);
 const erased=structuredClone(candidate);
 erased.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids=
  erased.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids.filter(x=>x!==placeId);
 assert.throws(()=>verifyReviewedPlaceHistory(erased),/missing reciprocal/);
 const narrated=structuredClone(candidate);
 for(const t of narrated.transcript.entries)
  if(t.turn===10&&t.role==='assistant')t.text='A wholly different scene.';
 assert.throws(()=>verifyReviewedPlaceHistory(narrated),/not established in its saved narration/);
});
test('saved event rejects invented shortcut links, denied staff assumptions and rewritten evidence',()=>{
 const a=stage();
 const shortcut=structuredClone(a);
 shortcut.state.world.locations[placeId].connected_ids.push('LOC-HARBOR-WALK');
 assert.throws(()=>verifyReviewedPlaceHistory(shortcut),/confirmed public access and no shortcut/);
 const newUnstaged=structuredClone(a);
 newUnstaged.state.world.locations['LOC-FABRICATED-UNRECORDED']={
  ...a.state.world.locations[placeId],id:'LOC-FABRICATED-UNRECORDED'
 };
 assert.throws(()=>verifyReviewedPlaceHistory(newUnstaged),
  /multiple new places|Place evidence and anchor link|missing reciprocal|Orphaned/);
 const changed=structuredClone(a);
 changed.state.world.locations[placeId].scene_quote='A fictitious phrase not in the archived text.';
 assert.throws(()=>verifyReviewedPlaceHistory(changed),
  /Place evidence and anchor link|not established in its saved narration/);
});
test('a future synthetic turn retains the location and its original event without copying private guesses',()=>{
 const first=stage();
 const continued=stage({
  ...turn([],[],'qa-public-place-followup-002'),
  intent:'Jack looks at ordinary merchandise without purchasing it.',
  player_text:'I inspect the shelves and leave the objects in place.',
  outcome:'The shop visit continues without a purchase.',
  narration_messages:['Jack observes the existing shelves without a purchase.']
 },first);
 assert.equal(verifyNarrativeSnapshot(continued),true);
 assert.equal(continued.manifest.last_completed_turn,11);
 assert.equal(continued.state.world.locations[placeId].established_event_id,'EV-000030');
 assert.equal(continued.events.events.filter(e=>e.state_changes.some(
  c=>c.field==='world_location')).length,1);
 assert.equal(baseline.state.world.locations[placeId],undefined);
});
test('same opportunity cannot spawn additional unrelated businesses in a later turn',()=>{
 const first=stage();
 const duplicate={...discovery(),id:'LOC-MARKET-SUPPLY-COUNTER-SECOND',
  name:'Another synthetic counter'};
 assert.throws(()=>stage(turn([],[duplicate],'qa-duplicate-business-002'),first),
  /already established in a prior turn/);
});
test('two different observed public opportunities can share one old anchor without overwriting links',()=>{
 const second={...discovery(),
  id:'LOC-MARKET-CULTURE-DISPLAY-QA',
  opportunity_id:'BAY-MARKET-COMMUNITY',
  name:'Synthetic public cultural display',
  type:'public_creative_display',
  description:'An independently observed public display of ordinary artworks, without a fixed opening schedule.',
  scene_quote:'Jack also sees a small public creative display along the Market Row sidewalk.',
  access_quote:'A separate visible notice confirms anyone walking past may view the display.'};
 const request=turn([], [discovery(),second], 'qa-two-public-places-002');
 request.narration_messages=[sourceText(),second.scene_quote,second.access_quote];
 const snap=stage(request);
 assert.equal(verifyNarrativeSnapshot(snap),true);
 assert.equal(inspectSceneEstablishedPlaces({state:snap.state}).length,2);
 const ids=snap.state.world.locations['LOC-COMMERCIAL-DISTRICT'].connected_ids;
 assert.deepEqual(ids.slice(-2),[placeId,second.id]);
 assert.deepEqual(worldRoute(snap.state,placeId,second.id),
  [placeId,'LOC-COMMERCIAL-DISTRICT',second.id]);
});
test('a public place never creates a new autonomous NPC, known opening hour or current service case',()=>{
 const next=stage();
 assert.deepEqual(Object.keys(next.state.world.actors),
  Object.keys(baseline.state.world.actors));
 assert.equal(next.state.world.locations[placeId].opening_hours,null);
 assert.equal(next.state.world.locations[placeId].travel_minutes,null);
 assert.ok(Object.values(next.state.world.actors).every(n=>
  !n.service_cases||n.service_cases.length===0));
 assert.equal(baseline.manifest.last_completed_turn,9);
});

test('opportunities are promoted to established only after event; other proposals stay untouched',()=>{
 const before=inspectMeridianBay({state:baseline.state,
  anchorId:'LOC-COMMERCIAL-DISTRICT'}).areas[0].opportunities;
 assert.ok(before.every(o=>o.status==='proposed_not_canon'&&o.locationId===null));
 const saved=stage();
 const after=inspectMeridianBay({state:saved.state,
  anchorId:'LOC-COMMERCIAL-DISTRICT'}).areas[0].opportunities;
 const established=after.find(o=>o.id==='BAY-MARKET-PARTS');
 assert.equal(established.status,'established_by_scene');
 assert.equal(established.locationId,placeId);
 assert.equal(established.establishmentEventId,'EV-000030');
 assert.equal(established.verifiedAccessible,true);
 assert.equal(established.openingHours,null);
 assert.ok(after.filter(o=>o.id!=='BAY-MARKET-PARTS').every(o=>
  o.status==='proposed_not_canon'&&o.locationId===null));
 const diagnostic=inspectLivingWorld({snapshot:saved,actorIds:['NPC-006'],
  elapsedMinutes:25});
 assert.equal(diagnostic.observedPublicPlaces.length,1);
 const playerSafe=playerVisibleDiagnostic(diagnostic);
 assert.equal('observedPublicPlaces' in playerSafe,false);
 assert.equal(JSON.stringify(baseline.state.world.locations).includes(placeId),false);
});
