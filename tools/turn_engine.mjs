import {checkFullNarration,appendFullTurn} from './narrative_archive.mjs';
import {assertMayAdvance} from './save_gate.mjs';
import {verifyConsequences,stageConsequences} from './consequences.mjs';
import {applyStateChanges,verifyStateChanges} from './state_changes.mjs';
import {validateDeferredNPCReviews} from './living_world_deferred.mjs';
// Pure, dependency-free, deterministic stage/check module for ChatGPT narrative saves.
// Staging does not perform a GitHub write; only an atomic commit + read-back can confirm saving.
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function verifyNarrativeSnapshot(snapshot) {
  check(snapshot && typeof snapshot === "object", "Missing snapshot");
  const {state:s, manifest:m, events:e, chapter:c}=snapshot;
  check(s && m && e && typeof c==="string", "Missing snapshot component");
  check(s.schema_version===2 && m.state_schema_version===2, "State schema mismatch");
  check(s.game_id===m.game_id && s.chapter.id===m.chapter_id && e.chapter_id===m.chapter_id, "Chapter/game IDs mismatch");
  check(s.save.last_verified_turn===m.last_completed_turn && Number.isSafeInteger(m.last_completed_turn), "Turn mismatch");
  check(s.history.last_event_sequence===m.last_event_sequence && Number.isSafeInteger(m.last_event_sequence), "Sequence mismatch");
  check(Array.isArray(e.events) && e.events.length===m.last_event_sequence, "Event count mismatch");
  check(s.chapter.last_resolved_event_id===m.last_event_id, "Chapter latest event mismatch");
  const ids=new Set([s.player.id,...Object.keys(s.world.actors)]);
  let lastDay=-30, highestTurn=0;
  e.events.forEach((event,i)=>{
    check(event.id===`EV-${String(i+1).padStart(6,"0")}`, "Duplicate or missing event ID");
    check(event.chapter_id===m.chapter_id, "Event chapter mismatch");
    check(Number.isSafeInteger(event.turn) && event.turn>=1 && event.turn<=m.last_completed_turn && event.turn>=highestTurn,"Event turn invalid");
    check(Number.isSafeInteger(event.day) && event.day>=lastDay && event.day<=s.time.day,"Event chronology invalid");
    check(Array.isArray(event.actor_ids) && event.actor_ids.length>0 && event.actor_ids.every(id=>ids.has(id)), "Unknown actor");
    check(Array.isArray(event.known_to) && event.known_to.every(id=>ids.has(id)), "Unknown knowledge recipient");
    check(Array.isArray(event.state_changes) && Array.isArray(event.progression_awards), "Event changes missing");
    lastDay=event.day;highestTurn=event.turn;
  });
  check(m.last_event_id === (e.events.at(-1)?.id??null), "Manifest latest event mismatch");
  const keys=s.history.completed_turn_keys??[];
  check(Array.isArray(keys) && keys.length===new Set(keys).size && keys.length===m.last_completed_turn, "Turn idempotency keys invalid");
  const groups=[s.player,...Object.values(s.world.actors)];
  for(const a of groups) {
    check(a.location_id in s.world.locations, "Actor location missing");
    const prog=a.progression;
    check(prog && typeof prog.skills==="object" && Array.isArray(prog.powers),"Actor progression missing");
    check(Object.values(prog.skills).every(x=>Number.isSafeInteger(x.xp) && x.xp>=0 && (x.last_progress_event_id==null || e.events.some(event=>event.id===x.last_progress_event_id))),"Invalid skill history");
    check(Object.values(prog.skills).reduce((sum,x)=>sum+x.xp,0)===prog.lifetime_skill_xp,"Skill XP tally mismatch");
    if(s.time.day<0) check(prog.powers.length===0,"Powers before Day 0");
  }
  if(s.time.day<0) {
    check(!s.world.shockwave_arrived && !s.world.humans_with_powers_observed && !s.world.animals_affected && !s.world.plants_affected && !s.world.environment_affected,"Wave effects before Day 0");
  }
  verifyConsequences(snapshot);
  checkFullNarration(snapshot);
  verifyStateChanges(snapshot);
  validateDeferredNPCReviews(snapshot);
  return true;
}
function stageNarrativeTurn(snapshot, turn) {
  verifyNarrativeSnapshot(snapshot);
  check(turn && typeof turn==="object", "Turn missing");
  check(turn.save_guard && typeof turn.save_guard === "object", "Save guard required before staging narrative action");
  check(Object.hasOwn(turn.save_guard,"previous_attempt"), "Previous save attempt status required");
  assertMayAdvance({checkpoint_valid:true,observed_head:turn.save_guard.observed_head,attempt:turn.save_guard.previous_attempt});
  check(typeof turn.key==="string" && /^[a-zA-Z0-9_-]{6,80}$/.test(turn.key),"Stable turn key required");
  check(typeof turn.intent==="string" && turn.intent.trim().length>0 && turn.intent.length<=3000,"Player input required");
  check(typeof turn.outcome==="string" && turn.outcome.trim().length>0 && turn.outcome.length<=5000,"Resolved narration required");
  check(Number.isSafeInteger(turn.elapsed_days) && turn.elapsed_days>=0 && turn.elapsed_days<=365,"Elapsed days invalid");
  check((turn.offscreen??[]).length<=20, "Too many offscreen events");
  // D-036: the interactive novel no longer awards XP; historical XP is read-only.
  check(turn.awards==null || (Array.isArray(turn.awards) && turn.awards.length===0), "RPG XP awards disabled (D-036)");
  check((turn.offscreen??[]).every(item=>item.awards==null || (Array.isArray(item.awards) && item.awards.length===0)), "RPG XP awards disabled (D-036)");
  const next=JSON.parse(JSON.stringify(snapshot));
  const {state:s,manifest:m,events:e}=next;
  s.history.completed_turn_keys??=[];
  check(!s.history.completed_turn_keys.includes(turn.key),"Duplicate turn key: action already saved");
  const newDay=s.time.day+turn.elapsed_days;
  check(!(s.time.day<0 && newDay>=0),"Crossing Day 0 requires explicit shockwave transition handling");
  const t=m.last_completed_turn+1;
  const logs=[];
  function event(kind, actorId, intent, outcome, knownTo) {
    const id=`EV-${String(e.events.length+1).padStart(6,"0")}`;
    // Keep legacy field shape for validators and old event playback.
    const rec={id,chapter_id:m.chapter_id,turn:t,day:newDay,actor_ids:[actorId],kind,intent,outcome,known_to:knownTo,caused_by:[],state_changes:[],progression_awards:[]};
    e.events.push(rec);logs.push(rec);
    return rec;
  }
  const playerEvent=event("player_action",s.player.id,turn.intent,turn.outcome,[s.player.id]);
  // D-040: every material player-side effect is an explicit, preconditioned event change.
  applyStateChanges(s,playerEvent,turn.changes??[]);
  for(const item of turn.offscreen??[]) {
    check(item && typeof item.actor_id==="string" && s.world.actors[item.actor_id],"Unknown offscreen NPC");
    check(typeof item.outcome==="string" && item.outcome.trim() && item.outcome.length<3000,"Offscreen result required");
    const actor=s.world.actors[item.actor_id];
    const record=event("independent_actor",item.actor_id,item.intent??actor.independent_plan,item.outcome,[item.actor_id]);
    const before=actor.last_resolved_action==null?null:JSON.parse(JSON.stringify(actor.last_resolved_action));
    const after={event_id:record.id,day:newDay,summary:item.outcome};
    actor.last_resolved_action=after;
    record.state_changes.push({actor_id:item.actor_id,field:"last_resolved_action",before,after});
    const npcChanges=[];
    if(item.new_location_id!==undefined) npcChanges.push({field:"location_id",before:actor.location_id,after:item.new_location_id});
    if(item.learned_fact!==undefined) npcChanges.push({field:"knowledge",fact:item.learned_fact,source:item.source});
    // Additional inventory, relationship, condition and plan effects are independently validated.
    if(item.changes!==undefined) check(Array.isArray(item.changes),"NPC changes must be an array");
    applyStateChanges(s,record,[...npcChanges,...(item.changes??[])]);
  }
  s.time.day=newDay;
  s.history.last_event_sequence=e.events.length;
  s.history.completed_turn_keys.push(turn.key);
  s.chapter.last_resolved_event_id=e.events.at(-1).id;
  s.save.last_verified_turn=t;
  s.save.notes="Candidate checkpoint: commit and read-back required before calling this turn verified.";
  s.pending={...s.pending,type:"await_player_action",interaction_mode:"free_text_no_numbered_options",location_id:s.player.location_id,message:turn.next_prompt??"Jack awaits the next free-form action.",last_player_action:turn.player_text};
  m.last_completed_turn=t;m.last_event_sequence=e.events.length;m.last_event_id=e.events.at(-1).id;
  m.notes="Staged turn; only a verified Git commit makes this a durable save.";
  // The public chapter contains only the literal narrated scene, not the
  // resolution engine's technical intent/outcome, which may include private
  // causal information. Events and world state retain full factual records.
  next.chapter+=`\n\n## Turn ${t} — Day ${newDay}\n`;
  // Offscreen outcomes are authoritative in the private event log and world state,
  // NOT in the reader-facing chapter. Their disclosure requires a causal channel
  // in turn.narration_messages; never reveal them via a technical chapter footer.
  // A private NPC outcome cannot be copied verbatim into reader-visible prose.
  // Paraphrase/semantic disclosure still requires narrator editorial review;
  // this check is only a mechanical guard against accidental exact leakage.
  for(const item of turn.offscreen??[]) {
    const secret=typeof item.outcome==='string'?item.outcome.trim():'';
    if(secret.length>=12) check(!turn.narration_messages.some(message=>message.includes(secret)),
     'Private NPC outcome leaked into visible narration');
  }
  // Consequences are factual open threads; updates must cite the current turn's event IDs.
  const withConsequences=stageConsequences(next,turn.consequence_updates??[]);
  next.state.narrative_threads=withConsequences.state.narrative_threads;
  appendFullTurn(next,turn.player_text,turn.narration_messages);
  next.chapter += '\n\n### Texto íntegro narrado — turno ' + t + '\n\n' + turn.narration_messages.join('\n\n') + '\n';
  verifyNarrativeSnapshot(next);
  return next;
}
export { verifyNarrativeSnapshot, stageNarrativeTurn };
