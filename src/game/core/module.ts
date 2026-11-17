import type { GameModule, GameSnapshotContext } from '@/engine/core/module'
import type { GameScreen } from '@/engine/core/ScreenManager'
import type { ScreenContext } from '@/engine/core/context'
import type { LocaleEntry } from '@/engine/i18n'
import type { TrackDef } from '@/engine/core/types'
import type {
  CozySnapshot,
  UIInteractionState,
  ScreenId,
  MusicTrackId,
} from '@/game/core/types'
import type { CozyGameState } from '@/game/state/gameState'
import type { CozyEngine } from '@/game/core/engineBridge'

import { CONFIG, MUSIC_BY_SCREEN } from '@/game/core/config'
import { ASSET_INDEX, UI_ASSET_URLS } from '@/game/data/assetIndex'
import { evaluateProgression } from '@/game/data/progression'
import { DRAWERS } from '@/game/assets/drawers'
import { COZY_TRACKS } from '@/game/audio/tracks'
import { useGameStore } from '@/game/state/store'
import { CozyGameState } from '@/game/state/gameState'
import { setLocale, getLocale, tOr } from '@/engine/i18n'
import { stageMessageKey } from '@/game/i18n'

import { TitleScreen } from '@/game/screens/TitleScreen'
import { StudioScreen } from '@/game/screens/StudioScreen'
import { IntroScreen } from '@/game/screens/IntroScreen'
import { GameScreen as GameplayScreen } from '@/game/screens/GameScreen'
import { InteractionScreen } from '@/game/screens/InteractionScreen'
import { MenuScreen } from '@/game/screens/MenuScreen'
import { RestartScreen } from '@/game/screens/RestartScreen'

import { INTERACTION_HANDLERS, findWorldObject } from '@/game/logic/interactions'
import type { AssetLoader } from '@/engine/assets/AssetLoader'

// Locales cozy (importados estáticamente).
import en from '@/game/i18n/locales/en.json'
import es from '@/game/i18n/locales/es.json'

const COZY_LOCALES: LocaleEntry[] = [
  { id: 'en', label: 'English', dict: en },
  { id: 'es', label: 'Español', dict: es },
]

/** Tracks cozy tipadas como Record<string, TrackDef> (MusicTrackId ⊂ string). */
const COZY_AUDIO_TRACKS: Record<string, TrackDef> = COZY_TRACKS as Record<
  MusicTrackId,
  TrackDef
>

/**
 * Helper: construye el snapshot cozy desde el estado + servicios del motor.
 * Los campos `urls` e `interaction` los rellena el motor después (syncUI).
 */
function buildCozySnapshot(ctx: GameSnapshotContext<CozyGameState>): CozySnapshot {
  const st = ctx.state
  return {
    ready: true,
    screen: (ctx.screens.currentId ?? 'title') as ScreenId,
    locale: getLocale() as 'es' | 'en',
    coins: st.coins,
    inventory: { ...st.inventory },
    prosperity: st.prosperity,
    ovenUnlocked: st.ovenUnlocked,
    interaction: null, // el motor lo rellena con currentInteraction
    toasts: [], // el motor lo rellena desde el store
    muted: ctx.audio.isMuted,
    volume: ctx.audio.getVolume(),
    debug: ctx.debug,
    urls: {}, // el motor lo rellena desde uiAssetUrls
  }
}

/**
 * Helper: hook llamado en cada cambio lógico del estado cozy.
 * Evalúa progresión y emite toast si sube de etapa.
 */
function onCozyStateChanged(
  state: CozyGameState,
  ctx: GameSnapshotContext<CozyGameState>,
): void {
  const stage = evaluateProgression(state)
  if (stage) {
    ctx.pushToast(tOr(stageMessageKey(stage.level), stage.message))
  }
}

/**
 * Módulo del juego cozy (referencia). Implementa GameModule del motor y
 * conecta TODO lo específico del juego cozy: assets, drawers, locales, store,
 * estado inicial, pantallas, música, snapshot, progresión y acciones UI.
 *
 * El motor recibe este módulo en su constructor y lo usa para arrancar el
 * juego cozy sin conocer ninguno de sus detalles internos.
 */
export const cozyModule: GameModule<CozyGameState, CozySnapshot> = {
  id: 'cozy-trading-village',

  assetIndex: ASSET_INDEX,
  drawers: DRAWERS,
  uiAssetUrls: UI_ASSET_URLS,

  locales: COZY_LOCALES,
  defaultLocale: 'en',

  store: useGameStore,

  createInitialState(): CozyGameState {
    return new CozyGameState()
  },

  createScreens(ctx: ScreenContext<CozyGameState>): GameScreen[] {
    const gameplay = new GameplayScreen()
    return [
      new StudioScreen(),
      new TitleScreen(),
      new IntroScreen(),
      gameplay,
      new InteractionScreen(),
      new MenuScreen(gameplay),
      new RestartScreen(gameplay),
    ]
  },

  initialScreen: 'studio',

  musicByScreen: MUSIC_BY_SCREEN as Record<ScreenId, MusicTrackId>,

  audioTracks: COZY_AUDIO_TRACKS,

  buildSnapshot: buildCozySnapshot,

  onStateChanged: onCozyStateChanged,

  initialFadeIn: 700,

  clockDayLengthSec: CONFIG.day.dayLengthSec,

  uiActions: {
    /** Desde el título: intro (si no se vio) o directamente al pueblo. */
    startFromTitle(engine: unknown): void {
      const e = engine as CozyEngine
      const target = e.state.introCompleted ? 'gameplay' : 'intro'
      e.screens.requestSwitch(target, undefined, CONFIG.fade.normal)
    },

    resume(engine: unknown): void {
      const e = engine as CozyEngine
      e.screens.requestSwitch('gameplay', undefined, null)
    },

    requestRestart(engine: unknown): void {
      const e = engine as CozyEngine
      e.screens.requestSwitch('restart', undefined, null)
    },

    cancelRestart(engine: unknown): void {
      const e = engine as CozyEngine
      e.screens.requestSwitch('menu', undefined, null)
    },

    confirmRestart(engine: unknown): void {
      const e = engine as CozyEngine
      e.setInteraction(null)
      e.state.reset()
      e.screens.requestSwitch('intro', undefined, CONFIG.fade.long)
    },

    closeInteraction(engine: unknown): void {
      const e = engine as CozyEngine
      e.setInteraction(null)
      e.screens.requestSwitch('gameplay', undefined, CONFIG.fade.fast)
    },

    /** Ejecuta una opción del diálogo de interacción actual. */
    interactionAction(engine: unknown, optionId: unknown): void {
      const e = engine as CozyEngine
      const current = e.getInteraction() as UIInteractionState | null
      if (!current) return
      const obj = findWorldObject(current.objectId)
      if (!obj?.interaction) return
      const handler = INTERACTION_HANDLERS[obj.interaction.type]
      const result = handler.execute(obj.id, optionId as string, e.state)
      const rebuilt = handler.build(obj.id, e.state, e.assets as AssetLoader)
      e.setInteraction({ ...rebuilt, resultMessage: result.message })
    },

    /** Cambia el idioma de la UI cozy. */
    setLocale(_engine: unknown, locale: unknown): void {
      setLocale(locale as string)
    },
  },
}
