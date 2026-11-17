import { createGameStore } from '@/engine/state/store'
import type { AcaySnapshot } from '@/game-next/core/types'

/**
 * Store de UI (Zustand) del juego Acay.
 * El motor publica snapshots aquí vía module.store.
 */
const initialSnapshot: AcaySnapshot = {
  ready: false,
  screen: 'studio',
  locale: 'es',
  muted: false,
  volume: 0.5,
  debug: false,
  toasts: [],
  urls: {},
  dialogue: null,
  inventory: [],
  battle: null,
  hoveredElementId: null,
}

export const useGameStore = createGameStore<AcaySnapshot>(initialSnapshot)
