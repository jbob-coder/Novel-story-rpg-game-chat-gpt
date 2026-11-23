// Narrator submits reviewed decisions for a single fictional turn.
// All experiments use an isolated in-memory snapshot, never a story save.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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


// First step of a separately authored 30-step evaluation. Authored ONLY
// after reading the actual turn-9 checkpoint. Do not author future steps
// until step 01 outcome is verified and recovered as the next input.
// This is an explicitly frozen narrator-reviewed corpus, NOT a model API call.
export function replayNarratorThirtyTurnReviewThroughStep01(){
 const initial=start(),before=JSON.stringify(initial);
 const requestById=Object.fromEntries(Object.keys(initial.state.world.actors)
  .map(id=>[id,prepareNPCIntentionRequests({snapshot:initial,
   actorIds:[id],elapsedDays:0,elapsedMinutes:10,
   nextPeriod:'morning'}).requests[0]]));
 const abstain=(id,reasoning)=>({
  request:requestById[id],proposal:{actorId:id,decision:'abstain',reasoning}
 });
 const actWith=(id,intention,reasoning,sourceEventIds,afterPlan,outcome)=>{
  const old=requestById[id].evidence.independentPlan;
  return {request:requestById[id],proposal:{
   actorId:id,decision:'act',intention,reasoning,sourceEventIds},
   reviewed:true,outcome,
   changes:[{field:'independent_plan',before:old,after:afterPlan}]};
 };
 // This different first-turn scene is NOT copied from the prior two-turn
 // exploratory scene: Darius is now explicitly allowed to replace an
 // obsolete plan because his own last event already completed that job.
 const choices=[
  abstain('NPC-001',
   'The saved dispatch incident is from the previous evening; no fresh scheduled departure or current staff report is confirmed during this morning interval.'),
  abstain('NPC-002',
   'The prior Crosswater panel inspection was closed and no new maintenance instruction or fault is reported; she can defer starting another inspection.'),
  actWith('NPC-003',
   'Darius decides to stop treating the parcel already delivered to Market Row as an outstanding task and to check for a genuinely new assignment before planning another trip.',
   'His own completed delivery EV-000008 contradicts the older generic delivery plan; no new order, recipient or deadline is established.',
   ['EV-000008'],
   'Confirm whether a new paid courier assignment exists before planning another delivery; previous parcel already delivered.',
   'SYNTHETIC PRIVATE DARIUS STEP01: He drops the completed parcel from his active priorities; he has not acquired a new delivery.'),
  actWith('NPC-004',
   'Elena decides which one detail of the corrected street perspective to explain first when she eventually presents her artwork, while continuing toward school.',
   'She carries the prepared USB and remembers her corrected illustration, but her recorded state is still en route and she cannot assume the teacher has met her.',
   ['EV-000028'],
   'Continue toward school with the USB and a chosen perspective detail to explain; classroom arrival remains unverified.',
   'SYNTHETIC PRIVATE ELENA STEP01: She settles on an explanation for the corrected perspective; no school arrival or presentation occurs.'),
  abstain('NPC-005',
   'The clock is repaired, but the neighbor availability and a suitable handover are not established. Rosa need not manufacture an encounter in ten minutes.'),
  actWith('NPC-006',
   'Noah decides to mark the part requirements he still needs to verify before contacting any supplier about his pending workshop tasks.',
   'He has a shop goal and an existing plan to review pending jobs, but no inventory count, confirmed purchase or supplier response is in the saved evidence.',
   [],
   'Check which parts pending workshop tasks actually require before approaching suppliers; no orders assumed.',
   'SYNTHETIC PRIVATE NOAH STEP01: He makes verifying parts needs his next priority without counting stock or contacting a supplier.'),
  abstain('NPC-007',
   'The earlier cafe close and Jack payment are not evidence of a new morning shift, new order or a cash discrepancy needing her intervention.')
 ];
 // These expectations are fact-specific semantic review, not mere syntactic
 // validation: a previously delivered parcel must remain completed.
 assert.ok(requestById['NPC-003'].evidence.knownEvents.some(e=>
  e.id==='EV-000008'&&e.outcome.includes('delivers his parcel')));
 assert.ok(requestById['NPC-004'].evidence.knownEvents.some(e=>
  e.id==='EV-000028'&&e.outcome.includes('de camino')));
 assert.ok(requestById['NPC-005'].evidence.knownEvents.some(e=>
  e.id==='EV-000029'&&e.outcome.includes('reparado')));
 assert.ok(!requestById['NPC-003'].evidence.knownEvents.some(e=>
  e.id==='EV-000029'));
 const fictionalTurn={...turn('narrator-30-step-01'),
  elapsed_minutes:10,
  intent:'[ISOLATED EVALUATION] No directive from Jack to any offscreen actor.',
  outcome:'Ten quiet fictional minutes pass; the unseen NPC decisions are not disclosed to Jack.',
  narration_messages:['[ISOLATED EVALUATION] Jack receives no private NPC information.']};
 const staged=stageReviewedNPCIntentionTurn({snapshot:initial,
  turn:fictionalTurn,observedHead:head,choices});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.manifest.last_completed_turn,10);
 assert.equal(staged.manifest.last_event_sequence,33);
 assert.deepEqual(staged.npcTurnReview.actedActorIds,
  ['NPC-003','NPC-004','NPC-006']);
 assert.deepEqual(staged.npcTurnReview.abstainedActorIds,
  ['NPC-001','NPC-002','NPC-005','NPC-007']);
 const decoded=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
 assert.equal(verifyNarrativeSnapshot(decoded),true);
 assert.deepEqual(decoded.state.player,initial.state.player);
 assert.equal(decoded.state.time.elapsed_minutes_since_opening_approx,
  initial.state.time.elapsed_minutes_since_opening_approx+10);
 for(const row of choices.filter(x=>x.outcome)){
  const a=row.proposal.actorId;
  assert.equal(decoded.state.world.actors[a].independent_plan,
   row.changes[0].after);
  assert.ok(!decoded.chapter.includes(row.outcome));
  assert.ok(decoded.transcript.entries.every(e=>!e.text.includes(row.outcome)));
 }
 assert.equal(decoded.state.world.actors['NPC-003'].last_resolved_action.event_id,
  decoded.events.events.find(e=>e.intent.includes('previously delivered')||
   e.intent.includes('parcel already delivered'))?.id);
 assert.equal(decoded.state.world.actors['NPC-004'].location_id,
  initial.state.world.actors['NPC-004'].location_id);
 assert.equal(decoded.state.world.actors['NPC-005'].resources.current_repair,
  initial.state.world.actors['NPC-005'].resources.current_repair);
 assert.equal(JSON.stringify(initial),before);
 for(const [path,bytes] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 const snapshotHash=createHash('sha256')
  .update(JSON.stringify(encodeFiveFiles(decoded))).digest('hex');
 return {snapshot:decoded,choices,snapshotHash};
}
test('narrator original-initiative assessment turn 01 replays in isolation with correct unfinished-work boundaries',()=>{
 const {snapshot,choices,snapshotHash}=replayNarratorThirtyTurnReviewThroughStep01();
 console.log('NARRATOR_30_TURN_REVIEW_STEP_01 '+JSON.stringify({
  modelAuthoredAtReviewTime:true,
  modelApiInvokedByTest:false,
  reviewTurn:1,ofPlannedTurns:30,
  startCanonicalTurn:9,stagedSyntheticTurn:snapshot.manifest.last_completed_turn,
  acted:choices.filter(x=>x.proposal.decision==='act').map(x=>x.proposal.actorId),
  abstained:choices.filter(x=>x.proposal.decision==='abstain').map(x=>x.proposal.actorId),
  knownCompletedParcelNotRedelivered:true,
  schoolArrivalNotInvented:true,neighborHandoverNotInvented:true,
  verifiedSnapshotHash:snapshotHash,canonicalSaveWrites:0,
  independentSemanticReviewCompleted:false,
  sustainedNarrativeQualityCertified:false
 }));
});


// Step 02 is authored from the decoded outcome of step 01, never from a
// prewritten thirty-step script or the obsolete canonical turn-9 request.
// The frozen, reproducible QA case is not an automated model invocation.
export function replayNarratorThirtyTurnReviewThroughStep02(){
 const first=replayNarratorThirtyTurnReviewThroughStep01();
 assert.equal(first.snapshotHash,
  'f26d16089c46caff37e3bd4b685e0776d2126b9bf5f5212fedf5f78bb3c2e5c5',
  'Step 02 requires the exact reviewed Step 01 checkpoint');
 const prior=first.snapshot,unchanged=JSON.stringify(prior);
 const r=Object.fromEntries(Object.keys(prior.state.world.actors).map(id=>[
  id,prepareNPCIntentionRequests({snapshot:prior,actorIds:[id],
   elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'}).requests[0]
 ]));
 const abstain=(id,reasoning)=>({request:r[id],proposal:{
  actorId:id,decision:'abstain',reasoning
 }});
 const actWith=(id,intention,reasoning,sourceEventIds,afterPlan,outcome)=>({
  request:r[id],proposal:{actorId:id,decision:'act',
   intention,reasoning,sourceEventIds},
  reviewed:true,outcome,changes:[{field:'independent_plan',
   before:r[id].evidence.independentPlan,after:afterPlan}]
 });
 const choices=[
  actWith('NPC-001',
   'Lena decides to separate the previous evening delayed route from the display anomaly in her handover notes so neither report is mistaken for a new incident.',
   'She already knows an evening route was late and the reported display malfunction was passed to maintenance; no current dispatch update justifies declaring another disruption.',
   ['EV-000007'],
   'Separate prior evening route delay from display maintenance; await a current staff update before dispatch action.',
   'SYNTHETIC PRIVATE LENA STEP02: Lena sorts the existing reports without assuming a new delay, departure or technical finding.'),
  abstain('NPC-002',
   'The Crosswater inspection is closed and no new maintenance request or observed fault has entered Sora personal record.'),
  abstain('NPC-003',
   'His previous verified result retired the delivered parcel. Darius lacks a newly confirmed paid assignment, route or deadline.'),
  abstain('NPC-004',
   'Elena already selected a detail to explain about her artwork; nothing in the recorded interval establishes school arrival, a classroom or a teacher.'),
  actWith('NPC-005',
   'Rosa decides to leave herself a reminder that the tested alarm clock is ready for return, without claiming its owner is available.',
   'She knows the clock repair has been checked, while the neighbor availability remains unknown. This is a household planning action, not an actual handover.',
   ['EV-000029'],
   'Keep the repaired alarm clock on a return reminder until a real opportunity to meet its owner is established.',
   'SYNTHETIC PRIVATE ROSA STEP02: Rosa keeps a private reminder about the pending clock return; no encounter occurs.'),
  actWith('NPC-006',
   'Noah decides to formulate one specific question about unverified parts requirements for his next legitimate workshop discussion, delaying supplier orders until those needs are clear.',
   'His most recent actor-owned result established the need to check requirements, but there is no observed inventory count, customer visit or supplier reply in the intervening time.',
   [r['NPC-006'].evidence.previousResult.eventId],
   'Prepare a question about which components are actually needed; wait for genuine clarification before ordering.',
   'SYNTHETIC PRIVATE NOAH STEP02: Noah refines a future parts question; nobody has been contacted and nothing purchased.'),
  abstain('NPC-007',
   'The recorded cafe closing belongs to an earlier shift; there is no known current duty, customer or register event to justify action.')
 ];
 const noahSource=r['NPC-006'].evidence.previousResult.eventId;
 assert.ok(noahSource,'Noah needs his actual first-turn event');
 assert.ok(r['NPC-006'].evidence.knownEvents.some(e=>
  e.id===noahSource&&e.outcome.includes('SYNTHETIC PRIVATE NOAH STEP01')));
 assert.ok(r['NPC-003'].evidence.knownEvents.some(e=>
  e.outcome.includes('SYNTHETIC PRIVATE DARIUS STEP01')));
 assert.ok(r['NPC-001'].evidence.knownEventIds.includes('EV-000007'));
 assert.ok(r['NPC-005'].evidence.knownEventIds.includes('EV-000029'));
 assert.ok(!r['NPC-001'].evidence.knownEventIds.includes(noahSource));
 const currentTurn={...turn('narrator-30-step-02'),
  elapsed_minutes:10,
  intent:'[ISOLATED EVALUATION] Jack gives no instruction to offscreen actors.',
  outcome:'Another ten fictional minutes pass without telling Jack about unseen decisions.',
  narration_messages:['[ISOLATED EVALUATION] Private offscreen information remains private.']};
 const staged=stageReviewedNPCIntentionTurn({
  snapshot:prior,turn:currentTurn,observedHead:head,choices});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.manifest.last_completed_turn,11);
 assert.equal(staged.manifest.last_event_sequence,37);
 assert.deepEqual(staged.npcTurnReview.actedActorIds,
  ['NPC-001','NPC-005','NPC-006']);
 assert.deepEqual(staged.npcTurnReview.abstainedActorIds,
  ['NPC-002','NPC-003','NPC-004','NPC-007']);
 const recovered=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
 assert.equal(verifyNarrativeSnapshot(recovered),true);
 assert.deepEqual(recovered.state.player,prior.state.player);
 assert.equal(recovered.state.time.day,-29);
 assert.equal(recovered.state.time.elapsed_minutes_since_opening_approx,
  start().state.time.elapsed_minutes_since_opening_approx+20);
 for(const row of choices.filter(x=>x.outcome)){
  const id=row.proposal.actorId;
  assert.equal(recovered.state.world.actors[id].independent_plan,
   row.changes[0].after);
  const event=recovered.events.events.find(e=>e.turn===11&&
   e.actor_ids.includes(id));
  assert.ok(event,'Acting NPC needs an individually attributed event');
  assert.deepEqual(event.caused_by,row.proposal.sourceEventIds);
  assert.ok(!recovered.chapter.includes(row.outcome));
  assert.ok(recovered.transcript.entries.every(e=>!e.text.includes(row.outcome)));
 }
 assert.equal(recovered.state.world.actors['NPC-003'].last_resolved_action.event_id,
  prior.state.world.actors['NPC-003'].last_resolved_action.event_id);
 assert.equal(recovered.state.world.actors['NPC-004'].location_id,
  prior.state.world.actors['NPC-004'].location_id);
 assert.equal(recovered.state.world.actors['NPC-005'].resources.current_repair,
  prior.state.world.actors['NPC-005'].resources.current_repair);
 assert.equal(JSON.stringify(prior),unchanged);
 for(const [path,bytes] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 const snapshotHash=createHash('sha256')
  .update(JSON.stringify(encodeFiveFiles(recovered))).digest('hex');
 return {snapshot:recovered,choices,snapshotHash,firstHash:first.snapshotHash};
}
test('narrator original-initiative assessment turn 02 follows verified first-turn consequences',()=>{
 const {snapshot,choices,snapshotHash,firstHash}=
  replayNarratorThirtyTurnReviewThroughStep02();
 console.log('NARRATOR_30_TURN_REVIEW_STEP_02 '+JSON.stringify({
  modelAuthoredAtReviewTime:true,modelApiInvokedByTest:false,
  reviewTurn:2,ofPlannedTurns:30,
  firstVerifiedSnapshotHash:firstHash,
  stagedSyntheticTurn:snapshot.manifest.last_completed_turn,
  acted:choices.filter(x=>x.proposal.decision==='act').map(x=>x.proposal.actorId),
  abstained:choices.filter(x=>x.proposal.decision==='abstain').map(x=>x.proposal.actorId),
  parcelNotRedelivered:true,schoolArrivalNotInvented:true,
  neighborHandoverNotInvented:true,
  verifiedSnapshotHash:snapshotHash,canonicalSaveWrites:0,
  independentSemanticReviewCompleted:false,
  sustainedNarrativeQualityCertified:false
 }));
});


// Turn 03 probes a frequent narrative-autonomy failure mode: inventing work
// merely because a turn elapsed. No actor received a new order, encounter,
// observation or delivery during turns 01/02. Deliberate inactivity is a
// legitimate authored outcome, not seven secret routine executions.
export function replayNarratorThirtyTurnReviewThroughStep03(){
 const second=replayNarratorThirtyTurnReviewThroughStep02();
 assert.equal(second.snapshotHash,
  '62c42ceb4eee19542726016c51e06b24f7aba88127d8c2463da210141afa1081',
  'Step 03 needs the exact verified decoded Step 02 checkpoint');
 const prior=second.snapshot,original=JSON.stringify(prior);
 const reasons={
  'NPC-001':'Lena already categorized the old route and maintenance reports. No present dispatch message or new departure instruction justifies repeating that action.',
  'NPC-002':'Sora closed her prior equipment inspection. Without a new fault observation, assignment or source, she does not stage another maintenance action.',
  'NPC-003':'Darius has closed the previously delivered parcel in his own plan. No new paid job or recipient is known, so inventing a new delivery would violate continuity.',
  'NPC-004':'Elena is still travelling with her completed USB illustration and already chose what to explain. No verified classroom arrival or teacher interaction has occurred.',
  'NPC-005':'Rosa already noted that the repaired clock needs returning. There is no confirmed visit or availability of the neighbor, so another reminder would merely repeat her last decision.',
  'NPC-006':'Noah already refined a question about uncertain parts. Without actual customer details or supplier information, another reformulation would add no grounded progress.',
  'NPC-007':'Mara previous cafe closing did not establish an ongoing morning shift, new customer or register problem; she has no justified new task in this interval.'
 };
 const batch=prepareNPCIntentionRequests({
  snapshot:prior,actorIds:Object.keys(reasons),elapsedDays:0,
  elapsedMinutes:10,nextPeriod:'morning'});
 assert.equal(batch.requests.length,7);
 const choices=batch.requests.map(request=>({
  request,proposal:{actorId:request.actorId,decision:'abstain',
   reasoning:reasons[request.actorId]}
 }));
 for(const item of choices){
  assert.equal(item.request.checkpoint.completedTurn,11);
  if(['NPC-001','NPC-003','NPC-004','NPC-005','NPC-006'].includes(item.request.actorId)){
   const own=item.request.evidence.previousResult?.eventId;
   assert.ok(own,'Recent actor activity must remain in its own history');
   assert.ok(item.request.evidence.knownEvents.some(e=>e.id===own),
    'Previous action cannot be forgotten in third-turn request');
  }
 }
 const third=stageReviewedNPCIntentionTurn({
  snapshot:prior,observedHead:head,
  turn:{...turn('narrator-30-step-03'),elapsed_minutes:10,
   intent:'[ISOLATED EVALUATION] Jack supplies no information or offscreen instructions.',
   outcome:'Ten more fictional minutes pass without a new reported cause for offscreen activity.',
   narration_messages:['[ISOLATED EVALUATION] No private NPC facts become player-visible.']},
  choices});
 assert.equal(verifyNarrativeSnapshot(third),true);
 assert.equal(third.manifest.last_completed_turn,12);
 assert.equal(third.manifest.last_event_sequence,38,
  'One player-placeholder event, no involuntary NPC result');
 assert.deepEqual(third.npcTurnReview.actedActorIds,[]);
 assert.deepEqual(third.npcTurnReview.abstainedActorIds,
  choices.map(x=>x.proposal.actorId),
  'Fairness rotation may reorder reviews; no actor may be lost');
 assert.deepEqual(new Set(third.npcTurnReview.abstainedActorIds),
  new Set(Object.keys(reasons)));
 const recovered=decodeFiveFiles(encodeFiveFiles(third),'CH-000');
 assert.equal(verifyNarrativeSnapshot(recovered),true);
 assert.deepEqual(recovered.state.world.actors,prior.state.world.actors,
  'Inactivity must not silently modify any NPC plan or memory');
 assert.deepEqual(recovered.state.player,prior.state.player);
 assert.equal(recovered.state.time.day,-29);
 assert.equal(recovered.state.time.elapsed_minutes_since_opening_approx,
  start().state.time.elapsed_minutes_since_opening_approx+30);
 const fresh=prepareNPCIntentionRequests({
  snapshot:recovered,actorIds:['NPC-006'],elapsedDays:0,
  elapsedMinutes:10,nextPeriod:'morning'}).requests[0];
 assert.notDeepEqual(fresh.checkpoint,
  batch.requests.find(x=>x.actorId==='NPC-006').checkpoint,
  'Even an inactive interval has a new checkpoint');
 assert.equal(fresh.evidence.previousResult.eventId,
  batch.requests.find(x=>x.actorId==='NPC-006').evidence.previousResult.eventId,
  'An abstention must not replace the last genuine NPC result');
 assert.equal(JSON.stringify(prior),original);
 for(const [path,bytes] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 const snapshotHash=createHash('sha256')
  .update(JSON.stringify(encodeFiveFiles(recovered))).digest('hex');
 return {snapshot:recovered,choices,snapshotHash,secondHash:second.snapshotHash};
}
test('narrator original-initiative assessment turn 03 permits all actors to abstain without forgetting results',()=>{
 const {snapshot,choices,snapshotHash,secondHash}=
  replayNarratorThirtyTurnReviewThroughStep03();
 console.log('NARRATOR_30_TURN_REVIEW_STEP_03 '+JSON.stringify({
  modelAuthoredAtReviewTime:true,modelApiInvokedByTest:false,
  reviewTurn:3,ofPlannedTurns:30,
  priorVerifiedSnapshotHash:secondHash,
  stagedSyntheticTurn:snapshot.manifest.last_completed_turn,
  acted:[],abstained:choices.map(x=>x.proposal.actorId),
  ungroundedRepeatedTasksAvoided:true,
  allPriorActorStatesPreserved:true,
  newNpcEvents:0,canonicalSaveWrites:0,
  verifiedSnapshotHash:snapshotHash,
  independentSemanticReviewCompleted:false,
  sustainedNarrativeQualityCertified:false
 }));
});


// Step 04 resumes ONLY from the verified all-abstention Step 03 snapshot.
// A genuinely small physical action (Elena checking the USB in her own bag)
// is possible without inventing a destination, contact or new client task.
// The other six agents are free to wait. This is authored review prose,
// NOT a background model provider generating a live game turn.
export function replayNarratorThirtyTurnReviewThroughStep04(){
 const priorStep=replayNarratorThirtyTurnReviewThroughStep03();
 assert.equal(priorStep.snapshotHash,
  'a728c5e170cfed360e4a6aa805c4b79a7aa45a13c1379c88f4af27cb0614c1b7',
  'Step 04 requires exact verified Step 03 checkpoint');
 const previous=priorStep.snapshot,unchanged=JSON.stringify(previous);
 const context=prepareNPCIntentionRequests({
  snapshot:previous,elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'
 });
 assert.equal(context.requests.length,7);
 const requests=new Map(context.requests.map(r=>[r.actorId,r]));
 const elena=requests.get('NPC-004');
 assert.ok(elena.evidence.knownEventIds.includes('EV-000028'));
 assert.ok(elena.evidence.previousResult?.eventId);
 assert.ok(elena.evidence.knownEvents.some(e=>e.id==='EV-000028'));
 const originalElena=previous.state.world.actors['NPC-004'];
 assert.equal(originalElena.location_id,'LOC-RAILGARDEN-RESIDENTIAL');
 assert.ok(originalElena.inventory.some(item=>item.id==='ITEM-USB-SPARE-001'&&
  item.carried&&item.status.includes('mochila')));
 const revisedPlan='Elena confirma que la USB sigue en el bolsillo de su mochila; continúa hacia la escuela, todavía sin llegada verificada.';
 const privateOutcome='SYNTHETIC PRIVATE ELENA STEP04: Elena abre brevemente el bolsillo interior de su propia mochila y confirma que la memoria USB prestada sigue allí. Continúa su trayecto; no ha llegado a clase.';
 const reasons={
  'NPC-001':'No fresh dispatch, train or display observation exists since Lena organized the old reports; another report draft would repeat the same task.',
  'NPC-002':'Sora previous maintenance inspection remains closed; no new fault evidence or work assignment has appeared.',
  'NPC-003':'Darius already delivered his old parcel and has no newly observed paid job or recipient.',
  'NPC-005':'Rosa already prepared the clock return reminder; the neighbor presence or a new repair task remains unverified.',
  'NPC-006':'Noah already prepared a clarification question; there is still no client or supplier reply to alter his actual parts priorities.',
  'NPC-007':'Mara earlier closing shift is historical, not evidence of another opening, customer or cash discrepancy.'
 };
 const choices=context.requests.map(request=>request.actorId==='NPC-004'?{
  request,
  proposal:{actorId:'NPC-004',decision:'act',
   intention:'Elena decides to verify that the borrowed USB carrying her finished illustration is still in the inside pocket of the backpack she is already carrying, before she continues toward school.',
   reasoning:'The saved actor inventory already confirms the backpack and USB are carried; she is still in Railgarden and can check her own bag without assuming the school, a teacher or a new device.',
   sourceEventIds:['EV-000028']},
  reviewed:true,outcome:privateOutcome,
  changes:[{field:'independent_plan',
   before:request.evidence.independentPlan,after:revisedPlan}]
 }:{
  request,proposal:{actorId:request.actorId,decision:'abstain',
   reasoning:reasons[request.actorId]}
 });
 // Model output is author-reviewed against actual owned resources; the
 // generic JS pipeline cannot semantically validate this on its own.
 assert.equal(choices.filter(c=>c.proposal.decision==='act').length,1);
 assert.equal(choices.filter(c=>c.proposal.decision==='abstain').length,6);
 for(const choice of choices){
  assert.ok((choice.proposal.sourceEventIds??[]).every(id=>
   choice.request.evidence.knownEventIds.includes(id)));
  assert.equal(choice.request.checkpoint.completedTurn,12);
 }
 const turn4={...turn('narrator-30-step-04'),elapsed_minutes:10,
  intent:'[ISOLATED QA] Jack does not issue orders or learn secrets from distant NPCs.',
  outcome:'The fictional interval passes while Jack remains uninformed about private offscreen decisions.',
  narration_messages:['[ISOLATED QA] No new social encounter or school arrival is asserted.']};
 const staged=stageReviewedNPCIntentionTurn({
  snapshot:previous,turn:turn4,observedHead:head,choices});
 assert.equal(verifyNarrativeSnapshot(staged),true);
 assert.equal(staged.manifest.last_completed_turn,13);
 assert.equal(staged.manifest.last_event_sequence,40);
 assert.deepEqual(staged.npcTurnReview.actedActorIds,['NPC-004']);
 assert.equal(staged.npcTurnReview.abstainedActorIds.length,6);
 assert.deepEqual(new Set(staged.npcTurnReview.abstainedActorIds),
  new Set(Object.keys(reasons)));
 const recovered=decodeFiveFiles(encodeFiveFiles(staged),'CH-000');
 assert.equal(verifyNarrativeSnapshot(recovered),true);
 const latest=recovered.events.events.at(-1);
 assert.equal(latest.turn,13);
 assert.deepEqual(latest.actor_ids,['NPC-004']);
 assert.deepEqual(latest.caused_by,['EV-000028']);
 assert.equal(recovered.state.world.actors['NPC-004'].independent_plan,
  revisedPlan);
 assert.equal(recovered.state.world.actors['NPC-004'].location_id,
  originalElena.location_id);
 assert.deepEqual(recovered.state.world.actors['NPC-004'].inventory,
  originalElena.inventory,'Bag check must not relocate or duplicate USB');
 for(const id of Object.keys(reasons)){
  assert.deepEqual(recovered.state.world.actors[id],
   previous.state.world.actors[id],
   'Abstention must not change memories or plans of actor '+id);
 }
 assert.deepEqual(recovered.state.player,previous.state.player);
 assert.equal(recovered.state.time.elapsed_minutes_since_opening_approx,
  start().state.time.elapsed_minutes_since_opening_approx+40);
 assert.ok(!recovered.chapter.includes(privateOutcome));
 assert.ok(recovered.transcript.entries.every(e=>!e.text.includes(privateOutcome)));
 assert.equal(JSON.stringify(previous),unchanged);
 for(const [path,bytes] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 const snapshotHash=createHash('sha256').update(
  JSON.stringify(encodeFiveFiles(recovered))).digest('hex');
 return {snapshot:recovered,snapshotHash,priorHash:priorStep.snapshotHash};
}
test('narrator original-initiative assessment turn 04 checks an owned item without inventing social encounters',()=>{
 const {snapshot,snapshotHash,priorHash}=
  replayNarratorThirtyTurnReviewThroughStep04();
 console.log('NARRATOR_30_TURN_REVIEW_STEP_04 '+JSON.stringify({
  modelAuthoredAtReviewTime:true,modelApiInvokedByTest:false,
  reviewTurn:4,ofPlannedTurns:30,
  priorVerifiedSnapshotHash:priorHash,
  stagedSyntheticTurn:snapshot.manifest.last_completed_turn,
  acted:['NPC-004'],abstained:6,newNpcEvents:1,
  actorOwnsRelevantItem:true,schoolArrivalNotInvented:true,
  privateOutcomeNotDisclosed:true,
  canonicalSaveWrites:0,
  verifiedSnapshotHash:snapshotHash,
  independentSemanticReviewCompleted:false,
  sustainedNarrativeQualityCertified:false
 }));
});


// Step 05: a genuinely spatial, owner-motivated NPC decision, not another
// rewritten intention. The actor travels one ADMITTED graph segment to his
// own mapped shop. The author separately reviews that it is a confirmed
// public place owned by the actor; graph connectivity alone is insufficient
// to assert entry, and no business opening or sale is invented here.
export function replayNarratorThirtyTurnReviewThroughStep05(){
 const priorStep=replayNarratorThirtyTurnReviewThroughStep04();
 assert.equal(priorStep.snapshotHash,
  '99a0916e93b039ef728b63f311032327f6ab3a030655cddd14a949faa875d399',
  'Step 05 must start from exact previously verified step 04 result');
 const previous=priorStep.snapshot,serialized=JSON.stringify(previous);
 const ctx=prepareNPCIntentionRequests({snapshot:previous,
  elapsedDays:0,elapsedMinutes:10,nextPeriod:'morning'});
 assert.equal(ctx.requests.length,7);
 const byId=new Map(ctx.requests.map(r=>[r.actorId,r]));
 const noah=byId.get('NPC-006'),shop=previous.state.world.locations['LOC-MARKET-NOAH-REPAIR'];
 const originalNoah=previous.state.world.actors['NPC-006'];
 const from='LOC-COMMERCIAL-DISTRICT',dest='LOC-MARKET-NOAH-REPAIR';
 assert.equal(originalNoah.location_id,from);
 assert.equal(shop.related_actor_id,'NPC-006');
 assert.equal(shop.access_status,'public_confirmed');
 assert.equal(shop.public_area,true);
 assert.ok(previous.state.world.locations[from].connected_ids.includes(dest));
 assert.ok(shop.connected_ids.includes(from));
 assert.ok(noah.evidence.previousResult?.eventId);
 assert.ok(noah.evidence.knownEvents.some(e=>e.id===
  noah.evidence.previousResult.eventId &&
  e.outcome.includes('SYNTHETIC PRIVATE NOAH STEP02')));
 const reasons={
  'NPC-001':'Lena already sorted the old reports. Without any new dispatch confirmation, repeating the handover would not be meaningful new activity.',
  'NPC-002':'Sora maintenance inspection was closed; the intervening records contain no new equipment failure, work order or witnessed suspect.',
  'NPC-003':'The completed parcel cannot be delivered again, and Darius has no observed new courier job or named recipient.',
  'NPC-004':'Elena just verified that she carries her artwork USB. She has not been placed in a classroom or given a teacher encounter by the record.',
  'NPC-005':'The clock has been repaired and its return reminder already exists; no verified neighbor availability warrants acting now.',
  'NPC-007':'Mara shift closing is from a previous evening; without a new shift record or customer, no present activity should be fabricated.'
 };
 const newPlan='Noah reaches his own mapped repair shop in Market Row; he will check existing work needs before deciding on any supplier order.';
 const privateOutcome='SYNTHETIC PRIVATE NOAH STEP05: Noah walks from Market Row into his already mapped repair shop through its established connection. He makes no sale, confirms no stock quantity, and asserts no new business opening.';
 const choices=ctx.requests.map(request=>request.actorId==='NPC-006'?{
  request,
  proposal:{actorId:'NPC-006',decision:'act',
   intention:'Noah chooses to walk from the Market Row district to his existing repair and components shop so he can handle his own pending work priorities.',
   reasoning:'The stored world map directly connects Market Row to his identified publicly accessible shop, and he owns the premises. The reviewer adjudicates one neighboring-place move within the fictional interval without claiming opening hours, customers or inventory.',
   destinationId:dest,sourceEventIds:[request.evidence.previousResult.eventId]},
  reviewed:true,outcome:privateOutcome,
  changes:[
   {field:'location_id',before:from,after:dest,route:[from,dest]},
   {field:'independent_plan',before:request.evidence.independentPlan,after:newPlan}
  ]
 }:{
  request,proposal:{actorId:request.actorId,decision:'abstain',
   reasoning:reasons[request.actorId]}
 });
 assert.equal(choices.filter(x=>x.proposal.decision==='act').length,1);
 assert.deepEqual(new Set(choices.filter(x=>x.proposal.decision==='abstain')
  .map(x=>x.request.actorId)),new Set(Object.keys(reasons)));
 for(const item of choices)assert.equal(item.request.checkpoint.completedTurn,13);
 const candidate=stageReviewedNPCIntentionTurn({
  snapshot:previous,observedHead:head,
  turn:{...turn('narrator-30-step-05'),elapsed_minutes:10,
   intent:'[ISOLATED QA] No player action authorizes or directs Noah work.',
   outcome:'Ten fictional minutes pass without sharing private NPC locations with Jack.',
   narration_messages:['[ISOLATED QA] The player receives no unobserved NPC information.']},
  choices});
 assert.equal(verifyNarrativeSnapshot(candidate),true);
 assert.equal(candidate.manifest.last_completed_turn,14);
 assert.equal(candidate.manifest.last_event_sequence,42);
 assert.deepEqual(candidate.npcTurnReview.actedActorIds,['NPC-006']);
 assert.equal(candidate.npcTurnReview.abstainedActorIds.length,6);
 const recovered=decodeFiveFiles(encodeFiveFiles(candidate),'CH-000');
 assert.equal(verifyNarrativeSnapshot(recovered),true);
 const actor=recovered.state.world.actors['NPC-006'];
 assert.equal(actor.location_id,dest);
 assert.equal(actor.independent_plan,newPlan);
 const result=recovered.events.events.at(-1);
 assert.deepEqual(result.actor_ids,['NPC-006']);
 assert.deepEqual(result.caused_by,[noah.evidence.previousResult.eventId]);
 assert.ok(result.state_changes.some(e=>e.field==='location_id'&&
  e.before===from&&e.after===dest&&
  JSON.stringify(e.route)===JSON.stringify([from,dest])));
 for(const id of Object.keys(reasons))assert.deepEqual(
  recovered.state.world.actors[id],previous.state.world.actors[id],
  'Abstention changed an unrelated actor: '+id);
 assert.deepEqual(recovered.state.player,previous.state.player);
 assert.equal(recovered.state.time.day,-29);
 assert.equal(recovered.state.time.elapsed_minutes_since_opening_approx,
  start().state.time.elapsed_minutes_since_opening_approx+50);
 assert.ok(!recovered.chapter.includes(privateOutcome));
 assert.ok(recovered.transcript.entries.every(e=>!e.text.includes(privateOutcome)));
 assert.equal(JSON.stringify(previous),serialized);
 for(const [path,bytes] of Object.entries(raw))
  assert.equal(readFileSync(new URL('../'+path,import.meta.url),'utf8'),bytes);
 const snapshotHash=createHash('sha256').update(
  JSON.stringify(encodeFiveFiles(recovered))).digest('hex');
 return {snapshot:recovered,snapshotHash,priorHash:priorStep.snapshotHash};
}
test('narrator original-initiative assessment turn 05 uses an admitted path to own shop without invented transactions',()=>{
 const {snapshot,snapshotHash,priorHash}=
  replayNarratorThirtyTurnReviewThroughStep05();
 console.log('NARRATOR_30_TURN_REVIEW_STEP_05 '+JSON.stringify({
  modelAuthoredAtReviewTime:true,modelApiInvokedByTest:false,
  reviewTurn:5,ofPlannedTurns:30,
  priorVerifiedSnapshotHash:priorHash,
  stagedSyntheticTurn:snapshot.manifest.last_completed_turn,
  acted:['NPC-006'],abstained:6,newNpcEvents:1,
  actorMovedOnAdmittedRoute:true,physicallyAccessibleShopVerified:true,
  inventoryOrSalesNotInvented:true,privateOutcomeNotDisclosed:true,
  canonicalSaveWrites:0,
  verifiedSnapshotHash:snapshotHash,
  independentSemanticReviewCompleted:false,
  sustainedNarrativeQualityCertified:false
 }));
});
