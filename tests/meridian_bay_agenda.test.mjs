import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {planNPCAgendas,previewNearbyNPCContacts,CIVILIAN_ROUTINES,recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';
import {inspectMeridianBay,proposalsForActor} from '../tools/meridian_bay_city.mjs';
import {reviewNPCCommitments} from '../tools/living_world_commitments.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const snapshot={
 state:JSON.parse(read('game/STATE.json')),
 manifest:JSON.parse(read('game/SAVE_MANIFEST.json')),
 events:JSON.parse(read('chapters/CH-000.events.json')),
 transcript:JSON.parse(read('chapters/CH-000.transcript.json')),
 chapter:read('chapters/CH-000.md')
};
const state=snapshot.state;
test('all seven established NPCs receive bounded personal routine proposals',()=>{
 const before=JSON.stringify(snapshot);
 const agenda=planNPCAgendas({state,elapsedMinutes:25});
 assert.deepEqual([...new Set(agenda.map(x=>x.actorId))].sort(),
   Object.keys(state.world.actors).sort());
 assert.equal(CIVILIAN_ROUTINES.length,15);
 assert.ok(agenda.length>=14&&agenda.length<=21);
 assert.ok(agenda.every(x=>x.status==='unresolved_proposal'&&
   x.requiresResolution===true&&x.disclosure==='narrator_private'));
 assert.equal(JSON.stringify(snapshot),before);
});
test('time passage alone does not complete school arrival, clock delivery, parcel handover or shift',()=>{
 const agenda=planNPCAgendas({state,elapsedMinutes:120,actorIds:['NPC-003','NPC-004','NPC-005','NPC-007']});
 assert.ok(agenda.some(x=>x.actorId==='NPC-004'&&x.id.includes('school-journey')&&
   x.destinationId===null&&x.feasibility==='destination_not_established'));
 assert.ok(agenda.some(x=>x.actorId==='NPC-005'&&x.id.includes('clock-handover-plan')&&
   x.destinationId===null));
 assert.ok(agenda.some(x=>x.actorId==='NPC-003'&&x.destinationId===null));
 assert.ok(agenda.every(x=>x.possibleResults.includes('defer')));
 assert.equal(state.world.actors['NPC-004'].location_id,'LOC-RAILGARDEN-RESIDENTIAL');
});
test('recorded commitments outrank background routines without claiming success',()=>{
 const altered=structuredClone(state);
 altered.world.actors['NPC-003'].commitments=[{
  id:'OBL-DELIVERY_101',summary:'Check handover for a paid parcel',
  source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  due_day:-29,status:'blocked',priority:'urgent',
  blockers:['Exact recipient location is unknown'],resolution:null,resolution_event_id:null
 }];
 const agenda=planNPCAgendas({state:altered,elapsedMinutes:45,actorIds:['NPC-003'],limitPerActor:2});
 assert.equal(agenda[0].id,'agenda:OBL-DELIVERY_101');
 assert.equal(agenda[0].review,'blocked_review');
 assert.deepEqual(agenda[0].blockers,['Exact recipient location is unknown']);
 assert.equal(agenda[0].requiresResolution,true);
 assert.equal(agenda[0].destinationId,null);
});
test('deadlines are checked at destination narrative day, never by invented exact clock',()=>{
 const altered=structuredClone(state);
 altered.world.actors['NPC-005'].commitments=[{
  id:'OBL-CLOCK_102',summary:'Return a repaired clock',
  source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  due_day:-29,status:'pending',priority:'normal',
  blockers:[],resolution:null,resolution_event_id:null
 }];
 const today=reviewNPCCommitments({state:altered,actorIds:['NPC-005'],
  elapsedMinutes:15}).find(x=>x.id==='OBL-CLOCK_102');
 const tomorrow=planNPCAgendas({state:altered,actorIds:['NPC-005'],
  elapsedDays:1,elapsedMinutes:1440,nextPeriod:'morning'}).find(x=>x.obligationId==='OBL-CLOCK_102');
 assert.equal(today.review,'due_today_review');
 assert.equal(tomorrow.review,'overdue_review');
 assert.equal(tomorrow.dayToReview,-28);
 assert.equal(tomorrow.availability,'unknown');
});
test('unknown schedules stay unknown, and a confirmed closure is not treated as success',()=>{
 const normal=planNPCAgendas({state,actorIds:['NPC-007'],elapsedMinutes:25});
 const closed=planNPCAgendas({state,actorIds:['NPC-007'],elapsedMinutes:25,
  exceptions:{'NPC-007':{confirmed:true,status:'closed'}}});
 assert.ok(normal.every(x=>x.availability==='unknown'));
 assert.ok(closed.every(x=>x.availability==='closed'&&x.requiresResolution));
});
test('same-location actors are only possible contacts; no conversation or knowledge is created',()=>{
 const before=JSON.stringify(state);
 const contacts=previewNearbyNPCContacts({state,actorIds:['NPC-003','NPC-006']});
 assert.equal(contacts.length,1);
 assert.deepEqual(contacts[0].actorIds,['NPC-003','NPC-006']);
 assert.equal(contacts[0].locationId,'LOC-COMMERCIAL-DISTRICT');
 assert.equal(contacts[0].conversationOccurred,false);
 assert.equal(contacts[0].knowledgeShared,false);
 assert.equal(JSON.stringify(state),before);
});
test('catalog expands four districts and two established service anchors as PROPOSALS only',()=>{
 const city=inspectMeridianBay({state});
 assert.equal(city.classification,'narrator_private_proposals');
 assert.equal(city.areas.length,6);
 assert.equal(city.areas.flatMap(x=>x.opportunities).length,18);
 assert.ok(city.areas.every(a=>Object.hasOwn(state.world.locations,a.anchorId)));
 assert.ok(city.areas.every(a=>JSON.stringify(a.knownConnections)===
   JSON.stringify(state.world.locations[a.anchorId].connected_ids)));
 assert.ok(city.areas.flatMap(a=>a.opportunities).every(o=>
   o.status==='proposed_not_canon'&&o.locationId===null&&
   o.openingHours===null&&o.travelMinutes===null&&o.verifiedAccessible===false));
 assert.equal(Object.keys(state.world.locations).length,9);
});
test('school and neighbor remain unlocated even when city opportunities are discoverable',()=>{
 const elena=proposalsForActor({state,actorId:'NPC-004'});
 const rosa=proposalsForActor({state,actorId:'NPC-005'});
 assert.ok(elena.some(o=>o.id==='BAY-RAIL-SCHOOL'&&o.locationId===null&&
   o.requires.includes('establish_school_location')));
 assert.ok(rosa.some(o=>o.id==='BAY-RAIL-NEIGHBOR'&&o.locationId===null&&
   o.requires.includes('establish_neighbor_location')));
 assert.ok(!Object.keys(state.world.locations).some(x=>x.includes('SCHOOL')));
});
test('integrated diagnostics preserve privacy and original checkpoint',()=>{
 const before=JSON.stringify(snapshot);
 const d=inspectLivingWorld({snapshot,actorIds:['NPC-003','NPC-006'],
  elapsedMinutes:30});
 const safe=playerVisibleDiagnostic(d);
 assert.ok(d.causalAgenda.length>=2);
 assert.equal(d.possibleNPCContacts.length,1);
 assert.ok(d.meridianBay.areas.length>=4);
 assert.equal('causalAgenda' in safe,false);
 assert.equal('possibleNPCContacts' in safe,false);
 assert.equal('meridianBay' in safe,false);
 assert.equal(safe.turn,9);
 assert.equal(JSON.stringify(snapshot),before);
});
test('invalid narrative time, actor IDs and fake city anchors fail closed',()=>{
 assert.throws(()=>planNPCAgendas({state,elapsedDays:1,elapsedMinutes:20}),/Impossible narrative day transition/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,actorIds:['NPC-999']}),/Unknown or repeated/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,actorIds:['NPC-003','NPC-003']}),/Unknown or repeated/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,limitPerActor:200}),/candidate limit/);
 assert.throws(()=>inspectMeridianBay({state,anchorId:'LOC-FAKE-SCHOOL'}),/Unknown city anchor/);
 assert.deepEqual(planNPCAgendas({state,elapsedMinutes:0}),[]);
});

test('one reviewable intention per relevant NPC, without forcing an out-of-period shift',()=>{
 const before=JSON.stringify(state);
 const choices=recommendNPCIntentReviews({state,elapsedMinutes:25});
 assert.equal(new Set(choices.map(x=>x.actorId)).size,choices.length);
 assert.ok(choices.some(x=>x.actorId==='NPC-004'));
 assert.ok(!choices.some(x=>x.actorId==='NPC-007'));
 assert.ok(choices.every(x=>x.status==='requires_causal_adjudication'&&
   x.persisted===false&&x.mayDefer&&x.mayFail&&x.visibility==='narrator_private'));
 assert.equal(JSON.stringify(state),before);
});
test('blocked obligation receives a review even when a prior shift is out of period',()=>{
 const altered=structuredClone(state);
 altered.world.actors['NPC-007'].commitments=[{
  id:'OBL-CAFE_999',summary:'Reconcile recorded register discrepancy',
  source_event_id:'EV-000029',last_change_event_id:'EV-000029',
  due_day:null,status:'blocked',priority:'important',
  blockers:['Previous sale record still requires checking'],
  resolution:null,resolution_event_id:null
 }];
 const chosen=recommendNPCIntentReviews({state:altered,elapsedMinutes:30,actorIds:['NPC-007']});
 assert.equal(chosen.length,1);
 assert.equal(chosen[0].kind,'obligation');
 assert.equal(chosen[0].candidateId,'agenda:OBL-CAFE_999');
 assert.ok(chosen[0].mayDefer);
});
test('no fictional time advance means no NPC agenda selection',()=>{
 assert.deepEqual(recommendNPCIntentReviews({state,elapsedMinutes:0}),[]);
 const d=inspectLivingWorld({snapshot,actorIds:['NPC-003','NPC-006'],elapsedMinutes:20});
 assert.ok(d.recommendedNPCIntents.length>0);
 assert.equal('recommendedNPCIntents' in playerVisibleDiagnostic(d),false);
});
