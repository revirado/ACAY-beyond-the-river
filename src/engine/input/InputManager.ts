import type { Vec2 } from '@/engine/core/types'
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'

/** Códigos que hacen preventDefault SIEMPRE (evitan scroll de la página). */
const NAV_CODES = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

/**
 * InputManager — entrada unificada de teclado y puntero para el juego.
 *
 * - Teclado: listeners en `window` (funciona aunque el foco esté en el canvas).
 *   `e.repeat` se ignora: solo la pulsación inicial entra en `pressed`.
 * - Puntero: listener de `pointerdown` SOLO en el canvas → los clicks de botones
 *   React NO se registran como clicks del juego.
 * - Los clicks se convierten a coordenadas VIRTUALES (1280×720) y se encolan;
 *   persisten hasta que `consumeClick()` los recoge (no se limpian en endFrame).
 * - Primer gesto: listeners en `window` para keydown/pointerdown — cualquier
 *   interacción real (incluidos botones React) dispara el callback UNA vez,
 *   pensado para desbloquear el AudioContext (políticas de autoplay).
 */
export class InputManager {
  private down = new Set<string>()
  private pressed = new Set<string>()
  private clickQueue: Vec2[] = []
  /** Última posición del puntero en coords virtuales (null si salió del canvas). */
  private pointerPos: Vec2 | null = null
  private canvas: HTMLCanvasElement | null = null

  private gestureCb: (() => void) | null = null
  private gestureFired = false
  private gestureAttached = false

  // ── Handlers con referencia estable (para poder removerlos en detach) ──

  private onKeyDown = (e: KeyboardEvent): void => {
    this.fireGesture()
    if (e.repeat) return // ignorar auto-repeat del sistema
    this.down.add(e.code)
    this.pressed.add(e.code)
    if (NAV_CODES.has(e.code)) e.preventDefault()
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code)
  }

  /**
   * Al perder el foco o ocultar la pestaña, el navegador puede "comerse" el
   * keyup (p.ej. Alt-Tab manteniendo una flecha) → la tecla queda trabada en
   * `down` y el jugador deriva para siempre. Limpiar el estado al pausarse.
   */
  private onBlur = (): void => {
    this.down.clear()
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) this.down.clear()
  }

  private onCanvasPointerDown = (e: PointerEvent): void => {
    this.fireGesture()
    const pos = this.toVirtual(e.clientX, e.clientY)
    if (pos) {
      this.clickQueue.push(pos)
      this.pointerPos = pos
    }
  }

  /** pointermove sobre el canvas: actualiza pointerPos para hover. */
  private onCanvasPointerMove = (e: PointerEvent): void => {
    const pos = this.toVirtual(e.clientX, e.clientY)
    if (pos) this.pointerPos = pos
  }

  /** pointerleave: el puntero salió del canvas → pointerPos null. */
  private onCanvasPointerLeave = (): void => {
    this.pointerPos = null
  }

  // Listeners de "primer gesto" en window: capturan también los botones React.
  private onGestureKeyDown = (_e: KeyboardEvent): void => {
    this.fireGesture()
  }

  private onGesturePointerDown = (): void => {
    this.fireGesture()
  }

  // ── Ciclo de vida ──

  attach(canvas: HTMLCanvasElement): void {
    this.detach() // idempotente: nunca duplicar listeners
    this.canvas = canvas
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    canvas.addEventListener('pointerdown', this.onCanvasPointerDown)
    canvas.addEventListener('pointermove', this.onCanvasPointerMove)
    canvas.addEventListener('pointerleave', this.onCanvasPointerLeave)
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    if (this.canvas) {
      this.canvas.removeEventListener('pointerdown', this.onCanvasPointerDown)
      this.canvas.removeEventListener('pointermove', this.onCanvasPointerMove)
      this.canvas.removeEventListener('pointerleave', this.onCanvasPointerLeave)
    }
    this.removeGestureListeners()
    this.canvas = null
    this.down.clear()
    this.pressed.clear()
    this.clickQueue.length = 0
    this.pointerPos = null
  }

  // ── Consultas ──

  /** ¿La tecla está mantenida presionada ahora mismo? */
  isDown(code: string): boolean {
    return this.down.has(code)
  }

  /** ¿Se presionó desde el último endFrame()? (flanco de subida) */
  wasPressed(code: string): boolean {
    return this.pressed.has(code)
  }

  /** Devuelve y consume el próximo click pendiente en coords virtuales (o null). */
  consumeClick(): Vec2 | null {
    return this.clickQueue.shift() ?? null
  }

  /**
   * Última posición del puntero en coords virtuales (o null si está fuera del
   * canvas). Para detección de hover en pantallas POV / point-and-click.
   * NO se consume: persiste hasta que el puntero se mueve o sale del canvas.
   */
  getPointerPos(): Vec2 | null {
    return this.pointerPos
  }

  // ── Primer gesto (desbloqueo de audio) ──

  /**
   * Registra el callback que se disparará UNA vez en el primer gesto real
   * (keydown o pointerdown en cualquier parte de la página, incluidos los
   * botones React). Los listeners viven en window para cumplir ese requisito.
   */
  onFirstGesture(cb: () => void): void {
    this.gestureCb = cb
    if (!this.gestureAttached) {
      window.addEventListener('keydown', this.onGestureKeyDown)
      window.addEventListener('pointerdown', this.onGesturePointerDown)
      this.gestureAttached = true
    }
  }

  /** Llamar al final de cada frame: limpia el set de "pressed" (los clicks NO). */
  endFrame(): void {
    this.pressed.clear()
  }

  // ── Internos ──

  private fireGesture(): void {
    if (this.gestureFired) return
    this.gestureFired = true
    this.removeGestureListeners()
    const cb = this.gestureCb
    this.gestureCb = null
    cb?.()
  }

  private removeGestureListeners(): void {
    if (!this.gestureAttached) return
    window.removeEventListener('keydown', this.onGestureKeyDown)
    window.removeEventListener('pointerdown', this.onGesturePointerDown)
    this.gestureAttached = false
  }

  /** Convierte coords de cliente (píxel CSS) a coords virtuales 1280×720. */
  private toVirtual(clientX: number, clientY: number): Vec2 | null {
    const canvas = this.canvas
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    const x = (clientX - rect.left) * (VIRTUAL_WIDTH / rect.width)
    const y = (clientY - rect.top) * (VIRTUAL_HEIGHT / rect.height)
    // Clamp defensivo: un click siempre vive dentro del espacio virtual.
    return {
      x: Math.min(VIRTUAL_WIDTH, Math.max(0, x)),
      y: Math.min(VIRTUAL_HEIGHT, Math.max(0, y)),
    }
  }
}
