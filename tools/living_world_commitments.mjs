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
  const open=(actor.commitments??[]).filter(x=>x.status==='pending'||x.status==='blocked');
  const needs=(actor.needs??[]).filter(x=>x.status==='active'||x.status==='blocked');
  const serviceCases=(actor.service_cases??[]).filter(x=>
    x.status==='open'||x.status==='blocked');
  if(!route&&!open.length&&!needs.length&&!serviceCases.length)return [];
  const hops=route?route.length-1:null;
  const family=Array.isArray(player.family_ids)&&player.family_ids.includes(actorId);
  // Deadlines and real blockers may outrank proximity; absence of a route
  // never implies that a distant obligation stops existing.
  const urgency=Math.max(0,...open.map(x=>
    (x.due_day!==null&&x.due_day<state.time.day?180:
      x.due_day===state.time.day?130:0)+
    (x.status==='blocked'?60:0)+
    (x.priority==='urgent'?30:x.priority==='important'?12:0)));
  // Explicit unresolved needs can demand review even away from Jack; this
  // is a selection heuristic, not a narrative power/character statistic.
  const needUrgency=Math.max(0,...needs.map(n=>
    (n.due_day!==null&&n.due_day<state.time.day?170:
      n.due_day===state.time.day?120:0)+
    (n.status==='blocked'?75:0)+
    (n.priority==='urgent'?40:n.priority==='important'?15:0)));
  const serviceUrgency=Math.max(0,...serviceCases.map(c=>
    (c.due_day!==null&&c.due_day<state.time.day?170:
      c.due_day===state.time.day?115:0)+
    (c.status==='blocked'?70:0)+
    (c.priority==='urgent'?35:c.priority==='important'?15:0)));
  const score=(hops===null?0:Math.max(0,100-20*hops))+
    (family?6:0)+urgency+needUrgency+serviceUrgency;
  return [{actorId,hops,score}];
 }).sort((a,b)=>b.score-a.score||a.actorId.localeCompare(b.actorId))
  .slice(0,limit).map(({actorId})=>actorId);
}
export function reviewNPCCommitments({state,actorIds=[],elapsedMinutes=0,commitments=[],targetDay=null}={}){
 requireFact(state?.world?.actors && state.time && Number.isSafeInteger(state.time.day),
  'Valid state required');
 requireFact(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&elapsedMinutes<=525600,
  'Invalid fictional time span');
 requireFact(targetDay===null||(Number.isSafeInteger(targetDay)&&
  targetDay>=state.time.day&&targetDay<=state.time.day+365),
  'Invalid obligation review day');
 const reviewDay=targetDay??state.time.day;
 requireFact(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(validId),'Invalid NPC selection');
 requireFact(Array.isArray(commitments)&&commitments.length<=100,'Invalid commitments');
 if(elapsedMinutes===0)return [];
 const selected=new Set(actorIds),out=[],seen=new Set();
 // The checked-in state is authoritative. Caller-supplied commitments remain
 // optional synthetic planning input, never a substitute for persisted facts.
 const saved=Object.entries(state.world.actors).flatMap(([id,actor])=>
  (actor.commitments??[]).map(c=>({...c,actor_id:id,origin:'saved_checkpoint'})));
 const all=[...saved,...commitments.map(c=>({...c,origin:'temporary_input'}))];
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
 for(const c of all){
  requireFact(c&&validId(c.actor_id)&&typeof c.id==='string'&&/^OBL-[A-Za-z0-9_-]{3,64}$/.test(c.id)
   &&typeof c.summary==='string'&&c.summary.trim().length>=4
   &&['pending','blocked','resolved','cancelled'].includes(c.status)
   &&typeof c.source_event_id==='string'&&/^EV-\d{6,}$/.test(c.source_event_id)
   &&(c.due_day===null||Number.isSafeInteger(c.due_day)),
   'Commitment must have actor, source event, status and explicit/unknown due day');
  requireFact(!seen.has(c.id),'Duplicate commitment id');seen.add(c.id);
  if(!selected.has(c.actor_id)||!['pending','blocked'].includes(c.status))continue;
  let review=c.status==='blocked'?'blocked_review':'deadline_unknown';
  if(c.status==='pending'&&c.due_day!==null)review=c.due_day<reviewDay?'overdue_review':
   c.due_day===reviewDay?'due_today_review':'upcoming';
  out.push({id:c.id,actorId:c.actor_id,kind:'explicit_commitment',
   summary:c.summary,sourceEventId:c.source_event_id,dueDay:c.due_day,
   priority:c.priority??'normal',blockers:c.blockers??[],origin:c.origin,
   review,requiresResolution:true,visibility:'narrator_private'});
 }
 const order={overdue_review:0,due_today_review:1,blocked_review:2,deadline_unknown:3,upcoming:4};
 return out.sort((a,b)=>(order[a.review]??4)-(order[b.review]??4)||
  a.actorId.localeCompare(b.actorId)||a.id.localeCompare(b.id));
}
