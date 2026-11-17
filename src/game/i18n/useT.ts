'use client'

import { useCallback } from 'react'
import { useGameStore } from '@/game/state/store'
import { t, tOr, type Locale } from '@/engine/i18n'

/**
 * Hook de traducción para componentes React.
 * Se suscribe al `locale` del store: cuando el engine cambia el idioma
 * (uiSetLocale), todos los componentes que usan `useT` se re-renderizan
 * una sola vez con los textos nuevos.
 */
export function useT(): {
  t: typeof t
  tOr: typeof tOr
  locale: Locale
} {
  const locale = useGameStore((s) => s.locale)
  void locale // suscripción: provoca re-render al cambiar de idioma
  const wrappedT = useCallback((key: string, vars?: Record<string, string | number>) => t(key, vars), [])
  const wrappedTOr = useCallback(
    (key: string, fallback: string, vars?: Record<string, string | number>) => tOr(key, fallback, vars),
    [],
  )
  return { t: wrappedT, tOr: wrappedTOr, locale }
}
