# 00 — Inicio y recuperación

- [Inicio obligatorio](../../AGENTS.md)
- [INDEX.md](../../INDEX.md)
- [Descripción del proyecto](../../README.md)
- [docs/HANDOFF.md](../HANDOFF.md)
- [docs/STATUS.md](../STATUS.md)
- [docs/PLAY_READINESS.md](../PLAY_READINESS.md)
- [Bloqueo de narración y porcentaje de guardado](../SAVE_BLOCKING_PROTOCOL.md)

**Regla:** este índice apunta a archivos originales. No crear copias divergentes ni mover documentos canónicos sin migración probada.

**Narración:** si falla cualquier paso del guardado, detener el avance y mostrar el porcentaje de etapas comprobadas. `CONTINUAR GUARDADO` en el siguiente mensaje solo recupera el intento, no mueve a Jack.

## Dated repository baseline (2026-11-17)

- [Full repository state and priorities](REPOSITORY_CHECKPOINT_2026-11-17.md)
- [Detailed area-by-area work and acceptance board](AREA_STATUS_AND_TASKS_2026-11-17.md)
- [Branch/PR and physical Meridian Bay map workstack](BRANCH_AND_MAP_WORKSTACK_2026-11-17.md)
- [Exact 129-file Git blob reference snapshot](REPOSITORY_FILE_SNAPSHOT_2026-11-17.json)

These records are source-linked developer observations, not new canon or a player turn.
- [Full independent snapshot/journal recheck and corrections](../06_quality/REPOSITORY_CHECKPOINT_INDEPENDENT_AUDIT_20261117.md)

## Guía y catálogo de ramas — 2026-11-19

- **[LEER PRIMERO: resumen de consolidación](LEER_PRIMERO_RAMAS_2026-11-19.md)**.
- [Las 108 ramas originales: PR, SHA, dependencia, siguiente acción](INVENTARIO_RAMAS_2026-11-19.md).
- [Inventario JSON de ramas y commits completos](INVENTARIO_RAMAS_2026-11-19.json).

Nueva rama documental fuera del recuento; registrar su HEAD por separado. La revisión es de metadatos, no un merge ni la auditoría de cada línea.

- [Seguimiento del desarrollo: para qué sirve cada sistema y qué falta](SEGUIMIENTO_DEL_DESARROLLO.md)

- [Auditoría de 108 ramas: archivos, 20 descripciones precisadas, HEAD compartidos](VERIFICACION_DESCRIPCIONES_2026-11-19.md)

- [Matriz de brechas de código para las 108 ramas (28 módulos / 34 suites ausentes por ruta)](BRANCH_SOURCE_GAP_MATRIX_2026-11-19.md)

- [Reconciliación del HEAD narrativo y nuevos faltantes](CURRENT_STATE_RECHECK_2026-11-20.md)

- [Consolidación efectiva de la base narrativa en main (PR #2)](MAIN_CONSOLIDATION_2026-11-20.md)

- **[Verificación en vivo de las 108 ramas originales y 5 nuevas (20-11-2026)](BRANCH_LIVE_VERIFICATION_2026-11-20.md)**.
- [Tabla estructurada por rama con HEAD, brechas por archivo y siguiente acción](BRANCH_LIVE_VERIFICATION_2026-11-20.json).
- [Lote 01: revisión de código y pruebas históricas de cuatro ramas NPC](BRANCH_FUNCTIONAL_AUDIT_LOT_01_2026-11-20.md).
- [Lote 02: revisión de seis ramas de vías, costa y fragmentos de Meridian Bay](BRANCH_FUNCTIONAL_AUDIT_LOT_02_2026-11-20.md).
- [Lote 03: 14 ramas de corredores y accesos, CI histórica y conflictos de geometría](BRANCH_FUNCTIONAL_AUDIT_LOT_03_2026-11-20.md).
- [Lote 04: 44 ramas QA, journal, backup y audit — reglas de custodia](BRANCH_CUSTODY_AUDIT_LOT_04_2026-11-20.md).
- [Lote 05: clasificación de las 39 ramas work restantes y cierre del inventario histórico](BRANCH_REMAINING_WORK_AUDIT_LOT_05_2026-11-20.md).

- [Lote 06: verificación ejecutable de inventario y conflictos de trazados](BRANCH_EXECUTABLE_VERIFICATION_LOT_06_2026-11-20.md).
- [Seis candidatos de geometría con commit, blob y coordenadas de origen](BRANCH_GEOMETRY_CANDIDATES_2026-11-20.json).
- **[Lote 07 (22-11-2026): seguimiento de PR #82–#88, custodia de seis fuentes y QA costera](BRANCH_FOLLOWUP_AUDIT_LOT_07_2026-11-22.md).**

- **[Lote 07 complementario: puertas de integración PR #82–#87 y CI](BRANCH_INTEGRATION_GATES_LOT_07_2026-11-22.md)**.
- [Matriz estructurada de integridad y dependencias](BRANCH_INTEGRATION_GATES_LOT_07_2026-11-22.json).

## Auditoría de dependencias — 2026-11-22

- [Lote 08: ficha de PR #88–#112, espejos QA, bases, CI y conflictos de integración](BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.md).
- [Matriz estructurada de ramas, SHA, diferencias y fuentes](BRANCH_STACK_TOPOLOGY_LOT_08_2026-11-22.json).
Estas son capturas fechadas, no autorización para fusionar o jugar.

## Seguimiento de ramas posteriores — 2026-11-22

- [Lote 09: PR #113–#123, QA alias, nueva revisión de #112 y procedencia en #122](BRANCH_FOLLOWUP_LOT_09_2026-11-22.md).
- [Matriz fechada de HEAD/base, cambios exclusivos y CI](BRANCH_FOLLOWUP_LOT_09_2026-11-22.json).
No implica merge, admisión física ni nuevo turno.

## Seguridad NPC y brechas de acceso — 2026-11-22

- [Lote 10: auditoría de las PR #126–#131, conocimiento NPC fijado y corredores sin certificación](BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.md).
- [Registro estructurado por PR, cabeza, CI y dependencias](BRANCH_SECURITY_AND_ACCESS_LOT_10_2026-11-22.json).
Las rutas son bocetos y el estado canónico permanece en CH-000 turno 9.

## Comparación de fuentes de acceso M1/P1 — 2026-11-22

- [Lote 11: PR #132 / #136, SVG, archivos históricos y bloqueos de paso](BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.md).
- [Registro por SHA, bases, CI y discrepancia documental](BRANCH_M1P1_COMPARISON_LOT_11_2026-11-22.json).
Sin nuevas calles aprobadas, ni turnos jugados.

## Auditoría transversal de NPC y accesos — 2026-11-22

- [Lote 12: migración de memoria NPC PR #138 y estudios Crosswater/M1/P1 #140, #142, #146](BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.md).
- [Matriz por SHA de origen, QA y bloqueos de integración](BRANCH_CROSS_FAMILY_LOT_12_2026-11-22.json).
No implica fusión ni continuidad narrativa.

## Cierre de chat — 2026-11-22 (solo ChatGPT)

- [Verificación final de PR #150/#152/#154, CI, integridad y prueba aislada de recuperación](BRANCH_CLOSEOUT_PR150_154_2026-11-22.md).
- [Matriz de SHA, CI, fuentes y cinco archivos protegidos](BRANCH_CLOSEOUT_PR150_154_2026-11-22.json).
- **[Entrega sin ampliaciones: estado, decisiones y reinicio en un chat nuevo](CHATGPT_ONLY_HANDOFF_2026-11-22.md).**
