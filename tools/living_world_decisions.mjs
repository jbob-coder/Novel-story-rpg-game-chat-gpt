// Pure causal decision gate for Meridian Bay NPCs.
// Nothing here advances fictional time, invents outcomes, mutates a saved
// character, or writes the canonical five-file checkpoint.
import {planNPCAgendas,recommendNPCIntentReviews} from './living_world_agenda.mjs';
import {worldRoute} from './living_world_routines.mjs';

const requireFact=(ok,message)=>{if(!ok)throw Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
const validString=x=>typeof x==='string'&&x.trim().length>=8;

// A routine's own objective is only a planning suggestion. To certify an
// actual arrival/handover, the destination/recipient must be established.
// These dependencies are deliberately narrow; they are not new canon.
const FINAL_DESTINATION_DEPENDENCIES=Object.freeze({
 'courier-plan':'recipient_location_and_delivery',
 'parcel-obstacles':'recipient_location_and_delivery',
 'school-journey':'school_location_and_arrival',
 'clock-handover-plan':'neighbor_location_and_handover',
 'neighbor-coordination':'neighbor_contact_and_handover'
});
const CONCLUSIONS=Object.freeze(['defer','blocked','progress','failed','completed']);
const validateActorSelection=(state,actorIds)=>{
 requireFact(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>typeof id==='string'&&Object.hasOwn(state.world.actors,id))),
  'Unknown or duplicated actor selection');
};

/**
 * Build a private, inspectable assessment of one proposal for each relevant
 * actor. An assessment describes what is *known* and what must be observed,
 * not whether the NPC succeeded. All evidence is from the checkpoint and
 * earlier validated agenda; it does not assume an exact clock time.
 */
export function assessNPCDecisions({state,actorIds=null,elapsedMinutes=0,
 elapsedDays=0,nextPeriod=null,weekday=null,minute=null,
 schedules={},exceptions={},limit=8}={}){
 requireFact(state?.world?.actors&&state?.world?.locations&&state?.time,
  'Authoritative checkpoint required');
 validateActorSelection(state,actorIds);
 requireFact(Number.isSafeInteger(limit)&&limit>=0&&limit<=8,
  'Invalid assessment limit');
 const input={state,actorIds,elapsedMinutes,elapsedDays,nextPeriod,
  weekday,minute,schedules,exceptions};
 const agenda=planNPCAgendas({...input,limitPerActor:8});
 const selections=recommendNPCIntentReviews(input);
 const byId=new Map(agenda.map(x=>[x.id,x]));
 const results=[];
 for(const intent of selections.slice(0,limit===0?0:100)){
  const candidate=byId.get(intent.candidateId);
  requireFact(candidate&&candidate.actorId===intent.actorId,
   'Selected intention has no source candidate');
  const actor=state.world.actors[intent.actorId];
  const blockers=[],gaps=[];
  const source={
   recordedLocationId:actor.location_id,
   recordedGoal:actor.goal,
   recordedPlan:actor.independent_plan,
   recordedConditions:copy(actor.conditions??[]),
   recordedResourceKeys:Object.keys(actor.resources??{}),
   recordedResources:copy(actor.resources??{}),
   recordedCommitments:copy(actor.commitments??[]),
   candidateId:candidate.id,
   currentDay:state.time.day,
   reviewDay:intent.timeOfReview
  };
  if(candidate.availability==='closed')
   blockers.push({code:'confirmed_unavailable',detail:'Applicable confirmed schedule/exception says closed'});
  if(candidate.kind==='obligation'&&candidate.blockers?.length)
   for(const obstacle of candidate.blockers)
    blockers.push({code:'recorded_obligation_blocker',detail:obstacle});
  if(candidate.kind==='civilian_routine'){
   if(candidate.feasibility==='no_verified_route')
    blockers.push({code:'no_verified_route',detail:'Saved location graph has no route'});
   const resource=state.world.actors[intent.actorId]?.resources??{};
   const templateResource=candidate.resourceEvidence;
   if(templateResource===undefined)
    blockers.push({code:'required_resource_missing',detail:'Routine lacks a saved resource'});
   if(candidate.destinationId!==null&&worldRoute(state,actor.location_id,candidate.destinationId)===null)
    blockers.push({code:'no_verified_route',detail:'Destination is unreachable from saved location'});
   const routineId=candidate.id.split(':').at(-1);
   const unmet=FINAL_DESTINATION_DEPENDENCIES[routineId];
   if(unmet&&candidate.destinationId===null)
    gaps.push({code:'destination_or_handover_not_established',detail:unmet});
   if(candidate.availability==='unknown')
    gaps.push({code:'schedule_unknown',detail:'A missing schedule is not proof of access'});
   if(!Object.keys(resource).length)
    gaps.push({code:'resource_context_unknown',detail:'No saved resources'});
  }
  if(actor.conditions?.length)
   gaps.push({code:'conditions_need_human_review',detail:'Conditions have no automatic capacity interpretation'});
  if(candidate.kind==='obligation'&&candidate.review==='overdue_review')
   gaps.push({code:'overdue_does_not_mean_failed',detail:'Deadline alone proves neither failure nor completion'});
  const alternatives=intent.competingAlternatives.filter(x=>byId.has(x));
  results.push({
   classification:'narrator_private_causal_assessment',
   actorId:intent.actorId,candidateId:intent.candidateId,
   objective:intent.objective,kind:candidate.kind,
   obligationId:candidate.obligationId??null,
   source,blockingEvidence:blockers,unknowns:gaps,
   reviewContext:copy({elapsedMinutes,elapsedDays,nextPeriod,weekday,minute,
     schedules,exceptions}),
   alternatives,competition:alternatives.length>0?
    'Competing responsibilities require priority and time review':'none_selected',
   allowedConclusions:CONCLUSIONS.filter(x=>
    x!=='completed'||(blockers.length===0&&
      !gaps.some(g=>g.code==='destination_or_handover_not_established'))),
   requestedObservation:'A documented current-turn observation is required for progress, failure, or completion',
   status:'unresolved_review_only',
   persisted:false,knownToPlayer:false
  });
 }
 return copy(results.slice(0,limit));
}

/**
 * Convert an evidence-reviewed outcome to the coordinator's NPC resolution
 * input. This is a DRAFT. It does not create a save, a player turn or event.
 * The narrator must witness a *new* causal fact before accepting progress,
 * failure or completion, and all actual changes are revalidated by the
 * existing state-change + save transaction pipeline.
 */
export function draftReviewedNPCDecision({state,assessment,conclusion,
 reasoning,observations=[],outcome,changes=[],reviewed=false}={}){
 requireFact(state?.world?.actors&&assessment?.classification==='narrator_private_causal_assessment',
  'Causal assessment required');
 requireFact(CONCLUSIONS.includes(conclusion),'Unknown causal conclusion');
 requireFact(reviewed===true,'Editorial causal review required');
 requireFact(validString(reasoning)&&validString(outcome),'Specific causal reasoning and outcome required');
 const actor=state.world.actors[assessment.actorId];
 requireFact(actor,'Decision references unknown actor');
 requireFact(assessment.source?.recordedLocationId===actor.location_id&&
  assessment.source?.recordedGoal===actor.goal&&
  assessment.source?.recordedPlan===actor.independent_plan&&
  JSON.stringify(assessment.source?.recordedResourceKeys)===JSON.stringify(Object.keys(actor.resources??{}))&&
  assessment.source?.currentDay===state.time.day,
  'Stale NPC decision assessment');
 const current=assessNPCDecisions({state,actorIds:[assessment.actorId],
   ...assessment.reviewContext,limit:8})
   .find(x=>x.candidateId===assessment.candidateId);
 requireFact(current&&JSON.stringify(current)===JSON.stringify(assessment),
  'Assessment changed or cannot be reproduced from the current checkpoint');
 requireFact(Array.isArray(assessment.allowedConclusions)&&
  assessment.allowedConclusions.includes(conclusion),'Conclusion forbidden by saved constraints');
 requireFact(Array.isArray(observations)&&observations.length<=10&&
  Array.isArray(changes)&&changes.length<=40,'Invalid observation or change count');
 // Current-turn observations are not pre-existing scene facts: a human review
 // must establish them as part of a genuine player-triggered turn.
 for(const o of observations){
  requireFact(o&&o.kind==='current_turn_observation'&&
   validString(o.fact)&&validString(o.causal_source)&&
   o.confirmed_by_reviewer===true &&
   (o.observer_actor_id===assessment.actorId||
    o.observer_actor_id===state.player?.id),
   'Observation must be a reviewed, attributed current-turn fact');
 }
 const newFact=['progress','failed','completed'].includes(conclusion);
 requireFact(!newFact||observations.length>0,
  'Outcomes that change the world require reviewed new-turn evidence');
 requireFact((conclusion!=='completed'&&conclusion!=='progress')||
  assessment.blockingEvidence.length===0,
  'Cannot claim progress or completion across unresolved hard blockers');
 requireFact(changes.every(c=>c&&typeof c==='object'&&!Array.isArray(c)&&
   c.field!=='progression'&&
   (c.actor_id===undefined||c.actor_id===assessment.actorId)),
  'Unsupported or cross-actor change');
 // No effects for an unobserved deferral. The narrator can omit this draft
 // entirely when the deferral is not narratively consequential.
 requireFact(!(['defer','blocked'].includes(conclusion)&&changes.length>0&&
  observations.length===0),'Unobserved deferral cannot mutate state');
 return copy({
  actor_id:assessment.actorId,reviewed:true,resolved:true,
  causal_basis:reasoning,
  outcome,
  changes,
  disclosures:[],
  review_metadata:{
   candidate_id:assessment.candidateId,
   conclusion,
   observations:copy(observations),
   remains_pending_save:true,
   note:'Coordinator and five-file journal gate must still verify this draft'
  }
 });
}
