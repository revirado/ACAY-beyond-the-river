import type { GameStateContract } from '@/engine/core/types'

/**
 * GameState — base genérica del estado lógico del juego.
 *
 * Independiente de la representación visual. La UI y el renderer lo LEEN;
 * la lógica del juego lo ESCRIBE. Estructura preparada para persistencia
 * futura (guardado/carga).
 *
 * Cada juego extiende esta clase y agrega sus propios campos (player,
 * coins, inventario, diálogo actual, etc.), implementando `reset()` para
 * devolver el estado a su punto inicial.
 *
 * El contrato mínimo (GameStateContract en types.ts) exige:
 *   - version (incrementa en cada cambio)
 *   - subscribe(fn) → unsubscribe
 *   - markChanged() (incrementa version + notifica listeners)
 *   - reset()
 */
export abstract class GameState implements GameStateContract {
  /** Se incrementa en cada cambio lógico → el engine sincroniza la UI. */
  version = 0

  /** Flags booleanos genéricos para eventos/achievements del juego. */
  flags: Record<string, boolean> = {}

  private listeners = new Set<() => void>()

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  markChanged(): void {
    this.version++
    for (const fn of this.listeners) fn()
  }

  /** Reinicio completo (nueva partida). El juego concreto lo implementa. */
  abstract reset(): void
}
