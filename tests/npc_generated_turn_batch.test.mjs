// Narrator submits reviewed decisions for a single fictional turn.
// All experiments use an isolated in-memory snapshot, never a story save.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {savePaths,decodeFiveFiles,encodeFiveFiles} from '../tools/save_transaction.mjs';
import {prepareNPCIntentionRequests,stageReviewedNPCIntentionTurn}
 from '../tools/npc_intention_generation.mjs';
import {verifyNarrativeSnapshot} from '../tools/turn_engine.mjs';

const raw=Object.fromEntries(savePaths('CH-000').map(path=>
 [path,readFileSync(new URL('../'+path,import.meta.url),'utf8')]));
const start=()=>decodeFiveFiles(raw,'CH-000');
const head='e'.repeat(40);
const turn=n=>({key:'SYNTHETIC-multi-NPC-review-'+n,
 intent:'SYNTHETIC test input, no real player action.',
 outcome:'The test interval passes with an ordinary, quiet workshop scene.',
 player_text:'[SYNTHETIC QA INPUT] Jack stays in the workshop.',
 narration_messages:['[SYNTHETIC QA] The room remains quiet.'],
 elapsed_days:0,elapsed_minutes:25,next_time_of_day:'morning'});
const request=(s,id)=>prepareNPCIntentionRequests({
 snapshot:s,actorIds:[id],elapsedMinutes:25,elapsedDays:0,
 nextPeriod:'morning'}).requests[0];
const act=(r,intention,sourceEventIds=[])=>({
 actorId:r.actorId,decision:'act',intention,sourceEventIds,
 reasoning:'The actor responds to its own known goal and current resources without presuming success.'
});
const noAction=r=>({
 actorId:r.actorId,decision:'abstain',
 reasoning:'Current facts do not justify an activity and no schedule can be inferred.'
});

test('two independent NPCs can act while a third abstains in one synthetic turn',()=>{
 const s=start(),before=JSON.stringify(s);
 const noah=request(s,'NPC-006'),rosa=request(s,'NPC-005'),mara=request(s,'NPC-007');
 const noahPlan='Reconsider ordinary shop supply records before accepting an order.';
 const result=stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(1),observedHead:head,
  choices:[
   {request:noah,proposal:act(noah,
     'Noah independently decides to inspect existing parts records before contacting a supplier.'),
    reviewed:true,
    outcome:'SYNTHETIC PRIVATE: Noah changes his next work priority without claiming a sale.',
    changes:[{field:'independent_plan',
      before:s.state.world.actors['NPC-006'].independent_plan,after:noahPlan}]},
   {request:rosa,proposal:act(rosa,
     'Rosa independently considers ordinary household work unrelated to the earlier clock repair.'),
    reviewed:true,
    outcome:'SYNTHETIC PRIVATE: Rosa considers another personal goal with no assumed meeting.'},
   {request:mara,proposal:noAction(mara)}
  ]});
 assert.equal(verifyNarrativeSnapshot(result),true);
 assert.deepEqual(result.npcTurnReview.actedActorIds,['NPC-006','NPC-005']);
 assert.deepEqual(result.npcTurnReview.abstainedActorIds,['NPC-007']);
 assert.equal(result.manifest.last_completed_turn,10);
 assert.equal(result.manifest.last_event_sequence,32);
 assert.equal(result.state.world.actors['NPC-006'].independent_plan,noahPlan);
 assert.equal(result.state.player.location_id,s.state.player.location_id);
 assert.equal(result.events.events.at(-1).actor_ids[0],'NPC-005');
 assert.deepEqual(result.events.events.at(-1).caused_by,[]);
 assert.ok(!result.chapter.includes('SYNTHETIC PRIVATE'));
 assert.ok(!result.transcript.entries.some(x=>x.text.includes('SYNTHETIC PRIVATE')));
 assert.equal(result.npcTurnReview.createdCanonicalSave,false);
 const reread=decodeFiveFiles(encodeFiveFiles(result),'CH-000');
 assert.equal(verifyNarrativeSnapshot(reread),true);
 assert.equal(reread.state.world.actors['NPC-006'].independent_plan,noahPlan);
 assert.equal(JSON.stringify(s),before);
 for(const [p,content] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+p,import.meta.url),'utf8'),content);
});

test('next turn bases context on completed previous result and rejects earlier request',()=>{
 const s=start(),r=request(s,'NPC-006');
 const staged=stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(2),observedHead:head,
  choices:[{request:r,proposal:act(r,
   'Noah reviews possible priorities for legitimate workshop stock management.'),
   reviewed:true,
   outcome:'SYNTHETIC PRIVATE: Noah privately reviews the shop management task.'}]});
 const next=request(staged,'NPC-006');
 assert.equal(next.evidence.previousResult.eventId,staged.events.events.at(-1).id);
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:staged,turn:turn(3),
  observedHead:head,choices:[{request:r,proposal:act(r,
   'Noah uses the obsolete old request to pretend he reviewed another task.'),
   reviewed:true,
   outcome:'SYNTHETIC PRIVATE: This invalid old-context event must never stage.'}]}),
  /Stale or altered/);
 const resumed=stageReviewedNPCIntentionTurn({snapshot:staged,turn:turn(3),
  observedHead:head,choices:[{request:next,proposal:act(next,
   'Noah reconsiders his parts records based on the previous actual review.',
   [next.evidence.previousResult.eventId]),reviewed:true,
   outcome:'SYNTHETIC PRIVATE: Noah evaluates the earlier review without a fictional delivery.'}]});
 assert.equal(verifyNarrativeSnapshot(resumed),true);
 assert.deepEqual(resumed.events.events.at(-1).caused_by,
  [next.evidence.previousResult.eventId]);
});

test('same actor cannot submit conflicting choices and abstention does not stage event',()=>{
 const s=start(),r=request(s,'NPC-006');
 const a={request:r,proposal:noAction(r)};
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(4),
  observedHead:head,choices:[a,a]}),/Only one NPC choice/);
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(4),
  observedHead:head,choices:[{...a,outcome:'A clandestine change despite abstention.'}]}),
  /Abstaining NPC cannot hide an outcome/);
 const only=stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(4),
  observedHead:head,choices:[a]});
 assert.equal(verifyNarrativeSnapshot(only),true);
 assert.equal(only.manifest.last_event_sequence,s.manifest.last_event_sequence+1);
 assert.deepEqual(only.npcTurnReview.actedActorIds,[]);
 assert.deepEqual(only.npcTurnReview.abstainedActorIds,['NPC-006']);
});

test('mismatched time windows and private NPC outcome in scene are rejected',()=>{
 const s=start(),r=request(s,'NPC-005');
 const intro=act(r,
  'Rosa chooses to review a possible activity without claiming the neighbor arrived.');
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:{
  ...turn(5),elapsed_minutes:60},observedHead:head,choices:[
   {request:r,proposal:intro,reviewed:true,
    outcome:'SYNTHETIC PRIVATE: An unreviewed interval should be rejected.'}
  ]}),/same fictional turn interval/);
 const leak='SYNTHETIC PRIVATE: This is only Rosa private choice.';
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:{
  ...turn(5),narration_messages:[leak]},observedHead:head,choices:[
   {request:r,proposal:intro,reviewed:true,outcome:leak}
  ]}),/must not appear verbatim/);
});

test('unknown source and forbidden location cannot bypass batch checks',()=>{
 const s=start(),r=request(s,'NPC-003');
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(6),
  observedHead:head,choices:[{request:r,proposal:act(r,
   'Darius imagines a private repair outcome learned from another person.',
   ['EV-000029']),reviewed:true,
   outcome:'SYNTHETIC PRIVATE: Unauthorized knowledge is not a real basis.'}]}),
  /not known by its actor/);
 assert.throws(()=>stageReviewedNPCIntentionTurn({snapshot:s,turn:turn(6),
  observedHead:head,choices:[{request:r,
   proposal:{...act(r,'Darius intends to reach an uncharted city site.'),
    destinationId:'LOC-UNKNOWN-QA'},
   reviewed:true,
   outcome:'SYNTHETIC PRIVATE: Uncharted destinations should be rejected.'}]}),
  /existing admitted location/);
});
