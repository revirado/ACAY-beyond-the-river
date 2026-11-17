import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { AcayGameState } from '@/game-next/state/gameState'
import { CONFIG } from '@/game-next/core/config'
import { CONTROLS, wasAnyPressed } from '@/game-next/core/controls'

type TitlePhase = 'fadeIn' | 'hold' | 'bgFadeOut' | 'titleFadeOut' | 'delay' | 'done'

/**
 * TitleScreen — pantalla de título del juego (entre studio y explore).
 *
 * Fondo negro + asset del título (placeholder "ACAY" / "Beyond the river").
 *
 * Secuencia de fades (brief 10.7):
 *   1. fadeIn: bg + título aparecen juntos (fadeInMs).
 *   2. hold: ambos full (holdMs).
 *   3. bgFadeOut: el fondo negro hace fade out PRIMERO (el título sigue full).
 *   4. titleFadeOut: el título hace fade out DESPUÉS.
 *   5. delay: 1s con pantalla vacía.
 *   6. → explore.
 *
 * Saltable con Enter/Space/ESC/clic → salta directo a explore.
 */
export class TitleScreen implements GameScreen<'title', AcayGameState> {
  readonly id = 'title' as const

  private elapsed = 0
  private phase: TitlePhase = 'fadeIn'
  private bgAlpha = 0
  private titleAlpha = 0

  enter(_ctx: ScreenContext<AcayGameState>): void {
    this.reset()
  }

  exit(_ctx: ScreenContext<AcayGameState>): void {
    this.reset()
  }

  private reset(): void {
    this.elapsed = 0
    this.phase = 'fadeIn'
    this.bgAlpha = 0
    this.titleAlpha = 0
  }

  update(dt: number, ctx: ScreenContext<AcayGameState>): void {
    this.elapsed += dt * 1000 // ms
    const cfg = CONFIG.title

    // Máquina de fases
    switch (this.phase) {
      case 'fadeIn': {
        const t = Math.min(1, this.elapsed / cfg.fadeInMs)
        this.bgAlpha = t
        this.titleAlpha = t
        if (this.elapsed >= cfg.fadeInMs) {
          this.phase = 'hold'
          this.elapsed = 0
        }
        break
      }
      case 'hold': {
        this.bgAlpha = 1
        this.titleAlpha = 1
        if (this.elapsed >= cfg.holdMs) {
          this.phase = 'bgFadeOut'
          this.elapsed = 0
        }
        break
      }
      case 'bgFadeOut': {
        // El fondo hace fade out PRIMERO; el título sigue full.
        const t = Math.min(1, this.elapsed / cfg.bgFadeOutMs)
        this.bgAlpha = 1 - t
        this.titleAlpha = 1
        if (this.elapsed >= cfg.bgFadeOutMs) {
          this.phase = 'titleFadeOut'
          this.elapsed = 0
        }
        break
      }
      case 'titleFadeOut': {
        // El título hace fade out DESPUÉS; el bg ya está en 0.
        const t = Math.min(1, this.elapsed / cfg.titleFadeOutMs)
        this.bgAlpha = 0
        this.titleAlpha = 1 - t
        if (this.elapsed >= cfg.titleFadeOutMs) {
          this.phase = 'delay'
          this.elapsed = 0
        }
        break
      }
      case 'delay': {
        // 1s con pantalla vacía antes de habilitar el juego.
        this.bgAlpha = 0
        this.titleAlpha = 0
        if (this.elapsed >= cfg.delayMs) {
          this.phase = 'done'
        }
        break
      }
      case 'done': {
        // Transición a explore.
        break
      }
    }

    // Saltar: skip (Enter/Space/ESC) o clic → directo a explore.
    if (wasAnyPressed(ctx.input, CONTROLS.skip) || ctx.input.consumeClick()) {
      this.phase = 'done'
    }

    if (this.phase === 'done') {
      ctx.screens.requestSwitch('explore', undefined, CONFIG.fade.normal)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext<AcayGameState>): void {
    const cfg = CONFIG.title

    // Fondo negro (con su alpha)
    if (this.bgAlpha > 0.001) {
      renderer.clear(cfg.background)
      // Overlay negro con alpha (clear no soporta alpha, usamos rect)
      renderer.rect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, cfg.background, this.bgAlpha)
    }

    // Título (asset) con su alpha
    if (this.titleAlpha > 0.001) {
      try {
        const img = ctx.assets.get(cfg.titleAsset)
        renderer.image(img, VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
          scale: cfg.titleScale,
          anchor: 'center',
          alpha: this.titleAlpha,
        })
      } catch {
        // Placeholder text si el asset no cargó
        renderer.text('ACAY', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 - 30, {
          size: 96,
          weight: 'bold',
          color: '#ffffff',
          align: 'center',
          baseline: 'middle',
          font: 'serif',
          alpha: this.titleAlpha,
        })
        renderer.text('Beyond the river', VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2 + 40, {
          size: 28,
          color: 'rgba(230,182,85,0.9)',
          align: 'center',
          baseline: 'middle',
          font: 'serif',
          alpha: this.titleAlpha,
        })
      }
    }
  }
}
