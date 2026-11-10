# Modelo operativo de narración, continuidad y entrega — D-038

**Revisión crítica solicitada por el propietario (2026-11-10).** Este documento corrige instrucciones de ejecución; no reescribe los turnos jugados ni altera el canon. D-036/D-037 mantienen la novela interactiva sin RPG, la agencia de Jack y su historia anterior.

## Fallos observados
- **Prioridad equivocada:** la técnica de guardado estaba dominando la narración y generaba prosa parecida a informes.
- **Confusión entre calidad y consistencia:** cinco archivos coherentes pueden contener una mala escena. La revisión literaria es independiente de la validación técnica.
- **Rigidez dramática:** forzar un conflicto, peligro, giro o suspenso al final de cada intervención artificializa la vida cotidiana.
- **Confusión entre guardado y entrega:** comprobar un commit de GitHub no demuestra que la interfaz mostró la respuesta.
- **Auditoría sin ejecución:** encontrar contradicciones no equivale a modificarlas y comprobar sus efectos.
- **Fuentes desordenadas:** las notas históricas de apertura no deben sustituir el último checkpoint.

## A. Dirección literaria (visible al lector)
Escribir en tercera persona limitada desde lo que Jack puede percibir o conocer. Jack es controlado exclusivamente por el usuario: no decidir sus pensamientos, diálogos, mensajes del collar, gestos o acciones. Los NPC tienen intereses, límites de conocimiento, relaciones y actividades independientes, pero no deben aparecer para fabricar obstáculos. Resolver consecuencias naturales con capacidades cualitativas, no niveles, XP ni porcentajes. La escena puede ser tranquila, breve y cotidiana. Su final debe ser natural, **no obligatoriamente un dilema o suspenso**. No introducir menús salvo petición expresa.

## B. Continuidad causal (trabajo interno)
Recuperar el manifiesto, estado, eventos, capítulo y transcripción del HEAD vigente. Distinguir hechos reales en la ficción, conocimientos particulares, rumores y datos pendientes. Resolver únicamente lo que hizo Jack y los cambios secundarios justificados por el tiempo ficticio. Comprobar causalidad, autonomía de NPC, paso del tiempo, pertenencias, compromisos y límites del Día 0. No reabrir logros establecidos sin una causa narrativa real. No transformar cada escena en auditoría.

## C. Persistencia y entrega (fuera de la novela)
Preparar **antes** la respuesta literaria exacta. Revisar calidad y coherencia. Guardar en un único commit los cinco archivos: transcripción literal, eventos, prosa del capítulo, estado y manifiesto. Actualizar la rama autorizada sin forzar y con verificación del HEAD, recuperar los cinco archivos y comparar texto e identificadores. Si el guardado falla, detenerse conforme a D-028; no presentar nueva historia.

**Diferenciar estados:** «guardado verificado» significa lectura remota idéntica; **no** significa «entregado al lector». No afirmar visualización sin confirmación fiable. Si el texto ya quedó guardado pero se interrumpió la presentación, recuperar y repetir **literalmente ese mismo turno**, sin escribir otra versión ni avanzar personajes. Si el usuario responde a la escena recibida, continuar normalmente sin pedir acuses rituales.

## Orden obligatorio para el próximo turno
1. Verificar checkpoint y cualquier guardado pendiente.
2. Interpretar la acción libre del usuario sin inventar elección de Jack.
3. Resolver consecuencias y actividad externa pertinente.
4. Redactar y editar una **escena**, no un informe.
5. Preparar, validar, guardar y recuperar las cinco piezas.
6. Presentar exactamente el texto guardado, distinguiendo persistencia de entrega.
7. Esperar la próxima acción de Jack; no avanzar durante el silencio.

## Aplicación al estado actual
El checkpoint consultado el 10 de noviembre de 2026 está en **CH-000, Día −30, noche, turno 6, EV-000021, TXT-000014**. Jack permanece en el taller familiar; Elena espera una respuesta sobre la memoria USB para su ilustración y Rosa sigue con el despertador. Aster no está terminado. **Esta actualización documental no constituye el turno 7.** Antes de reanudar, verificar otra vez el HEAD y el guardado.

## Prueba de la corrección
Se considera aplicada cuando el contrato, la guía de escenas y el punto de entrada enlacen a este modelo, el cierre natural no imponga suspenso, los archivos modificados se recuperen idénticos y los cinco archivos canónicos de la historia sigan intactos. Una prueba real de calidad literaria requiere una nueva acción del lector.


## Refuerzo técnico D-040: hechos que sobreviven a la escena

Para cada efecto material que la narración describa, documentar un cambio verificable del actor correspondiente antes del guardado. La prosa, el evento y el estado deben coincidir. La lista de cambios no tiene que incluir cada gesto irrelevante; solo lo necesario para que el mundo recuerde posesiones, ubicación, vínculos, lesiones, conocimientos y planes. Los NPC no tienen obligación de actuar en cada escena. Véase el esquema de cambios en [STATE_SCHEMA.md](STATE_SCHEMA.md) y su implementación en [state_changes.mjs](../tools/state_changes.mjs).

El módulo valida el estado **declarado**, no interpreta libremente toda la prosa. Una omisión del narrador sigue siendo posible; una lectura editorial antes de persistir es obligatoria. No confundir pruebas sintéticas locales con una prueba de guardado de una acción real.
