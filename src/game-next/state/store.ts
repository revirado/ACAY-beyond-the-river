import { createGameStore } from '@/engine/state/store'
import type { NewGameSnapshot } from '@/game-next/core/types'

/**
 * Store de UI (Zustand) del nuevo juego — creado con la factory genérica
 * del motor. El motor publica snapshots aquí vía `module.store`.
 */
const initialSnapshot: NewGameSnapshot = {
  ready: false,
  screen: 'placeholder',
  locale: 'en',
  muted: false,
  volume: 0.5,
  debug: false,
  toasts: [],
  urls: {},
}

export const useGameStore = createGameStore<NewGameSnapshot>(initialSnapshot)
