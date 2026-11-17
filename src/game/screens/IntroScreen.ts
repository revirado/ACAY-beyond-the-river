import { CONFIG, VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/game/core/config'
import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen } from '@/engine/core/ScreenManager'
import { PLAYER_START } from '@/game/data/world'
import { t } from '@/game/i18n'

/**
 * IntroScreen — secuencia inicial (una vez por partida).
 * Fondo estático + título + jugador montado en su burro desplazándose
 * horizontalmente hacia la puerta del pueblo, con animación de 2 frames.
 * Al llegar a la puerta: transición al gameplay.
 */
export class IntroScreen implements GameScreen {
  readonly id = 'intro' as const
  private t = 0
  private arrived = false
  private arrivalTimer = 0

  enter(_ctx: ScreenContext): void {
    this.t = 0
    this.arrived = false
    this.arrivalTimer = 0
  }

  exit(_ctx: ScreenContext): void {
    /* nada */
  }

  update(dt: number, ctx: ScreenContext): void {
    this.t += dt

    // Saltable
    if (
      ctx.input.wasPressed('Enter') ||
      ctx.input.wasPressed('Space') ||
      ctx.input.wasPressed('Escape') ||
      ctx.input.consumeClick() !== null
    ) {
      this.finish(ctx)
      return
    }

    const cfg = CONFIG.intro
    const x = cfg.startX + this.t * cfg.speed
    ctx.state.player.x = x
    ctx.state.player.y = cfg.y
    ctx.state.player.facing = 1
    ctx.state.player.frame = Math.floor((this.t * 1000) / cfg.frameMs) % 2 === 0 ? 0 : 1
    ctx.state.player.moving = true

    if (!this.arrived && x >= cfg.endX) {
      this.arrived = true
      this.arrivalTimer = cfg.arrivalDelay / 1000
    }
    if (this.arrived) {
      this.arrivalTimer -= dt
      if (this.arrivalTimer <= 0) this.finish(ctx)
    }
  }

  private finish(ctx: ScreenContext): void {
    ctx.state.introCompleted = true
    // El jugador "entró por la puerta": aparece dentro del pueblo, junto al arco
    ctx.state.player.x = PLAYER_START.x
    ctx.state.player.y = PLAYER_START.y
    ctx.state.player.facing = 1
    ctx.state.player.moving = false
    ctx.state.player.frame = 0
    ctx.state.markChanged()
    ctx.screens.requestSwitch('gameplay', undefined, CONFIG.fade.normal)
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    const cfg = CONFIG.intro
    renderer.image(ctx.assets.get('world.intro_background'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
    })

    // Jugador montado en el burro (2 frames de caminata)
    const frameAsset =
      ctx.state.player.frame === 1 ? 'characters.player_map_f2' : 'characters.player_map_f1'
    renderer.image(ctx.assets.get(frameAsset), ctx.state.player.x, cfg.y, { scale: 1.25 })

    // Título con aparición suave
    const titleAlpha = Math.min(1, this.t / 1.6)
    renderer.text('ACAY', VIRTUAL_WIDTH / 2, 130, {
      size: 58,
      font: 'serif',
      weight: 'bold',
      color: '#3fb64f',
      align: 'center',
      alpha: titleAlpha,
    })
    renderer.text(t('intro.subtitle'), VIRTUAL_WIDTH / 2, 180, {
      size: 24,
      font: 'serif',
      color: '#f0e2c4',
      align: 'center',
      alpha: titleAlpha,
    })

    renderer.text(t('intro.skip'), VIRTUAL_WIDTH - 40, VIRTUAL_HEIGHT - 130, {
      size: 18,
      font: 'sans',
      color: 'rgba(255,247,224,0.85)',
      align: 'right',
    })
    renderer.vignette(0.25)
  }
}
