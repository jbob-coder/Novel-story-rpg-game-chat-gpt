// Narrator-only diagnostic snapshot. This NEVER simulates an event or changes canon.
// The safe player view excludes offscreen proposals, NPC knowledge, and private threads.
import {previewNPCRoutines} from './living_world_routines.mjs';
import {availability} from './living_world_availability.mjs';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const insist=(ok,message)=>{if(!ok)throw new Error(message)};

export function inspectLivingWorld({snapshot,elapsedMinutes=0,actorIds=[],
  weekday=null,minute=null,schedules={},exceptions={}}={}){
  verifyNarrativeSnapshot(snapshot);
  insist(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0 &&
    elapsedMinutes<=525600,'Invalid elapsed narrative minutes');
  insist(Array.isArray(actorIds)&&actorIds.length<=100 &&
    actorIds.every(x=>typeof x==='string') && new Set(actorIds).size===actorIds.length,
    'Actor selection must be unique IDs');
  const state=snapshot.state,manifest=snapshot.manifest;
  const selected=actorIds.filter(id=>Object.hasOwn(state.world.actors,id));
  const candidates=previewNPCRoutines({state,elapsedMinutes,actorIds:selected,
    weekday,minute,schedules,exceptions});
  const placeIds=Object.keys(state.world.locations);
  const placeAvailability=Object.fromEntries(placeIds.map(id=>{
    const checked=availability({schedule:schedules[id],exception:exceptions[id],
      weekday,minute});
    return [id,checked];
  }));
  return copy({
    classification:'narrator_private_only',
    checkpoint:{chapter:manifest.chapter_id,turn:manifest.last_completed_turn,
      event:manifest.last_event_id,day:state.time.day,timeOfDay:state.time.time_of_day,
      clockTime:state.time.clock_time??null,
      approximateElapsedMinutes:state.time.elapsed_minutes_since_opening_approx??null},
    player:{id:state.player.id,locationId:state.player.location_id,
      knownFacts:state.player.knowledge??[]},
    pending:state.pending??null,
    unresolvedThreads:(state.narrative_threads??[]).filter(x=>x.status==='open').map(x=>({
      id:x.id,ownerActorId:x.owner_actor_id,scope:x.scope,question:x.question
    })),
    proposedNPCActivities:candidates,placeAvailability,
    guardrails:['Proposals are not events.','Unknown schedules are not closed.',
      'Offscreen details require a justified disclosure before narrating them to Jack.',
      'No activity advances when the chat is inactive.']
  });
}

export function playerVisibleDiagnostic(report){
  insist(report?.classification==='narrator_private_only','Narrator diagnostic required');
  return copy({chapter:report.checkpoint.chapter,turn:report.checkpoint.turn,
    day:report.checkpoint.day,timeOfDay:report.checkpoint.timeOfDay,
    locationId:report.player.locationId,knownFacts:report.player.knownFacts});
}
