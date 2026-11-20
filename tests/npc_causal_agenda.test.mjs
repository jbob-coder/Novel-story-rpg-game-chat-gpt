// Synthetic, read-only regression suite; no narrative turn or GitHub write.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planNPCAgendas,previewNearbyNPCContacts,CIVILIAN_ROUTINES,
  recommendNPCIntentReviews} from '../tools/living_world_agenda.mjs';
import {inspectLivingWorld,playerVisibleDiagnostic} from '../tools/living_world_diagnostics.mjs';

const state=JSON.parse(readFileSync(new URL('../game/STATE.json',import.meta.url),'utf8'));
const original=JSON.stringify(state);
const obligation=({id,summary,day=null,status='pending'})=>({
 id,summary,source_event_id:'EV-000029',last_change_event_id:'EV-000029',
 due_day:day,status,priority:'important',
 blockers:status==='blocked'?['A reviewed work dependency is still missing']:[],
 resolution:null,resolution_event_id:null
});

test('selectively ported agenda fits current 15-place checkpoint without mutation',()=>{
 assert.equal(Object.keys(state.world.locations).length,15);
 assert.equal(CIVILIAN_ROUTINES.length,15);
 const proposals=planNPCAgendas({state,elapsedMinutes:25});
 assert.deepEqual([...new Set(proposals.map(x=>x.actorId))].sort(),
   Object.keys(state.world.actors).sort());
 assert.ok(proposals.every(x=>x.requiresResolution===true&&
   x.disclosure==='narrator_private'&&x.status==='unresolved_proposal'));
 assert.ok(proposals.length>=14&&proposals.length<=21);
 assert.equal(JSON.stringify(state),original);
});

test('unknown addresses stay unknown: no fabricated school or recipient arrival',()=>{
 const proposals=planNPCAgendas({state,actorIds:['NPC-003','NPC-004','NPC-005'],
   elapsedMinutes:30});
 for(const id of ['NPC-003','NPC-004','NPC-005'])
   assert.ok(proposals.some(x=>x.actorId===id&&x.kind==='civilian_routine'&&
     x.destinationId===null&&x.feasibility==='destination_not_established'));
 assert.ok(proposals.every(x=>x.possibleResults.includes('defer')));
 assert.ok(proposals.every(x=>x.route===null||
   x.route.every(place=>Object.hasOwn(state.world.locations,place))));
});

test('private contacts require two saved NPCs in one existing location',()=>{
 const contacts=previewNearbyNPCContacts({state,actorIds:['NPC-003','NPC-006']});
 assert.equal(contacts.length,1);
 assert.deepEqual(contacts[0].actorIds,['NPC-003','NPC-006']);
 assert.equal(contacts[0].locationId,'LOC-COMMERCIAL-DISTRICT');
 assert.equal(contacts[0].conversationOccurred,false);
 assert.equal(contacts[0].knowledgeShared,false);
 const moved=structuredClone(state);
 moved.world.actors['NPC-006'].location_id='LOC-CAFE-BRUMA';
 assert.deepEqual(previewNearbyNPCContacts({state:moved,actorIds:['NPC-003','NPC-006']}),[]);
 moved.world.actors['NPC-006'].location_id='LOC-NONEXISTENT';
 moved.world.actors['NPC-003'].location_id='LOC-NONEXISTENT';
 assert.deepEqual(previewNearbyNPCContacts({state:moved,actorIds:['NPC-003','NPC-006']}),[]);
 assert.equal(JSON.stringify(state),original);
});

test('saved obligations belong only to their owner, not every reviewed NPC',()=>{
 const modified=structuredClone(state);
 modified.world.actors['NPC-003'].commitments=[obligation({
   id:'OBL-OWNER_003',summary:'Review the documented parcel handover',day:-29
 })];
 modified.world.actors['NPC-005'].commitments=[obligation({
   id:'OBL-OWNER_005',summary:'Review the documented neighbor return',day:null,status:'blocked'
 })];
 const forCourier=planNPCAgendas({state:modified,actorIds:['NPC-003'],
   elapsedMinutes:30,limitPerActor:8});
 const forNeighbor=planNPCAgendas({state:modified,actorIds:['NPC-005'],
   elapsedMinutes:30,limitPerActor:8});
 assert.deepEqual(forCourier.filter(x=>x.kind==='obligation').map(x=>x.obligationId),['OBL-OWNER_003']);
 assert.deepEqual(forNeighbor.filter(x=>x.kind==='obligation').map(x=>x.obligationId),['OBL-OWNER_005']);
 assert.equal(forNeighbor[0].review,'blocked_review');
 assert.equal(forNeighbor[0].actionProposal.startsWith('Consider a feasible workaround'),true);
 assert.equal(JSON.stringify(modified.world.actors['NPC-003'].commitments[0]),
   JSON.stringify(obligation({id:'OBL-OWNER_003',
     summary:'Review the documented parcel handover',day:-29})));
});

test('due-day classification uses destination fictional day, not start day',()=>{
 const modified=structuredClone(state);
 modified.world.actors['NPC-005'].commitments=[obligation({
   id:'OBL-DUE_005',summary:'Review an unfinished documented return',day:-29
 })];
 const today=planNPCAgendas({state:modified,actorIds:['NPC-005'],
   elapsedMinutes:20,elapsedDays:0,limitPerActor:8}).find(x=>x.kind==='obligation');
 const tomorrow=planNPCAgendas({state:modified,actorIds:['NPC-005'],
   elapsedMinutes:1440,elapsedDays:1,nextPeriod:'morning',limitPerActor:8})
   .find(x=>x.kind==='obligation');
 assert.equal(today.review,'due_today_review');
 assert.equal(tomorrow.review,'overdue_review');
 assert.equal(today.dayToReview,-29);
 assert.equal(tomorrow.dayToReview,-28);
 assert.equal(tomorrow.intervalReview,'due_today_review');
});

test('unknown availability remains unknown; explicit closure does not complete a shift',()=>{
 const plain=planNPCAgendas({state,actorIds:['NPC-007'],elapsedMinutes:25});
 const closed=planNPCAgendas({state,actorIds:['NPC-007'],elapsedMinutes:25,
   exceptions:{'NPC-007':{status:'closed',confirmed:true}}});
 assert.ok(plain.length>0&&plain.every(x=>x.availability==='unknown'));
 assert.ok(closed.every(x=>x.availability==='closed'&&x.requiresResolution));
 assert.deepEqual(recommendNPCIntentReviews({state,actorIds:['NPC-007'],
   elapsedMinutes:25,exceptions:{'NPC-007':{status:'closed',confirmed:true}}}),[]);
});

test('one independent reviewable intention per actor; no forced out-of-period shift',()=>{
 const choices=recommendNPCIntentReviews({state,elapsedMinutes:25});
 assert.equal(new Set(choices.map(x=>x.actorId)).size,choices.length);
 assert.ok(choices.some(x=>x.actorId==='NPC-004'));
 assert.ok(!choices.some(x=>x.actorId==='NPC-007'));
 assert.ok(choices.every(x=>x.persisted===false&&x.mayDefer&&x.mayFail&&
   x.visibility==='narrator_private'&&x.status==='requires_causal_adjudication'));
});

test('recorded blocked obligation is reviewable even outside suggested shift',()=>{
 const modified=structuredClone(state);
 modified.world.actors['NPC-007'].commitments=[obligation({
   id:'OBL-BLOCKED_007',summary:'Recheck the recorded register discrepancy',
   status:'blocked'
 })];
 const choices=recommendNPCIntentReviews({state:modified,
   actorIds:['NPC-007'],elapsedMinutes:30});
 assert.equal(choices.length,1);
 assert.equal(choices[0].candidateId,'agenda:OBL-BLOCKED_007');
 assert.equal(choices[0].kind,'obligation');
 assert.ok(choices[0].blockers.length>0);
});

test('zero time and invalid selections fail closed, never execute work',()=>{
 assert.deepEqual(planNPCAgendas({state,elapsedMinutes:0}),[]);
 assert.deepEqual(recommendNPCIntentReviews({state,elapsedMinutes:0}),[]);
 assert.throws(()=>planNPCAgendas({state,elapsedDays:1,elapsedMinutes:20}),
   /Impossible narrative day transition/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,actorIds:['NPC-999']}),
   /Unknown or repeated NPC selection/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,actorIds:['NPC-003','NPC-003']}),
   /Unknown or repeated NPC selection/);
 assert.throws(()=>planNPCAgendas({state,elapsedMinutes:20,limitPerActor:30}),
   /Invalid agenda candidate limit/);
 assert.throws(()=>previewNearbyNPCContacts({state,actorIds:['NPC-003','NPC-003']}),
   /Invalid contact actor selection/);
 assert.equal(JSON.stringify(state),original);
});

test('integrated narrator diagnostics keep agendas and possible contacts private',()=>{
 const snapshot={
   state:structuredClone(state),
   manifest:JSON.parse(readFileSync(new URL('../game/SAVE_MANIFEST.json',import.meta.url),'utf8')),
   events:JSON.parse(readFileSync(new URL('../chapters/CH-000.events.json',import.meta.url),'utf8')),
   transcript:JSON.parse(readFileSync(new URL('../chapters/CH-000.transcript.json',import.meta.url),'utf8')),
   chapter:readFileSync(new URL('../chapters/CH-000.md',import.meta.url),'utf8')
 };
 const before=JSON.stringify(snapshot);
 const report=inspectLivingWorld({snapshot,actorIds:['NPC-003','NPC-006'],elapsedMinutes:30});
 assert.equal(report.classification,'narrator_private_only');
 assert.ok(report.causalAgenda.length>=2);
 assert.equal(report.possibleNPCContacts.length,1);
 assert.ok(report.recommendedNPCIntents.length>=1);
 for(const key of ['causalAgenda','possibleNPCContacts','recommendedNPCIntents'])
   assert.ok(!Object.hasOwn(playerVisibleDiagnostic(report),key));
 assert.equal(report.checkpoint.turn,9);
 assert.equal(JSON.stringify(snapshot),before);
});
