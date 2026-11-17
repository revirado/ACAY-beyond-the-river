'use client'

import { useGameStore } from '@/game-next/state/store'
import { AssetImg } from './AssetImg'
import { PALETTE } from '@/game-next/core/config'
import { t } from '@/engine/i18n'

/**
 * InventoryBox — inventario (esquina inferior derecha).
 *
 * Mockup: grilla de íconos de objetos. Hover muestra descripción (title nativo).
 * Drag-and-combine para fabricar herramientas: pendiente del brief detallado.
 */
export function InventoryBox() {
  const inventory = useGameStore((s) => s.inventory)
  if (inventory.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Inventario"
      className="pointer-events-none absolute bottom-4 right-4 z-20"
    >
      <div
        className="rounded-lg border-2 p-2 shadow-xl shadow-black/40 backdrop-blur-sm"
        style={{
          background: `${PALETTE.tierraOscura}e6`,
          borderColor: PALETTE.pergaminoBorde,
        }}
      >
        <div
          className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: PALETTE.dorado }}
        >
          {t('items.guitar') === 'guitarra' ? 'Mochila' : 'Pouch'}
        </div>
        <div className="flex gap-1.5">
          {inventory.map((item) => (
            <div
              key={item.id}
              title={`${item.label} — ${item.description}`}
              className="flex h-12 w-12 items-center justify-center rounded border"
              style={{
                background: 'rgba(243,227,194,0.12)',
                borderColor: 'rgba(243,227,194,0.2)',
              }}
            >
              <AssetImg id={item.icon} alt={item.label} className="max-h-9 max-w-9" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
