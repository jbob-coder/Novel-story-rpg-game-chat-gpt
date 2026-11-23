// QA-only narrator-private open NPC agency; no background execution or
// compulsory routine. Relevance frames are NOT decisions or world events.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {inspectNPCNextTurn} from './npc_sequential_turns.mjs';
import {draftReviewedNPCCausalContinuation} from './living_world_causal_continuations.mjs';

const insist=(ok,message)=>{if(!ok)throw Error(message)};
const clone=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const prose=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;

export function inspectOpenNPCAgency({snapshot,actorIds=null,elapsedMinutes=0,
 elapsedDays=0,nextPeriod=null,limit=20}={}){
 verifyNarrativeSnapshot(snapshot);
 validateTemporalAdvance({currentPeriod:snapshot.state.time.time_of_day,
  elapsedMinutes,elapsedDays,nextPeriod});
 insist(Number.isSafeInteger(limit)&&limit>=1&&limit<=40,'Invalid NPC review limit');
 const actors=snapshot.state.world.actors;
 insist(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(id=>
   typeof id==='string'&&Object.hasOwn(actors,id))),
  'Unknown or duplicate NPC review selection');
 if(elapsedMinutes===0)return {
  classification:'npc_private_open_agency_v1',frames:[],reviewCount:0,
  actorCount:0,actionsPerformed:0,timeAdvanced:false,readerVisible:false};
 const selected=actorIds??Object.keys(actors).sort();
 const frames=selected.flatMap(actorId=>{
  const actor=actors[actorId];
  if(!actor?.goal&&!actor?.independent_plan&&!(actor?.commitments?.length))return [];
  const previous=inspectNPCNextTurn({snapshot,actorId});
  const ctx=previous.context;
  const openCommitments=(actor.commitments??[]).filter(c=>
   c.status==='pending'||c.status==='blocked').map(c=>({
    id:c.id,summary:c.summary,status:c.status,dueDay:c.due_day??null
   }));
  const due=openCommitments.some(c=>c.dueDay!==null&&
   c.dueDay<=snapshot.state.time.day+elapsedDays);
  const knownLast=ctx.evidence.knownEventIds.at(-1)??null;
  const sourceEventId=previous.previousResult?.eventId??knownLast;
  const priority=(due?3:0)+(previous.previousResult?1:0);
  return [{
   classification:'npc_private_open_frame_v1',actorId,
   checkpoint:ctx.checkpoint,locationId:ctx.evidence.locationId,
   goal:ctx.evidence.goal,independentPlan:ctx.evidence.independentPlan,
   resources:ctx.evidence.resources,conditions:ctx.evidence.conditions,
   needs:ctx.evidence.needs,relationships:ctx.evidence.relationships,
   commitments:openCommitments,knowledge:ctx.evidence.knowledge,
   previousResult:previous.previousResult,sourceEventId,
   priority,reviewTask:'Consider a plausible new action, reconsideration, delay or inactivity based on actor-owned evidence; do not prewrite outcomes.',
   actionSelected:false,resultKnown:false,requiresNarratorReview:true
  }];
 });
 frames.sort((a,b)=>b.priority-a.priority||a.actorId.localeCompare(b.actorId));
 return clone({classification:'npc_private_open_agency_v1',
  frames:frames.slice(0,limit),reviewCount:Math.min(limit,frames.length),
  actorCount:frames.length,actionsPerformed:0,timeAdvanced:false,
  readerVisible:false});
}

/** Produce one reviewed draft for the existing coordinator, never a story turn. */
export function draftOpenNPCAction({snapshot,frame,elapsedMinutes=0,elapsedDays=0,
 nextPeriod=null,intention,reasoning,outcome,changes=[],reviewed=false}={}){
 insist(reviewed===true,'Narrator review required for NPC action');
 insist(frame?.classification==='npc_private_open_frame_v1',
  'Private NPC frame required');
 insist(prose(intention,12,400)&&prose(reasoning,16,850)&&
  prose(outcome,12,2000),'NPC action, reasoning and result required');
 insist(Array.isArray(changes)&&changes.length<=40,'Invalid NPC changes');
 const updated=inspectOpenNPCAgency({snapshot,actorIds:[frame.actorId],
  elapsedMinutes,elapsedDays,nextPeriod,limit:1}).frames[0];
 insist(updated&&equal(frame,updated),
  'Stale NPC evidence: actor state or last resolved result changed');
 const causalBasis='Reviewed NPC intention: '+intention+' Evidence: '+reasoning;
 insist(prose(causalBasis,16,1200),'Causal explanation too long');
 if(frame.sourceEventId!==null)return draftReviewedNPCCausalContinuation({
  snapshot,actorId:frame.actorId,sourceEventIds:[frame.sourceEventId],
  reasoning:causalBasis,outcome,changes,reviewed:true
 });
 insist(prose(frame.goal??frame.independentPlan,6,700),
  'NPC without prior event needs a recorded actor goal or plan');
 return clone({actor_id:frame.actorId,reviewed:true,resolved:true,
  causal_basis:causalBasis,outcome,changes,disclosures:[]});
}
