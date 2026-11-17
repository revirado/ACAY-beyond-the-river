import type { ItemId, CostItem } from '@/game/core/types'
import type { GameState } from '@/game/state/gameState'
import type { TradeCosts, TradeOfferDef } from '@/game/data/trades'
import { TRADES } from '@/game/data/trades'
import { t, tOr, itemNameLower } from '@/game/i18n'

export interface ActionResult {
  ok: boolean
  message: string
}

/** Línea legible de costos: "12 monedas + 2×Leña" (i18n). */
export function costLineOf(costs: TradeCosts): string {
  const parts: string[] = []
  if (costs.coins && costs.coins > 0) {
    parts.push(costs.coins === 1 ? t('econ.oneCoin') : t('econ.coins', { n: costs.coins }))
  }
  for (const c of costs.items ?? []) parts.push(`${c.count}×${t(`items.${c.item}`)}`)
  return parts.length > 0 ? parts.join(' + ') : t('common.free')
}

export function canAffordCosts(state: GameState, costs: TradeCosts): boolean {
  if (costs.coins !== undefined && state.coins < costs.coins) return false
  for (const c of costs.items ?? []) {
    if (state.getItemCount(c.item) < c.count) return false
  }
  return true
}

function reasonForCosts(state: GameState, costs: TradeCosts): string {
  if (costs.coins !== undefined && state.coins < costs.coins) {
    return t('econ.missingCoins', { n: costs.coins - state.coins })
  }
  for (const c of costs.items ?? []) {
    if (state.getItemCount(c.item) < c.count) {
      return t('econ.missingItem', { n: c.count - state.getItemCount(c.item), item: itemNameLower(c.item) })
    }
  }
  return ''
}

export function tradeById(id: string): TradeOfferDef | undefined {
  return TRADES.find((offer) => offer.id === id)
}

/** Ejecuta una oferta comercial sobre el estado. */
export function executeTrade(state: GameState, offer: TradeOfferDef): ActionResult {
  if (offer.once && state.flags[`trade:${offer.id}`]) {
    return { ok: false, message: t('econ.alreadyDone') }
  }
  if (!canAffordCosts(state, offer.costs)) {
    return { ok: false, message: reasonForCosts(state, offer.costs) }
  }

  // Pagar
  if (offer.costs.coins !== undefined) state.coins -= offer.costs.coins
  for (const c of offer.costs.items ?? []) state.addItem(c.item, -c.count)

  // Recibir
  const parts: string[] = []
  if (offer.gains.coins !== undefined) {
    state.coins += offer.gains.coins
    state.coinsEarned += offer.gains.coins
    parts.push(
      offer.gains.coins === 1
        ? t('econ.gainedCoinsOne')
        : t('econ.gainedCoins', { n: offer.gains.coins }),
    )
  }
  if (offer.gains.item !== undefined) {
    const n = offer.gains.itemCount ?? 1
    state.addItem(offer.gains.item, n)
    parts.push(t('econ.gainedItem', { n, item: itemNameLower(offer.gains.item) }))
  }
  if (offer.gains.setFlag) {
    if (offer.gains.setFlag === 'ovenUnlocked') state.ovenUnlocked = true
    state.flags[offer.gains.setFlag] = true
  }
  if (offer.id === 'sell_bread') state.breadSold += 1

  state.markChanged()

  const verb =
    offer.kind === 'sell'
      ? t('econ.verbSell')
      : offer.kind === 'buy'
        ? t('econ.verbBuy')
        : t('econ.verbBuild')
  return {
    ok: true,
    // Etiqueta de la oferta vía clave i18n (fallback al dato crudo si no hay clave).
    message: `${verb}: ${tOr(`trades.${offer.id}.label`, offer.label)}. ${parts.join(' · ')}`.trim(),
  }
}

/** Produce 1 pan en el horno: 2 trigo + 1 leña. */
export function produceBread(state: GameState): ActionResult {
  const recipe: CostItem[] = [
    { item: 'wheat', count: 2 },
    { item: 'wood', count: 1 },
  ]
  for (const c of recipe) {
    if (state.getItemCount(c.item) < c.count) {
      return {
        ok: false,
        message: t('econ.bakeMissing', {
          n: c.count - state.getItemCount(c.item),
          item: itemNameLower(c.item),
        }),
      }
    }
  }
  for (const c of recipe) state.addItem(c.item, -c.count)
  state.addItem('bread', 1)
  state.breadProduced += 1
  state.markChanged()
  return { ok: true, message: t('econ.breadReady') }
}

/** Recolecta 1 unidad del recurso indicado. */
export function gatherResource(state: GameState, item: ItemId): ActionResult {
  state.addItem(item, 1)
  state.markChanged()
  return { ok: true, message: t('econ.gathered', { item: itemNameLower(item) }) }
}
