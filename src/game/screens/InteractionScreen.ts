import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/game/core/config'
import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import { INTERACTION_HANDLERS, findWorldObject } from '@/game/logic/interactions'

/**
 * InteractionScreen — escena de interacción.
 * Contenedor ÚNICO a pantalla completa (sin división en filas): JUGADOR
 * (izquierda) e INTERLOCUTOR/OBJETO (derecha) anclados ABAJO ("gravedad":
 * la base apoya al pie de la escena, con margen para que el HUD no tape del
 * todo la base de los assets). El panel de opciones (diálogo/comercio) lo
 * dibuja el overlay React, flotando POR ENCIMA a la mitad de la pantalla.
 */
export class InteractionScreen implements GameScreen {
  readonly id = 'interaction' as const
  private objectId = ''

  enter(ctx: ScreenContext, params?: unknown): void {
    const p = (params ?? {}) as { objectId?: string }
    this.objectId = p.objectId ?? ''
    this.pushInteraction(ctx, null)
  }

  exit(ctx: ScreenContext): void {
    ctx.ui.setInteraction(null)
  }

  update(_dt: number, ctx: ScreenContext): void {
    // Cierre por teclado o clic fuera del panel (el panel React es independiente)
    if (
      ctx.input.wasPressed('Escape') ||
      ctx.input.wasPressed('Backspace') ||
      ctx.input.consumeClick() !== null
    ) {
      this.close(ctx)
    }
  }

  private close(ctx: ScreenContext): void {
    ctx.screens.requestSwitch('gameplay', undefined, CONFIG_FADE_FAST)
  }

  /** Reconstruye el snapshot de UI para el objeto actual. */
  pushInteraction(ctx: ScreenContext, resultMessage: string | null): void {
    const obj = findWorldObject(this.objectId)
    if (!obj?.interaction) {
      this.close(ctx)
      return
    }
    const handler = INTERACTION_HANDLERS[obj.interaction.type]
    const built = handler.build(obj.id, ctx.state, ctx.assets)
    ctx.ui.setInteraction({ ...built, resultMessage })
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    // ── Contenedor único a pantalla completa: personajes anclados ABAJO ──
    // "Gravedad": la base de los assets apoya cerca del pie de la pantalla,
    // dejando 120px virtuales de margen para que la UI principal (HUD) no
    // tape del todo su base.
    const BASE_Y = VIRTUAL_HEIGHT - 120
    // Personajes bien separados hacia los laterales: el panel React (max-w-2xl,
    // anclado a mitad de pantalla) flota ENTRE MEDIO de los dos, estilo novela
    // visual (la escena queda detrás de la caja de diálogo).
    const xPlayer = 160
    const xTarget = 1120

    // Fondo cálido de la escena
    renderer.gradientRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, [
      [0, '#5a3f28'],
      [0.5, '#6f4e33'],
      [1, '#43301f'],
    ])

    // Resplandores suaves tras cada personaje
    renderer.ellipse(xPlayer, 520, 220, 120, 'rgba(255,220,160,0.10)')
    renderer.ellipse(xTarget, 520, 220, 120, 'rgba(255,220,160,0.08)')

    // Sombras en el suelo (justo bajo la base de cada personaje)
    renderer.ellipse(xPlayer, BASE_Y + 4, 105, 14, 'rgba(0,0,0,0.28)')
    renderer.ellipse(xTarget, BASE_Y + 4, 105, 14, 'rgba(0,0,0,0.28)')

    // Jugador detallado (izquierda) — siempre del mismo lado, anclado abajo
    renderer.image(ctx.assets.get('characters.player_detail'), xPlayer, BASE_Y, { scale: 0.8 })

    // Interlocutor detallado (derecha), anclado abajo
    const obj = findWorldObject(this.objectId)
    const targetAsset = obj?.interaction?.type === 'merchant'
      ? 'characters.merchant_detail'
      : obj?.asset ?? 'world.oven_01'
    const targetScale = obj?.interaction?.type === 'merchant' ? 1.4 : 1.1
    renderer.image(ctx.assets.get(targetAsset), xTarget, BASE_Y, { scale: targetScale })

    renderer.vignette(0.3)
  }
}

const CONFIG_FADE_FAST = { fadeIn: 200, hold: 0, fadeOut: 200 }
