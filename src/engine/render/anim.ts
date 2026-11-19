import type { AnimDef, AnimKind } from '@/engine/core/types'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SISTEMA DE ANIMACIÓN — motor, aplicable a CUALQUIER asset.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Separación estricta (así se agregan nuevas animaciones sin tocar las existentes):
 *
 *   1. DEFORMACIÓN (Renderer): `image({ skewX })` hace UNA cosa — cizallar la
 *      imagen anclada en su base. No sabe nada de tiempo ni de viento. Funciona
 *      igual para arte procedural (canvas), SVG placeholder, PNG (file) o url:
 *      la deformación se aplica en el momento del dibujo, no se hornea en el asset.
 *
 *   2. ANIMACIÓN (este módulo): convierte tiempo → deformación / frame index.
 *      Cada kind es un evaluator puro (def, t) → Deform.
 *        - `pandeo` = oscilador senoidal (viento).
 *        - `frameSwap` = cambio de frames por tiempo (sprite animation).
 *
 *   3. PROPIEDAD (assetIndex): `anim: { kind, ... }`.
 *      Un asset sin `anim` NO evalúa nada (costo cero cuando no se usa).
 *
 * Extender = 1 entrada en ANIM_EVALUATORS. Nada más.
 */

/** Estado de deformación + frame por frame que el renderer aplica al dibujar. */
export interface Deform {
  /** Cizalla horizontal: desplaza la parte superior ~skewX×alto, base fija. */
  skewX: number
  /** Para frameSwap: índice del frame actual (0-based). */
  frameIndex: number
}

type AnimEvaluator = (def: AnimDef, timeSec: number, out: Deform) => void

/** pandeo — skew senoidal anclado en la base, imita pasto movido por el viento. */
function evalPandeo(def: AnimDef, timeSec: number, out: Deform): void {
  const period = def.periodSec ?? 1
  const cycles = timeSec / period + (def.phase ?? 0)
  out.skewX = (def.amplitude ?? 0) * Math.sin(cycles * Math.PI * 2)
}

/**
 * frameSwap — cambio de frames por tiempo (sprite animation).
 * Calcula el frame index según el tiempo y los parámetros:
 *   - loop=true: cicla infinitamente.
 *   - loop=false: reproduce una vez y queda en el último frame.
 *   - Separación: durationSec / frames.length (auto) o frameIntervalSec (explícita).
 */
function evalFrameSwap(def: AnimDef, timeSec: number, out: Deform): void {
  // frameCount se obtiene del AssetLoader (no está en AnimDef).
  // El AssetLoader llama a evalFrameSwapIndex directamente.
  // Esta función es un placeholder — la lógica real está en evalFrameIndex.
  out.skewX = 0
  out.frameIndex = 0
}

/**
 * Calcula el índice de frame para una animación frameSwap.
 * @param def definición de animación (loop, durationSec, frameIntervalSec)
 * @param timeSec tiempo de juego
 * @param frameCount cantidad total de frames
 * @returns índice 0-based del frame actual
 */
export function evalFrameIndex(
  def: AnimDef,
  timeSec: number,
  frameCount: number,
): number {
  if (frameCount <= 1) return 0
  const interval = def.frameIntervalSec ?? (def.durationSec ?? 1) / frameCount
  const rawIndex = timeSec / interval
  if (!def.loop && rawIndex >= frameCount) {
    return frameCount - 1 // queda en último frame
  }
  return Math.floor(rawIndex) % frameCount
}

/** Registro de evaluadores: kind → lógica de animación. */
const ANIM_EVALUATORS: Record<AnimKind, AnimEvaluator> = {
  pandeo: evalPandeo,
  frameSwap: evalFrameSwap,
}

/** Buffer reutilizado por frame (cero allocaciones en el loop). NO retener el resultado. */
const SHARED_DEFORM: Deform = { skewX: 0, frameIndex: 0 }

/**
 * Evalúa la animación en el tiempo dado (segundos de juego) y devuelve la
 * deformación a aplicar este frame.
 */
export function evalAnim(
  def: AnimDef,
  timeSec: number,
  phaseShift = 0,
  out: Deform = SHARED_DEFORM,
): Deform {
  const evaluator = ANIM_EVALUATORS[def.kind]
  if (evaluator) evaluator(def, timeSec + phaseShift * (def.periodSec ?? 1), out)
  return out
}

/**
 * Fase determinista (0..1) a partir del id de la instancia — desincroniza
 * instancias del mismo asset de forma estable entre ejecuciones (FNV-1a).
 */
export function phaseFromId(id: string): number {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}
