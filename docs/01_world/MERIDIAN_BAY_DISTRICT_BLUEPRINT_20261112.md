# Meridian Bay — mapa preparado por barrios (propuesta de diseño)
**12 de noviembre de 2026 · Rama:** `work/meridian-bay-district-blueprint-20261112`.

El usuario pidió **un mundo construido antes de explorarlo**. Este incremento convierte el mapa básico en una **propuesta previa y persistente de diseño**, no en un generador que crea lugares porque Jack los visita. El catálogo estructurado está en [MERIDIAN_BAY_DISTRICT_BLUEPRINT_20261112.json](MERIDIAN_BAY_DISTRICT_BLUEPRINT_20261112.json).

**Estado exacto:** borrador registrado en rama aislada, **no aprobado como lugares canónicos nuevos ni incluido en `game/STATE.json`**. El checkpoint sigue en CH-000 turno 9, Día -29 por la mañana, Jack en su taller. Este trabajo no jugó un turno, no movió NPC, no estableció que un edificio está abierto y no creó eventos.

## La forma general de la ciudad, sin inventar coordenadas
El mapa existente permite navegar desde el hogar hacia un corredor de comercios, una plaza de transporte y un paseo junto al puerto. La orientación concreta y el tamaño de calles siguen abiertos.

```text
 Taller Wilson
       │
 Hogar Wilson
       │
 Railgarden ───── Market Row ───── Crosswater Plaza ───── Terminal
                       │  ╲             │
                   Café Bruma ─ [sin enlace directo] 
                       ╲   Harbor Walk ─╯
```

El esquema anterior **no representa distancia, cardinales ni calles exactas**: el hogar solo enlaza Railgarden; Café Bruma enlaza **únicamente Market Row**; Harbor Walk enlaza Market Row y la plaza. La diagonal hacia Harbor Walk es solo una asociación visual, no un enlace de Café Bruma. Para evitar inferencias, **los ocho enlaces directos válidos son únicamente los `connected_ids` del checkpoint y del JSON**. El ID `CITY-MERIDIAN-BAY` agrupa el conjunto, pero no permite teleportación por sus `connected_ids` administrativos.

## Capas de información
1. **Ubicación establecida:** ocho `LOC-*` ya guardados más la ciudad. Sus nombres, funciones y enlaces se toman del checkpoint, no se duplican ni reemplazan.
2. **Lugar preparado antes de la visita:** 13 fichas `MB-DES-*` que proponen funciones y posiciones relativas bajo una de las anclas existentes. Es información interna del diseño, **no aparece mágicamente cuando Jack llega**. La ficha puede existir antes de una escena y conservarse sin inventar que Jack la conoce. Su estado en este PR es *borrador*; requiere decisión de integración para pasar a diseño vinculante del mundo.
3. **Lugar conocido por Jack:** depende de su biografía, mensajes y observaciones guardadas, no del acceso del narrador a la ficha. Un lugar puede existir sin que Jack conozca su nombre ni localización.
4. **Lugar visitado / hecho ocurrido:** requiere una escena auténtica, una acción válida y el registro del turno. La mera existencia en el diseño no confirma una compra, encuentro, horario, visita, escuela o reparación.

Esta distinción importa para coordinar con la otra rama `work/meridian-bay-visitables-20261112`, que actualmente implementa creación de lugares visitables solo tras evidencia en escena. **No fusionar ese mecanismo como única vía de existencia del mundo sin resolver la diferencia entre lugar preconstruido y lugar observado.** La propuesta aquí no escribe en dicha rama.

## Zonas que ya pueden diseñarse sin detallar cada puerta
| Ancla existente | Diseño de tejido urbano y sitios preparados | Certeza |
| --- | --- | --- |
| Railgarden | Patio comunitario, abarrotes, encuentro vecinal y referencia de ruta educativa | 4 propuestas; la escuela de Elena aún no tiene dirección |
| Market Row | Emplazamiento propuesto del negocio **ya conocido** de Noah, patio de entregas, pasaje de oficios y puestos comerciales | 4 propuestas; no se adjudican inventario ni empleados nuevos |
| Crosswater Plaza | Área de paneles de rutas y borde de pequeños comercios | 2 subzonas basadas en rasgos generales existentes |
| Crosswater Terminal | Vestíbulo conceptual de transferencias bus/tren | 1 subzona propuesta; andenes y horarios abiertos |
| Harbor Walk | Tramo de vista pública al puerto y unión con Market Row | 2 tramos propuestos; instalaciones industriales NO quedan abiertas |
| Hogar Wilson / Taller Wilson / Café Bruma | Se conservan sus descripciones canónicas y conexiones; no se sobrescriben interiores ya narrados | Sin sitios nuevos en este incremento |

**Total:** 13 fichas de diseño en cinco anclas geográficas y conservación sin cambios de tres anclas ya detalladas. Los textos propuestos, aunque escritos y recuperables, no tienen ID `LOC-*` ni aparecen en el mapa jugado hasta aprobación y compatibilidad técnica. Se pueden ajustar sin reescribir la historia.

## Cómo usarlo al narrar
Ejemplo no canónico: Jack oye hablar del negocio de Noah en Market Row. La función de reparación y componentes de Noah **ya es parte de su ficha original**; el nombre comercial, fachada y local exacto siguen indefinidos. Una vez aprobada la ficha de mundo y situada una entrada pública, el narrador puede hablar del negocio antes de que Jack llegue. Jack no conoce por defecto su inventario, horario ni asuntos privados. Cuando él se desplaza, el recorrido utiliza conexiones verificadas; la duración sigue aproximada, sin fijar metros, minutos o interior por anticipado.

Con la escuela de Elena sucede algo distinto: solo se sabe que está en ruta hacia la escuela, no dónde queda. La ficha de `corredor hacia la enseñanza` **no es escuela nueva ni prueba de llegada**.

## Próxima escala (por demanda y con prioridad)
**Primera prioridad:** Railgarden ↔ Market Row, porque conectan hogar, rutina familiar, suministros técnicos y circulación comercial. Verificar qué establecimientos merecen entrada `LOC-*` **preexistente**; entonces diseñar acceso público, propietario/función y conexiones directas, sin necesitar una escena para que *existan*.

**Segunda prioridad:** Crosswater Plaza ↔ Terminal; especificar zonas peatonales y límites de acceso de transporte sin inventar frecuencias, horario del turno de Lena o visitas de Sora.

**Tercera prioridad:** Harbor Walk y exterior. Mantener el paseo y su paisaje; todavía no mapear instalaciones portuarias restringidas ni ciudades distantes. Fuera de Meridian Bay pueden existir noticias o menciones con fuente, sin que aparezcan mapas completos.

**Interiores:** detallar al entrar o cuando sean necesarios para una acción, respetando todo lo ya establecido. Esta preparación no obliga a crear centenares de edificios, simuladores o NPC artificiales.

## Validación y dependencias
Revisar la igualdad del mapa básico con `game/STATE.json`: 8 anclas `LOC-*`, 8 conexiones directas bidireccionales, 13 `MB-DES-*` únicos, sin nuevas conexiones ni horas o distancia exactas. Ejecutar `node --test tests/meridian_bay_district_blueprint.test.mjs` más las suites existentes en la rama. Comparar las cinco rutas de la partida con `work/chat-narrative-foundation` antes de integrar. El documento representa **diseño del mundo antes de visita**, no narración ni una decisión de Jack.

**Revisión pendiente:** decidir la integración técnica con `tools/meridian_bay_locations.mjs` de otro agente sin perder ni sobrescribir sus cambios. No fusionar automáticamente con `main`.
