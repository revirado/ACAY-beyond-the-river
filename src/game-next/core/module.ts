import type { GameModule, GameSnapshotContext } from '@/engine/core/module'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { ScreenContext } from '@/engine/core/context'
import type { LocaleEntry } from '@/engine/i18n'
import type { TrackDef } from '@/engine/core/types'
import type { AcaySnapshot, ScreenId, MusicTrackId } from '@/game-next/core/types'
import type { AcayGameState } from '@/game-next/state/gameState'

import { ASSET_INDEX, UI_ASSET_URLS } from '@/game-next/data/assetIndex'
import { DRAWERS } from '@/game-next/assets/drawers'
import { useGameStore } from '@/game-next/state/store'
import { AcayGameState as AcayState } from '@/game-next/state/gameState'
import { CONFIG } from '@/game-next/core/config'
import { getLocale } from '@/engine/i18n'

import { StudioScreen } from '@/game-next/screens/StudioScreen'
import { TitleScreen } from '@/game-next/screens/TitleScreen'
import { ExploreScreen } from '@/game-next/screens/ExploreScreen'
import { RhythmBattleScreen } from '@/game-next/screens/RhythmBattleScreen'

// Locales del juego Acay.
import en from '@/game-next/i18n/locales/en.json'
import es from '@/game-next/i18n/locales/es.json'

const ACAY_LOCALES: LocaleEntry[] = [
  { id: 'es', label: 'Español', dict: es },
  { id: 'en', label: 'English', dict: en },
]

/** Música por pantalla (mockup: sin pistas todavía → silencio). */
const MUSIC_BY_SCREEN: Record<ScreenId, MusicTrackId | undefined> = {
  studio: 'explore',
  title: 'explore',
  explore: 'explore',
  'rhythm-battle': 'battle',
}

/** Pistas procedurales mockup (vacío por ahora — el motor no reproduce nada). */
const AUDIO_TRACKS: Record<string, TrackDef> = {
  // TODO: definir pistas procedurales cuando se decida el estilo musical.
}

/**
 * Helper: construye el snapshot Acay desde el estado + servicios del motor.
 * Los campos `urls`, `toasts` e `interaction` los rellena el motor después.
 */
function buildAcaySnapshot(ctx: GameSnapshotContext<AcayState>): AcaySnapshot {
  const st = ctx.state
  const sid = ctx.screens.currentId ?? 'studio'

  // Diálogo actual (si hay)
  let dialogue: AcaySnapshot['dialogue'] = null
  if (st.currentDialogue && st.dialogueIndex < st.currentDialogue.length) {
    const line = st.currentDialogue[st.dialogueIndex]
    dialogue = {
      phase: st.dialoguePhase,
      speaker: line.speaker,
      fullText: line.text,
      isAcay: line.isAcay ?? false,
      lineIndex: st.dialogueIndex,
      lineCount: st.currentDialogue.length,
      waitSec: line.waitSec ?? 0,
    }
  }

  // Batalla (si hay)
  let battle: AcaySnapshot['battle'] = null
  if (st.battle) {
    const b = st.battle
    const elapsed = (performance.now() - b.startMs) / 1000
    battle = {
      antagonistName: b.antagonistName,
      hp: b.hp,
      maxHp: CONFIG.rhythm.maxHp,
      dodges: b.dodges,
      hits: b.hits,
      lanes: b.lanes,
      acayLane: b.acayLane,
      elapsedSec: elapsed,
      durationSec: b.durationSec,
    }
  }

  return {
    ready: true,
    screen: sid as ScreenId,
    locale: getLocale() as 'es' | 'en',
    muted: ctx.audio.isMuted,
    volume: ctx.audio.getVolume(),
    debug: ctx.debug,
    toasts: [],
    urls: {},
    dialogue,
    inventory: st.inventory,
    battle,
    hoveredElementId: st.hoveredElementId,
    uiUnlocked: !!st.flags.acayAwakened,
    inventoryUnlocked: !!st.flags.inventoryUnlocked,
    objective: st.objective,
  }
}

/**
 * Módulo del juego ACAY / BEYOND THE RIVER.
 *
 * Implementa GameModule del motor y conecta TODO lo específico del juego:
 * assets (mockup + logo studio), drawers procedurales andinos, locales (es/en),
 * store, estado inicial (AcayGameState), 3 pantallas (StudioScreen →
 * ExploreScreen → RhythmBattleScreen), música por pantalla (mockup: silencio),
 * snapshot y (por ahora) sin uiActions (las transiciones son internas a las
 * pantallas).
 */
export const acayModule: GameModule<AcayState, AcaySnapshot> = {
  id: 'acay-beyond-the-river',

  assetIndex: ASSET_INDEX,
  drawers: DRAWERS,
  uiAssetUrls: UI_ASSET_URLS,

  locales: ACAY_LOCALES,
  defaultLocale: 'es',

  store: useGameStore,

  createInitialState(): AcayState {
    return new AcayState()
  },

  createScreens(_ctx: ScreenContext<AcayState>): GameScreen[] {
    return [
      new StudioScreen(),
      new TitleScreen(),
      new ExploreScreen(),
      new RhythmBattleScreen(),
    ]
  },

  initialScreen: 'studio',

  musicByScreen: MUSIC_BY_SCREEN as Record<string, string>,

  audioTracks: AUDIO_TRACKS,

  buildSnapshot: buildAcaySnapshot,

  // onStateChanged: sin progresión por ahora (stub).

  initialFadeIn: 700,

  // clockDayLengthSec: el juego Acay no tiene ciclo día/noche (mockup).

  uiActions: {
    // TODO: acciones del juego (iniciar diálogo desde React, etc.) cuando
    // el inventario drag-combine o menús React lo requieran.
  },
}
