import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, CONFIG } from '@/game/core/config'
import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import { t } from '@/game/i18n'

/**
 * TitleScreen — pantalla de título.
 * El fondo lo dibuja el canvas (mundo procedural); los textos principales
 * los compone el overlay React. El canvas acepta ENTER/ESPACIO/clic para comenzar.
 */
export class TitleScreen implements GameScreen {
  readonly id = 'title' as const
  private blinkT = 0

  enter(_ctx: ScreenContext): void {
    this.blinkT = 0
  }

  exit(_ctx: ScreenContext): void {
    /* nada */
  }

  update(dt: number, ctx: ScreenContext): void {
    this.blinkT += dt
    const start =
      ctx.input.wasPressed('Enter') ||
      ctx.input.wasPressed('Space') ||
      ctx.input.wasPressed('KeyE') ||
      ctx.input.consumeClick() !== null
    if (start) {
      ctx.screens.requestSwitch('intro', undefined, CONFIG.fade.normal)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    // Fondo: el pueblo al atardecer con velo cálido
    renderer.image(ctx.assets.get('world.background'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
    })
    renderer.dim(0.42, '#2a1a0f')
    renderer.vignette(0.45)

    // Marco decorativo del título
    const cx = VIRTUAL_WIDTH / 2
    renderer.roundRect(cx - 420, 150, 840, 200, 24, 'rgba(63,45,29,0.55)')
    renderer.text('Something Far Greater', cx, 240, {
      size: 74,
      font: 'serif',
      weight: 'bold',
      color: '#f6e7cb',
      align: 'center',
    })
    renderer.text(t('title.subtitle'), cx, 300, {
      size: 26,
      font: 'serif',
      color: '#e8d9b8',
      align: 'center',
    })

    // Indicación parpadeante (respaldo del botón React)
    if (Math.sin(this.blinkT * 3.2) > -0.25) {
      renderer.text(t('title.prompt'), cx, 500, {
        size: 24,
        font: 'sans',
        color: '#fff7e0',
        align: 'center',
      })
    }
  }
}
