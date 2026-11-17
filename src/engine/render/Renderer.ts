import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import type { AssetImage, Anchor } from '@/engine/core/types'

const SERIF_FONT = 'Georgia, "Times New Roman", serif'
const SANS_FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif'

export interface ImageOpts {
  scale?: number
  anchor?: Anchor
  alpha?: number
  flip?: boolean
  /**
   * Deformación PURA: cizalla horizontal (shear) anclada en el punto de anclaje
   * (la base, con 'bottom-center'). La base NO se mueve; el desplazamiento crece
   * linealmente hacia arriba (~skewX × alto del sprite). No sabe nada de tiempo:
   * quien la setea es la animación (ver render/anim.ts, ej. pandeo/viento).
   * Funciona igual para arte procedural, placeholder SVG, file o url.
   */
  skewX?: number
}

export interface TextOpts {
  size?: number
  color?: string
  align?: CanvasTextAlign
  baseline?: CanvasTextBaseline
  font?: 'serif' | 'sans'
  weight?: string
  alpha?: number
}

/**
 * Renderer — capa de dibujo sobre Canvas 2D en espacio VIRTUAL 1280×720.
 *
 * El constructor ajusta el tamaño físico del canvas por DPR (máx 2) y escala
 * el contexto una sola vez: todos los métodos dibujan en coordenadas virtuales
 * y el navegador hace el resto.
 */
export class Renderer {
  readonly ctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    const dpr =
      typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    canvas.width = Math.round(VIRTUAL_WIDTH * dpr)
    canvas.height = Math.round(VIRTUAL_HEIGHT * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Renderer: no se pudo obtener el contexto 2D del canvas')
    this.ctx = ctx
    this.ctx.scale(dpr, dpr)
    this.ctx.textBaseline = 'alphabetic'
    if (typeof this.ctx.imageSmoothingQuality === 'string') {
      this.ctx.imageSmoothingEnabled = true
      this.ctx.imageSmoothingQuality = 'high'
    }
  }

  /** Rellena todo el espacio virtual con un color (default: negro). */
  clear(color: string = '#000000'): void {
    const c = this.ctx
    c.save()
    c.globalAlpha = 1
    c.fillStyle = color
    c.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT)
    c.restore()
  }

  /**
   * Dibuja una imagen (Image o Canvas) en coords virtuales.
   * anchor 'bottom-center' (default): (x, y) es la base centrada del sprite.
   * anchor 'center': (x, y) es el centro. flip=true espeja horizontalmente
   * alrededor de x manteniendo el mismo rect ocupado. skewX cizalla la imagen
   * anclada en el punto (x, y) — la base queda fija (ver ImageOpts.skewX).
   */
  image(img: AssetImage, x: number, y: number, opts: ImageOpts = {}): void {
    const { scale = 1, anchor = 'bottom-center', alpha = 1, flip = false, skewX = 0 } = opts
    const w = img.width
    const h = img.height
    if (w <= 0 || h <= 0) return
    const dw = w * scale
    const dh = h * scale
    let dx: number
    let dy: number
    if (anchor === 'center') {
      dx = x - dw / 2
      dy = y - dh / 2
    } else {
      dx = x - dw / 2
      dy = y - dh
    }
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    if (skewX !== 0) {
      // Cizalla x' = x + skewX·(y − y_ancla): el punto de anclaje queda fijo y
      // el tope se corre skewX × (distancia vertical al ancla). Con skewX
      // oscilando (animación) simula pandeo de pasto/juncos por viento.
      c.translate(0, y)
      c.transform(1, 0, skewX, 1, 0, 0)
      c.translate(0, -y)
    }
    if (flip) {
      // Espejo horizontal alrededor de la línea vertical x:
      // trasladar al eje, invertir X y dibujar en la posición relativa original.
      c.translate(x, 0)
      c.scale(-1, 1)
      c.drawImage(img, dx - x, dy, dw, dh)
    } else {
      c.drawImage(img, dx, dy, dw, dh)
    }
    c.restore()
  }

  rect(x: number, y: number, w: number, h: number, color: string, alpha = 1): void {
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.fillRect(x, y, w, h)
    c.restore()
  }

  roundRect(x: number, y: number, w: number, h: number, radius: number, color: string, alpha = 1): void {
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    this.traceRoundRect(x, y, w, h, radius)
    c.fill()
    c.restore()
  }

  ellipse(x: number, y: number, rx: number, ry: number, color: string, alpha = 1): void {
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.beginPath()
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  /** Rectángulo con degradado lineal VERTICAL (stops: [offset 0..1, color]). */
  gradientRect(
    x: number,
    y: number,
    w: number,
    h: number,
    stops: Array<[number, string]>,
    alpha = 1,
  ): void {
    const c = this.ctx
    const g = c.createLinearGradient(x, y, x, y + h)
    for (const [offset, color] of stops) g.addColorStop(offset, color)
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = g
    c.fillRect(x, y, w, h)
    c.restore()
  }

  text(text: string, x: number, y: number, opts: TextOpts = {}): void {
    const {
      size = 16,
      color = '#ffffff',
      align = 'left',
      baseline = 'alphabetic',
      font = 'sans',
      weight = 'normal',
      alpha = 1,
    } = opts
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.font = `${weight} ${size}px ${font === 'serif' ? SERIF_FONT : SANS_FONT}`
    c.textAlign = align
    c.textBaseline = baseline
    c.fillText(text, x, y)
    c.restore()
  }

  /** Ancho en píxeles virtuales que ocupará el texto con esas opciones. */
  textWidth(text: string, opts: Pick<TextOpts, 'size' | 'font' | 'weight'> = {}): number {
    const { size = 16, font = 'sans', weight = 'normal' } = opts
    const c = this.ctx
    c.save()
    c.font = `${weight} ${size}px ${font === 'serif' ? SERIF_FONT : SANS_FONT}`
    const width = c.measureText(text).width
    c.restore()
    return width
  }

  /** Rect completo (1280×720) semitransparente — usado por fades y overlays. */
  dim(alpha: number, color: string = '#000000'): void {
    const c = this.ctx
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = color
    c.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT)
    c.restore()
  }

  /** Viñeta: gradiente radial oscuro en los bordes de la pantalla. */
  vignette(strength = 0.35): void {
    const c = this.ctx
    const cx = VIRTUAL_WIDTH / 2
    const cy = VIRTUAL_HEIGHT / 2
    const outer = Math.hypot(cx, cy) // distancia al rincón ≈ 734
    const g = c.createRadialGradient(cx, cy, 180, cx, cy, outer)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.6, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${strength})`)
    c.save()
    c.fillStyle = g
    c.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT)
    c.restore()
  }

  /**
   * Empieza una región de recorte (clip) en coords virtuales.
   * Todo lo dibujado hasta `restoreClip()` queda recortado a este rect
   * (equivalente a `overflow: hidden`). Anidar con cuidado: cada
   * clipRect necesita su restoreClip.
   */
  clipRect(x: number, y: number, w: number, h: number): void {
    const c = this.ctx
    c.save()
    c.beginPath()
    c.rect(x, y, w, h)
    c.clip()
  }

  /** Cierra la región de recorte abierta con clipRect(). */
  restoreClip(): void {
    this.ctx.restore()
  }

  // ── Internos ──

  /** Traza el path de un rect redondeado (compatible sin ctx.roundRect). */
  private traceRoundRect(x: number, y: number, w: number, h: number, radius: number): void {
    const c = this.ctx
    const r = Math.max(0, Math.min(radius, w / 2, h / 2))
    c.beginPath()
    c.moveTo(x + r, y)
    c.lineTo(x + w - r, y)
    c.arcTo(x + w, y, x + w, y + r, r)
    c.lineTo(x + w, y + h - r)
    c.arcTo(x + w, y + h, x + w - r, y + h, r)
    c.lineTo(x + r, y + h)
    c.arcTo(x, y + h, x, y + h - r, r)
    c.lineTo(x, y + r)
    c.arcTo(x, y, x + r, y, r)
    c.closePath()
  }
}
