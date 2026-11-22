# Herramientas, validación y control

- [tools/turn_engine.mjs](turn_engine.mjs)
- [Motor de cambios causales de estado (D-040)](state_changes.mjs)
- [tools/narrative_archive.mjs](narrative_archive.mjs)
- [Read-only evidence-linked context index](context_manager.mjs)
- [Immutable remote context and journal gate](verified_context_loader.mjs)
- [tools/save_gate.mjs](save_gate.mjs)
- [Adaptador real GitHub REST de cinco archivos (D-043)](github_save_adapter.mjs)
- [Transacción de cinco archivos y recuperación (D-042)](save_transaction.mjs)
- [tools/validate_state.py](validate_state.py)
- [Bloqueo de narración y porcentaje de guardado](../docs/SAVE_BLOCKING_PROTOCOL.md)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

## Living World (propuesta, no canon)
- [Disponibilidad y conexiones](living_world_availability.mjs)
- [Rutinas y borradores autónomos](living_world_routines.mjs)
- [Coordinador de turnos revisados y guardado](living_world_coordinator.mjs)
- [Diagnóstico privado y proyección visible para Jack](living_world_diagnostics.mjs)
- [Estimaciones contextuales de viaje y presupuesto por actor](living_world_travel.mjs)
- [Historial global y archivos cerrados de capítulos](chapter_history.mjs)
- [Preparación y transición revisada de capítulos](chapter_management.mjs)
- [Planes condicionales de NPC y límites de información](world_plans.mjs)
- [Obligaciones causales reutilizadas de PR #10](living_world_obligations.mjs)
- [Necesidades cualitativas y decisiones observadas de NPC](living_world_needs.mjs)
- [Tareas de servicios establecidos y revisión histórica](meridian_bay_services.mjs)
- [Evidencia de integración](../docs/LIVING_WORLD_COORDINATOR_QA_20261110.md)
- [Catálogo y admisión explícita de Meridian Bay](meridian_bay_locations.mjs)
- [Admisión del mundo sin consumir un turno](world_admission.mjs)
- [Condiciones, cierres y horarios causales de lugares](location_state.mjs)
- [Observaciones y visitas con evidencia histórica](meridian_bay_discovery.mjs)
- [Integración de ciudad con turnos y guardado](meridian_bay_integration.mjs)
- [Rutas de la ciudad y puntos intermedios](meridian_bay_prebuilt_routes.mjs)
- [Canvas provisional de barrios y escala](meridian_bay_scale_plan.mjs)


## Current source index supplement — audited November 17, 2026

These files already existed in the authoritative source and are listed here for discoverability; indexing them is not a change to story state.

- [github_save_journal.mjs](github_save_journal.mjs) — Separate durable GitHub save-attempt journal (ready/blocked/verified).
- [living_world_availability.mjs](living_world_availability.mjs) — Time-aware service availability and route proposal, unknown defaults.
- [living_world_commitments.mjs](living_world_commitments.mjs) — Relevant NPC review and complete obligation deadline audit.
- [living_world_coordinator.mjs](living_world_coordinator.mjs) — Reviewed NPC/player turn coordinator with journal gate.
- [living_world_diagnostics.mjs](living_world_diagnostics.mjs) — Private/reader-safe Living World diagnostic projection.
- [living_world_routines.mjs](living_world_routines.mjs) — Independent NPC routine proposals and causal staging.
- [living_world_time.mjs](living_world_time.mjs) — Coarse in-fiction time window validation.
- [living_world_travel.mjs](living_world_travel.mjs) — Evidence-based travel estimates and context chronology.

- [Inspección privada de costa de Harbor Walk y control de cruces](meridian_bay_harbor_coast_review.mjs)

- [Generador determinista del SVG costero desde el JSON revisado](render_harbor_coast_svg.mjs)

- [Comparación de tres fragmentos y rutas históricas con blobs de origen](meridian_bay_three_region_seams.mjs)

- [Regenerate and verify PR #67 Coast01 candidate SVG without story writes](render_harbor_coast_pr67_candidate.mjs)

- [Auditoría y SVG reproducible de alternativas Market/Plaza–Harbor](meridian_bay_harbor_access_reconciliation.mjs)

- [Auditar longitudes de rutas dentro y fuera de las tres regiones físicas históricas](meridian_bay_harbor_region_coverage.mjs)
- [Sección 04: derivar y validar cinco tramos urbanos pendientes sin crear calles](meridian_harbor_section04_ledger.mjs)

- [Verificar evidencias M1/P1 desde STATE, historia y Land03 y regenerar SVG](meridian_section04_m1p1_entry_evidence.mjs)
