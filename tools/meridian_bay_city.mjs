// Meridian Bay service and encounter opportunities for the narrator.
// Anchors are existing canonical locations. Proposed facilities are NOT new
// LOC records, routable destinations, proven opening hours or story events.
const AREA_CATALOG=Object.freeze([
 {anchor:'LOC-RAILGARDEN-RESIDENTIAL',role:'residential',
  opportunities:[
   {id:'BAY-RAIL-FOOD',label:'Comercio de alimentos de barrio',function:'daily_supplies',relatedActors:['NPC-004','NPC-005'],requires:['establish_business']},
   {id:'BAY-RAIL-SCHOOL',label:'Trayecto y acceso a la escuela de Elena',function:'school_commute',relatedActors:['NPC-004'],requires:['establish_school_location','establish_access']},
   {id:'BAY-RAIL-NEIGHBOR',label:'Punto de entrega del reloj de la vecindad',function:'neighbor_service',relatedActors:['NPC-005'],requires:['establish_neighbor_location','establish_contact']},
   {id:'BAY-RAIL-CARE',label:'Servicio sanitario de proximidad',function:'local_health',relatedActors:[],requires:['establish_facility']}
  ]},
 {anchor:'LOC-COMMERCIAL-DISTRICT',role:'commerce',
  opportunities:[
   {id:'BAY-MARKET-PARTS',label:'Proveedor de repuestos generales',function:'repair_supplies',relatedActors:['NPC-006'],requires:['establish_supplier']},
   {id:'BAY-MARKET-DELIVERY',label:'Punto de recepción de mensajería',function:'courier_handoff',relatedActors:['NPC-003'],requires:['establish_recipient','establish_address']},
   {id:'BAY-MARKET-COMMUNITY',label:'Actividad creativa y comercio cultural',function:'creative_exchange',relatedActors:['NPC-004'],requires:['establish_activity']},
   {id:'BAY-MARKET-SERVICES',label:'Oficinas y servicios comerciales',function:'business_services',relatedActors:['NPC-006'],requires:['establish_access']}
  ]},
 {anchor:'LOC-CROSSWATER-PLAZA',role:'transit',
  opportunities:[
   {id:'BAY-CROSS-HELP',label:'Atención a pasajeros y coordinación',function:'passenger_assistance',relatedActors:['NPC-001'],requires:['establish_staff_availability']},
   {id:'BAY-CROSS-INSPECT',label:'Circuito de mantenimiento de la plaza',function:'maintenance',relatedActors:['NPC-002'],requires:['confirm_work_order']},
   {id:'BAY-CROSS-VENDORS',label:'Puestos y comercios del entorno',function:'local_retail',relatedActors:['NPC-003'],requires:['establish_vendor']},
   {id:'BAY-CROSS-TRANSFER',label:'Conexión con transporte colectivo',function:'transit_transfer',relatedActors:['NPC-001','NPC-003'],requires:['confirm_service_schedule']}
  ]},
 {anchor:'LOC-HARBOR-WALK',role:'waterfront',
  opportunities:[
   {id:'BAY-HARBOR-REST',label:'Paseo y convivencia frente al agua',function:'public_space',relatedActors:[],requires:['confirm_access_conditions']},
   {id:'BAY-HARBOR-WORK',label:'Actividad laboral del entorno portuario',function:'harbor_livelihood',relatedActors:[],requires:['establish_employer','establish_access']},
   {id:'BAY-HARBOR-MAINT',label:'Revisión de equipamiento público',function:'public_maintenance',relatedActors:['NPC-002'],requires:['establish_work_order']}
  ]},
 {anchor:'LOC-CAFE-BRUMA',role:'cafe',
  opportunities:[
   {id:'BAY-CAFE-REGISTER',label:'Cuadre de ventas anotadas manualmente',function:'cafe_accounts',relatedActors:['NPC-007'],requires:['verify_shift_continuity']},
   {id:'BAY-CAFE-SERVICE',label:'Servicio cotidiano y relaciones de clientela',function:'cafe_service',relatedActors:['NPC-007'],requires:['confirm_opening_hours']}
  ]},
 {anchor:'LOC-TRANSIT-TERMINAL',role:'terminal',
  opportunities:[
   {id:'BAY-TERM-DISPATCH',label:'Coordinación y revisión de salidas',function:'dispatch',relatedActors:['NPC-001'],requires:['confirm_shift_continuity']}
  ]}
]);
const copy=x=>JSON.parse(JSON.stringify(x));
const check=(ok,message)=>{if(!ok)throw new Error(message)};
export function inspectMeridianBay({state,anchorId=null,actorId=null}={}){
 check(state?.world?.locations&&state?.world?.actors,'Saved city state required');
 check(anchorId===null||Object.hasOwn(state.world.locations,anchorId),'Unknown city anchor');
 check(actorId===null||Object.hasOwn(state.world.actors,actorId),'Unknown actor');
 const catalog=AREA_CATALOG.filter(a=>anchorId===null||a.anchor===anchorId)
 .filter(a=>Object.hasOwn(state.world.locations,a.anchor));
 return copy({
  classification:'narrator_private_proposals',
  areas:catalog.map(area=>({
   anchorId:area.anchor,confirmedName:state.world.locations[area.anchor].name,
   knownConnections:[...(state.world.locations[area.anchor].connected_ids??[])],
   role:area.role,
   opportunities:area.opportunities.filter(o=>actorId===null||o.relatedActors.includes(actorId))
    .map(o=>{
      const established=Object.values(state.world.locations).find(loc=>
        loc.origin_opportunity_id===o.id&&loc.parent_id===area.anchor&&
        typeof loc.established_event_id==='string');
      return {...o,status:established?'established_by_scene':'proposed_not_canon',
        locationId:established?.id??null,
        establishmentEventId:established?.established_event_id??null,
        openingHours:null,travelMinutes:null,
        verifiedAccessible:established?.access_status==='public_confirmed'&&
          established?.public_area===true};
    })
  })),
  rules:['A proposal never becomes a location without a reviewed narrative event.',
   'Proposals do not imply a weekday, school address, opening hour or travel duration.',
   'A related actor may consider an opportunity; this is not proof of attendance or contact.',
   'An observed public place is established by an archived event, but its hours, staff and inventory remain unknown.']
 });
}
export function proposalsForActor({state,actorId}={}){
 return inspectMeridianBay({state,actorId}).areas.flatMap(a=>
  a.opportunities.map(o=>({anchorId:a.anchorId,...o})));
}
