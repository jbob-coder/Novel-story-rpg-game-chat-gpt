// D-059: services at established locations only. A known job function is
// not proof of opening hours, staffing, successful service or a new shop.
// Case records are NPC-owned changes applied only within reviewed story events.
import {availability} from './living_world_availability.mjs';
import {worldRoute} from './living_world_routines.mjs';

const check=(ok,msg)=>{if(!ok)throw new Error(msg)};
const copy=x=>x==null?x:JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const eventId=id=>typeof id==='string'&&/^EV-\d{6,}$/.test(id);
const caseId=id=>typeof id==='string'&&/^CASE-[A-Za-z0-9_-]{3,64}$/.test(id);
const strong=(x,min=8,max=360)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
const closed=status=>status==='resolved'||status==='cancelled';
const statuses=new Set(['open','blocked','resolved','cancelled']);
const priorities=new Set(['normal','important','urgent']);
const validKeys=new Set(['id','service_id','location_id','resource_key','summary',
 'status','priority','blockers','due_day','linked_need_id','source_event_id',
 'last_change_event_id','steps','resolution','resolution_event_id']);
const stepKeys=new Set(['event_id','action','result','evidence']);
const SERVICES=Object.freeze([
 Object.freeze({id:'BAY-SVC-TERMINAL-DISPATCH',actor_id:'NPC-001',
  location_id:'LOC-TRANSIT-TERMINAL',resource_key:'work_authority',
  function:'transit_dispatch_review',label:'Coordinación de salidas del terminal',
  knownBasis:'Lena works in established terminal operations',
  proposalId:'BAY-TERM-DISPATCH'}),
 Object.freeze({id:'BAY-SVC-CROSSWATER-MAINT',actor_id:'NPC-002',
  location_id:'LOC-CROSSWATER-PLAZA',resource_key:'work_order',
  function:'plaza_maintenance_review',label:'Inspección y notas de mantenimiento de Crosswater',
  knownBasis:'Sora has a recorded routine inspection and work order',
  proposalId:'BAY-CROSS-INSPECT'}),
 Object.freeze({id:'BAY-SVC-BRUMA-ACCOUNTS',actor_id:'NPC-007',
  location_id:'LOC-CAFE-BRUMA',resource_key:'register',
  function:'manual_sales_reconciliation',label:'Revisión de anotaciones de caja en Café Bruma',
  knownBasis:'Mara recorded a register malfunction and handwritten sales',
  proposalId:'BAY-CAFE-REGISTER'})
]);
const byId=id=>SERVICES.find(s=>s.id===id)??null;
const actorAt=(state,id)=>state?.world?.actors?.[id];
const has=obj=>obj&&typeof obj==='object'&&!Array.isArray(obj);
const validEvidence=(o,id)=>has(o)&&o.kind==='current_turn_observation'&&
 o.observer_actor_id===id&&o.confirmed_by_reviewer===true&&
 strong(o.fact)&&strong(o.causal_source);
const needAt=(state,actorId,needId)=>needId===null||(
  actorAt(state,actorId)?.needs??[]).some(n=>n.id===needId);
export const ESTABLISHED_SERVICE_WORKFLOWS=SERVICES;

function validateOne(item,actorId,locations,eventIds,needs){
 check(has(item)&&Object.keys(item).length===validKeys.size&&
  Object.keys(item).every(k=>validKeys.has(k)),
  'Service case has missing or unsupported fields');
 const svc=byId(item.service_id);
 check(svc&&svc.actor_id===actorId&&
  svc.location_id===item.location_id&&
  Object.hasOwn(locations,svc.location_id)&&item.resource_key===svc.resource_key,
  'Service case references an unestablished service, actor or location');
 check(caseId(item.id)&&strong(item.summary)&&statuses.has(item.status)&&
  priorities.has(item.priority),'Invalid case identity or qualitative status');
 check(item.due_day===null||(Number.isSafeInteger(item.due_day)&&
  item.due_day>=-30&&item.due_day<=36500),
  'Service deadlines require an explicit fictional day');
 check(item.linked_need_id===null||(typeof item.linked_need_id==='string'&&
  /^NEED-[A-Za-z0-9_-]{3,64}$/.test(item.linked_need_id)&&
  (needs??[]).some(n=>n.id===item.linked_need_id)),
  'Service may link only to a recorded need of its owning NPC');
 check(Array.isArray(item.blockers)&&item.blockers.length<=6&&
  item.blockers.every(x=>strong(x,4,160))&&
  new Set(item.blockers).size===item.blockers.length,
  'Invalid service blockers');
 check(item.status!=='blocked'||item.blockers.length>0,
  'Blocked service cases require a recorded blocker');
 check(item.status!=='open'||item.blockers.length===0,
  'Open service case cannot silently retain a blocker');
 check(eventId(item.source_event_id)&&eventId(item.last_change_event_id),
  'Service case must reference causal narrative events');
 check(Array.isArray(item.steps)&&item.steps.length<=32,
  'Service steps must be bounded and preserve the history');
 const seen=new Set();
 for(const step of item.steps){
  check(has(step)&&Object.keys(step).length===stepKeys.size&&
   Object.keys(step).every(k=>stepKeys.has(k))&&
   eventId(step.event_id)&&strong(step.action)&&strong(step.result)&&
   strong(step.evidence)&&!seen.has(step.event_id),
   'Invalid or duplicated service step');
  seen.add(step.event_id);
  if(eventIds!==null)check(eventIds.has(step.event_id),
   'Service step cites an unknown event');
 }
 check(closed(item.status)?
  strong(item.resolution)&&eventId(item.resolution_event_id):
  item.resolution===null&&item.resolution_event_id===null,
  'Closed service case requires documented outcome');
 if(eventIds!==null){
  for(const key of ['source_event_id','last_change_event_id',
   ...(closed(item.status)?['resolution_event_id']:[])])
   check(eventIds.has(item[key]),'Service case cites an unknown event');
 }
}
export function validateNPCServiceCases(cases,{actorId,locations,needs=[],
 eventIds=null}={}){
 check(typeof actorId==='string'&&has(locations)&&
  Array.isArray(cases)&&cases.length<=20,'NPC service cases need a known actor and location graph');
 const seen=new Set();
 for(const item of cases){
  validateOne(item,actorId,locations,eventIds,needs);
  check(!seen.has(item.id),'Duplicate service case ID');
  seen.add(item.id);
 }
 return true;
}
export function validateNPCServiceCaseChange({before,after,actorId,locations,
 needs=[],eventId:currentEventId}={}){
 check(eventId(currentEventId),'Service case update requires actor event');
 validateNPCServiceCases(before,{actorId,locations,needs});
 validateNPCServiceCases(after,{actorId,locations,needs});
 check(!equal(before,after),'Service case changes need a material result');
 const old=new Map(before.map(item=>[item.id,item]));
 for(const next of after){
  const prev=old.get(next.id);
  if(!prev){
   check(next.source_event_id===currentEventId&&
    next.last_change_event_id===currentEventId&&next.status==='open'&&
    next.steps.length===0&&next.resolution===null&&next.resolution_event_id===null,
    'New service case needs own current event, no retroactive result');
   continue;
  }
  check(prev.service_id===next.service_id&&prev.location_id===next.location_id&&
   prev.source_event_id===next.source_event_id&&
   prev.resource_key===next.resource_key&&
   prev.linked_need_id===next.linked_need_id,
   'Service case identity, context and need linkage are immutable');
  check(!closed(prev.status)||equal(prev,next),
   'Closed service cases cannot reopen or be rewritten');
  if(equal(prev,next))continue;
  check(next.last_change_event_id===currentEventId,
   'Service case update requires the current actor event');
  check(next.steps.length===prev.steps.length+1&&
   prev.steps.every((step,i)=>equal(step,next.steps[i]))&&
   next.steps.at(-1).event_id===currentEventId,
   'Service steps must append exactly one evidenced current-turn action');
  if(closed(next.status))check(next.resolution_event_id===currentEventId,
   'Service completion requires its own narrative event');
  else check(next.resolution===null&&next.resolution_event_id===null,
   'Unresolved case must not claim a completed outcome');
 }
 for(const item of before)check(after.some(x=>x.id===item.id),
  'Service case history cannot be deleted');
 return true;
}
function authorize({state,actorId,serviceId,observation,reviewed}){
 check(state?.world?.locations&&state?.time,'Saved city checkpoint required');
 const service=byId(serviceId);
 const npc=actorAt(state,actorId);
 check(service&&npc&&service.actor_id===actorId&&
  Object.hasOwn(state.world.locations,service.location_id)&&
  Object.hasOwn(npc.resources??{},service.resource_key),
  'Service function or actor resource not established');
 check(npc.location_id===service.location_id,
  'Actual service work requires actor present at its established anchor');
 check(reviewed===true&&validEvidence(observation,actorId),
  'Service work requires actor-attributed reviewed current-turn observation');
 return {npc,service};
}
export function draftReviewedServiceOpening({state,actorId,serviceId,
 caseId:requestedId,eventId:ev,summary,priority='normal',dueDay=null,
 linkedNeedId=null,observation,reviewed=false}={}){
 const {npc,service}=authorize({state,actorId,serviceId,observation,reviewed});
 check(eventId(ev)&&caseId(requestedId),'Service opening needs unique case and event IDs');
 check(needAt(state,actorId,linkedNeedId),
  'Cannot link service case to nonexistent NPC need');
 const before=copy(npc.service_cases??[]);
 const after=[...before,{id:requestedId,service_id:serviceId,
  location_id:service.location_id,resource_key:service.resource_key,
  summary,status:'open',priority,blockers:[],due_day:dueDay,
  linked_need_id:linkedNeedId,source_event_id:ev,
  last_change_event_id:ev,steps:[],resolution:null,resolution_event_id:null}];
 validateNPCServiceCaseChange({before,after,actorId,
  locations:state.world.locations,needs:npc.needs??[],eventId:ev});
 return copy({field:'service_cases',before,after});
}
export function draftReviewedServiceStep({state,actorId,caseId:target,eventId:ev,
 action,result,observation,status=null,blockers=null,priority=null,
 resolution=null,reviewed=false}={}){
 check(caseId(target),'Known service case ID required');
 const npc=actorAt(state,actorId);
 const prior=(npc?.service_cases??[]).find(x=>x.id===target);
 check(prior,'Recorded service case required');
 check(!closed(prior.status),'Closed service cases cannot reopen or be rewritten');
 authorize({state,actorId,serviceId:prior.service_id,observation,reviewed});
 check(eventId(ev),'Service action requires current event');
 const before=copy(npc.service_cases??[]);
 const after=copy(before),idx=after.findIndex(x=>x.id===target);
 const updated=after[idx],newStatus=status??updated.status;
 updated.last_change_event_id=ev;
 updated.status=newStatus;
 updated.blockers=blockers??updated.blockers;
 updated.priority=priority??updated.priority;
 updated.resolution=closed(newStatus)?resolution:null;
 updated.resolution_event_id=closed(newStatus)?ev:null;
 updated.steps.push({event_id:ev,action,result,evidence:observation.fact});
 validateNPCServiceCaseChange({before,after,actorId,
  locations:state.world.locations,needs:npc.needs??[],eventId:ev});
 return copy({field:'service_cases',before,after});
}
// Inspection recognizes three previously established job functions and their
// existing LOC anchors. It does not claim the service is currently OPEN.
export function inspectEstablishedServices({state,actorIds=null,serviceId=null,
 weekday=null,minute=null,schedules={},exceptions={}}={}){
 check(state?.world?.locations&&state?.world?.actors,'Saved Meridian Bay state required');
 const chosen=actorIds===null?null:new Set(actorIds);
 check(chosen===null||(Array.isArray(actorIds)&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(id=>
  Object.hasOwn(state.world.actors,id))),'Invalid service actor selection');
 check(serviceId===null||byId(serviceId),'Unknown established service');
 return copy(SERVICES.filter(s=>serviceId===null||s.id===serviceId)
  .filter(s=>chosen===null||chosen.has(s.actor_id))
  .filter(s=>Object.hasOwn(state.world.locations,s.location_id))
  .map(s=>{
   const actor=state.world.actors[s.actor_id];
   const window=availability({schedule:schedules[s.id]??null,
    exception:exceptions[s.id]??null,weekday,minute});
   const route=worldRoute(state,actor?.location_id,s.location_id);
   return {...s,
    classification:'established_function_not_a_confirmed_shift',
    serviceNow:window.status,availabilitySource:window.source,
    actorPresentAtAnchor:actor?.location_id===s.location_id,
    actorResourceRecorded:Object.hasOwn(actor?.resources??{},s.resource_key),
    route,openingHours:null,travelMinutes:null,
    verifiedActiveNow:false,
    recordedCases:(actor?.service_cases??[]).filter(c=>c.service_id===s.id)
      .map(c=>({id:c.id,status:c.status,dueDay:c.due_day,
       linkedNeedId:c.linked_need_id,lastEventId:c.last_change_event_id})),
    pendingNeeds:(actor?.needs??[]).filter(n=>n.status==='active'||n.status==='blocked')
      .filter(n=>n.resource_keys.includes(s.resource_key))
      .map(n=>({id:n.id,priority:n.priority,status:n.status}))
   };
  }));
}
export function reviewServiceCases({state,actorIds=null,targetDay=null}={}){
 check(state?.world?.actors&&state.time&&Number.isSafeInteger(state.time.day),
  'Saved narrative day required');
 const select=actorIds===null?null:new Set(actorIds);
 check(select===null||(Array.isArray(actorIds)&&
  new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>Object.hasOwn(state.world.actors,id))),
  'Invalid service case actor selection');
 check(targetDay===null||(Number.isSafeInteger(targetDay)&&
  targetDay>=state.time.day&&targetDay<=state.time.day+365),
  'Invalid service case review day');
 const day=targetDay??state.time.day,rows=[];
 for(const [actorId,npc] of Object.entries(state.world.actors)){
  if(select!==null&&!select.has(actorId))continue;
  validateNPCServiceCases(npc.service_cases??[],{actorId,
   locations:state.world.locations,needs:npc.needs??[]});
  for(const c of npc.service_cases??[]){
   if(closed(c.status))continue;
   rows.push({classification:'narrator_private_service_review',
    actorId,caseId:c.id,serviceId:c.service_id,anchorId:c.location_id,
    priority:c.priority,status:c.status,linkedNeedId:c.linked_need_id,
    blockers:copy(c.blockers),dueDay:c.due_day,recordedSteps:c.steps.length,
    review:c.status==='blocked'?'blocked':
     c.due_day!==null&&c.due_day<day?'overdue':
     c.due_day===day?'due_today':'unknown_or_upcoming',
    requiresCausalResolution:true,persisted:true});
  }
 }
 const p={urgent:0,important:1,normal:2};
 const r={blocked:0,overdue:1,due_today:2,unknown_or_upcoming:3};
 return copy(rows.sort((a,b)=>r[a.review]-r[b.review]||
  p[a.priority]-p[b.priority]||a.actorId.localeCompare(b.actorId)||
  a.caseId.localeCompare(b.caseId)));
}
