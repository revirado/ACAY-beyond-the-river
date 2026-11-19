# TODO — ACAY / Beyond the River

Backlog de features pendientes. Cada item se mueve aquí cuando se identifica
pero no se implementa en la iteración actual.

---

## Editor de Sincronización de Tabs (80.1.x)

**Estado:** Especificación completa — pendiente de implementación.
**Espec completa:** `TABS_EDITOR_SPEC.md`

Herramienta interna de desarrollo para sincronizar tabs rítmicos con audio.
3 lanes paralelas (sin perspectiva del motor). Waveform minimalista.
Click izq = crear tab, click der = borrar. Play/pause = espacio.
Zoom in/out de las pistas. Abrir/guardar/guardar como/reemplazar audio.
Exporta JSON que el juego consume. Gateada por `ENABLE_EDITOR=true`.

**Implementar cuando haya assets de audio reales.**

---

## Editor de Escenas (100.1)

**Estado:** Especificación completa — pendiente de implementación.
**Espec completa:** `SCENE_EDITOR_SPEC.md`

Editor visual de escenas. Drag & drop de assets, posicionamiento, escala.
Paleta de módulos (character, pickup, useItem, exit, trigger, condition).
Linkeo visual de condiciones entre elementos. Exporta JSON que el juego
consume. Filosofía "piezas de Lego". Gateado por `ENABLE_EDITOR=true`.

**Implementar cuando haya 3+ escenas con elementos complejos.**

---

## Propuesta — índice de controles

**Estado:** Pendiente de visto bueno del usuario.

Actualmente los controles están centralizados en `src/game-next/core/controls.ts`
como un objeto `CONTROLS` (const). La propuesta es llevarlo un paso más allá:
un **índice de controles** completamente data-driven (`ACTION → códigos de tecla`)
que pueda editarse sin tocar código de juego — un archivo de datos (JSON o TS
const) que mapea acciones a teclas, con soporte para:

- Remapping de teclas por el usuario (settings).
- Múltiple bindings por acción (ej. `interact: ['Enter', 'Space']`).
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
