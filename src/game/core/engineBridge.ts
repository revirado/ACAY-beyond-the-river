import {
  getEngine as getEngineBase,
  setEngineInstance as setEngineInstanceBase,
} from '@/engine/core/engineBridge'
import type { GameEngine } from '@/engine/core/GameEngine'
import type { CozyGameState } from '@/game/state/gameState'
import type { CozySnapshot, UIInteractionState } from '@/game/core/types'

/**
 * Engine cozy tipado. Las overlays React importan `getEngine` desde aquí y
 * obtienen el engine con tipado fuerte para `actions`, `state`, etc.
 */
export type CozyEngine = GameEngine<CozyGameState, CozySnapshot>

/**
 * Bridge React → Engine cozy. Re-exporta los del motor con tipado cozy.
 * El engine vive fuera del ciclo de vida de React (se crea en useEffect del
 * host React); las overlays obtienen la instancia por aquí.
 */
export function getEngine(): CozyEngine | null {
  return getEngineBase() as CozyEngine | null
}

export function setEngineInstance(engine: CozyEngine | null): void {
  setEngineInstanceBase(engine as unknown as GameEngine | null)
}

/** Helper para publicar el estado de interacción cozy al engine (UiBridge). */
export function setInteraction(state: UIInteractionState | null): void {
  getEngineBase()?.setInteraction(state)
}
