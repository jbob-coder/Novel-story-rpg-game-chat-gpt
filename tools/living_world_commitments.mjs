// Bounded routine triage plus complete persisted-obligation review. Produces
// narrator-private questions, never
// claims a delivery, school arrival or offscreen action was completed.
import {worldRoute,ROUTINE_PROPOSALS} from './living_world_routines.mjs';
import {validateNPCCommitments} from './living_world_obligations.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {allEvents} from './chapter_history.mjs';
import {verifyNPCCausalContinuationHistory} from './living_world_causal_continuations.mjs';
const requireFact=(ok,message)=>{if(!ok)throw Error(message)};
const validId=id=>typeof id==='string'&&/^NPC-\d{3,}$/.test(id);
export function selectRelevantNPCs({state,limit=3}={}){
 requireFact(Number.isInteger(limit)&&limit>=0&&limit<=20,'Invalid selection limit');
 const actors=state?.world?.actors,places=state?.world?.locations,player=state?.player;
 if(!actors||!places||!player)return [];
 return Object.entries(actors).flatMap(([actorId,actor])=>{
  if(!validId(actorId)||typeof actor.independent_plan!=='string'||!actor.independent_plan.trim())return [];
  const route=worldRoute(state,player.location_id,actor.location_id);
  if(!route)return [];
  const hops=route.length-1;
  const family=Array.isArray(player.family_ids)&&player.family_ids.includes(actorId);
  const score=Math.max(0,100-20*hops)+(family?6:0);
  return [{actorId,hops,score}];
 }).sort((a,b)=>b.score-a.score||a.actorId.localeCompare(b.actorId))
  .slice(0,limit).map(({actorId})=>actorId);
}
// Dates describe when a review is relevant, not a guaranteed completion.
function deadlineReview(dueDay,startDay,endDay){
 if(dueDay===null)return 'deadline_unknown';
 if(dueDay<startDay)return 'overdue_review';
 if(dueDay===startDay)return 'due_today_review';
 if(dueDay<=endDay)return 'due_within_interval';
 return 'upcoming';
}
export function reviewNPCCommitments({state,actorIds=[],elapsedMinutes=0,elapsedDays=0,
 commitments=[],eventIds=null}={}){
 requireFact(state?.world?.actors && state.time && Number.isSafeInteger(state.time.day),
  'Valid state required');
 validateTemporalAdvance({currentPeriod:state.time.time_of_day,elapsedDays,elapsedMinutes});
 const endDay=state.time.day+elapsedDays;
 requireFact(Number.isSafeInteger(endDay),'Invalid narrative end day');
 requireFact(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(validId),'Invalid NPC selection');
 requireFact(Array.isArray(commitments)&&commitments.length<=100,'Invalid commitments');
 requireFact(eventIds===null||eventIds instanceof Set,'Event IDs must be a Set');
 const selected=new Set(actorIds),out=[],seen=new Set(),obligations=[];
 // The routine proximity limit must not hide a saved obligation. Review every
 // NPC list, including offscreen owners with no route or independent_plan text.
 for(const [actorId,npc] of Object.entries(state.world.actors)){
  if(npc.commitments===undefined)continue;
  requireFact(validId(actorId),'Saved obligations require an NPC owner');
  validateNPCCommitments(npc.commitments,{eventIds});
  for(const c of npc.commitments){
   const key=actorId+':'+c.id;
   requireFact(!seen.has(key),'Duplicate commitment id for owner');seen.add(key);
   obligations.push({commitment:c,actorId,origin:'saved_checkpoint'});
  }
 }
 // Temporary review hints retain the earlier compact input contract. They do
 // not replace durable records, become events, or gain persistence implicitly.
 for(const c of commitments){
  requireFact(c&&validId(c.actor_id)&&Object.hasOwn(state.world.actors,c.actor_id)&&
   typeof c.id==='string'&&/^OBL-[A-Za-z0-9_-]{3,64}$/.test(c.id)
   &&typeof c.summary==='string'&&c.summary.trim().length>=4
   &&['pending','blocked','resolved','cancelled'].includes(c.status)
   &&typeof c.source_event_id==='string'&&/^EV-\d{6,}$/.test(c.source_event_id)
   &&(c.due_day===null||Number.isSafeInteger(c.due_day)),
   'Commitment must have actor, source event, status and explicit/unknown due day');
  const key=c.actor_id+':'+c.id;
  requireFact(!seen.has(key),'Duplicate commitment id for owner');seen.add(key);
  if(eventIds!==null)requireFact(eventIds.has(c.source_event_id),
   'Commitment cites an unknown event');
  requireFact(c.blockers===undefined||(Array.isArray(c.blockers)&&
   c.blockers.every(b=>typeof b==='string'&&b.trim().length>=4)),
   'Invalid temporary obligation blockers');
  requireFact(c.status!=='blocked'||c.blockers?.length>0,
   'Blocked obligations require a stated obstacle');
  requireFact(c.status!=='pending'||!c.blockers?.length,
   'Pending obligations may not silently retain blockers');
  if(selected.has(c.actor_id))obligations.push({commitment:c,actorId:c.actor_id,
   origin:'temporary_input'});
 }
 // Validate input even for a zero interval, but never emit activity or mutate it.
 if(elapsedMinutes===0)return [];
 for(const id of selected){
  const npc=state.world.actors[id];
  if(!npc||typeof npc.independent_plan!=='string'||!npc.independent_plan.trim())continue;
  const proposal=ROUTINE_PROPOSALS.find(x=>x.actorId===id);
  const period=state.time.time_of_day;
  out.push({id:'plan:'+id,actorId:id,kind:'existing_plan',
   summary:npc.independent_plan,review:'deadline_unknown',
   timing:proposal?.periods?.includes(period)?'suggested_period':'outside_suggested_period',
   requiresResolution:true,visibility:'narrator_private'});
 }
 for(const {commitment:c,actorId,origin} of obligations){
  if(!['pending','blocked'].includes(c.status))continue;
  out.push({id:c.id,actorId,kind:'explicit_commitment',origin,
   summary:c.summary,sourceEventId:c.source_event_id,dueDay:c.due_day,
   status:c.status,priority:c.priority??null,blockers:[...(c.blockers??[])],
   review:deadlineReview(c.due_day,state.time.day,endDay),
   reviewedFromDay:state.time.day,reviewedThroughDay:endDay,
   requiresResolution:true,visibility:'narrator_private'});
 }
 const order={overdue_review:0,due_today_review:1,due_within_interval:2,
  deadline_unknown:3,upcoming:4};
 return out.sort((a,b)=>(order[a.review]??5)-(order[b.review]??5)||
  a.actorId.localeCompare(b.actorId)||a.id.localeCompare(b.id));
}

// Inspect every open commitment per NPC, regardless of the smaller agenda
// shortlist. This is private, read-only triage; urgency never proves feasibility,
// exclusive use of time or a mandatory decision.
const reviewPriorityRank={urgent:0,important:1,normal:2};
const reviewDeadlineRank={overdue_review:0,due_today_review:1,
  due_within_interval:2,deadline_unknown:3,upcoming:4};
const exact=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function inspectNPCObligationConflicts({snapshot,actorIds=null,
 elapsedMinutes=0,elapsedDays=0,maxPerActor=32}={}){
 const state=snapshot?.state,actors=state?.world?.actors;
 requireFact(actors&&state.time&&snapshot.manifest,
  'Verified checkpoint required for NPC obligation conflict review');
 requireFact(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>Object.hasOwn(actors,id))),
  'Unknown or repeated actor in obligation conflict review');
 requireFact(Number.isSafeInteger(maxPerActor)&&maxPerActor>=1&&maxPerActor<=32,
  'Invalid obligation review bound');
 validateTemporalAdvance({currentPeriod:state.time.time_of_day,
  elapsedDays,elapsedMinutes});
 const endDay=state.time.day+elapsedDays,events=allEvents(snapshot);
 requireFact(events.length===snapshot.manifest.last_event_sequence,
  'Obligation conflict review requires complete chapter history');
 const byEvent=new Map(events.map(event=>[event.id,event]));
 const allEventIds=new Set(byEvent.keys());
 const selected=actorIds??Object.keys(actors).sort();
 const result=[];
 for(const actorId of selected){
  const actor=actors[actorId],saved=actor.commitments??[];
  validateNPCCommitments(saved,{eventIds:allEventIds});
  const active=saved.filter(c=>c.status==='pending'||c.status==='blocked');
  if(!active.length)continue;
  const byDue=new Map();
  for(const c of active)if(c.due_day!==null)
   byDue.set(c.due_day,(byDue.get(c.due_day)??0)+1);
  const records=active.map(c=>{
   const origin=byEvent.get(c.source_event_id);
   const latest=byEvent.get(c.last_change_event_id);
   const created=origin?.state_changes?.some(change=>
     change.actor_id===actorId&&change.field==='commitments'&&
     (change.after??[]).some(item=>item.id===c.id)&&
     !(change.before??[]).some(item=>item.id===c.id));
   const current=latest?.state_changes?.some(change=>
     change.actor_id===actorId&&change.field==='commitments'&&
     (change.after??[]).some(item=>exact(item,c)));
   const modernSource=Number(c.source_event_id.slice(3))>29;
   const modernLatest=Number(c.last_change_event_id.slice(3))>29;
   requireFact(!modernSource||(origin?.actor_ids?.[0]===actorId&&created),
     'Obligation source event is not an actor-owned creation');
   requireFact(!modernLatest||(latest?.actor_ids?.[0]===actorId&&current),
     'Obligation latest change lacks exact actor-owned event evidence');
   return {
    id:c.id,status:c.status,priority:c.priority,dueDay:c.due_day,
    review:deadlineReview(c.due_day,state.time.day,endDay),
    sourceEventId:c.source_event_id,lastChangeEventId:c.last_change_event_id,
    originEvidence:modernSource?'exact_actor_created_event':'legacy_reference_only',
    latestChangeEvidence:modernLatest?'exact_actor_latest_event':'legacy_reference_only',
    blockers:[...c.blockers],sameKnownDueDayCount:c.due_day===null?0:byDue.get(c.due_day),
    outcomeInferred:false,requiresIndividualReview:true
   };
  }).sort((a,b)=>
   (reviewDeadlineRank[a.review]??9)-(reviewDeadlineRank[b.review]??9)||
   (reviewPriorityRank[a.priority]??3)-(reviewPriorityRank[b.priority]??3)||
   a.id.localeCompare(b.id));
  result.push({
   actorId,reviewFromDay:state.time.day,reviewThroughDay:endDay,
   activeCommitmentCount:active.length,
   blockedCommitmentCount:active.filter(c=>c.status==='blocked').length,
   hasPotentialCompetition:active.length>1,
   sameDueDayOverlapCount:[...byDue.values()].filter(n=>n>1).length,
   orderedForReviewOnly:true,mandatoryChoice:false,worldAdvanced:false,
   inferredFailure:false,inferredCompletion:false,
   unknowns:active.length>1?
    ['Task durations, feasibility and personal prioritization require separate review']:
    ['Completion and available capacity are not inferred from saved status'],
   commitments:records.slice(0,maxPerActor),
   ...(records.length>maxPerActor?{
    truncatedCount:records.length-maxPerActor,fullCount:records.length
   }:{})
  });
 }
 return JSON.parse(JSON.stringify(result));
}


// A second review lane for obligations that do not win the priority shortlist.
// An actor's recorded choice to retain/defer counts as a review only when
// stored in a causally verified independent event. This function never acts
// for that actor, changes status, or assumes a missed deadline is a failure.
export function recommendNPCObligationCoverage({snapshot,actorIds=null,limit=20}={}){
 const state=snapshot?.state,actors=state?.world?.actors;
 requireFact(actors&&snapshot?.manifest,
  'Saved NPC state and manifest required for obligation coverage');
 requireFact(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>Object.hasOwn(actors,id))),
  'Unknown or repeated actor in obligation coverage');
 requireFact(Number.isSafeInteger(limit)&&limit>=0&&limit<=100,
  'Invalid obligation coverage limit');
 const events=allEvents(snapshot);
 requireFact(events.length===snapshot.manifest.last_event_sequence,
  'Obligation coverage requires complete chapter history');
 verifyNPCCausalContinuationHistory(snapshot);
 // Validate the modern creation and latest-edit pointers as well; a forged
 // last_change_event_id must never manipulate the coverage recommendation.
 const selected=actorIds??Object.keys(actors).sort();
 inspectNPCObligationConflicts({snapshot,actorIds:selected});
 const byId=new Map(events.map(event=>[event.id,event]));
 const result=[];
 for(const actorId of selected){
  const active=(actors[actorId].commitments??[]).filter(c=>
    c.status==='pending'||c.status==='blocked');
  if(!active.length)continue;
  const candidate=active.map(c=>{
   const history=events.filter(event=>
    event.actor_ids?.[0]===actorId&&
    event.continuation_context?.obligation_review?.commitment_id===c.id&&
    Number(event.id.slice(3))>Number(c.last_change_event_id.slice(3)));
   const lastReview=history.at(-1)??null;
   const anchor=lastReview??byId.get(c.last_change_event_id);
   requireFact(anchor&&Number.isSafeInteger(anchor.turn),
    'Obligation coverage lacks an event-backed review anchor');
   return {
    commitmentId:c.id,priority:c.priority,status:c.status,dueDay:c.due_day,
    lastChangeEventId:c.last_change_event_id,
    lastExplicitReviewEventId:lastReview?.id??null,
    reviewedSinceLastChange:history.length>0,
    explicitReviewCountSinceLastChange:history.length,
    ageSinceLastAttentionTurns:snapshot.manifest.last_completed_turn-anchor.turn
   };
  }).sort((a,b)=>
   b.ageSinceLastAttentionTurns-a.ageSinceLastAttentionTurns||
   (reviewPriorityRank[a.priority]??3)-(reviewPriorityRank[b.priority]??3)||
   a.commitmentId.localeCompare(b.commitmentId));
  const selectedCommitment=candidate[0];
  result.push({
   actorId,candidateCommitmentId:selectedCommitment.commitmentId,
   candidateLastChangeEventId:selectedCommitment.lastChangeEventId,
   candidateLastExplicitReviewEventId:selectedCommitment.lastExplicitReviewEventId,
   activeCommitmentCount:active.length,
   unreviewedSinceChangeCount:candidate.filter(x=>!x.reviewedSinceLastChange).length,
   candidatesForReview:candidate,
   rationale:'oldest_documented_attention_first_not_execution_priority',
   reviewedFactsOnly:true,status:'review_only_no_action',
   outcomeChosen:false,worldAdvanced:false,mandatoryChoice:false
  });
 }
 return JSON.parse(JSON.stringify(result.slice(0,limit)));
}
