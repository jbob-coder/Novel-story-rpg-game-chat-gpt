# Reconciliación de contexto narrativo — PR #172 + protección de identidad NPC

Revisión integrada sobre `work/chat-narrative-foundation` @ `3a6af19a43cf19e62ffa04d15c9081bc6d5ed5cf` con segundo padre original de la PR #172 @ `370518077a34fb9946643e0b325937dea02788e3`. No se modifica `main`, el journal ni los cinco archivos canónicos. Continúa el motor de novela interactiva de ChatGPT, sin ampliación de mecánicas.

## Conflicto que se resolvió

La PR #172 añadió lectura privada de THREAD ya guardados, búsqueda de hilos abiertos/resueltos, y sus EV originales. Su rama se basaba en una versión anterior a la corrección #174 del mismo `tools/context_manager.mjs`; fusionar el archivo completo de #172 habría restaurado la selección incorrecta de NPC con nombres completos duplicados y eliminado dos pruebas de esa corrección.

## Selección implementada

- Se parte de la versión **actual y autorizada** del motor; se aplican únicamente las adiciones de lectura de hilos de la PR #172 (índice narrador privado, ranking, `lastEventId` y resolución por referencia con historia EV de capítulos archivados).
- Se conservan íntegros los controles existentes: NPC no seleccionados por nombre completo duplicado, advertencias de identidad, evidencia literal por actor, privacidad y lectura remota verificada.
- Se preservan las tres pruebas de la PR #172 y las dos pruebas de #174. Una prueba cruzada confirma que las referencias privadas de THREAD siguen accesibles aunque `Rosa Wilson` sea un nombre duplicado, sin seleccionar memorias de las personas homónimas ni divulgar hilos al lector.
- El documento de contexto incorpora el apartado de recuperación de hilos de #172; los informes y datos canónicos de los agentes no se reescriben ni se infieren nuevos hechos.

## Límites de aceptación

Los campos `known_to` y `visibility: known` **no son autorización de divulgar al jugador**: los hilos siguen siendo solo contexto privado, los EV originales son la fuente y se exige revisión de información concreta. THREAD-000003 tiene una anotación histórica `known` no demostrada desde `EV-000011` para Jack; se conserva sin inventar una corrección de canon.

Los datos nuevos son índices derivados; ningún actor actúa por sí mismo al abrir una referencia. Tampoco se genera turno 10, noticia, mapa, capítulo, movimiento ni guardado. La aceptación exige la suite completa Node/Python y validador sobre el SHA **combinado**, además de comparar los cinco Git blobs protegidos e inventario real. Si cualquier prueba falla, no se integra en la rama narrativa.

PR #173 es un paquete de integración NPC independiente y de alcance mayor; queda sin tocar. La reconciliación de PR #172 no la aprueba ni mezcla.
