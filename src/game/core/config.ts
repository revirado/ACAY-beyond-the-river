/**
 * Configuración ESPECÍFICA del juego cozy (referencia).
 *
 * Re-exporta la config genérica del motor (VIRTUAL_WIDTH/HEIGHT/ASPECT,
 * FADE_PRESETS, DEFAULT_MUSIC_VOLUME, DEFAULT_HUD_HEIGHT) para que el código
 * cozy pueda importar todo desde `@/game/core/config` como antes.
 *
 * La config cozy (movementAngle, playerSpeed, worldBounds, day cycle, intro,
 * studio, MUSIC_BY_SCREEN) vive aquí — es específica de este juego.
 */

// Re-export de config del motor (backwards-compat).
export {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  VIRTUAL_ASPECT,
  FADE_PRESETS,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_HUD_HEIGHT,
} from '@/engine/core/config'

import { FADE_PRESETS, DEFAULT_MUSIC_VOLUME, DEFAULT_HUD_HEIGHT } from '@/engine/core/config'
import type { ScreenId, MusicTrackId } from '@/game/core/types'

/**
 * Config cozy: parámetros de presentación y gameplay ajustables sin tocar
 * lógica. Los presets de fade referencian FADE_PRESETS del motor (mismos
 * valores, una sola fuente de verdad).
 */
export const CONFIG = {
  /** Convención de perspectiva caballera: solo transforma input → vectores. */
  movementAngle: 45,

  playerSpeed: 240,
  playerCollider: { width: 44, height: 26 },

  /** Radio de detección de interacción (distancia al punto base del objeto). */
  interactRadius: 78,

  /** Duración del ciclo de frames de caminata del sprite del mapa. */
  walkFrameMs: 160,

  /** Límites del área jugable en coordenadas virtuales. */
  worldBounds: { minX: 70, maxX: 1210, minY: 195, maxY: 612 },

  /** Presets de fade (referencian el motor). */
  fade: FADE_PRESETS,

  intro: {
    startX: -110,
    endX: 990,
    y: 500,
    speed: 150,
    frameMs: 170,
    /** Tiempo de espera tras llegar a la puerta antes del fade. */
    arrivalDelay: 500,
  },

  /**
   * Pantalla de intro del estudio (solo en la primera carga).
   * - `background`: color sólido de fondo (editable).
   * - `logoAsset`: asset del índice usado como logo (placeholder por defecto;
   *   se reemplaza por el logo real editando SOLO el índice de assets).
   * - Envolvente temporal del logo: fade in → hold → fade out.
   */
  studio: {
    background: '#ffffff',
    logoAsset: 'ui.studio_logo',
    logoScale: 0.8,
    fadeInMs: 900,
    holdMs: 1500,
    fadeOutMs: 700,
  },

  /**
   * Ciclo día/noche del indicador temporal del HUD (datos, no lógica).
   * `dayLengthSec`: duración de un día completo en segundos reales.
   * Las fases son fracciones del ciclo: [inicio, fin) de cada una.
   */
  day: {
    dayLengthSec: 180,
    phases: [
      { id: 'dawn', from: 0.0, to: 0.15 },
      { id: 'day', from: 0.15, to: 0.6 },
      { id: 'dusk', from: 0.6, to: 0.72 },
      { id: 'night', from: 0.72, to: 1.0 },
    ],
  },

  /** Franja inferior ocupada por el HUD (React). */
  hudHeight: DEFAULT_HUD_HEIGHT,

  musicVolume: DEFAULT_MUSIC_VOLUME,
} as const

/** Música por pantalla (el AudioManager del motor la interpreta). */
export const MUSIC_BY_SCREEN: Record<ScreenId, MusicTrackId> = {
  studio: 'title',
  title: 'title',
  intro: 'intro',
  gameplay: 'village',
  interaction: 'village',
  menu: 'menu',
  restart: 'menu',
}
