import type { ItemId, CostItem } from '@/game/core/types'

export interface TradeCosts {
  coins?: number
  items?: CostItem[]
}

export interface TradeGains {
  coins?: number
  item?: ItemId
  itemCount?: number
  /** Flag que se activa al completar (ej: 'ovenUnlocked'). */
  setFlag?: string
}

export interface TradeOfferDef {
  id: string
  kind: 'sell' | 'buy' | 'build'
  label: string
  description: string
  costs: TradeCosts
  gains: TradeGains
  /** Solo puede ejecutarse una vez (ej: construir el horno). */
  once?: boolean
}

/**
 * Ofertas del comerciante — el camino económico único del PoC.
 * Representadas como datos para permitir múltiples caminos en el futuro.
 */
export const TRADES: TradeOfferDef[] = [
  {
    id: 'sell_wheat',
    kind: 'sell',
    label: 'Vender trigo',
    description: 'Trigo dorado, recién cosechado del campo.',
    costs: { items: [{ item: 'wheat', count: 1 }] },
    gains: { coins: 1 },
  },
  {
    id: 'sell_apple',
    kind: 'sell',
    label: 'Vender manzana',
    description: 'Manzanas rojas del árbol del camino.',
    costs: { items: [{ item: 'apple', count: 1 }] },
    gains: { coins: 2 },
  },
  {
    id: 'sell_bread',
    kind: 'sell',
    label: 'Vender pan',
    description: 'Pan recién horneado. ¡El aroma abre billeteras!',
    costs: { items: [{ item: 'bread', count: 1 }] },
    gains: { coins: 6 },
  },
  {
    id: 'buy_wood',
    kind: 'buy',
    label: 'Comprar leña',
    description: 'Leña seca, perfecta para alimentar un horno.',
    costs: { coins: 3 },
    gains: { item: 'wood', itemCount: 1 },
  },
  {
    id: 'build_oven',
    kind: 'build',
    label: 'Construir horno de leña',
    description: 'Un horno propio en la plaza. El pueblo prosperará contigo.',
    costs: { coins: 12, items: [{ item: 'wood', count: 2 }] },
    gains: { setFlag: 'ovenUnlocked' },
    once: true,
  },
]

/** Receta de pan: costo de producir 1 pan en el horno. */
export const BREAD_RECIPE: Record<ItemId, number> = {
  wheat: 2,
  apple: 0,
  wood: 1,
  bread: 0,
}
