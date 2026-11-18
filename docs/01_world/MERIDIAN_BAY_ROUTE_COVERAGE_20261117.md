# Meridian Bay — cobertura cartográfica por enlace, 2026-11-17

## Criterio verificable

El [grafo preparado de Fase 1](MERIDIAN_BAY_PHASE1.md) contiene **14 enlaces bidireccionales** entre **14 ubicaciones**. Un enlace es interior (taller Wilson ↔ hogar Wilson), no calle. Por tanto existen **13 enlaces exteriores conocidos** a detallar. No son 13 calles reales, ni agotan la ciudad.

**Cobertura de la cadena secuencial de borradores:** 8/13 enlaces exteriores, **61,5 %**, incluyendo la sección clínica presente en esta rama **pendiente de QA** al escribir este registro. Enlace detallado significa que están descritos los puntos y el área entre los extremos, no que la geometría sea definitiva ni que el enlace exista en el guardado jugable.

| # | Enlace exterior conocido | Sección detallada en esta cadena | Estado |
|---|---|---|---|
| 1 | Railgarden ↔ Market Row | [sección 1](MERIDIAN_BAY_RAILGARDEN_MARKET_CORRIDOR_DETAIL.md) | draft, QA previa |
| 2 | Market Row ↔ Crosswater Plaza | [sección 2](MERIDIAN_BAY_MARKET_CROSSWATER_CORRIDOR_DETAIL.md) | draft, QA previa |
| 3 | Crosswater Plaza ↔ terminal | [sección 3](MERIDIAN_BAY_PLAZA_TERMINAL_DETAIL.md) | draft, QA previa |
| 4 | Crosswater Plaza ↔ Harbor Walk | [sección 4](MERIDIAN_BAY_PLAZA_HARBOR_CORRIDOR_DETAIL.md) | draft, QA previa |
| 5 | Market Row ↔ Harbor Walk (directo) | [sección 5](MERIDIAN_BAY_MARKET_HARBOR_CORRIDOR_DETAIL.md) | draft, QA previa |
| 6 | Hogar Wilson ↔ Railgarden | [sección 6](MERIDIAN_BAY_WILSON_RAILGARDEN_DETAIL.md) | draft, QA previa |
| 7 | Railgarden ↔ abarrotes | [sección 7](MERIDIAN_BAY_RAILGARDEN_GROCERY_DETAIL.md) | draft, QA previa |
| 8 | Railgarden ↔ centro de salud | [sección 8](MERIDIAN_BAY_RAILGARDEN_CLINIC_DETAIL.md) | draft, QA en esta rama |
| 9 | Market Row ↔ Café Bruma | — | requiere detalle |
| 10 | Market Row ↔ local de Noah | — | requiere detalle |
| 11 | Market Row ↔ punto de recepción | — | requiere incorporar/revisar el borrador externo |
| 12 | Market Row ↔ pasaje creativo | — | requiere incorporar/revisar el borrador externo |
| 13 | Market Row ↔ galería de servicios | — | requiere incorporar/revisar el borrador externo |

**No confundir:** existen PR externos para algunos frentes de Market Row (#46, #48, #50), pero no forman parte de esta cadena de dependencias, por lo que no se suman sin contrastar sus bases, pruebas y cambios.

## Cuándo avisar que «la mayor parte del mapa» está construida

El indicador 8/13 mide **cobertura de enlaces ya conocidos**, NO el porcentaje de superficie urbana o un mapa físico jugable. Las áreas de reserva oeste, norte, sur y bahía, la red secundaria, edificios, cruces, anchos de calles y accesibilidad no están definidos. Con los datos actuales, **el porcentaje construido de toda Meridian Bay es no medible**.

Una alerta de «mayor parte del mapa construida» requiere **antes**:
1. Definir perímetro de la entrega (por ejemplo, núcleo urbano de Fase 1 frente a toda la ciudad).
2. Tener más de la mitad de ese perímetro dividido en secciones físicas con conexiones y espacio intermedio detallados, no solo topología.
3. Validar la continuidad, calles, cruces, accesos y bloques de cada sección, más una revisión integral de coherencia espacial.
4. Mantener todo en borrador hasta autorización de integración y conservar los cinco archivos del guardado.

No se garantiza un aviso automático por editar este documento; el progreso debe recalcularse y notificarse al revisar el repositorio en una siguiente ejecución autorizada.

## Siguiente operación

Completar Market Row ↔ local de Noah (enlace del catálogo `LOC-MARKET-NOAH-REPAIR`), luego abordar las demás fachadas una por una. No adelantar el capítulo ni sustituir los diseños físicos por porcentajes de cobertura de grafo.
