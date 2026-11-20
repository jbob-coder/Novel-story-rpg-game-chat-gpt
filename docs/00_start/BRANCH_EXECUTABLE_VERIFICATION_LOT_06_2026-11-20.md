# Lote 06 — Verificación ejecutable de inventario histórico y conflictos cartográficos

**Fecha:** 2026-11-20. **Estado:** implementación de QA documental reproducible; **no** integración de código histórico ni avance de narración.

## Evidencia de entrada fijada por commit y blob SHA

- Referencia de `main`: `019175c6463ff31807a0f7013d91299add94913c`; blob de `game/STATE.json`: `3f4e9c98a7211068faefd31d0a0acbd4260ef589`. Cinco blobs canónicos verificados por firma **Git blob SHA-1 de su contenido**. No basta el texto de un documento para demostrar equivalencia del save.
- `docs/00_start/INVENTARIO_RAMAS_2026-11-19.json` (108 entradas), nueve archivos `branch_checks/LOT_01..09.json` (12 árboles completos cada uno) y `BRANCH_LIVE_VERIFICATION_2026-11-20.json` (113 entradas: 108 originales + cinco nuevas). Los árboles históricos se usan **solo** para 106 ramas cuyo HEAD no cambió.
- `BRANCH_GEOMETRY_CANDIDATES_2026-11-20.json`: seis trazados históricos #40/#52, #42/#56, #44/#58 con nombres de rama, archivo origen, SHA completo de commit, SHA del blob original y puntos de diseño extraídos de los JSON del repositorio. Contiene **evidencia congelada**, no una ruta añadida a `STATE.json`.

## Pruebas ejecutables añadidas

La suite `tests/branch_audit_integrity.test.mjs` comprueba siete contratos independientes:

1. Presencia exacta y unicidad de las 108 fichas históricas y cinco nuevas, incluidos los seis grupos por tipo.
2. Integridad estructural de los nueve lotes originales y trazabilidad de árboles Git por SHA, distinguiendo los dos HEAD que avanzaron.
3. Reconciliación de **26 rutas de herramientas** y **32 rutas de pruebas** ausentes respecto al `main` congelado, además de comparaciones canónicas para los 106 HEAD no modificados.
4. Relación simétrica entre alias del mismo commit, sin contar ramas QA como funcionalidades independientes.
5. Comprobación de **los cinco blobs reales de la partida** contra el checkpoint; no se reescriben JSON, eventos ni capítulos.
6. #40/#52 y #42/#56 son duplicados geométricos **por puntos**, aunque sus archivos y contratos son distintos; #44/#58 comparten extremos pero tienen distinto número y recorrido de puntos interiores.
7. Los tres enlaces del grafo que sustentan los seis diseños existen en ambas direcciones; los cinco servicios de la admisión ya figuran como `public_confirmed`, con `opening_hours: null` y `travel_minutes: null`. Esto **no** confirma que estén abiertos ni calcula tiempo de traslado.

## Riesgos y decisión conservadora

**No resolver #44 contra #58 por capricho.** #58 es el candidato inicial que merece inspección adicional, por su mayor detalle, pero ni una lista de waypoints ni una suite histórica certifican costuras físicas, cruces, alturas, edificios o visibilidad portuaria. No fusionar ambos itinerarios. El resultado del test solo clasifica el conflicto y conserva la conexión del grafo vigente.

**No ejecutar módulos antiguos en una partida viva.** Las pruebas nuevas verifican los registros *congelados* y el checkpoint moderno; **no** ejecutan `tools/meridian_bay_market_harbor_direct.mjs`, `tools/meridian_bay_market_harbor_corridor.mjs` ni otros módulos históricos bajo el estado nuevo. La ejecución de esas fuentes es una tarea posterior en un branch de implementación aislado. No marcar como funcionalmente certificadas las ramas históricas por superar esta suite.

**No editar datos históricos para que pase el test:** si una rama añade pruebas después, el informe debe quedarse anclado al HEAD de 2026-11-20 y un reporte posterior debe registrar las novedades sin reescribir las evidencias originales.

## QA y siguiente tarea

La nueva suite debe pasar en GitHub Actions junto a Node, Python y el validador de partida, en el **mismo commit** de esta PR; registrar el run ID/conclusión exactos en la descripción de la PR. Si falla, corregir el supuesto y volver a verificar. **No atribuir éxito hasta consultar la corrida.**

Siguiente implementación posible: portar **un solo** validador de acceso a sitio ya admitido (sin cambiar los locales ni añadir tiempo), con pruebas independientes de fuente y de estado actual. Mantener PR #83 para QA/documentación y otra PR para cambios de motor.
