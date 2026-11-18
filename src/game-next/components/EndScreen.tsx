'use client'

import { useGameStore } from '@/game-next/state/store'
import { PALETTE } from '@/game-next/core/config'
import { t } from '@/engine/i18n'

/**
 * EndScreen — pantalla de fin de demo (4.2).
 *
 * Se muestra cuando flags.demoEnded = true. Overlay a pantalla completa
 * con fondo negro, "ACAY" grande centrado, "Más allá del río" subtítulo,
 * y "Fin de la Demo" abajo. Sin interacción (demo terminada).
 */
export function EndScreen() {
  const demoEnded = useGameStore((s) => s.demoEnded)
  if (!demoEnded) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
      style={{ animation: 'fadeIn 1.5s ease-in' }}
    >
      <h1
        className="font-serif text-7xl font-bold tracking-wider sm:text-8xl"
        style={{ color: '#ffffff' }}
      >
        {t('scene04.end_title')}
      </h1>
      <p
        className="mt-4 font-serif text-2xl italic tracking-wide sm:text-3xl"
        style={{ color: PALETTE.dorado }}
      >
        {t('scene04.end_subtitle')}
      </p>
      <div
        className="mt-12 h-px w-32"
        style={{ background: 'rgba(217,168,63,0.4)' }}
      />
      <p
        className="mt-6 text-sm uppercase tracking-[0.3em]"
        style={{ color: 'rgba(243,227,194,0.5)' }}
      >
        {t('scene04.end_demo')}
      </p>

      {/* Créditos finales — textos pequeños */}
      <div
        className="mt-16 flex flex-col items-center gap-1"
        style={{ color: 'rgba(243,227,194,0.4)' }}
      >
        <p className="text-xs tracking-wide">
          {t('scene04.end_thanks')}
        </p>
        <p className="text-[10px] tracking-wider">
          {t('scene04.end_team')} · {t('scene04.end_year')}
        </p>
      </div>
    </div>
  )
}
