import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import { VIRTUAL_WIDTH } from '@/game/core/config'
import type { GameScreen } from '@/engine/core/ScreenManager'
import { t } from '@/game/i18n'

/**
 * MenuScreen — pausa sobre el gameplay congelado.
 * El mundo se sigue dibujando (atenuado) pero no se actualiza.
 * Los botones (Continuar/Volumen/Reiniciar) viven en el overlay React.
 */
export class MenuScreen implements GameScreen {
  readonly id = 'menu' as const

  constructor(private gameplay: GameScreen) {}

  enter(_ctx: ScreenContext): void {
    /* nada */
  }

  exit(_ctx: ScreenContext): void {
    /* nada */
  }

  update(_dt: number, ctx: ScreenContext): void {
    // ESC o clic en el canvas → continuar
    if (ctx.input.wasPressed('Escape') || ctx.input.consumeClick() !== null) {
      ctx.screens.requestSwitch('gameplay', undefined, null)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    // Escena congelada detrás
    this.gameplay.render(renderer, ctx)
    renderer.dim(0.55, '#241608')
    renderer.text(t('menu.pauseCanvas'), VIRTUAL_WIDTH / 2, 120, {
      size: 40,
      font: 'serif',
      weight: 'bold',
      color: '#f6e7cb',
      align: 'center',
    })
    renderer.vignette(0.3)
  }
}
