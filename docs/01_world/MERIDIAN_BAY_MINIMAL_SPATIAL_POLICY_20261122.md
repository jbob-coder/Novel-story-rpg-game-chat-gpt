# D-062 — Mapa mínimo funcional y expansión por eventos

**Decisión del propietario: APROBADA (2026-11-22).** Política aplicable a Meridian Bay y futuras localizaciones de Living Superhuman World. No crea calles, escenas ni hechos nuevos de la partida.

## Objetivo y prioridad

El mapa debe permitir que Jack y los NPC se orienten, caminen por conexiones establecidas, lleguen a lugares y produzcan interacciones y consecuencias coherentes. **No se exige describir edificios, fachadas, interiores, mobiliario, formas, parcelas, dimensiones ni geometría de calles.**

Esta decisión prevalece sobre los requisitos de detalle exhaustivo en PRs y estudios cartográficos provisionales. No reemplaza las fuentes de verdad: el estado guardado, los eventos verificados, la transcripción, los controles de acceso y las decisiones aprobadas.

## Datos mínimos de un lugar

- **Identidad:** un ID estable o referencia inequívoca de un sitio existente. Registrar una ubicación nueva mediante el proceso de admisión correspondiente, sin fabricar un evento del jugador.
- **Área:** barrio, distrito o contenedor conocido; ubicación aproximada únicamente cuando resulte útil y sustentada. No exigir dirección ni coordenada.
- **Conexiones:** enlaces establecidos para razonar sobre desplazamientos. La proximidad no crea calles ni una conexión garantiza acceso privado, apertura comercial o trayecto libre de obstáculos.
- **Función:** el propósito general del lugar y las interacciones plausibles, sin deducir que haya personal, inventario, atención disponible o un evento ocurrido.
- **Conocimiento:** separar existencia del lugar, descubrimiento por un actor, llegada real, condiciones de acceso y hechos privados.

**Un lugar puede existir y participar en eventos sin ninguna descripción visual.** Los campos no establecidos quedan ausentes, nulos o explícitamente desconocidos; no inventar valores predeterminados para completarlos.

## Expansión progresiva y acciones

1. Antes de describir o ejecutar un desplazamiento, consultar la topología admitida, la localización real, el estado y conocimiento del actor y las condiciones de acceso.
2. Si el mínimo basta para una interacción, **no** agregar información arquitectónica ni ampliar todo el distrito.
3. Si una acción necesita un dato material (obstáculo, punto de encuentro, acceso, relación espacial), establecer **solo ese dato** mediante la revisión y el proceso válido. Separar hipótesis de hechos y de percepciones de personajes.
4. Persistir los detalles nuevos que sí se vuelvan hechos mediante los mecanismos existentes de ubicaciones, estados y eventos, con origen rastreable. La prosa incidental por sí sola no fija nuevos caminos, medidas ni accesos.
5. Los NPC pueden considerar objetivos y actos abiertos en los lugares existentes. Una función comercial o sanitaria **no** demuestra servicio disponible ni éxito automático. Ninguna propuesta ejecuta un turno por sí misma.
6. No mover a Jack, hacer actuar personajes ni avanzar el capítulo por redactar documentación. Los movimientos y consecuencias canónicas requieren acciones narrativas válidas y guardado verificado.

**Ejemplo, no ocurrido:** El centro de atención de Railgarden existe y está conectado con el barrio. Un NPC puede considerar ir allí sin conocer el edificio. No se presume que esté abierto, que haya médicos presentes ni cómo son sus habitaciones; una consulta concreta requiere su propia resolución.

## Orientación y escala

Por ahora, **norte arriba, sur abajo, oeste a la izquierda y este a la derecha**, con Railgarden relativamente hacia el oeste y Harbor Walk/bahía hacia el este o sureste, son referencias **provisionales**, no hechos cardinales aprobados.

El lienzo de planificación de **10 × 8 km** incluye posibles terrenos sin cartografiar y agua. **No** es la dimensión, superficie, perímetro, límite urbano ni escala oficial de Meridian Bay. La ubicación precisa de la costa, distancias y tiempos de ruta siguen sin establecerse.

## Base verificada al aprobar D-062

En el último estado narrativo comprobado existen **14 registros LOC, 14 enlaces entre lugares y un contenedor CITY**. Jack está en el taller familiar, CH-000, turno 9. Los estudios geométricos de PRs aún en borrador no alteran esa base sin admisión revisada.

**Control de integridad:** un refinamiento futuro debe conservar IDs y conexiones existentes salvo migración justificada y probada, respetar límites de conocimiento y privacidad, mantener el inventario único y no alterar los cinco archivos canónicos del guardado sin una acción auténtica.

Referencias: [estado guardado](../../game/STATE.json), [decisiones](../DECISIONS.md), [admisión y estado mutable](WORLD_ADMISSION_AND_LOCATION_STATE.md), [lienzo provisional](MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json).
