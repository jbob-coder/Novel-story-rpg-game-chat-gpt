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
- Fuera de la ciudad: **alcance por decidir**, no crear pueblos ni regiones de oficio.

No copiar automáticamente nombres, ubicaciones o servicios del borrador técnico de otro agente; integrar tras revisión cuando corresponda.

## Procedimiento de detalle bajo demanda
1. **Antes de escena:** consultar mapa y checkpoint; detectar zona, vecinos directos y detalles ya confirmados.
2. **Movimiento urbano:** escoger entre rutas conectadas existentes. Si interesa estimar duración, usar un **rango orientativo** según medio, congestión y distancia cualitativa, claramente marcado como no confirmado. No fingir kilómetros, calles ni horarios canónicos.
3. **Entrada a zona:** detallar solo elementos necesarios para entender accesos, ambiente y acciones presentes; etiquetar nuevas propuestas y evitar hechos retroactivos.
4. **Entrada a edificio:** recuperar cualquier descripción ya escrita; estimar planta y dimensiones de forma física plausible, coherente con usos y accesos. Definir interior solo entonces; no exigir un plano completo de edificios nunca visitados.
5. **Persistencia:** un detalle propuesto se incorpora al mundo canónico **únicamente** mediante la revisión/autorización correspondiente y, si afecta a la narración, el protocolo de guardado de cinco archivos. La edición de este atlas no es una acción del personaje.

## Dos preguntas pendientes que NO bloquean la base del atlas
- **Alcance territorial:** ¿solo completar Meridian Bay o bosquejar también alrededores? Hasta respuesta, no ampliar fuera de la ciudad.
- **Sentido de “tiempo”:** puede referirse al trayecto dentro de la ficción, o al esfuerzo de desarrollo para detallar una zona. Hasta respuesta, no fijar duraciones ni prometer trabajo en segundo plano.

## Verificación y límites
Revisión estática de fuente: **9 registros** (ciudad + 8 ubicaciones), **8 enlaces directos bidireccionales**. No se modifican `game/STATE.json`, `game/SAVE_MANIFEST.json`, capítulos, transcripciones, código ni rutas del motor. Orientación espacial propuesta **no es canon**. No se han corrido pruebas de software: este cambio es documentación aislada.
