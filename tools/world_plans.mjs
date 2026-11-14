// Conditional NPC intentions. Public repository storage is not confidentiality:
// visibility here protects the fictional viewpoint, not access to these files.
// Evaluations are read-only proposals; only event-backed changes may persist.
import {isDeepStrictEqual} from 'node:util';

const insist=(ok,message)=>{if(!ok)throw Error(message)};
const copy=value=>structuredClone(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const planId=value=>typeof value==='string'&&/^PLAN-\d{6,}$/.test(value);
const eventId=value=>typeof value==='string'&&/^EV-\d{6,}$/.test(value);
const npcId=value=>typeof value==='string'&&/^NPC-\d{3,}$/.test(value);
const scalar=value=>value===null||typeof value==='boolean'||typeof value==='string'||
 (typeof value==='number'&&Number.isFinite(value));
const terminal=status=>status==='completed'||status==='abandoned';
const statuses=new Set(['proposed','active','blocked','completed','abandoned']);
const asSet=value=>value instanceof Set?value:new Set(Array.isArray(value)?value:[]);
const number=id=>Number(id.slice(id.indexOf('-')+1));
const strings=value=>Array.isArray(value)&&value.length<=30&&value.every(text);
const own=(obj,key)=>obj!=null&&Object.hasOwn(obj,key);

function contextIds(state,actorIds){
 return actorIds===undefined?new Set([state?.player?.id,...Object.keys(state?.world?.actors??{})].filter(Boolean)):asSet(actorIds);
}

/** Validate records and their evidence, without assuming current requirements hold. */
export function validateNPCPlans(list,{actorId,eventIds,actorIds,state}={}){
 insist(npcId(actorId),'Plans require a known NPC owner');
 if(state)insist(own(state.world?.actors,actorId),'Unknown plan owner');
 insist(Array.isArray(list)&&list.length<=100,'Invalid NPC plan list');
 const events=asSet(eventIds),actors=contextIds(state,actorIds),seen=new Set();
 if(actors.size)insist(actors.has(actorId),'Unknown plan owner');
 for(const plan of list){
  insist(plan&&typeof plan==='object'&&!Array.isArray(plan)&&planId(plan.id)&&!seen.has(plan.id),
   'Invalid or duplicate plan ID');seen.add(plan.id);
  insist(plan.owner_actor_id===actorId&&['actor_intent','author_proposal'].includes(plan.kind),
   'Plan owner/kind mismatch');
  insist(text(plan.objective)&&text(plan.motivation)&&statuses.has(plan.status),'Plan objective, motivation or status missing');
  insist(plan.earliest_day===null||Number.isSafeInteger(plan.earliest_day),'Invalid plan earliest day');
  insist(strings(plan.risks)&&strings(plan.alternatives),'Plan risks/alternatives must be explicit lists');
  insist(Array.isArray(plan.known_by)&&new Set(plan.known_by).size===plan.known_by.length&&
   plan.known_by.every(id=>actors.has(id)),'Plan has unknown knowledge recipient');
  // V1 has no disclosure channel. An actor intention begins with its owner;
  // an author-side possibility is not knowledge held by any fictional actor.
  insist(plan.kind==='actor_intent'?isDeepStrictEqual(plan.known_by,[actorId]):
   plan.known_by.length===0&&plan.status==='proposed','Plan knowledge or author proposal execution is invalid');
  insist(eventId(plan.source_event_id)&&events.has(plan.source_event_id)&&
   eventId(plan.last_change_event_id)&&events.has(plan.last_change_event_id)&&
   number(plan.last_change_event_id)>=number(plan.source_event_id),'Plan requires existing causal event references');
  if(terminal(plan.status))insist(text(plan.resolution)&&plan.resolution_event_id===plan.last_change_event_id,
   'Terminal plan needs a recorded resolution');
  else insist(plan.resolution===null&&plan.resolution_event_id===null,'Unresolved plan cannot claim a completed result');
  insist(Array.isArray(plan.dependencies)&&new Set(plan.dependencies).size===plan.dependencies.length&&
   plan.dependencies.every(id=>planId(id)&&id!==plan.id),'Invalid plan dependencies');
  insist(Array.isArray(plan.requirements)&&plan.requirements.length<=30,'Invalid plan requirements');
  for(const requirement of plan.requirements){
   insist(requirement&&typeof requirement==='object','Invalid plan requirement');
   if(requirement.kind==='location'){
    insist(typeof requirement.location_id==='string'&&/^LOC-[A-Z0-9-]+$/.test(requirement.location_id),
     'Invalid required location');
    if(state)insist(own(state.world?.locations,requirement.location_id),'Unknown required location');
   }else if(requirement.kind==='resource'){
    insist(text(requirement.key)&&!['__proto__','prototype','constructor'].includes(requirement.key)&&
     scalar(requirement.expected),'Invalid required resource');
   }else if(requirement.kind==='commitment'){
    insist(typeof requirement.commitment_id==='string'&&/^OBL-[A-Za-z0-9_-]{3,64}$/.test(requirement.commitment_id)&&
     ['pending','blocked','resolved','cancelled'].includes(requirement.status),'Invalid required commitment');
    if(state)insist((state.world.actors[actorId].commitments??[]).some(c=>c.id===requirement.commitment_id),
     'Unknown required commitment');
   }else throw Error('Unsupported plan requirement');
  }
 }
 const plans=new Map(list.map(plan=>[plan.id,plan]));
 for(const plan of list)insist(plan.dependencies.every(id=>plans.has(id)),'Plan dependency must belong to the same owner');
 const visiting=new Set(),visited=new Set();
 function visit(id){
  insist(!visiting.has(id),'Cyclic plan dependency');
  if(visited.has(id))return;
  visiting.add(id);for(const dependency of plans.get(id).dependencies)visit(dependency);
  visiting.delete(id);visited.add(id);
 }
 for(const id of plans.keys())visit(id);
 return true;
}

function conditions(state,plan){
 const actor=state.world.actors[plan.owner_actor_id];
 const requirements=plan.requirements.map(requirement=>{
  let actual=null,met=false;
  if(requirement.kind==='location'){actual=actor.location_id;met=actual===requirement.location_id;}
  if(requirement.kind==='resource'){
   actual=own(actor.resources,requirement.key)?actor.resources[requirement.key]:null;
   met=own(actor.resources,requirement.key)&&isDeepStrictEqual(actual,requirement.expected);
  }
  if(requirement.kind==='commitment'){
   actual=(actor.commitments??[]).find(c=>c.id===requirement.commitment_id)?.status??null;
   met=actual===requirement.status;
  }
  return {requirement:copy(requirement),actual:copy(actual),met};
 });
 const dependencies=plan.dependencies.map(id=>({plan_id:id,
  status:(actor.plans??[]).find(p=>p.id===id)?.status??null}));
 return {requirements,dependencies,
  blockers:[...requirements.filter(r=>!r.met).map(r=>({kind:'requirement',requirement:r.requirement})),
   ...dependencies.filter(d=>d.status!=='completed').map(d=>({kind:'dependency',plan_id:d.plan_id}))]};
}

/** Time only makes plans reviewable. This function does not change a plan. */
export function evaluateNPCPlans({state,actorId,elapsedMinutes=0,elapsedDays=0,eventIds}={}){
 insist(state?.world?.actors&&own(state.world.actors,actorId)&&Number.isSafeInteger(state.time?.day),
  'Verified world context required for plan review');
 insist(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&elapsedMinutes<=525600&&
  Number.isSafeInteger(elapsedDays)&&elapsedDays>=0&&elapsedDays<=365&&
  elapsedDays>=Math.floor(elapsedMinutes/1440)&&elapsedDays<=Math.ceil(elapsedMinutes/1440),
  'Invalid fictional plan-review interval');
 const plans=state.world.actors[actorId].plans??[];
 const events=asSet(eventIds),actors=contextIds(state);
 validateNPCPlans(plans,{actorId,eventIds:events,actorIds:actors,state});
 if(elapsedMinutes===0)return [];
 return plans.filter(plan=>plan.kind==='actor_intent'&&!terminal(plan.status)).map(plan=>{
  const checked=conditions(state,plan),day=state.time.day+elapsedDays;
  const eligible=plan.earliest_day===null||plan.earliest_day<=day;
  return {kind:'plan_review',visibility:'narrator_private',actor_id:actorId,plan_id:plan.id,
   elapsed_minutes:elapsedMinutes,elapsed_days:elapsedDays,event_ids:[...events].sort(),
   reviewed_from_day:state.time.day,plan:copy(plan),...checked,eligible,
   ready:eligible&&checked.blockers.length===0};
 });
}

function validateReview(review,actorId){
 insist(review?.reviewed===true&&text(review.reason)&&
  Array.isArray(review.observations)&&review.observations.length>0&&review.observations.length<=30&&
  review.observations.every(o=>o&&o.actor_id===actorId&&text(o.fact)&&text(o.source)),
  'Plan change requires reviewed, attributed observations and a reason');
}

/** Structural replay validation; provide state additionally for live preconditions. */
export function validateNPCPlanChange({before,after,eventId:currentEventId,actorId,eventIds,actorIds,state,review}={}){
 insist(eventId(currentEventId),'Current plan event ID required');
 const events=asSet(eventIds);const withCurrent=new Set([...events,currentEventId]);
 validateNPCPlans(before,{actorId,eventIds:events,actorIds,state});
 validateNPCPlans(after,{actorId,eventIds:withCurrent,actorIds,state});
 insist(after.length>=before.length,'Plans cannot disappear');
 let changed=0;
 const transitions={proposed:['active','blocked','abandoned'],active:['active','blocked','completed','abandoned'],
  blocked:['active','blocked','completed','abandoned']};
 for(let index=0;index<after.length;index++){
  const previous=before[index],next=after[index];
  if(!previous){
   changed++;
   insist(next.status==='proposed'&&next.source_event_id===currentEventId&&
    next.last_change_event_id===currentEventId,'A new plan needs its current creation event and proposed status');
   continue;
  }
  insist(next.id===previous.id,'Plan order and identity cannot be rewritten');
  if(isDeepStrictEqual(previous,next))continue;
  changed++;
  insist(!terminal(previous.status),'A resolved plan cannot be rewritten or reopened');
  insist(previous.kind==='actor_intent'&&next.kind===previous.kind&&
   next.owner_actor_id===previous.owner_actor_id&&next.source_event_id===previous.source_event_id&&
   isDeepStrictEqual(next.known_by,previous.known_by),'Plan origin, ownership or knowledge cannot be rewritten');
  insist(transitions[previous.status]?.includes(next.status),'Invalid plan status transition');
  insist(next.last_change_event_id===currentEventId&&number(currentEventId)>number(previous.last_change_event_id),
   'Plan transition requires a fresh current event');
  for(const field of ['objective','motivation','requirements','dependencies','earliest_day','risks','alternatives'])
   insist(isDeepStrictEqual(previous[field],next[field]),
    'Changing a plan definition requires a separately authored replacement plan');
  validateReview(review,actorId);
  insist(Number.isSafeInteger(review.elapsed_minutes)&&review.elapsed_minutes>0&&
   Number.isSafeInteger(review.elapsed_days)&&review.elapsed_days>=0&&
   review.elapsed_days>=Math.floor(review.elapsed_minutes/1440)&&
   review.elapsed_days<=Math.ceil(review.elapsed_minutes/1440),
   'Plan transition requires a reviewed fictional interval');
  if(state&&(next.status==='active'||next.status==='completed')){
   const checked=conditions(state,next);
   // Dates are assessed over the already reviewed fictional interval; a target
   // day cannot by itself supply the reviewed action or missing resources.
   const elapsedDays=review.elapsed_days??0;
   insist(Number.isSafeInteger(elapsedDays)&&elapsedDays>=0&&elapsedDays<=365,'Invalid reviewed interval');
   insist(next.earliest_day===null||next.earliest_day<=state.time.day+elapsedDays,'Plan is not yet eligible');
   insist(checked.blockers.length===0,'Plan prerequisites changed or are not met');
  }
 }
 insist(changed===1,'Each plan event must record exactly one plan creation or transition');
 return true;
}

/** A reviewed action becomes a before/after change, never a completed save. */
export function draftReviewedPlanResolution({state,assessment,eventId:currentEventId,outcome,review}={}){
 insist(assessment?.kind==='plan_review'&&assessment.visibility==='narrator_private','Private plan assessment required');
 const current=evaluateNPCPlans({state,actorId:assessment.actor_id,
  elapsedMinutes:assessment.elapsed_minutes,elapsedDays:assessment.elapsed_days,eventIds:assessment.event_ids})
  .find(item=>item.plan_id===assessment.plan_id);
 insist(current&&isDeepStrictEqual(current,assessment),'Stale or altered plan assessment; review the current conditions again');
 insist(current.eligible,'Plan is not yet eligible');
 insist(['progress','succeeded','blocked','abandoned'].includes(outcome),'Unknown plan resolution outcome');
 validateReview(review,assessment.actor_id);
 if(outcome==='progress'||outcome==='succeeded')insist(current.ready,'Plan requirements or dependencies are blocked');
 const before=copy(state.world.actors[assessment.actor_id].plans),after=copy(before);
 const plan=after.find(p=>p.id===assessment.plan_id);
 plan.status={progress:'active',succeeded:'completed',blocked:'blocked',abandoned:'abandoned'}[outcome];
 plan.last_change_event_id=currentEventId;
 plan.resolution=terminal(plan.status)?review.reason:null;
 plan.resolution_event_id=terminal(plan.status)?currentEventId:null;
 const persistedReview={...copy(review),elapsed_minutes:assessment.elapsed_minutes,
  elapsed_days:assessment.elapsed_days,outcome};
 validateNPCPlanChange({before,after,eventId:currentEventId,actorId:assessment.actor_id,
  eventIds:assessment.event_ids,actorIds:contextIds(state),state,review:persistedReview});
 return {field:'plans',before,after,review:persistedReview};
}

/** Explicit projection: private requirements, evidence and author plans stay out. */
export function playerVisiblePlans(state,viewerId=state?.player?.id){
 if(typeof viewerId!=='string')return [];
 return Object.values(state?.world?.actors??{}).flatMap(actor=>(actor.plans??[])
  .filter(plan=>plan.kind==='actor_intent'&&plan.known_by.includes(viewerId))
  .map(plan=>({id:plan.id,owner_actor_id:plan.owner_actor_id,objective:plan.objective,status:plan.status})));
}

// A lexical guard cannot detect paraphrases. The narrator must still review
// knowledge boundaries before saving. No hidden plan text is auto-rendered.
export function assertPlanNarrationPrivacy(state,messages,viewerId=state?.player?.id){
 insist(Array.isArray(messages)&&messages.every(text),'Narration messages required');
 for(const actor of Object.values(state?.world?.actors??{}))for(const plan of actor.plans??[]){
  if(plan.kind==='actor_intent'&&plan.known_by.includes(viewerId))continue;
  const secrets=[plan.id,plan.objective,plan.motivation,...plan.risks,...plan.alternatives,plan.resolution]
   .filter(value=>typeof value==='string'&&value.length>=8);
  insist(!secrets.some(secret=>messages.some(message=>message.includes(secret))),
   'Private plan information leaked into visible narration');
 }
 return true;
}
