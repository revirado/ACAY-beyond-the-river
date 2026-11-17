import { CONFIG, VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/game/core/config'
import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'

/**
 * StudioScreen — intro del estudio del desarrollador (SOLO primera carga).
 *
 * Secuencia: pantalla de color sólido → logo con fade in → hold → fade out
 * → pasa normalmente a la secuencia existente (título).
 * No complica el preloader: es una pantalla más registrada en el ScreenManager.
 *
 * Configuración (sin tocar código):
 *  - Color de fondo: CONFIG.studio.background (por defecto blanco).
 *  - Logo: entrada `ui.studio_logo` del ÍNDICE DE ASSETS (placeholder por
 *    defecto → reemplazable por PNG/URL real sin tocar código).
 */
export class StudioScreen implements GameScreen {
  readonly id = 'studio' as const
  private t = 0
  private leaving = false

  enter(_ctx: ScreenContext): void {
    this.t = 0
    this.leaving = false
  }

  exit(_ctx: ScreenContext): void {
    /* nada */
  }

  update(dt: number, ctx: ScreenContext): void {
    if (this.leaving) return

    const cfg = CONFIG.studio
    this.t += dt

    // Saltable con cualquier gesto estándar (no obliga a esperar).
    const skipped =
      ctx.input.wasPressed('Enter') ||
      ctx.input.wasPressed('Space') ||
      ctx.input.wasPressed('Escape') ||
      ctx.input.consumeClick() !== null

    const totalSec = (cfg.fadeInMs + cfg.holdMs + cfg.fadeOutMs) / 1000
    if (skipped || this.t >= totalSec) {
      this.leaving = true
      ctx.screens.requestSwitch('title', undefined, skipped ? CONFIG.fade.fast : CONFIG.fade.normal)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    const cfg = CONFIG.studio

    // Fondo sólido configurable (blanco por defecto).
    renderer.rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, cfg.background)

    // Logo centrado con envolvente fade in → hold → fade out.
    const inSec = cfg.fadeInMs / 1000
    const holdSec = cfg.holdMs / 1000
    const outSec = cfg.fadeOutMs / 1000

    let alpha: number
    if (this.t < inSec) {
      alpha = inSec > 0 ? this.t / inSec : 1
    } else if (this.t < inSec + holdSec) {
      alpha = 1
    } else {
      alpha = outSec > 0 ? Math.max(0, 1 - (this.t - inSec - holdSec) / outSec) : 0
    }

    renderer.image(ctx.assets.get(cfg.logoAsset), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
      scale: cfg.logoScale,
      alpha: Math.min(1, Math.max(0, alpha)),
    })
  }
}
