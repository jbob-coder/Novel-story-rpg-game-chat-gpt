# Flujo de escenas continuas — Living Superhuman World
**Decisión del propietario:** 2026-11-12. **Estado:** propuesta editorial en rama aislada, pendiente de integrar. **No se juega el turno 10.**

## Objetivo y corrección
En vez del ciclo rígido «una orden → un pequeño evento → otra orden obligatoria», permitir «una decisión sustancial del lector → una secuencia coherente de acontecimientos y respuestas del mundo → un resultado o una pausa que verdaderamente necesita una nueva decisión». La experiencia sigue siendo una **novela interactiva narrada por ChatGPT**, no un videojuego o simulador ejecutándose en segundo plano.

## Flujo obligatorio al ejecutar una acción real
1. **Recuperar hechos existentes:** checkpoint, manifiesto, ubicación y conexiones, entidades ya establecidas, NPC presentes realmente o potenciales, conocimiento de Jack, eventos y compromisos relevantes. No confundir el atlas esquemático con tiendas/interiores ya existentes ni dar por realizados eventos offscreen.
2. **Delimitar intención:** reconocer lo que el lector sí ordenó (destino, finalidad, posibles frases exactas, límites). Los pasos instrumentales razonables de esa misma acción se pueden narrar sin microconfirmación; las nuevas elecciones de Jack no.
3. **Desarrollar la escena, no resumirla:** varias respuestas y actos de terceros pueden seguirse causalmente; dar tiempo a actividades, conversaciones, interrupciones y resolución sin convertir cada gesto en una pregunta al usuario.
4. **Resolver con características cualitativas:** experiencias, recursos, personalidad, metas, necesidades, deberes, conocimiento y relaciones de los NPC. La reacción no es una garantía ni depende de estadísticas, XP, tiradas o probabilidades visibles. La incertidumbre real se preserva.
5. **Pausar solo cuando haya agencia real:** si Jack debe responder una pregunta decisiva, pagar/aceptar términos, cambiar destino, asumir un riesgo, elegir violencia, intervenir en conflicto o revelar algo; o si el lector pide detener. También frenar ante bloqueo del guardado. Una pausa cotidiana natural al terminar una tarea es válida sin fabricar una elección.
6. **Registrar las consecuencias:** el tiempo de ficción progresa únicamente con los acontecimientos completados por la acción autorizada. Los resultados materiales o de NPC se registran con fuentes y eventos; lo privado permanece privado para Jack hasta que lo conozca. Preparar, revisar, guardar atómicamente los cinco archivos canónicos con diario obligatorio y releer antes de entregar el turno literario.

## Qué puede prolongarse sin otro input
- Un NPC que revisa su propio inventario, consulta una nota, recuerda un compromiso o recibe una interrupción ordinaria, siempre que esos hechos sean plausibles y no requieran consentimiento de Jack.
- Una sucesión de actividades del lugar y de varios NPC relacionadas con la acción elegida, siempre dentro de su conocimiento, ubicación, recursos y metas.
- Transiciones, esperas breves, pausas, movimientos ordinarios necesarios para la acción ya ordenada y consecuencias naturales de esa misma acción.

## Qué no puede decidir el narrador
- La respuesta verbal o por collar de Jack, qué piensa, siente o acepta, nuevas compras, compromisos, objetivos, tratos, ilegalidades o riesgos voluntarios no especificados.
- Que un NPC estaba presente, completó una tarea o conocía un secreto solo porque una propuesta de rutina, un mapa o una coincidencia lo sugería.
- Un calendario horario exacto o la duración de viaje ausente en los datos; un estimado sirve como referencia, no como reloj automático.
- Un nuevo evento narrativo mientras el usuario no está dando una acción de juego. «Sigue trabajando» significa mantener documentación/herramientas, no avanzar a Jack.

## Ejemplo ilustrativo — NO CANON
**Supuesto del ejemplo:** en una versión futura ya está establecida una tienda de componentes en Market Row, con personal y existencias verificadas. No se afirma que ese comercio exista ahora.

**Input:** «Jack va a esa tienda para consultar si tienen una pieza compatible con Aster».

**Desarrollo correcto:** el trayecto se narra de acuerdo con el mapa, el personal intenta localizar la referencia, tiene que atender una interrupción cotidiana, otro empleado hace una consulta, y se determina si la pieza está disponible, si hay una alternativa o si existe una espera razonable. Los NPC actúan según sus propios compromisos y carácter; ninguno sabe detalles privados de Aster sin una vía de conocimiento. La escena puede avanzar hasta que el personal indique «Hay dos alternativas, con condiciones distintas». Allí se detiene si Jack debe escoger, sin elegir por él. Si solamente se pidió **consultar** y se obtiene la información, puede cerrarse naturalmente sin exigir otra decisión.

**Mal desarrollo:** «Jack llega, alguien pregunta algo, el narrador se detiene inmediatamente y exige una opción», o «Jack acepta un precio, explica sus secretos y compra automáticamente».

## Correcciones del lector
- **Propuesta de mundo o regla:** actualizar primero la ficha o documento de autoridad correspondiente, conservando fuente y naturaleza de la información (canon aprobado, conocimiento de Jack, hipótesis, noticia, rumor). No volverla automáticamente evento ya sucedido.
- **Corrección de una escena no guardada:** modificar el borrador y volver a revisar.
- **Corrección de una escena jugada y guardada:** aplicar solamente la revisión explícita D-033, preservando el original y su evidencia en `chapters/revisions`, sin fabricar un turno adicional.
- **Intervención en una escena en curso:** la siguiente acción libre del lector define la nueva dirección, sin presumir elecciones anteriores que todavía no ocurrieron.

## Integración y verificación pendiente
Esta documentación amplía `docs/NARRATIVE_CONTRACT.md` y `docs/SCENE_CRAFT.md`; no altera motores, mapa, guardado o personajes. Para probarla en juego falta una **acción auténtica** del lector y la validación editorial y de cinco archivos antes de presentar ese turno. Las herramientas que proponen rutinas, contactos o tiempos no ejecutan la narración por sí solas. Antes de integrar con PRs paralelas revisar dependencias y cambios de otros agentes. Ninguna guía elimina la puerta D-028/D-052.
