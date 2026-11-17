/**
 * Tipos ESPECÍFICOS del juego cozy (referencia).
 *
 * Re-exporta los tipos genéricos del motor (Vec2, Collider, AssetSourceDef,
 * AnimDef, FadeConfig, etc.) para que el código cozy pueda importar todo desde
 * `@/game/core/types` como antes. Los tipos cozy-concretos (ScreenId, ItemId,
 * InteractionType, GameUISnapshot con coins/inventory/prosperity, etc.) se
 * definen aquí y especializan los genéricos del motor.
 */

// Re-export de tipos del motor (backwards-compat con imports cozy existentes).
export type {
  Vec2,
  Anchor,
  AssetImage,
  Collider,
  AssetSourceDef,
  AssetSourceType,
  AnimKind,
  AnimDef,
  FadeConfig,
  UIToast,
  BaseUISnapshot,
  GameStateContract,
  TrackDef,
  UiBridge,
} from '@/engine/core/types'

import type { BaseUISnapshot, WorldObjectDef as EngineWorldObjectDef } from '@/engine/core/types'

/* ───────────────── Tipos cozy-concretos ───────────────── */

/** Pantallas del juego cozy (unión cerrada). */
export type ScreenId =
  | 'studio'
  | 'title'
  | 'intro'
  | 'gameplay'
  | 'interaction'
  | 'menu'
  | 'restart'

/** Ítems del juego cozy. */
export type ItemId = 'wheat' | 'apple' | 'wood' | 'bread'

/** Tipos de interacción del juego cozy. */
export type InteractionType = 'merchant' | 'gather' | 'oven'

/** Fase del ciclo día/noche del indicador temporal del HUD. */
export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night'

/** Pistas de música del juego cozy. */
export type MusicTrackId = 'title' | 'intro' | 'village' | 'menu'

/** Forma del payload `interaction` en los WorldObjects del juego cozy. */
export interface CozyInteractionPayload {
  type: InteractionType
  label: string
  /** Para 'gather': qué recurso se recolecta. */
  resource?: ItemId
}

/**
 * Definición de un objeto del mundo cozy (visual + lógica).
 * Especializa WorldObjectDef del motor con el payload cozy.
 */
export type WorldObjectDef = EngineWorldObjectDef<CozyInteractionPayload>

/** Costo/ganancia de una transacción (ítem + cantidad). */
export interface CostItem {
  item: ItemId
  count: number
}

/** Opción mostrada en la UI de interacción (comercio/recolección/producción). */
export interface UIInteractionOption {
  id: string
  kind: 'sell' | 'buy' | 'build' | 'gather' | 'produce'
  label: string
  description: string
  /** Línea de costo/ganancia, ej: "Cuesta: 3 monedas" o "Ganas: 1 moneda". */
  costLine: string
  disabled: boolean
  disabledReason: string
}

/** Estado de interacción UI publicado al store por el módulo cozy. */
export interface UIInteractionState {
  objectId: string
  kind: InteractionType
  targetName: string
  greeting: string
  /** assetId del retrato detallado del interlocutor/objeto. */
  targetAssetId: string
  options: UIInteractionOption[]
  /** Mensaje de resultado de la última acción (o null). */
  resultMessage: string | null
}

/**
 * Snapshot cozy del juego (extiende BaseUISnapshot del motor con los campos
 * específicos: coins, inventory, prosperity, ovenUnlocked, interaction).
 */
export interface CozySnapshot extends BaseUISnapshot {
  screen: ScreenId
  locale: 'es' | 'en'
  coins: number
  inventory: Record<ItemId, number>
  prosperity: number
  ovenUnlocked: boolean
  interaction: UIInteractionState | null
}

/** Alias para backwards-compat: el código cozy usa GameUISnapshot. */
export type GameUISnapshot = CozySnapshot
