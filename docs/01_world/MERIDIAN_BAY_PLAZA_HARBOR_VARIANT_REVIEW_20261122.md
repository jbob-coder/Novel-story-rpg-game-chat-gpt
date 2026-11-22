# Meridian Bay: dos alternativas reversibles para Plaza–Harbor (2026-11-22)

**Estado:** alternativas de ingeniería **no admitidas**. La partida y sus conexiones de alto nivel no son objeto de cambio. Rama de auditoría `audit/plaza-harbor-candidate-variants-20261122` sobre PR #101 commit `819a059696593ed1c6c9c0310b7ab021c39e068c`; dependencia documental apilada #101 → #94 → #87 → #86. **No fusionar de forma independiente.**

## Fuentes preservadas

- Histórico [PR #56](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/56), HEAD `199b3843085d8b4b2ab92739357263d598757331`; archivo `SOURCE_PR56_PLAZA_HARBOR_20261120.json`, blob Git `a5ac772922b4717797118b15f182207be1d1a7fb`.
- Histórico [PR #67](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/67), HEAD `8bdf34c5eddf4e12e34352018b2a893cb9a14056`; archivo `SOURCE_PR67_COAST_01_20261120.json`, blob Git `7cb79b2113bfef7b7fbbc39539c17fd80a275cd7`.
- Tanto los cuatro tramos Plaza–Harbor como la huella `HC-B-01` son dibujos no canónicos. La conexión guardada `LOC-CROSSWATER-PLAZA ↔ LOC-HARBOR-WALK` sigue siendo válida independientemente de un boceto conflictivo.
- Los cambios están definidos en `MERIDIAN_BAY_PLAZA_HARBOR_VARIANT_OPTIONS_20261122.json` como **parches diferenciales**, sin copiar ni reemplazar las fuentes.

## Opción A — ajustar solamente el punto de ruta N2

- Modificar `MB-PH-N2.xy` de `(68.9,39.15)` a **`(69.6,39)`** dentro de una copia de evaluación.
- Conservar cinco nodos y cuatro tramos; no cambiar `MB-PH-N3=(70.1,37.85)`, el terminal `MB-PH-N4=(71,37)`, las etiquetas, enlaces ni ningún edificio.
- Cruces estrictos con edificios candidatos del diseño PR #67: pasan de **2 a 0**. El resultado no garantiza ancho peatonal, servidumbre, accesibilidad ni topografía real.
- Longitud ilustrativa del corredor pasa de **7.837531** a **7.990491** unidades de lienzo: +**0.152960**, aproximadamente **+1.95 %**. Estos números NO son kilómetros ni minutos; no justifican decidir qué ruta es mejor para jugar.

## Opción B — desplazar solamente el edificio candidato B01

- Mantener intacta PR #56. En una copia de `HC-B-01`, mover **cada vértice y -0.55**; sin cambiar la forma del cuadrilátero.
- Cruces estrictos PR #56 contra `HC-B-01`: pasan de **2 a 0**.
- **Nuevo conflicto detectado:** **2 de los 4 vértices** resultan fuera del uso de suelo hipotético `HC-Z-OLD`, y aparecen **2 cruces estrictos con el límite de esa zona**. La eliminación del cruce vial no implica que la parcela trasladada siga siendo compatible con su manzana propuesta.
- No se aprueba trasladar ninguna edificación; sus coordenadas originales tampoco son verificaciones de un inmueble real.

## Comparación y decisión técnica (no aprobación física)

| Criterio sobre bocetos no canónicos | A: desplazar N2 | B: trasladar B01 |
| --- | --- | --- |
| Cruces estrictos calle–edificio `HC-B-01` | 0 | 0 |
| Tramos de Plaza–Harbor | 4, sin cambios | 4, sin cambios |
| Edificio B01 original conservado | Sí | No |
| Borde de zona `HC-Z-OLD` violado por nueva huella | No se modifica la huella | Sí, 2 aristas estrictas |
| Ruta original PR #56 intacta | No (solo N2) | Sí |
| Conexiones del mundo guardado | Intactas | Intactas |
| Aprobación de paso físico | **No** | **No** |

**Recomendación de siguiente estudio:** evaluar primero **Opción A**, porque corrige la incompatibilidad local sin crear otra en el límite zonal provisional. **No selecciona una ruta jugable ni descarta B automáticamente**. Antes de formalizar cualquier diseño debe confirmarse la circulación real, anchos, accesibilidad, edificios, permisos, costa, calles históricas y compatibilidad de las áreas vecinas.

## Reproducción y QA

- `tools/meridian_bay_plaza_harbor_variant_review.mjs` transforma copias in-memory, fija hashes de archivos históricos, valida el grafo guardado y rechaza un parche fuera de los dos casos documentados.
- `tests/meridian_bay_plaza_harbor_variant_review.test.mjs` prueba el cambio único, el resultado de ambas opciones, cruces de zona, geometría sintética, protección ante datos adulterados y ausencia de escritura o avance narrativo.
- Ejecutar en el HEAD final: `node --test tests/*.test.mjs`, `python -m unittest discover -s tests -p 'test_*.py' -v`, `python tools/validate_state.py`; además inventario y comparación de cinco hashes canónicos frente a PR #101 y `main`.
- Mantener esta PR **draft** hasta completar CI y revisión editorial. No reemplazar PR #56 ni editar Coast 01 ni siquiera si las pruebas del boceto pasan.
