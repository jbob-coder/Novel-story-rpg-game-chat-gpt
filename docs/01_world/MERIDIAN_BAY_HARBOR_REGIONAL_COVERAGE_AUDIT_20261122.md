# Meridian Bay — cobertura documentada de los accesos a Harbor Walk (22 de noviembre de 2026)

**Estado:** auditoría geométrica de cobertura, de solo lectura y **NO CANÓNICA**. No se ha creado un nuevo fragmento, calle, edificio, permiso, trayecto jugable ni narración.

**Rama:** `work/meridian-harbor-regional-coverage-20261122`, iniciada exactamente en [PR #103](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/103), commit `a04712478fad6ab3f367d3af2eb1f14ee55013e2`. La PR #103 depende de #89 → #87 → #86; no fusionar este trabajo aisladamente. El `main` comprobado al comenzar fue `019175c6463ff31807a0f7013d91299add94913c`.

## Hallazgo: el corredor completo sigue sin cobertura cartográfica

Los puntos propuestos de las rutas derivan **sin alteraciones** del JSON de revisión de PR #103. La comparación considera únicamente las tres cajas de estudio de planos físicos históricos, no los dibujos de corredores anteriores que **solo** detallan una línea.

| Ruta propuesta en PR #103 | Longitud total ficticia | Cubierta por alguna caja de estudio | Sin cobertura física previa | Porcentaje sin cobertura |
| --- | ---: | ---: | ---: | ---: |
| Market Row → Harbor Walk (PR #44 + desvío propuesto) | 15.303534 | 4.633913 | **10.669621** | **69.7200 %** |
| Crosswater Plaza → Harbor Walk (PR #56 + rodeo propuesto) | 8.280615 | 3.669215 | **4.611400** | **55.6891 %** |

**Importante:** son unidades arbitrarias de un plano ficcional y **porcentajes de longitud del dibujo**, no kilómetros, minutos, proporción construida de la ciudad ni certificación de paso.

### Fuentes precisas y alcance geográfico

| Fuente original conservada | Archivo del repositorio en esta rama | Blob SHA | Caja de estudio |
| --- | --- | --- | --- |
| PR #69, fragmento terrestre 03 | `SOURCE_PR69_LAND_03_20261120.json` | `2a95eb9e50f69436cb65711daf8ff586f4ef4279` | x=58–68.2, y=42–51 |
| PR #67, fragmento costero 02 | `SOURCE_PR67_COAST_02_20261120.json` | `325a0acde67a1ce3b44576860824657a3db41695` | x=68–82, y=42–51 |
| PR #67, Coast 01, variante PR #89 | `MERIDIAN_BAY_HARBOR_COAST_PR67_CANDIDATE_20261122.json` | `139c3687c98285aff886d28422544d082768217d` | x=68–77, y=32–42 |
| PR #103, dos rutas locales reconciliadas | `MERIDIAN_BAY_HARBOR_ACCESS_LOCAL_RECONCILIATION_20261122.json` | `aae66aae315603e37e8cb88034600446bf46d21d` | Recorrido entre anclajes conocidos |

- **Market Row:** la región 03 cubre únicamente el segmento inicial, desde `(58,43)` hasta aproximadamente `(58.869565,42)`, lo que representa 1.325196 unidades. A partir de allí faltan **tres tramos de línea**: resto del segmento 0, todo el segmento 1 y todo el segmento 2, hasta `(68,36.9)`. Los dos tramos finales (3 y 4; 3.308717 unidades) quedan dentro de Coast 01.
- **Crosswater Plaza:** inicia en `(65,42)` exactamente en la **frontera inferior** de la región 03. Ese contacto de un solo punto tiene **longitud cubierta cero**. La ruta carece de estudio físico durante todo el segmento 0 y la primera parte del 1, hasta entrar en Coast 01 en `(68,38.635714)`. Sus partes restantes (3.669215 unidades) quedan dentro de Coast 01.
- **Coast 02:** ninguna de estas rutas propuestas tiene **longitud positiva** dentro de su caja x=68–82,y=42–51. Por tanto, la existencia y la buena unión de Coast 02 **no** validan estos recorridos.
- **Edificios y trazas bloqueadas:** al recortar únicamente los segmentos realmente cubiertos, la auditoría no encontró contactos con las huellas de edificios, calles históricas bloqueadas o costa dibujada en las piezas 01/02/03. Esto **NO** implica ausencia de obstáculos en la zona sin plano ni prueba de propiedad pública en los segmentos dibujados.

## Método reproducible y límites

[`tools/meridian_bay_harbor_region_coverage.mjs`](../../tools/meridian_bay_harbor_region_coverage.mjs) exige las identidades exactas SHA de los cuatro archivos anteriores, llama al validador de la PR #103 y conserva sus puntos. Para cada arista de ruta aplica un **recorte paramétrico de línea contra rectángulo (Liang–Barsky)**. Separa subsecciones **dentro de una o varias cajas** y **fuera de todas**, sin contar doble la superposición de regiones. Un roce de esquina, una intersección en un único extremo o un segmento de longitud cero nunca cuentan como estudio físico.

En secciones cubiertas, compara la línea recortada con las huellas de edificios candidatos, las calles históricas marcadas como bloqueadas y las costas hipotéticas, tratando también contactos tangentes como una condición que exige revisión. El algoritmo es **2D y de punto o línea central**, sin ancho de calle, profundidad, cota, servidumbre, edificio no modelado, certificado de seguridad ni georreferenciación. Una sección **dentro de la caja** significa solamente que existe información candidata para inspeccionar, no que sea pasable.

El [SVG de cobertura](MERIDIAN_BAY_HARBOR_REGIONAL_COVERAGE_20261122.svg) dibuja los tres rectángulos originales; las porciones de ambas rutas **sin plano físico** aparecen en rojo discontinuo, y las estudiadas con líneas continuas. No se añadieron edificios inexistentes ni se extendieron artificialmente las zonas de estudio. El resultado se genera determinísticamente mediante `node tools/meridian_bay_harbor_region_coverage.mjs --write`; la importación y la verificación nunca escriben.

[`tests/meridian_bay_harbor_region_coverage.test.mjs`](../../tests/meridian_bay_harbor_region_coverage.test.mjs) prueba las cifras exactas, fragmentos de contacto cero, estudio solapado sin doble conteo, tramos sin cobertura, detección sintética de edificios/bloqueos/litoral, rechazos por dato inválido, identidad JSON/SVG y protección del guardado. Los ensayos sintéticos no constituyen nuevos elementos narrativos.

## Decisión de arquitectura para el siguiente fragmento

**Problema que hay que resolver:** el espacio con `x<68, y<42` entre Market Row/Crosswater y el comienzo de Coast 01 carece de un **fragmento territorial propio** con límites, parcelas y huellas de edificios. Los históricos PR #44/#58/#56 definen propuestas de líneas, pero no resuelven suelo, fachadas, propiedad ni acceso real en ese vacío.

**Propuesta de estudio, NO de cartografía aprobada:** investigar una nueva región de transición centrada en `x=58..68.3, y=36..42.3` de esta cuadrícula provisional. Es una **ventana de investigación**, no un mapa definitivo ni una obligación de que las calles circulen así. Se solaparía brevemente con Land 03 y Coast 01 para comprobar empalmes. Antes de dibujar edificios, comparar las piezas históricas, accesos comerciales existentes, límites público/privado, visuales narradas y caminos de ambas propuestas. Solo después construir un fragmento JSON/SVG nuevo, con trazados condicionados a causa urbana y sin inventar accesibilidad.

### Restricciones de integración

- Un `LOC-` conectado en `game/STATE.json` confirma **adyacencia narrativa**, no geometría ni permiso portuario.
- El estudio deja los diseños #44, #58 y #56 en sus ramas originales. La selección del trayecto físico sigue abierta.
- No se permiten nuevos `LOC-`, servicios, relaciones, trámites, costes, tiempos, NPCs, movimiento de Jack ni avance de CH-000.
- La certificación de ruta completa requerirá **cobertura cartográfica**, análisis de colisiones en todas las regiones, verificación de propiedad/acceso y un proceso de aceptación separado.
- Ejecutar CI Node, Python y checkpoint en el HEAD exacto, validar inventario completo y los cinco archivos narrativos antes de solicitar revisión.

**Recomendación:** no fusionar los caminos propuestos a un mapa jugable. La siguiente tarea útil es un **fragmento 04 de transición con trazabilidad histórica**, no continuar moviendo arbitrariamente un punto hasta que parezca que la ruta evita edificios conocidos.


## Validación ejecutada por GitHub Actions (22 de noviembre de 2026)

En el commit de implementación `616c6155a279bf0126f07ccc46536665179731b5`, el clon de QA aislado [PR #113](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/113), con base `main` únicamente para disparar el workflow, ejecutó [Narrative integrity #45081672029](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/45081672029): **508/508 JavaScript PASS**, **47/47 Python PASS** y **validador de guardado PASS**. El conjunto contiene las 489 pruebas anteriores y 19 nuevas de cobertura. Los resultados se confirmaron en el job `137390996998`, que terminó exitosamente.

Comparación exacta de árboles Git en ese commit: `main` **190** archivos, PR #103 **218**, PR #112 **222**. Diferencias respecto a PR #103: **4 archivos nuevos**, **4 índices/inventario modificados**, **0 borrados**. Inventario **222/222**, sin sobrantes ni ausentes. Los **cinco archivos narrativos protegidos tienen el mismo Git blob que `main` y PR #103**. No se fusionó ninguna PR ni se agregó conexión o progreso narrativo.

**Corte de evidencia:** este párrafo documental se agregó después de esa ejecución; el HEAD final de la rama debe superar otra ejecución idéntica para certificar también el documento actualizado. Una suite verde no convierte las regiones hipotéticas en vías abiertas ni cubre el sector sin mapa.
