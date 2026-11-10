# Plan de diseño — Novel Story RPG

Estado: **preproducción**. No hay todavía género, ambientación, historia, personajes ni mecánicas aprobadas.

## Objetivo confirmado

- El usuario es el jugador.
- ChatGPT cumple la función de director/motor narrativo: presenta escenas, resuelve las decisiones según reglas acordadas y actualiza el estado del mundo.
- El repositorio guarda registros duraderos de personajes, escenarios, relaciones, cambios, sesiones y mapas para preservar continuidad.
- Ningún detalle de otros juegos se importa automáticamente.

## Orden de decisiones (no saltar etapas)

### 1. Identidad del juego (pendiente)

Decidir **tema/género** (p. ej. fantasía, ciencia ficción, misterio, realismo, mezcla), época y tono. Delimitar la premisa general y el tipo de experiencia. **Criterio de cierre:** el jugador aprueba una descripción breve del concepto.

### 2. Forma de jugar (pendiente)

Definir cómo expresa acciones el jugador, cómo responde el director de juego, dificultad, libertad de acción, azar o reglas deterministas, consecuencias, combate/no combate, progresión, daño y muerte. **Criterio de cierre:** se puede explicar y ejemplificar un turno sin ambigüedades importantes.

### 3. Personaje y reparto (pendiente)

Acordar la ficha del protagonista, atributos, niveles (solo si los habrá), inventario y habilidades. Definir estructura de NPC: personalidad, metas, estado de ánimo, vínculos, rutinas, conocimiento, recursos y decisiones propias. **Criterio de cierre:** una ficha de prueba es coherente con las reglas.

### 4. Mundo y mapa (pendiente)

Decidir escala, zonas, distancias, ubicaciones, conexiones y qué descubre el jugador. Boceto del mapa primero; mapa canónico después de aprobación. **Criterio de cierre:** localizaciones conectadas y trazables; no crear geografía sin acuerdo.

### 5. Persistencia y continuidad (pendiente)

Crear archivos estructurados para:
- `state`: instante, ubicación, protagonista, inventario, condiciones, conflictos actuales.
- `characters`: una identidad estable por personaje; estados emocional, físico y social, progresión y relaciones.
- `locations`: ID, descripción física, enlaces, ocupantes y cambios permanentes.
- `events`: hechos fechados en el tiempo **del juego**, autor, causas y consecuencias.
- `sessions`: decisiones, respuestas del mundo y referencias a eventos.
- `maps`: representaciones esquemáticas con versión y distinción entre conocido y desconocido.

**Criterio de cierre:** un ejemplo ficticio puede guardarse, reconstruirse y consultarse sin contradicciones. No convertir ejemplos en canon.

### 6. Prueba de juego (pendiente)

Jugar una escena de demostración autorizada. Evaluar si las elecciones cambian el mundo y si el registro permite retomar la escena en otra conversación. Corregir problemas antes de iniciar campaña.

## Procedimiento para cada turno, cuando las reglas estén acordadas

1. Cargar la última versión confirmada de registros.
2. Leer la acción libre del jugador y validar capacidades/conocimiento/posición.
3. Resolver con las reglas aprobadas y simular consecuencias.
4. Narrar hechos perceptibles al jugador sin revelar secretos de los NPC.
5. Registrar cambios pertinentes en hechos, personajes, lugares y sesión.
6. Verificar que el repositorio refleja la nueva versión y comunicar el resultado.

## Principios de control

- **Confirmado**: decidido por el jugador o establecido por la partida bajo reglas aprobadas.
- **Propuesto**: sugerencia editable, todavía no canónica.
- **Desconocido**: pendiente de definir; no rellenar silenciosamente.
- Personajes, niveles, emociones y mapas son requisitos de documentación, **no** personajes, números ni geografía inventados.
- Los rumores y el conocimiento de cada personaje deben distinguirse de la realidad objetiva del mundo.
- Nunca afirmar guardado, tests o continuidad persistida sin haberlo verificado.
- El repositorio es público; no registrar datos personales privados de jugadores o terceros.
- No cambiar `main` directamente durante la planificación; trabajar en rama y revisar antes de fusionar.

## Estado de trabajo

**Confirmado**: repositorio `jbob-coder/Novel-story-rpg-game-chat-gpt`, rama base `main`. El objetivo general está definido.

**En progreso**: orden y reglas de planificación.

**Siguiente decisión**: tema/género principal del juego. No seleccionar época, poderes, personajes, niveles ni mapa antes de este paso.
