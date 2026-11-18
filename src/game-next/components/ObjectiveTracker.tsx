'use client'

import { useGameStore } from '@/game-next/state/store'
import { PALETTE } from '@/game-next/core/config'
import { Target } from 'lucide-react'

/**
 * ObjectiveTracker — HUD de objetivo (esquina superior izquierda).
 *
 * Aparece diegéticamente cuando se setea un objetivo (tras el despertar de
 * Acay, 1.2). Muestra el texto del objetivo con un icono.
 *
 * El objetivo se setea en el estado del juego (state.objective) y se publica
 * al snapshot via buildSnapshot.
 */
export function ObjectiveTracker() {
  const objective = useGameStore((s) => s.objective)
  if (!objective) return null

  return (
    <div
      role="status"
      aria-label="Objetivo"
      className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg border px-3 py-1.5 shadow-lg shadow-black/30 backdrop-blur-sm"
      style={{
        borderColor: 'rgba(217,168,63,0.4)',
        background: 'rgba(15,10,8,0.7)',
      }}
    >
      <Target
        className="h-4 w-4"
        style={{ color: PALETTE.dorado }}
        aria-hidden
      />
      <span
        className="font-serif text-sm font-semibold"
        style={{ color: PALETTE.dorado }}
      >
        {objective}
      </span>
    </div>
  )
}
