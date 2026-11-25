// QA-only narrator-private open NPC agency; no background execution or
// compulsory routine. Relevance frames are NOT decisions or world events.
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {inspectNPCNextTurn} from './npc_sequential_turns.mjs';
import {draftReviewedNPCCausalContinuation} from './living_world_causal_continuations.mjs';

const insist=(ok,message)=>{if(!ok)throw Error(message)};
const clone=x=>JSON.parse(JSON.stringify(x));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const prose=(s,min,max)=>typeof s==='string'&&s.trim().length>=min&&s.length<=max;


/**
 * Bound expensive event-history/context retrieval to a small relevant set.
 * Due responsibilities receive review priority; equally relevant actors
 * rotate across successive narrative turns so offscreen newcomers are not
 * permanently excluded by lexical order or prior-action history.
 * Review priority is not a command to act.
 */
function collectNPCReviewCandidates({actors,worldDay,completedTurn,
 elapsedDays=0,actorIds=null,limit=20}={}){
 insist(actors&&typeof actors==='object'&&!Array.isArray(actors),
  'Saved NPC actor registry required');
 insist(Number.isSafeInteger(worldDay)&&Number.isSafeInteger(completedTurn)&&
  completedTurn>=0&&Number.isSafeInteger(elapsedDays)&&elapsedDays>=0,
  'Valid fictional review time required');
 insist(Number.isSafeInteger(limit)&&limit>=1&&limit<=40,
  'Invalid NPC review limit');
 const ids=actorIds??Object.keys(actors).sort();
 insist(Array.isArray(ids)&&ids.length<=100000&&
  new Set(ids).size===ids.length&&
  ids.every(id=>typeof id==='string'&&Object.hasOwn(actors,id)),
  'Unknown or duplicate NPC review selection');
 const eligible=ids.flatMap(actorId=>{
  const a=actors[actorId];
  if(!a||!a.goal&&!a.independent_plan&&!(a.commitments?.length))return [];
  const open=(a.commitments??[]).filter(c=>
   c?.status==='pending'||c?.status==='blocked');
  const due=open.some(c=>Number.isSafeInteger(c.due_day)&&
   c.due_day<=worldDay+elapsedDays);
  // Neither past action frequency nor distance to Jack buys permanent
  // selection priority. A known commitment is a reason to check relevance.
  const priority=due?3:open.length?1:0;
  return [{actorId,priority}];
 });
 return eligible;
}

export function rankOpenNPCReviewCandidates({actors,worldDay,completedTurn,
 elapsedDays=0,actorIds=null,limit=20}={}){
 const eligible=collectNPCReviewCandidates({actors,worldDay,completedTurn,elapsedDays,actorIds,limit});
 const grouped=new Map();
 for(const row of eligible){
  if(!grouped.has(row.priority))grouped.set(row.priority,[]);
  grouped.get(row.priority).push(row);
 }
 const sorted=[];
 for(const priority of [...grouped.keys()].sort((a,b)=>b-a)){
  const group=grouped.get(priority).sort((a,b)=>
   a.actorId.localeCompare(b.actorId));
  // Advance by the capacity actually available to this priority group.
  const take=Math.min(group.length,Math.max(0,limit-sorted.length));
  if(take===0)break;
  const start=(completedTurn*take)%group.length;
  sorted.push(...[...group.slice(start),...group.slice(0,start)].slice(0,take));
 }
 return clone({eligibleCount:eligible.length,
  selected:sorted.slice(0,limit)});
}


/**
 * Experimental narrator-review allocation, intentionally not wired into the
 * active selection or save pipeline. lastReviewedAt is caller-owned QA
 * metadata, NOT an NPC memory, event, action or obligation outcome.
 * Record a review only after it actually occurred (including abstention).
 */
export function rankNPCReviewWithAging({actors,worldDay,completedTurn,
 elapsedDays=0,actorIds=null,limit=20,lastReviewedAt={},urgentDueOverride=false}={}){
 const eligible=collectNPCReviewCandidates({actors,worldDay,completedTurn,elapsedDays,actorIds,limit});
 insist(lastReviewedAt&&typeof lastReviewedAt==='object'&&
  !Array.isArray(lastReviewedAt)&&Object.keys(lastReviewedAt).length<=100000&&
  Object.values(lastReviewedAt).every(t=>Number.isSafeInteger(t)&&t>=0&&t<completedTurn),
  'Review history must contain completed earlier review windows');
 const last=id=>Object.hasOwn(lastReviewedAt,id)?lastReviewedAt[id]:-1;
 const oldest=(a,b)=>last(a.actorId)-last(b.actorId)||
  b.priority-a.priority||a.actorId.localeCompare(b.actorId);
 insist(typeof urgentDueOverride==='boolean','Explicit urgent override boolean required');
 const urgent=eligible.filter(row=>row.priority===3&&
  (actors[row.actorId].commitments??[]).some(c=>
   ['pending','blocked'].includes(c.status)&&c.priority==='urgent'&&
   Number.isSafeInteger(c.due_day)&&c.due_day<=worldDay+elapsedDays)).sort(oldest);
 const criticalSelected=urgentDueOverride?urgent.slice(0,limit):[];
 const criticalIds=new Set(criticalSelected.map(row=>row.actorId));
 const due=eligible.filter(row=>row.priority===3&&!criticalIds.has(row.actorId)).sort(oldest);
 const other=eligible.filter(row=>row.priority!==3).sort(oldest);
 const capacity=limit-criticalSelected.length;
 // Preserve urgent capacity, while reserving one lower-priority review
 // under saturation. With one slot, reserve every fourth review window.
 const reserve=due.length&&other.length&&capacity>0?
  (capacity>1?1:(completedTurn%4===3?1:0)):0;
 const dueSelected=due.slice(0,capacity-reserve);
 const otherSelected=other.slice(0,capacity-dueSelected.length);
 const selected=[...criticalSelected,...dueSelected,...otherSelected];
 const selectedIds=new Set(selected.map(row=>row.actorId));
 return clone({
  classification:'npc_review_aging_policy_experimental_v1',
  eligibleCount:eligible.length,selected,
  dueCount:due.length+criticalSelected.length,deferredDueCount:due.length-dueSelected.length,
  urgentDueCount:urgent.length,deferredUrgentDueCount:urgent.filter(row=>!selectedIds.has(row.actorId)).length,
  urgentOverrideApplied:criticalSelected.length>0,
  otherCount:other.length,deferredOtherCount:other.length-otherSelected.length,
  reviewCapacity:limit,historyPersisted:false,actionsPerformed:0,
  timeAdvanced:false,readerVisible:false
 });
}


/**
 * QA-only sidecar ledger. A receipt records narrator review, NOT NPC knowledge.
 * The injected verification function must independently check the durable
 * story journal and commit, including the actual staged review metadata.
 * Never reconstruct abstentions from event absence or mark selected actors
 * as reviewed. This module does not install a production storage adapter.
 */
const reviewSha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const reviewActor=s=>typeof s==='string'&&/^NPC-\d{3,}$/.test(s);
const receiptKeys=['branch','sourceHead','commitHead','sourceTurn','completedTurn','reviewedActorIds'];
function validReviewReceipt(receipt,branch){
 return receipt&&typeof receipt==='object'&&!Array.isArray(receipt)&&
  Object.keys(receipt).length===receiptKeys.length&&receiptKeys.every(k=>Object.hasOwn(receipt,k))&&
  receipt.branch===branch&&reviewSha(receipt.sourceHead)&&reviewSha(receipt.commitHead)&&
  receipt.sourceHead!==receipt.commitHead&&Number.isSafeInteger(receipt.sourceTurn)&&
  receipt.sourceTurn>=0&&Number.isSafeInteger(receipt.completedTurn)&&
  receipt.completedTurn===receipt.sourceTurn+1&&Array.isArray(receipt.reviewedActorIds)&&
  receipt.reviewedActorIds.length<=40&&new Set(receipt.reviewedActorIds).size===receipt.reviewedActorIds.length&&
  receipt.reviewedActorIds.every(reviewActor);
}
export function createNPCReviewLedger({branch,head,completedTurn}={}){
 insist(typeof branch==='string'&&branch.startsWith('qa/')&&reviewSha(head)&&
  Number.isSafeInteger(completedTurn)&&completedTurn>=0,'QA branch and verified checkpoint required');
 return {version:1,classification:'npc_review_sidecar_qa_v1',branch,
  checkpointHead:head,completedTurn,lastReviewedAt:{},lastReceipt:null};
}
function validateNPCReviewLedger(ledger){
 insist(ledger?.version===1&&ledger.classification==='npc_review_sidecar_qa_v1'&&
  typeof ledger.branch==='string'&&ledger.branch.startsWith('qa/')&&
  reviewSha(ledger.checkpointHead)&&Number.isSafeInteger(ledger.completedTurn)&&
  ledger.completedTurn>=0&&ledger.lastReviewedAt&&typeof ledger.lastReviewedAt==='object'&&
  !Array.isArray(ledger.lastReviewedAt)&&Object.keys(ledger.lastReviewedAt).length<=100000&&
  Object.entries(ledger.lastReviewedAt).every(([id,t])=>reviewActor(id)&&
   Number.isSafeInteger(t)&&t>=0&&t<ledger.completedTurn),
  'Invalid QA review ledger');
 insist(Object.keys(ledger).length===7&&
  ['version','classification','branch','checkpointHead','completedTurn','lastReviewedAt','lastReceipt'].every(k=>Object.hasOwn(ledger,k))&&
  (ledger.lastReceipt===null?Object.keys(ledger.lastReviewedAt).length===0:
   validReviewReceipt(ledger.lastReceipt,ledger.branch)&&
   ledger.lastReceipt.commitHead===ledger.checkpointHead&&
   ledger.lastReceipt.completedTurn===ledger.completedTurn&&
   ledger.lastReceipt.reviewedActorIds.every(id=>ledger.lastReviewedAt[id]===ledger.lastReceipt.sourceTurn)),
  'Invalid receipt or sidecar metadata');
 return ledger;
}
export function encodeNPCReviewLedger(ledger){
 return JSON.stringify(validateNPCReviewLedger(ledger))+'\n';
}
export function decodeNPCReviewLedger(bytes){
 insist(typeof bytes==='string','Review ledger bytes required');
 return clone(validateNPCReviewLedger(JSON.parse(bytes)));
}
export async function persistNPCReviewReceipt({storage,branch,receipt,verifyReceipt}={}){
 insist(storage&&typeof storage.read==='function'&&typeof storage.compareAndSwap==='function'&&
  typeof verifyReceipt==='function','Versioned QA storage and independent verifier required');
 insist(typeof branch==='string'&&branch.startsWith('qa/')&&validReviewReceipt(receipt,branch),
  'Invalid QA review receipt');
 const observed=await storage.read(branch);
 insist(typeof observed?.revision==='string'&&observed.revision.length>0,'Missing versioned review ledger');
 const current=decodeNPCReviewLedger(observed.bytes);
 insist(current.branch===branch,'Review ledger branch mismatch');
 // Verify even on retry; neither a status string nor a matching SHA alone is proof.
 insist(await verifyReceipt(clone(receipt))===true,'Independent durable receipt verification failed');
 if(current.checkpointHead===receipt.commitHead&&current.completedTurn===receipt.completedTurn){
  insist(equal(current.lastReceipt,receipt),'Conflicting receipt for already recorded checkpoint');
  return {status:'already_recorded',ledger:current};
 }
 insist(current.checkpointHead===receipt.sourceHead&&current.completedTurn===receipt.sourceTurn,
  'Stale, skipped or unrelated review checkpoint');
 const next=clone(current);
 next.checkpointHead=receipt.commitHead;
 next.completedTurn=receipt.completedTurn;
 next.lastReceipt=clone(receipt);
 for(const id of receipt.reviewedActorIds)next.lastReviewedAt[id]=receipt.sourceTurn;
 const bytes=encodeNPCReviewLedger(next);
 insist(await storage.compareAndSwap(branch,observed.revision,bytes)===true,
  'Concurrent review ledger update rejected');
 const reread=await storage.read(branch);
 insist(reread?.bytes===bytes,'Review ledger readback mismatch; inspect before retry');
 return {status:'recorded',ledger:decodeNPCReviewLedger(reread.bytes)};
}

export function inspectOpenNPCAgency({snapshot,actorIds=null,elapsedMinutes=0,
 elapsedDays=0,nextPeriod=null,limit=20}={}){
 verifyNarrativeSnapshot(snapshot);
 validateTemporalAdvance({currentPeriod:snapshot.state.time.time_of_day,
  elapsedMinutes,elapsedDays,nextPeriod});
 insist(Number.isSafeInteger(limit)&&limit>=1&&limit<=40,'Invalid NPC review limit');
 const actors=snapshot.state.world.actors;
 insist(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(id=>
   typeof id==='string'&&Object.hasOwn(actors,id))),
  'Unknown or duplicate NPC review selection');
 if(elapsedMinutes===0)return {
  classification:'npc_private_open_agency_v1',frames:[],reviewCount:0,
  actorCount:0,actionsPerformed:0,timeAdvanced:false,readerVisible:false};
 const ranking=rankOpenNPCReviewCandidates({actors,
  worldDay:snapshot.state.time.day,
  completedTurn:snapshot.manifest.last_completed_turn,
  elapsedDays,actorIds,limit});
 const frames=ranking.selected.map(({actorId,priority})=>{
  const actor=actors[actorId];
  const previous=inspectNPCNextTurn({snapshot,actorId});
  const ctx=previous.context;
  const openCommitments=(actor.commitments??[]).filter(c=>
   c.status==='pending'||c.status==='blocked').map(c=>({
    id:c.id,summary:c.summary,status:c.status,dueDay:c.due_day??null
   }));
  const knownLast=ctx.evidence.knownEventIds.at(-1)??null;
  const sourceEventId=previous.previousResult?.eventId??knownLast;
  return {
   classification:'npc_private_open_frame_v1',actorId,
   checkpoint:ctx.checkpoint,locationId:ctx.evidence.locationId,
   goal:ctx.evidence.goal,independentPlan:ctx.evidence.independentPlan,
   resources:ctx.evidence.resources,conditions:ctx.evidence.conditions,
   needs:ctx.evidence.needs,relationships:ctx.evidence.relationships,
   commitments:openCommitments,knowledge:ctx.evidence.knowledge,
   previousResult:previous.previousResult,sourceEventId,
   priority,reviewTask:'Consider a plausible new action, reconsideration, delay or inactivity based on actor-owned evidence; do not prewrite outcomes.',
   actionSelected:false,resultKnown:false,requiresNarratorReview:true
  };
 });
 // Preselection has already bounded the expensive snapshot/actor review.
 return clone({classification:'npc_private_open_agency_v1',
  frames,reviewCount:frames.length,
  actorCount:ranking.eligibleCount,actionsPerformed:0,timeAdvanced:false,
  readerVisible:false});
}

/** Produce one reviewed draft for the existing coordinator, never a story turn. */
export function draftOpenNPCAction({snapshot,frame,elapsedMinutes=0,elapsedDays=0,
 nextPeriod=null,intention,reasoning,outcome,sourceEventIds=[],changes=[],reviewed=false}={}){
 insist(reviewed===true,'Narrator review required for NPC action');
 insist(frame?.classification==='npc_private_open_frame_v1',
  'Private NPC frame required');
 insist(prose(intention,12,400)&&prose(reasoning,16,850)&&
  prose(outcome,12,2000),'NPC action, reasoning and result required');
 insist(Array.isArray(changes)&&changes.length<=40,'Invalid NPC changes');
 const updated=inspectOpenNPCAgency({snapshot,actorIds:[frame.actorId],
  elapsedMinutes,elapsedDays,nextPeriod,limit:1}).frames[0];
 insist(updated&&equal(frame,updated),
  'Stale NPC evidence: actor state or last resolved result changed');
 const causalBasis='Reviewed NPC intention: '+intention+' Evidence: '+reasoning;
 insist(prose(causalBasis,16,1200),'Causal explanation too long');
 // A previous event is context, not necessarily the cause of the next act.
 // A continuation must explicitly cite actor-known evidence; independent
 // initiatives may omit causal event links rather than manufacture them.
 insist(Array.isArray(sourceEventIds)&&sourceEventIds.length<=3&&
  sourceEventIds.every(id=>typeof id==='string'&&/^EV-\d{6,}$/.test(id))&&
  new Set(sourceEventIds).size===sourceEventIds.length,
  'NPC causal sources must be up to three distinct event IDs');
 if(sourceEventIds.length)return draftReviewedNPCCausalContinuation({
  snapshot,actorId:frame.actorId,sourceEventIds,
  reasoning:causalBasis,outcome,changes,reviewed:true
 });
 insist(prose(frame.goal??frame.independentPlan,6,700),
  'NPC without prior event needs a recorded actor goal or plan');
 return clone({actor_id:frame.actorId,reviewed:true,resolved:true,
  causal_basis:causalBasis,outcome,changes,disclosures:[]});
}
