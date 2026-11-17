import type { FadeConfig } from '@/engine/core/types'
import type { Renderer } from '@/engine/render/Renderer'

type FadePhase = 'idle' | 'toBlack' | 'hold' | 'fromBlack'

/**
 * FadeSystem — fundido a negro / revelado para transiciones de pantallas.
 *
 * Unidades: update(dt) recibe dt en SEGUNDOS (convención del engine) mientras
 * que las duraciones de FadeConfig están en MILISEGUNDOS → se convierte con
 * dt*1000 internamente.
 *
 * Fases de transition():
 *   toBlack (cfg.fadeIn ms) → al llegar alpha=1 llama onCovered UNA vez
 *   → hold (cfg.hold ms) → fromBlack (cfg.fadeOut ms) → al terminar onDone.
 * Con fadeIn=0 el cubierto es inmediato (alpha=1 en el mismo frame).
 */
export class FadeSystem {
  /** 0 = transparente, 1 = negro total. */
  alpha = 0

  private phase: FadePhase = 'idle'
  private timerMs = 0
  private fadeInMs = 0
  private holdMs = 0
  private fadeOutMs = 0
  /** Alpha desde la que partió la fase toBlack (evita saltos visuales). */
  private fromAlpha = 0
  private onCovered: (() => void) | null = null
  private coveredFired = false
  private onDone: (() => void) | null = null
  /** Guard: la fase hold se entra UNA sola vez por transición.
   *  Sin este flag, advanceAfterCover() re-entra en hold desde hold y la
   *  transición nunca termina (pantalla en negro eternamente). */
  private heldOnce = false

  /** true mientras hay una transición en curso (cualquier fase activa). */
  get busy(): boolean {
    return this.phase !== 'idle'
  }

  /**
   * Fundido a negro → onCovered (una vez, con la pantalla cubierta) → hold →
   * revelado → onDone. Si había otra transición en curso, la última intención
   * gana (esta llamada la reemplaza).
   */
  transition(cfg: FadeConfig, onCovered: () => void, onDone?: () => void): void {
    this.onCovered = onCovered
    this.onDone = onDone ?? null
    this.coveredFired = false
    this.heldOnce = false
    this.fadeInMs = Math.max(0, cfg.fadeIn)
    this.holdMs = Math.max(0, cfg.hold)
    this.fadeOutMs = Math.max(0, cfg.fadeOut)

    if (this.fadeInMs <= 0) {
      // Cubrir inmediato: sin fase toBlack.
      this.phase = 'hold'
      this.timerMs = 0
      this.alpha = 1
      this.fireCovered()
      this.advanceAfterCover()
    } else {
      this.phase = 'toBlack'
      this.timerMs = 0
      this.fromAlpha = this.alpha
    }
  }

  /** Parte de negro (alpha=1 sin transición) y revela en `duration` ms. */
  fadeIn(duration: number, onDone?: () => void): void {
    this.phase = 'fromBlack'
    this.timerMs = 0
    this.fadeInMs = 0
    this.holdMs = 0
    this.fadeOutMs = Math.max(0, duration)
    this.onCovered = null
    this.coveredFired = true
    this.onDone = onDone ?? null
    this.alpha = 1
  }

  /** dt en SEGUNDOS; las duraciones internas están en ms. */
  update(dt: number): void {
    if (this.phase === 'idle') return
    this.timerMs += dt * 1000 // conversión s → ms

    switch (this.phase) {
      case 'toBlack': {
        const t = this.fadeInMs > 0 ? Math.min(1, this.timerMs / this.fadeInMs) : 1
        this.alpha = this.fromAlpha + (1 - this.fromAlpha) * t
        if (t >= 1) {
          this.alpha = 1
          this.fireCovered()
          this.advanceAfterCover()
        }
        break
      }
      case 'hold':
        this.alpha = 1
        if (this.timerMs >= this.holdMs) this.advanceAfterCover()
        break
      case 'fromBlack': {
        const t = this.fadeOutMs > 0 ? Math.min(1, this.timerMs / this.fadeOutMs) : 1
        this.alpha = 1 - t
        if (t >= 1) this.finish()
        break
      }
    }
  }

  /** Dibuja la capa de fundido sobre todo lo demás. */
  draw(renderer: Renderer): void {
    if (this.alpha > 0.001) renderer.dim(this.alpha)
  }

  // ── Internos ──

  /** Tras cubrir: hold (si aplica, UNA vez) → revelado (si aplica) → fin. */
  private advanceAfterCover(): void {
    if (!this.heldOnce && this.holdMs > 0) {
      this.heldOnce = true
      this.phase = 'hold'
      this.timerMs = 0
      this.alpha = 1
      return
    }
    if (this.fadeOutMs > 0) {
      this.phase = 'fromBlack'
      this.timerMs = 0
      this.alpha = 1
      return
    }
    this.finish()
  }

  private fireCovered(): void {
    if (this.coveredFired) return
    this.coveredFired = true
    this.onCovered?.()
  }

  private finish(): void {
    this.phase = 'idle'
    this.alpha = 0
    this.timerMs = 0
    this.onCovered = null
    const done = this.onDone
    this.onDone = null
    done?.()
  }
}
