/**
 * Contexto ESPECÍFICO del juego cozy: re-exporta el ScreenContext genérico del
 * motor tipado con CozyGameState. Las screens cozy importan desde aquí
 * (`@/game/core/context`) como antes — reciben el ctx fuertemente tipado con
 * el estado cozy (player, coins, inventory, etc.).
 */
import type { ScreenContext as EngineScreenContext } from '@/engine/core/context'
import type { UiBridge as EngineUiBridge } from '@/engine/core/types'
import type { CozyGameState } from '@/game/state/gameState'
import type { UIInteractionState } from '@/game/core/types'

/** ScreenContext del motor tipado con el estado cozy. */
export type ScreenContext = EngineScreenContext<CozyGameState>

/**
 * UiBridge cozy: extiende el del motor con tipado fuerte para setInteraction
 * (UIInteractionState cozy en vez de unknown). Compatible estructuralmente.
 */
export interface UiBridge extends EngineUiBridge {
  setInteraction: (state: UIInteractionState | null) => void
}
