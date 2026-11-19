/**
 * ════════════════════════════════════════════════════════════════════════
 *  ENGINE TYPES — contrato estable del motor 2D web.
 * ════════════════════════════════════════════════════════════════════════
 *
 * Tipos GENÉRICOS del motor: independientes de cualquier mecánica de juego
 * concreta. Un juego (src/game, src/game-next, etc.) importa estos tipos y
 * los especializa (concrete ScreenId, concrete InteractionType, snapshot
 * extendido, etc.) en su propio `core/types.ts`.
 *
 * Regla de dependencia: el motor NO importa nunca de `src/game/*`.
 * El juego sí importa de `src/engine/*`. Unidireccional.
 *
 * Principio (brief técnico original §27):
 *
 *                 ┌─────────────┐
 *                 │ GAME LOGIC  │  ← vive en src/game (o src/game-next)
 *                 └──────┬──────┘
 *                        │
 *                  GAME STATE
 *                        │
 *          ┌─────────────┼─────────────┐
 *          ↓             ↓             ↓
 *      RENDERER         UI           AUDIO     ← viven en src/engine
 *          │
 *          ↓
 *       ASSETS
 */

/* ───────────────── Primitivas geométricas ───────────────── */

export interface Vec2 {
  x: number
  y: number
}

export type AssetImage = HTMLImageElement | HTMLCanvasElement

/** Ancla del sprite respecto al punto (x, y) de dibujo. */
export type Anchor = 'bottom-center' | 'center'

/* ───────────────── Colisión (independiente del asset visual) ───────────────── */

export type Collider =
  | { type: 'rectangle'; width: number; height: number; offsetX?: number; offsetY?: number }
  | { type: 'circle'; radius: number; offsetX?: number; offsetY?: number }

/* ───────────────── Animación por deformación (declarativa) ───────────────── */

/** Tipos de animación disponibles (extensible: agregar kind + evaluator en anim.ts). */
export type AnimKind = 'pandeo' | 'frameSwap'

/**
 * Definición declarativa de animación, attachable a cualquier asset vía el
 * índice. Separación de responsabilidades del motor:
 *   - Renderer.image({ skewX }) = DEFORMACIÓN PURA (anclada en la base).
 *   - evalAnim(def, t)          = ANIMACIÓN (amplitud/frecuencia/fase → deformación por frame).
 *   - asset.anim                = PROPIEDAD (datos; cualquier asset puede llevarla).
 */
export interface AnimDef {
  kind: AnimKind
  /** Amplitud máxima de la deformación (pandeo: shear horizontal máx, ej. 0.16). */
  amplitude?: number
  /** Duración del ciclo completo en segundos (velocidad de loop). */
  periodSec?: number
  /** Desfasaje 0..1 dentro del ciclo (opcional; desincroniza instancias). */
  phase?: number
  // ── frameSwap ──
  /** Para frameSwap: si true = loop infinito. false = una vez + queda en último frame. */
  loop?: boolean
  /** Para frameSwap: duración total de la animación (separación auto = durationSec / frames.length). */
  durationSec?: number
  /** Para frameSwap: separación explícita entre frames (alternativa a durationSec). */
  frameIntervalSec?: number
}

/* ───────────────── Índice de assets ───────────────── */

export type AssetSourceType = 'file' | 'url' | 'procedural' | 'placeholder'

export interface AssetSourceDef {
  type: AssetSourceType
  /** Para 'file' (ruta pública en /public) o 'url' (https). */
  src?: string
  /** Para 'file'/'url' con animación frameSwap: lista de rutas de frames. */
  frames?: string[]
  /** Para 'procedural': nombre del drawer incorporado. */
  drawer?: string
  /** Etiqueta para placeholders. */
  label?: string
  /** Color base para placeholders. */
  color?: string
  /** Animación (pandeo = deformación, frameSwap = cambio de frames). */
  anim?: AnimDef
}

/* ───────────────── Fade ───────────────── */

export interface FadeConfig {
  fadeIn: number
  hold: number
  fadeOut: number
}

/* ───────────────── WorldObjectDef (genérico, interaction tipada por el juego) ───────────────── */

/**
 * Definición de un objeto del mundo: visual + lógica. El campo `interaction`
 * es genérico: cada juego tipa su propio payload (comercio, recolección,
 * conversación, mini-juego, lo que sea). El motor solo necesita saber si
 * hay interaction para mostrar el prompt; el contenido lo interpreta el
 * juego en su InteractionHandler.
 *
 * Contrato del brief técnico original §7:
 *
 * OBJECT
 * ├── visual: asset, x, y, scale, layer
 * └── logic:  collider, interaction
 */
export interface WorldObjectDef<TInteraction = unknown> {
  id: string
  /** assetId lógico (resuelto por el AssetIndex, nunca una ruta). */
  asset: string
  /** Posición base (ancla) en coordenadas virtuales. */
  x: number
  y: number
  scale?: number
  layer?: number
  anchor?: Anchor
  collision?: Collider | null
  /** Label visible del prompt; el juego lo puede sobreescribir vía i18n. */
  interactionLabel?: string
  /** Payload de interacción (el juego lo tipa). */
  interaction?: TInteraction | null
}

/* ───────────────── UI genérica ───────────────── */

export interface UIToast {
  id: number
  text: string
}

/**
 * Snapshot base que el engine publica hacia la UI React.
 * Campos comunes a cualquier juego (ready, screen, locale, audio, debug,
 * toasts, urls). Los datos específicos del juego (inventario, monedas,
 * diálogo actual, etc.) viven como campos extra que el juego agrega en su
 * propio tipo de snapshot (que extiende BaseUISnapshot).
 */
export interface BaseUISnapshot {
  ready: boolean
  /** Id de pantalla actual (string genérico; el juego acota con su unión). */
  screen: string
  locale: string
  muted: boolean
  volume: number
  debug: boolean
  toasts: UIToast[]
  /** URLs (data URLs / rutas) de assets de UI para usar en <img>. */
  urls: Record<string, string>
  /**
   * Estado opcional de interacción UI (diálogo/comercio/etc.). El juego lo
   * tipa; el motor solo lo transporta para que React lo pinte.
   */
  interaction?: unknown
}

/* ───────────────── Contrato de estado ───────────────── */

/**
 * Contrato mínimo que un estado de juego debe cumplir para que el motor lo
 * pueda observar. Cada juego implementa su propio GameState (con coins,
 * inventario, diálogos, lo que sea) pero debe exponer subscribe / markChanged
 * / reset para que el motor sincronice la UI.
 */
export interface GameStateContract {
  /** Se incrementa en cada cambio lógico → el engine sincroniza la UI. */
  version: number
  subscribe(fn: () => void): () => void
  markChanged(): void
  reset(): void
}

/* ───────────────── Audio procedural (definición de pista) ───────────────── */

/**
 * Definición declarativa de una pista procedural (WebAudio). El motor
 * (AudioManager) la interpreta para sintetizar música sin archivos.
 * Cada juego publica sus pistas en su GameModule.audioTracks.
 */
export interface TrackDef {
  bpm: number
  /** Progresión: 1 acorde (notas MIDI) por compás. */
  chords: number[][]
  /** Grados pentatónicos por corchea (16 pasos = 2 compases); -1 = silencio. */
  lead: number[]
  /** Escala global de la pista (menor = más tenue). */
  gain: number
}

/* ───────────────── Puente UI ───────────────── */

/** Puente hacia la UI React (implementado por el GameEngine). */
export interface UiBridge {
  /** Publica el estado de interacción actual (diálogo, comercio, etc.) o null. */
  setInteraction: (state: unknown | null) => void
}
