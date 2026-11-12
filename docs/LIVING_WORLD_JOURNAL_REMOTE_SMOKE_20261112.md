# QA remota aislada del journal — 2026-11-12

**Alcance:** prueba de primitivas GitHub Contents API mediante el conector autorizado, **no ejecución directa de `createGitHubSaveJournal` con un token externo**. No demuestra el flujo completo de un guardado real ni recuperación de un commit de cinco archivos.

## Aislamiento
- Rama del diario experimental: `journal/qa-living-world-smoke-20261112`.
- Identidad del intento exclusivamente sintético: `qa/living-world-journal-smoke-20261112`.
- Archivo: `.narrative-save-attempts/cWEvbGl2aW5nLXdvcmxkLWpvdXJuYWwtc21va2UtMjAyNjExMTI.json` (misma convención de base64url usada por el adaptador).
- Rama narrativa `work/chat-narrative-foundation`, `main`, diario reservado `journal/living-world-save-attempts` y los cinco archivos de continuidad **no modificados**.

## Operaciones verificadas remotamente
1. Creación de registro `status:'blocked'`, `percent:25`, sin `commitHead` ni `expectedFiles`: commit `9c73db02541123d6b7d1d45862c228d11b51259e`, blob `a1bbf34cc2f6b4aacbc7862018ac6d6f1c26921a`. Lectura posterior: JSON idéntico y branch identity correcta.
2. Actualización con SHA actual del blob a `status:'blocked'`, `percent:45`, motivo de interrupción sintética: commit `ef2337feaa1f7181c52ba3d56ecff5574982da29`, blob `5152fa2830360d7ef47e374ee06717319a49eda1`. Lectura independiente idéntica.
3. Escritura deliberadamente obsoleta con SHA `a1bbf34cc2f6b4aacbc7862018ac6d6f1c26921a`: GitHub rechazó **409 CONFLICT**. Lectura posterior confirmó que el registro continúa `blocked` / `45`, sin corrupción ni sustitución por `verified`.

## Interpretación
Las primitivas remotas necesarias para crear, actualizar, leer y proteger un registro ante una revisión obsoleta funcionaron en este ensayo. El adaptador JavaScript `tools/github_save_journal.mjs` mantiene pruebas unitarias con HTTP simulado; **no se ejecutó directamente con un token scoped**. No hubo escritura remota ni readback de cinco blobs de una narración nueva en esta prueba. `journal/qa-living-world-smoke-20261112` contiene solo una prueba no canónica y no se debe usar para continuar la novela.

**Pendiente P0:** ejecutar en ambiente autenticado la secuencia completa `createGitHubSaveJournal` + `saveLivingWorldTurn`/ `recoverJournaledSave` con estado sintético y dos ramas aisladas, incluyendo fallo previo y posterior a mover la ref, sin tocar el guardado auténtico. Antes de cualquier turno real 10, inspeccionar y reconciliar el diario canónico reservado, no inferir que está limpio por esta prueba.
