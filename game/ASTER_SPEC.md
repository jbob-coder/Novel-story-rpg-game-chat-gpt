# ASTER — especificación narrativa de diseño

**ID**: ITEM-ASTER · **Clase**: robot mediano, sin cabina de piloto. **Estado**: en construcción, no operativo. **Ubicación**: taller del hogar Wilson.

Jack diseña a Aster para ser flexible, resistente y capaz de actuar sin piloto en su interior, con órdenes remotas o rutinas automáticas cuando estén desarrolladas.

| Función solicitada | Estado al inicio |
| --- | --- |
| Estructura mediana, articulada y resistente | Objetivo de diseño; durabilidad real no probada |
| Jetpack | Previsto, vuelo no verificado |
| Sistema de combate automático | Previsto, no operativo ni probado |
| Visión nocturna | Prevista, no probada |
| Visión térmica / heat vision | Prevista, no probada |
| Pantalla / display 14K | Especificación solicitada, no integrada ni verificada |
| Resistencia al calor | Objetivo sin inmunidad garantizada |
| Resistencia a jamming/interferencias | Objetivo de protección no verificado |
| «UMP resistant» | Texto literal del propietario. **Ambiguo**, quizás quería decir EMP; no asumirlo como confirmado |
| Abort mission / escape | Función prevista de cancelar misión y retirarse ante emergencia, no garantiza éxito |

**Continuidad:** Aster no está listo para misiones. No puede volar, combatir ni sobrevivir a impactos por mero hecho de tener requisitos de diseño. Construir, probar y mejorar funciones consume tiempo, recursos y decisiones que deberán registrarse en eventos futuros. No hay cabina de piloto. No se fijaron armas, tácticas automáticas, diseños técnicos ni modos de causar daño.

**Agencia:** El jugador elige los proyectos de Jack. El robot no puede actuar por cuenta propia hasta que se establezca su capacidad real, su autorización y sus límites dentro de la ficción.


## Progreso realizado en escena — Día -29, turno 9 (EV-000027)

Jack montó físicamente el **primer brazo** de Aster en la estructura del torso. Alineó el soporte del hombro y corrigió el roce del antebrazo contra una placa. El codo puede flexionarse y extenderse **manualmente** sin rozar la carcasa; el peso queda sostenido por el soporte montado. **Actuadores todavía desconectados**, sin movimiento motorizado, pruebas de carga, calibración de control ni navegación autónoma. El robot sigue **incompleto y no operativo**. No se especificó si el primer brazo es el derecho o el izquierdo. La verdad actual se conserva además en `game/STATE.json` (`ITEM-ASTER.assembly_progress`) y el cambio causal en `EV-000027`.
