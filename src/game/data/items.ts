import type { ItemId } from '@/game/core/types'

export interface ItemDef {
  id: ItemId
  name: string
  iconAsset: string
  /** Precio al que el comerciante compra al jugador. */
  sellPrice: number
  /** Precio al que el comerciante vende al jugador (si aplica). */
  buyPrice?: number
}

/** Datos de ítems — migrables a data/items.json en el futuro. */
export const ITEMS: Record<ItemId, ItemDef> = {
  wheat: { id: 'wheat', name: 'Trigo', iconAsset: 'ui.wheat', sellPrice: 1 },
  apple: { id: 'apple', name: 'Manzana', iconAsset: 'ui.apple', sellPrice: 2 },
  wood: { id: 'wood', name: 'Leña', iconAsset: 'ui.wood', sellPrice: 3, buyPrice: 3 },
  bread: { id: 'bread', name: 'Pan', iconAsset: 'ui.bread', sellPrice: 6 },
}

export const ITEM_ORDER: ItemId[] = ['wheat', 'apple', 'wood', 'bread']
