import type { GameModule, GameSnapshotContext } from '@/engine/core/module'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { ScreenContext } from '@/engine/core/context'
import type { LocaleEntry } from '@/engine/i18n'
import type { TrackDef } from '@/engine/core/types'
import type { NewGameSnapshot, ScreenId, MusicTrackId } from '@/game-next/core/types'
import type { NewGameState } from '@/game-next/state/gameState'

import { ASSET_INDEX, UI_ASSET_URLS } from '@/game-next/data/assetIndex'
import { useGameStore } from '@/game-next/state/store'
import { NewGameState as NewState } from '@/game-next/state/gameState'
import { getLocale } from '@/engine/i18n'

import { PlaceholderScreen } from '@/game-next/screens/PlaceholderScreen'

// Locales del nuevo juego (importados estáticamente).
import en from '@/game-next/i18n/locales/en.json'
import es from '@/game-next/i18n/locales/es.json'

const NEW_GAME_LOCALES: LocaleEntry[] = [
  { id: 'en', label: 'English', dict: en },
  { id: 'es', label: 'Español', dict: es },
]

/**
 * Música por pantalla del nuevo juego (stub — sin pistas todavía).
 * Cuando llegue el brief, definir las pistas rítmicas para guitar-hero
 * y música ambiente para exploración.
 */
const MUSIC_BY_SCREEN: Record<ScreenId, MusicTrackId | undefined> = {
  placeholder: undefined, // silencio por ahora
}

/** Pistas procedurales del nuevo juego (stub — vacío). */
const AUDIO_TRACKS: Record<string, TrackDef> = {
  // TODO(brief): definir pistas rítmicas para guitar-hero.
}

/**
 * Helper: construye el snapshot del nuevo juego desde el estado + servicios.
 * Stub: solo los campos base. Cuando llegue el brief, extender con los
 * campos del nuevo juego (diálogo, inventario, estado guitar-hero, etc.).
 */
function buildSnapshot(ctx: GameSnapshotContext<NewState>): NewGameSnapshot {
  return {
    ready: true,
    screen: (ctx.screens.currentId ?? 'placeholder') as ScreenId,
    locale: getLocale(),
    muted: ctx.audio.isMuted,
    volume: ctx.audio.getVolume(),
    debug: ctx.debug,
    toasts: [],
    urls: {},
    interaction: null,
  }
}

/**
 * Módulo del NUEVO juego (stub).
 *
 * Implementa GameModule del motor con un GameModule mínimo: una sola
 * pantalla placeholder, sin assets reales, sin música, sin estado complejo.
 * Demuestra que el motor puede hostear un segundo juego sin modificaciones.
 *
 * Cuando llegue el brief detallado, este módulo se completa con:
 *   - Pantallas reales (exploración/conversación, guitar-hero).
 *   - Assets del índice (escenarios, personajes, UI).
 *   - Estado del juego (progreso narrativo, inventario, mini-juego).
 *   - Música (pistas rítmicas para guitar-hero).
 *   - Acciones UI (iniciar conversación, cambiar a guitar-hero, etc.).
 */
export const newGameModule: GameModule<NewState, NewGameSnapshot> = {
  id: 'new-game-stub',

  assetIndex: ASSET_INDEX,
  drawers: {}, // sin drawers procedurales todavía
  uiAssetUrls: UI_ASSET_URLS,

  locales: NEW_GAME_LOCALES,
  defaultLocale: 'en',

  store: useGameStore,

  createInitialState(): NewState {
    return new NewState()
  },

  createScreens(_ctx: ScreenContext<NewState>): GameScreen[] {
    return [new PlaceholderScreen()]
  },

  initialScreen: 'placeholder',

  musicByScreen: MUSIC_BY_SCREEN as Record<string, string>,

  audioTracks: AUDIO_TRACKS,

  buildSnapshot,

  // onStateChanged: stub — sin progresión todavía.

  initialFadeIn: 600,

  // clockDayLengthSec: el nuevo juego no tiene ciclo día/noche (stub).

  uiActions: {
    // TODO(brief): acciones del nuevo juego (iniciar diálogo, guitar-hero, etc.).
  },
}
