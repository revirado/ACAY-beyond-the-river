/**
 * Tipos del NUEVO juego (stub — listo para recibir el brief detallado).
 *
 * Cuando el brief llegue, aquí se definen:
 *   - ScreenId: unión de pantallas del nuevo juego (ej. 'explore' | 'dialogue' | 'guitar-hero').
 *   - Tipos de interacción (narrative hover, conversación, mini-juego rhythm).
 *   - Snapshot del nuevo juego (extiende BaseUISnapshot con sus campos:
 *     inventario, diálogo actual, estado del mini-juego, etc.).
 *
 * Por ahora, un stub mínimo: una sola pantalla 'placeholder'.
 */
import type { BaseUISnapshot } from '@/engine/core/types'

/** Pantallas del nuevo juego (stub — ampliar según el brief). */
export type ScreenId = 'placeholder'

/**
 * Snapshot del nuevo juego. Stub: solo los campos base del motor.
 * Cuando llegue el brief, extender con:
 *   - diálogo actual (typewriter text, speaker, etc.)
 *   - inventario / items
 *   - estado del modo guitar-hero (tabs, score, personaje)
 *   - progreso narrativo
 */
export interface NewGameSnapshot extends BaseUISnapshot {
  screen: ScreenId
}
