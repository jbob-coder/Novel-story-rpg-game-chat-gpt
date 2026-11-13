# Meridian Bay — atlas básico y expansión bajo demanda

**Fecha:** 2026-11-12. **Estado:** propuesta cartográfica reversible, no nuevo canon ni turno de la historia.
**Rama aislada:** `work/meridian-bay-atlas-20261112`; parte de `work/chat-narrative-foundation`. Ningún cambio al guardado, al motor de NPC, ni a `main`.

## Decisión del propietario sobre escala (conversación)
- Empezar **solo con un mapa básico**: lugares principales, relaciones espaciales comprensibles y orientación aproximada.
- **No** detallar exhaustivamente calles ni establecimientos de una zona que no esté siendo utilizada por la historia.
- Al desarrollarse una escena en un área, ampliar esa área de forma localizada, coherente y gradual; detener el detalle cuando cubra lo necesario para la escena.
- **Interiores y dimensiones completas únicamente al entrar o al necesitar recorrer un edificio**. Inspeccionar primero lo ya establecido del inmueble, después proponer o determinar medidas plausibles sin reescribir hechos anteriores.
- Mantener los detalles nuevos como hipótesis editables hasta que el propietario los apruebe o se establezcan mediante historia verificada.
- No adelantar tiempo narrativo ni asignar movimientos o ubicaciones a NPC al diseñar geografía.

## Capa 0 — nueve entradas de ubicación guardadas
Fuente verificada: `game/STATE.json` y `game/STARTING_LOCATIONS.md` en la rama narrativa. 
| ID | Lugar | Función | Ubicación relativa cierta |
| --- | --- | --- | --- |
| CITY-MERIDIAN-BAY | Meridian Bay | Ciudad portuaria | Contiene las zonas siguientes; no es una ruta de calle |
| LOC-CROSSWATER-PLAZA | Crosswater Transit Plaza | Plaza de tránsito | Contigua al terminal; conectada con Market Row y Harbor Walk |
| LOC-TRANSIT-TERMINAL | Crosswater Terminal | Estación de autobuses y trenes | Junto a la plaza |
| LOC-COMMERCIAL-DISTRICT | Market Row | Comercios y entregas | Conecta con plaza, Harbor Walk, Railgarden y Café Bruma |
| LOC-HARBOR-WALK | Harbor Walk | Paseo de costa | Conecta con plaza y Market Row |
| LOC-RAILGARDEN-RESIDENTIAL | Railgarden | Zona residencial | Conecta con Market Row y hogar Wilson |
| LOC-WILSON-APARTMENT | Hogar Wilson | Apartamento familiar | Dentro de Railgarden; acceso al taller |
| LOC-WILSON-WORKSHOP | Taller de Jack | Taller dentro del hogar | Se accede desde el apartamento |
| LOC-CAFE-BRUMA | Café Bruma | Cafetería | Acceso desde Market Row |

## Capa 1 — esquema orientativo (NO brújula confirmada)
La estructura segura es **topológica**, no métrica: las conexiones guardadas tienen prioridad. Para poder visualizarlo, se propone provisionalmente orientar el mar hacia el **sur**, Railgarden hacia el **noroeste**, Market Row en la **zona central**, Crosswater Plaza/terminal hacia el **este** y Harbor Walk hacia el **sur o sureste**. Esta distribución no pretende fijar coordenadas ni direcciones cardinales canónicas.

```text
                                N ↑ (propuesto)
          RAILGARDEN               CROSSWATER PLAZA ── TERMINAL
              │                      ╱     │
          MARKET ROW ────────────────╯      │
           │       ╲                       │
        CAFÉ BRUMA  HARBOR WALK ────────────╯
              │            (frente marítimo conceptual)
          [Nota: Café Bruma se conecta a Market Row;
           hogar Wilson se conecta a Railgarden, no a Café Bruma.]
```

**Para evitar ambigüedad del diagrama ASCII**, el grafo vinculante de trayectos directos es:
- Crosswater Plaza ↔ Crosswater Terminal
- Crosswater Plaza ↔ Market Row
- Crosswater Plaza ↔ Harbor Walk
- Market Row ↔ Harbor Walk
- Market Row ↔ Railgarden
- Market Row ↔ Café Bruma
- Railgarden ↔ Hogar Wilson
- Hogar Wilson ↔ Taller Wilson

Los ocho enlaces son simétricos según el estado guardado. El ID de la ciudad contiene zonas y **no** representa un desplazamiento directo entre ellas. Una calle o ruta nueva solo se confirma tras revisión; no inferir conexiones por cercanía visual.

## Capa 2 — catálogo inicial de expansión (sin establecer ubicaciones)
No hay coordenadas, distancias, horarios ni edificios detallados aprobados. Cuando se requieran, considerar **categorías**, no lugares canónicos:
- Railgarden: escuela/instituto, alimentos, vecindario y servicios cotidianos.
- Market Row: repuestos, recepción de entregas, puestos y comercios.
- Crosswater: información de pasajeros y mantenimiento del tránsito.
- Harbor Walk: servicios del paseo y actividad portuaria.
- Fuera de la ciudad: permitir **menciones, noticias y rumores con procedencia**, sin mapear regiones todavía; desarrollar únicamente al volverse necesarias.

No copiar automáticamente nombres, ubicaciones o servicios del borrador técnico de otro agente; integrar tras revisión cuando corresponda.

## Procedimiento de detalle bajo demanda
1. **Antes de escena:** consultar mapa y checkpoint; detectar zona, vecinos directos y detalles ya confirmados.
2. **Movimiento urbano:** escoger entre rutas conectadas existentes. Si interesa estimar duración, usar un **rango orientativo** según medio, congestión y distancia cualitativa, claramente marcado como no confirmado. No fingir kilómetros, calles ni horarios canónicos.
3. **Entrada a zona:** detallar solo elementos necesarios para entender accesos, ambiente y acciones presentes; etiquetar nuevas propuestas y evitar hechos retroactivos.
4. **Entrada a edificio:** recuperar cualquier descripción ya escrita; estimar planta y dimensiones de forma física plausible, coherente con usos y accesos. Definir interior solo entonces; no exigir un plano completo de edificios nunca visitados.
5. **Persistencia:** un detalle propuesto se incorpora al mundo canónico **únicamente** mediante la revisión/autorización correspondiente y, si afecta a la narración, el protocolo de guardado de cinco archivos. La edición de este atlas no es una acción del personaje.

## Decisiones posteriores del propietario — prioridad y mundo exterior
- **Primero Meridian Bay.** Desarrollar sus zonas principales hasta disponer de una ciudad comprensible, pero sin exigir que cada calle o edificio esté terminado antes de continuar una historia.
- **El mundo existe más allá del mapa construido.** Es legítimo que personajes se refieran a otras ciudades, rutas, regiones o países, o que una noticia hable de sucesos exteriores, sin que dichos lugares tengan un mapa, interiores ni simulación local detallados.
- **Referencias no equivalen a canon exhaustivo.** Una referencia exterior debe identificar su fuente y certeza: noticia publicada, testimonio, rumor o conocimiento de un personaje; no atribuir al narrador conocimiento omnisciente ni inventar titulares ya ocurridos. La noticia puede resultar cierta, incompleta o falsa. Si introduce un hecho importante, establecerlo narrativamente y registrarlo mediante el protocolo pertinente antes de tratarlo como historia.
- **No generar regiones exteriores ahora por obligación.** Un lugar externo puede mantenerse como mención contextual, nombre provisional u oportunidad de expansión. Si la acción del jugador lo lleva allí, preparar en ese momento un mapa básico, conexión de viaje y accesos necesarios, sin requerir diseñar toda la región. No asumir que una ruta desconocida es instantánea ni que un lugar es inaccesible solo por faltar su plano.
- **Fuentes y límites previos al Día 0.** Las noticias del exterior deben ser compatibles con sociedad normal antes de la onda cósmica; no adelantar poderes, información secreta ni conocimiento sobre la onda que ningún personaje tiene.
- **Tiempo de viaje como plausibilidad, no cronómetro rígido.** Cuando una caminata o traslado se resuelva en la historia, dar una duración razonable y aproximada basándose en tipo de zona, transporte, ruta y circunstancias observadas. Evitar minutos/km exactos si faltan datos. Una duración narrativa establecida con evidencia pasa a ser referencia para futuros viajes comparables; puede variar con tráfico, desvíos o paradas. No mover a nadie mientras la conversación esté inactiva ni avanzar la historia por una actualización cartográfica.

### Estados de desarrollo territorial
| Estado | Representación | Regla |
| --- | --- | --- |
| **Visitado/guardado** | Lugar con ID y enlaces verificados | Consultar el estado y conservar sus hechos antes de ampliar. |
| **Esquemático** | Barrio o zona con posición relativa y función | Orientación básica; sin interiores ni cronología fabricada. |
| **Mencionado/no mapeado** | Lugar externo conocido por noticias, conversación o rumor | Registrar procedencia cuando resulte relevante; no generar plano completo. |
| **Necesario para la siguiente escena** | Lugar al que el personaje realmente se dirige | Desarrollar por demanda accesos, ruta aproximada y detalles suficientes; después validar y persistir. |

**Resultado editorial:** Meridian Bay es la primera prioridad cartográfica, **no el límite del universo narrativo**. Las noticias exteriores amplían la sensación de sociedad viva sin comprometer mapas o eventos que aún no se han establecido.

## Verificación y límites
Revisión estática de fuente: **9 registros** (ciudad + 8 ubicaciones), **8 enlaces directos bidireccionales**. No se modifican `game/STATE.json`, `game/SAVE_MANIFEST.json`, capítulos, transcripciones, código ni rutas del motor. Orientación espacial propuesta **no es canon**. No se han corrido pruebas de software: este cambio es documentación aislada.
