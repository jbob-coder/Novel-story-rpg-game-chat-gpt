// Lote 14 (bounded): event-linked NPC continuations, not a dialogue menu,
// decision tree, autonomous timer or automatic narrative outcome.
// A narrator must review every result during an owner-triggered story turn.
import {allEvents} from './chapter_history.mjs';

const insist=(ok,message)=>{if(!ok)throw new Error(message)};
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=(v,min=12,max=1200)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
const eventID=v=>typeof v==='string'&&/^EV-\d{6,}$/.test(v);
const eventNumber=id=>Number(id.slice(3));
const baselineLastEvent=29; // CH-000 turn-nine boundary: do not reinterpret old links.
const sourcedMemory=/^(.+) \(source: (.+); (EV-\d{6,})\)$/;

const actualEventHistory=snapshot=>{
 insist(snapshot?.state?.world?.actors&&snapshot?.manifest&&snapshot?.events,
  'Verified story checkpoint is required before reviewing NPC causal continuations');
 const events=allEvents(snapshot);
 insist(events.length===snapshot.manifest.last_event_sequence,
  'NPC causal review requires an unbroken event sequence');
 return events;
};

function assertKnownSources({events,actorId,sourceEventIds,priorTurn}){
 insist(Array.isArray(sourceEventIds)&&sourceEventIds.length>=1&&
  sourceEventIds.length<=3&&sourceEventIds.every(eventID)&&
  new Set(sourceEventIds).size===sourceEventIds.length,
  'NPC continuation needs one to three distinct prior event IDs');
 const ids=new Map(events.map(e=>[e.id,e]));
 for(const sourceId of sourceEventIds){
  const source=ids.get(sourceId);
  insist(source&&source.turn<priorTurn&&
   Array.isArray(source.known_to)&&source.known_to.includes(actorId)&&
   Array.isArray(source.actor_ids)&&source.actor_ids.length>0,
   'NPC cannot react to a future event or an event it does not know');
 }
 return true;
}

// Optional causal grounding: one exact, previously acquired actor-owned memory.
// Does not establish truth, current conviction or the need for any one action.
function validateDecisionMemoryBasis({snapshot,events,actorId,sourceEventIds,basis,
 priorTurn}){
 if(basis===undefined)return null;
 insist(basis&&typeof basis==='object'&&!Array.isArray(basis)&&
  same(Object.keys(basis).sort(),['knowledge_entry','interpretation',
   'alternative_considered'].sort())&&
  typeof basis.knowledge_entry==='string'&&
  text(basis.interpretation,16,600)&&
  text(basis.alternative_considered,16,600),
  'NPC decision memory basis requires exact memory and free-form review');
 const entry=basis.knowledge_entry,source=sourcedMemory.exec(entry),
   sourceId=source?.[3]??null;
 insist(source&&eventNumber(sourceId)>baselineLastEvent&&
  (snapshot.state.world.actors[actorId]?.knowledge??[]).includes(entry)&&
  sourceEventIds.includes(sourceId),
  'NPC decision requires an actor-owned memory from a cited prior event');
 const prior=events.find(e=>e.id===sourceId);
 insist(prior&&prior.turn<priorTurn&&prior.actor_ids?.[0]===actorId&&
  prior.known_to?.includes(actorId)&&
  prior.state_changes?.some(c=>c.field==='knowledge'&&c.actor_id===actorId&&
   c.after===entry&&c.fact===source[1]&&c.source===source[2]),
  'NPC decision source must prove actor-owned earlier knowledge acquisition');
 return clone(basis);
}

// A documented consideration of an existing obligation, including when the
// actor elects not to alter it. The reference is to the latest actor-owned
// *material* change before this decision, not to arbitrary text or a future
// value in the final checkpoint. A later independent commitment edit remains
// subject to the normal state-change validator.
function validateObligationReviewBasis({snapshot,events,actorId,sourceEventIds,
 basis,priorTurn,requireCurrent=true}){
 if(basis===undefined)return null;
 insist(basis&&typeof basis==='object'&&!Array.isArray(basis)&&
  same(Object.keys(basis).sort(),['commitment_id','last_change_event_id',
   'review_reason','alternative_considered'].sort())&&
  typeof basis.commitment_id==='string'&&
  /^OBL-[A-Za-z0-9_-]{3,64}$/.test(basis.commitment_id)&&
  eventID(basis.last_change_event_id)&&
  text(basis.review_reason,16,600)&&
  text(basis.alternative_considered,16,600),
  'NPC obligation review requires exact owner obligation and free-form alternatives');
 const id=basis.commitment_id;
 const last=events.flatMap(event=>(event.state_changes??[])
  .filter(change=>change.actor_id===actorId&&change.field==='commitments')
  .flatMap(change=>{
   const prior=(change.before??[]).find(c=>c.id===id);
   const after=(change.after??[]).find(c=>c.id===id);
   return after&&!same(prior??null,after)?[{event,item:after}]:[];
  })).at(-1);
 insist(last&&eventNumber(last.event.id)>baselineLastEvent&&
  last.event.id===basis.last_change_event_id&&
  last.event.turn<priorTurn&&
  last.event.actor_ids?.[0]===actorId&&
  last.event.known_to?.includes(actorId)&&
  sourceEventIds.includes(last.event.id)&&
  ['pending','blocked'].includes(last.item.status)&&
  last.item.last_change_event_id===last.event.id,
  'NPC obligation review must cite latest prior actor-owned open commitment change');
 if(requireCurrent){
  const saved=(snapshot.state.world.actors[actorId]?.commitments??[])
   .find(c=>c.id===id);
  insist(saved&&same(saved,last.item),
   'NPC obligation review references a changed or absent current commitment');
 }
 return clone(basis);
}


// A proposal is an actor-owned statement about an existing open obligation,
// not a contract. The recipient must hear the exact proposal through an
// actual reviewed social exchange and reply in a separate actor-owned event.
function latestOwnedObligation(events,actorId,commitmentId){
 let latest=null;
 for(const event of events)for(const change of event.state_changes??[]){
  if(change.field!=='commitments'||change.actor_id!==actorId||
   event.actor_ids?.[0]!==actorId)continue;
  const before=(change.before??[]).find(x=>x.id===commitmentId)??null;
  const after=(change.after??[]).find(x=>x.id===commitmentId)??null;
  if(after&&!same(before,after))latest={event,commitment:after};
 }
 return latest;
}
function offerKnowledgeChange(event){
 const offer=event?.continuation_context?.negotiation_offer;
 return event?.state_changes?.find(c=>c.field==='knowledge'&&
  c.actor_id===event.actor_ids?.[0]&&c.fact===offer?.offer_fact&&
  c.after===c.fact+' (source: '+c.source+'; '+event.id+')');
}
function validateNegotiationOffer({snapshot,events,actorId,sourceEventIds,
 offer,changes,priorTurn,requireCurrent=true,recordedEvent=null}){
 if(offer===undefined)return null;
 insist(offer&&typeof offer==='object'&&!Array.isArray(offer)&&
  same(Object.keys(offer).sort(),[
   'counterparty_actor_id','commitment_id','offer_fact'].sort())&&
  Object.hasOwn(snapshot.state.world.actors,offer.counterparty_actor_id)&&
  offer.counterparty_actor_id!==actorId&&
  typeof offer.commitment_id==='string'&&
  /^OBL-[A-Za-z0-9_-]{3,64}$/.test(offer.commitment_id)&&
  text(offer.offer_fact,16,500),
  'NPC negotiation offer requires a concrete obligation, recipient and terms');
 const previous=latestOwnedObligation(events,actorId,offer.commitment_id);
 insist(previous&&eventNumber(previous.event.id)>baselineLastEvent&&
  previous.event.turn<priorTurn&&
  sourceEventIds.includes(previous.event.id)&&
  previous.commitment.last_change_event_id===previous.event.id&&
  ['pending','blocked'].includes(previous.commitment.status),
  'NPC negotiation offer must cite the latest prior actor-owned open obligation');
 if(requireCurrent){
  const held=(snapshot.state.world.actors[actorId].commitments??[])
   .find(x=>x.id===offer.commitment_id);
  insist(held&&same(held,previous.commitment),
   'NPC negotiation offer cites an outdated or missing obligation');
 }
 if(recordedEvent){
  insist(offerKnowledgeChange(recordedEvent)&&
   recordedEvent.actor_ids?.[0]===actorId,
   'Recorded NPC negotiation offer lacks its own exact knowledge effect');
 }else{
  insist(Array.isArray(changes)&&changes.some(x=>x?.field==='knowledge'&&
   x.fact===offer.offer_fact),
   'NPC negotiation offer requires a recorded actor-owned proposal statement');
 }
 return clone(offer);
}
function validateNegotiationResponse({snapshot,events,actorId,sourceEventIds,
 response,priorTurn}){
 if(response===undefined)return null;
 insist(response&&typeof response==='object'&&!Array.isArray(response)&&
  same(Object.keys(response).sort(),[
   'offer_event_id','received_event_id','stance','reason'].sort())&&
  eventID(response.offer_event_id)&&eventID(response.received_event_id)&&
  ['accept','decline','counter','defer'].includes(response.stance)&&
  text(response.reason,16,600),
  'NPC negotiation response requires an attributed offer, receipt and free choice');
 const offer=events.find(e=>e.id===response.offer_event_id);
 const receipt=events.find(e=>e.id===response.received_event_id);
 const offerContext=offer?.continuation_context?.negotiation_offer;
 const offeredKnowledge=offerKnowledgeChange(offer);
 insist(offer&&offerContext&&offeredKnowledge&&
  offer.actor_ids?.length===1&&
  offer.actor_ids[0]!==actorId&&
  offerContext.counterparty_actor_id===actorId&&
  offer.turn<priorTurn,
  'NPC cannot respond to a missing or another actor negotiation offer');
 const transfer=receipt?.social_context?.transfer;
 insist(receipt&&receipt.turn>offer.turn&&receipt.turn<priorTurn&&
  sourceEventIds.includes(receipt.id)&&
  receipt.actor_ids?.length===1&&receipt.actor_ids[0]===actorId&&
  receipt.known_to?.includes(actorId)&&
  transfer?.speaker_id===offer.actor_ids[0]&&
  transfer?.recipient_id===actorId&&
  transfer?.known_entry===offeredKnowledge.after&&
  receipt.state_changes?.some(c=>c.actor_id===actorId&&c.field==='knowledge'&&
   typeof c.after==='string'&&
   (snapshot.state.world.actors[actorId].knowledge??[]).includes(c.after)),
  'NPC response requires its own verified prior social receipt of the exact offer');
 return clone(response);
}

/**
 * Private, read-only continuation possibilities, ordered deterministically.
 * A candidate is a reminder to the narrator, not a resolved actor decision.
 * The author may also cite any older known event explicitly.
 */
export function inspectNPCCausalContinuations({snapshot,actorIds=null,limitPerActor=4}={}){
 const events=actualEventHistory(snapshot),actors=snapshot.state.world.actors;
 insist(Number.isSafeInteger(limitPerActor)&&limitPerActor>=1&&limitPerActor<=12,
  'NPC continuation review must stay bounded');
 insist(actorIds===null||(Array.isArray(actorIds)&&new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>Object.hasOwn(actors,id))),
  'NPC continuation review has unknown or duplicate actors');
 const chosen=actorIds??Object.keys(actors).sort();
 return chosen.flatMap(actorId=>events.filter(event=>
  event.known_to?.includes(actorId)&&event.turn<=snapshot.manifest.last_completed_turn)
  .slice(-limitPerActor).reverse().map(event=>({
   actor_id:actorId,cause_event_id:event.id,
   source_actor_id:event.actor_ids[0],source_turn:event.turn,
   status:'review_required',resolved:false,applied:false,
   player_visible:false
  })));
}

/** Review a chosen continuation; never write a story turn or invent an outcome. */
export function draftReviewedNPCCausalContinuation({snapshot,actorId,sourceEventIds,
 reasoning,outcome,changes=[],reviewed=false,memoryBasis=undefined,
 obligationReview=undefined,negotiationOffer=undefined,
 negotiationResponse=undefined}={}){
 const events=actualEventHistory(snapshot);
 insist(Object.hasOwn(snapshot.state.world.actors,actorId),
  'NPC continuation requires an existing actor');
 insist(reviewed===true&&text(reasoning,16,1200)&&text(outcome,12,3000),
  'NPC continuation requires editorial review, reasoning and concrete result');
 insist(Array.isArray(changes)&&changes.length<=40,
  'NPC continuation changes must be a bounded event-backed array');
 assertKnownSources({events,actorId,sourceEventIds,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 const memory=validateDecisionMemoryBasis({snapshot,events,actorId,sourceEventIds,
  basis:memoryBasis,priorTurn:snapshot.manifest.last_completed_turn+1});
 const obligation=validateObligationReviewBasis({snapshot,events,actorId,
  sourceEventIds,basis:obligationReview,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 insist(negotiationOffer===undefined||negotiationResponse===undefined,
  'Negotiation proposal and response require independently recorded events');
 const offer=validateNegotiationOffer({snapshot,events,actorId,sourceEventIds,
  offer:negotiationOffer,changes,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 const response=validateNegotiationResponse({snapshot,events,actorId,sourceEventIds,
  response:negotiationResponse,priorTurn:snapshot.manifest.last_completed_turn+1});
 return clone({
  actor_id:actorId,reviewed:true,resolved:true,
  causal_basis:reasoning,outcome,changes,disclosures:[],
  continuation_context:{
   kind:'known_event',reviewed:true,reasoning,
   source_event_ids:sourceEventIds,
   ...(memory===null?{}:{decision_memory_basis:memory}),
   ...(obligation===null?{}:{obligation_review:obligation}),
   ...(offer===null?{}:{negotiation_offer:offer}),
   ...(response===null?{}:{negotiation_response:response})
  }
 });
}

/** Called before staging an event, including direct turn_engine callers. */
export function validateNPCContinuationDraft({snapshot,item}={}){
 if(item?.continuation_context===undefined){
  insist(item?.causal_source_event_ids===undefined&&item?.caused_by===undefined,
   'Use a reviewed NPC continuation context for explicit causal sources');
  return null;
 }
 const context=item.continuation_context;
 insist(item.social_context===undefined,
  'Social encounters use their separately verified paired causal events');
 insist(context&&typeof context==='object'&&!Array.isArray(context)&&
  same(Object.keys(context).sort(),
   ['kind','reasoning','reviewed','source_event_ids',
    ...(context.decision_memory_basis===undefined?[]:['decision_memory_basis']),
    ...(context.obligation_review===undefined?[]:['obligation_review']),
    ...(context.negotiation_offer===undefined?[]:['negotiation_offer']),
    ...(context.negotiation_response===undefined?[]:['negotiation_response'])].sort())&&
  context.kind==='known_event'&&context.reviewed===true&&
  text(context.reasoning,16,1200)&&
  context.reasoning===item.intent,
  'NPC continuation review differs from its actor-owned intent');
 insist(snapshot?.state?.world?.actors&&Object.hasOwn(snapshot.state.world.actors,item.actor_id),
  'Unknown causal continuation actor');
 const events=actualEventHistory(snapshot);
 assertKnownSources({events,actorId:item.actor_id,
  sourceEventIds:context.source_event_ids,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 validateDecisionMemoryBasis({snapshot,events,actorId:item.actor_id,
  sourceEventIds:context.source_event_ids,basis:context.decision_memory_basis,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 validateObligationReviewBasis({snapshot,events,actorId:item.actor_id,
  sourceEventIds:context.source_event_ids,basis:context.obligation_review,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 insist(context.negotiation_offer===undefined||
  context.negotiation_response===undefined,
  'Negotiation proposal and response require independently recorded events');
 validateNegotiationOffer({snapshot,events,actorId:item.actor_id,
  sourceEventIds:context.source_event_ids,
  offer:context.negotiation_offer,changes:item.changes,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 validateNegotiationResponse({snapshot,events,actorId:item.actor_id,
  sourceEventIds:context.source_event_ids,
  response:context.negotiation_response,
  priorTurn:snapshot.manifest.last_completed_turn+1});
 return clone(context);
}

/** Readback across active and already closed chapters, rejecting forged links. */
export function verifyNPCCausalContinuationHistory(snapshot){
 const events=actualEventHistory(snapshot),seen=[];
 const known=new Map();
 for(const event of events){
  insist(eventID(event.id)&&Array.isArray(event.caused_by),
   'NPC causal event history is malformed');
  const c=event.continuation_context,refs=event.caused_by;
  if(c===undefined){
   if(eventNumber(event.id)>baselineLastEvent&&
    event.kind==='independent_actor'&&event.social_context===undefined){
    insist(refs.length===0,
     'NPC causal event cannot claim unsourced continuation links');
   }
  }else{
   insist(eventNumber(event.id)>baselineLastEvent&&
    event.kind==='independent_actor'&&event.actor_ids?.length===1&&
    Object.hasOwn(snapshot.state.world.actors,event.actor_ids[0])&&
    event.social_context===undefined&&
    same(Object.keys(c).sort(),['kind','reviewed','reasoning','source_event_ids',
      ...(c.decision_memory_basis===undefined?[]:['decision_memory_basis']),
      ...(c.obligation_review===undefined?[]:['obligation_review']),
      ...(c.negotiation_offer===undefined?[]:['negotiation_offer']),
      ...(c.negotiation_response===undefined?[]:['negotiation_response'])].sort())&&
    c.kind==='known_event'&&c.reviewed===true&&
    text(c.reasoning,16,1200)&&event.intent===c.reasoning&&
    same(refs,c.source_event_ids)&&
    event.known_to?.includes(event.actor_ids[0])&&
    event.state_changes?.some(change=>change.actor_id===event.actor_ids[0]&&
     change.field==='last_resolved_action'),
    'Saved NPC continuation is unreviewed, altered or not actor-owned');
   assertKnownSources({events:[...known.values()],actorId:event.actor_ids[0],
    sourceEventIds:c.source_event_ids,priorTurn:event.turn});
   validateDecisionMemoryBasis({snapshot,events:[...known.values()],
    actorId:event.actor_ids[0],sourceEventIds:c.source_event_ids,
    basis:c.decision_memory_basis,priorTurn:event.turn});
   validateObligationReviewBasis({snapshot,events:[...known.values()],
    actorId:event.actor_ids[0],sourceEventIds:c.source_event_ids,
    basis:c.obligation_review,priorTurn:event.turn,requireCurrent:false});
   insist(c.negotiation_offer===undefined||
    c.negotiation_response===undefined,
    'Negotiation offer and response cannot share one actor event');
   validateNegotiationOffer({snapshot,events:[...known.values()],
    actorId:event.actor_ids[0],sourceEventIds:c.source_event_ids,
    offer:c.negotiation_offer,changes:event.state_changes,
    priorTurn:event.turn,requireCurrent:false,recordedEvent:event});
   validateNegotiationResponse({snapshot,events:[...known.values()],
    actorId:event.actor_ids[0],sourceEventIds:c.source_event_ids,
    response:c.negotiation_response,priorTurn:event.turn});
   seen.push({event_id:event.id,actor_id:event.actor_ids[0],
    source_event_ids:[...c.source_event_ids]});
  }
  insist(!known.has(event.id),'Duplicate NPC causal event ID');
  known.set(event.id,event);
 }
 return seen;
}

// Read-only consequence custody for reviewed, individually owned decisions.
// The index records actual effects and explicit later citations, not inferred
// success, NPC emotions, omitted work, or automatic world developments.
export function inspectNPCDecisionConsequenceHistory({snapshot,actorIds=null,limit=20}={}){
 const history=actualEventHistory(snapshot),actors=snapshot.state.world.actors;
 insist(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
   new Set(actorIds).size===actorIds.length&&
   actorIds.every(id=>Object.hasOwn(actors,id))),
   'Unknown or repeated actor in decision consequence review');
 insist(Number.isSafeInteger(limit)&&limit>=0&&limit<=100,
   'Invalid decision consequence review limit');
 // Refuse to present effect evidence from an invalid causal event history.
 verifyNPCCausalContinuationHistory(snapshot);
 const chosen=actorIds===null?null:new Set(actorIds);
 const decisions=history.filter(e=>e.continuation_context?.kind==='known_event'&&
   (chosen===null||chosen.has(e.actor_ids?.[0])));
 return clone(decisions.slice(-limit).map(event=>{
   const actorId=event.actor_ids[0];
   const changed=(event.state_changes??[]).filter(change=>
     change.actor_id===actorId&&change.field!=='last_resolved_action');
   const fields=[...new Set(changed.map(c=>c.field))].sort();
   const relationTargets=[...new Set(changed.filter(c=>c.field==='relationship')
     .map(c=>c.target_actor_id))].sort();
   const changedRecords=field=>[...new Set(changed.filter(c=>c.field===field)
     .flatMap(c=>{
       const previous=new Map((c.before??[]).map(item=>[item.id,item]));
       return (c.after??[]).filter(item=>
         !same(previous.get(item.id)??null,item)).map(item=>item.id);
     }))].sort();
   const later=history.filter(e=>e.turn>event.turn&&
     e.actor_ids?.length===1&&e.actor_ids[0]===actorId&&
     e.continuation_context?.source_event_ids?.includes(event.id));
   return {
     actorId,decisionEventId:event.id,
     eventPath:'chapters/'+event.chapter_id+'.events.json',
     sourceEventIds:[...event.continuation_context.source_event_ids],
     memorySourceEventId:event.continuation_context.decision_memory_basis?
       sourcedMemory.exec(event.continuation_context.decision_memory_basis.knowledge_entry)?.[3]??null:null,
     recordedEffectCount:changed.length,
     recordedEffectFields:fields,
     relationshipTargetIds:relationTargets,
     commitmentIdsChanged:changedRecords('commitments'),
     serviceCaseIdsChanged:changedRecords('service_cases'),
     independentPlanChanged:fields.includes('independent_plan'),
     laterOwnCitedFollowupEventIds:later.map(e=>e.id).slice(0,12),
     laterOwnCitedFollowupCount:later.length,
     ...(later.length>12?{followupsTruncated:true}:{}),
     status:changed.length?'actor_effects_recorded':'no_material_state_effect_recorded',
     proofScope:'event_mutations_and_explicit_same_actor_citations_only',
     outcomeTruth:'not_assessed',
     inferredCompletion:false
   };
 }));
}

// All proposal and response references are narrator-private. A recorded
// stance does not inform the offeror or silently bind either participant.
export function inspectNPCNegotiationHistory({snapshot,actorIds=null,limit=20}={}){
 const history=actualEventHistory(snapshot),actors=snapshot.state.world.actors;
 insist(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&
  actorIds.every(id=>Object.hasOwn(actors,id))),
  'Unknown or duplicate actors for NPC negotiation review');
 insist(Number.isSafeInteger(limit)&&limit>=0&&limit<=100,
  'Invalid NPC negotiation review limit');
 verifyNPCCausalContinuationHistory(snapshot);
 const chosen=actorIds===null?null:new Set(actorIds);
 const offers=history.filter(event=>
  event.continuation_context?.negotiation_offer!==undefined&&
  (chosen===null||chosen.has(event.actor_ids[0])||
   chosen.has(event.continuation_context.negotiation_offer.counterparty_actor_id)));
 return clone((limit===0?[]:offers.slice(-limit)).map(event=>{
  const offer=event.continuation_context.negotiation_offer;
  const matchingReceipts=history.filter(e=>
   e.social_context?.transfer?.speaker_id===event.actor_ids[0]&&
   e.social_context.transfer.recipient_id===offer.counterparty_actor_id&&
   e.social_context.transfer.known_entry===offerKnowledgeChange(event)?.after);
  const responses=history.filter(e=>
   e.actor_ids?.[0]===offer.counterparty_actor_id&&
   e.continuation_context?.negotiation_response?.offer_event_id===event.id)
   .map(e=>({
    eventId:e.id,actorId:e.actor_ids[0],
    receivedEventId:e.continuation_context.negotiation_response.received_event_id,
    stance:e.continuation_context.negotiation_response.stance,
    ownCommitmentsChanged:e.state_changes?.some(change=>
     change.actor_id===e.actor_ids[0]&&change.field==='commitments')??false
   }));
  return {
   offerEventId:event.id,offerorActorId:event.actor_ids[0],
   counterpartyActorId:offer.counterparty_actor_id,
   offerorCommitmentId:offer.commitment_id,
   witnessedRecipientReceiptEventIds:matchingReceipts.map(e=>e.id),
   recordedResponseCount:responses.length,responses,
   status:responses.length?'recipient_independent_response_recorded':
    'no_actor_owned_response_recorded',
   proposerKnowsResponse:'not_established_by_this_review',
   bindingCommitmentInferred:false,
   automaticCounterpartyObligation:false,
   visibleToPlayer:false
  };
 }));
}
