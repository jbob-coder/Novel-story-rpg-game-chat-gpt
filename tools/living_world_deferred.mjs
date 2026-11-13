// Pure turn-bound NPC review queue. Queued intents are planning metadata,
// NEVER actions, arrived locations, knowledge, dialogue or new story events.
// Created only after a player's turn is staged; consumed on a later turn only
// when the narrator supplies a separately reviewed causal NPC resolution.
import {recommendNPCIntentReviews} from './living_world_agenda.mjs';
import {selectRelevantNPCs} from './living_world_commitments.mjs';

const check=(ok,message)=>{if(!ok)throw new Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
const queueId=id=>typeof id==='string'&&/^NPCQ-\d{6}-NPC-\d{3,}$/.test(id);
const validActor=id=>typeof id==='string'&&/^NPC-\d{3,}$/.test(id);
const eventId=id=>typeof id==='string'&&/^EV-\d{6,}$/.test(id);
const MAX_QUEUE=12;
const MAX_NEW_PER_TURN=3;

export function validateDeferredNPCReviews(snapshot){
 check(snapshot?.state?.world?.actors && snapshot?.manifest && Array.isArray(snapshot?.events?.events),
  'Saved snapshot required for deferred NPC reviews');
 const queue=snapshot.state.pending?.npc_review_queue??[];
 check(Array.isArray(queue)&&queue.length<=MAX_QUEUE,'Invalid deferred NPC review queue');
 const ids=new Set(),actors=new Set();
 const events=new Map(snapshot.events.events.map(e=>[e.id,e]));
 for(const q of queue){
  check(q&&typeof q==='object'&&!Array.isArray(q),'Invalid deferred NPC review');
  check(Object.keys(q).sort().join('|')===
    ['actor_id','candidate_id','created_after_turn','earliest_review_turn','id','kind','objective','queued_day','source_event_id','status','visibility'].sort().join('|'),
    'Unknown deferred NPC review fields');
  check(queueId(q.id)&&!ids.has(q.id),'Invalid or duplicate NPC review id');
  ids.add(q.id);
  check(validActor(q.actor_id)&&Object.hasOwn(snapshot.state.world.actors,q.actor_id)&&
    !actors.has(q.actor_id),'Unknown or duplicate queued NPC');
  actors.add(q.actor_id);
  check(q.id==='NPCQ-'+String(q.created_after_turn).padStart(6,'0')+'-'+q.actor_id,
    'Deferred NPC review identity mismatch');
  check(typeof q.candidate_id==='string'&&q.candidate_id.length>=6&&
    q.candidate_id.length<=120 &&
    ['obligation','civilian_routine'].includes(q.kind) &&
    typeof q.objective==='string'&&q.objective.trim().length>=5&&
    q.objective.length<=300,'Invalid deferred NPC intent');
  check(q.status==='pending'&&q.visibility==='narrator_private',
    'Deferred review may not claim an outcome or public disclosure');
  check(Number.isSafeInteger(q.created_after_turn)&&q.created_after_turn>=1&&
    q.created_after_turn<=snapshot.manifest.last_completed_turn &&
    q.earliest_review_turn===q.created_after_turn+1 &&
    Number.isSafeInteger(q.queued_day)&&q.queued_day>=-30&&
    q.queued_day<=snapshot.state.time.day,'Invalid deferred review timeline');
  const source=events.get(q.source_event_id);
  check(eventId(q.source_event_id)&&source&&source.turn===q.created_after_turn&&
    source.kind==='player_action','Deferred review needs source player turn');
 }
 return true;
}

/**
 * Validate optional explicit links from separately reviewed NPC outcomes to
 * previously queued intents. Not citing a queue item never discards it:
 * an unrelated NPC act is not proof that the queued task was completed.
 */
export function consumedDeferredNPCReviews({snapshot,resolutions=[],targetTurn}={}){
 validateDeferredNPCReviews(snapshot);
 check(Array.isArray(resolutions),'NPC resolutions required');
 check(Number.isSafeInteger(targetTurn)&&targetTurn===snapshot.manifest.last_completed_turn+1,
   'Deferred review can only be consumed in next staged player turn');
 const queue=snapshot.state.pending?.npc_review_queue??[];
 const byId=new Map(queue.map(q=>[q.id,q]));
 const consumed=new Set();
 for(const r of resolutions){
  if(!r||r.queued_review_id===undefined)continue;
  const q=byId.get(r.queued_review_id);
  check(q&&q.actor_id===r.actor_id,'Queued NPC reference does not match resolved actor');
  check(targetTurn>=q.earliest_review_turn,'NPC activity cannot resolve in its creation turn');
  check(r.reviewed===true&&r.resolved===true&&
    typeof r.causal_basis==='string'&&r.causal_basis.trim().length>=8,
    'Deferred NPC review needs an explicitly reviewed causal outcome');
  check(!consumed.has(q.id),'Deferred NPC review cannot be consumed twice');
  consumed.add(q.id);
 }
 return consumed;
}

/**
 * Called strictly AFTER stageNarrativeTurn has staged the player's action.
 * Retains unattended items without any fictional progress. At most three
 * new private reviews are scheduled each completed player turn, never a
 * simultaneous requirement for the city's population.
 */
export function planDeferredNPCReviews({before,after,elapsedMinutes,elapsedDays,
  nextPeriod=null,resolutions=[]}={}){
 validateDeferredNPCReviews(before);
 check(after?.manifest?.last_completed_turn===before.manifest.last_completed_turn+1 &&
   Array.isArray(after.events?.events),'Completed candidate turn required');
 check(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0&&
   Number.isSafeInteger(elapsedDays)&&elapsedDays>=0,'Invalid narrative interval');
 const nextTurn=after.manifest.last_completed_turn;
 const consumed=consumedDeferredNPCReviews({snapshot:before,resolutions,targetTurn:nextTurn});
 const existing=(before.state.pending?.npc_review_queue??[])
  .filter(q=>!consumed.has(q.id)).map(copy);
 if(elapsedMinutes===0)return existing;
 const playerEvent=after.events.events.find(e=>e.turn===nextTurn&&e.kind==='player_action');
 check(playerEvent&&eventId(playerEvent.id),'Staged player event required before NPC queue');
 // Check post-action resources and known facts, but use the BEGINNING clock
 // for validating the fictional interval (which must not be counted twice).
 const planningState=copy(after.state);
 planningState.time=copy(before.state.time);
 const ranked=selectRelevantNPCs({state:planningState,limit:20});
 const ordered=[...new Set([...ranked,...Object.keys(planningState.world.actors).sort()])];
 const excluded=new Set([...existing.map(x=>x.actor_id),...resolutions.map(x=>x.actor_id)]);
 const ids=ordered.filter(id=>!excluded.has(id));
 const choices=recommendNPCIntentReviews({
  state:planningState,actorIds:ids,elapsedDays,elapsedMinutes,nextPeriod
 });
 const budget=Math.min(MAX_QUEUE-existing.length,MAX_NEW_PER_TURN);
 const additions=choices.slice(0,Math.max(0,budget)).map(choice=>({
  id:'NPCQ-'+String(nextTurn).padStart(6,'0')+'-'+choice.actorId,
  actor_id:choice.actorId,candidate_id:choice.candidateId,
  kind:choice.kind,objective:choice.objective,source_event_id:playerEvent.id,
  created_after_turn:nextTurn,earliest_review_turn:nextTurn+1,
  queued_day:after.state.time.day,status:'pending',visibility:'narrator_private'
 }));
 return [...existing,...additions];
}
