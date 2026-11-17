import type { FadeConfig } from '@/engine/core/types'
import type { ScreenContext } from '@/engine/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import { FadeSystem } from '@/engine/core/FadeSystem'

/**
 * Contrato que toda pantalla del juego debe cumplir. El id es string
 * genérico (TScreenId); el juego acota con su unión concreta de ScreenId.
 */
export interface GameScreen<TScreenId extends string = string> {
  readonly id: TScreenId
  enter(ctx: ScreenContext, params?: unknown): void
  exit(ctx: ScreenContext): void
  update(dt: number, ctx: ScreenContext): void
  render(renderer: Renderer, ctx: ScreenContext): void
}

interface PendingSwitch {
  id: string
  params?: unknown
  /** null/undefined → cambio inmediato sin fundido. */
  fade: FadeConfig | null
}

/**
 * ScreenManager — registro, cambio y orden de dibujo de las pantallas.
 *
 * Genérico: no conoce qué pantallas existen (las registra el GameModule vía
 * engine.registerScreens). Solo maneja el cambio con/sin fade y el orden de
 * dibujo (pantalla actual + capa de fade encima).
 *
 * Flujo de cambio (el engine llama en este orden cada frame):
 *   screen.update(dt, ctx) → screens.update(dt, ctx) → screens.applyPending(ctx)
 *
 * - requestSwitch guarda la petición (última intención gana si llega otra
 *   durante una transición: se reemplaza el pendiente).
 * - applyPending ejecuta la petición cuando el fade no está ocupado:
 *   con fade configurado inicia la transición y el doSwitch ocurre en
 *   onCovered (pantalla ya en negro); con fade null/undefined cambia al momento.
 * - Mientras isTransitioning, el engine puede congelar el update de la pantalla
 *   actual pero debe seguir renderizando (aquí se dibuja siempre el fade encima).
 */
export class ScreenManager {
  readonly fade = new FadeSystem()

  private screens = new Map<string, GameScreen>()
  private currentScreen: GameScreen | null = null
  private pending: PendingSwitch | null = null

  register(screen: GameScreen): void {
    this.screens.set(screen.id, screen)
  }

  get current(): GameScreen | null {
    return this.currentScreen
  }

  get currentId(): string | null {
    return this.currentScreen ? this.currentScreen.id : null
  }

  /** true mientras el FadeSystem esté animando (toBlack/hold/fromBlack). */
  get isTransitioning(): boolean {
    return this.fade.busy
  }

  /** Pide cambiar a otra pantalla; se aplicará en el próximo applyPending. */
  requestSwitch(id: string, params?: unknown, fade?: FadeConfig | null): void {
    this.pending = { id, params, fade: fade ?? null }
  }

  /** Aplica el cambio pendiente si el fade está libre. */
  applyPending(ctx: ScreenContext): void {
    if (!this.pending || this.fade.busy) return
    const req = this.pending
    this.pending = null
    if (req.fade) {
      // Capturamos req en el closure: un requestSwitch posterior durante el
      // fade no altera el destino de la transición ya iniciada.
      this.fade.transition(req.fade, () => this.doSwitch(ctx, req))
    } else {
      this.doSwitch(ctx, req)
    }
  }

  update(dt: number, ctx: ScreenContext): void {
    this.fade.update(dt)
    void ctx
  }

  /** Dibuja la pantalla actual y, encima, la capa de fundido. */
  render(renderer: Renderer, ctx: ScreenContext): void {
    if (this.currentScreen) this.currentScreen.render(renderer, ctx)
    this.fade.draw(renderer)
  }

  /** exit de la pantalla actual → enter de la nueva. */
  private doSwitch(ctx: ScreenContext, req: PendingSwitch): void {
    const next = this.screens.get(req.id)
    if (!next) {
      console.warn(`ScreenManager: pantalla desconocida "${req.id}"`)
      return
    }
    if (this.currentScreen) this.currentScreen.exit(ctx)
    this.currentScreen = next
    next.enter(ctx, req.params)
  }
}
