import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { AcayGameState } from '@/game-next/state/gameState'
import { CONFIG } from '@/game-next/core/config'

/**
 * StudioScreen — intro del estudio (logo WrongMeca, solo 1ra carga).
 *
 * Usa el ÚNICO asset real conservado: /assets/ui/wrongmeca.png (logo del
 * estudio). Envolvente temporal: fade in → hold → fade out → transición a
 * explore. Saltable con Enter/Space/ESC/clic.
 */
export class StudioScreen implements GameScreen<'studio', AcayGameState> {
  readonly id = 'studio' as const

  private elapsed = 0
  private logoAlpha = 0
  private done = false

  enter(_ctx: ScreenContext<AcayGameState>): void {
    this.elapsed = 0
    this.logoAlpha = 0
    this.done = false
  }

  exit(_ctx: ScreenContext<AcayGameState>): void {
    this.elapsed = 0
    this.logoAlpha = 0
    this.done = false
  }

  update(dt: number, ctx: ScreenContext<AcayGameState>): void {
    this.elapsed += dt * 1000 // ms
    const cfg = CONFIG.studio
    const total = cfg.fadeInMs + cfg.holdMs + cfg.fadeOutMs

    // Envolvente del logo: fade in → hold → fade out
    if (this.elapsed < cfg.fadeInMs) {
      this.logoAlpha = this.elapsed / cfg.fadeInMs
    } else if (this.elapsed < cfg.fadeInMs + cfg.holdMs) {
      this.logoAlpha = 1
    } else if (this.elapsed < total) {
      this.logoAlpha = 1 - (this.elapsed - cfg.fadeInMs - cfg.holdMs) / cfg.fadeOutMs
    } else {
      this.logoAlpha = 0
      this.done = true
    }

    // Saltar: Enter/Space/ESC/clic
    if (
      ctx.input.wasPressed('Enter') ||
      ctx.input.wasPressed('Space') ||
      ctx.input.wasPressed('Escape') ||
      ctx.input.wasPressed('NumpadEnter') ||
      ctx.input.consumeClick()
    ) {
      this.done = true
    }

    if (this.done) {
      ctx.screens.requestSwitch('explore', undefined, CONFIG.fade.normal)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext<AcayGameState>): void {
    renderer.clear(CONFIG.studio.background)

    const cfg = CONFIG.studio
    const alpha = Math.max(0, Math.min(1, this.logoAlpha))
    try {
      const img = ctx.assets.get(cfg.logoAsset)
      renderer.image(img, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
        scale: cfg.logoScale,
        anchor: 'center',
        alpha,
      })
    } catch {
      renderer.text('WrongMeca Studios', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
        size: 42,
        weight: 'bold',
        color: '#f3e3c2',
        align: 'center',
        baseline: 'middle',
        font: 'serif',
        alpha,
      })
    }
  }
}
