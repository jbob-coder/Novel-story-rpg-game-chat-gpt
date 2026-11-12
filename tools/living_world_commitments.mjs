// Bounded NPC agenda triage. Produces narrator-private questions, never
// claims a delivery, school arrival or offscreen action was completed.
import {worldRoute,ROUTINE_PROPOSALS} from './living_world_routines.mjs';
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
export function reviewNPCCommitments({state,actorIds=[],elapsedMinutes=0,commitments=[]}={}){
 requireFact(state?.world?.actors && state.time && Number.isSafeInteger(state.time.day),
  'Valid state required');
 requireFact(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&elapsedMinutes<=525600,
  'Invalid fictional time span');
 requireFact(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(validId),'Invalid NPC selection');
 requireFact(Array.isArray(commitments)&&commitments.length<=100,'Invalid commitments');
 if(elapsedMinutes===0)return [];
 const selected=new Set(actorIds),out=[],seen=new Set();
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
 for(const c of commitments){
  requireFact(c&&validId(c.actor_id)&&typeof c.id==='string'&&/^OBL-[A-Za-z0-9_-]{3,64}$/.test(c.id)
   &&typeof c.summary==='string'&&c.summary.trim().length>=4
   &&['pending','resolved','cancelled'].includes(c.status)
   &&typeof c.source_event_id==='string'&&/^EV-\d{6,}$/.test(c.source_event_id)
   &&(c.due_day===null||Number.isSafeInteger(c.due_day)),
   'Commitment must have actor, source event, status and explicit/unknown due day');
  requireFact(!seen.has(c.id),'Duplicate commitment id');seen.add(c.id);
  if(!selected.has(c.actor_id)||c.status!=='pending')continue;
  let review='deadline_unknown';
  if(c.due_day!==null)review=c.due_day<state.time.day?'overdue_review':
   c.due_day===state.time.day?'due_today_review':'upcoming';
  out.push({id:c.id,actorId:c.actor_id,kind:'explicit_commitment',
   summary:c.summary,sourceEventId:c.source_event_id,dueDay:c.due_day,
   review,requiresResolution:true,visibility:'narrator_private'});
 }
 const order={overdue_review:0,due_today_review:1,deadline_unknown:2,upcoming:3};
 return out.sort((a,b)=>(order[a.review]??4)-(order[b.review]??4)||
  a.actorId.localeCompare(b.actorId)||a.id.localeCompare(b.id));
}
