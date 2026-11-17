# TODO — Ideas y deuda de features

> Backlog de ideas surgidas durante el desarrollo del PoC *Cozy Trading Village*.
> Nada de esto bloquea el vertical slice actual; se registra para no perderlo.

## Gameplay

- [ ] **Limitar la recolección por cantidad o por tiempo.**
  Hoy el campo de trigo y el manzano permiten recolectar sin límite.
  Ideas:
  - Límite por cantidad: el recurso tiene un stock diario (ej. el manzano da N manzanas y se agota hasta el próximo ciclo).
  - Límite por tiempo (cooldown): tras recolectar, el punto queda "en recuperación" durante X segundos y muestra un estado visual (ej. sin brillo / icono de reloj).
  - Definirlo como **datos** en `world.ts` / `items.ts` (ej. `maxPerCycle`, `cooldownSec`) para no tocar la lógica de interacción.
  - Relacionado con el reloj día/noche del HUD: el ciclo diario puede resetear los stocks.

## Diálogo / Interacción

- [ ] **Ventana de diálogo estilo novela visual (respuestas predefinidas).**
  La ventana de interacción actual (comercio/recolección/horno) podría evolucionar
  a un sistema de diálogo con personajes:
  - Opciones que son **respuestas predefinidas** del jugador (elección de línea de diálogo), al estilo *visual novel*.
  - Cada personaje tendría su propio árbol/guion de conversación (datos, no código).
  - Las respuestas podrían abrir sub-nodos (comercio, lore, misiones simples).
  - La infraestructura actual (`INTERACTION_HANDLERS` genérico + `UIInteractionState`) ya separa lógica de UI, así que el panel React puede reutilizarse tal cual.

## Administrativo

- [ ] Migrar textos de datos (items/trades/progression) a archivos `.json` por idioma si el diccionario crece mucho.
- [ ] Persistencia de partida (GameState ya está preparado estructuralmente).

## Controles

- [ ] **PROPUESTA (pendiente de visto bueno) — Índice de controles (diccionario de teclas).**
  Misma filosofía que el índice de assets: el código referencia **acciones lógicas**,
  un único archivo mapea cada acción a códigos de tecla físicos. Cambiar una tecla
  = editar SOLO el índice. Propuesta completa (viabilidad, alcance de refactor y
  diseño de la API) entregada en la conversación del 2025-10-28; awaiting aprobación.
  Archivo propuesto: `src/game/data/controlsIndex.ts` (contrato: `ACTION` ids → `string[]`).
