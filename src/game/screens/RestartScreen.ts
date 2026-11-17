import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'

/**
 * RestartScreen — confirmación de reinicio sobre el gameplay atenuado.
 * El diálogo de confirmación vive en el overlay React.
 */
export class RestartScreen implements GameScreen {
  readonly id = 'restart' as const

  constructor(private gameplay: GameScreen) {}

  enter(_ctx: ScreenContext): void {
    /* nada */
  }

  exit(_ctx: ScreenContext): void {
    /* nada */
  }

  update(_dt: number, ctx: ScreenContext): void {
    // ESC o clic fuera del diálogo → volver al menú
    if (ctx.input.wasPressed('Escape') || ctx.input.consumeClick() !== null) {
      ctx.screens.requestSwitch('menu', undefined, null)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    this.gameplay.render(renderer, ctx)
    renderer.dim(0.68, '#1c1006')
    renderer.vignette(0.35)
  }
}
