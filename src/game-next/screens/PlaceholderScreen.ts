import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { NewGameState } from '@/game-next/state/gameState'
import { t } from '@/engine/i18n'

/**
 * PlaceholderScreen — pantalla stub del nuevo juego.
 *
 * Demuestra que el motor arranca con un GameModule mínimo: dibuja un fondo
 * y un mensaje "READY FOR NEW GAME" sobre el canvas. Cuando llegue el brief,
 * esta pantalla se reemplaza por las pantallas reales del nuevo juego
 * (exploración/conversación, guitar-hero, etc.).
 */
export class PlaceholderScreen implements GameScreen<'placeholder', NewGameState> {
  readonly id = 'placeholder' as const

  enter(_ctx: ScreenContext<NewGameState>): void {
    // noop
  }

  exit(_ctx: ScreenContext<NewGameState>): void {
    // noop
  }

  update(_dt: number, ctx: ScreenContext<NewGameState>): void {
    // Tecla global: ESC podría abrir un menú (stub: por ahora no hace nada).
    void ctx
  }

  render(renderer: Renderer, ctx: ScreenContext<NewGameState>): void {
    // Fondo: gradiente vertical oscuro (placeholder, no cozy palette).
    renderer.gradientRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, [
      [0, '#1a1a1a'],
      [1, '#0a0a0a'],
    ])

    // Mensaje central.
    const title = t('placeholder.title')
    const subtitle = t('placeholder.subtitle')
    const hint = t('placeholder.hint')

    renderer.text(title, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 40, {
      size: 48,
      weight: 'bold',
      color: '#e6b655',
      align: 'center',
      baseline: 'middle',
      font: 'serif',
    })
    renderer.text(subtitle, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 10, {
      size: 24,
      color: '#b8bdbd',
      align: 'center',
      baseline: 'middle',
    })

    // Hint envuelto a ~80 chars por línea (stub simple).
    const words = hint.split(' ')
    const lines: string[] = []
    let line = ''
    for (const w of words) {
      if ((line + ' ' + w).length > 80) {
        lines.push(line.trim())
        line = w
      } else {
        line += ' ' + w
      }
    }
    if (line.trim()) lines.push(line.trim())
    lines.forEach((ln, i) => {
      renderer.text(ln, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 70 + i * 28, {
        size: 18,
        color: '#7e8484',
        align: 'center',
        baseline: 'middle',
      })
    })

    // Indicador de tiempo del motor (demo de que el loop corre).
    renderer.text(`engine time: ${ctx.time.toFixed(1)}s`, 20, VIRTUAL_HEIGHT - 20, {
      size: 14,
      color: '#5a5a6a',
      align: 'left',
      baseline: 'alphabetic',
    })

    renderer.vignette(0.3)
  }
}
