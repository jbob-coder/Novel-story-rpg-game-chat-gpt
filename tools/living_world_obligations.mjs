// Event-backed obligations for NPCs; no retroactive creation or unattended ticking.
// Every durable edit must be part of the owning NPC's reviewed causal event.
const insist=(ok,message)=>{if(!ok)throw new Error(message)};
const eventId=id=>typeof id==='string'&&/^EV-\d{6,}$/.test(id);
const commitmentId=id=>typeof id==='string'&&/^OBL-[A-Za-z0-9_-]{3,64}$/.test(id);
const statuses=new Set(['pending','blocked','resolved','cancelled']);
const priorities=new Set(['normal','important','urgent']);
const keys=new Set(['id','summary','source_event_id','due_day','status','priority',
  'blockers','last_change_event_id','resolution','resolution_event_id']);
const terminal=status=>status==='resolved'||status==='cancelled';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function validateNPCCommitments(list,{eventIds=null}={}){
 insist(Array.isArray(list)&&list.length<=32,'NPC commitments must be a bounded array');
 const seen=new Set();
 for(const item of list){
  insist(item&&typeof item==='object'&&!Array.isArray(item)&&
    Object.keys(item).every(k=>keys.has(k)),'Invalid NPC commitment');
  insist(commitmentId(item.id)&&!seen.has(item.id),'Invalid or duplicate obligation id');
  seen.add(item.id);
  insist(typeof item.summary==='string'&&item.summary.trim().length>=4&&item.summary.length<=300,
    'Commitment requires a concrete summary');
  insist(eventId(item.source_event_id)&&eventId(item.last_change_event_id),
    'Commitment requires causal event references');
  if(eventIds!==null)insist(eventIds.has(item.source_event_id)&&
    eventIds.has(item.last_change_event_id),'Commitment cites an unknown event');
  insist(item.due_day===null||(Number.isSafeInteger(item.due_day)&&
    item.due_day>=-30&&item.due_day<=36500),'Invalid or invented commitment deadline');
  insist(statuses.has(item.status)&&priorities.has(item.priority),
    'Invalid obligation status or priority');
  insist(Array.isArray(item.blockers)&&item.blockers.length<=6&&
    item.blockers.every(b=>typeof b==='string'&&b.trim().length>=4&&b.length<=160)&&
    new Set(item.blockers).size===item.blockers.length,'Invalid obligation blockers');
  insist(item.status!=='blocked'||item.blockers.length>0,
    'Blocked obligations require a stated obstacle');
  insist(item.status!=='pending'||item.blockers.length===0,
    'Pending obligations may not silently retain blockers');
  insist(terminal(item.status)?
    (typeof item.resolution==='string'&&item.resolution.trim().length>=8&&
      item.resolution.length<=500&&eventId(item.resolution_event_id)):
    (item.resolution===null&&item.resolution_event_id===null),
    'Terminal outcomes need causal resolution; open obligations must not claim completion');
  if(eventIds!==null&&terminal(item.status))
    insist(eventIds.has(item.resolution_event_id),'Obligation resolution cites an unknown event');
 }
 return true;
}

export function validateNPCCommitmentChange({before,after,eventId:currentEventId}={}){
 insist(eventId(currentEventId),'Causal event id required for obligations');
 validateNPCCommitments(before);
 validateNPCCommitments(after);
 const old=new Map(before.map(x=>[x.id,x]));
 for(const item of after){
  const prev=old.get(item.id);
  if(!prev){
   insist(item.source_event_id===currentEventId&&
      item.last_change_event_id===currentEventId&&!terminal(item.status),
      'New obligations require their own source event and cannot begin resolved');
  } else {
   insist(prev.source_event_id===item.source_event_id,
     'Obligation source cannot be rewritten');
   insist(!terminal(prev.status)||same(prev,item),
     'Closed obligations cannot be reopened or rewritten');
   if(!same(prev,item)){
    insist(item.last_change_event_id===currentEventId,
      'Obligation edits require their own event');
    if(terminal(item.status))
      insist(item.resolution_event_id===currentEventId,
        'Closing obligations requires a causal resolution event');
   }
  }
 }
 for(const item of before)
  insist(after.some(x=>x.id===item.id),'Obligation history cannot be silently deleted');
 return true;
}
