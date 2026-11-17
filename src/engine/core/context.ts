import type { Renderer } from '@/engine/render/Renderer'
import type { InputManager } from '@/engine/input/InputManager'
import type { AudioManager } from '@/engine/audio/AudioManager'
import type { AssetLoader } from '@/engine/assets/AssetLoader'
import type { ScreenManager } from '@/engine/core/ScreenManager'
import type { GameStateContract, UiBridge } from '@/engine/core/types'

/**
 * Contexto entregado a cada pantalla del juego. El motor lo construye y lo
 * pasa a update() / render() / enter() / exit() de cada GameScreen.
 * Incluye los servicios del motor (renderer, input, audio, assets, screens,
 * ui, toast, syncUI) y el estado del juego (state, tipado por el módulo).
 *
 * Los imports de servicios son type-only (evitan ciclos de runtime entre
 * core/context, core/ScreenManager y los módulos de servicio).
 */
export interface ScreenContext<TState extends GameStateContract = GameStateContract> {
  renderer: Renderer
  input: InputManager
  audio: AudioManager
  assets: AssetLoader
  state: TState
  screens: ScreenManager
  ui: UiBridge
  toast: (text: string) => void
  syncUI: () => void
  /** Segundos transcurridos desde el inicio del engine. */
  time: number
  debug: boolean
}
