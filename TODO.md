# TODO — ACAY / Beyond the River

Backlog de features pendientes. Cada item se mueve aquí cuando se identifica
pero no se implementa en la iteración actual.

---

## Propuesta — índice de controles

**Estado:** Pendiente de visto bueno del usuario.

Actualmente los controles están centralizados en `src/game-next/core/controls.ts`
como un objeto `CONTROLS` (const). La propuesta es llevarlo un paso más allá:
un **índice de controles** completamente data-driven (`ACTION → códigos de tecla`)
que pueda editarse sin tocar código de juego — un archivo de datos (JSON o TS
const) que mapea acciones a teclas, con soporte para:

- Remapping de teclas por el usuario (settings).
- Múltiples bindings por acción (ej. `interact: ['Enter', 'Space']`).
- Display de controles en una pantalla de settings/pausa.
- Contexto-sensitivo (diferentes controles en explore vs rhythm-battle).

**Archivo propuesto:** `src/game-next/data/controlsIndex.ts` (o `.json`).

**No implementar sin aprobación explícita del usuario.**

---

## Otros items pendientes (identificados durante el desarrollo)

- [ ] Drag & drop de items del inventario al escenario (usar Vara de Hierro
  en rocas, Maderas en paso estrecho — Escena 04, §4.1).
- [ ] Sistema de save/load (persistencia del estado del juego).
- [ ] Música procedural real para batallas rítmicas (definir TrackDef por
  antagonista).
- [ ] Babble sound asset para Acay (reproducir cuando isAcay=true).
- [ ] Animación de caminata de Acay (2 frames, cycle) — actualmente solo
  mueve la posición sin walk cycle.
- [ ] Pathfinding de Acay (actualmente camina en línea recta al target X).
- [ ] Migrar textos de datos a JSON por idioma si crecen.
