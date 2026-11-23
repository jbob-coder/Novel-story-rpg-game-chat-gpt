// NPC narrative generation bridge. Model/narrator creates original intentions
// from actor-owned evidence; JavaScript only verifies provenance and stages
// reviewed outcomes. No hardcoded menu, LLM/network calls, background ticks,
// player disclosure, automatic movement or live save writes.
import {inspectOpenNPCAgency,draftOpenNPCAction} from './npc_actor_agency.mjs';
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
    knownEventIds:own.evidence.knownEventIds
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
 const known=new Set(request.evidence.knownEventIds);
 ensure((proposal.sourceEventIds??[]).every(id=>known.has(id)),
  'Intention cites an event not known by its actor');
 const reviewerContext=inspectNPCContextualChoices({
  snapshot,actorId:request.actorId});
 const checked=reviewNPCFreeformIntent({
  snapshot,context:reviewerContext,
  intention:proposal.intention,reasoning:proposal.reasoning,
  sourceEventIds:proposal.sourceEventIds??[],
  destinationId:proposal.destinationId??null,reviewed:true
 });
 return copy({
  classification:'npc_actor_authored_proposal_review_v1',
  actorId:request.actorId,intention:checked.intention,
  reasoning:checked.reasoning,sourceEventIds:checked.sourceEventIds,
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
 const params=request.reviewParameters;
 const frame=inspectOpenNPCAgency({
  snapshot,actorIds:[request.actorId],...params,limit:1}).frames[0];
 return draftOpenNPCAction({snapshot,frame,...params,
  intention:checked.intention,reasoning:checked.reasoning,
  outcome,changes,reviewed:true});
}
