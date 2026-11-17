import type { ItemId } from '@/game/core/types'
import { GameState } from '@/engine/state/GameState'

export interface PlayerState {
  x: number
  y: number
  facing: 1 | -1
  moving: boolean
  frame: 0 | 1
}

const EMPTY_INVENTORY: Record<ItemId, number> = {
  wheat: 0,
  apple: 0,
  wood: 0,
  bread: 0,
}

const DEFAULT_PLAYER: PlayerState = { x: 250, y: 440, facing: 1, moving: false, frame: 0 }

/**
 * Estado lógico del juego cozy — extiende la base genérica del motor con los
 * campos específicos (player, coins, inventory, prosperity, etc.).
 * Independiente de la representación visual. La UI y el renderer lo LEEN; la
 * lógica (economía/interacciones) lo ESCRIBE. Estructura preparada para
 * persistencia futura (guardado/carga).
 */
export class CozyGameState extends GameState {
  player: PlayerState = { ...DEFAULT_PLAYER }

  coins = 0
  inventory: Record<ItemId, number> = { ...EMPTY_INVENTORY }

  /** Métricas de progresión (solo ingreso total cuenta para prosperidad). */
  coinsEarned = 0
  breadSold = 0
  breadProduced = 0

  ovenUnlocked = false
  introCompleted = false
  prosperity = 0

  addItem(item: ItemId, count: number): void {
    this.inventory[item] = Math.max(0, (this.inventory[item] ?? 0) + count)
  }

  getItemCount(item: ItemId): number {
    return this.inventory[item] ?? 0
  }

  /** Reinicio completo (nueva partida). */
  reset(): void {
    this.player = { ...DEFAULT_PLAYER }
    this.coins = 0
    this.inventory = { ...EMPTY_INVENTORY }
    this.coinsEarned = 0
    this.breadSold = 0
    this.breadProduced = 0
    this.ovenUnlocked = false
    this.introCompleted = false
    this.prosperity = 0
    this.flags = {}
    this.markChanged()
  }
}

/** Alias para backwards-compat: el código cozy usa `GameState`. */
export type GameState = CozyGameState
