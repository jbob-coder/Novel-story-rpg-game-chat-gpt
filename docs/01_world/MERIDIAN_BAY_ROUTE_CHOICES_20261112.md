# Meridian Bay — rutas solicitadas y estimaciones prudentes (D-060, borrador)

**2026-11-12 · Rama aislada:** `work/meridian-bay-route-choices-20261112` (hija de `work/meridian-bay-walk-slice-20261112`). La narración sigue a cargo de ChatGPT; este código **no** ejecuta un turno ni desplaza a Jack.

## Cambio acotado

`previewMeridianBayWalk({state,destinationId,waypoints})` ahora acepta hasta ocho puntos de paso opcionales, **en el orden solicitado**, para no sustituir la intención del lector por la ruta más corta. Sin `waypoints` preserva la ruta previa. Cada tramo se compone solo de enlaces reales del grafo guardado; un punto inexistente devuelve `status: 'unreachable'` y ninguna actividad ni encuentro fabricados. Los `CITY-*` no sirven como atajos. El resultado incluye copia de los puntos pedidos, pero sigue siendo `narrator_private_proposal`.

Ejemplo exclusivamente **hipotético**: taller Wilson → hogar → Railgarden → Market Row → Harbor Walk → Crosswater Plaza al usar `waypoints: ['LOC-HARBOR-WALK']`. No se afirma que Jack caminó por allí. Se conserva el retorno por Market Row cuando el itinerario atraviesa Café Bruma antes de Harbor Walk; el sistema no dibuja una calle nueva.

## Tiempo narrativo y autonomía

Los minutos aproximados se proporcionan solamente cuando **todos** los enlaces de la ruta disponen de una referencia blanda ya anotada. Si se pasa por Harbor Walk o Café Bruma, `estimatedWalkingMinutes: null`: un tiempo desconocido no es cero ni se rellena por proximidad visual. Las paradas, tráfico, conversaciones y accesos interiores requieren observaciones específicas; un cálculo previo jamás adelanta el reloj. Todas las actividades siguen opcionales y cualquier NPC en el checkpoint es únicamente candidato, no encuentro ni desplazamiento confirmado.

Antes de usar un itinerario para la novela, recuperar el checkpoint auténtico, esperar una acción libre de Jack, elaborar la escena desde su perspectiva y, tras completarla, guardar y releer los cinco archivos canónicos con diario remoto conforme a D-028 y D-052. Ningún turno 10 se ha escrito durante este cambio.

## Pruebas previstas y seguridad de integración

Se agregan cuatro pruebas de ruta por Harbor Walk, varios puntos con retorno por Market Row, punto no mapeado e inputs inválidos; ejecutarlas junto a la suite completa y comprobar inalterados los cinco archivos del checkpoint. La PR debe mantener como base la rama del recorrido (PR #16), **no** `main`, hasta revisar dependencias. No fusionar sin aprobación. El código no se integra todavía con las rutinas paralelas de los NPC ni los servicios cívicos; quedan por revisión.
