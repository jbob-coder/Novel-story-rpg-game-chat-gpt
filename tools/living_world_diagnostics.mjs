// Narrator-only diagnostic snapshot. This NEVER simulates an event or changes canon.
// The safe player view excludes offscreen proposals, NPC knowledge, and private threads.
import {previewNPCRoutines} from './living_world_routines.mjs';
import {availability} from './living_world_availability.mjs';
import {verifyNarrativeSnapshot} from './turn_engine.mjs';
import {selectRelevantNPCs,reviewNPCCommitments} from './living_world_commitments.mjs';
import {evaluateNPCPlans} from './world_plans.mjs';
import {allEvents} from './chapter_history.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {inspectPrebuiltMeridianBay} from './meridian_bay_locations.mjs';
import {inspectSceneEstablishedPlaces} from './meridian_bay_discovery.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const insist=(ok,message)=>{if(!ok)throw new Error(message)};

export function inspectLivingWorld({snapshot,elapsedMinutes=0,elapsedDays=0,actorIds=null,
  weekday=null,minute=null,schedules={},exceptions={},commitments=[],includeCityDesign=false}={}){
  verifyNarrativeSnapshot(snapshot);
  insist(typeof includeCityDesign==='boolean','City design selection must be boolean');
  insist(Number.isSafeInteger(elapsedMinutes)&&elapsedMinutes>=0 &&
    elapsedMinutes<=525600,'Invalid elapsed narrative minutes');
  insist(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100 &&
    actorIds.every(x=>typeof x==='string') && new Set(actorIds).size===actorIds.length),
    'Actor selection must be unique IDs');
  const state=snapshot.state,manifest=snapshot.manifest;
  // Review the whole authorized interval even when no actor has a saved plan.
  // No endpoint period is asserted by this read-only diagnostic.
  validateTemporalAdvance({currentPeriod:state.time.time_of_day,elapsedDays,elapsedMinutes});
  const eventIds=new Set(allEvents(snapshot).map(event=>event.id));
  const chosen=actorIds===null?selectRelevantNPCs({state}):actorIds;
  const selected=chosen.filter(id=>Object.hasOwn(state.world.actors,id));
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
    proposedNPCActivities:candidates,
    planReview:Object.entries(state.world.actors).filter(([,actor])=>actor.plans?.length)
      .flatMap(([actorId])=>evaluateNPCPlans({state,actorId,elapsedMinutes,elapsedDays,
        eventIds})),
    commitmentReview:reviewNPCCommitments({state,actorIds:selected,elapsedMinutes,elapsedDays,
      commitments,eventIds}),
    cityDesign:includeCityDesign?{
      classification:'narrator_private_design_review',
      locations:inspectPrebuiltMeridianBay({state,fromId:state.player.location_id}),
      observedPlaces:inspectSceneEstablishedPlaces({snapshot})
    }:null,
    selectedActorIds:selected,placeAvailability,
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
