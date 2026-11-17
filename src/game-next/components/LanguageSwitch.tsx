'use client'

import { getEngine } from '@/engine/core/engineBridge'
import { getLocales, getLocale } from '@/engine/i18n'
import { useGameStore } from '@/game-next/state/store'
import { PALETTE } from '@/game-next/core/config'

/**
 * LanguageSwitch — toggle de idioma (ES/EN) en la esquina superior derecha.
 *
 * Lee el locale actual del store y llama a `engine.setLocale(id)` al clic.
 * El motor cambia el locale, re-publica el snapshot, y los overlays que usan
 * `t()` / `useT` se re-renderizan con los textos nuevos.
 */
export function LanguageSwitch() {
  const locale = useGameStore((s) => s.locale)
  const current = locale || getLocale()

  const switchTo = (id: string) => {
    getEngine()?.setLocale(id)
  }

  const locales = getLocales()

  return (
    <div
      role="group"
      aria-label="Language"
      className="pointer-events-auto absolute right-3 top-3 z-40 flex overflow-hidden rounded-full border"
      style={{
        borderColor: 'rgba(243,227,194,0.25)',
        background: 'rgba(15,10,8,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {locales.map((l) => {
        const active = current === l.id
        return (
          <button
            key={l.id}
            type="button"
            aria-pressed={active}
            onClick={() => switchTo(l.id)}
            className="cursor-pointer px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition"
            style={{
              background: active ? PALETTE.dorado : 'transparent',
              color: active ? '#3f2d1d' : 'rgba(243,227,194,0.7)',
            }}
          >
            {l.id}
          </button>
        )
      })}
    </div>
  )
}
