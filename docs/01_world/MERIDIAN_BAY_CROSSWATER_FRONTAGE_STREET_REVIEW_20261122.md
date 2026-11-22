# Meridian Bay — estudio de frentes, aceras y cruces Crosswater (2026-11-22)

**Naturaleza:** ingeniería original y reversible, sin aprobación editorial ni incorporación al mapa del juego. Todas las geometrías nuevas son **hipótesis esquemáticas**, no hechos del mundo, parcelas registradas, aceras construidas ni cruces peatonales instalados.

## Base verificada y genealogía de revisiones

El estudio está en una rama independiente sobre [PR #140](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/140), commit fuente `190cff8a4eb1d3bdb9a8e44a76b57255fe91e245`. Sus dependencias son PR #130 → #114 → #106 → #101 → #94 → #87 → #86. La propuesta hermana #103 permanece intacta. **No fusionar aisladamente con main.**

Se verifica la identidad Git exacta del fragmento anterior `MERIDIAN_BAY_CROSSWATER_APPROACH_PROVISIONAL_FRAGMENT_20261122.json` (blob `b411fe76cef5c87237805725feb2b425acefc785`), el plan de escala de ciudad (`2e8c5ff412436a6e7d526bc0172adfca77107263`), Land 03 (`2a95eb9e50f69436cb65711daf8ff586f4ef4279`) y Coast 01 (`7cb79b2113bfef7b7fbbc39539c17fd80a275cd7`). La cadena heredada también comprueba los seis orígenes históricos de las alternativas. **Ninguno se reescribe.**

## Plano provisional de revisión

El nuevo JSON `MERIDIAN_BAY_CROSSWATER_FRONTAGE_STREET_STUDY_20261122.json` define dos parámetros inventados **solo para el dibujo técnico**: semiancho de franja central **0.12** unidades de lienzo y límite exterior de inspección de fachada **0.45** unidades de lienzo. No existe conversión a metros. Son variables para visualizar y encontrar conflictos, **no una especificación de anchura peatonal ni servidumbre de paso**.

Sobre el tramo común del borrador Plaza `(65,42) → (66.9,40.6)` se generan tres polígonos ilustrativos: una banda simétrica centrada en la línea, una banda lateral izquierda y otra derecha para investigar fachadas y parcelas. No son parcelas, no adjudican suelo ni sustituyen vías; la herramienta no crea un objeto del juego. Las bandas laterales son **áreas donde falta evidencia**, no afirmaciones de que allí haya negocios o muros.

Las dos salidas siguen separadas: **PR #106 A** hacia el límite del estudio Coast 01 `(68,39.948148)`, y **PR #103** hacia `(68,38.635714)`. Cada salida recibe solo una banda esquemática de revisión de ancho idéntico. No se modifica su centro de línea ni se escoge una alternativa.

### Dos marcadores de estudio, cero cruces certificados

**Plaza:** referencia existente `(65,42)`. El marcador sirve para inspeccionar la unión de las propuestas de calles `MX-A-MARKET-PLAZA` y `MX-A-PLAZA-TERM`, que únicamente comparten ese punto de referencia en los bocetos. No demuestra que haya paso cebra, pavimento, carriles o semáforos.

**Terminal:** se proyecta perpendicularmente el punto aproximado de Transit Terminal `(66,42)` sobre el segmento común; el resultado derivado es aproximadamente **`(65.648115,41.522442)`**, con separación gráfica de **0.593199** unidades. Este marcador indica dónde revisar el acceso, **no la ubicación de una puerta, cruce de tránsito ni una orden para construirlo**.

## Evidencia y límites

Se mantienen cinco verificaciones físicas pendientes: (1) límites reales de lotes y carácter público/privado de la franja; (2) muros, edificios y puertas; (3) aceras, pendientes y ancho accesible; (4) tráfico, cruces y entradas del terminal; y (5) transición del paseo público hacia espacios de uso restringido del puerto. Todos sus campos de geometría física son `null` y `confirmed=false`.

El código compara las bandas de centro de línea con las **huellas candidatas dibujadas** en Land 03 y Coast 01. Detectar separación positiva en esas huellas **solo comprueba la coherencia del boceto**; no garantiza que el terreno físico esté libre ni que existan aceras. Las otras regiones, sus edificios aún no diseñados y derechos de paso continúan sin evaluar.

**No se admite:** el estado del jugador o NPC, narración, tiempo ficticio, nuevas ubicaciones, conexiones de grafo, permisos de circulación, seguridad vial, apertura de negocios, minutos de viaje o anchuras físicas.

## Contrato de implementación

- `tools/meridian_bay_crosswater_frontage_study.mjs` lee las fuentes fijas, comprueba el contenido del manifiesto y el grafo previo, genera bandas y marcadores en memoria, rechaza afirmaciones de geometría física no documentada y devuelve resultados clonados; no escribe archivos al importar ni durante la inspección.
- `tests/meridian_bay_crosswater_frontage_study.test.mjs` agrega **15 casos**, entre ellos procedencia por blob, integridad de variantes, área/offset de los polígonos, proyección al terminal, fuente de cruces y pruebas de alteración maliciosa del JSON, el grafo y la partida.
- Se requiere CI completo sobre el **HEAD exacto** (JavaScript, Python, validador de checkpoint), inventario reconciliado, protección de los cinco blobs narrativos y comparación con `main` antes de dar por validada la entrega.

## Próxima decisión de diseño

Elegir, documentar y comprobar **en una nueva rama separada** una configuración original de parcelación, aceras y conexiones peatonales **con dimensiones físicas justificadas**, criterios de accesibilidad y revisión de fachadas. No debe confundirse el semiancho gráfico 0.12 con una medida de construcción. Primero se obtienen o aprueban reglas de escala y acceso; solo después se podrá tratar una alternativa como mapa físico del juego.
