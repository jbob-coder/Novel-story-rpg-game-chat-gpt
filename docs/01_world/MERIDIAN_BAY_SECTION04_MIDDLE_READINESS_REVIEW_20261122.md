# Meridian Bay — Sección 04: M2, M3 y P2; bloqueo de integración física (2026-11-22)

**Estado:** estudio derivado de fuentes históricas, todavía **SIN plano físico ni acceso jugable**. Este incremento continúa la [PR #132](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/132) (M1/P1) y la [PR #122](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/122) (cinco secciones), sin sustituir sus archivos.

**Rama:** `work/meridian-section04-middle-sections-20261122`, creada sobre la PR #132 @ `07c1e099a83b22cdb5d993876d2ad284e08652b6`. Sus antecesores #122→#112→#103→#89→#87→#86 siguen como borradores. No fusionar este estudio directamente a `main`.

## Resultado implementado

Se creó un registro estructurado [`MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.json`](MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.json) con exactamente **tres** de las cinco subsecciones que todavía carecen de plano de suelo. Todas las posiciones se toman de los archivos históricos de PR #122/PR #103; los rectángulos son solo las cajas mínimas que rodean las **líneas dibujadas**, **no** nuevas parcelas urbanas.

| Sección | Punto inicial ficticio | Punto de entrega ficticio | Longitud de boceto | Conexión comprobada |
| --- | --- | --- | ---: | --- |
| **M2** | (60, 40.7) | (64, 38.1) | 4.770744 | Recibe la línea de estudio M1; enlaza matemáticamente con M3 |
| **M3** | (64, 38.1) | (68, 36.9) | 4.176123 | Termina en el límite x=68 de Coast 01, sin certificar acceso a esa costa |
| **P2** | (66.9, 40.6) | (68, 38.635714) | 2.251315 | Recibe la línea de P1; termina en el límite x=68 de Coast 01 |

**Particularidad de P2:** su extremo `(68,38.635714)` se obtiene recortando matemáticamente el segmento PR #103 que sale de `(66.9,40.6)` hacia el nodo posterior `(68.3,38.1)`. **No** es ese nodo posterior, ni una entrada construida, ni un cruce peatonal comprobado. El validador verifica el recorte a seis decimales y la filiación de ambos puntos.

La ventana x=60..68, y=36.9..40.7 es un **marco de investigación deducido de extremos**. No significa que el resto de esa zona esté vacío, sea tierra firme, pertenezca a la ciudad o permita circular. El porcentaje anterior de cobertura no se altera. Las líneas M2/M3 y P2 no se cruzan estrictamente entre sí dentro de esta geometría, pero ello **no prueba** ausencia de edificios, desniveles ni obstáculos desconocidos.

## 18 requisitos concretos pendientes

Cada sección guarda **seis** requisitos de evidencia independientes, todos `status: "unknown"` con `sourceEvidence: null`, y conserva `landUse`, `buildingFootprints`, `publicRightOfWay`, `actualRoadWidth` y `physicalObstacles` como `null`.

- **M2 (6):** parcelas y masa de edificios; derecho público de paso; intersecciones y vehículos; muros u otros obstáculos; anchura/accesibilidad peatonal; continuidad real M1↔M2↔M3. El término «zona comercial intermedia» pertenece al contexto de **diseño histórico**, no a un nuevo barrio admitido.
- **M3 (6):** parcelas y edificios; derecho público de paso; empalme real con Coast 01; rejas y acceso restringido a usos industriales/portuarios; cruces/obstáculos; anchura y accesibilidad. La continuidad de dos coordenadas **no concede permiso portuario**.
- **P2 (6):** parcelas y edificios; derecho público de paso; segregación peatón–tráfico del terminal/plaza; empalme real con Coast 01; cruces/obstáculos; anchura y accesibilidad. La plaza es un lugar público del juego, pero su perímetro físico hacia el puerto permanece indeterminado.

La geometría de rutas de origen **no** establece servidumbres, vallas, calles abiertas, zonas de industria ni nuevas edificaciones. El puerto sigue visible desde ciertos lugares del canon, pero no se han asignado edificios que alteren la visibilidad conocida del terminal desde Café Bruma.

## Implementación, invariantes y fuentes

[`tools/meridian_section04_middle_readiness.mjs`](../../tools/meridian_section04_middle_readiness.mjs) fija por identidad Git blob cinco fuentes inmutables: registro PR #122 (`a8138c2c1acbb7e0e4604b5df8ea1dec3531ac9b`), M1/P1 PR #132 (`760e819f0b9027e9eb7a8b55f1f33d0e65251a74`), rutas PR #103 (`aae66aae315603e37e8cb88034600446bf46d21d`), Coast 01 PR #89 (`139c3687c98285aff886d28422544d082768217d`) y el plano de escala de ciudad (`2e8c5ff412436a6e7d526bc0172adfca77107263`).

El módulo reutiliza las validaciones completas de PR #122 y PR #132, exige la correspondencia de nodos y empalmes, distingue el punto P2 de su siguiente nodo histórico, verifica que la ciudad no tiene georreferencia y que el grafo narrativo conserva Market Row/Plaza ↔ Harbor Walk. Regenera el JSON esperado de forma exacta y **rechaza cualquier** modificación que invente edificios, autorizaciones, cambios de coordenadas, ausencia de requisitos o `canNavigate:true`.

El API **`assessSection04AdmissionClaim`** permite inspeccionar un futuro borrador de evidencia y devuelve los requisitos que faltan por sección; pero **nunca** confiere autorización física automáticamente. Incluso si un solicitante rellena todos los campos con cadenas que alegan «verificado», seguirá devolviendo `sourceProofValidated:false`, `certifiedPhysicalAccess:false` y `admission: BLOCKED_NOT_EDITORIALLY_REVIEWED`. Para cualquier aprobación real hace falta un flujo separado que vuelva a leer pruebas independientes, compruebe derechos de paso y obtenga revisión editorial.

El [SVG de M2/M3/P2](MERIDIAN_BAY_SECTION04_MIDDLE_READINESS_20261122.svg) muestra exclusivamente las **cinco líneas heredadas** (M1/P1 en gris, M2/M3/P2 como interrogantes), ventanas de búsqueda deducidas de los puntos fuente y avisos explícitos **NO CANÓNICO**. No se fabricaron calles ni edificios. Se regenera exclusivamente con `node tools/meridian_section04_middle_readiness.mjs --write`; importar o inspeccionar el módulo no escribe.

[`tests/meridian_section04_middle_readiness.test.mjs`](../../tests/meridian_section04_middle_readiness.test.mjs) agrega **20 pruebas**: identidad de cinco fuentes Git, filiación de nodos, tres empalmes, clipping de P2, 18 requisitos desconocidos, revisiones falsas, aislamiento del guardado, reproducción byte a byte del SVG y correspondencia de cada vértice.

## Coordinación con trabajo paralelo

Las PR #126 y #136 investigan requisitos históricos de salida M1/P1 sobre una **rama hermana**; la PR #140 propone un estudio distinto del acceso Crosswater sobre **otra pila**. Estos expedientes **no** se han fusionado ni copiado; sus opciones de vía física no se convierten aquí en decisiones de propietario. Una integración futura debe comparar explícitamente los documentos y resolver cualquier duplicidad de índices, geometría o restricciones.

## Siguiente incremento

1. **Diseño físico candidato controlado de sección 04:** proponer, claramente como nuevo diseño, un primer trazado de parcelas y cruces para M2/P2/M3 que justifique cada decisión urbanística, mantenga fachadas conocidas y no presuponga portones industriales abiertos.
2. **Pruebas de empalmes y colisiones:** revisar geometría completa contra Land 03, Coast 01, M1/P1 y todas las alternativas Plaza–Harbor, con derechos de paso independientes de los trazos ilustrativos.
3. **Revisión del propietario y aceptación:** resolver cómo sería realmente la conexión pública hasta Harbor Walk, conservar canon y no crear conexiones en la partida por mera existencia de un dibujo.

**Criterio final:** los tres subtramos ya están localizados, trazados a sus fuentes y bloqueados contra admisión falsa, pero todavía **no existen como calles físicas aprobadas**. El juego, CH-000 turno 9, cinco archivos de guardado y acciones de Jack/NPC siguen intactos.
