// Bounded routine triage plus complete persisted-obligation review. Produces
// narrator-private questions, never
// claims a delivery, school arrival or offscreen action was completed.
import {worldRoute,ROUTINE_PROPOSALS} from './living_world_routines.mjs';
import {validateNPCCommitments} from './living_world_obligations.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
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
