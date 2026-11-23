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


/**
 * Bound expensive event-history/context retrieval to a small relevant set.
 * Due responsibilities receive review priority; equally relevant actors
 * rotate across successive narrative turns so offscreen newcomers are not
 * permanently excluded by lexical order or prior-action history.
 * Review priority is not a command to act.
 */
export function rankOpenNPCReviewCandidates({actors,worldDay,completedTurn,
 elapsedDays=0,actorIds=null,limit=20}={}){
 insist(actors&&typeof actors==='object'&&!Array.isArray(actors),
  'Saved NPC actor registry required');
 insist(Number.isSafeInteger(worldDay)&&Number.isSafeInteger(completedTurn)&&
  completedTurn>=0&&Number.isSafeInteger(elapsedDays)&&elapsedDays>=0,
  'Valid fictional review time required');
 insist(Number.isSafeInteger(limit)&&limit>=1&&limit<=40,
  'Invalid NPC review limit');
 const ids=actorIds??Object.keys(actors).sort();
 insist(Array.isArray(ids)&&ids.length<=100000&&
  new Set(ids).size===ids.length&&
  ids.every(id=>typeof id==='string'&&Object.hasOwn(actors,id)),
  'Unknown or duplicate NPC review selection');
 const eligible=ids.flatMap(actorId=>{
  const a=actors[actorId];
  if(!a||!a.goal&&!a.independent_plan&&!(a.commitments?.length))return [];
  const open=(a.commitments??[]).filter(c=>
   c?.status==='pending'||c?.status==='blocked');
  const due=open.some(c=>Number.isSafeInteger(c.due_day)&&
   c.due_day<=worldDay+elapsedDays);
  // Neither past action frequency nor distance to Jack buys permanent
  // selection priority. A known commitment is a reason to check relevance.
  const priority=due?3:open.length?1:0;
  return [{actorId,priority}];
 });
 const grouped=new Map();
 for(const row of eligible){
  if(!grouped.has(row.priority))grouped.set(row.priority,[]);
  grouped.get(row.priority).push(row);
 }
 const sorted=[];
 for(const priority of [...grouped.keys()].sort((a,b)=>b-a)){
  const group=grouped.get(priority).sort((a,b)=>
   a.actorId.localeCompare(b.actorId));
  const start=completedTurn%group.length;
  sorted.push(...group.slice(start),...group.slice(0,start));
 }
 return clone({eligibleCount:eligible.length,
  selected:sorted.slice(0,limit)});
}

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
 const ranking=rankOpenNPCReviewCandidates({actors,
  worldDay:snapshot.state.time.day,
  completedTurn:snapshot.manifest.last_completed_turn,
  elapsedDays,actorIds,limit});
 const frames=ranking.selected.map(({actorId,priority})=>{
  const actor=actors[actorId];
  const previous=inspectNPCNextTurn({snapshot,actorId});
  const ctx=previous.context;
  const openCommitments=(actor.commitments??[]).filter(c=>
   c.status==='pending'||c.status==='blocked').map(c=>({
    id:c.id,summary:c.summary,status:c.status,dueDay:c.due_day??null
   }));
  const knownLast=ctx.evidence.knownEventIds.at(-1)??null;
  const sourceEventId=previous.previousResult?.eventId??knownLast;
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
 // Preselection has already bounded the expensive snapshot/actor review.
 return clone({classification:'npc_private_open_agency_v1',
  frames,reviewCount:frames.length,
  actorCount:ranking.eligibleCount,actionsPerformed:0,timeAdvanced:false,
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
