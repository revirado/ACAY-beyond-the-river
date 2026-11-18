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
 *   - rocks_in_river: rocas atrapadas en el río (escena 01).
 *   - campamento_background: fondo del campamento del gaucho (escena 02).
 *   - gaucho_sleeping / gaucho_awake / cardon / kettle / wood_pile / firepit_ashes:
 *     elementos de la escena 02 (campamento del gaucho).
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

/* ────────────────────── Logo del título (placeholder de texto) ────────────────────── */

/**
 * title_logo: placeholder del título del juego. Dibuja "ACAY" (grande,
 * serif, blanco) centrado arriba y "Beyond the river" (más chico, debajo).
 * Reemplazable por una imagen real via el índice:
 *   'ui.title_logo': { type: 'file', src: '/assets/ui/title.png' }
 */
const titleLogo: DrawerDef = {
  w: 800,
  h: 280,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // "ACAY" — grande, serif, blanco
    ctx.save()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 120px Georgia, "Times New Roman", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Sombra sutil
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3
    ctx.fillText('ACAY', cx, h * 0.38)
    ctx.restore()
    // "Beyond the river" — más chico, debajo
    ctx.save()
    ctx.fillStyle = 'rgba(230,182,85,0.9)'
    ctx.font = 'italic 32px Georgia, "Times New Roman", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Beyond the river', cx, h * 0.72)
    ctx.restore()
  },
}

/* ────────────────────── Elementos pickup (guitarra, reliquia) ────────────────────── */

const narrativeGuitar: DrawerDef = {
  w: 70, h: 100,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.35, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    // Cuerpo (óvalo terracota)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.65, w * 0.32, h * 0.25, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.poncho
    ctx.fill()
    // Mástil (rect marrón)
    rect(ctx, cx - 4, h * 0.1, 8, h * 0.45, PALETTE.sombrero)
    // Cabeza
    rect(ctx, cx - 6, h * 0.05, 12, 8, PALETTE.sombreroAla)
    // Puente (línea oscura)
    rect(ctx, cx - 8, h * 0.7, 16, 3, PALETTE.sombrero)
    // Cuerdas (líneas finas)
    ctx.save()
    ctx.strokeStyle = '#f3e3c2'
    ctx.lineWidth = 0.8
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i, h * 0.1)
      ctx.lineTo(cx + i * 1.5, h * 0.78)
      ctx.stroke()
    }
    ctx.restore()
  },
}

const narrativeRelic: DrawerDef = {
  w: 50, h: 60,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.3, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()
    // Reliquia (piedra tallada dorada)
    poly(ctx, [
      [cx - 16, h - 8], [cx - 14, h * 0.3], [cx - 6, 8],
      [cx + 6, 8], [cx + 14, h * 0.3], [cx + 16, h - 8],
    ], PALETTE.dorado)
    // Símbolo tallado (línea oscura)
    ctx.save()
    ctx.strokeStyle = PALETTE.sombrero
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - 8, h * 0.4)
    ctx.lineTo(cx + 8, h * 0.4)
    ctx.moveTo(cx, h * 0.3)
    ctx.lineTo(cx, h * 0.7)
    ctx.stroke()
    ctx.restore()
    // Brillo
    ctx.save()
    ctx.globalAlpha = 0.4
    poly(ctx, [[cx - 10, h - 10], [cx - 8, h * 0.35], [cx - 3, h * 0.35], [cx - 5, h - 10]], '#fff')
    ctx.restore()
  },
}

/* ────────────────────── Acay inconsciente (tirado en el suelo) ────────────────────── */

/**
 * acay_unconscious: Acay tirado en el suelo de costado, inconsciente.
 * Poncho + sombrero. Rostro NO visible (sombrero tapa). Respiración sutil
 * via `anim` en el assetIndex (pandeo muy chico, período 3s).
 */
const acayUnconscious: DrawerDef = {
  w: 140, h: 70,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 3, w * 0.42, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Cuerpo acostado (poncho — óvalo terracota horizontal)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.55, w * 0.38, h * 0.32, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.poncho
    ctx.fill()
    // Sombra del poncho
    ctx.beginPath()
    ctx.ellipse(cx + w * 0.1, h * 0.55, w * 0.28, h * 0.22, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.ponchoOscuro
    ctx.fill()

    // Cabeza (sombra bajo sombrero — sin rostro visible)
    circle(ctx, cx - w * 0.3, h * 0.45, 16, PALETTE.sombrero)
    // Sombrero (ala ancha, cubre la cabeza/cara)
    ctx.beginPath()
    ctx.ellipse(cx - w * 0.3, h * 0.4, 30, 7, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    rect(ctx, cx - w * 0.3 - 10, h * 0.28, 20, 12, PALETTE.sombrero)

    // Piernas (bajo el poncho, asoman dos botitas)
    rect(ctx, cx + w * 0.25, h * 0.65, 14, 10, PALETTE.sombrero)
    rect(ctx, cx + w * 0.15, h * 0.65, 14, 10, PALETTE.sombrero)
  },
}

/* ────────────────────── Acay de pie (frente, sombrero tapa rostro) ────────────────────── */

/**
 * acay_stand_front: Acay de pie visto de frente. Poncho + sombrero de ala
 * ancha que cubre el rostro con sombra. Sin facciones visibles (regla del brief).
 * Usado tras despertar (1.1) y en exploración cuando mira hacia la cámara.
 */
const acayStandFront: DrawerDef = {
  w: 100, h: 170,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.35, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Piernas (dos rectángulos marrones)
    rect(ctx, cx - 14, h * 0.55, 11, h * 0.4, PALETTE.sombrero)
    rect(ctx, cx + 3, h * 0.55, 11, h * 0.4, PALETTE.sombrero)

    // Poncho (trapecio terracota — más ancho abajo)
    poly(ctx, [
      [cx - 22, h * 0.25], [cx + 22, h * 0.25],
      [cx + 38, h - 8], [cx - 38, h - 8],
    ], PALETTE.poncho)
    // Sombra del poncho (lado izq)
    poly(ctx, [
      [cx - 22, h * 0.25], [cx - 14, h * 0.25],
      [cx - 24, h - 8], [cx - 38, h - 8],
    ], PALETTE.ponchoOscuro)

    // Cabeza (sombra bajo el sombrero — sin rostro)
    circle(ctx, cx, h * 0.2, 15, PALETTE.sombrero)

    // Sombrero de ala ancha (cubre completamente la cara)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.13, 38, 9, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    rect(ctx, cx - 12, h * 0.0, 24, 14, PALETTE.sombrero)
    ctx.beginPath()
    ctx.arc(cx, 0, 12, Math.PI, 0)
    ctx.fillStyle = PALETTE.sombrero
    ctx.fill()

    // Sombra sobre la cara (bajo el ala del sombrero) — refuerza "rostro no visible"
    ctx.save()
    ctx.globalAlpha = 0.6
    rect(ctx, cx - 12, h * 0.16, 24, 8, '#1a1410')
    ctx.restore()
  },
}

/* ────────────────────── Escena 01: Rocas en el río ────────────────────── */

/**
 * rocks_in_river: Rocas atrapadas en el río (piedras mojadas).
 * 3-4 piedras de distintos tamaños, grises (piedra/piedraOscura) con brillo
 * húmedo. SIN sombra (están en agua). Mockup para escena 01.
 */
const rocksInRiver: DrawerDef = {
  w: 160, h: 100,
  draw(ctx: C, w: number, h: number): void {
    // Banda de agua (marrón-grisáceo, NO azul)
    const water = ctx.createLinearGradient(0, 0, 0, h)
    water.addColorStop(0, '#6e6450')
    water.addColorStop(1, '#4a4438')
    ctx.fillStyle = water
    ctx.fillRect(0, 0, w, h)

    // Líneas sutiles de agua (reflejos)
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#8a7e60'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(0, 10 + i * 18, w, 2)
    }
    ctx.restore()

    // Definición de piedras [cx, cy, rx, ry]
    const stones: Array<[number, number, number, number]> = [
      [w * 0.2, h * 0.55, 30, 20],
      [w * 0.5, h * 0.5, 38, 26],
      [w * 0.78, h * 0.6, 24, 16],
      [w * 0.62, h * 0.78, 18, 12],
    ]
    for (const [cx, cy, rx, ry] of stones) {
      // Cuerpo de la piedra (gris claro)
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.piedra
      ctx.fill()
      // Sombra interna (gris oscuro) en el tercio inferior
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(cx, cy + ry * 0.3, rx * 0.85, ry * 0.6, 0, 0, Math.PI * 2)
      ctx.fillStyle = PALETTE.piedraOscura
      ctx.globalAlpha = 0.45
      ctx.fill()
      ctx.restore()
      // Brillo húmedo (highlight diagonal arriba-izq)
      ctx.save()
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      ctx.ellipse(cx - rx * 0.35, cy - ry * 0.45, rx * 0.35, ry * 0.18, -0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#e8e2d0'
      ctx.fill()
      ctx.restore()
      // Línea de agua alrededor (efecto "mojado")
      ctx.save()
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.ellipse(cx, cy + ry * 0.7, rx * 1.1, ry * 0.3, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#3a3428'
      ctx.fill()
      ctx.restore()
    }
  },
}

/* ────────────────────── Escena 02: Fondo del campamento ────────────────────── */

/**
 * campamento_background: Fondo del campamento del gaucho (escena 02).
 * 1280x720. Cielo cálido, montañas lejanas, río en el medio, área de camp
 * a la derecha con suelo plano y algunas piedras. Misma paleta que explore,
 * disposición distinta.
 */
const campamentoBackground: DrawerDef = {
  w: 1280, h: 720,
  draw(ctx: C, w: number, h: number): void {
    // Cielo cálido (gradiente arriba)
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5)
    sky.addColorStop(0, '#e8c896')
    sky.addColorStop(1, PALETTE.tierra)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h * 0.5)

    // Sol bajo (disco dorado pálido)
    ctx.save()
    ctx.globalAlpha = 0.7
    circle(ctx, w * 0.78, h * 0.18, 36, '#e8c878')
    ctx.restore()

    // Montañas lejanas (triángulos tierraOscura, más suaves que explore)
    const mountains: Array<[number, number, number]> = [
      [-40, 360, 160], [200, 350, 200], [460, 360, 180],
      [720, 340, 240], [1000, 360, 190], [1240, 350, 170],
    ]
    for (const [x, baseY, peakH] of mountains) {
      poly(ctx, [[x, baseY], [x + 200, baseY - peakH], [x + 400, baseY]], PALETTE.tierraOscura)
    }
    // Sombra lateral en montañas (uno de cada dos)
    ctx.save()
    ctx.globalAlpha = 0.3
    for (let i = 0; i < mountains.length; i += 2) {
      const [x, baseY, peakH] = mountains[i]
      poly(ctx, [[x + 200, baseY - peakH], [x + 400, baseY], [x + 200, baseY]], '#5a4326')
    }
    ctx.restore()

    // Río diagonal (banda marrón-grisácea, distinto layout que explore)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, h * 0.42)
    ctx.lineTo(w, h * 0.38)
    ctx.lineTo(w, h * 0.52)
    ctx.lineTo(0, h * 0.56)
    ctx.closePath()
    const river = ctx.createLinearGradient(0, h * 0.4, 0, h * 0.55)
    river.addColorStop(0, '#6e6450')
    river.addColorStop(1, '#4a4438')
    ctx.fillStyle = river
    ctx.fill()
    ctx.restore()
    // Reflejos del río
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#c8b890'
    for (let i = 0; i < 6; i++) {
      const y = h * 0.44 + i * 4
      ctx.fillRect(0, y, w, 1.5)
    }
    ctx.restore()

    // Suelo: izquierda = ribera pedregosa, derecha = área de campamento
    const ground = ctx.createLinearGradient(0, h * 0.55, 0, h)
    ground.addColorStop(0, PALETTE.tierra)
    ground.addColorStop(1, PALETTE.tierraOscura)
    ctx.fillStyle = ground
    ctx.fillRect(0, h * 0.55, w, h * 0.45)

    // Área de campamento a la derecha (suelo más plano/apisonado)
    ctx.save()
    ctx.globalAlpha = 0.4
    rect(ctx, w * 0.55, h * 0.6, w * 0.45, h * 0.4, PALETTE.tierraClara)
    ctx.restore()

    // Piedras dispersas (algunas en ribera izq, algunas en camp der)
    ctx.save()
    ctx.fillStyle = PALETTE.piedraOscura
    const stones: Array<[number, number, number]> = [
      [80, 540, 12], [180, 590, 16], [260, 560, 10], [380, 600, 14],
      [470, 580, 11], [640, 660, 18], [780, 640, 14], [890, 670, 20],
      [1020, 650, 12], [1150, 680, 16], [1230, 660, 10],
      [120, 690, 22], [340, 680, 18], [560, 700, 20], [740, 690, 16],
      [940, 705, 19], [1180, 700, 15],
    ]
    for (const [x, y, r] of stones) {
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    // Viñeta cálida
    const vig = ctx.createRadialGradient(w / 2, h / 2, 240, w / 2, h / 2, 720)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(60,35,15,0.32)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, w, h)
  },
}

/* ────────────────────── Escena 02: Gaucho durmiendo ────────────────────── */

/**
 * gaucho_sleeping: Gaucho recostado contra un cardón, durmiendo.
 * Silueta oscura (poncho + sombrero sobre la cara). Pose relajada.
 * Sin rostro visible. ~120x140.
 */
const gauchoSleeping: DrawerDef = {
  w: 120, h: 140,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 6, w * 0.42, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Cardón de respaldo (columna vertical verde-agostado, a la derecha)
    rect(ctx, w - 26, h * 0.1, 16, h * 0.85, PALETTE.verdeOscuro)
    ctx.save()
    ctx.globalAlpha = 0.4
    rect(ctx, w - 24, h * 0.1, 4, h * 0.85, PALETTE.verdeAgostado)
    ctx.restore()

    // Piernas extendidas (rectángulos marrones, relajados)
    rect(ctx, cx - 18, h * 0.62, 14, h * 0.28, PALETTE.sombrero)
    rect(ctx, cx - 4, h * 0.65, 14, h * 0.25, PALETTE.sombrero)
    // Botitas
    rect(ctx, cx - 22, h * 0.88, 16, 8, PALETTE.sombreroAla)
    rect(ctx, cx - 8, h * 0.88, 16, 8, PALETTE.sombreroAla)

    // Cuerpo recostado (óvalo horizontal de poncho)
    ctx.beginPath()
    ctx.ellipse(cx - 8, h * 0.55, w * 0.3, h * 0.22, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.poncho
    ctx.fill()
    // Sombra del poncho
    ctx.beginPath()
    ctx.ellipse(cx + 6, h * 0.55, w * 0.22, h * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.ponchoOscuro
    ctx.fill()

    // Cabeza inclinada hacia adelante (sin rostro visible)
    circle(ctx, cx - 28, h * 0.42, 14, PALETTE.sombrero)
    // Sombrero cayendo sobre la cara (ala ancha cubre cabeza)
    ctx.beginPath()
    ctx.ellipse(cx - 28, h * 0.38, 26, 7, 0.15, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    rect(ctx, cx - 40, h * 0.28, 22, 12, PALETTE.sombrero)

    // Brazo relajado sobre el regazo (línea fina marrón)
    ctx.save()
    ctx.strokeStyle = PALETTE.sombrero
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 12, h * 0.5)
    ctx.lineTo(cx + 14, h * 0.62)
    ctx.stroke()
    ctx.restore()
  },
}

/**
 * gaucho_awake: Mismo gaucho del campamento, pero despierto — sentado
 * erguido contra el cardón, alerta/hablando. Torso vertical (poncho),
 * sombrero empujado atrás para dejar el rostro visible: ojos (puntos) y
 * boca abierta. Un brazo gesticula. ~120x140.
 */
const gauchoAwake: DrawerDef = {
  w: 120, h: 140,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 6, w * 0.42, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Cardón de respaldo (columna vertical verde-agostado, a la derecha)
    rect(ctx, w - 26, h * 0.1, 16, h * 0.85, PALETTE.verdeOscuro)
    ctx.save()
    ctx.globalAlpha = 0.4
    rect(ctx, w - 24, h * 0.1, 4, h * 0.85, PALETTE.verdeAgostado)
    ctx.restore()

    // Piernas extendidas hacia adelante (sentado, piernas al frente)
    rect(ctx, cx - 22, h * 0.6, 14, h * 0.28, PALETTE.sombrero)
    rect(ctx, cx - 6, h * 0.6, 14, h * 0.28, PALETTE.sombrero)
    // Botitas
    rect(ctx, cx - 26, h * 0.86, 16, 8, PALETTE.sombreroAla)
    rect(ctx, cx - 10, h * 0.86, 16, 8, PALETTE.sombreroAla)

    // Torso erguido (poncho trapecio terracota — más ancho abajo)
    poly(ctx, [
      [cx - 16, h * 0.3], [cx + 16, h * 0.3],
      [cx + 24, h * 0.62], [cx - 24, h * 0.62],
    ], PALETTE.poncho)
    // Sombra del poncho (lado izq)
    poly(ctx, [
      [cx - 16, h * 0.3], [cx - 8, h * 0.3],
      [cx - 12, h * 0.62], [cx - 24, h * 0.62],
    ], PALETTE.ponchoOscuro)

    // Cabeza erguida (rostro visible — tono tierra cálida)
    circle(ctx, cx, h * 0.22, 13, PALETTE.tierraOscura)

    // Sombrero de ala ancha empujado atrás (no cubre el rostro)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.13, 30, 7, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()
    rect(ctx, cx - 12, h * 0.0, 24, 14, PALETTE.sombrero)
    ctx.beginPath()
    ctx.arc(cx, 0, 12, Math.PI, 0)
    ctx.fillStyle = PALETTE.sombrero
    ctx.fill()

    // Ojos (puntos pequeños visibles bajo el ala)
    circle(ctx, cx - 5, h * 0.22, 1.8, PALETTE.sombreroAla)
    circle(ctx, cx + 5, h * 0.22, 1.8, PALETTE.sombreroAla)

    // Boca abierta (hablando — pequeña elipse oscura)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.27, 4, 3, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.sombreroAla
    ctx.fill()

    // Brazo izquierdo levantado (gesticulando al hablar)
    ctx.save()
    ctx.strokeStyle = PALETTE.sombrero
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - 14, h * 0.34)
    ctx.lineTo(cx - 32, h * 0.23)
    ctx.stroke()
    ctx.restore()
    // Mano al final del brazo
    circle(ctx, cx - 32, h * 0.23, 4, PALETTE.sombrero)
  },
}

/* ────────────────────── Escena 02: Cardón (cactus NOA) ────────────────────── */

/**
 * cardon: Cactus columnar del NOA (Trichocereus pasacana).
 * Columna alta verde-grisácea con 2-3 brazos, textura acanalada (líneas
 * verticales). Sin espinas detalladas. ~80x200.
 */
const cardon: DrawerDef = {
  w: 80, h: 200,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.42, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Cuerpo principal (columna con ápice redondeado)
    ctx.save()
    ctx.fillStyle = PALETTE.verdeAgostado
    // Trapecio sutil (más ancho abajo)
    ctx.beginPath()
    ctx.moveTo(cx - 14, h - 6)
    ctx.lineTo(cx - 12, 24)
    ctx.quadraticCurveTo(cx, 8, cx + 12, 24)
    ctx.lineTo(cx + 14, h - 6)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Brazo izquierdo (más corto)
    ctx.save()
    ctx.fillStyle = PALETTE.verdeAgostado
    ctx.beginPath()
    ctx.moveTo(cx - 14, h * 0.55)
    ctx.lineTo(cx - 30, h * 0.55)
    ctx.quadraticCurveTo(cx - 38, h * 0.55, cx - 38, h * 0.45)
    ctx.lineTo(cx - 30, h * 0.45)
    ctx.quadraticCurveTo(cx - 22, h * 0.45, cx - 22, h * 0.62)
    ctx.lineTo(cx - 14, h * 0.62)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    // Ápice del brazo izq
    ctx.beginPath()
    ctx.ellipse(cx - 30, h * 0.5, 8, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.verdeAgostado
    ctx.fill()

    // Brazo derecho (más alto)
    ctx.save()
    ctx.fillStyle = PALETTE.verdeAgostado
    ctx.beginPath()
    ctx.moveTo(cx + 14, h * 0.4)
    ctx.lineTo(cx + 28, h * 0.4)
    ctx.quadraticCurveTo(cx + 36, h * 0.4, cx + 36, h * 0.28)
    ctx.lineTo(cx + 28, h * 0.28)
    ctx.quadraticCurveTo(cx + 22, h * 0.28, cx + 22, h * 0.48)
    ctx.lineTo(cx + 14, h * 0.48)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.beginPath()
    ctx.ellipse(cx + 28, h * 0.34, 8, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.verdeAgostado
    ctx.fill()

    // Costillas/acanaladuras (líneas verticales oscuras)
    ctx.save()
    ctx.strokeStyle = PALETTE.verdeOscuro
    ctx.lineWidth = 1.5
    // Columna principal
    for (const dx of [-6, 0, 6]) {
      ctx.beginPath()
      ctx.moveTo(cx + dx, 30)
      ctx.lineTo(cx + dx, h - 8)
      ctx.stroke()
    }
    // Brazo izq
    ctx.beginPath()
    ctx.moveTo(cx - 22, h * 0.5)
    ctx.lineTo(cx - 36, h * 0.5)
    ctx.stroke()
    // Brazo der
    ctx.beginPath()
    ctx.moveTo(cx + 22, h * 0.34)
    ctx.lineTo(cx + 34, h * 0.34)
    ctx.stroke()
    ctx.restore()

    // Sombra lateral derecha (volumen)
    ctx.save()
    ctx.globalAlpha = 0.25
    rect(ctx, cx + 6, 24, 8, h - 30, PALETTE.verdeOscuro)
    ctx.restore()
  },
}

/* ────────────────────── Escena 02: Pava (kettle) ────────────────────── */

/**
 * kettle: Pava de hierro/metal con pico y asa. Gris metálico oscuro.
 * ~50x60.
 */
const kettle: DrawerDef = {
  w: 50, h: 60,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.38, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Cuerpo (óvalo vertical metálico)
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.6, w * 0.32, h * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = PALETTE.piedraOscura
    ctx.fill()

    // Sombra volumétrica (lado derecho)
    ctx.save()
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.ellipse(cx + w * 0.12, h * 0.6, w * 0.2, h * 0.28, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#3a4040'
    ctx.fill()
    ctx.restore()

    // Highlight (brillo metálico lado izq)
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.ellipse(cx - w * 0.14, h * 0.55, w * 0.06, h * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#b8bcbc'
    ctx.fill()
    ctx.restore()

    // Pico (triangular, arriba-derecha)
    poly(ctx, [
      [cx + w * 0.22, h * 0.5],
      [cx + w * 0.46, h * 0.36],
      [cx + w * 0.24, h * 0.58],
    ], PALETTE.piedraOscura)

    // Asa (arco arriba-izquierda)
    ctx.save()
    ctx.strokeStyle = PALETTE.piedraOscura
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(cx - w * 0.2, h * 0.45, 8, Math.PI * 0.9, Math.PI * 2.1)
    ctx.stroke()
    ctx.restore()

    // Tapa (rect pequeño arriba)
    rect(ctx, cx - 6, h * 0.28, 12, 6, PALETTE.piedraOscura)
    // Pomo de la tapa
    circle(ctx, cx, h * 0.26, 3, PALETTE.sombreroAla)

    // Base (anillo de apoyo)
    ctx.save()
    ctx.globalAlpha = 0.6
    ctx.beginPath()
    ctx.ellipse(cx, h * 0.86, w * 0.3, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#2a3030'
    ctx.fill()
    ctx.restore()
  },
}

/* ────────────────────── Escena 02: Pila de leña vieja ────────────────────── */

/**
 * wood_pile: Pila de tablones viejos descartados. 3-4 tablones marrones
 * en ángulos irregulares, superpuestos. ~80x50.
 */
const woodPile: DrawerDef = {
  w: 80, h: 50,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.45, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Tablón 1 (inclinado izq)
    ctx.save()
    ctx.translate(cx - 10, h * 0.55)
    ctx.rotate(-0.25)
    rect(ctx, -28, -5, 56, 10, PALETTE.sombrero)
    // Veta
    ctx.save()
    ctx.globalAlpha = 0.4
    rect(ctx, -26, -3, 52, 1.5, PALETTE.sombreroAla)
    ctx.restore()
    ctx.restore()

    // Tablón 2 (casi horizontal, abajo)
    ctx.save()
    ctx.translate(cx + 6, h * 0.75)
    ctx.rotate(0.08)
    rect(ctx, -32, -5, 64, 10, PALETTE.ponchoOscuro)
    ctx.save()
    ctx.globalAlpha = 0.4
    rect(ctx, -30, -2, 60, 1.5, PALETTE.sombreroAla)
    ctx.restore()
    ctx.restore()

    // Tablón 3 (inclinado der, cruzando)
    ctx.save()
    ctx.translate(cx + 12, h * 0.5)
    ctx.rotate(0.32)
    rect(ctx, -24, -4, 48, 8, PALETTE.sombrero)
    ctx.save()
    ctx.globalAlpha = 0.5
    rect(ctx, -22, -2, 44, 1, PALETTE.sombreroAla)
    ctx.restore()
    ctx.restore()

    // Tablón 4 (vertical corto, atrás)
    ctx.save()
    ctx.translate(cx - 22, h * 0.45)
    ctx.rotate(-0.6)
    rect(ctx, -16, -4, 32, 8, PALETTE.sombreroAla)
    ctx.restore()

    // Extremos rotos (astillas — pequeños triángulos)
    poly(ctx, [
      [cx + 28, h * 0.78], [cx + 34, h * 0.72], [cx + 32, h * 0.82],
    ], PALETTE.sombreroAla)
  },
}

/* ────────────────────── Escena 02: Cenizas en fogata ────────────────────── */

/**
 * firepit_ashes: Cenizas en una fogata apagada. Círculo de piedras alrededor
 * con ceniza gris en el centro y algunas piedras pequeñas oscuras en el borde.
 * ~70x40.
 */
const firepitAshes: DrawerDef = {
  w: 70, h: 40,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    const cy = h * 0.6

    // Sombra en el suelo
    ctx.save()
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.ellipse(cx, h - 2, w * 0.45, 4, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Anillo de piedras alrededor (8 piedras formando círculo)
    const ringR = w * 0.36
    const ringStones = 9
    for (let i = 0; i < ringStones; i++) {
      const a = (i / ringStones) * Math.PI * 2
      const sx = cx + Math.cos(a) * ringR
      const sy = cy + Math.sin(a) * ringR * 0.45 // achatado (perspectiva)
      // Variación de tamaño
      const r = 5 + (i % 3)
      ctx.beginPath()
      ctx.ellipse(sx, sy, r, r * 0.75, 0, 0, Math.PI * 2)
      ctx.fillStyle = i % 2 === 0 ? PALETTE.piedra : PALETTE.piedraOscura
      ctx.fill()
    }

    // Ceniza central (óvalo gris claro)
    ctx.beginPath()
    ctx.ellipse(cx, cy, w * 0.24, h * 0.22, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#b0a89a'
    ctx.fill()

    // Ceniza más oscura (núcleo)
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, w * 0.14, h * 0.13, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#6a6258'
    ctx.fill()
    ctx.restore()

    // Carbones pequeños oscuros dentro de la ceniza
    const embers: Array<[number, number, number]> = [
      [cx - 6, cy - 2, 2], [cx + 5, cy + 1, 2.5], [cx - 2, cy + 4, 1.8],
      [cx + 8, cy - 3, 1.5], [cx - 9, cy + 3, 2],
    ]
    for (const [x, y, r] of embers) {
      circle(ctx, x, y, r, PALETTE.sombreroAla)
    }

    // Algunas piedras sueltas alrededor del borde (extra)
    const loose: Array<[number, number, number]> = [
      [cx - w * 0.42, cy + 3, 3], [cx + w * 0.4, cy - 1, 2.5],
      [cx - w * 0.3, cy + 8, 2], [cx + w * 0.28, cy + 7, 3],
    ]
    for (const [x, y, r] of loose) {
      circle(ctx, x, y, r, PALETTE.piedraOscura)
    }
  },
}

/* ────────────────────── Duende (NOA) ────────────────────── */

const duende: DrawerDef = {
  w: 100,
  h: 160,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2

    // Sombra en los pies
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.ellipse(cx, h - 4, w * 0.4, 6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.restore()

    // Brazos abiertos en pose amenazante (detrás del cuerpo)
    poly(ctx, [
      [cx - 14, 80], [cx - 10, 92],
      [cx - 42, 64], [cx - 46, 58],
    ], PALETTE.antagonista)
    poly(ctx, [
      [cx + 14, 80], [cx + 10, 92],
      [cx + 42, 64], [cx + 46, 58],
    ], PALETTE.antagonista)
    // Garras en las manos
    circle(ctx, cx - 44, 60, 4, PALETTE.antagonistaBorde)
    circle(ctx, cx + 44, 60, 4, PALETTE.antagonistaBorde)

    // Cuerpo pequeño y oscuro (trapezoide)
    poly(ctx, [
      [cx - 14, 72], [cx + 14, 72],
      [cx + 22, h - 12], [cx - 22, h - 12],
    ], PALETTE.antagonista)
    ctx.beginPath()
    ctx.moveTo(cx - 14, 72)
    ctx.lineTo(cx + 14, 72)
    ctx.lineTo(cx + 22, h - 12)
    ctx.lineTo(cx - 22, h - 12)
    ctx.closePath()
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 2
    ctx.stroke()

    // Cabeza grande
    circle(ctx, cx, 46, 28, PALETTE.antagonista)
    ctx.beginPath()
    ctx.arc(cx, 46, 28, 0, Math.PI * 2)
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 2
    ctx.stroke()

    // Orejas puntiagudas a los lados de la cabeza
    poly(ctx, [[cx - 26, 42], [cx - 44, 16], [cx - 10, 34]], PALETTE.antagonista)
    poly(ctx, [[cx + 26, 42], [cx + 44, 16], [cx + 10, 34]], PALETTE.antagonista)
    ctx.beginPath()
    ctx.moveTo(cx - 26, 42); ctx.lineTo(cx - 44, 16); ctx.lineTo(cx - 10, 34)
    ctx.closePath()
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + 26, 42); ctx.lineTo(cx + 44, 16); ctx.lineTo(cx + 10, 34)
    ctx.closePath()
    ctx.stroke()

    // Sombrero cónico puntiagudo sobre la cabeza
    poly(ctx, [[cx - 20, 24], [cx, 0], [cx + 20, 24]], PALETTE.antagonista)
    ctx.beginPath()
    ctx.moveTo(cx - 20, 24); ctx.lineTo(cx, 0); ctx.lineTo(cx + 20, 24)
    ctx.closePath()
    ctx.strokeStyle = PALETTE.antagonistaBorde
    ctx.lineWidth = 2
    ctx.stroke()

    // Ojos rojos brillantes (halo + núcleo)
    ctx.save()
    ctx.globalAlpha = 0.45
    circle(ctx, cx - 9, 48, 5, '#d9534f')
    circle(ctx, cx + 9, 48, 5, '#d9534f')
    ctx.restore()
    circle(ctx, cx - 9, 48, 2.5, '#d9534f')
    circle(ctx, cx + 9, 48, 2.5, '#d9534f')
  },
}

/* ────────────────────── Roca inestable + puente (Escena 04) ────────────────────── */

const unstableRock: DrawerDef = {
  w: 140, h: 90,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Roca inclinada en el agua (inestable)
    poly(ctx, [
      [10, h - 6], [20, h * 0.3], [w * 0.35, 8],
      [w * 0.65, 12], [w - 15, h * 0.4], [w - 10, h - 6],
    ], PALETTE.piedra)
    // Sombra
    poly(ctx, [
      [10, h - 6], [20, h * 0.3], [w * 0.4, h * 0.45], [w * 0.5, h - 6],
    ], PALETTE.piedraOscura)
    // Agua alrededor (líneas)
    ctx.save()
    ctx.strokeStyle = 'rgba(110,100,80,0.4)'
    ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(0, h - 4 + i * 3)
      ctx.lineTo(w, h - 6 + i * 3)
      ctx.stroke()
    }
    ctx.restore()
  },
}

const woodBridge: DrawerDef = {
  w: 200, h: 50,
  draw(ctx: C, w: number, h: number): void {
    const cx = w / 2
    // Tablones horizontales sobre el agua
    for (let i = 0; i < 4; i++) {
      const y = 4 + i * 12
      const offX = (i % 2) * 6
      ctx.save()
      ctx.fillStyle = i % 2 === 0 ? PALETTE.sombrero : PALETTE.sombreroAla
      ctx.fillRect(offX, y, w - offX * 2, 10)
      ctx.strokeStyle = PALETTE.tierraOscura
      ctx.lineWidth = 1
      ctx.strokeRect(offX, y, w - offX * 2, 10)
      ctx.restore()
    }
    // Sombra debajo
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.ellipse(cx, h - 2, w * 0.45, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  },
}

/* ────────────────────── Registro ────────────────────── */

export const DRAWERS: Record<string, DrawerDef> = {
  acay_back: acayBack,
  acay_unconscious: acayUnconscious,
  acay_stand_front: acayStandFront,
  antagonist_ucumar: antagonistUcumar,
  antagonist_shadow: antagonistShadow,
  duende: duende,
  explore_background: exploreBackground,
  rhythm_track: rhythmTrack,
  narrative_rock: narrativeRock,
  narrative_tree: narrativeTree,
  narrative_ruin: narrativeRuin,
  narrative_coquena: narrativeCoquena,
  title_logo: titleLogo,
  narrative_guitar: narrativeGuitar,
  narrative_relic: narrativeRelic,
  unstable_rock: unstableRock,
  wood_bridge: woodBridge,
  rocks_in_river: rocksInRiver,
  campamento_background: campamentoBackground,
  gaucho_sleeping: gauchoSleeping,
  gaucho_awake: gauchoAwake,
  cardon: cardon,
  kettle: kettle,
  wood_pile: woodPile,
  firepit_ashes: firepitAshes,
}
