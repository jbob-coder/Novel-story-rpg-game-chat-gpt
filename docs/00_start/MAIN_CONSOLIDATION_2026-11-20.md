# Consolidación de la base narrativa en `main` — 2026-11-20

## Resultado confirmado

La [PR #2](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/2) pasó de borrador a revisión y fue integrada mediante GitHub Merge **sin forzar**, con comprobación de head exacto `2820cca1bd5140ef8a9f2c94cf986feef0ef19cc`. Commit resultante de `main`: **`7c45dc46f2651d8d4375435af704b71643ebdae5`**.

La verificación posterior inspeccionó **163 archivos blob** en `main` y 163 en `work/chat-narrative-foundation`, sin rutas faltantes ni diferencias SHA de contenido. GitHub confirmó la PR cerrada/merged y la rama de origen permanece intacta.

La fuente incorporada pasó GitHub Actions [#44754070198](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44754070198) y [#44753956402](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/actions/runs/44753956402) con `success`. Esto **no** demuestra una nueva acción real guardada con el conector; el último checkpoint sigue siendo `CH-000`, turno 9, `EV-000029`, `TXT-000020`, Día −29 a media mañana.

## Alcance y autoridad

- `main` contiene **la versión consolidada del código y datos existentes** en la rama narrativa al HEAD señalado. No se incorporaron por separado las 108 ramas históricas; integraciones selectivas previas (por ejemplo necesidades y servicios NPC) ya estaban en la fuente.
- `work/chat-narrative-foundation` **sigue siendo el origen narrativo y de guardado operativo** hasta una migración explícita y validada del journal y de los contratos del adaptador; que el código esté en `main` **no** autoriza escribir nuevos turnos allí.
- `main` mantiene protección de rama. El asistente no pudo consultar detalles del endpoint de protección (GitHub devolvió `403`); **no** se desactivaron reglas.
- La PR documental [#80](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/pull/80) incorpora el catálogo de 108 ramas, pruebas de comparación y el inventario de archivos; su consolidación es **una operación separada**, que requiere comprobar CI de su SHA final.

## Pendientes después de este hito

1. Cerrar la revisión documental de la PR #80 con CI, inventario y navegación.
2. Revisar piezas de NPC todavía no integradas en la fuente (contactos sociales, agenda y decisiones); no volver a portar necesidades o servicios.
3. Integrar gradualmente mapas propuestos con sus dependencias, sin convertir geometría en visitas o eventos reales.
4. Verificar un nuevo turno escrito y recuperado con el conector **solo** cuando exista decisión del jugador; mantener el bloqueo de guardado.
5. Para cada entrega a `main`, verificar commit exacto, diffs, pruebas, privacidad, tiempo, journal y ausencia de cambios indebidos a los cinco archivos de checkpoint.

**Referencia histórica:** [Inventario de ramas del 19-11](INVENTARIO_RAMAS_2026-11-19.md), [Revisión de brechas al nuevo HEAD](CURRENT_STATE_RECHECK_2026-11-20.md).
