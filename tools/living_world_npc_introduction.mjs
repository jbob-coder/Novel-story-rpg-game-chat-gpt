// Event-backed, review-gated NPC admission. No independent writes or simulation.
// A new NPC is introduced by one private event in a player-triggered turn;
// proximity and speculation cannot create a new actor.
import {allEvents} from './chapter_history.mjs';
import {NPC_KNOWLEDGE_ANCHOR} from './living_world_knowledge_anchor.mjs';

const ensure=(ok,message)=>{if(!ok)throw Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const text=(x,min=8,max=500)=>typeof x==='string'&&x.trim().length>=min&&x.length<=max;
const actorId=x=>typeof x==='string'&&/^NPC-\d{3,}$/.test(x);
const allowedFields=['id','name','age','role','location_id','goal','independent_plan','knowledge',
 'relationships','conditions','resources','progression','last_resolved_action','description'];
const initialFields=['id','name','age','role','location_id','goal','independent_plan','description'];
const previousId=actors=>Math.max(0,...Object.keys(actors).map(id=>Number(id.slice(4))));

function validateIntroductionProfile({state,actor,initialKnowledge,observation,reviewed,outcome,
 existingIds}){
 ensure(state?.world?.actors&&state?.world?.locations,'Saved NPC world required');
 ensure(reviewed===true,'NPC introduction requires explicit editorial review');
 ensure(actor&&typeof actor==='object'&&!Array.isArray(actor)&&
  Object.keys(actor).length===8&&Object.keys(actor).every(k=>initialFields.includes(k)),
  'NPC introduction requires the eight explicit identity fields');
 ensure(actorId(actor.id)&&!Object.hasOwn(state.world.actors,actor.id)&&
  Number(actor.id.slice(4))===previousId(state.world.actors)+1,
  'New NPC must use the next unused stable actor ID');
 ensure(text(actor.name,3,120)&&Number.isSafeInteger(actor.age)&&
  actor.age>=0&&actor.age<=120&&text(actor.role,4,200)&&
  text(actor.goal,8,360)&&text(actor.independent_plan,8,360)&&
  text(actor.description,8,600)&&
  Object.hasOwn(state.world.locations,actor.location_id),
  'NPC identity, description, goal, age or admitted location invalid');
 ensure(observation&&observation.kind==='current_turn_observation'&&
  text(observation.fact,12,600)&&text(observation.causal_source,12,600)&&
  observation.confirmed_by_reviewer===true&&
  (observation.observer_actor_id===state.player.id||
   Object.hasOwn(state.world.actors,observation.observer_actor_id))&&
  (existingIds===undefined||existingIds.has(observation.observer_actor_id)),
  'NPC introduction requires an existing observer and reviewed current-turn evidence');
 const observer=observation.observer_actor_id===state.player.id?
  state.player:state.world.actors[observation.observer_actor_id];
 ensure(observer?.location_id===actor.location_id,
  'Direct NPC admission requires a co-located existing observer');
 ensure(text(outcome,12,700),'NPC introduction requires a reviewed private result');
 ensure(Array.isArray(initialKnowledge)&&initialKnowledge.length<=3&&
  initialKnowledge.every(item=>item&&Object.keys(item).sort().join(',')==='fact,source'&&
   text(item.fact,8,500)&&text(item.source,12,500))&&
  new Set(initialKnowledge.map(item=>item.fact)).size===initialKnowledge.length,
  'Initial knowledge must be bounded, sourced and independently identified');
 return true;
}

export function draftReviewedNPCIntroduction({state,actor,initialKnowledge=[],observation,
 reviewed=false,outcome}={}){
 validateIntroductionProfile({state,actor,initialKnowledge,observation,reviewed,outcome});
 const profile={
  ...Object.fromEntries(initialFields.map(k=>[k,actor[k]])),
  knowledge:[],relationships:{},conditions:[],resources:{},
  progression:{attributes:null,skills:{},powers:[],lifetime_skill_xp:0,milestones:[]},
  last_resolved_action:null
 };
 ensure(Object.keys(profile).length===allowedFields.length,
  'Unexpected introduction profile shape');
 return copy({actor:profile,review:{reviewed:true,observation,initial_knowledge:initialKnowledge},
  outcome});
}

export function stageReviewedNPCIntroduction({state,event,proposal}={}){
 ensure(event?.kind==='npc_introduction'&&event.actor_ids?.length===1&&
  event.actor_ids[0]===proposal?.actor?.id&&Array.isArray(event.state_changes)&&
  event.state_changes.length===0&&
  equal(event.known_to,[proposal.actor.id])&&event.outcome===proposal.outcome,
  'NPC introduction requires its own private actor-owned event');
 const original=Object.fromEntries(initialFields.map(k=>[k,proposal.actor[k]]));
 const rechecked=draftReviewedNPCIntroduction({
  state,actor:original,initialKnowledge:proposal.review?.initial_knowledge,
  observation:proposal.review?.observation,reviewed:proposal.review?.reviewed,
  outcome:proposal.outcome
 });
 ensure(equal(rechecked,proposal),
  'NPC introduction proposal changed after editorial review');
 const id=proposal.actor.id;
 state.world.actors[id]=copy(proposal.actor);
 event.state_changes.push({actor_id:id,field:'npc_introduction',before:null,
  after:copy(proposal.actor),review:copy(proposal.review)});
 return copy(proposal.review.initial_knowledge);
}

// Recover where the witness stood before the introduction event, even if
// they travelled later. Only explicit event-backed movement can alter it.
function observedLocationBefore({actorId,events,index,actors}){
 let location=actors[actorId]?.location_id;
 ensure(typeof location==='string','NPC admission witness lacks final location');
 for(let j=events.length-1;j>=index;j--){
  for(const effect of [...(events[j].state_changes??[])].reverse()){
   if(effect.field!=='location_id'||effect.actor_id!==actorId)continue;
   ensure(effect.after===location,
    'NPC introduction observer location history has inconsistent travel');
   location=effect.before;
  }
 }
 return location;
}

/** Every admitted NPC is reconstructed from its unique post-anchor event. */
export function verifyNPCIntroductionHistory(snapshot,events=allEvents(snapshot)){
 const actors=snapshot?.state?.world?.actors;
 ensure(actors&&Array.isArray(events),'NPC introduction history requires a full world');
 const known=new Set(Object.keys(NPC_KNOWLEDGE_ANCHOR.actorKnowledge));
 const sealedUntil=Number(NPC_KNOWLEDGE_ANCHOR.lastEventId.slice(3));
 let next=previousId(NPC_KNOWLEDGE_ANCHOR.actorKnowledge)+1;
 const introduced=new Map();
 for(let i=0;i<events.length;i++){
  const event=events[i];
  const entry=event.state_changes?.find(c=>c.field==='npc_introduction');
  if(event.kind!=='npc_introduction'){
   ensure(!entry,'NPC introduction effect requires its dedicated event kind');
   // The final world contains every admitted NPC; that must not retroactively
   // make a future actor available to earlier event actors, witnesses or links.
   const referenced=[...(event.actor_ids??[]),...(event.known_to??[]),
    ...(event.social_context?.participant_ids??[])];
   for(const change of event.state_changes??[]){
    if(change.actor_id!==undefined)referenced.push(change.actor_id);
    if(change.target_actor_id!==undefined)referenced.push(change.target_actor_id);
   }
   for(const id of referenced){
    if(actorId(id))ensure(known.has(id),
      'Event references a future NPC before reviewed admission');
   }
   continue;
  }
  ensure(Number(event.id.slice(3))>sealedUntil,
   'NPC introduction predates the sealed actor roster');
  ensure(event.actor_ids?.length===1&&actorId(event.actor_ids[0])&&
   Number(event.actor_ids[0].slice(4))===next&&
   equal(event.known_to,[event.actor_ids[0]])&&
   Array.isArray(event.caused_by)&&event.caused_by.length===0&&
   event.state_changes?.[0]===entry&&
   event.state_changes?.length>=1&&event.state_changes?.length<=4,
   'NPC introduction requires a unique next ID and private actor-owned event');
  const player=events.slice(0,i).findLast(previous=>
   previous.turn===event.turn&&previous.chapter_id===event.chapter_id&&
   previous.kind==='player_action'&&previous.actor_ids?.[0]===snapshot.state.player.id);
  ensure(player&&player.day===event.day,
   'NPC introduction requires a reviewed player-triggered turn');
  const id=event.actor_ids[0],after=entry.after,review=entry.review;
  ensure(entry.actor_id===id&&entry.before===null&&
   after?.id===id&&typeof after==='object'&&
   equal(Object.keys(after).sort(),allowedFields.slice().sort())&&
   after.knowledge?.length===0&&equal(after.relationships,{})&&
   equal(after.conditions,[])&&equal(after.resources,{})&&
   equal(after.progression,{attributes:null,skills:{},powers:[],
    lifetime_skill_xp:0,milestones:[]})&&after.last_resolved_action===null,
   'NPC creation event has a forged initial profile');
  const existingIds=new Set([...known,snapshot.state.player.id]);
  const allActors={[snapshot.state.player.id]:snapshot.state.player,...actors};
  const observerId=review?.observation?.observer_actor_id;
  const observerLocation=observedLocationBefore({
   actorId:observerId,events,index:i,actors:allActors});
  const witness=observerId===snapshot.state.player.id?
   {...snapshot.state.player,location_id:observerLocation}:
   snapshot.state.player;
  const syntheticState={player:witness,
   world:{actors:Object.fromEntries([...known].map(x=>[x,{
    location_id:x===observerId?observerLocation:null
   }])),locations:snapshot.state.world.locations}};
  const identity=Object.fromEntries(initialFields.map(k=>[k,after[k]]));
  validateIntroductionProfile({state:syntheticState,actor:identity,
   initialKnowledge:review?.initial_knowledge,observation:review?.observation,
   reviewed:review?.reviewed,outcome:event.outcome,existingIds});
  ensure(equal(draftReviewedNPCIntroduction({state:syntheticState,actor:identity,
   initialKnowledge:review.initial_knowledge,observation:review.observation,
   reviewed:true,outcome:event.outcome}).actor,after),
   'Saved NPC profile differs from reviewed introduction proposal');
  const recorded=event.state_changes.slice(1);
  ensure(recorded.length===review.initial_knowledge.length&&
   recorded.every((c,j)=>{
    const expected=review.initial_knowledge[j];
    return c.actor_id===id&&c.field==='knowledge'&&
     c.fact===expected.fact&&c.source===expected.source&&
     c.after===expected.fact+' (source: '+expected.source+'; '+event.id+')';
   }),
   'New NPC initial knowledge requires actor-owned source events');
  for(const name of ['id','name','age','role','goal','description']){
   ensure(actors[id]?.[name]===after[name],
    'NPC initial identity diverged without an authored update');
  }
  known.add(id);introduced.set(id,{eventId:event.id,profile:copy(after)});
  next++;
 }
 ensure(equal([...known].sort(),Object.keys(actors).sort()),
  'NPC actor roster has unsourced additions or removals');
 return introduced;
}
