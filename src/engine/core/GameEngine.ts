import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from '@/engine/core/config'
import { registerLocales, setDefaultLocale, setLocale, getLocale, t, isLocale } from '@/engine/i18n'
import { Renderer } from '@/engine/render/Renderer'
import { InputManager } from '@/engine/input/InputManager'
import { AudioManager } from '@/engine/audio/AudioManager'
import { AssetLoader } from '@/engine/assets/AssetLoader'
import { ScreenManager } from '@/engine/core/ScreenManager'
import type { ScreenContext } from '@/engine/core/context'
import type { GameModule, GameSnapshotContext } from '@/engine/core/module'
import type { UiBridge, AssetSourceDef } from '@/engine/core/types'
import type { UseBoundStore, StoreApi } from 'zustand'
import type { GameStore } from '@/engine/state/store'

/** Convierte el module en el mapa de acciones expuestas en engine.actions. */
type ActionsMap = Record<string, (...args: unknown[]) => unknown>

/**
 * GameEngine — dueño del game loop (requestAnimationFrame), del ScreenManager,
 * del input, del audio, del estado y de la sincronización hacia la UI React.
 *
 * GENÉRICO: no conoce pantallas concretas, ni datos de mundo, ni tipos de
 * interacción, ni pistas de música, ni locales. Recibe un GameModule que le
 * provee TODO lo específico del juego. React NO participa del update por
 * frame: solo recibe snapshots de estado publicados al store del juego.
 *
 * Responsabilidades (del brief técnico original §14):
 *   requestAnimationFrame → input → update → collision → game state → render
 */
export class GameEngine<
  TState extends { version: number; subscribe(fn: () => void): () => void; markChanged(): void; reset(): void } = {
    version: number
    subscribe(fn: () => void): () => void
    markChanged(): void
    reset(): void
  },
  TSnapshot extends { ready: boolean; screen: string; locale: string; muted: boolean; volume: number; debug: boolean; toasts: Array<{ id: number; text: string }>; urls: Record<string, string>; interaction?: unknown } = {
    ready: boolean
    screen: string
    locale: string
    muted: boolean
    volume: number
    debug: boolean
    toasts: Array<{ id: number; text: string }>
    urls: Record<string, string>
    interaction?: unknown
  },
> implements UiBridge {
  readonly actions: ActionsMap

  private renderer: Renderer
  readonly input = new InputManager()
  readonly audio: AudioManager
  readonly assets: AssetLoader
  readonly state: TState
  readonly screens = new ScreenManager()

  private canvas: HTMLCanvasElement
  private rafId = 0
  private watchdogId: ReturnType<typeof setTimeout> | null = null
  private lastFrameTime = 0
  private lastTs = 0
  private time = 0
  private running = false
  private destroyed = false

  private currentInteraction: unknown = null
  private debug = false
  private lastMusicScreen: string | null = null
  private lastSyncedScreen: string | null = null
  private unsubscribeState: () => void

  private module: GameModule<TState, TSnapshot>
  private store: UseBoundStore<StoreApi<GameStore<TSnapshot>>>
  private ctx: ScreenContext<TState>

  constructor(canvas: HTMLCanvasElement, module: GameModule<TState, TSnapshot>) {
    this.canvas = canvas
    this.module = module
    this.renderer = new Renderer(canvas)

    // Locales: el motor registra los del juego y setea el default.
    registerLocales(module.locales)
    setDefaultLocale(module.defaultLocale)

    // Assets + drawers: del módulo.
    this.assets = new AssetLoader(module.assetIndex, module.drawers)

    // Audio: tracks procedurales + sources file-based derivados del assetIndex.
    const audioSources = deriveAudioSources(module.assetIndex)
    this.audio = new AudioManager(module.audioTracks ?? {}, audioSources)

    // Estado inicial: factory del módulo.
    this.state = module.createInitialState()

    // Store del juego (Zustand).
    this.store = module.store

    // Pantallas: factory del módulo. Necesita el ctx, así que lo creamos primero.
    this.ctx = {
      renderer: this.renderer,
      input: this.input,
      audio: this.audio,
      assets: this.assets,
      state: this.state,
      screens: this.screens,
      ui: this,
      toast: (text) => this.store.getState().pushToast(text),
      syncUI: () => this.syncUI(),
      time: 0,
      debug: false,
    }

    // Registra las pantallas del juego.
    for (const screen of module.createScreens(this.ctx)) {
      this.screens.register(screen)
    }

    // Acciones del juego: el motor las expone en `engine.actions.<name>(...args)`,
    // pasando `this` (el engine) como primer arg a cada handler del módulo.
    this.actions = {}
    for (const [name, fn] of Object.entries(module.uiActions ?? {})) {
      this.actions[name] = (...args: unknown[]) => fn(this, ...args)
    }

    // Suscripción al estado: hook del módulo + syncUI.
    this.unsubscribeState = this.state.subscribe(() => this.onStateChanged())

    // Desbloqueo de audio en el primer gesto real del usuario (políticas autoplay).
    this.input.onFirstGesture(() => this.audio.unlock())
  }

  /** Carga todos los assets declarados en el índice del módulo. */
  async preload(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    await this.assets.loadAll(onProgress)
    this.syncUI()
  }

  /** Arranca el loop. */
  start(): void {
    if (this.running || this.destroyed) return
    this.running = true
    this.input.attach(this.canvas)

    // Primera pantalla: la que declara el módulo (con fade inicial opcional).
    this.screens.requestSwitch(this.module.initialScreen, undefined, null)
    this.screens.applyPending(this.ctx)
    const fadeIn = this.module.initialFadeIn
    if (fadeIn && fadeIn > 0) this.screens.fade.fadeIn(fadeIn)

    this.lastTs = performance.now()
    this.lastFrameTime = this.lastTs
    this.scheduleFrame()
  }

  destroy(): void {
    this.destroyed = true
    this.running = false
    cancelAnimationFrame(this.rafId)
    if (this.watchdogId) clearTimeout(this.watchdogId)
    this.input.detach()
    this.audio.dispose()
    this.unsubscribeState()
    this.store.getState().setSnapshot({ interaction: null } as Partial<TSnapshot>)
  }

  /** Programa el próximo frame por rAF + watchdog anti-congelamiento. */
  private scheduleFrame(): void {
    this.rafId = requestAnimationFrame(this.loop)
    if (this.watchdogId) clearTimeout(this.watchdogId)
    this.watchdogId = setTimeout(() => {
      if (!this.running) return
      // Pestaña oculta: el navegador pausa rAF → tick manual (slow motion)
      // para que el juego no quede muerto al volver.
      if (performance.now() - this.lastFrameTime > 200) {
        this.loop(performance.now())
      } else {
        this.scheduleFrame()
      }
    }, 250)
  }

  private loop = (ts: number): void => {
    if (!this.running) return
    const dt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000))
    this.lastTs = ts
    this.time += dt

    // Teclas globales del motor (mute y debug). El juego puede tener más.
    if (this.input.wasPressed('KeyM')) {
      this.toggleMute()
      this.syncUI()
    }
    if (this.input.wasPressed('F3')) {
      this.debug = !this.debug
      this.syncUI()
    }

    // Música según pantalla actual (mapping del módulo).
    const sid = this.screens.currentId
    if (sid && sid !== this.lastMusicScreen) {
      this.lastMusicScreen = sid
      const track = this.module.musicByScreen[sid]
      if (track) this.audio.playTrack(track)
    }
    if (sid && sid !== this.lastSyncedScreen) {
      this.lastSyncedScreen = sid
      this.syncUI()
    }

    const ctx = this.ctx
    ctx.time = this.time
    ctx.debug = this.debug

    // Update (congelado durante transiciones), luego switch pendiente, luego render
    if (!this.screens.isTransitioning) {
      this.screens.current?.update(dt, ctx)
    }
    this.screens.update(dt, ctx)
    this.screens.applyPending(ctx)
    this.screens.render(this.renderer, ctx)

    this.input.endFrame()
    this.lastFrameTime = performance.now()
    this.scheduleFrame()
  }

  /** Cambio en el estado lógico → hook del módulo + sincronizar UI. */
  private onStateChanged(): void {
    const snapshotCtx = this.buildSnapshotContext()
    this.module.onStateChanged?.(this.state, snapshotCtx)
    this.syncUI()
  }

  /** Publica el snapshot del juego hacia el store (vía buildSnapshot del módulo). */
  syncUI(): void {
    const snapshotCtx = this.buildSnapshotContext()
    const snapshot = this.module.buildSnapshot(snapshotCtx)
    // URLs de assets de UI: el módulo pidió uiAssetUrls; los resolvemos del loader.
    const urls: Record<string, string> = { ...snapshot.urls }
    for (const id of this.module.uiAssetUrls) {
      if (!urls[id]) {
        try {
          urls[id] = this.assets.getUrl(id)
        } catch {
          /* asset aún no cargado */
        }
      }
    }
    snapshot.urls = urls
    // Estado de interacción actual (UiBridge).
    if (this.currentInteraction !== undefined) {
      snapshot.interaction = this.currentInteraction
    }
    this.store.getState().setSnapshot(snapshot)
  }

  private buildSnapshotContext(): GameSnapshotContext<TState> {
    return {
      state: this.state,
      assets: this.assets,
      audio: this.audio,
      screens: this.screens,
      time: this.time,
      debug: this.debug,
      pushToast: (text: string) => this.store.getState().pushToast(text),
    }
  }

  /* ─────────────── UiBridge ─────────────── */

  setInteraction(state: unknown | null): void {
    this.currentInteraction = state
    this.syncUI()
  }

  /** Lee la interacción UI actual (publicado por setInteraction). */
  getInteraction(): unknown {
    return this.currentInteraction
  }

  /* ─────────────── Acciones genéricas del motor ─────────────── */

  setVolume(v: number): void {
    this.audio.setVolume(v)
    this.syncUI()
  }

  toggleMute(): void {
    this.audio.toggleMute()
    this.syncUI()
  }

  /** Cambia el idioma de la UI y re-publica el snapshot. */
  setLocale(locale: unknown): void {
    if (!isLocale(locale)) return
    setLocale(locale)
    this.syncUI()
  }

  /** Tiempo del motor (segundos desde el start). */
  getTime(): number {
    return this.time
  }

  /**
   * Estado del reloj del HUD (indicador temporal opcional).
   * Los overlays React lo leen por rAF propio para no re-renderizar por frame.
   * Si el módulo no declaró clockDayLengthSec, dayLengthSec es undefined.
   */
  getClock(): { time: number; dayLengthSec?: number } {
    return {
      time: this.time,
      dayLengthSec: this.module.clockDayLengthSec,
    }
  }
}

/**
 * Deriva el mapa de audioSources (trackId → src) del assetIndex del módulo.
 * Convención: entradas `audio.music_<trackId>` con type 'file'/'url' y src
 * → file-based audio para ese trackId. El AudioManager las usa para HTMLAudio.
 */
function deriveAudioSources(
  assetIndex: Record<string, AssetSourceDef>,
): Record<string, string> {
  const out: Record<string, string> = {}
  const PREFIX = 'audio.music_'
  for (const [id, def] of Object.entries(assetIndex)) {
    if (!id.startsWith(PREFIX)) continue
    if ((def.type === 'file' || def.type === 'url') && def.src) {
      out[id.slice(PREFIX.length)] = def.src
    }
  }
  return out
}

// Re-export de utilidades de i18n para que el juego las importe del engine.
export { setLocale, getLocale, isLocale, t }
export type { UiBridge }
