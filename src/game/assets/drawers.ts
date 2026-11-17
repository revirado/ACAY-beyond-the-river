/**
 * ═════════════════════════════════════════════════════════════════════
 *  DRAWERS — arte procedural "cozy" pintado con Canvas 2D.
 * ═════════════════════════════════════════════════════════════════════
 *
 * Cada drawer pinta un asset completo sobre un canvas w×h. Todos usan
 * fondo transparente SALVO `background` e `intro_background` (opacos).
 *
 * Paleta cozy obligatoria: verdes, cremas, marrones, terracotas, dorados.
 * Nada de azul/índigo/morado. Detalles con alpha suave para evitar
 * bandas duras. Colocaciones aleatorias usan un PRNG determinista para
 * que el arte sea estable entre ejecuciones.
 */

import type { DrawerDef } from '@/engine/assets/drawers'
export type { DrawerDef }

type Ctx = CanvasRenderingContext2D

/* ─────────────────────────── Paleta cozy ─────────────────────────── */

const C = {
  verdeOscuro: '#6f9e5a',
  verde: '#7fb069',
  verdeMedio: '#86b26b',
  verdeClaro: '#9dbb76',
  verdeAlto: '#8fbf74',
  crema: '#f3e3c2',
  crema2: '#f6e7cb',
  crema3: '#efd9b8',
  marronOscuro: '#7c5230',
  marron: '#8b5e34',
  marronMedio: '#a3714a',
  marronClaro: '#b08a5a',
  marronGris: '#9b7653',
  terracota: '#c96f4a',
  terracotaOscuro: '#a3552f',
  rojo: '#d9534f',
  dorado: '#d9a83f',
  doradoClaro: '#e6b655',
  doradoAlto: '#e8bf5a',
  piedra: '#9aa0a0',
  piedraClara: '#b8bdbd',
  piedraOscura: '#7e8484',
  piel: '#f0c8a0',
  sombra: 'rgba(60,40,20,0.18)',
  tinta: 'rgba(60,40,20,0.35)',
  ventana: '#ffd98a',
  tierra: '#d9b98c',
  tierraBorde: '#c8a878',
  tierraOscuro: '#b78f5e',
  verdeTela: '#6f8f5a',
  bocaOscuro: '#3f2f23',
} as const

/* ────────────────────── Helpers de dibujo básicos ────────────────── */

function circle(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, rot = 0): void {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function poly(ctx: Ctx, pts: ReadonlyArray<readonly [number, number]>, color: string): void {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

/** Construye el path de un rect redondeado (sin rellenar). */
function rrectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.arcTo(x + w, y, x + w, y + h, rad)
  ctx.arcTo(x + w, y + h, x, y + h, rad)
  ctx.arcTo(x, y + h, x, y, rad)
  ctx.arcTo(x, y, x + w, y, rad)
  ctx.closePath()
}

function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  rrectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = color
  ctx.fill()
}

function strokePath(ctx: Ctx, color: string, width: number): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

function line(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  cap: CanvasLineCap = 'round',
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = cap
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

/** Sombra elíptica suave bajo objetos/personajes. */
function shadowEllipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number): void {
  ellipse(ctx, cx, cy, rx, ry, C.sombra)
}

/** Techo a dos aguas: silueta oscura detrás + cuerpo principal delante. */
function gableRoof(
  ctx: Ctx,
  x1: number,
  x2: number,
  apexX: number,
  apexY: number,
  baseY: number,
  color: string,
  edgeColor: string,
): void {
  poly(ctx, [[x1 - 2, baseY + 4], [apexX, apexY + 4], [x2 + 2, baseY + 4]], edgeColor)
  poly(ctx, [[x1, baseY], [apexX, apexY], [x2, baseY]], color)
}

/** Ventana con marco en cruz y brillo cálido. */
function windowPane(ctx: Ctx, x: number, y: number, w: number, h: number, glow: string = C.ventana): void {
  rrect(ctx, x, y, w, h, 3, '#8a6a45')
  rect(ctx, x + 3, y + 3, w - 6, h - 6, glow)
  // Cruz del marco
  rect(ctx, x + w / 2 - 1.5, y + 3, 3, h - 6, '#8a6a45')
  rect(ctx, x + 3, y + h / 2 - 1.5, w - 6, 3, '#8a6a45')
}

/** Puerta con arco y picaporte dorado. */
function archedDoor(ctx: Ctx, cx: number, bottomY: number, w: number, h: number, color = C.marronOscuro): void {
  const r = w / 2
  ctx.beginPath()
  ctx.moveTo(cx - r, bottomY)
  ctx.lineTo(cx - r, bottomY - h + r)
  ctx.arc(cx, bottomY - h + r, r, Math.PI, 0)
  ctx.lineTo(cx + r, bottomY)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  // Tablones verticales sutiles
  line(ctx, cx - r * 0.35, bottomY - h + r * 0.6, cx - r * 0.35, bottomY - 3, 'rgba(40,25,12,0.28)', 1.5, 'butt')
  line(ctx, cx + r * 0.35, bottomY - h + r * 0.6, cx + r * 0.35, bottomY - 3, 'rgba(40,25,12,0.28)', 1.5, 'butt')
  circle(ctx, cx + r * 0.5, bottomY - h * 0.45, 2, C.doradoClaro)
}

/** Humo gris translúcido que sube desde una chimenea. */
function smoke(ctx: Ctx, x: number, y: number, scale = 1): void {
  circle(ctx, x, y, 5 * scale, 'rgba(140,132,124,0.42)')
  circle(ctx, x + 5 * scale, y - 9 * scale, 7 * scale, 'rgba(140,132,124,0.30)')
  circle(ctx, x - 3 * scale, y - 19 * scale, 9 * scale, 'rgba(140,132,124,0.20)')
}

/** Matita de pasto: tres briznas. */
function grassTuft(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  line(ctx, x, y, x - 2.2 * s, y - 6 * s, color, 1.6)
  line(ctx, x, y, x, y - 8.5 * s, color, 1.6)
  line(ctx, x, y, x + 2.2 * s, y - 6 * s, color, 1.6)
}

/** Florecita: corola de 3px con centro claro. */
function flowerDot(ctx: Ctx, x: number, y: number, petal: string): void {
  circle(ctx, x, y, 2.4, petal)
  circle(ctx, x, y, 1.1, '#f7edd2')
}

/** Pajarito: dos curvas en "m". */
function bird(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 1.8 * s
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x - 7 * s, y)
  ctx.quadraticCurveTo(x - 3.5 * s, y - 5.5 * s, x, y)
  ctx.quadraticCurveTo(x + 3.5 * s, y - 5.5 * s, x + 7 * s, y)
  ctx.stroke()
}

/** Arbolito chico para fondos lejanos. */
function miniTree(ctx: Ctx, x: number, baseY: number, s: number): void {
  poly(
    ctx,
    [[x - 3 * s, baseY], [x - 2 * s, baseY - 22 * s], [x + 2 * s, baseY - 22 * s], [x + 3 * s, baseY]],
    C.marronOscuro,
  )
  circle(ctx, x, baseY - 32 * s, 15 * s, C.verdeOscuro)
  circle(ctx, x - 10 * s, baseY - 24 * s, 11 * s, C.verde)
  circle(ctx, x + 10 * s, baseY - 25 * s, 10 * s, C.verdeAlto)
  circle(ctx, x - 4 * s, baseY - 36 * s, 4 * s, 'rgba(255,244,200,0.25)')
}

/** PRNG determinista (mulberry32): mismas posiciones en cada ejecución. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ───────────────────────── Fondos (opacos) ───────────────────────── */

/** Suelo del pueblo: pasto, caminos, plaza y detalles. OPACO 1280×720. */
function drawBackground(ctx: Ctx, w: number, h: number): void {
  // Pasto base
  rect(ctx, 0, 0, w, h, C.verdeMedio)

  // Manchas suaves de pasto (elipses translúcidas, tonos alternos)
  const patches = rng(20240614)
  for (let i = 0; i < 46; i++) {
    const x = patches() * w
    const y = patches() * h
    const rx = 60 + patches() * 130
    const ry = 16 + patches() * 38
    ctx.globalAlpha = 0.08 + patches() * 0.12
    ellipse(ctx, x, y, rx, ry, patches() > 0.5 ? C.verdeClaro : C.verdeOscuro)
  }
  ctx.globalAlpha = 1

  // Camino de tierra horizontal (banda y 430..510) con esquinas redondeadas
  rrectPath(ctx, -24, 430, w + 48, 80, 34)
  ctx.fillStyle = C.tierra
  ctx.fill()
  strokePath(ctx, C.tierraBorde, 5)

  // Textura sutil sobre el camino
  const dirtDots = rng(9001)
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.10 + dirtDots() * 0.08
    ellipse(ctx, dirtDots() * w, 438 + dirtDots() * 64, 10 + dirtDots() * 22, 4 + dirtDots() * 6, C.tierraBorde)
  }
  ctx.globalAlpha = 1

  // Plaza elíptica (donde está el mercado)
  ellipse(ctx, 905, 480, 180, 75, C.tierra)
  ellipse(ctx, 905, 480, 172, 68, '#dfc49a')
  ctx.beginPath()
  ctx.ellipse(905, 480, 180, 75, 0, 0, Math.PI * 2)
  strokePath(ctx, C.tierraBorde, 4)
  const plazaDots = rng(4321)
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.12
    ellipse(ctx, 905 + (plazaDots() - 0.5) * 300, 480 + (plazaDots() - 0.5) * 110, 9 + plazaDots() * 14, 3 + plazaDots() * 4, C.tierraBorde)
  }
  ctx.globalAlpha = 1

  // Camino vertical hacia abajo (x 530..600, y 500..610)
  rrectPath(ctx, 530, 496, 70, 118, 26)
  ctx.fillStyle = C.tierra
  ctx.fill()
  strokePath(ctx, C.tierraBorde, 4)

  // Pastizales y florecitas (fuera de los caminos)
  const deco = rng(777)
  for (let i = 0; i < 120; i++) {
    const x = 16 + deco() * (w - 32)
    const y = 200 + deco() * 405
    // Evitar la banda del camino horizontal y el HUD
    if (y > 424 && y < 516) continue
    const roll = deco()
    if (roll < 0.55) {
      grassTuft(ctx, x, y, 0.8 + deco() * 0.9, deco() > 0.5 ? '#5f8f4c' : '#79a45f')
    } else {
      const petal = roll < 0.72 ? '#ffffff' : roll < 0.88 ? C.doradoAlto : '#c96f4a'
      flowerDot(ctx, x, y, petal)
    }
  }

  // Franja inferior (zona HUD) ligeramente más oscura
  rect(ctx, 0, 615, w, h - 615, 'rgba(60,40,20,0.10)')
}

/** Escena de introducción: amanecer, colinas, camino y arco del pueblo. OPACO 1280×720. */
function drawIntroBackground(ctx: Ctx, w: number, h: number): void {
  // Cielo cálido de amanecer
  const sky = ctx.createLinearGradient(0, 0, 0, 460)
  sky.addColorStop(0, '#f7e8c8')
  sky.addColorStop(1, '#f2d9b0')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, 460)

  // Resplandor del sol naciente
  const glow = ctx.createRadialGradient(320, 320, 20, 320, 320, 240)
  glow.addColorStop(0, 'rgba(255,238,196,0.95)')
  glow.addColorStop(1, 'rgba(255,238,196,0)')
  ctx.fillStyle = glow
  ctx.fillRect(80, 80, 480, 480)

  // Colinas rodantes lejanas (dos tonos)
  ellipse(ctx, 190, 470, 480, 150, C.verdeClaro)
  ellipse(ctx, 640, 485, 520, 130, '#93b470')
  ellipse(ctx, 1080, 480, 460, 140, C.verdeClaro)

  // Suelo frontal
  rect(ctx, 0, 440, w, h - 440, C.verdeMedio)
  const groundPatches = rng(555)
  for (let i = 0; i < 18; i++) {
    ctx.globalAlpha = 0.10
    ellipse(ctx, groundPatches() * w, 470 + groundPatches() * 220, 70 + groundPatches() * 110, 16 + groundPatches() * 26, C.verdeOscuro)
  }
  ctx.globalAlpha = 1

  // Arbolitos al fondo a la izquierda
  miniTree(ctx, 120, 452, 1.15)
  miniTree(ctx, 205, 460, 0.85)
  miniTree(ctx, 62, 466, 0.7)

  // Camino de tierra (y 470..580) que conduce hacia la derecha
  poly(
    ctx,
    [[0, 470], [w, 445], [w, 610], [0, 580]],
    C.tierra,
  )
  line(ctx, 0, 470, w, 445, C.tierraBorde, 5, 'butt')
  line(ctx, 0, 580, w, 610, C.tierraBorde, 5, 'butt')
  const roadDots = rng(8181)
  for (let i = 0; i < 20; i++) {
    const x = roadDots() * w
    const top = 470 - (x / w) * 25
    const bottom = 580 + (x / w) * 30
    const y = top + 8 + roadDots() * Math.max(10, bottom - top - 16)
    if (y < top + 4 || y > bottom - 4) continue
    ctx.globalAlpha = 0.12
    ellipse(ctx, x, y, 8 + roadDots() * 14, 3 + roadDots() * 4, C.tierraBorde)
  }
  ctx.globalAlpha = 1

  // Pasto decorativo a los costados del camino
  const tufts = rng(313)
  for (let i = 0; i < 26; i++) {
    const x = 20 + tufts() * (w - 40)
    const top = 455 + (x / w) * -20
    const y = top + tufts() * (600 - top)
    if (y > 470 + (x / w) * -22 && y < 585 + (x / w) * 25) continue // fuera del camino
    grassTuft(ctx, x, y, 0.7 + tufts() * 0.7, '#5f8f4c')
  }

  // ── Arco de entrada del pueblo (x≈1010) ──
  // Postes
  rrect(ctx, 950, 296, 26, 268, 5, C.marronOscuro)
  rrect(ctx, 1046, 296, 26, 268, 5, C.marronOscuro)
  rect(ctx, 954, 302, 4, 256, 'rgba(255,240,210,0.16)')
  rect(ctx, 1050, 302, 4, 256, 'rgba(255,240,210,0.16)')
  // Viga superior
  rrect(ctx, 938, 282, 146, 18, 5, C.marron)
  rect(ctx, 938, 296, 146, 4, 'rgba(60,40,20,0.28)')
  // Tejadillo
  poly(ctx, [[928, 288], [1011, 238], [1094, 288]], '#8a4726')
  poly(ctx, [[934, 284], [1011, 238], [1088, 284]], C.terracotaOscuro)
  // Letrero colgante (sin texto: marcas talladas)
  line(ctx, 976, 300, 976, 318, '#6b4a2f', 2.4)
  line(ctx, 1046, 300, 1046, 318, '#6b4a2f', 2.4)
  rrect(ctx, 964, 318, 96, 42, 6, C.marronClaro)
  rrectPath(ctx, 964, 318, 96, 42, 6)
  strokePath(ctx, C.marron, 3)
  line(ctx, 982, 332, 1042, 332, 'rgba(60,40,20,0.45)', 3, 'butt')
  line(ctx, 990, 342, 1034, 342, 'rgba(60,40,20,0.30)', 2.4, 'butt')
  line(ctx, 996, 351, 1028, 351, 'rgba(60,40,20,0.30)', 2.4, 'butt')

  // Pájaros
  bird(ctx, 430, 150, 1.2, 'rgba(96,74,52,0.8)')
  bird(ctx, 505, 118, 0.9, 'rgba(96,74,52,0.7)')
  bird(ctx, 565, 172, 1.0, 'rgba(96,74,52,0.75)')
}

/* ─────────────────────────── Construcciones ─────────────────────── */

/** Arco de madera de la entrada del pueblo. 150×150. */
function drawGate(ctx: Ctx, w: number, h: number): void {
  shadowEllipse(ctx, 75, 143, 62, 6)
  // Postes verticales
  rrect(ctx, 10, 34, 22, 108, 4, C.marronOscuro)
  rrect(ctx, 118, 34, 24, 108, 4, C.marronOscuro)
  rect(ctx, 13, 40, 3, 98, 'rgba(255,240,210,0.16)')
  rect(ctx, 121, 40, 3, 98, 'rgba(255,240,210,0.16)')
  // Viga superior
  rrect(ctx, 4, 36, 142, 14, 4, C.marron)
  rect(ctx, 4, 47, 142, 3, 'rgba(60,40,20,0.25)')
  // Tejadillo triangular (borde oscuro detrás + cuerpo delante)
  poly(ctx, [[-2, 42], [75, 9], [152, 42]], '#8a4726')
  poly(ctx, [[2, 38], [75, 6], [148, 38]], C.terracotaOscuro)
  // Letrero colgante de madera
  line(ctx, 58, 50, 58, 66, '#6b4a2f', 2.4)
  line(ctx, 92, 50, 92, 66, '#6b4a2f', 2.4)
  rrect(ctx, 48, 66, 54, 34, 5, C.marronClaro)
  rrectPath(ctx, 48, 66, 54, 34, 5)
  strokePath(ctx, C.marron, 2.5)
  // Marcas talladas (sin texto)
  line(ctx, 58, 76, 92, 76, 'rgba(60,40,20,0.45)', 2.4, 'butt')
  line(ctx, 62, 85, 88, 85, 'rgba(60,40,20,0.3)', 2, 'butt')
  line(ctx, 66, 92, 84, 92, 'rgba(60,40,20,0.3)', 2, 'butt')
}

/** Cabaña acogedora grande. 170×150. */
function drawHouse01(ctx: Ctx): void {
  // Humo antes del techo (queda detrás)
  smoke(ctx, 130, 18, 0.9)
  // Chimenea (detrás del plano del techo)
  rect(ctx, 122, 24, 16, 34, C.piedraClara)
  rect(ctx, 119, 20, 22, 7, C.piedraOscura)

  shadowEllipse(ctx, 85, 146, 72, 7)
  // Pared crema
  rect(ctx, 15, 70, 140, 80, C.crema)
  // Viga decorativa
  rect(ctx, 15, 98, 140, 3, 'rgba(139,94,52,0.35)')
  // Techo terracota con alero
  gableRoof(ctx, 2, 168, 85, 14, 78, C.terracota, '#a95c3b')
  // Puerta con arco
  archedDoor(ctx, 81, 150, 30, 52)
  // Ventana cálida
  windowPane(ctx, 24, 88, 34, 30)
  // Farol junto a la puerta
  line(ctx, 104, 96, 104, 104, '#6b4a2f', 2)
  rrect(ctx, 99, 104, 10, 12, 2, '#6b4a2f')
  rect(ctx, 101, 106, 6, 8, C.ventana)
}

/** Cabaña mediana. 150×135. */
function drawHouse02(ctx: Ctx): void {
  shadowEllipse(ctx, 75, 131, 64, 6)
  // Pared
  rect(ctx, 12, 64, 126, 71, C.crema3)
  // Techo
  gableRoof(ctx, 0, 150, 75, 10, 70, '#a86a4f', '#8d563e')
  // Puerta y ventana
  archedDoor(ctx, 52, 135, 26, 44)
  windowPane(ctx, 92, 80, 30, 26)
  // Toldito sobre la ventana
  poly(ctx, [[88, 78], [107, 68], [126, 78]], C.terracotaOscuro)
}

/** Casa con dos ventanas y jardinera. 165×145. */
function drawHouse03(ctx: Ctx): void {
  shadowEllipse(ctx, 82, 141, 70, 6)
  // Pared
  rect(ctx, 12, 68, 141, 77, C.crema2)
  // Techo
  gableRoof(ctx, 0, 165, 82, 12, 74, C.marron, '#6f4a29')
  // Puerta central
  archedDoor(ctx, 82, 145, 28, 48)
  // Dos ventanas
  windowPane(ctx, 24, 88, 30, 26)
  windowPane(ctx, 110, 88, 30, 26)
  // Jardinera con florecitas rojas (bajo la ventana izquierda)
  rrect(ctx, 20, 118, 38, 10, 2, C.marronMedio)
  rect(ctx, 20, 118, 38, 3, 'rgba(60,40,20,0.2)')
  const flowers: Array<[number, number]> = [[26, 115], [34, 113], [42, 115], [50, 113]]
  for (const [fx, fy] of flowers) {
    line(ctx, fx, fy + 4, fx, fy, '#5f8f4c', 1.5)
    circle(ctx, fx, fy, 2.6, C.rojo)
    circle(ctx, fx, fy, 1.1, '#f7edd2')
  }
}

/** Puesto de mercado con toldo de franjas. 200×160. */
function drawMarket(ctx: Ctx): void {
  shadowEllipse(ctx, 100, 153, 88, 7)

  // Postes (4) — detrás del mostrador
  for (const px of [12, 62, 138, 184]) {
    rect(ctx, px, 34, 7, 94, C.marron)
    rect(ctx, px + 1, 36, 2, 90, 'rgba(255,240,210,0.15)')
  }

  // Mercader detrás del mostrador
  // Torso
  rrect(ctx, 80, 74, 40, 32, 9, C.terracota)
  // Cabeza
  circle(ctx, 100, 60, 13, C.piel)
  // Sombrero
  ellipse(ctx, 100, 49, 17, 4.5, C.marron)
  ctx.beginPath()
  ctx.arc(100, 49, 9, Math.PI, 0)
  ctx.fillStyle = C.marron
  ctx.fill()
  // Cara amable
  circle(ctx, 95, 59, 1.7, '#4a3222')
  circle(ctx, 105, 59, 1.7, '#4a3222')
  line(ctx, 96, 66, 104, 66, '#a06a45', 2)

  // Mostrador de madera
  rect(ctx, 6, 102, 188, 7, C.marronClaro)
  rrect(ctx, 8, 108, 184, 38, 5, C.marronMedio)
  line(ctx, 12, 120, 188, 120, 'rgba(60,40,20,0.25)', 2, 'butt')
  line(ctx, 12, 133, 188, 133, 'rgba(60,40,20,0.25)', 2, 'butt')

  // Cajón de manzanas (izquierda)
  rrect(ctx, 26, 82, 42, 22, 3, C.marronClaro)
  rrectPath(ctx, 26, 82, 42, 22, 3)
  strokePath(ctx, C.marron, 2.5)
  const apples: Array<[number, number]> = [[34, 88], [44, 86], [54, 88], [39, 94], [49, 94]]
  for (const [ax, ay] of apples) {
    circle(ctx, ax, ay, 4, C.rojo)
    circle(ctx, ax - 1.3, ay - 1.3, 1.1, 'rgba(255,255,255,0.65)')
  }

  // Cajón de panes (derecha)
  rrect(ctx, 130, 82, 44, 22, 3, C.marronClaro)
  rrectPath(ctx, 130, 82, 44, 22, 3)
  strokePath(ctx, C.marron, 2.5)
  ellipse(ctx, 144, 93, 9, 5.5, '#d9a05a')
  ellipse(ctx, 162, 92, 8, 5, '#d9a05a')
  line(ctx, 140, 90, 147, 90, '#b97b3a', 1.6, 'butt')
  line(ctx, 159, 89, 166, 89, '#b97b3a', 1.6, 'butt')

  // Toldo con franjas alternadas y perfil ondulado (encima de todo)
  const stripeW = 200 / 8
  for (let i = 0; i < 8; i++) {
    const color = i % 2 === 0 ? C.rojo : C.crema2
    rect(ctx, i * stripeW, 18, stripeW + 0.4, 26, color)
    ctx.beginPath()
    ctx.arc(i * stripeW + stripeW / 2, 44, stripeW / 2, 0, Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
  // Sombra que proyecta el toldo
  rect(ctx, 0, 18, 200, 4, 'rgba(60,40,20,0.18)')
}

/** Horno de piedra con resplandor. 90×110. */
function drawOven(ctx: Ctx): void {
  shadowEllipse(ctx, 45, 105, 38, 5)
  // Chimenea chica (detrás de la cúpula)
  rect(ctx, 60, 32, 11, 26, C.piedraClara)
  rect(ctx, 58, 28, 15, 6, C.piedraOscura)
  circle(ctx, 66, 22, 4, 'rgba(140,132,124,0.4)')
  circle(ctx, 70, 15, 5.5, 'rgba(140,132,124,0.25)')

  // Base de madera
  rrect(ctx, 8, 86, 74, 22, 5, C.marron)
  line(ctx, 12, 97, 78, 97, 'rgba(60,40,20,0.25)', 2, 'butt')

  // Cúpula de piedra
  ctx.beginPath()
  ctx.ellipse(45, 88, 38, 44, 0, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = C.piedra
  ctx.fill()
  // Juntas de piedras (trazos suaves)
  line(ctx, 16, 66, 30, 61, 'rgba(80,86,86,0.55)', 2, 'round')
  line(ctx, 60, 61, 74, 66, 'rgba(80,86,86,0.55)', 2, 'round')
  line(ctx, 12, 76, 27, 73, 'rgba(80,86,86,0.4)', 2, 'round')
  line(ctx, 63, 73, 78, 76, 'rgba(80,86,86,0.4)', 2, 'round')
  line(ctx, 34, 50, 56, 50, 'rgba(80,86,86,0.35)', 2, 'round')
  // Brillo superior de la cúpula
  ellipse(ctx, 34, 58, 10, 16, 'rgba(255,255,255,0.14)', -0.5)

  // Boca de arco oscura con resplandor interior
  ctx.beginPath()
  ctx.moveTo(29, 92)
  ctx.lineTo(29, 76)
  ctx.arc(41, 76, 12, Math.PI, 0)
  ctx.lineTo(53, 92)
  ctx.closePath()
  ctx.fillStyle = C.bocaOscuro
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(33, 92)
  ctx.lineTo(33, 82)
  ctx.arc(41, 82, 8, Math.PI, 0)
  ctx.lineTo(49, 92)
  ctx.closePath()
  ctx.fillStyle = '#e8863a'
  ctx.fill()
  ellipse(ctx, 41, 88, 7, 4, '#f4b04a')
}

/** Pozo de piedra con tejadito y balde. 80×95. */
function drawWell(ctx: Ctx): void {
  shadowEllipse(ctx, 40, 90, 34, 4)
  // Postes
  rect(ctx, 12, 22, 6, 52, C.marron)
  rect(ctx, 62, 22, 6, 52, C.marron)
  rect(ctx, 13, 24, 2, 48, 'rgba(255,240,210,0.15)')
  // Tejadito
  poly(ctx, [[2, 26], [40, 6], [78, 26]], '#8a4726')
  poly(ctx, [[5, 23], [40, 5], [75, 23]], C.terracotaOscuro)
  // Cuerda y balde
  line(ctx, 40, 14, 40, 52, '#6b4a2f', 1.8, 'butt')
  poly(ctx, [[33, 52], [47, 52], [45, 64], [35, 64]], '#8a5a3a')
  rrectPath(ctx, 33, 50, 14, 4, 2)
  ctx.strokeStyle = '#6b4a2f'
  ctx.lineWidth = 2
  ctx.stroke()
  // Cuerpo de piedra
  ellipse(ctx, 40, 74, 32, 15, C.piedra)
  ellipse(ctx, 40, 79, 31, 12, 'rgba(90,96,96,0.45)')
  ellipse(ctx, 40, 73, 31, 13, C.piedra)
  // Brocal
  ellipse(ctx, 40, 64, 25, 10, C.piedraClara)
  ellipse(ctx, 40, 63, 18, 6.5, C.bocaOscuro)
  // Piedritas del brocal
  circle(ctx, 20, 68, 3, C.piedraOscura)
  circle(ctx, 60, 68, 3, C.piedraOscura)
  circle(ctx, 30, 80, 3.4, C.piedraOscura)
  circle(ctx, 50, 80, 3.4, C.piedraOscura)
}

/** Valla de madera. 90×55. */
function drawFence(ctx: Ctx): void {
  shadowEllipse(ctx, 45, 52, 42, 3.5)
  // Travesaños
  rrect(ctx, 0, 16, 90, 8, 3, C.marronClaro)
  rrect(ctx, 0, 32, 90, 8, 3, C.marronClaro)
  line(ctx, 2, 19, 88, 19, 'rgba(255,240,210,0.2)', 1.6, 'butt')
  line(ctx, 2, 35, 88, 35, 'rgba(255,240,210,0.2)', 1.6, 'butt')
  // Postes verticales
  for (const px of [6, 40, 74]) {
    rrect(ctx, px, 6, 9, 46, 3, C.marron)
    rect(ctx, px + 1.5, 9, 2, 40, 'rgba(255,240,210,0.18)')
  }
}

/* ─────────────────────────── Naturaleza ─────────────────────────── */

/** Árbol frondoso. 120×160. */
function drawTree(ctx: Ctx): void {
  shadowEllipse(ctx, 60, 153, 42, 7)
  // Tronco levemente cónico
  poly(ctx, [[52, 152], [54, 96], [66, 96], [68, 152]], C.marronOscuro)
  rect(ctx, 56, 110, 3, 38, 'rgba(255,240,210,0.12)')
  line(ctx, 58, 112, 45, 98, C.marronOscuro, 4)
  line(ctx, 63, 106, 77, 94, C.marronOscuro, 4)
  // Copa: 3 círculos solapados
  circle(ctx, 60, 66, 40, C.verdeOscuro)
  circle(ctx, 34, 84, 26, C.verde)
  circle(ctx, 87, 82, 25, C.verdeAlto)
  // Highlights claros + puntitos de textura
  circle(ctx, 46, 50, 13, 'rgba(255,244,200,0.22)')
  circle(ctx, 76, 60, 9, 'rgba(255,244,200,0.16)')
  circle(ctx, 30, 72, 2.5, 'rgba(60,90,40,0.35)')
  circle(ctx, 90, 70, 2.5, 'rgba(60,90,40,0.3)')
  circle(ctx, 58, 88, 2.5, 'rgba(60,90,40,0.3)')
}

/** Manzano con frutos. 130×165. */
function drawAppleTree(ctx: Ctx): void {
  shadowEllipse(ctx, 65, 158, 46, 7)
  poly(ctx, [[57, 156], [59, 98], [71, 98], [73, 156]], C.marronOscuro)
  rect(ctx, 61, 112, 3, 40, 'rgba(255,240,210,0.12)')
  line(ctx, 62, 116, 48, 102, C.marronOscuro, 4)
  line(ctx, 68, 110, 82, 100, C.marronOscuro, 4)
  // Copa más ancha
  circle(ctx, 65, 66, 42, C.verdeOscuro)
  circle(ctx, 36, 86, 27, C.verde)
  circle(ctx, 94, 84, 26, C.verdeAlto)
  circle(ctx, 48, 48, 13, 'rgba(255,244,200,0.22)')
  circle(ctx, 84, 58, 9, 'rgba(255,244,200,0.16)')
  // 5 manzanas con brillo
  const apples: Array<[number, number]> = [[42, 60], [78, 46], [94, 76], [56, 86], [68, 68]]
  for (const [ax, ay] of apples) {
    circle(ctx, ax, ay, 5, C.rojo)
    circle(ctx, ax - 1.6, ay - 1.6, 1.4, 'rgba(255,255,255,0.7)')
  }
}

/** Roca grande. 60×40. */
function drawRock01(ctx: Ctx): void {
  shadowEllipse(ctx, 30, 36, 26, 4)
  // Base sombreada (silueta oscura)
  poly(ctx, [[5, 35], [9, 15], [24, 6], [45, 9], [56, 27], [54, 35]], C.piedraOscura)
  // Cuerpo de piedra
  poly(ctx, [[7, 31], [11, 15], [25, 7], [44, 10], [54, 26], [52, 31]], C.piedra)
  // Cara iluminada
  poly(ctx, [[13, 17], [25, 9], [39, 11], [31, 21]], C.piedraClara)
  // Grieta sutil
  line(ctx, 40, 22, 46, 28, 'rgba(80,86,86,0.5)', 1.6, 'round')
}

/** Roca chica gris. 46×34. */
function drawRock02(ctx: Ctx): void {
  shadowEllipse(ctx, 23, 30, 20, 3)
  poly(ctx, [[4, 30], [7, 12], [19, 5], [34, 7], [43, 21], [41, 30]], C.piedraOscura)
  poly(ctx, [[6, 27], [9, 12], [20, 6], [33, 8], [41, 20], [39, 27]], C.piedra)
  poly(ctx, [[11, 13], [20, 7], [30, 9], [23, 16]], C.piedraClara)
}

/** Arbusto redondito. 70×46. */
function drawBush(ctx: Ctx): void {
  shadowEllipse(ctx, 35, 43, 30, 4)
  circle(ctx, 22, 30, 14, C.verdeOscuro)
  circle(ctx, 48, 30, 14, C.verdeOscuro)
  circle(ctx, 35, 23, 17, C.verdeOscuro)
  // Puntitos highlight
  circle(ctx, 28, 17, 3, 'rgba(255,244,200,0.35)')
  circle(ctx, 44, 19, 2.5, 'rgba(255,244,200,0.3)')
  circle(ctx, 17, 26, 2, 'rgba(157,187,118,0.7)')
  circle(ctx, 52, 27, 2, 'rgba(157,187,118,0.6)')
}

/** Parche de trigo dorado. 170×110. */
function drawWheatField(ctx: Ctx): void {
  // Tierra elíptica con borde más oscuro
  ellipse(ctx, 85, 66, 80, 34, '#a37f4f')
  ellipse(ctx, 85, 63, 74, 29, C.tierraOscuro)
  const grains = rng(4242)
  for (let i = 0; i < 24; i++) {
    const x = 18 + grains() * 134
    const y = 46 + grains() * 40
    const hgt = 34 + grains() * 18
    const lean = (i % 2 === 0 ? 1 : -1) * (2 + grains() * 3) // inclinación alternada
    // Tallo
    ctx.strokeStyle = C.dorado
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + lean * 0.4, y - hgt * 0.6, x + lean, y - hgt)
    ctx.stroke()
    // Espiga: elipses chicas alternadas + grano apical
    const topX = x + lean
    const topY = y - hgt
    for (let g = 0; g < 4; g++) {
      const side = g % 2 === 0 ? 1 : -1
      ellipse(ctx, topX + side * 2.2, topY + 3 + g * 4.4, 2.6, 4.4, C.doradoAlto, side * 0.5)
      ellipse(ctx, topX - side * 1.2, topY + 5 + g * 4.4, 2.4, 4.2, C.doradoClaro, -side * 0.4)
    }
    ellipse(ctx, topX, topY - 2, 2.3, 4.6, C.doradoClaro, lean * 0.04)
  }
}

/* ──────────────────────── Personajes (mapa) ─────────────────────── */

/**
 * Joven mercader a burro visto de lado (mirando a la DERECHA), 84×72.
 * Dos poses de patas para la animación de caminata de 2 frames.
 */
function drawPlayerMap(ctx: Ctx, pose: 'a' | 'b'): void {
  shadowEllipse(ctx, 42, 66, 30, 5)

  // ── Burro ──
  // Cola con pincel
  ctx.strokeStyle = '#6b4a2f'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(15, 42)
  ctx.quadraticCurveTo(8, 48, 10, 56)
  ctx.stroke()
  ellipse(ctx, 10, 58, 3, 5, '#6b4a2f', 0.3)

  // Patas según pose (A: separadas · B: delanteras adelante, traseras atrás)
  const backXs = pose === 'a' ? [21, 29] : [16, 25]
  const frontXs = pose === 'a' ? [49, 57] : [54, 63]
  for (const lx of backXs) rrect(ctx, lx, 44, 5, 22, 2, C.marronOscuro)
  for (const lx of frontXs) rrect(ctx, lx, 44, 5, 22, 2, C.marronOscuro)
  for (const lx of [...backXs, ...frontXs]) rect(ctx, lx, 62, 5, 4, '#5d3f24')

  // Cuerpo
  ellipse(ctx, 38, 44, 24, 13, C.marronGris)
  ellipse(ctx, 36, 39, 18, 6, 'rgba(255,235,200,0.16)')

  // Cabeza a la derecha + hocico claro
  circle(ctx, 62, 32, 9, C.marronGris)
  ellipse(ctx, 68, 35, 5, 4, '#c4a684')
  circle(ctx, 69.5, 35, 1, '#5d3f24')
  circle(ctx, 60, 30, 1.5, '#3f2a18')
  // Orejas hacia arriba
  poly(ctx, [[57, 25], [56, 12], [61, 24]], C.marronGris)
  poly(ctx, [[63, 24], [64, 11], [68, 23]], C.marronGris)
  // Crin
  line(ctx, 53, 26, 58, 21, '#6b4a2f', 3)

  // ── Jinete ──
  // Pierna doblada y bota
  rrect(ctx, 27, 38, 7, 16, 3, C.marronOscuro)
  rect(ctx, 26, 52, 10, 5, '#5d3f24')
  // Torso terracota
  rrect(ctx, 26, 20, 16, 22, 6, C.terracota)
  // Brazo hacia la cabezona del burro
  line(ctx, 37, 27, 50, 34, C.piel, 3.5)
  // Cabeza
  circle(ctx, 34, 12, 7, C.piel)
  circle(ctx, 36.5, 12, 1.1, '#4a3222')
  // Sombrero de paja (ala + copa + banda)
  ellipse(ctx, 34, 8, 11, 3.5, C.dorado)
  ctx.beginPath()
  ctx.arc(34, 8, 6, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = C.dorado
  ctx.fill()
  line(ctx, 29, 6, 39, 6, C.terracotaOscuro, 2.2, 'butt')
  // Morral al costado con correa
  line(ctx, 29, 22, 22, 36, '#6b4a2f', 2)
  rrect(ctx, 16, 34, 11, 9, 2.5, C.marron)
  rect(ctx, 16, 34, 11, 3, '#6b4a2f')
}

/** Pose A: patas separadas. */
function drawPlayerMapF1(ctx: Ctx): void {
  drawPlayerMap(ctx, 'a')
}

/** Pose B: paso (delanteras adelante, traseras atrás). */
function drawPlayerMapF2(ctx: Ctx): void {
  drawPlayerMap(ctx, 'b')
}

/* ─────────────────────── Retratos detallados ─────────────────────── */

/** Retrato del joven mercader, cuerpo entero. 220×300. */
function drawPlayerDetail(ctx: Ctx): void {
  // Contorno suave reutilizable
  const soft = (): void => strokePath(ctx, C.tinta, 2)

  shadowEllipse(ctx, 110, 289, 52, 8)

  // Piernas (pantalón marrón)
  rrect(ctx, 82, 192, 22, 70, 6, C.marronOscuro)
  rrect(ctx, 116, 192, 22, 70, 6, C.marronOscuro)
  rect(ctx, 82, 190, 56, 16, C.marronOscuro)

  // Botas
  rrect(ctx, 80, 256, 26, 26, 6, '#6b4a2f')
  rrect(ctx, 114, 256, 26, 26, 6, '#6b4a2f')
  rrect(ctx, 74, 276, 38, 12, 5, '#57402c')
  rrect(ctx, 110, 276, 38, 12, 5, '#57402c')

  // Túnica terracota (silueta A-line)
  poly(ctx, [[88, 122], [132, 122], [148, 200], [72, 200]], C.terracota)
  rrectPath(ctx, 72, 120, 76, 82, 10)
  soft()
  // Doblez del cuello
  poly(ctx, [[100, 122], [120, 122], [110, 136]], '#a95c3b')
  // Cinturón con hebilla dorada
  rect(ctx, 75, 186, 70, 11, '#6b4a2f')
  rrect(ctx, 104, 184, 13, 14, 2, C.doradoClaro)
  rect(ctx, 108, 188, 5, 6, '#6b4a2f')

  // Correa del morral en diagonal + bolsita
  line(ctx, 92, 128, 138, 188, '#8b5e34', 9)
  rrect(ctx, 128, 184, 28, 21, 4, '#8b5e34')
  rect(ctx, 128, 184, 28, 8, '#7c5230')
  circle(ctx, 142, 196, 2, C.doradoClaro)

  // Brazos color piel
  line(ctx, 86, 132, 75, 170, C.piel, 12)
  line(ctx, 134, 132, 143, 162, C.piel, 12)
  circle(ctx, 75, 174, 6.5, C.piel)
  circle(ctx, 143, 166, 6.5, C.piel)

  // Cuello (evita hueco entre barbilla y túnica)
  rect(ctx, 102, 104, 16, 24, C.piel)

  // Cabeza
  circle(ctx, 110, 88, 26, C.piel)
  rrectPath(ctx, 84, 62, 52, 52, 26)
  soft()
  // Mechones de pelo marrón asomando
  circle(ctx, 88, 74, 7, C.marronOscuro)
  circle(ctx, 132, 74, 7, C.marronOscuro)
  circle(ctx, 84, 86, 5, C.marronOscuro)
  circle(ctx, 136, 86, 5, C.marronOscuro)

  // Sombrero de paja con banda
  ellipse(ctx, 110, 66, 42, 10, C.dorado)
  rrectPath(ctx, 68, 56, 84, 20, 10)
  soft()
  ctx.beginPath()
  ctx.arc(110, 62, 20, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = C.dorado
  ctx.fill()
  rect(ctx, 91, 52, 38, 7, C.terracotaOscuro)
  line(ctx, 76, 64, 144, 64, 'rgba(255,244,200,0.3)', 2, 'butt')

  // Cara amigable
  circle(ctx, 100, 86, 2.2, '#4a3222')
  circle(ctx, 120, 86, 2.2, '#4a3222')
  line(ctx, 95, 79, 103, 78, '#7c5230', 2, 'round')
  line(ctx, 117, 78, 125, 79, '#7c5230', 2, 'round')
  ctx.strokeStyle = '#a06a45'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(110, 94, 8, 0.25 * Math.PI, 0.75 * Math.PI)
  ctx.stroke()
  circle(ctx, 94, 95, 4, 'rgba(230,140,100,0.30)')
  circle(ctx, 126, 95, 4, 'rgba(230,140,100,0.30)')
}

/** Retrato del mercader mayor amable. 220×300. */
function drawMerchantDetail(ctx: Ctx): void {
  shadowEllipse(ctx, 110, 290, 56, 8)

  // Pies
  rrect(ctx, 84, 274, 24, 12, 5, '#6b4a2f')
  rrect(ctx, 112, 274, 24, 12, 5, '#6b4a2f')

  // Cuerpo regordete: túnica verde
  ellipse(ctx, 110, 205, 54, 62, C.verdeTela)
  rrectPath(ctx, 62, 148, 96, 118, 30)
  strokePath(ctx, C.tinta, 2)

  // Delantal crema
  poly(ctx, [[86, 168], [134, 168], [148, 262], [72, 262]], C.crema)
  line(ctx, 92, 158, 99, 170, '#d8c49a', 5)
  line(ctx, 128, 158, 121, 170, '#d8c49a', 5)
  line(ctx, 78, 210, 142, 210, 'rgba(160,130,80,0.4)', 2.5, 'butt')
  rrect(ctx, 96, 222, 28, 16, 3, '#efd9b8')
  line(ctx, 96, 230, 124, 230, 'rgba(160,130,80,0.5)', 2, 'butt')

  // Brazos: izquierdo colgando, derecho sostiene una manzana
  line(ctx, 72, 170, 63, 212, C.verdeTela, 13)
  circle(ctx, 62, 218, 7.5, C.piel)
  line(ctx, 148, 172, 166, 192, C.verdeTela, 13)
  circle(ctx, 171, 196, 8, C.piel)
  // Manzana ofrecida
  circle(ctx, 171, 183, 9, C.rojo)
  circle(ctx, 167.5, 179.5, 2.6, 'rgba(255,255,255,0.6)')
  line(ctx, 171, 174, 172, 169, C.marronOscuro, 2)
  ellipse(ctx, 177, 168, 5, 2.6, C.verdeOscuro, 0.5)

  // Cuello (evita hueco entre barbilla y túnica)
  rect(ctx, 100, 118, 20, 32, C.piel)

  // Cabeza
  circle(ctx, 110, 100, 27, C.piel)
  rrectPath(ctx, 83, 73, 54, 54, 27)
  strokePath(ctx, C.tinta, 2)
  // Calvicie con pelo gris a los lados
  ellipse(ctx, 110, 82, 13, 7, 'rgba(255,255,255,0.22)')
  circle(ctx, 86, 110, 8, '#a8a8a8')
  circle(ctx, 134, 110, 8, '#a8a8a8')
  rrect(ctx, 83, 104, 7, 14, 3, '#a8a8a8')
  rrect(ctx, 130, 104, 7, 14, 3, '#a8a8a8')

  // Cejas grises, ojos y nariz
  line(ctx, 93, 91, 103, 90, '#9a9a9a', 2.4, 'round')
  line(ctx, 117, 90, 127, 91, '#9a9a9a', 2.4, 'round')
  circle(ctx, 99, 97, 2.2, '#4a3222')
  circle(ctx, 121, 97, 2.2, '#4a3222')
  circle(ctx, 110, 105, 3.2, '#e5b48e')

  // Bigote gris + sonrisa
  ellipse(ctx, 101, 112, 9, 4, '#b8b8b8', 0.35)
  ellipse(ctx, 119, 112, 9, 4, '#b8b8b8', -0.35)
  ctx.strokeStyle = '#a06a45'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(110, 118, 8, 0.3 * Math.PI, 0.7 * Math.PI)
  ctx.stroke()
  // Mejillas sonrosadas
  circle(ctx, 92, 106, 4, 'rgba(230,140,100,0.28)')
  circle(ctx, 128, 106, 4, 'rgba(230,140,100,0.28)')
}

/* ─────────────────────────── Iconos UI ──────────────────────────── */

/** Moneda dorada. 28×28. */
function drawCoin(ctx: Ctx): void {
  circle(ctx, 14, 14, 12, C.doradoClaro)
  rrectPath(ctx, 2, 2, 24, 24, 12)
  strokePath(ctx, '#b98a2e', 2.5)
  // Anillo interior
  ctx.strokeStyle = 'rgba(185,138,46,0.5)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(14, 14, 8, 0, Math.PI * 2)
  ctx.stroke()
  // Arco de brillo
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(14, 14, 8.5, -2.35, -1.35)
  ctx.stroke()
  // Destello
  line(ctx, 7, 5, 10.5, 8.5, 'rgba(255,255,255,0.85)', 2)
  line(ctx, 5.5, 9.5, 7.5, 10.5, 'rgba(255,255,255,0.55)', 1.5)
}

/** Espiga de trigo reutilizable para el icono. */
function wheatSpike(ctx: Ctx, x: number, baseY: number, height: number): void {
  line(ctx, x, baseY, x, baseY - height, C.dorado, 2, 'round')
  const topY = baseY - height
  for (let g = 0; g < 3; g++) {
    const side = g % 2 === 0 ? 1 : -1
    ellipse(ctx, x + side * 2.4, topY + 2 + g * 4.6, 2.4, 4.2, C.doradoAlto, side * 0.5)
    ellipse(ctx, x - side * 1.2, topY + 4 + g * 4.6, 2.2, 4, C.doradoClaro, -side * 0.4)
  }
  ellipse(ctx, x, topY - 2, 2.2, 4.4, C.doradoClaro)
}

/** Icono de trigo: 3 espigas doradas. 36×36. */
function drawIconWheat(ctx: Ctx): void {
  wheatSpike(ctx, 10, 32, 16)
  wheatSpike(ctx, 26, 32, 16)
  wheatSpike(ctx, 18, 33, 24)
}

/** Icono de manzana. 36×36. */
function drawIconApple(ctx: Ctx): void {
  circle(ctx, 18, 21, 11, C.rojo)
  ellipse(ctx, 18, 25, 8, 5, 'rgba(150,45,40,0.4)')
  circle(ctx, 13.5, 16.5, 3, 'rgba(255,255,255,0.55)')
  line(ctx, 18, 11, 19, 5, C.marronOscuro, 2)
  ellipse(ctx, 24, 7, 5, 2.6, C.verdeOscuro, 0.5)
}

/** Icono de hogaza de pan. 36×36. */
function drawIconBread(ctx: Ctx): void {
  ellipse(ctx, 18, 28, 11, 2.5, 'rgba(150,90,40,0.35)')
  ellipse(ctx, 18, 21, 13, 9.5, '#d9a05a')
  rect(ctx, 5, 21, 26, 9, '#d9a05a')
  // Cortes diagonales
  line(ctx, 11, 16, 15, 21, '#b97b3a', 2.4, 'round')
  line(ctx, 17, 14, 21, 20, '#b97b3a', 2.4, 'round')
  line(ctx, 23, 15, 27, 20, '#b97b3a', 2.4, 'round')
  // Brillo superior
  ctx.strokeStyle = 'rgba(255,240,210,0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(18, 22, 9, -2.6, -1.9)
  ctx.stroke()
}

/** Icono de leña: dos troncos apilados. 36×36. */
function drawIconWood(ctx: Ctx): void {
  // Tronco inferior con cara anillada a la derecha
  rrect(ctx, 4, 20, 26, 12, 6, C.marron)
  circle(ctx, 27, 26, 6, '#e0c39a')
  ctx.strokeStyle = '#b08a5a'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.arc(27, 26, 3.6, 0, Math.PI * 2)
  ctx.stroke()
  circle(ctx, 27, 26, 1.2, '#8b5e34')
  // Tronco superior con cara anillada a la izquierda
  rrect(ctx, 8, 7, 26, 12, 6, C.marronOscuro)
  circle(ctx, 11, 13, 6, '#e0c39a')
  ctx.strokeStyle = '#b08a5a'
  ctx.beginPath()
  ctx.arc(11, 13, 3.6, 0, Math.PI * 2)
  ctx.stroke()
  circle(ctx, 11, 13, 1.2, '#7c5230')
  // Vetas
  line(ctx, 15, 13, 30, 13, 'rgba(60,40,20,0.25)', 1.5, 'butt')
  line(ctx, 10, 26, 22, 26, 'rgba(60,40,20,0.25)', 1.5, 'butt')
}

/* ───────────────────── Skylines de prosperidad ───────────────────── */

/** Casita genérica para skylines: cuerpo + techo + ventana. */
function skyHouse(
  ctx: Ctx,
  x: number,
  baseY: number,
  w: number,
  hH: number,
  wall: string,
  roof: string,
  lit: boolean,
): void {
  rect(ctx, x, baseY - hH, w, hH, wall)
  poly(
    ctx,
    [[x - 4, baseY - hH + 2], [x + w / 2, baseY - hH - w * 0.42], [x + w + 4, baseY - hH + 2]],
    roof,
  )
  const ww = Math.max(8, Math.round(w * 0.2))
  const wx = Math.round(x + w / 2 - ww / 2)
  const wy = Math.round(baseY - hH * 0.55)
  rect(ctx, wx, wy, ww, ww, lit ? C.ventana : '#8a6a45')
  // Marco en cruz sutil
  const frame = lit ? 'rgba(180,120,60,0.6)' : 'rgba(60,40,20,0.4)'
  rect(ctx, wx + ww / 2 - 1, wy, 2, ww, frame)
  rect(ctx, wx, wy + ww / 2 - 1, ww, 2, frame)
}

/** Casa de dos pisos con banda intermedia. */
function skyTallHouse(ctx: Ctx, x: number, baseY: number, w: number, hH: number, wall: string, roof: string): void {
  rect(ctx, x, baseY - hH, w, hH, wall)
  rect(ctx, x, baseY - hH * 0.5 - 2, w, 4, 'rgba(60,40,20,0.18)')
  poly(ctx, [[x - 4, baseY - hH + 2], [x + w / 2, baseY - hH - 26], [x + w + 4, baseY - hH + 2]], roof)
  const ww = 12
  for (const row of [0.28, 0.68]) {
    const wy = Math.round(baseY - hH + hH * row)
    rect(ctx, Math.round(x + w * 0.22), wy, ww, ww, C.ventana)
    rect(ctx, Math.round(x + w * 0.62), wy, ww, ww, C.ventana)
    rect(ctx, Math.round(x + w * 0.22) + 5, wy, 2, ww, 'rgba(180,120,60,0.6)')
    rect(ctx, Math.round(x + w * 0.62) + 5, wy, 2, ww, 'rgba(180,120,60,0.6)')
  }
}

/** Torrecita con campanario. */
function skyTower(ctx: Ctx, x: number, baseY: number, w: number, hH: number, wall: string, roof: string): void {
  rect(ctx, x, baseY - hH, w, hH, wall)
  // Campanario abierto
  rrect(ctx, x + w / 2 - 5, baseY - hH + 8, 10, 13, 5, C.bocaOscuro)
  ctx.strokeStyle = C.dorado
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x + w / 2, baseY - hH + 15, 2.6, Math.PI, 0)
  ctx.stroke()
  // Techito piramidal
  poly(ctx, [[x - 3, baseY - hH + 2], [x + w / 2, baseY - hH - 20], [x + w + 3, baseY - hH + 2]], roof)
  circle(ctx, x + w / 2, baseY - hH - 22, 2.5, C.doradoClaro)
  // Ventanita cálida abajo
  rect(ctx, x + w / 2 - 4, baseY - 22, 8, 9, C.ventana)
}

/** Toldo rayado chico para la tienda del skyline próspero. */
function skyAwning(ctx: Ctx, x: number, y: number, w: number, h: number): void {
  const stripes = 6
  const sw = w / stripes
  for (let i = 0; i < stripes; i++) {
    const color = i % 2 === 0 ? C.rojo : C.crema2
    rect(ctx, x + i * sw, y, sw + 0.4, h, color)
    ctx.beginPath()
    ctx.arc(x + i * sw + sw / 2, y + h, sw / 2, 0, Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }
  rect(ctx, x, y - 2, w, 3, 'rgba(60,40,20,0.2)')
}

/** Línea base de tierra común a todos los skylines. */
function skyGround(ctx: Ctx, w: number): void {
  rect(ctx, 0, 114, w, 6, '#b08a5a')
  rect(ctx, 0, 114, w, 2, 'rgba(255,240,210,0.25)')
}

const SKY_BASE = 115

/** Etapa 0: una cabaña chica. 560×120. */
function drawSkyline0(ctx: Ctx, w: number): void {
  skyGround(ctx, w)
  skyHouse(ctx, 250, SKY_BASE, 60, 38, C.crema, C.terracota, true)
}

/** Etapa 1: dos cabañas. 560×120. */
function drawSkyline1(ctx: Ctx, w: number): void {
  skyGround(ctx, w)
  skyHouse(ctx, 150, SKY_BASE, 64, 40, C.crema, C.terracota, true)
  skyHouse(ctx, 330, SKY_BASE, 56, 34, C.crema3, '#a86a4f', false)
}

/** Etapa 2: cabaña + casa mediana con chimenea + cabaña. 560×120. */
function drawSkyline2(ctx: Ctx, w: number): void {
  skyGround(ctx, w)
  // Chimenea detrás del techo de la casa mediana
  rect(ctx, 298, 44, 10, 26, C.piedra)
  rect(ctx, 296, 40, 14, 5, C.piedraOscura)
  skyHouse(ctx, 110, SKY_BASE, 58, 36, C.crema3, '#a86a4f', false)
  skyHouse(ctx, 240, SKY_BASE, 84, 46, C.crema, C.terracota, true)
  skyHouse(ctx, 380, SKY_BASE, 54, 34, C.crema2, C.marron, true)
}

/** Etapa 3: dos casas + una de dos pisos. 560×120. */
function drawSkyline3(ctx: Ctx, w: number): void {
  skyGround(ctx, w)
  skyHouse(ctx, 90, SKY_BASE, 70, 42, C.crema, C.terracota, true)
  skyTallHouse(ctx, 230, SKY_BASE, 76, 62, C.crema2, C.marron)
  skyHouse(ctx, 360, SKY_BASE, 62, 38, C.crema3, '#a86a4f', true)
}

/** Etapa 4: pueblo próspero con tienda, toldo y torrecita. 560×120. */
function drawSkyline4(ctx: Ctx, w: number): void {
  skyGround(ctx, w)
  skyHouse(ctx, 60, SKY_BASE, 60, 38, C.crema, C.terracota, true)
  // Tienda con toldo
  rect(ctx, 180, SKY_BASE - 44, 92, 44, C.crema3)
  poly(ctx, [[176, SKY_BASE - 42], [226, SKY_BASE - 78], [276, SKY_BASE - 42]], C.terracota)
  skyAwning(ctx, 184, SKY_BASE - 26, 84, 9)
  rect(ctx, 198, SKY_BASE - 38, 12, 11, C.ventana)
  rect(ctx, 242, SKY_BASE - 38, 12, 11, C.ventana)
  rect(ctx, 203, SKY_BASE - 38, 2, 11, 'rgba(180,120,60,0.6)')
  rect(ctx, 247, SKY_BASE - 38, 2, 11, 'rgba(180,120,60,0.6)')
  skyHouse(ctx, 320, SKY_BASE, 58, 36, C.crema2, C.marron, true)
  skyTower(ctx, 430, SKY_BASE, 40, 78, C.crema, C.terracotaOscuro)
  skyHouse(ctx, 490, SKY_BASE, 48, 30, C.crema3, '#a86a4f', true)
}

/* ─────────────────────── Naturaleza: pasto animable ───────────────────── */

/**
 * Mata de pasto INDEPENDIENTE (canvas 64×48, base abajo-centro, fondo transparente).
 * Pensada para el sistema de animación por deformación: el renderer la cizalla
 * anclada en la base (pandeo/viento). Briznas curvas en abanico, 2 tonos de verde.
 */
function drawGrassTuft(ctx: Ctx, w: number, h: number): void {
  const cx = w / 2
  const base = h - 3
  // [dx base, dx tope, alto, color, grosor] — abanico simétrico con centro más alto
  const blades: Array<[number, number, number, string, number]> = [
    [-11, -17, 19, '#5f8f4c', 2.6],
    [-7, -10, 25, '#4c7a3e', 2.9],
    [-3, -5, 31, '#6fa257', 3.1],
    [2, 4, 29, '#79a45f', 3.1],
    [7, 11, 24, '#5f8f4c', 2.9],
    [11, 16, 18, '#79a45f', 2.6],
    [0, 7, 22, '#4c7a3e', 2.6],
  ]
  ctx.lineCap = 'round'
  for (const [x0, x1, bh, color, lw] of blades) {
    ctx.strokeStyle = color
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(cx + x0, base)
    // Curva con panza hacia afuera: termina inclinada hacia el extremo del abanico
    ctx.quadraticCurveTo(cx + (x0 + x1) * 0.5 + x0 * 0.18, base - bh * 0.58, cx + x1, base - bh)
    ctx.stroke()
  }
  // Césped apretado en la base (asienta la mata al suelo)
  ctx.fillStyle = '#4c7a3e'
  ctx.fillRect(cx - 9, base - 2, 18, 4)
}

/* ─────────────────────────── Registro DRAWERS ────────────────────── */

/**
 * Drawers incorporados, indexados por el nombre usado en assetIndex.ts.
 * Los tamaños son el contrato con el renderer.
 */
export const DRAWERS: Record<string, DrawerDef> = {
  background: { w: 1280, h: 720, draw: drawBackground },
  intro_background: { w: 1280, h: 720, draw: drawIntroBackground },

  gate: { w: 150, h: 150, draw: drawGate },
  house_01: { w: 170, h: 150, draw: drawHouse01 },
  house_02: { w: 150, h: 135, draw: drawHouse02 },
  house_03: { w: 165, h: 145, draw: drawHouse03 },
  market: { w: 200, h: 160, draw: drawMarket },
  oven: { w: 90, h: 110, draw: drawOven },
  well: { w: 80, h: 95, draw: drawWell },
  fence: { w: 90, h: 55, draw: drawFence },

  tree: { w: 120, h: 160, draw: drawTree },
  apple_tree: { w: 130, h: 165, draw: drawAppleTree },
  rock_01: { w: 60, h: 40, draw: drawRock01 },
  rock_02: { w: 46, h: 34, draw: drawRock02 },
  bush: { w: 70, h: 46, draw: drawBush },
  wheat_field: { w: 170, h: 110, draw: drawWheatField },
  grass_tuft: { w: 64, h: 48, draw: drawGrassTuft },

  player_map_f1: { w: 84, h: 72, draw: drawPlayerMapF1 },
  player_map_f2: { w: 84, h: 72, draw: drawPlayerMapF2 },
  player_detail: { w: 220, h: 300, draw: drawPlayerDetail },
  merchant_detail: { w: 220, h: 300, draw: drawMerchantDetail },

  coin: { w: 28, h: 28, draw: drawCoin },
  icon_wheat: { w: 36, h: 36, draw: drawIconWheat },
  icon_apple: { w: 36, h: 36, draw: drawIconApple },
  icon_bread: { w: 36, h: 36, draw: drawIconBread },
  icon_wood: { w: 36, h: 36, draw: drawIconWood },

  skyline_0: { w: 560, h: 120, draw: drawSkyline0 },
  skyline_1: { w: 560, h: 120, draw: drawSkyline1 },
  skyline_2: { w: 560, h: 120, draw: drawSkyline2 },
  skyline_3: { w: 560, h: 120, draw: drawSkyline3 },
  skyline_4: { w: 560, h: 120, draw: drawSkyline4 },
}
