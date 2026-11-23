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


// Editorial review of new prose written from the real CH-000 turn-9
// evidence, not picked from the deterministic multiday QA policy. The author
// is the ChatGPT narrator in this review, NOT a model invoked by Node/CI.
// This is an inspectable exploratory sample, not a blind 30-turn evaluation.
test('narrator-authored seven-actor scene respects completed work, uncertainty and private memory across two turns',()=>{
 const original=start(),originalEncoded=JSON.stringify(original);
 const ids=['NPC-001','NPC-002','NPC-003','NPC-004','NPC-005','NPC-006','NPC-007'];
 const r=Object.fromEntries(ids.map(id=>[id,request(original,id)]));
 const actWith=(id,intention,reasoning,sourceEventIds,plan,outcome)=>({
  request:r[id],proposal:{actorId:id,decision:'act',intention,reasoning,
   sourceEventIds},reviewed:true,outcome,
  changes:[{field:'independent_plan',
   before:r[id].evidence.independentPlan,after:plan}]
 });
 const abstainWith=(id,reasoning)=>({
  request:r[id],proposal:{actorId:id,decision:'abstain',reasoning}
 });
 // One original decision per NPC, based on its own saved information;
 // no newly invented NPC meetings, clients, deliveries or locations.
 const choices=[
  abstainWith('NPC-001',
   'The delayed route belongs to the prior evening; the saved morning has no verified new dispatch report. Reissuing the old instruction would be a fabricated repeat.'),
  actWith('NPC-002',
   'Sora chooses to distinguish confirmed display symptoms from hypotheses before suggesting any follow-up to maintenance.',
   'She witnessed the Crosswater anomaly and closed her inspection without a confirmed technical cause; she cannot claim a new failure or suspect.',
   ['EV-000012'],
   'Separate observed Crosswater display symptoms from unverified causes; suggest follow-up only with a new assignment.',
   'SYNTHETIC PRIVATE SORA: Her next maintenance priority distinguishes documented symptoms from assumptions; no new inspection is claimed.'),
  abstainWith('NPC-003',
   'The last resolved courier event says that Darius already delivered the known parcel. There is no confirmed new package or deadline to act on.'),
  actWith('NPC-004',
   'Elena decides to rehearse how she will explain the corrected street perspective while continuing toward school with her artwork stored.',
   'She knows she corrected the drawing and carries the USB, but the checkpoint shows her en route rather than inside a classroom.',
   ['EV-000028'],
   'Rehearse the perspective explanation while continuing toward school; classroom arrival and presentation remain unconfirmed.',
   'SYNTHETIC PRIVATE ELENA: Elena chooses an explanation for her illustration, without reaching school or meeting a teacher.'),
  actWith('NPC-005',
   'Rosa decides to keep the repaired alarm clock identified as awaiting return rather than treating the repair as unfinished.',
   'She personally tested the repaired clock and knows it still needs to be returned; the neighbor presence is not established.',
   ['EV-000029'],
   'Keep the tested alarm clock marked for return when the neighbor is available; do not repeat the repair.',
   'SYNTHETIC PRIVATE ROSA: Rosa keeps the alarm clock return on her own priority list without meeting the neighbor.'),
  actWith('NPC-006',
   'Noah decides to distinguish parts he can verify from requirements that need checking before considering a supplier order.',
   'His shop goal calls for affordable legitimate service, but he has no confirmed new order, stock count or supplier response.',
   [],
   'Verify specific parts requirements before placing any supplier order; do not assume available stock.',
   'SYNTHETIC PRIVATE NOAH: Noah narrows his parts-planning priority and makes no sale, purchase or supplier contact.'),
  abstainWith('NPC-007',
   'Mara last closed a prior cafe shift. No new shift, customer payment or reopened register has been established in the saved morning.')
 ];
 for(const choice of choices){
  const e=choice.request.evidence;
  assert.ok(choice.proposal.reasoning.length>=16);
  assert.ok((choice.proposal.sourceEventIds??[]).every(id=>
   e.knownEventIds.includes(id)));
 }
 const first=stageReviewedNPCIntentionTurn({snapshot:original,
  turn:turn('model-authored-seven-npc-pass-one'),observedHead:head,choices});
 assert.equal(verifyNarrativeSnapshot(first),true);
 assert.equal(first.manifest.last_completed_turn,10);
 assert.deepEqual(first.npcTurnReview.actedActorIds,
  ['NPC-002','NPC-004','NPC-005','NPC-006']);
 assert.deepEqual(first.npcTurnReview.abstainedActorIds,
  ['NPC-001','NPC-003','NPC-007']);
 assert.equal(first.manifest.last_event_sequence,34);
 assert.equal(first.state.world.actors['NPC-004'].location_id,
  original.state.world.actors['NPC-004'].location_id);
 assert.equal(first.state.world.actors['NPC-003'].last_resolved_action.event_id,
  'EV-000008','Do not deliver Darius old parcel again');
 assert.equal(first.state.world.actors['NPC-005'].resources.current_repair,
  original.state.world.actors['NPC-005'].resources.current_repair);
 for(const item of choices.filter(x=>x.outcome)){
  assert.ok(!first.chapter.includes(item.outcome));
  assert.ok(first.transcript.entries.every(e=>!e.text.includes(item.outcome)));
 }
 const reread=decodeFiveFiles(encodeFiveFiles(first),'CH-000');
 assert.equal(verifyNarrativeSnapshot(reread),true);
 assert.equal(JSON.stringify(reread.state.player),JSON.stringify(original.state.player));

 // Only after the first outcome has actually been staged and recovered,
 // obtain a new private request and make a distinct, actor-led choice.
 const n=request(reread,'NPC-006');
 const old=r['NPC-006'];
 const newPlan='Keep supplier orders on hold until concrete parts requirements can be checked.';
 assert.notEqual(n.evidence.independentPlan,old.evidence.independentPlan);
 assert.equal(n.evidence.previousResult.eventId,
  reread.events.events.at(-1).id);
 assert.ok(n.evidence.knownEvents.some(e=>e.id===n.evidence.previousResult.eventId));
 const second=stageReviewedNPCIntentionTurn({
  snapshot:reread,turn:turn('model-authored-seven-npc-pass-two'),
  observedHead:head,
  choices:[
   {request:n,proposal:{actorId:'NPC-006',decision:'act',
    intention:'Noah decides to postpone an order until he can check which open shop requirements actually need particular components.',
    reasoning:'His previous private decision narrowed the parts question; there is still no established inventory count or supplier agreement, so he changes purchasing priority without claiming completion.',
    sourceEventIds:[n.evidence.previousResult.eventId]},
    reviewed:true,
    outcome:'SYNTHETIC PRIVATE NOAH NEXT: Noah defers ordering while the actual parts requirements are still uncertain.',
    changes:[{field:'independent_plan',before:n.evidence.independentPlan,
     after:newPlan}]},
   ...['NPC-005','NPC-004'].map(actorId=>({
    request:request(reread,actorId),proposal:{actorId,decision:'abstain',
     reasoning:actorId==='NPC-005'?
      'Nothing establishes that the neighbor is present for a clock handover; do not invent a meeting.':
      'No verified arrival at school or new contact warrants another activity for Elena in this short interval.'}
   }))
  ]});
 assert.equal(verifyNarrativeSnapshot(second),true);
 assert.equal(second.manifest.last_completed_turn,11);
 assert.equal(second.state.world.actors['NPC-006'].independent_plan,newPlan);
 assert.deepEqual(second.events.events.at(-1).caused_by,
  [n.evidence.previousResult.eventId]);
 assert.deepEqual(second.npcTurnReview.abstainedActorIds,
  ['NPC-005','NPC-004']);
 assert.equal(JSON.stringify(original),originalEncoded);
 for(const [p,content] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+p,import.meta.url),'utf8'),content);
 console.log('NPC_NARRATOR_AUTHORED_EXPLORATORY_QA '+JSON.stringify({
  initialActorsReviewed:7,initialActs:4,initialAbstentions:3,
  nextTurnActorFollowups:1,nextTurnAbstentions:2,
  independentNewActionWithoutForgedCause:true,
  actorKnownCausalFollowup:true,stagedTurns:2,canonicalSaveWrites:0,
  liveProviderCallsInCI:0,blindNarrativeQualityCertified:false
 }));
});
