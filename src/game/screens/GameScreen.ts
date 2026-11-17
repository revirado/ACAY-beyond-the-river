import { CONFIG, VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/game/core/config'
import type { ScreenContext } from '@/game/core/context'
import type { Renderer } from '@/engine/render/Renderer'
import type { GameScreen as GameScreenContract } from '@/engine/core/ScreenManager'
import type { WorldObjectDef, Vec2 } from '@/game/core/types'
import { WORLD_LAYOUT } from '@/game/data/world'
import { CollisionSystem, solidToAABB, type SolidBody } from '@/game/logic/CollisionSystem'
import { axesToVector } from '@/game/logic/movement'
import { tOr } from '@/game/i18n'
import { evalAnim, phaseFromId } from '@/engine/render/anim'

interface Drawable {
  y: number
  draw: () => void
}

/**
 * GameScreen — gameplay del pueblo.
 * Movimiento vectorial (convención caballera) + colisiones + prompt de
 * interacción + transición a la escena de interacción. ESC abre el menú.
 */
export class GameScreen implements GameScreenContract {
  readonly id = 'gameplay' as const

  private solids: SolidBody[] = WORLD_LAYOUT.filter((o) => o.collision).map((o) => ({
    id: o.id,
    x: o.x,
    y: o.y,
    collider: o.collision!,
  }))
  private collision = new CollisionSystem(this.solids)
  private interactables: WorldObjectDef[] = WORLD_LAYOUT.filter((o) => o.interaction)
  private promptObject: WorldObjectDef | null = null
  private walkTimer = 0

  enter(_ctx: ScreenContext): void {
    this.promptObject = null
  }

  exit(_ctx: ScreenContext): void {
    this.promptObject = null
  }

  update(dt: number, ctx: ScreenContext): void {
    const st = ctx.state
    const input = ctx.input

    // ── Movimiento vectorial ──
    const axes = {
      up: input.isDown('ArrowUp') || input.isDown('KeyW'),
      down: input.isDown('ArrowDown') || input.isDown('KeyS'),
      left: input.isDown('ArrowLeft') || input.isDown('KeyA'),
      right: input.isDown('ArrowRight') || input.isDown('KeyD'),
    }
    const vec = axesToVector(axes, CONFIG.movementAngle)
    if (vec.x !== 0 || vec.y !== 0) {
      const dx = vec.x * CONFIG.playerSpeed * dt
      const dy = vec.y * CONFIG.playerSpeed * dt
      const moved = this.collision.tryMove({ x: st.player.x, y: st.player.y }, dx, dy, CONFIG.playerCollider)
      const b = CONFIG.worldBounds
      st.player.x = Math.min(b.maxX, Math.max(b.minX, moved.x))
      st.player.y = Math.min(b.maxY, Math.max(b.minY, moved.y))
      if (vec.x !== 0) st.player.facing = vec.x > 0 ? 1 : -1
      st.player.moving = true
      this.walkTimer += dt
      st.player.frame = Math.floor((this.walkTimer * 1000) / CONFIG.walkFrameMs) % 2 === 0 ? 0 : 1
    } else {
      st.player.moving = false
      this.walkTimer = 0
      st.player.frame = 0
    }

    // ── Detección de interacción (más cercano dentro del radio) ──
    let best: WorldObjectDef | null = null
    let bestDist = Infinity
    for (const obj of this.interactables) {
      const d = Math.hypot(st.player.x - obj.x, st.player.y - (obj.y - 20))
      if (d < CONFIG.interactRadius && d < bestDist) {
        best = obj
        bestDist = d
      }
    }
    this.promptObject = best

    // Interactuar: E o Enter (la barra espaciadora ya NO interactúa).
    if (
      best &&
      (input.wasPressed('KeyE') || input.wasPressed('Enter') || input.wasPressed('NumpadEnter'))
    ) {
      ctx.screens.requestSwitch('interaction', { objectId: best.id }, CONFIG.fade.fast)
      return
    }

    // ── Menú ──
    if (input.wasPressed('Escape')) {
      ctx.screens.requestSwitch('menu', undefined, null)
    }
  }

  render(renderer: Renderer, ctx: ScreenContext): void {
    // Fondo del pueblo
    renderer.image(ctx.assets.get('world.background'), VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, {
      anchor: 'center',
    })

    // Objetos + jugador ordenados por profundidad (y de la base).
    // Los assets con `anim` en el índice (pandeo, etc.) se deforman por frame:
    // evalAnim(anim, t) → skewX, fase por instancia para un campo de viento natural.
    const drawables: Drawable[] = []
    for (const obj of WORLD_LAYOUT) {
      const scale = obj.scale ?? 1
      const anim = ctx.assets.getAnim(obj.asset)
      drawables.push({
        y: obj.y,
        draw: () => {
          const skewX = anim ? evalAnim(anim, ctx.time, phaseFromId(obj.id)).skewX : 0
          renderer.image(ctx.assets.get(obj.asset), obj.x, obj.y, { scale, skewX })
        },
      })
    }
    const p = ctx.state.player
    const frameAsset = p.frame === 1 ? 'characters.player_map_f2' : 'characters.player_map_f1'
    drawables.push({
      y: p.y,
      draw: () => {
        renderer.image(ctx.assets.get(frameAsset), p.x, p.y, { flip: p.facing === -1 })
      },
    })
    drawables.sort((a, b) => a.y - b.y)
    for (const d of drawables) d.draw()

    if (ctx.debug) this.renderDebug(renderer, ctx)

    // ── Prompt de interacción ──
    if (this.promptObject) {
      const obj = this.promptObject
      const size = ctx.assets.getSize(obj.asset)
      const scale = obj.scale ?? 1
      const bounce = Math.sin(ctx.time * 4) * 4
      const py = obj.y - size.h * scale - 26 + bounce
      // Etiqueta del prompt: i18n con fallback al label del dato del mundo.
      const label = `[E] ${tOr(`world.actions.${obj.id}`, obj.interaction!.label)}`
      const w = renderer.textWidth(label, { size: 20, weight: 'bold' }) + 36
      renderer.roundRect(obj.x - w / 2, py - 30, w, 42, 21, 'rgba(255,250,235,0.95)')
      renderer.text(label, obj.x, py, {
        size: 20,
        weight: 'bold',
        color: '#4a3421',
        align: 'center',
        baseline: 'middle',
      })
    }

    renderer.vignette(0.16)
  }

  /** Depuración: colliders, caja del jugador y zonas de interacción (F3). */
  private renderDebug(renderer: Renderer, ctx: ScreenContext): void {
    for (const solid of this.solids) {
      const box = solidToAABB(solid)
      renderer.rect(box.x, box.y, box.w, box.h, 'rgba(217,83,79,0.35)')
      renderer.rect(box.x, box.y, box.w, 1.5, 'rgba(217,83,79,0.9)')
      renderer.rect(box.x, box.y + box.h - 1.5, box.w, 1.5, 'rgba(217,83,79,0.9)')
    }
    const p = ctx.state.player
    const pw = CONFIG.playerCollider.width
    const ph = CONFIG.playerCollider.height
    renderer.rect(p.x - pw / 2, p.y - ph, pw, ph, 'rgba(80,180,90,0.4)')
    renderer.ellipse(p.x, p.y - 20, CONFIG.interactRadius, CONFIG.interactRadius, 'rgba(230,182,85,0.12)')
    renderer.text(`x:${Math.round(p.x)} y:${Math.round(p.y)}`, p.x + 12, p.y + 4, {
      size: 13,
      color: '#fff7e0',
    })
  }
}
