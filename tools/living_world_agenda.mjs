// Bounded causal agenda suggestions. Pure, deterministic, narrator-private.
// A candidate is NOT an action taken, a schedule, an arrival or a story turn.
// Reviewed outcomes still go through stageNPCResolution and five-file save.
import {reviewNPCCommitments} from './living_world_commitments.mjs';
import {availability} from './living_world_availability.mjs';
import {validateTemporalAdvance} from './living_world_time.mjs';
import {worldRoute} from './living_world_routines.mjs';

const check=(ok,message)=>{if(!ok)throw new Error(message)};
const copy=x=>JSON.parse(JSON.stringify(x));
// Every candidate is anchored to an already recorded NPC goal or resource.
// A destination null is intentional: an unknown school/customer is NOT a place.
export const CIVILIAN_ROUTINES=Object.freeze([
 {id:'dispatch-review',actor:'NPC-001',label:'Revisar coordinación de salidas',destination:'LOC-TRANSIT-TERMINAL',resource:'work_authority',periods:['morning','afternoon','evening','night']},
 {id:'passenger-coordination',actor:'NPC-001',label:'Considerar consultas y cambios de servicio',destination:'LOC-TRANSIT-TERMINAL',resource:'work_authority',periods:['morning','afternoon','evening','night']},
 {id:'maintenance-notes',actor:'NPC-002',label:'Revisar notas de inspección',destination:'LOC-CROSSWATER-PLAZA',resource:'work_order',periods:['morning','afternoon','evening']},
 {id:'inspection-obstacles',actor:'NPC-002',label:'Evaluar impedimentos para completar el circuito',destination:'LOC-CROSSWATER-PLAZA',resource:'work_order',periods:['morning','afternoon','evening']},
 {id:'courier-plan',actor:'NPC-003',label:'Revisar ruta posible del paquete',destination:null,resource:'parcel',periods:['morning','afternoon','evening']},
 {id:'parcel-obstacles',actor:'NPC-003',label:'Considerar obstáculos y margen de entrega',destination:null,resource:'parcel',periods:['morning','afternoon','evening']},
 {id:'school-preparation',actor:'NPC-004',label:'Organizar materiales del proyecto escolar',destination:null,resource:'current_project',periods:['morning','afternoon']},
 {id:'school-journey',actor:'NPC-004',label:'Considerar el siguiente tramo del camino a la escuela',destination:null,resource:'current_project',periods:['morning','afternoon']},
 {id:'creative-time',actor:'NPC-004',label:'Reservar tiempo personal para ilustración',destination:null,resource:'current_project',periods:['afternoon','evening']},
 {id:'clock-handover-plan',actor:'NPC-005',label:'Preparar una posible devolución del reloj',destination:null,resource:'current_repair',periods:['morning','afternoon']},
 {id:'neighbor-coordination',actor:'NPC-005',label:'Valorar cuándo coordinar la devolución con el vecino',destination:null,resource:'current_repair',periods:['morning','afternoon','evening']},
 {id:'shop-orders',actor:'NPC-006',label:'Revisar los encargos y necesidades del negocio',destination:'LOC-COMMERCIAL-DISTRICT',resource:'daily_life',periods:['morning','afternoon','evening']},
 {id:'parts-sourcing',actor:'NPC-006',label:'Considerar opciones de suministro de repuestos',destination:null,resource:'daily_life',periods:['morning','afternoon','evening']},
 {id:'cashier-reconciliation',actor:'NPC-007',label:'Evaluar las anotaciones de caja',destination:'LOC-CAFE-BRUMA',resource:'register',periods:['evening','night']},
 {id:'cafe-close-review',actor:'NPC-007',label:'Revisar tareas pendientes de mesas y cierre',destination:'LOC-CAFE-BRUMA',resource:'shift',periods:['evening','night']}
]);
const candidatesByActor=actorId=>CIVILIAN_ROUTINES.filter(x=>x.actor===actorId);
const urgencyRank={overdue_review:0,due_today_review:1,blocked_review:2,deadline_unknown:3,upcoming:4};

export function planNPCAgendas({state,actorIds=null,elapsedMinutes=0,elapsedDays=0,
  nextPeriod=null,weekday=null,minute=null,schedules={},exceptions={},limitPerActor=3}={}){
 check(state?.world?.actors&&state?.world?.locations&&state?.time,'Saved city state required');
 check(actorIds===null||(Array.isArray(actorIds)&&actorIds.length<=100&&
  new Set(actorIds).size===actorIds.length&&actorIds.every(x=>typeof x==='string'&&
  Object.hasOwn(state.world.actors,x))),'Unknown or repeated NPC selection');
 check(Number.isSafeInteger(limitPerActor)&&limitPerActor>=0&&limitPerActor<=8,
  'Invalid agenda candidate limit');
 validateTemporalAdvance({currentPeriod:state.time.time_of_day,elapsedDays,
  elapsedMinutes,nextPeriod});
 if(elapsedMinutes===0||limitPerActor===0)return [];
 const targetDay=state.time.day+elapsedDays;
 const chosen=actorIds??Object.keys(state.world.actors).sort();
 const period=nextPeriod??state.time.time_of_day;
 return copy(chosen.flatMap(actorId=>{
  const actor=state.world.actors[actorId];
  if(!actor||!actor.goal||!actor.independent_plan)return [];
  const availabilityInfo=availability({schedule:schedules?.[actorId],
    exception:exceptions?.[actorId],weekday,minute});
  const base={actorId,actorLocationId:actor.location_id,dayToReview:targetDay,
    availability:availabilityInfo.status,availabilitySource:availabilityInfo.source,
    goalEvidence:actor.goal,planEvidence:actor.independent_plan,
    disclosure:'narrator_private',status:'unresolved_proposal',requiresResolution:true};
  const selected=[];
  const obligations=reviewNPCCommitments({state,actorIds:[actorId],
    elapsedMinutes,targetDay}).filter(x=>x.kind==='explicit_commitment')
    .sort((a,b)=>(urgencyRank[a.review]??9)-(urgencyRank[b.review]??9)||a.id.localeCompare(b.id));
  for(const o of obligations){
   selected.push({...base,id:'agenda:'+o.id,kind:'obligation',
    objective:o.summary,obligationId:o.id,sourceEventId:o.sourceEventId,
    review:o.review,priority:o.priority??'normal',
    blockers:o.blockers??[],actionProposal:o.review==='blocked_review'?
      'Consider a feasible workaround, postponement or justified cancellation':
      'Consider the next step while accounting for the deadline and current resources',
    destinationId:null,route:null,
    feasibility:'requires_narrator_review',
    possibleResults:['progress','defer','blocked','fail','resolve_only_if_supported']});
  }
  for(const template of candidatesByActor(actorId)){
   // A missing factual resource makes this role template inapplicable rather
   // than asserting an invented object or responsibility.
   if(!Object.hasOwn(actor.resources??{},template.resource))continue;
   const source=(actor.resources??{})[template.resource];
   const route=template.destination?
    worldRoute(state,actor.location_id,template.destination):null;
   selected.push({...base,id:'routine:'+actorId+':'+template.id,kind:'civilian_routine',
    objective:template.label,resourceEvidence:copy(source),obligationId:null,
    suggestedPeriod:template.periods.includes(period)?'compatible':'outside_suggested_period',
    destinationId:template.destination,
    route,feasibility:template.destination===null?'destination_not_established':
       route===null?'no_verified_route':'requires_narrator_review',
    actionProposal:'Review a plausible next action or decide to postpone it',
    possibleResults:['progress','defer','blocked','fail','no_relevant_change']});
  }
  // Role and commitments can be competing priorities; return the bounded
  // possibilities, never select an outcome or imply simultaneous execution.
  return selected.slice(0,limitPerActor);
 }));
}

// Potential contact, not a meeting. The two people must already share an
// established location; any future exchange still requires a causal event.
export function previewNearbyNPCContacts({state,actorIds=null}={}){
 check(state?.world?.actors,'Saved NPC state required');
 const all=Object.entries(state.world.actors);
 const selected=actorIds===null?new Set(all.map(([id])=>id)):new Set(actorIds);
 check([...selected].every(id=>Object.hasOwn(state.world.actors,id)),
  'Unknown actor in contact selection');
 const links=[];
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
  const [a,one]=all[i],[b,two]=all[j];
  if(!selected.has(a)||!selected.has(b)||one.location_id!==two.location_id)continue;
  links.push({actorIds:[a,b],locationId:one.location_id,
    evidence:'both_locations_recorded',kind:'potential_contact_only',
    conversationOccurred:false,knowledgeShared:false,requiresResolution:true,
    visibility:'narrator_private'});
 }
 return copy(links);
}
