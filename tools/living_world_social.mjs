import {allEvents} from './chapter_history.mjs';
import {NPC_KNOWLEDGE_ANCHOR} from './living_world_knowledge_anchor.mjs';
import {verifyNPCIntroductionHistory} from './living_world_npc_introduction.mjs';
// Selective adaptation of PR #13 social contacts to the admitted 15-place world.
// Source Git blob 971cf964a45fe1842c986288212543c198f8f63a.
// Event-backed NPC social contacts. Proposal-only until a player-triggered,
// reviewed story turn is staged, saved atomically and read back.
// Direct co-location is necessary, but never sufficient to infer a conversation.
const ensure=(ok,message)=>{if(!ok)throw Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const knownText=x=>typeof x==='string'&&x.trim().length>=8&&x.length<=600;
const socialId=x=>typeof x==='string'&&/^SOC-[A-Za-z0-9_-]{4,64}$/.test(x);
const contactIds=(state,ids)=>Array.isArray(ids)&&ids.length===2&&
 ids[0]!==ids[1]&&ids.every(id=>typeof id==='string'&&/^NPC-\d{3,}$/.test(id)&&
 Object.hasOwn(state?.world?.actors??{},id))&&ids[0]<ids[1];
const observationValid=(observation,participants)=>observation&&
 observation.kind==='current_turn_observation'&&
 knownText(observation.fact)&&knownText(observation.causal_source)&&
 participants.includes(observation.observer_actor_id)&&
 observation.confirmed_by_reviewer===true;
const statementFact=(speaker,entry)=>`Reported by ${speaker} (not independently verified): ${entry}`;
const statementSource=(id,place,speaker)=>
 `Reviewed direct exchange ${id} at ${place} from ${speaker}`;

function preservesRelationship(entry,before,context){
 return entry.after&&typeof entry.after==='object'&&!Array.isArray(entry.after)&&
     typeof entry.after.bond==='string'&&entry.after.bond.trim().length>=4&&
     entry.after.latest_shared_moment===context.observation.fact&&
     (before===null?
      typeof entry.after.relation==='string'&&entry.after.relation.trim().length>=4&&
       Object.keys(entry.after).every(k=>['relation','bond','latest_shared_moment'].includes(k)):
      Object.keys(before).every(key=>['bond','latest_shared_moment'].includes(key)||
       same(entry.after[key],before[key]))&&
       Object.keys(entry.after).every(key=>Object.hasOwn(before,key)||
        ['bond','latest_shared_moment'].includes(key))&&
       entry.after.relation===before.relation);
}

function validateContact(state,context){
 ensure(state?.world?.actors&&state?.world?.locations&&state.time,
  'Saved NPC world required');
 ensure(context&&socialId(context.interaction_id)&&
  contactIds(state,context.participant_ids),'Invalid social interaction participants');
 if(context.elapsed_minutes!==undefined)ensure(Number.isSafeInteger(context.elapsed_minutes)&&
  context.elapsed_minutes>0&&context.elapsed_minutes<=525600,'Invalid social contact duration');
 const [a,b]=context.participant_ids;
 const first=state.world.actors[a],second=state.world.actors[b];
 ensure(first.location_id===second.location_id&&
  first.location_id===context.location_id&&
  Object.hasOwn(state.world.locations,context.location_id),
  'Direct social contact requires confirmed shared NPC location');
 ensure(observationValid(context.observation,context.participant_ids),
  'Social contact requires reviewed attributed current-turn observation');
 if(context.transfer!==null){
  const t=context.transfer;
  ensure(t&&context.participant_ids.includes(t.speaker_id)&&
   context.participant_ids.includes(t.recipient_id)&&
   t.speaker_id!==t.recipient_id&&knownText(t.known_entry)&&
   (state.world.actors[t.speaker_id].knowledge??[]).includes(t.known_entry),
   'Speaker must already know the transmitted statement');
  ensure(statementFact(t.speaker_id,t.known_entry).length<=900,
   'Social statement exceeds bounded transfer size');
 }
 return true;
}

/**
 * Input outcomes are authored/reviewed, never invented here.
 * relationshipUpdates: [{actorId, bond, relation?}]. A new relation requires
 * explicit relation name; existing relationship attributes (including private
 * flags) are preserved. Both participants receive separate actor-owned events.
 */
export function draftReviewedSocialContact({state,interactionId,participantIds,
 observation,relationshipUpdates=[],knowledgeTransfer=null,
 outcomes={},reviewed=false,elapsedMinutes=undefined}={}){
 ensure(reviewed===true,'Social contact requires editorial review');
 const ids=Array.isArray(participantIds)?[...participantIds].sort():participantIds;
 const context={
  interaction_id:interactionId,participant_ids:ids,
  ...(elapsedMinutes===undefined?{}:{elapsed_minutes:elapsedMinutes}),
  location_id:ids?.length===2?state?.world?.actors?.[ids[0]]?.location_id:null,
  observation:copy(observation),transfer:knowledgeTransfer===null?null:copy(knowledgeTransfer)
 };
 validateContact(state,context);
 ensure(Array.isArray(relationshipUpdates)&&relationshipUpdates.length<=2&&
  new Set(relationshipUpdates.map(x=>x?.actorId)).size===relationshipUpdates.length&&
  relationshipUpdates.every(x=>ids.includes(x?.actorId)&&
   typeof x.bond==='string'&&x.bond.trim().length>=4&&x.bond.length<=180),
  'Invalid or duplicated social relationship updates');
 ensure(ids.every(id=>knownText(outcomes?.[id])),
  'Both participants require independently reviewed outcomes');
 const changes=Object.fromEntries(ids.map(id=>[id,[]]));
 for(const update of relationshipUpdates){
  const other=ids.find(id=>id!==update.actorId);
  const actor=state.world.actors[update.actorId],before=actor.relationships?.[other]??null;
  if(before===null)ensure(typeof update.relation==='string'&&
   update.relation.trim().length>=4&&update.relation.length<=180,
   'New social relationship requires an explicit relation');
  else ensure(update.relation===undefined||update.relation===before.relation,
   'Existing relationship kind cannot silently be rewritten');
  const after={
   ...(before===null?{relation:update.relation}:before),
   bond:update.bond,latest_shared_moment:context.observation.fact
  };
  ensure(!same(before,after),'No substantive relationship change');
  changes[update.actorId].push({
   field:'relationship',target_actor_id:other,before:copy(before),after:copy(after)
  });
 }
 if(context.transfer!==null){
  const t=context.transfer;
  changes[t.recipient_id].push({
   field:'knowledge',
   fact:statementFact(t.speaker_id,t.known_entry),
   source:statementSource(context.interaction_id,context.location_id,t.speaker_id)
  });
 }
 ensure(ids.some(id=>changes[id].length>0),
  'A staged social interaction requires a recorded relation or knowledge consequence');
 const eventOrder=context.transfer===null?ids:
  [context.transfer.speaker_id,context.transfer.recipient_id];
 const result=eventOrder.map(id=>({
  actor_id:id,reviewed:true,resolved:true,
  causal_basis:`Reviewed direct encounter ${context.interaction_id}: ${context.observation.causal_source}`,
  outcome:outcomes[id],changes:changes[id],disclosures:[],
  social_context:copy(context)
 }));
 validateSocialResolutionBatch({state,npcResolutions:result});
 return copy(result);
}

/**
 * The coordinator accepts only complete, reciprocally attested social pairs.
 * Standalone/tampered social payloads cannot masquerade as independent acts.
 */
export function validateSocialResolutionBatch({state,npcResolutions=[]}={}){
 ensure(state?.world?.actors&&Array.isArray(npcResolutions),
  'NPC social batch and checkpoint required');
 const groups=new Map();
 for(const resolution of npcResolutions){
  if(resolution?.social_context===undefined)continue;
  const context=resolution.social_context;
  validateContact(state,context);
  const id=context.interaction_id;
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push(resolution);
 }
 for(const [id,items] of groups){
  const context=items[0].social_context;
  ensure(items.length===2&&items.every(x=>same(x.social_context,context))&&
   same(items.map(x=>x.actor_id).sort(),context.participant_ids)&&
   items.every(x=>x.reviewed===true&&x.resolved===true&&knownText(x.outcome)&&
    x.disclosures?.length===0),
   'Social interaction must have two reviewed, matching NPC resolutions');
  if(context.transfer!==null)ensure(items[0].actor_id===context.transfer.speaker_id&&
    items[1].actor_id===context.transfer.recipient_id,
    'Social knowledge must be staged speaker first, recipient second');
  let materialEffects=0;
  for(const item of items){
   const other=context.participant_ids.find(id=>id!==item.actor_id);
   ensure(Array.isArray(item.changes)&&item.changes.length<=2,
    'Social actor has excessive state effects');
   const actor=state.world.actors[item.actor_id];
   const knowledge=item.changes.filter(c=>c.field==='knowledge');
   const relations=item.changes.filter(c=>c.field==='relationship');
   ensure(knowledge.length<=1&&relations.length<=1&&
    item.changes.length===knowledge.length+relations.length,
    'Social contact cannot smuggle unrelated state changes');
   if(context.transfer?.recipient_id===item.actor_id){
    const t=context.transfer;
    ensure(knowledge.length===1&&
     knowledge[0].fact===statementFact(t.speaker_id,t.known_entry)&&
     knowledge[0].source===statementSource(id,context.location_id,t.speaker_id),
     'Social knowledge must come exactly from its recorded speaker');
   }else ensure(knowledge.length===0,'Unaddressed NPC cannot receive social knowledge');
   if(relations.length){
    const entry=relations[0],before=actor.relationships?.[other]??null;
    ensure(entry.target_actor_id===other&&same(entry.before,before)&&
     preservesRelationship(entry,before,context),
     'Social relationship update must preserve previous context and target partner');
   }
   materialEffects+=item.changes.length;
  }
  ensure(materialEffects>0,'Social encounter requires a recorded material consequence');
 }
 return true;
}

/**
 * Replay NPC knowledge from a pinned, versioned CH-000 turn-nine snapshot.
 *
 * Never derive the unknown preexisting knowledge set from the mutable final
 * state: that would let an injected future fact masquerade as legacy memory.
 * The anchor is explicitly forward-only. It preserves all 29 original entries
 * without claiming to reconstruct their individual pre-turn-nine acquisition.
 *
 * Every later knowledge addition must be recorded in the correct actor's event
 * with its exact materialized source and event ID. At every social transfer
 * the speaker must already hold the cited entry; the final state must match
 * the anchored knowledge plus all subsequently recorded additions in order.
 */
export function verifySealedNPCKnowledge(snapshot,events=allEvents(snapshot)){
 const actors=snapshot.state.world.actors;
 const anchor=NPC_KNOWLEDGE_ANCHOR;
 // New NPCs are admitted only through their own reviewed, actor-owned
 // introduction event after the original sealed seven-actor roster.
 verifyNPCIntroductionHistory(snapshot,events);
 const startSeq=Number(anchor.lastEventId.slice(3));
 ensure(Number.isSafeInteger(startSeq)&&startSeq>0&&
  events[startSeq-1]?.id===anchor.lastEventId,
  'Sealed social knowledge anchor requires intact historical event boundary');
 ensure(events.slice(0,startSeq).every(event=>event.social_context===undefined),
  'Unverified social interaction predates the sealed knowledge anchor');
 for(const actorId of Object.keys(anchor.actorKnowledge))
  ensure(Object.hasOwn(actors,actorId),
   'Sealed NPC knowledge anchor actor is missing from the checkpoint');
 const known=new Map(Object.entries(actors).map(([id])=>
  [id,[...(anchor.actorKnowledge[id]??[])]]));
 for(const event of events.slice(startSeq)){
  const context=event.social_context;
  if(context?.transfer?.speaker_id===event.actor_ids?.[0]){
   const transfer=context.transfer;
   ensure(known.get(transfer.speaker_id)?.includes(transfer.known_entry),
    'Social speaker had not yet learned the transferred statement');
  }
  for(const change of event.state_changes??[]){
   if(change.field!=='knowledge'||!known.has(change.actor_id))continue;
   const expected=`${change.fact} (source: ${change.source}; ${event.id})`;
   ensure(typeof change.after==='string'&&change.after===expected&&
     change.actor_id===event.actor_ids?.[0],
    'Event-backed NPC knowledge has inconsistent source or event ID');
   ensure(!known.get(change.actor_id).includes(change.after),
    'Recorded NPC knowledge was duplicated across the sealed boundary');
   known.get(change.actor_id).push(change.after);
  }
 }
 for(const [actorId,entries] of known){
  ensure(Array.isArray(actors[actorId].knowledge)&&
   same(actors[actorId].knowledge,entries),
   'NPC knowledge diverges from sealed anchor and event history');
 }
 return true;
}

/**
 * Readback guard for saved social events. Reject half-pairs, wrong counterpart,
 * lost transfer provenance and tampered event linkage. Baseline events without
 * social_context remain valid and are not rewritten.
 */
export function verifySocialEventHistory(snapshot){
 ensure(snapshot?.events?.events&&snapshot?.state?.world?.locations,
  'Saved event history required');
 const grouped=new Map();
 const history=allEvents(snapshot);
 const sealedUntil=Number(NPC_KNOWLEDGE_ANCHOR.lastEventId.slice(3));
 for(const event of history){
  if(event.social_context===undefined){
   ensure(!event.state_changes.some(change=>change.field==='last_resolved_action'&&
    change.after?.social_interaction_id!==undefined),'Missing social context for two linked events');
   ensure(!event.state_changes.some(change=>change.field==='knowledge'&&
    typeof change.source==='string'&&change.source.startsWith('Reviewed direct exchange SOC-')),
    'Reported social knowledge requires encounter provenance');
   continue;
  }
  // A forged old encounter must fail at the sealed chronology boundary before
  // a malformed payload can disguise its actual historical origin.
  ensure(Number(event.id.slice(3))>sealedUntil,
   'Unverified social interaction predates the sealed knowledge anchor');
  ensure(event.kind==='independent_actor'&&Array.isArray(event.actor_ids)&&
    event.actor_ids.length===1&&same(event.known_to,event.actor_ids),
    'Saved social event must be an actor-owned private NPC event');
  const c=event.social_context;
  ensure(socialId(c?.interaction_id)&&Array.isArray(c.participant_ids)&&
   c.participant_ids.length===2&&c.participant_ids[0]<c.participant_ids[1]&&
   c.participant_ids.includes(event.actor_ids?.[0])&&
   Object.hasOwn(snapshot.state.world.locations,c.location_id)&&
   observationValid(c.observation,c.participant_ids)&&
   (c.transfer===null||(c.transfer&&
    c.participant_ids.includes(c.transfer.speaker_id)&&
    c.participant_ids.includes(c.transfer.recipient_id)&&
    c.transfer.speaker_id!==c.transfer.recipient_id&&
    knownText(c.transfer.known_entry))),
   'Malformed saved social context');
  if(!grouped.has(c.interaction_id))grouped.set(c.interaction_id,[]);
  grouped.get(c.interaction_id).push(event);
 }
 for(const [id,events] of grouped){
  const c=events[0].social_context;
  ensure(events.length===2&&events.every(e=>same(e.social_context,c))&&
   (c.transfer===null||events[0].actor_ids[0]===c.transfer.speaker_id)&&
   same(events.map(e=>e.actor_ids[0]).sort(),c.participant_ids)&&
   events[0].turn===events[1].turn&&events[0].day===events[1].day&&
   events[1].caused_by?.includes(events[0].id),
   'Saved social exchange requires two linked events in one turn');
  let effectCount=0;
  for(const event of events){
   const partner=c.participant_ids.find(x=>x!==event.actor_ids[0]);
   const edits=event.state_changes??[];
   ensure(edits.every(x=>x.field==='relationship'||x.field==='knowledge'||
     x.field==='last_resolved_action'),
     'Saved social event includes unrelated actor mutation');
   for(const change of edits.filter(change=>change.field==='last_resolved_action')){
    const marker=change.after?.social_interaction_id;
    ensure(marker===undefined||marker===id,'Saved actor action cites a different encounter');
   }
   const social=edits.filter(x=>x.field==='relationship'||
    x.field==='knowledge');
   const knowledge=social.filter(x=>x.field==='knowledge');
   const relations=social.filter(x=>x.field==='relationship'&&
    x.target_actor_id===partner);
   ensure(relations.every(x=>x.after?.latest_shared_moment===c.observation.fact),
    'Saved social relationship lost the reviewed encounter evidence');
   ensure(relations.every(change=>preservesRelationship(change,change.before,c)),
    'Saved social relationship rewrites prior relationship attributes');
   ensure(knowledge.length<2&&relations.length<2&&
    social.length===knowledge.length+relations.length,
    'Saved social effect has an unknown recipient or duplicate');
   if(c.transfer?.recipient_id===event.actor_ids[0]){
    ensure(knowledge.length===1&&
     knowledge[0].fact===statementFact(c.transfer.speaker_id,c.transfer.known_entry)&&
     knowledge[0].source===statementSource(id,c.location_id,c.transfer.speaker_id),
     'Saved social information lacks correct reported source');
   }else ensure(knowledge.length===0,
    'Private information cannot be sent to an unaddressed actor');
   effectCount+=social.length;
  }
  ensure(effectCount>0,'Recorded social encounter lacks any effect');
 }
 if(grouped.size){
  verifyHistoricalPresence(snapshot.state,history);
  verifySealedNPCKnowledge(snapshot,history);
 }
 return true;
}

// Reverse recorded movements so later travel cannot relocate an earlier conversation.
function verifyHistoricalPresence(state,history){
 const locations=new Map(Object.entries(state.world.actors).map(([id,npc])=>[id,npc.location_id]));
 for(let index=history.length-1;index>=0;index--){
  const event=history[index];
  for(const change of [...event.state_changes].reverse()){
   if(change.field==='npc_introduction')locations.delete(change.actor_id);
   if(change.field==='location_id'&&locations.has(change.actor_id)){
    ensure(locations.get(change.actor_id)===change.after,'Inconsistent social movement history');
    locations.set(change.actor_id,change.before);
   }
  }
  const context=event.social_context;
  if(context)ensure(context.participant_ids.every(id=>locations.get(id)===context.location_id),
   'Social participants must share the recorded location during the encounter');
 }
}

// Only explicit player knowledge can authorize repeating private encounter details.
export function assertSocialNarrationPrivacy(snapshot,messages){
 const known=snapshot.state.player.knowledge??[];
 for(const event of allEvents(snapshot)){
  const contact=event.social_context;
  if(!contact)continue;
  const details=[contact.observation.fact,contact.observation.causal_source,
   contact.transfer?.known_entry,event.outcome];
  for(const detail of details){
   if(typeof detail!=='string'||!detail.trim()||known.some(entry=>entry===detail||entry.startsWith(detail+' (source: ')))continue;
   ensure(!messages.some(message=>message.includes(detail)),'Private social encounter leaked into narration');
  }
 }
}
