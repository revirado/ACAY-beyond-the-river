import type { GameState } from '@/game/state/gameState'

export interface ProgressionStage {
  level: number
  name: string
  message: string
  condition: (state: GameState) => boolean
}

/**
 * Etapas de prosperidad del pueblo. Representadas como datos evaluables.
 * Al alcanzar una etapa, el skyline del HUD cambia visualmente.
 */
export const PROSPERITY_STAGES: ProgressionStage[] = [
  {
    level: 1,
    name: 'Aldea humilde',
    message: '¡Un horno nuevo calienta la plaza del pueblo!',
    condition: (s) => s.ovenUnlocked,
  },
  {
    level: 2,
    name: 'Pueblo en marcha',
    message: 'El comercio florece: 25 monedas ganadas para la villa.',
    condition: (s) => s.coinsEarned >= 25,
  },
  {
    level: 3,
    name: 'Pueblo próspero',
    message: 'Tus panes son famosos en la región.',
    condition: (s) => s.breadSold >= 3,
  },
  {
    level: 4,
    name: 'Villa floreciente',
    message: '¡La villa brilla con vida nueva! Los viajeros llegan a verte.',
    condition: (s) => s.coinsEarned >= 60,
  },
]

/** assetId del skyline correspondiente a un nivel de prosperidad (0..4). */
export function skylineAssetFor(prosperity: number): string {
  return `ui.skyline_${Math.max(0, Math.min(4, Math.floor(prosperity)))}`
}

/**
 * Evalúa las etapas de progresión sobre el estado.
 * Devuelve la etapa alcanzada (y actualiza prosperity) o null si no hay cambio.
 */
export function evaluateProgression(state: GameState): ProgressionStage | null {
  for (const stage of PROSPERITY_STAGES) {
    if (stage.level > state.prosperity && stage.condition(state)) {
      state.prosperity = stage.level
      return stage
    }
  }
  return null
}
