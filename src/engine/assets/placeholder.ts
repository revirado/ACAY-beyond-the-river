/**
 * ═════════════════════════════════════════════════════════════════
 *  PLACEHOLDERS SVG (data URI) — degradación elegante del arte.
 * ═════════════════════════════════════════════════════════════════
 *
 * Si un asset no se encuentra (file/url roto, drawer inexistente), el
 * sistema genera un SVG cuadrado 160×160 con el color de su categoría
 * y una etiqueta legible. Nunca se referencia desde el código de juego
 * directamente: lo consume AssetLoader como último recurso.
 */

/** Color base por categoría según el prefijo del id lógico. */
const CATEGORY_COLORS: ReadonlyArray<readonly [string, string]> = [
  ['world.', '#7a9b5c'],
  ['characters.', '#b0713f'],
  ['ui.', '#c9a24b'],
  ['audio.', '#946a4d'],
]

/** Color neutro para ids que no matchean ninguna categoría conocida. */
const DEFAULT_COLOR = '#8b8b7a'

/** Longitud máxima de la etiqueta visible (~14 caracteres). */
const MAX_LABEL = 14

/** Hash determinista (FNV-1a) para variar sutilmente el tono por id. */
function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Aclara (+1..0) u oscurece (0..-1) un color hex mezclando con blanco/negro. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const target = amount >= 0 ? 255 : 0
  const a = Math.min(1, Math.abs(amount))
  const mix = (c: number): number => Math.round(c + (target - c) * a)
  const to2 = (v: number): string => v.toString(16).padStart(2, '0')
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`
}

/** Escapa los caracteres sensibles de XML para incrustar texto en el SVG. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Genera un data URI de un SVG 160×160: cuadrado redondeado (rx=18)
 * relleno con el color dado (o el de la categoría del id), borde más
 * oscuro de 3px y etiqueta centrada abajo.
 */
export function makePlaceholder(id: string, label?: string, color?: string): string {
  const base = color ?? CATEGORY_COLORS.find(([prefix]) => id.startsWith(prefix))?.[1] ?? DEFAULT_COLOR

  // Variación determinista de tono (±8%) según el hash del id.
  const jitter = ((hashString(id) % 17) - 8) / 100
  const fill = shade(base, jitter)
  const border = shade(base, -0.32)

  // Etiqueta: la provista, o el sufijo del id ("world.house_01" → "house_01").
  const raw = label ?? (id.includes('.') ? id.slice(id.lastIndexOf('.') + 1) : id)
  const short = raw.length > MAX_LABEL ? raw.slice(0, MAX_LABEL) : raw
  const text = escapeXml(short)

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">` +
    `<rect x="4" y="4" width="152" height="152" rx="18" fill="${fill}" stroke="${border}" stroke-width="3"/>` +
    // Sutil brillo superior para dar volumen sin perder planitud cozy.
    `<path d="M4 22 a18 18 0 0 1 18 -18 h116 a18 18 0 0 1 18 18 v52 h-152 z" fill="#ffffff" opacity="0.08"/>` +
    // Etiqueta: copia oscura desplazada como sombra + texto blanco semitransparente.
    `<text x="81" y="139" text-anchor="middle" font-family="Verdana, 'DejaVu Sans', sans-serif" font-size="14" font-weight="bold" fill="rgba(30,20,10,0.55)">${text}</text>` +
    `<text x="80" y="138" text-anchor="middle" font-family="Verdana, 'DejaVu Sans', sans-serif" font-size="14" font-weight="bold" fill="rgba(255,255,255,0.92)">${text}</text>` +
    `</svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Igual que makePlaceholder pero resuelto como HTMLImageElement:
 * resuelve en onload y rechaza en onerror (AssetLoader nunca propaga
 * ese rechazo hacia afuera).
 */
export function placeholderImage(id: string, label?: string, color?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`[assets] No se pudo generar el placeholder para "${id}".`))
    img.src = makePlaceholder(id, label, color)
  })
}
