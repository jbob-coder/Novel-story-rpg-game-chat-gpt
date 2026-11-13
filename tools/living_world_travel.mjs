// Contextual estimates supplied by the narrator, never distances inferred from
// graph hops or canonical clock times. History remains the reference source.
const insist=(ok,message)=>{if(!ok)throw Error(message)};
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const sameRoute=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.every((place,i)=>place===b[i]);
const validMinutes=value=>Number.isSafeInteger(value)&&value>=0&&value<=525600;

// Only this established pair is known to be inside one dwelling. A shared
// CITY parent does not make trips between districts indoor movements.
function shortIndoorRoute(route){
 return route.length===2&&new Set(route).size===2&&
  route.every(id=>['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT'].includes(id));
}

export function validateTravelEstimate({state,change}={}){
 const {travel,route}=change??{};
 insist(travel&&typeof travel==='object'&&!Array.isArray(travel),
  'Contextual travel estimate required');
 insist(Array.isArray(route)&&route.length>=2&&route[0]===change.before&&
  route.at(-1)===change.after,'Invalid estimated travel route');
 const places=state?.world?.locations??{};
 insist(route.every(id=>typeof id==='string'&&id.startsWith('LOC-')&&Object.hasOwn(places,id))&&
  route.slice(1).every((id,i)=>places[route[i]].connected_ids?.includes(id)),
  'Estimated travel must follow known location connections');
 insist(nonempty(travel.mode)&&nonempty(travel.basis),'Travel mode and contextual basis required');
 insist(validMinutes(travel.elapsed_minutes),'Invalid approximate travel minutes');
 insist(travel.elapsed_minutes>0||shortIndoorRoute(route),
  'Exterior travel requires positive approximate minutes');
 if(Object.hasOwn(travel,'reference_event_id'))
  insist(typeof travel.reference_event_id==='string'&&/^EV-\d{6,}$/.test(travel.reference_event_id),
   'Invalid travel reference event');
 if(Object.hasOwn(travel,'variation_reason'))
  insist(nonempty(travel.variation_reason),'Travel variation reason must be explicit');
 return true;
}

export function latestTravelReference({events=[],actorId,route,mode,beforeTurn=Infinity}={}){
 for(let i=events.length-1;i>=0;i--){
  const event=events[i];
  if(event.turn>=beforeTurn)continue;
  const changes=event.state_changes??[];
  for(let j=changes.length-1;j>=0;j--){
   const change=changes[j];
   if(change.actor_id===actorId&&change.field==='location_id'&&
    change.travel?.mode===mode&&sameRoute(change.route,route))
    return {event_id:event.id,travel:structuredClone(change.travel)};
  }
 }
 return null;
}

export function verifyTravelHistory(snapshot){
 const events=snapshot.events.events,byTurn=new Map();
 for(const event of events){
  if(event.travel_policy_version!==undefined)
   insist(event.travel_policy_version===1,'Unknown travel policy version');
  const movements=event.state_changes.filter(change=>change.field==='location_id');
  const tracked=movements.filter(change=>event.travel_policy_version===1||change.travel!==undefined);
  if(!tracked.length)continue; // Historical records need no invented estimates.
  insist(validMinutes(event.turn_elapsed_minutes),'Travel turn requires approximate elapsed minutes');
  let budget=byTurn.get(event.turn);
  if(!budget){budget={minutes:event.turn_elapsed_minutes,actors:new Map()};byTurn.set(event.turn,budget);}
  insist(budget.minutes===event.turn_elapsed_minutes,'Travel events disagree on turn duration');
  for(const change of tracked){
   validateTravelEstimate({state:snapshot.state,change});
   const travel=change.travel;
   const reference=latestTravelReference({events,actorId:change.actor_id,route:change.route,
    mode:travel.mode,beforeTurn:event.turn});
   if(reference){
    insist(travel.reference_event_id===reference.event_id,'Latest comparable travel reference required');
    if(travel.elapsed_minutes!==reference.travel.elapsed_minutes)
     insist(nonempty(travel.variation_reason),'Changed travel estimate requires contextual explanation');
   }else insist(travel.reference_event_id===undefined,'Travel reference has no comparable prior event');
   const total=(budget.actors.get(change.actor_id)??0)+travel.elapsed_minutes;
   insist(total<=budget.minutes,'Sequential actor travel exceeds turn duration');
   budget.actors.set(change.actor_id,total);
  }
 }
 return true;
}
