# Living World — plan de verificación (NO ejecución)
Borrador de pruebas; no afirmar PASS sin ejecutar. Punto de partida de referencia: CH-000, turno 9, EV-000029, TXT-000020. Nunca ejecutar narración de prueba en la rama canónica; usar datos sintéticos aislados.

| ID | Escenario | Criterio de aceptación |
| --- | --- | --- |
| LW-01 | Jack llega a una tienda fuera de horario | No se inventa atención; disponibilidad coherente con horario y excepciones; tiempo consumido. |
| LW-02 | Elena tiene actividad escolar mientras Jack está en el taller | La actividad puede progresar fuera de escena; Jack no conoce detalles sin canal causal; no se presume llegada a clase antes de resolverla. |
| LW-03 | Viaje Railgarden–Market Row–Crosswater | Respeta conexiones, duración aproximada y cambios de franja; no teletransporte ni ruta ficticia. |
| LW-04 | Problema independiente de transporte | Lena/Sora actúan por objetivos y conocimiento propios; cambios persistentes; Jack se entera solo si procede. |
| LW-05 | Jack ignora un compromiso ajeno | El evento sigue su causalidad sin castigo automático ni obligación de participar. |
| LW-06 | Rosa devuelve el reloj | Solo registrar entrega si se resuelve realmente; evitar duplicar recurso/evento. |
| LW-07 | Reanudación tras interrupción de entrega | Reproduce texto exacto ya guardado, no crea turno duplicado. |
| LW-08 | Cinco archivos de guardado | Transcript, eventos, capítulo, estado y manifest concuerdan; readback remoto antes de afirmar guardado. |
| LW-09 | Compatibilidad narrativa | Sin XP, niveles, poderes previos al Día 0 ni decisiones o palabras atribuidas a Jack. |
| LW-10 | Frontera entre propuesta y canon | Universidad, distancias y horarios tentativos no aparecen como hechos establecidos. |

## Método
1. Inspeccionar HEAD y manifest de la rama objetivo, archivos de autoridad y estado.
2. Preparar fixtures sintéticos aislados, sin tocar CH-000 real.
3. Ejecutar validadores y pruebas automatizadas de los módulos modificados, además de revisión manual literaria.
4. Comprobar eventos, conocimiento, recursos, tiempo, rutas y transcripción; registrar evidencia reproducible y fallos.
5. Revisar diff y solicitar revisión antes de integrar. No fusionar automáticamente con main ni rama narrativa.

## Riesgos a vigilar
- Agendas rígidas que contradicen acontecimientos.
- Omnisciencia de NPC/Jack.
- Eventos offscreen no persistidos.
- Rutas y horarios convertidos en canon sin autorización.
- Prosa mecánica y menús encubiertos.
- Cambios accidentales en el checkpoint real.
