# Meridian Bay — Railgarden → centro de atención (detalle local 8)

**Estado:** Borrador cartográfico independiente; no canon activado. Esta sección únicamente detalla el tramo previamente propuesto `MB-WEB-004` desde `LOC-RAILGARDEN-RESIDENTIAL` hasta `LOC-RAILGARDEN-CLINIC`. La clínica es una instalación **preautorizada en el catálogo de diseño** y aún no consta en el checkpoint jugable.

## Enlace, después espacio intermedio

```text
Railgarden (N0, 48.00/44.00) -- L1 -- transición residencial (N1, 48.55/44.28)
    -- L2 -- centro de atención (N2, 49.00/44.80)
```

**L1 — salida desde el barrio:** Transición propuesta desde viviendas comunes de Railgarden hacia un frente comunitario. Lado A: parcelas residenciales sin ocupantes ni límites asignados. Lado B: borde del barrio sin nuevas instituciones o cruces inventados. La continuidad peatonal es una intención de diseño; no se ha inspeccionado acera, pendiente ni cruce.

**L2 — llegada al centro:** Conexión de referencia hasta el frente de un centro sanitario de proximidad. Lado A: edificio público propuesto sin puerta, rampa, ventana ni planta exactas. Lado B: contexto vecinal sin pacientes, médicos, automóviles ni actividad adjudicados. La posibilidad de acceso del catálogo no demuestra servicio disponible, horario, atención de urgencias o entrada físicamente accesible.

Las tres posiciones reproducen **sin cambios** los dos anclajes del plano general y el punto intermedio del tramo inicial. Los dos subtramos son reversibles dentro del **borrador de diseño**, pero no constituyen nuevas localizaciones canónicas, caminos habilitados, tiempos de viaje ni rutas aprobadas para el jugador.

## Separación de conceptos

- La conexión vecinal entre Railgarden y la clínica existe en el catálogo de diseño, **no** en el estado jugable.
- `LOC-RAILGARDEN-ABARROTES`, el hogar Wilson y su taller conservan sus enlaces originales: no sirven de atajos hacia la clínica.
- No se inventan servicios, personal, horarios, descubrimientos, visitas, movimientos de NPC, encuentros ni avance temporal.
- Ancho de vía, senderos, bordillos, rampas, cruces, accesos de vehículos, huellas de edificios y tiempos quedan **sin verificar**.

**Fuentes y artefactos:** [catálogo](MERIDIAN_BAY_PREBUILT_DESIGN.json), [red inicial](MERIDIAN_BAY_ROAD_WEB_SLICE1_20261116.json), [plano base](MERIDIAN_BAY_CITY_SCALE_PLAN_20261112.json), [datos de detalle](MERIDIAN_BAY_RAILGARDEN_CLINIC_DETAIL_20261117.json), [validador de solo lectura](../../tools/meridian_bay_railgarden_clinic_detail.mjs), [pruebas](../../tests/meridian_bay_railgarden_clinic_detail.test.mjs) y [cobertura de enlaces](MERIDIAN_BAY_ROUTE_COVERAGE_20261117.md).

**Condición para cerrar esta sección:** validación local o CI de pruebas JavaScript, Python y checkpoint, comprobación del alcance del cambio y de los cinco archivos de guardado. La prueba valida coherencia interna del diseño; no convierte los dibujos en calles inspeccionadas.

**Siguiente enlace independiente:** Market Row → taller de reparación y componentes de Noah. Completar el espacio intermedio antes de saltar a otro acceso. La auditoría de toda la ciudad se hará después de completar los tramos restantes.
