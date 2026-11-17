import { createGameStore, type GameStore } from '@/engine/state/store'
import type { CozySnapshot } from '@/game/core/types'

/**
 * Store de UI (Zustand) del juego cozy — creado con la factory genérica del
 * motor (`createGameStore<TSnapshot>`). El motor publica snapshots aquí vía
 * `module.store.getState().setSnapshot(...)`.
 *
 * NO es la fuente de verdad del juego: solo refleja el estado para React.
 */
const initialSnapshot: CozySnapshot = {
  ready: false,
  screen: 'title',
  locale: 'en', // el juego siempre inicia en inglés (DEFAULT_LOCALE)
  coins: 0,
  inventory: { wheat: 0, apple: 0, wood: 0, bread: 0 },
  prosperity: 0,
  ovenUnlocked: false,
  interaction: null,
  toasts: [],
  muted: false,
  volume: 0.5,
  debug: false,
  urls: {},
}

export type CozyStore = GameStore<CozySnapshot>

export const useGameStore = createGameStore<CozySnapshot>(initialSnapshot)
