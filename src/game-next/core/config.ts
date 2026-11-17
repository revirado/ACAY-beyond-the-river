/**
 * Configuración del juego ACAY.
 *
 * Re-exporta config del motor + config específica de Acay: paleta andina,
 * exploración POV (puntero, hover), batalla rítmica (lanes, tabs, HP).
 */

// Re-export de config del motor.
export {
  VIRTUAL_WIDTH,
  VIRTUAL_HEIGHT,
  VIRTUAL_ASPECT,
  FADE_PRESETS,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_HUD_HEIGHT,
} from '@/engine/core/config'

import { FADE_PRESETS } from '@/engine/core/config'

/**
 * Paleta andina NOA (Valles Calchaquíes / Puna).
 * Tonos tierra: terracota, ocre, marrón, verde agostado, crema.
 * SIN azul/índigo (regla del proyecto + ambientación andina).
 */
export const PALETTE = {
  // Fondos / tierra
  cieloBajo: '#d9b98c',      // cielo bajo polvoriento
  tierra: '#b78f5e',          // tierra seca
  tierraOscura: '#8b6b3f',    // tierra sombra
  tierraClara: '#d9b98c',     // tierra clara
  // Roca / piedra
  piedra: '#9aa0a0',
  piedraOscura: '#6e7474',
  // Vegetación agostada
  verdeAgostado: '#7a8a5a',
  verdeOscuro: '#4a5a3a',
  // Acay (poncho + sombrero)
  poncho: '#a3552f',          // terracota
  ponchoOscuro: '#7a3f22',
  sombrero: '#3f2d1d',        // marrón muy oscuro
  sombreroAla: '#2a1f15',
  // Antagonista (silueta oscura)
  antagonista: '#1a1410',
  antagonistaBorde: '#3a2a1a',
  // UI
  pergamino: '#f3e3c2',       // fondo de diálogos (pergamino)
  pergaminoBorde: '#7c5230',
  tinta: '#3f2f23',           // texto sobre pergamino
  tintaClara: '#5a4a3a',
  acento: '#c96f4a',          // terracota brillante (CTA)
  acentoOscuro: '#a3552f',
  dorado: '#d9a83f',          // highlights
  // Tabs rítmicos
  tab: '#e6b655',             // tab normal (dorado)
  tabHit: '#d9534f',          // tab que golpea (rojo terracota)
  tabGhost: '#7e8484',        // tab fantasma (gris piedra)
  lane: '#3f2d1d',            // lane de la pista
  laneBorde: '#5a4a3a',
} as const

export const CONFIG = {
  fade: FADE_PRESETS,

  /** Pantalla de intro del estudio (logo wrongmeca.png). */
  studio: {
    background: PALETTE.tierraOscura,
    logoAsset: 'ui.studio_logo',
    logoScale: 0.8,
    fadeInMs: 900,
    holdMs: 1500,
    fadeOutMs: 700,
  },

  /** Exploración POV. */
  explore: {
    /** Color del puntero customizado. */
    cursorColor: PALETTE.acento,
    cursorSize: 14,
    /** Radio de detección de hover (distancia al centro del elemento). */
    hoverRadius: 120,
    /** Color de highlight al hover. */
    hoverHighlight: 'rgba(230,182,85,0.25)',
    /** Velocidad del typewriting (caracteres por segundo). */
    typewriterCps: 45,
  },

  /** Batalla rítmica (guitar-hero invertido: esquivar tabs). */
  rhythm: {
    /** Cantidad de lanes (eje horizontal). */
    lanes: 3,
    /** Lane inicial de Acay. */
    acayStartLane: 1,
    /** HP inicial de Acay. */
    maxHp: 3,
    /** Velocidad de cambio de lane (teclas izq/der, instantáneo por tab). */
    laneSwitchInstant: true,
    /** Duración de la batalla mockup (segundos). */
    battleDurationSec: 30,
    /** Intervalo de spawn de tabs (segundos). */
    tabIntervalSec: 0.6,
    /** Probabilidad de tab fantasma (0..1). */
    ghostChance: 0.2,
    /** Anticipación: tiempo desde que un tab aparece (lejos) hasta que llega (segundos). */
    tabTravelSec: 2.5,
  },

  /** Franja inferior ocupada por diálogos/inventario (React overlays). */
  hudHeight: 180,
} as const
