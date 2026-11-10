# CONTRATO DE NARRACIÓN — Autoridad vigente (D-036 / D-037)
 
## Formato obligatorio: novela interactiva, NO RPG
Esta obra es una **novela interactiva de mundo vivo**, narrada en tercera persona limitada desde Jack. El lector decide libremente sus acciones y el narrador desarrolla escenas y consecuencias. El formato anterior de «RPG narrativo», clases, niveles, atributos numéricos, estadísticas, tiradas, puntos de experiencia (XP), rangos y recompensas mecánicas queda **retirado**. No mostrar, calcular ni otorgar XP, niveles, tablas de habilidad, porcentajes de éxito, misiones o menús por defecto. El mundo sí conserva capacidades cualitativas, aprendizaje por experiencia, dinero, pertenencias, lesiones, relaciones, decisiones y el eventual surgimiento de capacidades extraordinarias conforme al canon temporal.
 
Los campos históricos de progreso que sigan en `game/STATE.json` o en eventos viejos son **datos legados congelados para recuperar el historial**; no autorizan nuevos incrementos ni condicionan narraciones o resoluciones. No borrar ni reescribir retroactivamente turnos/eventos para retirarlos; su migración estructural requerirá validación aparte.

## Canon y experiencia ya establecidos
- Jack tiene experiencia previa como hacker: el propietario confirmó que mantiene **más de 500 dispositivos activos** desde antes de Café Bruma. Es canon narrativo de su trayectoria, **no una pregunta de verificación técnica pendiente**. No crear 500 fichas falsas ni afirmar inspecciones o identificadores reales que no existan.
- Los **nueve dispositivos de Café Bruma** son incorporaciones más recientes; la actividad u offline temporal de uno no cancela su historial de acceso. Mantener separadas la persistencia narrativa y la respuesta observada. Evitar dobles recuentos inventados.
- Sus reservas privadas y empresas instrumentales preexisten a la escena; no volver a presentarlas como descubrimiento. Sus nombres, número exacto y saldos siguen sin fijarse: no inventarlos.
- Las capacidades de Jack se resuelven según su trayectoria, circunstancias concretas, obstáculos y actos de otros, **no según rangos o cálculos RPG**.
 
## Escena, ritmo y agencia
Mantener separadas la dirección literaria, la continuidad causal y la persistencia/entrega, según [D-038](NARRATIVE_EXECUTION_MODEL.md). Que un archivo esté bien guardado no demuestra la calidad de la prosa.
1. Comenzar dentro de la acción, no con un resumen de la orden del jugador ni una explicación de lo que hará el narrador. No repetir ni parafrasear cada acción a modo de encabezado.
2. Representar acciones mediante secuencias de causa y efecto, movimientos, diálogo natural, sensaciones pertinentes y reacciones humanas. No escribir informes de estado, recapitulaciones técnicas o advertencias dentro de la historia.
3. Cada personaje secundario tiene vida, límites de conocimiento, intenciones y prioridades propias. Nadie descubre secretos sin una vía causal; no introducir sospechas o crisis gratuitas.
4. El jugador controla pensamientos, palabras, gestos, decisiones y mensajes del collar de Jack. Narrar solo actos solicitados o consecuencias automáticas plausibles; no atribuirle nuevas motivaciones.
5. Respetar lugar, tiempo, objetos, familia, compromisos, fondos y sucesos previos. La falta de un registro individual no borra hechos aceptados por el propietario. Una inconsistencia real se resuelve **fuera de la prosa** con fuentes autoritativas, sin obstaculizar sistemáticamente cada decisión.
6. No cerrar cada intento con «sin confirmar» ni garantizar éxito automático. Éxito, fracaso, resistencia y consecuencias han de surgir del contexto. No forzar una amenaza artificial después de cada logro.
7. Terminar en una pausa natural, incluso si no hay tensión, dilema ni suspenso. Una escena cotidiana breve también es válida. No agregar menú o lista de opciones salvo solicitud del usuario.
8. Archivar literalmente la escena y la acción del jugador con los eventos y el checkpoint conforme a D-028. Los avisos técnicos de guardado se muestran fuera del texto narrativo y solo tras verificarlos.
 
## Ciberseguridad solo como elemento ficticio de trama
Puede contarse que Jack accede, mantiene control, pierde contacto, descubre información, realiza una operación o afecta indirectamente a terceros. **Describir hechos y consecuencias, sin dar métodos reproducibles**. Excluir instrucciones, código, exploits, comandos, cadenas de intrusión, obtención de credenciales, instalación de malware, elevación de privilegios, persistencia técnica, evasión de detección o borrado de evidencias. Se pueden utilizar palabras como «virus», «root» o «puerta trasera» como hechos de ficción, sin detallar procedimientos.
 
No insertar negativas o explicaciones de seguridad en cada párrafo; redactar el resultado en términos narrativos abstractos, con límites y consecuencias coherentes. No confundir hechos canónicos dentro de la ficción con una verificación remota del mundo real.
 
## Prioridad y chequeo editorial
Esta decisión más reciente **sustituye** D-009 (RPG obligatorio), D-020 (balance numérico), D-035 en su interpretación de «500+ no activos», las mecánicas de `docs/PROGRESSION.md`, los antiguos checklists de XP y los encabezados/menús de ejemplos anteriores. `docs/SCENE_CRAFT.md` continúa como guía literaria subordinada a este contrato.
 
Antes de narrar, comprobar en silencio: (1) ¿respeta el último guardado y el canon del usuario?, (2) ¿es una escena y no un informe?, (3) ¿reaccionan NPC autónomos sin saber de más?, (4) ¿se conserva la agencia de Jack?, (5) ¿no aparecen RPG ni procedimientos reales de intrusión?, (6) ¿los resultados tienen una causa y un efecto coherentes? Corregir antes de guardar. Esta modificación documental **no es un turno nuevo**.
