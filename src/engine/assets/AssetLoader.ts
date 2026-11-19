/**
 * ═════════════════════════════════════════════════════════════════
 *  ASSET LOADER — resuelve el índice de assets a imágenes listas.
 * ═════════════════════════════════════════════════════════════════
 *
 * Único punto que traduce AssetSourceDef → AssetImage (Image/Canvas).
 * Degradación elegante: si un file/url falla o un drawer no existe,
 * se sustituye por un placeholder SVG 160×160. loadAll NUNCA rechaza.
 */

import { makePlaceholder, placeholderImage } from './placeholder'
import { NO_DRAWERS, type DrawerDef } from './drawers'
import { evalFrameIndex } from '@/engine/render/anim'
import type { AnimDef, AssetImage, AssetSourceDef } from '@/engine/core/types'

/** Registro interno de un asset ya resuelto. */
interface LoadedAsset {
  img: AssetImage
  /** Para frameSwap: lista de imágenes (frames). Si null, asset estático. */
  frames?: AssetImage[]
  /** URL usable en <img>: data URL del canvas, src original o data URI SVG. */
  url: string
  w: number
  h: number
}

/** Tamaño estándar de los placeholders de respaldo. */
const PLACEHOLDER_SIZE = 160

export class AssetLoader {
  private cache = new Map<string, LoadedAsset>()

  /**
   * Constructor: el juego pasa su índice de assets y su registro de drawers
   * procedurales. El motor no conoce ninguno de los dos.
   */
  constructor(
    private index: Record<string, AssetSourceDef> = {},
    private drawers: Record<string, DrawerDef> = NO_DRAWERS,
  ) {}

  /** ¿Existe este id en el índice? (no implica que ya esté cargado). */
  has(id: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.index, id)
  }

  /**
   * Carga TODOS los assets del índice en paralelo.
   * Llama a onProgress(loaded, total) conforme termina cada uno.
   * Nunca rechaza: cualquier fallo individual cae a placeholder.
   */
  async loadAll(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const ids = Object.keys(this.index)
    const total = ids.length
    let loaded = 0
    const tasks = ids.map(async (id) => {
      try {
        await this.loadOne(id)
      } catch (err) {
        // Última red de seguridad: un error inesperado no rompe la carga total.
        console.warn(`[assets] Error cargando "${id}". Usando placeholder.`, err)
        await this.fallbackPlaceholder(id)
      } finally {
        loaded += 1
        onProgress?.(loaded, total)
      }
    })
    await Promise.all(tasks)
  }

  /** Asset listo para dibujar. Si tiene frames (frameSwap), devuelve el frame actual. */
  get(id: string, timeSec?: number): AssetImage {
    const entry = this.cache.get(id)
    if (!entry) {
      throw new Error(
        this.has(id)
          ? `[assets] El asset "${id}" aún no está cargado (llamá loadAll() primero).`
          : `[assets] Asset desconocido: "${id}"`,
      )
    }
    // Si tiene frames y se provee timeSec, devolver el frame actual
    if (entry.frames && entry.frames.length > 1 && timeSec !== undefined) {
      const def = this.index[id]?.anim
      if (def && def.kind === 'frameSwap') {
        const frameIndex = evalFrameIndex(def, timeSec, entry.frames.length)
        return entry.frames[frameIndex]
      }
    }
    return entry.img
  }

  /** URL usable en <img> (para canvas es el data URL ya generado). */
  getUrl(id: string): string {
    return this.require(id).url
  }

  /** Tamaño declarado del asset (para canvas: el del drawer). */
  getSize(id: string): { w: number; h: number } {
    const entry = this.require(id)
    return { w: entry.w, h: entry.h }
  }

  /**
   * Definición de animación del asset (pandeo, etc.) — o undefined si no tiene.
   * Es un dato del índice (no se carga): disponible incluso antes de loadAll.
   */
  getAnim(id: string): AnimDef | undefined {
    return this.index[id]?.anim
  }

  /* ─────────────────────────── privados ─────────────────────────── */

  private require(id: string): LoadedAsset {
    const entry = this.cache.get(id)
    if (!entry) {
      throw new Error(
        this.has(id)
          ? `[assets] El asset "${id}" aún no está cargado (llamá loadAll() primero).`
          : `[assets] Asset desconocido: "${id}"`,
      )
    }
    return entry
  }

  /** Carga un asset según su tipo de fuente. */
  private async loadOne(id: string): Promise<void> {
    const def = this.index[id]
    switch (def.type) {
      case 'procedural': {
        // Busca el drawer incorporado; si no existe, placeholder.
        const drawer = def.drawer !== undefined ? this.drawers[def.drawer] : undefined
        if (!drawer) {
          await this.fallbackPlaceholder(id)
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = drawer.w
        canvas.height = drawer.h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error(`[assets] Canvas 2D no disponible para "${id}".`)
        drawer.draw(ctx, drawer.w, drawer.h)
        this.cache.set(id, { img: canvas, url: canvas.toDataURL(), w: drawer.w, h: drawer.h })
        return
      }
      case 'placeholder': {
        // Placeholder explícito del índice: SVG 160×160 con su etiqueta.
        const img = await placeholderImage(id, def.label, def.color)
        this.cache.set(id, {
          img,
          url: img.src,
          w: img.naturalWidth || PLACEHOLDER_SIZE,
          h: img.naturalHeight || PLACEHOLDER_SIZE,
        })
        return
      }
      case 'file':
      case 'url': {
        // Si tiene frames[] (animación frameSwap), cargar todos los frames
        if (def.frames && def.frames.length > 0) {
          await this.loadFramesAsset(id, def)
        } else {
          await this.loadImageAsset(id, def)
        }
        return
      }
    }
  }

  /** Carga múltiples frames para animación frameSwap. */
  private async loadFramesAsset(id: string, def: AssetSourceDef): Promise<void> {
    const frameSrcs = def.frames!
    try {
      const imgs = await Promise.all(
        frameSrcs.map((src) => this.loadSingleImage(src, def.type === 'url')),
      )
      // img principal = primer frame; frames = todos
      const first = imgs[0]
      this.cache.set(id, {
        img: first,
        frames: imgs,
        url: frameSrcs[0],
        w: first.naturalWidth,
        h: first.naturalHeight,
      })
    } catch {
      console.warn(`[assets] No se pudieron cargar los frames de "${id}". Usando placeholder.`)
      await this.fallbackPlaceholder(id)
    }
  }

  /** Carga una sola imagen (helper para loadFramesAsset). */
  private loadSingleImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      if (crossOrigin) image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error(`[assets] Falló la carga de "${src}".`))
      image.src = src
    })
  }

  /**
   * Carga un Image desde file/url. Si falla (404, red, CORS), avisa y
   * resuelve igualmente con un placeholder: NUNCA rechaza la carga total.
   */
  private async loadImageAsset(id: string, def: AssetSourceDef): Promise<void> {
    const src = def.src ?? ''
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        // Solo las urls externas necesitan CORS; los files locales no.
        if (def.type === 'url') image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error(`[assets] Falló la carga de la imagen "${id}" (${src}).`))
        image.src = src
      })
      this.cache.set(id, { img, url: src, w: img.naturalWidth, h: img.naturalHeight })
    } catch {
      console.warn(`[assets] No se encontró "${id}" (${src}). Usando placeholder.`)
      await this.fallbackPlaceholder(id)
    }
  }

  /** Respaldo estándar: placeholder SVG 160×160 con etiqueta/color del índice. */
  private async fallbackPlaceholder(id: string): Promise<void> {
    const def = this.index[id]
    try {
      const img = await placeholderImage(id, def?.label, def?.color)
      this.cache.set(id, {
        img,
        url: img.src,
        w: img.naturalWidth || PLACEHOLDER_SIZE,
        h: img.naturalHeight || PLACEHOLDER_SIZE,
      })
    } catch {
      // Último recurso (sin <img> disponible): canvas dibujado a mano.
      const canvas = document.createElement('canvas')
      canvas.width = PLACEHOLDER_SIZE
      canvas.height = PLACEHOLDER_SIZE
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#8b8b7a'
        ctx.fillRect(0, 0, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(id.slice(0, 14), PLACEHOLDER_SIZE / 2, PLACEHOLDER_SIZE - 22)
      }
      this.cache.set(id, { img: canvas, url: canvas.toDataURL(), w: PLACEHOLDER_SIZE, h: PLACEHOLDER_SIZE })
    }
  }
}

/** Re-export por conveniencia para who consuma makePlaceholder sin la clase. */
export { makePlaceholder }
