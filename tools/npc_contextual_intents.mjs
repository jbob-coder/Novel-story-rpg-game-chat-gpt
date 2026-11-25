// Owner-reviewed research prototype: context-rich free-form NPC intent review.
// Pure and narrator-private. A proposal is NEVER a world action, automatic tick,
// event, decision result, or permission to mutate the five-file save.
import {allEvents} from './chapter_history.mjs';
import {worldRoute} from './living_world_routines.mjs';

const ensure=(ok,message)=>{if(!ok)throw new Error(message);};
const copy=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const prose=(x,min=12,max=1500)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
const eventId=x=>typeof x==='string'&&/^EV-\d{6,}$/.test(x);

/**
 * Unlike fixed routine selection, gather goals, plans, resources, needs, social
 * ties and the NPC's OWN knowledge without suggesting a closed action menu.
 * Other actors' secrets do not become the subject's knowledge.
 */
export function inspectNPCContextualChoices({snapshot,actorId,limitKnownEvents=8}={}){
 const state=snapshot?.state,manifest=snapshot?.manifest;
 ensure(state?.world?.actors&&state.world.locations&&manifest&&snapshot.events,
  'Verified narrative snapshot and event history required');
 ensure(typeof actorId==='string'&&Object.hasOwn(state.world.actors,actorId),
  'Known actor required for NPC context');
 ensure(Number.isSafeInteger(limitKnownEvents)&&limitKnownEvents>=1&&limitKnownEvents<=24,
  'Invalid private event context limit');
 const events=allEvents(snapshot);
 ensure(events.length===manifest.last_event_sequence,
  'NPC context needs complete saved event history');
 const a=state.world.actors[actorId];
 ensure(typeof a.location_id==='string'&&Object.hasOwn(state.world.locations,a.location_id),
  'NPC current place must exist in admitted map');
 const known=events.filter(e=>e.turn<=manifest.last_completed_turn&&
  e.known_to?.includes(actorId)).slice(-limitKnownEvents);
 return copy({
  classification:'npc_contextual_private_review_v1',
  actorId,limitKnownEvents,
  checkpoint:{
   chapterId:manifest.chapter_id,completedTurn:manifest.last_completed_turn,
   lastEventSequence:manifest.last_event_sequence,worldDay:state.time.day,
   timeOfDay:state.time.time_of_day
  },
  evidence:{
   locationId:a.location_id,goal:a.goal??null,independentPlan:a.independent_plan??null,
   resources:a.resources??{},needs:a.needs??[],conditions:a.conditions??[],
   relationships:a.relationships??{},commitments:a.commitments??[],
   plans:a.plans??[],knowledge:a.knowledge??[],
   knownEventIds:known.map(e=>e.id),
   // Actor-known history is private, bounded, and meaningful beyond opaque IDs.
   // known_to is an event reference, NOT proof that the actor learned every
   // private detail in another actor's intention or narrator-authored outcome.
   // Literal knowledge already recorded for this actor remains in knowledge.
   knownEvents:known.map(e=>{
    const authored=e.actor_ids?.length===1&&e.actor_ids[0]===actorId;
    return {id:e.id,turn:e.turn,day:e.day,
     kind:authored?e.kind:null,actorIds:authored?[actorId]:null,
     intent:authored?e.intent:null,outcome:authored?e.outcome:null,
     detailScope:authored?'actor_owned_event':'known_to_reference_only'};
   })
  },
  status:'proposal_only',executionAuthorized:false,
  readerVisible:false,automaticallySelectedAction:false
 });
}


/**
 * Narrator-private historical index. The cursor must already belong to the
 * actor's known event history; pointers never include event outcome text.
 */
export function listNPCEventMemoryIndex({snapshot,actorId,beforeEventId=null,limit=12}={}){
 const ctx=inspectNPCContextualChoices({snapshot,actorId,limitKnownEvents:1});
 ensure(Number.isSafeInteger(limit)&&limit>=1&&limit<=12,
  'NPC memory index page must contain one to twelve references');
 ensure(beforeEventId===null||eventId(beforeEventId),
  'Invalid NPC memory index cursor');
 const known=allEvents(snapshot).filter(e=>
  e.turn<=ctx.checkpoint.completedTurn&&e.known_to?.includes(actorId)).reverse();
 let start=0;
 if(beforeEventId!==null){
  const idx=known.findIndex(e=>e.id===beforeEventId);
  ensure(idx>=0,'NPC memory index cursor is not actor-known');
  start=idx+1;
 }
 const page=known.slice(start,start+limit);
 return copy({classification:'npc_private_historical_memory_index_v1',
  actorId,checkpoint:ctx.checkpoint,totalKnownEventCount:known.length,
  pointers:page.map(e=>({id:e.id,turn:e.turn,day:e.day,
   detailScope:e.actor_ids?.length===1&&e.actor_ids[0]===actorId?
    'actor_owned_event':'known_to_reference_only'})),
  hasOlder:start+page.length<known.length,
  nextBeforeEventId:page.length?page.at(-1).id:null,
  readerVisible:false,actionsPerformed:0,timeAdvanced:false});
}

/**
 * Actor-bounded read-only recall. No third-party intent or outcome is revealed
 * merely because the requester appears in known_to.
 */
export function recallNPCEventEvidence({snapshot,actorId,eventIds=[]}={}){
 const ctx=inspectNPCContextualChoices({snapshot,actorId,limitKnownEvents:1});
 ensure(Array.isArray(eventIds)&&eventIds.length>=1&&eventIds.length<=3&&
  eventIds.every(eventId)&&new Set(eventIds).size===eventIds.length,
  'NPC historical recall needs one to three distinct event IDs');
 const events=new Map(allEvents(snapshot).map(e=>[e.id,e]));
 const knownEvents=eventIds.map(id=>{
  const e=events.get(id);
  ensure(e&&e.turn<=ctx.checkpoint.completedTurn&&e.known_to?.includes(actorId),
   'NPC can recall only its previously known event references');
  const owned=e.actor_ids?.length===1&&e.actor_ids[0]===actorId;
  return {id:e.id,turn:e.turn,day:e.day,
   kind:owned?e.kind:null,actorIds:owned?[actorId]:null,
   intent:owned?e.intent:null,outcome:owned?e.outcome:null,
   detailScope:owned?'actor_owned_event':'known_to_reference_only'};
 });
 return copy({classification:'npc_private_historical_memory_recall_v1',
  actorId,checkpoint:ctx.checkpoint,knownEvents,
  readerVisible:false,actionsPerformed:0,timeAdvanced:false});
}

/**
 * Accept any meaningful textual intention, not a prescribed action_type. Verify
 * its source IDs and a possible location graph path, but do NOT infer whether
 * the actor can enter, reach a private person, finish the act or learn a secret.
 * The separate causal/adjudication and save pipeline owns all such outcomes.
 */
export function reviewNPCFreeformIntent({snapshot,context,intention,reasoning,
 destinationId=null,sourceEventIds=[],reviewed=false}={}){
 ensure(reviewed===true,'NPC free-form intention requires editorial review');
 ensure(prose(intention,12,600)&&prose(reasoning,16,1200),
  'A concrete intention and causal reasoning are required');
 ensure(context?.classification==='npc_contextual_private_review_v1',
  'Valid private NPC context required');
 const fresh=inspectNPCContextualChoices({
  snapshot,actorId:context.actorId,limitKnownEvents:context.limitKnownEvents
 });
 ensure(same(context,fresh),'Stale or altered NPC contextual evidence');
 ensure(Array.isArray(sourceEventIds)&&sourceEventIds.length<=3&&
  sourceEventIds.every(eventId)&&new Set(sourceEventIds).size===sourceEventIds.length,
  'NPC source events must be distinct and at most three');
 const all=allEvents(snapshot);
 const byId=new Map(all.map(e=>[e.id,e]));
 for(const id of sourceEventIds){
  const event=byId.get(id);
  ensure(event&&event.turn<=context.checkpoint.completedTurn&&
   event.known_to?.includes(context.actorId),
   'NPC cannot rely on an event it does not know');
 }
 const locations=snapshot.state.world.locations;
 ensure(destinationId===null||(typeof destinationId==='string'&&
  destinationId.startsWith('LOC-')&&Object.hasOwn(locations,destinationId)),
  'Destination must be an existing admitted location');
 const from=context.evidence.locationId;
 const route=destinationId===null?null:worldRoute(snapshot.state,from,destinationId);
 ensure(destinationId===null||route!==null,
  'NPC intention cannot invent a travel connection');
 return copy({
  classification:'npc_freeform_intention_proposal_v1',
  actorId:context.actorId,intention,reasoning,
  sourceEventIds,destinationId,possibleGraphRoute:route,
  graphAccessUnverified:destinationId!==null,
  status:'requires_causal_adjudication',resolved:false,persisted:false,
  playerKnows:false,eventCreated:false,timeAdvanced:false,
  actionPerformed:false,requiresNewObservation:true
 });
}
