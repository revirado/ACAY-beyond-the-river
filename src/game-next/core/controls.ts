/**
 * ═══════════════════════════════════════════════════════════════════
 *  CONTROLES — settings centralizados de teclas del juego Acay.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Todas las teclas mapeadas a acciones. Cambiar un control = editar SOLO
 * este archivo. Reutilizable: cada screen importa CONTROLS y usa
 * `wasAnyPressed(input, CONTROLS.accion)`.
 *
 * Los códigos son KeyboardEvent.code (estándar DOM).
 */

/** Helper: ¿alguna de estas teclas fue presionada este frame? */
export function wasAnyPressed(
  input: { wasPressed: (code: string) => boolean },
  codes: readonly string[],
): boolean {
  return codes.some((c) => input.wasPressed(c))
}

/** Helper: ¿alguna de estas teclas está mantenida? */
export function isAnyDown(
  input: { isDown: (code: string) => boolean },
  codes: readonly string[],
): boolean {
  return codes.some((c) => input.isDown(c))
}

export const CONTROLS = {
  /** Saltar intros / diálogos / esperar. */
  skip: ['Enter', 'Space', 'NumpadEnter'] as const,
  /** Interactuar (mismo que skip en contextos point-and-click). */
  interact: ['Enter', 'Space', 'NumpadEnter'] as const,
  /** Cancelar / cerrar / volver. */
  cancel: ['Escape'] as const,
  /** Esquiva izquierda (batalla rítmica). */
  dodgeLeft: ['ArrowLeft', 'KeyA'] as const,
  /** Esquiva derecha (batalla rítmica). */
  dodgeRight: ['ArrowRight', 'KeyD'] as const,
  /** Abrir/cerrar inventario. */
  inventory: ['KeyI', 'Tab'] as const,
  /** Mute on/off (genérico del motor). */
  mute: ['KeyM'] as const,
  /** Debug colliders (genérico del motor). */
  debug: ['F3'] as const,
} as const
