// Living World coordinator: only resolved, reviewed NPC acts become turn events.
// The ChatGPT narrator remains the decision-maker. No real-time/background simulation.
import {stageNPCResolution} from './living_world_routines.mjs';
import {stageNarrativeTurn, verifyNarrativeSnapshot} from './turn_engine.mjs';
import {saveFiveFileTurn} from './save_transaction.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {consumedDeferredNPCReviews,planDeferredNPCReviews} from './living_world_deferred.mjs';

const ensure=(ok,message)=>{if(!ok)throw new Error(message)};
const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);

const copy=value=>JSON.parse(JSON.stringify(value));

export function prepareLivingWorldTurn({snapshot,turn,observedHead,npcResolutions=[]}={}){
  ensure(snapshot?.manifest && snapshot?.state && turn && typeof turn==='object','Checkpoint and turn required');
  ensure(typeof observedHead==='string' && /^[0-9a-f]{40}$/.test(observedHead),'Verified source HEAD required');
  ensure(!hasOwn(turn,'offscreen') && !hasOwn(turn,'save_guard'),
    'Use npcResolutions for offscreen actions; save guard is controlled by coordinator');
  ensure(Number.isSafeInteger(turn.elapsed_days) && turn.elapsed_days>=0,'Elapsed narrative days required');
  ensure(Number.isSafeInteger(turn.elapsed_minutes) && turn.elapsed_minutes>=0 &&
    turn.elapsed_minutes<=525600,'Explicit, nonnegative narrative minutes required');
  ensure(!hasOwn(turn,'awards') || !turn.awards?.length,'No RPG progression');
  ensure(Array.isArray(npcResolutions) && npcResolutions.length<=20,'Too many NPC resolutions');
  const nextTurn=snapshot.manifest.last_completed_turn+1;
  const nextDay=snapshot.state.time.day+turn.elapsed_days;
  // A deferred NPC intent is eligible only after its source player turn.
  // Any remaining intent is carried forward; it is never treated as a success.
  consumedDeferredNPCReviews({snapshot,resolutions:npcResolutions,targetTurn:nextTurn});
  const seen=new Set();
  const offscreen=npcResolutions.map((resolved,i)=>{
    ensure(resolved && resolved.reviewed===true && resolved.resolved===true &&
      typeof resolved.causal_basis==='string' && resolved.causal_basis.trim().length>=8,
      'NPC act requires explicit causal resolution and review');
    ensure(!seen.has(resolved.actor_id),'Multiple outcomes for one NPC require separate adjudication');
    seen.add(resolved.actor_id);
    // The player action is the first event in a turn. NPC events follow in order.
    const eventId='EV-'+String(snapshot.manifest.last_event_sequence+i+2).padStart(6,'0');
    ensure(!resolved.disclosures?.length,
      'Disclosure must be recorded explicitly as a causal knowledge change, not emitted from a private draft');
    const staged=stageNPCResolution({state:snapshot.state,actorId:resolved.actor_id,
      eventId,turn:nextTurn,day:nextDay,outcome:resolved.outcome,
      changes:resolved.changes??[],disclosures:[]});
    ensure(staged.status==='staged_only','Unexpected routine resolution state');
    return {actor_id:resolved.actor_id,intent:resolved.causal_basis,
      outcome:staged.event.outcome,changes:staged.changeDrafts,
      ...(resolved.queued_review_id?{queued_review_id:resolved.queued_review_id}:{})};
  });
  const {elapsed_minutes, next_time_of_day, ...canonicalTurn}=turn;
  validateTemporalAdvance({currentPeriod:snapshot.state.time.time_of_day,
    elapsedDays:turn.elapsed_days,elapsedMinutes:elapsed_minutes,
    nextPeriod:next_time_of_day??null});
  return {turn:{...canonicalTurn,save_guard:{observed_head:observedHead,previous_attempt:null},
    offscreen},elapsedMinutes:elapsed_minutes,nextTimeOfDay:next_time_of_day??null};
}

export function stageLivingWorldTurn({snapshot,turn,observedHead,npcResolutions=[]}={}){
  verifyNarrativeSnapshot(snapshot);
  const prepared=prepareLivingWorldTurn({snapshot,turn,observedHead,npcResolutions});
  const candidate=stageNarrativeTurn(snapshot,prepared.turn);
  const before=snapshot.state.time.elapsed_minutes_since_opening_approx;
  if(before!==undefined && before!==null){
    ensure(Number.isSafeInteger(before) && before>=0,'Invalid saved approximate elapsed minutes');
    candidate.state.time.elapsed_minutes_since_opening_approx=before+prepared.elapsedMinutes;
  }
  if(prepared.nextTimeOfDay!==null) candidate.state.time.time_of_day=prepared.nextTimeOfDay;
  // The player's action was staged first. Queue future NPC consideration in
  // the SAME five-file candidate; nothing executes until a later reviewed turn.
  candidate.state.pending.npc_review_queue=planDeferredNPCReviews({
    before:snapshot,after:candidate,elapsedDays:turn.elapsed_days,
    elapsedMinutes:prepared.elapsedMinutes,nextPeriod:prepared.nextTimeOfDay,
    resolutions:npcResolutions
  });
  verifyNarrativeSnapshot(candidate);
  return candidate;
}

// Only this transaction adapter writes a real story turn. A preview or staged
// candidate is NEVER a completed save. Remote readback remains mandatory.
export function saveLivingWorldTurn({remote,branch,chapterId,turn,npcResolutions=[],journal=null}={}){
  // Never run the authoritative narrative through an unjournaled save.
  // If the separate GitHub journal is absent, stop before any remote mutation.
  if(branch==='work/chat-narrative-foundation' && journal===null)
    return Promise.resolve({status:'blocked',reason:'Durable save journal required for canonical story branch',
      branch,attempt:null});
  return saveFiveFileTurn({remote,branch,chapterId,journal,
    message:'Narrative turn with reviewed Living World activity',
    buildNext:({snapshot,observedHead})=>stageLivingWorldTurn({
      snapshot,observedHead,turn:copy(turn),npcResolutions:copy(npcResolutions)
    })
  });
}
