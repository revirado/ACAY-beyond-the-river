import type { DrawerDef } from '@/engine/assets/drawers'
import { PALETTE } from '@/game-next/core/config'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  DRAWERS — arte procedural mockup para ACAY / BEYOND THE RIVER.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Mockup: arte procedural Canvas 2D con paleta andina (terracota, ocre,
 * marrón, verde agostado, crema). SIN azul/índigo. Reemplazable vía el
 * índice de assets (editar src/game-next/data/assetIndex.ts).
 *
 * Drawers:
 *   - acay_back: Acay de espaldas (poncho + sombrero). Para batalla rítmica.
 *   - antagonist_ucumar / antagonist_shadow: siluetas de antagonistas.
 *   - explore_background: ribera del río Calchaquí (POV).
 *   - rhythm_track: pista en perspectiva para batalla rítmica.
 *   - narrative_*: elementos interactivos de la escena POV.
 */

type C = CanvasRenderingContext2D

/* ────────────────────── Helpers ────────────────────── */

function circle(ctx: C, cx: number, cy: number, r: number, color: string): void {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function poly(ctx: C, pts: Array<[number, number]>, color: string): void {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function rect(ctx: C, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

/* ────────────────────── Acay de espaldas ────────────────────── */

const acayBack: DrawerDef = {
  w: 120,
  h: 180,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.4, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    poly(ctx, [
      [cx - 28, 60], [cx + 28, 60],
      [cx + 48, h - 8], [cx - 48, h - 8],
    ], PALETTE.poncho)
    poly(ctx, [
      [cx - 28, 60], [cx - 18, 60],
      [cx - 30, h - 8], [cx - 48, h - 8],
    ], PALETTE.ponchoOscuro)
    rect(ctx, cx - 8, 48, 16, 16, PALETTE.ponchoOscuro)
    circle(ctx, cx, 38, 18, PALETTE.sombrero)
    ctx.beginPath()
    ctx.ellipse(cx, 30, 42, 10, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    rect(ctx, cx - 14, 14, 28, 18, PALETTE.sombrero)
    ctx.beginPath()
    ctx.arc(cx, 14, 14, Math.PI, 0)
    ctx.fillStyle = PALETTE.sombrero
    ctx.fill()
  },
}

/* ────────────────────── Antagonistas ────────────────────── */

const antagonistUcumar: DrawerDef = {
  w: 140,
  h: 200,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.42, 7, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    ctx.ellipse(cx, h - 70, 52, 80, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.antagonista
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, h - 70, 52, 80, 0, 0, Math.PI * 2)
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 2
    ctx.stroke()

    circle(ctx, cx, 50, 26, PALETTE.antagonista)
    poly(ctx, [[cx - 24, 38], [cx - 16, 18], [cx - 10, 36]], PALETTE.antagonista)
    poly(ctx, [[cx + 24, 38], [cx + 16, 18], [cx + 10, 36]], PALETTE.antagonista)
    circle(ctx, cx - 8, 48, 3, '#d9534f')
    circle(ctx, cx + 8, 48, 3, '#d9534f')
  },
}

const antagonistShadow: DrawerDef = {
  w: 120,
  h: 180,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.38, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    poly(ctx, [
      [cx - 24, 50], [cx + 24, 50],
      [cx + 36, h - 10], [cx - 36, h - 10],
    ], PALETTE.antagonista)
    circle(ctx, cx, 36, 20, PALETTE.antagonista)
    ctx.beginPath()
    ctx.ellipse(cx, 36, 20, 20, 0, 0, Math.PI * 2)
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 2
    ctx.stroke()
  },
}

/* ────────────────────── Escenario: ribera del río ────────────────────── */

const exploreBackground: DrawerDef = {
  w: 1280,
  h: 720,
  draw(ctx: C, w: number, h: number): void {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55)
    sky.addColorStop(0, PALETTE.cieloBajo)
    sky.addColorStop(1, PALETTE.tierra)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h * 0.55)

    const mountains: Array<[number, number, number]> = [
      [0, 380, 220], [180, 360, 260], [420, 380, 200],
      [620, 350, 280], [880, 380, 220], [1080, 360, 240],
    ]
    for (const [x, baseY, peakH] of mountains) {
      poly(ctx, [[x, baseY], [x + 180, baseY - peakH], [x + 360, baseY]], PALETTE.tierraOscura)
    }

    const river = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.62)
    river.addColorStop(0, '#6e6450')
    river.addColorStop(0.5, '#5a5440')
    river.addColorStop(1, '#4a4438')
    ctx.fillStyle = river
    ctx.fillRect(0, h * 0.5, w, h * 0.12)

    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.fillStyle = PALETTE.cieloBajo
    for (let i = 0; i < 8; i++) {
      const y = h * 0.5 + (i / 8) * h * 0.12 + 4
      ctx.fillRect(0, y, w, 2)
    }
    ctx.restore()

    const ground = ctx.createLinearGradient(0, h * 0.62, 0, h)
    ground.addColorStop(0, PALETTE.tierra)
    ground.addColorStop(1, PALETTE.tierraOscura)
    ctx.fillStyle = ground
    ctx.fillRect(0, h * 0.62, w, h * 0.38)

    ctx.save()
    ctx.fillStyle = PALETTE.piedraOscura
    const stones: Array<[number, number, number]> = [
      [120, 540, 14], [200, 580, 10], [340, 560, 18], [520, 600, 12],
      [680, 540, 16], [820, 590, 11], [980, 560, 15], [1140, 580, 13],
      [60, 660, 20], [280, 680, 16], [500, 670, 22], [740, 680, 18],
      [960, 670, 20], [1180, 680, 16],
    ]
    for (const [x, y, r] of stones) {
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    const vig = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 700)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(40,25,15,0.35)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, w, h)
  },
}

/* ────────────────────── Pista rítmica en perspectiva ────────────────────── */

const rhythmTrack: DrawerDef = {
  w: 1280,
  h: 720,
  draw(ctx: C, w: number, h: number): void {
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, '#2a1a10')
    bg.addColorStop(1, '#0f0a08')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    const lanes = 3
    const topY = h * 0.15
    const botY = h * 0.92
    const topHalfW = w * 0.12
    const botHalfW = w * 0.42
    const cx = w / 2

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(cx - topHalfW, topY)
    ctx.lineTo(cx + topHalfW, topY)
    ctx.lineTo(cx + botHalfW, botY)
    ctx.lineTo(cx - botHalfW, botY)
    ctx.closePath()
    const trackGrad = ctx.createLinearGradient(0, topY, 0, botY)
    trackGrad.addColorStop(0, PALETTE.laneBorde)
    trackGrad.addColorStop(1, PALETTE.lane)
    ctx.fillStyle = trackGrad
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(230,182,85,0.3)'
    ctx.lineWidth = 2
    for (let i = 0; i <= lanes; i++) {
      const t = i / lanes
      const topX = cx - topHalfW + t * topHalfW * 2
      const botX = cx - botHalfW + t * botHalfW * 2
      ctx.beginPath()
      ctx.moveTo(topX, topY)
      ctx.lineTo(botX, botY)
      ctx.stroke()
    }
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = PALETTE.acento
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.6
    const hitY = botY - 30
    const hitHalfW = botHalfW * 0.92
    ctx.beginPath()
    ctx.moveTo(cx - hitHalfW, hitY)
    ctx.lineTo(cx + hitHalfW, hitY)
    ctx.stroke()
    ctx.restore()
  },
}

/* ────────────────────── Elementos narrativos ────────────────────── */

const narrativeRock: DrawerDef = {
  w: 80, h: 60,
  draw(ctx: C, w: number, h: number): void {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(w / 2, h - 4, w * 0.4, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    poly(ctx, [
      [10, h - 8], [6, h * 0.4], [w * 0.3, 8],
      [w * 0.7, 6], [w - 8, h * 0.5], [w - 6, h - 8],
    ], PALETTE.piedra)
    poly(ctx, [
      [10, h - 8], [6, h * 0.4], [w * 0.35, h * 0.45], [w * 0.5, h - 8],
    ], PALETTE.piedraOscura)
  },
}

const narrativeTree: DrawerDef = {
  w: 100, h: 160,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.35, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    rect(ctx, cx - 8, h * 0.4, 16, h * 0.55, PALETTE.sombrero)
    ctx.save()
    ctx.strokeStyle = PALETTE.sombrero
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx, h * 0.45)
    ctx.lineTo(cx - 30, h * 0.25)
    ctx.moveTo(cx, h * 0.4)
    ctx.lineTo(cx + 28, h * 0.2)
    ctx.moveTo(cx - 4, h * 0.38)
    ctx.lineTo(cx - 20, h * 0.15)
    ctx.moveTo(cx + 4, h * 0.35)
    ctx.lineTo(cx + 24, h * 0.1)
    ctx.stroke()
    ctx.restore()
  },
}

const narrativeRuin: DrawerDef = {
  w: 140, h: 110,
  draw(ctx: C, w: number, h: number): void {
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(w / 2, h - 4, w * 0.45, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    poly(ctx, [
      [8, h - 8], [8, h * 0.3], [30, h * 0.2], [50, h * 0.35],
      [80, h * 0.15], [110, h * 0.3], [w - 8, h * 0.25], [w - 8, h - 8],
    ], PALETTE.tierraOscura)
    rect(ctx, w * 0.4, h * 0.5, 12, h * 0.4, '#0003')
    ctx.save()
    ctx.strokeStyle = PALETTE.tierra
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(12, h * 0.5 + i * 18)
      ctx.lineTo(w - 12, h * 0.5 + i * 18)
      ctx.stroke()
    }
    ctx.restore()
  },
}

const narrativeCoquena: DrawerDef = {
  w: 110, h: 150,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.38, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    poly(ctx, [
      [cx - 30, h * 0.3], [cx + 30, h * 0.3],
      [cx + 42, h - 8], [cx - 42, h - 8],
    ], PALETTE.ponchoOscuro)
    circle(ctx, cx, h * 0.28, 14, PALETTE.sombrero)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.24, 32, 7, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    ctx.save()
    ctx.globalAlpha = 0.5
    circle(ctx, cx + 38, h - 14, 8, PALETTE.acento)
    ctx.restore()
  },
}

/* ────────────────────── Registro ────────────────────── */

export const DRAWERS: Record<string, DrawerDef> = {
  acay_back: acayBack,
  antagonist_ucumar: antagonistUcumar,
  antagonist_shadow: antagonistShadow,
  explore_background: exploreBackground,
  rhythm_track: rhythmTrack,
  narrative_rock: narrativeRock,
  narrative_tree: narrativeTree,
  narrative_ruin: narrativeRuin,
  narrative_coquena: narrativeCoquena,
}
