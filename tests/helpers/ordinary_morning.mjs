// Fiction written for isolated acceptance tests. Never use these inputs as player orders.
const workshop = 'LOC-WILSON-WORKSHOP';
const district = 'LOC-COMMERCIAL-DISTRICT';
const shop = 'LOC-MARKET-NOAH-REPAIR';
const route = [workshop, 'LOC-WILSON-APARTMENT', 'LOC-RAILGARDEN-RESIDENTIAL', district, shop];
const frontage = 'La puerta del taller de Noah está abierta a Market Row.';
const access = 'Noah sostiene la hoja con el talón mientras pasa una caja al otro lado del umbral.';
const speech = '¿Me dejas ver el casquillo?';
const finding = 'La pestaña del casquillo sobresale del rebaje.';
const move = (route, minutes, basis) => ({
  field: 'location_id', before: route[0], after: route.at(-1), route,
  travel: {mode: 'walk', elapsed_minutes: minutes, basis}
});

export function ordinaryMorning(snapshot, {visit, recipientPresent}) {
  const courier = snapshot.state.world.actors['NPC-003'];
  if (!courier.resources.parcel || courier.location_id !== district)
    throw Error('Synthetic rehearsal requires Darius in Market Row with his parcel');
  const resources = {...courier.resources};
  const observation = recipientPresent
    ? 'La destinataria firma el recibo al recibir el paquete.'
    : 'El puesto de la destinataria está cerrado al llegar el mensajero.';
  if (recipientPresent) delete resources.parcel;
  const courierChanges = [{field: 'knowledge', fact: observation,
    source: 'Darius en persona en el puesto de entrega de Market Row.'}];
  if (recipientPresent)
    courierChanges.push({field: 'resources', before: courier.resources, after: resources});
  return {
    turn: {
      key: visit ? 'qa-ordinary-visit' : 'qa-ordinary-workbench',
      player_text: visit
        ? 'Voy al local de Noah. Escribo «' + speech + '» y examino la pieza, sin comprarla.'
        : 'Me quedo en el taller. Muevo despacio el codo de Aster a mano para comprobar si roza.',
      intent: visit ? 'Visitar a Noah e inspeccionar el casquillo.' : 'Comprobar a mano el recorrido del codo.',
      outcome: visit ? 'La inspección deja a la vista la pestaña.' : 'El codo recorre el arco bajo presión manual.',
      narration_messages: [visit
        ? frontage + ' ' + access + ' La deja en el suelo y hace sitio en el mostrador.\n\n' +
          'El collar reproduce el mensaje.\n\n—' + speech + '\n\n—Claro. De canto se ve mejor.\n\n' +
          'Noah apoya la pieza sobre un paño y retira la mano. ' + finding + ' Al poner el casquillo de plano, queda un hilo de luz entre el borde y el paño.'
        : 'El codo cede bajo la presión de la mano. A mitad del arco, el roce de la manga contra el banco tapa el sonido de la junta. A la vuelta se oye bien, un susurro parejo hasta el tope. En cuanto cesa la presión, el brazo queda quieto. Los cables de los actuadores siguen sueltos.'],
      elapsed_days: 0, elapsed_minutes: 30, next_time_of_day: 'morning',
      changes: visit ? [move(route, 24, 'Trayecto a pie desde Railgarden hasta el comercio.'),
        {field: 'knowledge', fact: finding, source: 'Examen directo del casquillo en el mostrador de Noah.'}] : [],
      location_discoveries: visit ? [{id: shop, observed_from: district, reviewed: true,
        public_access_confirmed: true, scene_quote: frontage, access_quote: access}] : []
    },
    npcResolutions: [{
      actor_id: 'NPC-006', reviewed: true, resolved: true,
      causal_basis: 'Noah lleva una caja del distrito al mostrador de su negocio.',
      outcome: 'El comerciante entra con su caja y deja libre el mostrador.',
      changes: [move([district, shop], 3, 'Noah lleva la caja desde la calle.')]
    }, {
      actor_id: courier.id, reviewed: true, resolved: true,
      causal_basis: courier.independent_plan + ' ' + observation,
      outcome: recipientPresent ? 'Darius entrega el bulto y sale con el recibo firmado.'
        : 'Darius conserva el paquete para un segundo intento.',
      changes: courierChanges
    }]
  };
}

// This continuation receives only the checkpoint recovered from GitHub.
export function waitingMoment(snapshot) {
  const {player, world} = snapshot.state;
  let scene;
  if (player.location_id === workshop) {
    scene = 'Por la ventana del taller entra el sonido de un coche al pasar.';
  } else if (player.location_id === shop && world.actors['NPC-006'].location_id === shop &&
      player.knowledge.some(fact => fact.startsWith(finding + ' (source: '))) {
    scene = 'Noah dobla el paño por la esquina. El casquillo sigue sobre el mostrador.';
  } else {
    throw Error('The recovered scene has no matching literary rehearsal');
  }
  return {key: 'qa-ordinary-pause', player_text: 'Espero un momento.', intent: 'Esperar.',
    outcome: 'Transcurre un minuto.', narration_messages: [scene], elapsed_days: 0, elapsed_minutes: 1};
}
