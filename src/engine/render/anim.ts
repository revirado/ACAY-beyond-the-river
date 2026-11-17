import type { AnimDef, AnimKind } from '@/engine/core/types'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ANIMACIÓN POR DEFORMACIÓN — feature de motor, aplicable a CUALQUIER asset.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Separación estricta (así se agregan nuevas animaciones sin tocar las existentes):
 *
 *   1. DEFORMACIÓN (Renderer): `image({ skewX })` hace UNA cosa — cizallar la
 *      imagen anclada en su base. No sabe nada de tiempo ni de viento. Funciona
 *      igual para arte procedural (canvas), SVG placeholder, PNG (file) o url:
 *      la deformación se aplica en el momento del dibujo, no se hornea en el asset.
 *
 *   2. ANIMACIÓN (este módulo): convierte tiempo → deformación. Cada kind es un
 *      evaluator puro (def, t) → Deform. `pandeo` = oscilador senoidal que
 *      imita viento; la velocidad de loop y la amplitud viven en la DEFINICIÓN
 *      (datos del índice), no en la función de deformación.
 *
 *   3. PROPIEDAD (assetIndex): `anim: { kind, amplitude, periodSec, phase }`.
 *      Un asset sin `anim` NO evalúa nada (costo cero cuando no se usa).
 *
 * Extender = 1 entrada en ANIM_EVALUATORS (+ campos nuevos en Deform si hacen
 * falta). Nada más.
 */

/** Estado de deformación por frame que el renderer aplica al dibujar. */
export interface Deform {
  /** Cizalla horizontal: desplaza la parte superior ~skewX×alto, base fija. */
  skewX: number
}

type AnimEvaluator = (def: AnimDef, timeSec: number, out: Deform) => void

/** pandeo — skew senoidal anclado en la base, imita pasto movido por el viento. */
function evalPandeo(def: AnimDef, timeSec: number, out: Deform): void {
  const cycles = timeSec / def.periodSec + (def.phase ?? 0)
  out.skewX = def.amplitude * Math.sin(cycles * Math.PI * 2)
}

/** Registro de evaluadores: kind → lógica de animación. */
const ANIM_EVALUATORS: Record<AnimKind, AnimEvaluator> = {
  pandeo: evalPandeo,
}

/** Buffer reutilizado por frame (cero allocaciones en el loop). NO retener el resultado. */
const SHARED_DEFORM: Deform = { skewX: 0 }

/**
 * Evalúa la animación en el tiempo dado (segundos de juego) y devuelve la
 * deformación a aplicar este frame.
 *
 * @param phaseShift desfasaje POR INSTANCIA en unidades de fase (0..1): permite
 *   que varias instancias del mismo asset no oscilen sincronizadas (campo de
 *   viento). Se implementa como corrimiento de tiempo → no aloca.
 */
export function evalAnim(
  def: AnimDef,
  timeSec: number,
  phaseShift = 0,
  out: Deform = SHARED_DEFORM,
): Deform {
  const evaluator = ANIM_EVALUATORS[def.kind]
  if (evaluator) evaluator(def, timeSec + phaseShift * def.periodSec, out)
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
