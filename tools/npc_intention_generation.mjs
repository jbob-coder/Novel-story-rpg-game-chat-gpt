// NPC narrative generation bridge. Model/narrator creates original intentions
// from actor-owned evidence; JavaScript only verifies provenance and stages
// reviewed outcomes. No hardcoded menu, LLM/network calls, background ticks,
// player disclosure, automatic movement or live save writes.
import {inspectOpenNPCAgency} from './npc_actor_agency.mjs';
import {stageLivingWorldTurn} from './living_world_coordinator.mjs';
import {allEvents} from './chapter_history.mjs';
import {draftReviewedNPCCausalContinuation} from './living_world_causal_continuations.mjs';
import {inspectNPCContextualChoices,reviewNPCFreeformIntent}
 from './npc_contextual_intents.mjs';

const ensure=(yes,message)=>{if(!yes)throw new Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const copy=x=>JSON.parse(JSON.stringify(x));
const nonempty=(s,min=12,max=1200)=>typeof s==='string'&&
 s.trim().length>=min&&s.length<=max;

/**
 * Narrator-private, context-specific GENERATION REQUEST, not a fixed task
 * menu. Every NPC has a separate evidence packet, not other actors' private
 * memories. The provider can make one new proposal or abstain.
 */
export function prepareNPCIntentionRequests({snapshot,actorIds=null,
 elapsedMinutes=0,elapsedDays=0,nextPeriod=null,limit=20}={}){
 const inspected=inspectOpenNPCAgency({snapshot,actorIds,elapsedMinutes,
  elapsedDays,nextPeriod,limit});
 const requests=inspected.frames.map(frame=>{
  const own=inspectNPCContextualChoices({snapshot,actorId:frame.actorId});
  return {
   classification:'private_npc_intention_generation_request_v1',
   actorId:frame.actorId,
   reviewParameters:{elapsedMinutes,elapsedDays,nextPeriod},
   checkpoint:copy(own.checkpoint),
   evidence:{
    locationId:frame.locationId,goal:frame.goal,
    independentPlan:frame.independentPlan,
    previousResult:frame.previousResult,
    resources:frame.resources,needs:frame.needs,
    conditions:frame.conditions,
    relationships:frame.relationships,
    commitments:frame.commitments,
    knowledge:frame.knowledge,
    plans:own.evidence.plans,
    // Semantic recall is essential: IDs alone do not tell a narrator what happened.
    // Both the ID list and these short event records are actor-known only.
    knownEventIds:own.evidence.knownEventIds,
    knownEvents:own.evidence.knownEvents
   },
   instruction:'Decide from this actor own goals, context, knowledge and recent consequences what they might try now. The action can be novel, revised, delayed, or no action; do not reuse a stock menu. State a grounded motive, uncertainty, and only source events known to this NPC. Do not invent travel routes, business openings, other actors knowledge, success or the next turn outcome.',
   optionsFormat:'one original intention OR abstain, not a scripted future chain',
   mustNotAssumeOutcome:true,readerVisible:false,automaticExecution:false
  };
 });
 return copy({
  classification:'private_npc_intention_generation_batch_v1',
  requests,eligibleCount:inspected.actorCount,
  reviewedCount:requests.length,actionsPerformed:0,
  timeAdvanced:false,readerVisible:false
 });
}

/**
 * Validate one *externally proposed* intention (e.g. from the ChatGPT
 * narrator); this code does not itself generate creative text. The
 * proposal's causal sources are validated against that actor's own history.
 */
export function inspectNPCGeneratedIntention({snapshot,request,proposal}={}){
 ensure(request?.classification==='private_npc_intention_generation_request_v1',
  'Actor-owned intention request required');
 const params=request.reviewParameters;
 const current=prepareNPCIntentionRequests({
  snapshot,actorIds:[request.actorId],...params,limit:1}).requests[0];
 ensure(current&&same(request,current),
  'Stale or altered NPC intent-generation request');
 ensure(proposal&&typeof proposal==='object'&&!Array.isArray(proposal)&&
  proposal.actorId===request.actorId,
  'Generated proposal must belong to its requested actor');
 ensure(['act','abstain'].includes(proposal.decision),
  'Narrative proposal must act or abstain');
 ensure(nonempty(proposal.reasoning,16,1100),
  'Generated proposal requires causal reasoning');
 if(proposal.decision==='abstain'){
  ensure(proposal.intention===undefined&&proposal.destinationId===undefined&&
   proposal.sourceEventIds===undefined&&proposal.changes===undefined&&
   proposal.outcome===undefined,
   'Abstention is not a hidden action or outcome');
  return copy({classification:'npc_intention_abstention_v1',
   actorId:request.actorId,reasoning:proposal.reasoning,
   status:'reconsider_next_relevant_turn',chosenAction:null,
   actionPerformed:false,createdEvent:false,persisted:false,
   readerVisible:false});
 }
 ensure(nonempty(proposal.intention,12,600),
  'Generated action intention must be specific');
 ensure(proposal.outcome===undefined&&proposal.changes===undefined&&
  proposal.state===undefined&&proposal.success===undefined,
  'Generated intention cannot predeclare outcome or mutate state');
 ensure(Array.isArray(proposal.sourceEventIds??[])&&
  (proposal.sourceEventIds??[]).length<=3,
  'Source-event list must be bounded');
 // The request lists only the eight MOST RECENT known events for context
 // economy. Historical event evidence must not disappear merely because it
 // dropped out of that compact preview. Check the full recorded event ledger.
 const history=new Map(allEvents(snapshot).map(e=>[e.id,e]));
 ensure((proposal.sourceEventIds??[]).every(id=>{
  const event=history.get(id);
  return event&&event.turn<=request.checkpoint.completedTurn&&
   event.known_to?.includes(request.actorId);
 }), 'Intention cites an event not known by its actor');
 const reviewerContext=inspectNPCContextualChoices({
  snapshot,actorId:request.actorId});
 const checked=reviewNPCFreeformIntent({
  snapshot,context:reviewerContext,
  intention:proposal.intention,reasoning:proposal.reasoning,
  sourceEventIds:proposal.sourceEventIds??[],
  destinationId:proposal.destinationId??null,reviewed:true
 });
 // known_to links to an event, not proof of all another actor's private text.
 // Preserve source scope for the narrator's final causal adjudication.
 const citedEvidence=checked.sourceEventIds.map(eventId=>{
  const event=history.get(eventId);
  const recent=request.evidence.knownEvents.find(row=>row.id===eventId);
  const actorOwned=event.actor_ids?.length===1&&
   event.actor_ids[0]===request.actorId;
  const detailScope=actorOwned?'actor_owned_event':'known_to_reference_only';
  ensure(!recent||recent.detailScope===detailScope,
   'Cited NPC event has inconsistent private evidence scope');
  return {eventId,detailScope,
   actorOwnedFullEventText:actorOwned,
   additionalContentReviewRequired:!actorOwned||!recent,
   ...(recent?{}:{outsideRecentContext:true})};
 });
 return copy({
  classification:'npc_actor_authored_proposal_review_v1',
  actorId:request.actorId,intention:checked.intention,
  reasoning:checked.reasoning,sourceEventIds:checked.sourceEventIds,
  citedEventEvidence:citedEvidence,
  requiresReferencedContentReview:citedEvidence.some(e=>e.additionalContentReviewRequired),
  destinationId:checked.destinationId,
  graphRouteOnly:checked.possibleGraphRoute,
  physicalAccessUnverified:checked.graphAccessUnverified,
  status:'requires_current_turn_causal_adjudication',
  actionPerformed:false,createdEvent:false,persisted:false,
  readerVisible:false,predeclaredOutcome:false
 });
}

/**
 * Bring an inspected intention to the existing reviewed outcome gate.
 * It is NOT a turn, event, save, or proof of success. Any proposed action
 * can be rejected without a saved event. The actual turn coordinator and
 * transactional save remain the only authority for durable consequences.
 */
export function draftOutcomeFromNPCIntention({snapshot,request,proposal,
 outcome,changes=[],reviewed=false}={}){
 ensure(reviewed===true,'Causal outcome needs separate editorial review');
 const checked=inspectNPCGeneratedIntention({snapshot,request,proposal});
 ensure(checked.classification==='npc_actor_authored_proposal_review_v1',
  'No action can be staged for abstention');
 ensure(nonempty(outcome,12,2000),'A reviewed actual outcome is required');
 ensure(Array.isArray(changes)&&changes.length<=40,
  'Too many reviewed NPC state changes');
 const causalBasis='Reviewed NPC intention: '+checked.intention+
  ' Evidence: '+checked.reasoning;
 ensure(nonempty(causalBasis,16,1200),
  'Reviewed causal explanation too long');
 // The previous actor outcome informs CONTEXT, not necessarily the cause
 // of the new action. A new independent initiative can have no event link.
 // Link only the events the narrator explicitly cites, after proof that the
 // actor knew them and a separate causal review of the actual result.
 if(checked.sourceEventIds.length)return draftReviewedNPCCausalContinuation({
  snapshot,actorId:request.actorId,
  sourceEventIds:checked.sourceEventIds,
  reasoning:causalBasis,outcome,changes,reviewed:true});
 return copy({actor_id:request.actorId,reviewed:true,resolved:true,
  causal_basis:causalBasis,outcome,changes,disclosures:[]});
}


/**
 * Build exactly one in-memory fictional turn from narrator-authored decisions.
 * The engine never creates a player input, chooses an NPC intention or saves
 * anything. It validates complete choice-to-actor ownership, abstention,
 * private outcome separation and the existing turn coordinator rules.
 */
export function stageReviewedNPCIntentionTurn({snapshot,turn,observedHead,
 choices=[]}={}){
 ensure(snapshot?.state?.world?.actors&&turn&&typeof turn==='object',
  'Verified checkpoint and an actual authored narrative turn required');
 ensure(Array.isArray(choices)&&choices.length<=20,
  'At most 20 NPC review choices per turn');
 const elapsedMinutes=turn.elapsed_minutes,elapsedDays=turn.elapsed_days;
 const nextPeriod=turn.next_time_of_day??snapshot.state.time.time_of_day;
 const seen=new Set(),npcResolutions=[],abstained=[];
 const publicScene=[
  turn.player_text,turn.intent,turn.outcome,
  ...(Array.isArray(turn.narration_messages)?turn.narration_messages:[])
 ].filter(x=>typeof x==='string').join('\n');
 for(const item of choices){
  ensure(item&&typeof item==='object'&&
   item.request?.actorId===item.proposal?.actorId,
   'Actor-owned request and proposal must match');
  const actorId=item.request.actorId;
  ensure(!seen.has(actorId),'Only one NPC choice per actor and turn');
  seen.add(actorId);
  ensure(item.request?.reviewParameters?.elapsedMinutes===elapsedMinutes&&
   item.request?.reviewParameters?.elapsedDays===elapsedDays&&
   item.request?.reviewParameters?.nextPeriod===
    (turn.next_time_of_day??null),
   'NPC intention must review the same fictional turn interval');
  const validated=inspectNPCGeneratedIntention({
   snapshot,request:item.request,proposal:item.proposal});
  if(validated.classification==='npc_intention_abstention_v1'){
   ensure(item.reviewed===undefined&&item.outcome===undefined&&
    item.changes===undefined,
    'Abstaining NPC cannot hide an outcome or state change');
   abstained.push(actorId);
   continue;
  }
  ensure(item.reviewed===true,'NPC action needs separate causal review');
  ensure(nonempty(item.outcome,12,2000),
   'A reviewed NPC action needs a real current-turn outcome');
  // Exact-string guard; full semantic disclosure still belongs to the
  // narrator and checked knowledge transfers in the narrative engine.
  ensure(!publicScene.includes(item.outcome),
   'Private NPC outcome must not appear verbatim in player scene');
  npcResolutions.push(draftOutcomeFromNPCIntention({
   snapshot,request:item.request,proposal:item.proposal,
   reviewed:true,outcome:item.outcome,changes:item.changes??[]
  }));
 }
 return {
  ...stageLivingWorldTurn({snapshot,turn,observedHead,npcResolutions}),
  npcTurnReview:copy({
   classification:'synthetic_or_authored_turn_review_metadata_v1',
   reviewedActorIds:[...seen],actedActorIds:npcResolutions.map(x=>x.actor_id),
   abstainedActorIds:abstained,
   createdCanonicalSave:false,requiresTransactionalReadback:true,
   privateReviewerOnly:true
  })
 };
}
