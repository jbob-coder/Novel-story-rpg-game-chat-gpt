// QA prototype: one reviewed NPC outcome per turn, next review from its real
// saved result. Does not choose actions, tick time or modify canonical files.
import {allEvents} from './chapter_history.mjs';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {inspectNPCContextualChoices,reviewNPCFreeformIntent}
 from './npc_contextual_intents.mjs';
import {draftReviewedNPCCausalContinuation}
 from './living_world_causal_continuations.mjs';

const requireFact=(yes,message)=>{if(!yes)throw new Error(message);};
const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const prose=(value,min=12,max=600)=>typeof value==='string'&&
 value.trim().length>=min&&value.length<=max;

/**
 * Return exactly ONE current review focus, not a pre-scripted action chain.
 * The last actor-owned result is an evidence anchor, NOT a command to repeat
 * the same routine. An NPC can reconsider, defer, abandon or change course.
 */
export function inspectNPCNextTurn({snapshot,actorId}={}){
 verifyNarrativeSnapshot(snapshot);
 const context=inspectNPCContextualChoices({snapshot,actorId});
 const actor=snapshot.state.world.actors[actorId];
 const own=allEvents(snapshot).filter(event=>
  event.kind==='independent_actor'&&
  event.actor_ids?.length===1&&event.actor_ids[0]===actorId&&
  event.known_to?.includes(actorId));
 const latest=own.at(-1)??null;
 const pointer=actor.last_resolved_action??null;
 if(pointer!==null){
  requireFact(latest!==null&&pointer.event_id===latest.id&&
   pointer.day===latest.day&&prose(pointer.summary,8,2000),
   'NPC last resolved outcome diverges from verified actor history');
 }
 return copy({
  classification:'npc_single_turn_continuation_review_v1',
  actorId,reviewTurn:snapshot.manifest.last_completed_turn+1,
  context,previousResult:latest?{
   eventId:latest.id,turn:latest.turn,day:latest.day,
   outcome:latest.outcome,summary:pointer?.summary??null
  }:null,
  sourceEventId:latest?.id??
   context.evidence.knownEventIds.at(-1)??null,
  priority:'reconsider_actual_prior_result_before_new_action',
  noPredeterminedFollowUp:true,allowedToChangePlan:true,
  intentChosen:false,outcomeAssumed:false,eventStaged:false,
  timeAdvanced:false,readerVisible:false
 });
}

/**
 * Narrator-supplied INTENTION and RESULT are evaluated once; the actual
 * coordinator is responsible for enforcing max one resolution per actor/turn.
 * A prior action's event must be the causal source on the next turn. No
 * planned day-two outcome can be committed before day-one actually resolves.
 */
export function draftReviewedNPCNextTurn({snapshot,focus,intention,reasoning,
 outcome,changes=[],reviewed=false,destinationId=null}={}){
 requireFact(reviewed===true,'Editorial review required before any NPC outcome');
 requireFact(focus?.classification==='npc_single_turn_continuation_review_v1',
  'A current single-turn review focus is required');
 requireFact(prose(intention,12,400)&&prose(reasoning,16,500)&&
  prose(outcome,12,1500),'Current intention, reasoning and outcome required');
 const fresh=inspectNPCNextTurn({snapshot,actorId:focus.actorId});
 requireFact(same(focus,fresh),'Stale NPC turn focus: prior result or state changed');
 requireFact(typeof focus.sourceEventId==='string',
  'No actor-known earlier event: new result needs causal observation first');
 const preview=reviewNPCFreeformIntent({
  snapshot,context:focus.context,intention,reasoning,reviewed:true,
  destinationId,sourceEventIds:[focus.sourceEventId]});
 requireFact(preview.eventCreated===false&&preview.actionPerformed===false,
  'A proposal cannot independently perform an NPC action');
 const causalReason='The NPC considers: '+intention+' Causal review: '+reasoning;
 requireFact(prose(causalReason,16,1200),'Reviewed causal explanation too long');
 return draftReviewedNPCCausalContinuation({
  snapshot,actorId:focus.actorId,sourceEventIds:[focus.sourceEventId],
  reasoning:causalReason,outcome,changes,reviewed:true
 });
}
