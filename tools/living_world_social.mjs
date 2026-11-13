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

function validateContact(state,context){
 ensure(state?.world?.actors&&state?.world?.locations&&state.time,
  'Saved NPC world required');
 ensure(context&&socialId(context.interaction_id)&&
  contactIds(state,context.participant_ids),'Invalid social interaction participants');
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
 outcomes={},reviewed=false}={}){
 ensure(reviewed===true,'Social contact requires editorial review');
 const ids=Array.isArray(participantIds)?[...participantIds].sort():participantIds;
 const context={
  interaction_id:interactionId,participant_ids:ids,
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
     entry.after&&typeof entry.after==='object'&&!Array.isArray(entry.after)&&
     typeof entry.after.bond==='string'&&entry.after.bond.trim().length>=4&&
     entry.after.latest_shared_moment===context.observation.fact&&
     (before===null?
      typeof entry.after.relation==='string'&&entry.after.relation.trim().length>=4&&
       Object.keys(entry.after).every(k=>['relation','bond','latest_shared_moment'].includes(k)):
      Object.keys(before).every(key=>['bond','latest_shared_moment'].includes(key)||
       same(entry.after[key],before[key]))&&
       Object.keys(entry.after).every(key=>Object.hasOwn(before,key)||
        ['bond','latest_shared_moment'].includes(key))&&
       entry.after.relation===before.relation),
     'Social relationship update must preserve previous context and target partner');
   }
   materialEffects+=item.changes.length;
  }
  ensure(materialEffects>0,'Social encounter requires a recorded material consequence');
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
 for(const event of snapshot.events.events){
  if(event.social_context===undefined)continue;
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
   const social=edits.filter(x=>x.field==='relationship'||
    x.field==='knowledge');
   const knowledge=social.filter(x=>x.field==='knowledge');
   const relations=social.filter(x=>x.field==='relationship'&&
    x.target_actor_id===partner);
   ensure(relations.every(x=>x.after?.latest_shared_moment===c.observation.fact),
    'Saved social relationship lost the reviewed encounter evidence');
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
 return true;
}
