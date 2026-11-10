import {checkFullNarration,appendFullTurn} from './narrative_archive.mjs';
import {assertMayAdvance} from './save_gate.mjs';
import {verifyConsequences,stageConsequences} from './consequences.mjs';
// Pure, dependency-free, deterministic stage/check module for ChatGPT narrative saves.
// Staging does not perform a GitHub write; only an atomic commit + read-back can confirm saving.
function check(ok, message) {
  if (!ok) throw new Error(message);
}
function skillRank(xp) {
  check(Number.isSafeInteger(xp) && xp >= 0, "Skill XP must be a nonnegative integer");
  return [0, 3, 8, 15, 24, 35].reduce((rank, threshold, i) => xp >= threshold ? i : rank, 0);
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
  const next=JSON.parse(JSON.stringify(snapshot));
  const {state:s,manifest:m,events:e}=next;
  s.history.completed_turn_keys??=[];
  check(!s.history.completed_turn_keys.includes(turn.key),"Duplicate turn key: action already saved");
  const newDay=s.time.day+turn.elapsed_days;
  check(!(s.time.day<0 && newDay>=0),"Crossing Day 0 requires explicit shockwave transition handling");
  const t=m.last_completed_turn+1;
  const logs=[];
  function event(kind, actorId, intent, outcome, knownTo, awards) {
    const id=`EV-${String(e.events.length+1).padStart(6,"0")}`;
    const rec={id,chapter_id:m.chapter_id,turn:t,day:newDay,actor_ids:[actorId],kind,intent,outcome,known_to:knownTo,caused_by:[],state_changes:[],progression_awards:[]};
    for(const award of awards??[]) {
      check(award && typeof award.skill==="string" && /^[a-z][a-z0-9_]{1,40}$/.test(award.skill),"Skill identifier invalid");
      check(award.amount===1||award.amount===2,"Skill award must be +1 or +2");
      check(typeof award.reason==="string" && award.reason.trim().length>4, "XP needs a learning reason");
      const actor=actorId===s.player.id?s.player:s.world.actors[actorId];
      check(!!actor,"Unknown XP actor");
      const entry=actor.progression.skills[award.skill]??{xp:0,last_progress_event_id:null};
      const before=entry.xp;
      entry.xp+=award.amount;entry.last_progress_event_id=id;
      actor.progression.skills[award.skill]=entry;
      actor.progression.lifetime_skill_xp+=award.amount;
      rec.progression_awards.push({actor_id:actorId,skill:award.skill,amount:award.amount,reason:award.reason,before,after:entry.xp,rank_before:skillRank(before),rank_after:skillRank(entry.xp)});
    }
    e.events.push(rec);logs.push(rec);
    return rec;
  }
  event("player_action",s.player.id,turn.intent,turn.outcome,[s.player.id],turn.awards??[]);
  for(const item of turn.offscreen??[]) {
    check(item && typeof item.actor_id==="string" && s.world.actors[item.actor_id],"Unknown offscreen NPC");
    check(typeof item.outcome==="string" && item.outcome.trim() && item.outcome.length<3000,"Offscreen result required");
    const actor=s.world.actors[item.actor_id];
    const record=event("independent_actor",item.actor_id,item.intent??actor.independent_plan,item.outcome,[item.actor_id],item.awards??[]);
    actor.last_resolved_action={event_id:record.id,day:newDay,summary:item.outcome};
    if(item.new_location_id!==undefined) {
      check(item.new_location_id in s.world.locations,"Unknown destination");
      const origin=s.world.locations[actor.location_id];
      check(origin.connected_ids.includes(item.new_location_id),"Nonadjacent travel needs explicit route handling");
      record.state_changes.push({actor_id:item.actor_id,field:"location_id",before:actor.location_id,after:item.new_location_id});
      actor.location_id=item.new_location_id;
    }
    // Knowledge is never leaked to other actors: this record belongs only to its author.
    if(item.learned_fact!==undefined) {
      check(typeof item.learned_fact==="string" && item.learned_fact.length>4, "Invalid knowledge");
      check(typeof item.source==="string" && item.source.length>4,"Knowledge requires explicit source");
      actor.knowledge.push(`${item.learned_fact} (source: ${item.source}; ${record.id})`);
      record.state_changes.push({actor_id:item.actor_id,field:"knowledge",fact:item.learned_fact,source:item.source});
    }
  }
  s.time.day=newDay;
  s.history.last_event_sequence=e.events.length;
  s.history.completed_turn_keys.push(turn.key);
  s.chapter.last_resolved_event_id=e.events.at(-1).id;
  s.save.last_verified_turn=t;
  s.save.notes="Candidate checkpoint: commit and read-back required before calling this turn verified.";
  s.pending={type:"await_player_action",message:turn.next_prompt??"What does Jack do next?",last_player_action:turn.intent};
  m.last_completed_turn=t;m.last_event_sequence=e.events.length;m.last_event_id=e.events.at(-1).id;
  m.notes="Staged turn; only a verified Git commit makes this a durable save.";
  next.chapter+=`\n\n## Turn ${t} — Day ${newDay}\n\n**Jack's action:** ${turn.intent.replaceAll("\n"," ")}\n\n**Outcome:** ${turn.outcome.replaceAll("\n"," ")}\n`;
  for(const off of logs.slice(1)) next.chapter+=`\n**Independent event ${off.id} (${off.actor_ids[0]}):** ${off.outcome.replaceAll("\n"," ")}\n`;
  // Consequences are factual open threads; updates must cite the current turn's event IDs.
  const withConsequences=stageConsequences(next,turn.consequence_updates??[]);
  next.state.narrative_threads=withConsequences.state.narrative_threads;
  appendFullTurn(next,turn.player_text,turn.narration_messages);
  next.chapter += '\n\n### Texto íntegro narrado — turno ' + t + '\n\n' + turn.narration_messages.join('\n\n') + '\n';
  verifyNarrativeSnapshot(next);
  return next;
}
export { skillRank, verifyNarrativeSnapshot, stageNarrativeTurn };
