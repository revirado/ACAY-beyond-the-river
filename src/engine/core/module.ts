import type { UseBoundStore, StoreApi } from 'zustand'
import type {
  AssetSourceDef,
  BaseUISnapshot,
  GameStateContract,
  TrackDef,
  UiBridge,
} from '@/engine/core/types'
import type { ScreenContext } from '@/engine/core/context'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { GameStore } from '@/engine/state/store'
import type { DrawerDef } from '@/engine/assets/drawers'
import type { LocaleEntry } from '@/engine/i18n'
import type { AssetLoader } from '@/engine/assets/AssetLoader'
import type { AudioManager } from '@/engine/audio/AudioManager'
import type { ScreenManager } from '@/engine/core/ScreenManager'

/**
 * GameSnapshotContext — lo que el juego puede leer al construir un snapshot
 * o al reaccionar a un cambio de estado. Incluye el estado, los servicios del
 * motor (assets, audio, screens), el tiempo y un helper para emitir toasts.
 */
export interface GameSnapshotContext<TState extends GameStateContract = GameStateContract> {
  state: TState
  assets: AssetLoader
  audio: AudioManager
  screens: ScreenManager
  time: number
  debug: boolean
  pushToast: (text: string) => void
}

/**
 * ════════════════════════════════════════════════════════════════════════
 *  GameModule — el contrato entre el motor y un juego concreto.
 * ════════════════════════════════════════════════════════════════════════
 *
 * El motor (GameEngine) es genérico: no conoce pantallas concretas, ni datos
 * de mundo, ni tipos de interacción, ni pistas de música, ni locales. Recibe
 * un GameModule que le provee TODO lo específico del juego:
 *
 *   - id: identificador único del juego.
 *   - assetIndex: el índice de assets a cargar (assets reemplazables).
 *   - drawers: registro de drawers procedurales (Canvas 2D) del juego.
 *   - uiAssetUrls: IDs de assets que la UI React necesita como URL para <img>.
 *   - locales + defaultLocale: diccionarios de i18n.
 *   - store: instancia del store Zustand del juego (tipada con su snapshot).
 *   - createInitialState(): factory del estado inicial del juego.
 *   - createScreens(ctx): factory de las pantallas del juego.
 *   - initialScreen: pantalla al arrancar.
 *   - musicByScreen: qué pista suena en cada pantalla.
 *   - audioTracks: pistas procedurales (WebAudio) definidas por el juego.
 *   - buildSnapshot(ctx): construye el snapshot UI desde el estado actual.
 *   - onStateChanged(state, ctx): hook en cada cambio de estado.
 *   - uiActions: acciones invocables desde React overlays (vía engineBridge).
 *   - initialFadeIn: fade inicial al arrancar (ms).
 *
 * Agregar un juego nuevo = implementar un GameModule y montarlo en page.tsx.
 * No se modifica el motor.
 */
export interface GameModule<
  TState extends GameStateContract = GameStateContract,
  TSnapshot extends BaseUISnapshot = BaseUISnapshot,
> {
  /** Identificador único del juego (ej. 'cozy-trading-village'). */
  id: string

  /** Índice de assets del juego (id lógico → fuente). */
  assetIndex: Record<string, AssetSourceDef>
  /** Drawers procedurales del juego (nombre → DrawerDef). */
  drawers: Record<string, DrawerDef>
  /** IDs de assets que la UI React necesita como URL para <img>. */
  uiAssetUrls: string[]

  /** Locales registrados (i18n) — el motor los carga al arrancar. */
  locales: LocaleEntry[]
  /** Locale por defecto (al que cae t() si la key no existe en el actual). */
  defaultLocale: string

  /** Store Zustand del juego (instancia creada por el juego). */
  store: UseBoundStore<StoreApi<GameStore<TSnapshot>>>

  /** Factory del estado inicial del juego. */
  createInitialState(): TState

  /**
   * Factory de las pantallas del juego. Recibe el ScreenContext (renderer,
   * input, audio, assets, state, screens, ui, toast, syncUI, time, debug).
   * El motor las registra en el ScreenManager.
   */
  createScreens(ctx: ScreenContext<TState>): GameScreen[]

  /** Pantalla inicial al arrancar el motor (ej. 'studio' o 'title'). */
  initialScreen: string

  /** Música por pantalla (id de pantalla → id de pista; ausente = silencio). */
  musicByScreen: Record<string, string>

  /** Definiciones de pistas procedurales (WebAudio). Vacío si todo es file-based. */
  audioTracks?: Record<string, TrackDef>

  /**
   * Construye el snapshot UI desde el estado actual. El motor lo publica al
   * store del juego para que React lo pinte.
   */
  buildSnapshot(ctx: GameSnapshotContext<TState>): TSnapshot

  /**
   * Hook llamado en cada cambio lógico del estado (suscripción del motor).
   * Útil para evaluación de progresión, diálogos reactivos, etc. No debe
   * mutar el estado de forma síncrona que cause recursión.
   */
  onStateChanged?(state: TState, ctx: GameSnapshotContext<TState>): void

  /**
   * Acciones invocables desde React overlays vía engineBridge.
   * Clave = nombre de acción, valor = handler. El motor las expone en
   * `engine.actions.<name>(...args)` — el motor pasa `this` (el engine) como
   * primer argumento a cada handler, seguido de los args de React.
   *
   * El juego tipa el engine arg con su tipo concreto (ej. CozyEngine) vía
   * aserción de tipo en la implementación.
   */
  uiActions?: Record<string, (engine: unknown, ...args: unknown[]) => void>

  /** Fade inicial al arrancar el motor (ms). null/undefined = sin fade. */
  initialFadeIn?: number | null

  /**
   * Duración del ciclo día/noche en segundos (opcional). Si el juego tiene
   * un indicador temporal (reloj radial, etc.), lo declara aquí. El engine
   * lo expone vía getClock() para que los overlays React lo lean por rAF
   * sin re-renderizar por frame.
   */
  clockDayLengthSec?: number

  /**
   * Hook para construir el UiBridge del motor. El motor implementa UiBridge
   * por defecto (setInteraction); si el juego necesita acciones extra en el
   * bridge, puede extenderlo aquí. Opcional.
   */
  uiBridgeExtender?: (base: UiBridge) => UiBridge
}
