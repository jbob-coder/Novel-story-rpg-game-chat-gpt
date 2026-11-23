# Corrección delimitada — identidad de NPC con nombre completo repetido

**Fuente de verdad:** `work/chat-narrative-foundation` @ `0dc8f96fef5c0e2b49b4a16413e2010ab41b3f43` (la rama autorizada antes del cambio). Esta reparación preserva el motor exclusivo de novela interactiva con ChatGPT. No crea NPC, añade una base de datos ni genera acciones.

## Inconsistencia comprobable

El selector privado de memoria `selectNPCMemoryCandidates` ya rechazaba nombres de pila compartidos, pero consideraba un nombre completo siempre concluyente. Con dos NPC llamados *Rosa Wilson* (escenario sintético de QA), la consulta `Rosa Wilson` seleccionaba las identidades de ambos aunque el texto no permite distinguirlos. La advertencia `npcAmbiguities` tampoco aparecía porque las palabras del nombre estaban completas. El motor podía así recuperar recuerdos privados de personajes equivocados sin indicar la ambigüedad.

## Corrección

- Un nombre completo solo cuenta como selector inequívoco si aparece en un único NPC establecido; se conservan las selecciones por ID estable, pista explícita de escena y presencia guardada. Esto no afirma que haya ocurrido un encuentro.
- Si dos o más NPC comparten exactamente el nombre completo mencionado, el paquete de narrador devuelve una advertencia `requires_explicit_identity` con las identidades candidatas, sin elegir una por el nombre. Los lectores no reciben candidatos ni recuerdos privados.
- Los nombres no relacionados se siguen resolviendo como antes, y los antecedentes de nombres de pila repetidos siguen cubiertos por las comprobaciones previas. Los rumores, relaciones y hechos de NPC no cambian: las memorias siguen procediendo del estado y los eventos originales.

## Pruebas y límites

Dos pruebas sintéticas comprueban un nombre idéntico, la selección por ID concreto, las pistas de escena, privacidad y que personajes no relacionados no queden bloqueados. La solución es un cambio de recuperación, no una restricción al abanico de acciones de los NPC.

Se deben ejecutar JavaScript completo, Python y validador de la partida sobre el commit exacto; verificar 5 blobs originales e inventario. No fusionar `main`, ni iniciar CH-000 turno 10. Mantener separado el trabajo concurrente de contexto narrativo en PR #172: si se integra, reconciliar manualmente `tools/context_manager.mjs` para no perder ninguna de las dos mejoras.
