# Living World — ejecución de pruebas (2026-11-10)

Rama: `work/living-world-design-review-20261110`. Módulo aislado; no integrado en la narración.

## Ejecución reproducible
- Motor: Node.js v22.16.0.
- Comando: `node --test tests/living_world_availability.test.mjs`.
- Primera ejecución (archivos del commit anterior): 12 pruebas, 12 PASS, 0 FAIL.
- Exploración adversarial manual adicional encontró dos defectos no cubiertos: `schedule.weekdays[...]=[null]` lanzaba TypeError, y `shortestRoute("LOC-UNKNOWN","LOC-UNKNOWN")` aceptaba una ubicación inexistente.
- Corrección: validar estructura de intervalos y extremos conocidos; usar parámetro `weekday` (0–6) en lugar de `day` para impedir confusión con el Día narrativo -29. Un día de semana desconocido responde UNKNOWN.
- Segunda ejecución tras las correcciones: **18 pruebas, 18 PASS, 0 FAIL**, 0 omitidas.
- Git blob SHA del archivo probado `tools/living_world_availability.mjs`: `0d87ebe336ff8aebacdc30345b497ac4d42e0abf`.
- Git blob SHA del archivo probado `tests/living_world_availability.test.mjs`: `aedc5d6aab7edb553da42a8ee86832d2a933bcee`.
- Las huellas locales `git hash-object` coincidieron con las SHA devueltas por los commits de GitHub. El resultado acredita **estas 18 pruebas del módulo aislado**, no la batería general de la novela ni una integración de motor.

## Pendiente / límites de diseño
- El calendario civil de Meridian Bay no está fijado: no se puede convertir Día -29 automáticamente en un `weekday`. Antes de usar agendas semanales, documentar una correspondencia civil aprobada y el significado exacto del índice 0–6.
- Los intervalos son de un solo día; horarios que cruzan medianoche, cierres temporales con vigencia y tiempos de trayecto aún no están implementados.
- Las excepciones `confirmed` deben suministrarse para la escena temporal correcta; su vigencia no es validada aún por el módulo.
- El módulo solo calcula posibilidades; no modifica el estado narrativo, acciones de NPC ni guardados.
- El trabajo de integración requerirá simulaciones aisladas, validadores completos, control editorial y revisión antes de fusionar ramas.
