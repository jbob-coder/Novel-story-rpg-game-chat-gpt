// Sealed historical NPC knowledge snapshot at CH-000 / turn 9 / EV-000029.
// Extracted without rewriting canon from main @ 019175c6463ff31807a0f7013d91299add94913c.
// Exact source game/STATE.json Git blob: 3f4e9c98a7211068faefd31d0a0acbd4260ef589.
// This is a versioned forward-only anchor, NOT evidence of when any legacy fact
// was first learned. Existing knowledge may include unmaterialized early turns.
// The anchor is reviewed source data; extending it requires an explicit migration.
export const NPC_KNOWLEDGE_ANCHOR=Object.freeze({
  chapterId:'CH-000',
  lastTurn:9,
  lastEventId:'EV-000029',
  sourceCommit:'019175c6463ff31807a0f7013d91299add94913c',
  sourceStateBlob:'3f4e9c98a7211068faefd31d0a0acbd4260ef589',
  actorKnowledge:Object.freeze({
    "NPC-001":Object.freeze(["An evening route is running behind schedule.","Transit staff are handling routine operations.","A Crosswater display suffered a reported brief anomaly. (source: Report from transit staff at Crosswater terminal; EV-000003)","The display malfunction is being tracked by maintenance separately from the train delay. (source: Internal transit maintenance communication; EV-000007)"]),
    "NPC-002":Object.freeze(["Has a routine maintenance assignment in the plaza.","One transit information sign displayed a brief visible anomaly during the evening rush. (source: Sora's own observation while inspecting the plaza; EV-000002)","The unusual display symptoms merit an incident note rather than being dismissed as an ordinary route-delay message. (source: Sora's own maintenance observations during shift; EV-000006)","The immediate Crosswater panel inspection is closed as an unresolved equipment problem without any suspect information. (source: Sora completed a routine maintenance check on the public transit sign.; EV-000012)"]),
    "NPC-003":Object.freeze(["He has a delivery deadline."]),
    "NPC-004":Object.freeze(["Jack utiliza el collar con el teléfono para comunicarse.","Jack fabrica dispositivos electrónicos y usa el taller familiar.","Daniel e Isabel Wilson fallecieron tras un incendio; Jack tuvo secuelas al hablar.","A pair of buildings in her illustration obscured the street perspective; she corrected their angle after Jack pointed it out. (source: Elena herself adjusted the digital illustration after Jack's gestural feedback; EV-000018)","Jack vio el dibujo y señaló un problema de perspectiva; pudo corregirlo sin que el hermano escribiera diálogo.","She needs an external memory device to carry her artwork to school tomorrow. (source: Elena prepared the file and asked Jack from the workshop doorway.; EV-000021)","Jack le entregó una memoria USB de repuesto para guardar y llevar su ilustración al colegio. (source: Elena recibió la memoria directamente de Jack en la puerta del taller; EV-000023)","Elena guardó una copia de su ilustración en la memoria USB prestada y la lleva preparada en su mochila. (source: Elena comprobó la copia en su propia computadora durante la noche y preparó la mochila por la mañana; EV-000025)"]),
    "NPC-005":Object.freeze(["Jack construye gadgets.","Jack usa un collar que reproduce lo que escribe para hablar.","Le enseñó reparaciones básicas cuando era niño.","Sus hijos Daniel e Isabel Wilson murieron después de un incendio; Jack sufrió secuelas en la voz."]),
    "NPC-006":Object.freeze(["Jack crea y repara aparatos.","Conoce a Jack por consultas y compras de materiales comunes."]),
    "NPC-007":Object.freeze(["Jack señaló café y pastelito en el menú.","La caja registradora se bloqueó y produjo un recibo extraño durante el turno.","El café y el dulce de Jack fueron servidos y su pago sigue pendiente.","Jack paid his café and pastry bill in cash and remained at the table as closing approached. (source: Mara received Jack's payment and observed him in the café.; EV-000011)","Jack abonó 7,80 en efectivo y recibió dos con veinte de cambio.","Se le avisó de que la sección cerraría en cinco minutos."]),
  })
});
