import type { UIInteractionState, InteractionType, WorldObjectDef } from '@/game/core/types'
import type { GameState } from '@/game/state/gameState'
import type { AssetLoader } from '@/engine/assets/AssetLoader'
import { TRADES, BREAD_RECIPE } from '@/game/data/trades'
import { WORLD_LAYOUT } from '@/game/data/world'
import { t, tOr, itemNameLower } from '@/game/i18n'
import { canAffordCosts, costLineOf, executeTrade, produceBread, gatherResource, tradeById, type ActionResult } from './EconomySystem'

export interface InteractionHandler {
  /** Construye el snapshot de UI para la interacción con el objeto. */
  build(objectId: string, state: GameState, assets: AssetLoader): UIInteractionState
  /** Ejecuta una opción sobre el estado. */
  execute(objectId: string, optionId: string, state: GameState): ActionResult
}

export function findWorldObject(objectId: string): WorldObjectDef | undefined {
  return WORLD_LAYOUT.find((o) => o.id === objectId)
}

/* ────────────────────────── Comerciante ────────────────────────── */

const merchantHandler: InteractionHandler = {
  build(objectId, state) {
    const options = TRADES.filter((offer) => !(offer.once && state.flags[`trade:${offer.id}`])).map((offer) => {
      const affordable = canAffordCosts(state, offer.costs)
      let disabled = !affordable
      let disabledReason = affordable ? '' : t('dialog.noResources')
      if (offer.kind === 'sell') {
        const cost = offer.costs.items?.[0]
        if (cost && state.getItemCount(cost.item) < cost.count) {
          disabled = true
          disabledReason = t('dialog.noItem', { item: itemNameLower(cost.item) })
        }
      }
      return {
        id: offer.id,
        kind: offer.kind,
        // Textos de oferta: i18n con fallback al dato original.
        label: tOr(`trades.${offer.id}.label`, offer.label),
        description: tOr(`trades.${offer.id}.description`, offer.description),
        costLine: costLineOf(offer.costs),
        disabled,
        disabledReason,
      }
    })
    return {
      objectId,
      kind: 'merchant',
      targetName: t('world.merchant'),
      greeting: t('dialog.merchantGreeting'),
      targetAssetId: 'characters.merchant_detail',
      options,
      resultMessage: null,
    }
  },
  execute(_objectId, optionId, state) {
    const offer = tradeById(optionId)
    if (!offer) return { ok: false, message: t('econ.unknownOffer') }
    return executeTrade(state, offer)
  },
}

/* ────────────────────────── Recolección ────────────────────────── */

const gatherHandler: InteractionHandler = {
  build(objectId) {
    const obj = findWorldObject(objectId)
    const resource = obj?.interaction?.resource ?? 'wheat'
    const itemLower = itemNameLower(resource)
    const targetName = resource === 'apple' ? t('world.apple_tree') : t('world.wheat_field')
    return {
      objectId,
      kind: 'gather',
      targetName,
      greeting: t('dialog.gatherGreeting', { item: itemLower }),
      targetAssetId: obj?.asset ?? 'world.wheat_field',
      options: [
        {
          id: 'gather',
          kind: 'gather',
          label: t('dialog.gatherAction', { item: itemLower }),
          description: t('dialog.gatherDesc'),
          costLine: t('common.free'),
          disabled: false,
          disabledReason: '',
        },
      ],
      resultMessage: null,
    }
  },
  execute(objectId, optionId, state) {
    if (optionId !== 'gather') return { ok: false, message: t('econ.unknownAction') }
    const obj = findWorldObject(objectId)
    const resource = obj?.interaction?.resource ?? 'wheat'
    return gatherResource(state, resource)
  },
}

/* ───────────────────────────── Horno ───────────────────────────── */

const ovenHandler: InteractionHandler = {
  build(objectId, state) {
    if (!state.ovenUnlocked) {
      return {
        objectId,
        kind: 'oven',
        targetName: t('world.oven_cold'),
        greeting: t('dialog.ovenColdGreeting'),
        targetAssetId: 'world.oven_01',
        options: [],
        resultMessage: null,
      }
    }
    const canProduce =
      state.getItemCount('wheat') >= BREAD_RECIPE.wheat && state.getItemCount('wood') >= BREAD_RECIPE.wood
    const recipeCosts = {
      items: [
        { item: 'wheat' as const, count: BREAD_RECIPE.wheat },
        { item: 'wood' as const, count: BREAD_RECIPE.wood },
      ],
    }
    return {
      objectId,
      kind: 'oven',
      targetName: t('world.oven_hot'),
      greeting: t('dialog.ovenHotGreeting'),
      targetAssetId: 'world.oven_01',
      options: [
        {
          id: 'produce_bread',
          kind: 'produce',
          label: t('dialog.bakeAction'),
          description: t('dialog.bakeDesc'),
          costLine: costLineOf(recipeCosts),
          disabled: !canProduce,
          disabledReason: canProduce ? '' : t('dialog.noIngredients'),
        },
      ],
      resultMessage: null,
    }
  },
  execute(_objectId, optionId, state) {
    if (optionId !== 'produce_bread') return { ok: false, message: t('econ.unknownAction') }
    if (!state.ovenUnlocked) return { ok: false, message: t('econ.ovenFirst') }
    return produceBread(state)
  },
}

/**
 * Registro genérico de handlers: agregar un nuevo tipo de interacción
 * es agregar una entrada aquí — sin tocar al jugador ni a las pantallas.
 */
export const INTERACTION_HANDLERS: Record<InteractionType, InteractionHandler> = {
  merchant: merchantHandler,
  gather: gatherHandler,
  oven: ovenHandler,
}
