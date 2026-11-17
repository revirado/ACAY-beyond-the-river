import type { GameEngine } from '@/engine/core/GameEngine'

/**
 * Bridge React → Engine. El engine vive fuera del ciclo de vida de React
 * (se crea en useEffect del host React del juego); los overlays obtienen la
 * instancia por aquí para invocar acciones de UI.
 *
 * Genérico: no conoce el tipo concreto del juego (el GameEngine recibe el
 * GameModule en su constructor). Los overlays hacen cast al tipo concreto
 * del juego si necesitan acceder a acciones específicas.
 */
let instance: GameEngine | null = null

export function setEngineInstance(engine: GameEngine | null): void {
  instance = engine
}

export function getEngine(): GameEngine | null {
  return instance
}
