// Read-only Meridian Bay walking slice. Proposals are not story turns or canon.
// All location IDs come from the saved world graph; no new city blocks are created.
import {worldRoute} from './living_world_routines.mjs';

const WALK_STOPS = Object.freeze([
  {id:'MB-WALK-RAILGARDEN',locationId:'LOC-RAILGARDEN-RESIDENTIAL',
    activity:'Observar la vida cotidiana y los accesos públicos de Railgarden.'},
  {id:'MB-WALK-MARKET',locationId:'LOC-COMMERCIAL-DISTRICT',
    activity:'Recorrer Market Row y decidir si investigar algún comercio.'},
  {id:'MB-WALK-CROSSWATER',locationId:'LOC-CROSSWATER-PLAZA',
    activity:'Consultar los paneles públicos de rutas de Crosswater Plaza.'}
]);
const NPC_SNAPSHOTS = Object.freeze([
  {actorId:'NPC-003',anchorId:'LOC-COMMERCIAL-DISTRICT'},
  {actorId:'NPC-002',anchorId:'LOC-CROSSWATER-PLAZA'}
]);

// Soft walking estimates only. Not measurements, schedules or clock updates.
// The household-to-street transition is provisional pending building detail.
const EDGE_HINTS = Object.freeze([
  ['LOC-WILSON-WORKSHOP','LOC-WILSON-APARTMENT',1,3],
  ['LOC-WILSON-APARTMENT','LOC-RAILGARDEN-RESIDENTIAL',2,6],
  ['LOC-RAILGARDEN-RESIDENTIAL','LOC-COMMERCIAL-DISTRICT',10,20],
  ['LOC-COMMERCIAL-DISTRICT','LOC-CROSSWATER-PLAZA',5,15]
]);
const edgeHint=(a,b)=>EDGE_HINTS.find(([x,y])=>(x===a&&y===b)||(x===b&&y===a));

export function previewMeridianBayWalk({state,destinationId='LOC-CROSSWATER-PLAZA',waypoints=[]}={}) {
  if (!state?.world?.locations || !state?.world?.actors || !state?.player?.location_id)
    throw new Error('Saved world and player location required');
  if (!Array.isArray(waypoints) || waypoints.length>8 ||
      !waypoints.every(id=>typeof id==='string' && id.startsWith('LOC-')))
    throw new Error('Invalid route waypoints');
  const originId=state.player.location_id;
  // Ordered, caller-supplied waypoints constrain the preview, never Jack's actions.
  // Stitch verified graph legs rather than assuming adjacency or teleportation.
  const route=[originId];
  let reachable=true;
  for (const stopId of [...waypoints,destinationId]) {
    const leg=worldRoute(state,route.at(-1),stopId);
    if (!leg) {reachable=false;break;}
    route.push(...leg.slice(1));
  }
  if (!reachable) return {
    classification:'narrator_private_proposal',status:'unreachable',
    originId,destinationId,waypoints:[...waypoints],route:null,segments:[],estimatedWalkingMinutes:null,
    activities:[],npcCandidates:[],requiresPlayerAction:true,actionCompleted:false
  };
  const segments=route.slice(1).map((to,i)=>{
    const from=route[i],hint=edgeHint(from,to);
    return {from,to,walkingMinutes:hint?{min:hint[2],max:hint[3],certainty:'rough_proposal_not_canon'}:null,
      traversed:false,requiresPlayerAction:true};
  });
  const estimatedWalkingMinutes=segments.every(s=>s.walkingMinutes!==null)
    ? {min:segments.reduce((a,s)=>a+s.walkingMinutes.min,0),
       max:segments.reduce((a,s)=>a+s.walkingMinutes.max,0),
       certainty:'rough_proposal_not_canon',excludesStopsAndDelays:true}
    : null;
  const activities=WALK_STOPS.filter(s=>route.includes(s.locationId))
    .map(s=>({...s,status:'optional_not_performed',requiresPlayerAction:true,
      hoursConfirmed:false,interiorMapped:false}));
  const npcCandidates=NPC_SNAPSHOTS.filter(n=>route.includes(n.anchorId))
    .filter(n=>Object.hasOwn(state.world.actors,n.actorId))
    .map(n=>{
      const actor=state.world.actors[n.actorId];
      return {actorId:n.actorId,name:actor.name,anchorId:n.anchorId,
        locationAtSavedCheckpoint:actor.location_id,
        coLocatedAtSavedCheckpoint:actor.location_id===n.anchorId,
        status:'potential_only',visibility:'narrator_private',
        requiresFreshObservation:true,encounterOccurred:false};
    });
  return {classification:'narrator_private_proposal',status:'route_available',
    originId,destinationId,waypoints:[...waypoints],route,segments,estimatedWalkingMinutes,activities,npcCandidates,
    requiresPlayerAction:true,actionCompleted:false,
    rules:['A preview never changes story time, position, relationships or save files.',
      'Only the reader chooses what Jack does; each completed action resolves in a saved turn.',
      'NPC checkpoint positions do not establish future encounters or routine completion.',
      'No exact date, opening hours, business access or distant geography is inferred.']};
}
