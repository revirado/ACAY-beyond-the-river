/**
 * Configuración GENÉRICA del motor: parámetros de presentación ajustables
 * sin tocar lógica de juego. Lo que es específico de un juego (movementAngle,
 * worldBounds, day cycle, etc.) vive en el config del juego
 * (ej. src/game/core/config.ts).
 */

/** Resolución virtual fija (espacio de gameplay). */
export const VIRTUAL_WIDTH = 1280
export const VIRTUAL_HEIGHT = 720
export const VIRTUAL_ASPECT = VIRTUAL_WIDTH / VIRTUAL_HEIGHT

/** Presets de fade reutilizables (en ms: fadeIn / hold / fadeOut). */
export const FADE_PRESETS = {
  fast: { fadeIn: 200, hold: 0, fadeOut: 200 },
  normal: { fadeIn: 450, hold: 0, fadeOut: 450 },
  /** Transición larga con hold — útil para resets / intros importantes. */
  long: { fadeIn: 800, hold: 900, fadeOut: 800 },
} as const

/** Volumen inicial de la música (0..1). El usuario puede ajustarlo en runtime. */
export const DEFAULT_MUSIC_VOLUME = 0.5

/**
 * Franja inferior reservada para el HUD (React overlays). El mundo puede
 * evitar dibujar gameplay ahí. El juego decide si respeta o no este valor.
 */
export const DEFAULT_HUD_HEIGHT = 112
