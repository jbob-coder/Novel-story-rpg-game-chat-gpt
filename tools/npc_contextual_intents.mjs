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
   // `known_to` establishes a reference to an event, not awareness of all
   // another actor's private intent, reasoning or event outcome. Only the
   // event-owning actor gets the full authorial record as generative context.
   // Other actors must rely on their OWN recorded knowledge/observations.
   knownEvents:known.map(e=>e.actor_ids?.includes(actorId)?
    {id:e.id,turn:e.turn,day:e.day,kind:e.kind,actorIds:e.actor_ids,
     contentScope:'actor_owned_event',intent:e.intent,outcome:e.outcome}:
    {id:e.id,turn:e.turn,day:e.day,kind:e.kind,actorIds:e.actor_ids,
     contentScope:'reference_only_not_full_event_knowledge'})
  },
  status:'proposal_only',executionAuthorized:false,
  readerVisible:false,automaticallySelectedAction:false
 });
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
