// D-058: bounded, qualitative NPC needs and observed decision costs.
// No needs are inferred from age, occupation, social role or passage of time.
// A need exists only after a reviewed event on a genuine player-triggered turn.
const check=(ok,message)=>{if(!ok)throw new Error(message)};
const copy=x=>x===null||x===undefined?x:JSON.parse(JSON.stringify(x));
const equal=(a,b)=>{
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const x=Object.keys(a).sort(),y=Object.keys(b).sort();
 return x.length===y.length&&x.every((key,i)=>key===y[i]&&equal(a[key],b[key]));
};
const eventId=x=>typeof x==='string'&&/^EV-\d{6,}$/.test(x);
const needId=x=>typeof x==='string'&&/^NEED-[A-Za-z0-9_-]{3,64}$/.test(x);
const recordText=(x,min=8,max=260)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
const statuses=new Set(['active','blocked','resolved','cancelled']);
const terminal=x=>x==='resolved'||x==='cancelled';
const priorities=new Set(['normal','important','urgent']);
const domains=new Set(['livelihood','family','rest','health','education','supplies',
 'social','safety','personal','mobility']);
const needKeys=new Set(['id','domain','summary','priority','status','due_day',
 'blockers','resource_keys','source_event_id','last_change_event_id',
 'tradeoffs','resolution','resolution_event_id']);
const tradeoffKeys=new Set(['event_id','decision','foregone','cost','evidence']);
const list=x=>Array.isArray(x)&&new Set(x).size===x.length;
const actorAt=(state,actorId)=>{
 check(typeof actorId==='string'&&/^NPC-\d{3,}$/.test(actorId)&&
  Object.hasOwn(state?.world?.actors??{},actorId),'Unknown NPC');
 return state.world.actors[actorId];
};
function validTradeoff(entry,eventIds){
 check(entry&&typeof entry==='object'&&!Array.isArray(entry)&&
  Object.keys(entry).length===tradeoffKeys.size&&
  Object.keys(entry).every(k=>tradeoffKeys.has(k))&&
  eventId(entry.event_id)&&
  ['decision','foregone','cost','evidence'].every(k=>recordText(entry[k],8,300)),
  'Need cost requires a bounded, attributed decision, alternative, cost and observation');
 if(eventIds!==null)check(eventIds.has(entry.event_id),
  'Need cost cites an unknown narrative event');
}
export function validateNPCNeeds(needs,{eventIds=null}={}){
 check(Array.isArray(needs)&&needs.length<=24,'NPC needs must be a bounded list');
 const seen=new Set();
 for(const n of needs){
  check(n&&typeof n==='object'&&!Array.isArray(n)&&
   Object.keys(n).length===needKeys.size&&
   Object.keys(n).every(k=>needKeys.has(k)),
   'Need has missing or unsupported fields');
  check(needId(n.id)&&!seen.has(n.id),'Duplicate or invalid NPC need ID');
  seen.add(n.id);
  check(domains.has(n.domain)&&recordText(n.summary)&&
   priorities.has(n.priority)&&statuses.has(n.status),'Invalid qualitative NPC need');
  check(n.due_day===null||(Number.isSafeInteger(n.due_day)&&
   n.due_day>=-30&&n.due_day<=36500),
   'Need deadline must be an established day or null');
  check(list(n.blockers)&&n.blockers.length<=6&&
   n.blockers.every(x=>recordText(x,4,160))&&
   list(n.resource_keys)&&n.resource_keys.length<=6&&
   n.resource_keys.every(x=>typeof x==='string'&&/^[a-zA-Z][\w-]{1,63}$/.test(x)),
   'Invalid need obstacles or resource references');
  check(n.status!=='blocked'||n.blockers.length>0,
   'Blocked needs require an observed obstacle');
  check(n.status!=='active'||n.blockers.length===0,
   'Active needs cannot conceal blockers');
  check(eventId(n.source_event_id)&&eventId(n.last_change_event_id),
   'Need requires stable causal event IDs');
  check(Array.isArray(n.tradeoffs)&&n.tradeoffs.length<=8,
   'Need tradeoff history must be bounded');
  const tradeoffIds=new Set();
  for(const entry of n.tradeoffs){
   validTradeoff(entry,eventIds);
   check(!tradeoffIds.has(entry.event_id),'Duplicate need tradeoff event');
   tradeoffIds.add(entry.event_id);
  }
  check(terminal(n.status)?
   recordText(n.resolution,8,500)&&eventId(n.resolution_event_id):
   n.resolution===null&&n.resolution_event_id===null,
   'Need closure requires a reviewed resolution, open needs cannot claim resolution');
  if(eventIds!==null){
   for(const field of ['source_event_id','last_change_event_id',
    ...(terminal(n.status)?['resolution_event_id']:[])])
    check(eventIds.has(n[field]),'Need cites an unknown narrative event');
  }
 }
 return true;
}
export function validateNPCNeedChange({before,after,eventId:currentEventId}={}){
 check(eventId(currentEventId),'Current causal event ID required');
 validateNPCNeeds(before);
 validateNPCNeeds(after);
 check(!equal(before,after),'No material NPC need change');
 const old=new Map(before.map(n=>[n.id,n]));
 for(const n of after){
  const prev=old.get(n.id);
  if(!prev){
   check(n.source_event_id===currentEventId&&
    n.last_change_event_id===currentEventId&&!terminal(n.status)&&
    n.tradeoffs.length===0,
    'New NPC needs require their own event and begin without fabricated history');
   continue;
  }
  check(prev.source_event_id===n.source_event_id&&prev.id===n.id&&
   prev.domain===n.domain,
   'Existing need identity and origin are immutable');
  check(!terminal(prev.status)||equal(prev,n),
   'Resolved needs cannot reopen or rewrite history');
  if(equal(prev,n))continue;
  check(n.last_change_event_id===currentEventId,
   'Need modification requires the actor current event');
  check(n.tradeoffs.length===prev.tradeoffs.length||
   n.tradeoffs.length===prev.tradeoffs.length+1,
   'Need history cannot be erased or grown without a single causal decision');
  check(prev.tradeoffs.every((entry,i)=>equal(entry,n.tradeoffs[i])),
   'Previous need decisions cannot be rewritten');
  if(n.tradeoffs.length>prev.tradeoffs.length)
   check(n.tradeoffs.at(-1).event_id===currentEventId,
    'New need cost requires current narrative event');
  if(terminal(n.status))
   check(n.resolution_event_id===currentEventId,
    'Need closure requires its own current narrative event');
  else check(n.resolution===null&&n.resolution_event_id===null,
   'Unresolved need cannot claim resolution');
 }
 for(const item of before)
  check(after.some(n=>n.id===item.id),'Need history cannot silently disappear');
 return true;
}
const validObservation=(o,actorId)=>o&&
 o.kind==='current_turn_observation'&&
 o.observer_actor_id===actorId&&o.confirmed_by_reviewer===true&&
 recordText(o.fact,8,350)&&recordText(o.causal_source,8,350);
const authorized=(state,actorId,eventIdValue,reviewed,observation)=>{
 const actor=actorAt(state,actorId);
 check(eventId(eventIdValue)&&reviewed===true&&
  validObservation(observation,actorId),
  'NPC need effects require reviewed, attributed current-turn evidence');
 return actor;
};
// A future narrator may introduce a genuine need during a newly reviewed
// actor event. No retroactive needs are injected into the day -29 checkpoint.
export function draftReviewedNeedIntroduction({state,actorId,eventId:ev,need,
 observation,reviewed=false}={}){
 const actor=authorized(state,actorId,ev,reviewed,observation);
 check(need&&typeof need==='object','Explicit need facts required');
 const before=copy(actor.needs??[]);
 const created={...copy(need),source_event_id:ev,
  last_change_event_id:ev,tradeoffs:[],resolution:null,resolution_event_id:null};
 const after=[...before,created];
 validateNPCNeedChange({before,after,eventId:ev});
 return copy({field:'needs',before,after});
}
// Decisions record the *foregone alternative* and a concrete observed cost.
// Passing time alone never reduces health/rest/money. Unknown effects remain
// unknown until an attributed observation in the fictional turn.
export function draftReviewedNeedTradeoff({state,actorId,needId:target,eventId:ev,
 observation,reviewed=false,decision,foregone,cost,
 status=null,blockers=null,priority=null,resolution=null}={}){
 const actor=authorized(state,actorId,ev,reviewed,observation);
 const before=copy(actor.needs??[]);
 const index=before.findIndex(n=>n.id===target);
 check(index>=0,'Unknown saved NPC need');
 const prior=before[index];
 check(!terminal(prior.status),'Closed NPC need cannot receive a new tradeoff');
 const nextStatus=status??prior.status;
 const nextBlockers=blockers??prior.blockers;
 const after=copy(before);
 after[index]={...prior,
  status:nextStatus,blockers:nextBlockers,
  priority:priority??prior.priority,
  last_change_event_id:ev,
  tradeoffs:[...prior.tradeoffs,{event_id:ev,decision,foregone,cost,
   evidence:observation.fact}],
  resolution:terminal(nextStatus)?resolution:null,
  resolution_event_id:terminal(nextStatus)?ev:null
 };
 validateNPCNeedChange({before,after,eventId:ev});
 return copy({field:'needs',before,after});
}
export function reviewNPCNeeds({state,actorIds=null,targetDay=null,limitPerActor=4}={}){
 check(state?.world?.actors&&Number.isSafeInteger(state.time?.day),
  'Saved world and narrative day required');
 const chosen=actorIds??Object.keys(state.world.actors).sort();
 check(Array.isArray(chosen)&&chosen.length<=100&&
  new Set(chosen).size===chosen.length&&
  chosen.every(id=>typeof id==='string'&&Object.hasOwn(state.world.actors,id)),
  'Unknown or repeated NPC selection');
 check(Number.isSafeInteger(limitPerActor)&&limitPerActor>=0&&limitPerActor<=24,
  'Invalid NPC need review limit');
 check(targetDay===null||(Number.isSafeInteger(targetDay)&&
  targetDay>=state.time.day&&targetDay<=state.time.day+365),
  'Invalid need review day');
 const day=targetDay??state.time.day,views=[];
 for(const actorId of chosen){
  const npc=state.world.actors[actorId];
  validateNPCNeeds(npc.needs??[]);
  for(const n of npc.needs??[]){
   if(terminal(n.status))continue;
   views.push({actorId,needId:n.id,domain:n.domain,summary:n.summary,
    priority:n.priority,status:n.status,blockers:copy(n.blockers),
    dueDay:n.due_day,resourceKeys:copy(n.resource_keys),
    tradeoffCount:n.tradeoffs.length,
    review:n.status==='blocked'?'blocked':
     n.due_day!==null&&n.due_day<day?'overdue':
     n.due_day===day?'due_today':'not_due_or_unknown',
    requiresDecision:true,persisted:true,visibility:'narrator_private'});
  }
 }
 const rank={urgent:0,important:1,normal:2};
 const statusRank={blocked:0,overdue:1,due_today:2,not_due_or_unknown:3};
 views.sort((a,b)=>(statusRank[a.review]-statusRank[b.review])||
  (rank[a.priority]-rank[b.priority])||
  a.actorId.localeCompare(b.actorId)||a.needId.localeCompare(b.needId));
 const counts=new Map();
 return copy(views.filter(x=>{
  const used=counts.get(x.actorId)??0;
  if(used>=limitPerActor)return false;
  counts.set(x.actorId,used+1);return true;
 }));
}
