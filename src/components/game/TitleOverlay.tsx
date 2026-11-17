'use client'

import { Button } from '@/components/ui/button'
import { getEngine } from '@/game/core/engineBridge'
import { useT } from '@/game/i18n/useT'

/**
 * Overlay del título: botón de inicio y controles.
 * `devMode` activa la nota del índice de assets (arte procedural de demostración);
 * viene de la env var DEV_MODE vía page.tsx → GameRoot (solo "true" la activa).
 */
export function TitleOverlay({ devMode = false }: { devMode?: boolean }) {
  const { t } = useT()
  const start = () => getEngine()?.actions.startFromTitle()

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-10 sm:pb-14">
      <Button
        onClick={start}
        size="lg"
        className="h-12 cursor-pointer rounded-full border border-amber-200/40 bg-[#c96f4a] px-10 text-lg font-semibold text-amber-50 shadow-xl shadow-black/40 transition hover:bg-[#b85f3b] hover:text-white focus-visible:ring-amber-300"
      >
        {t('title.play')}
      </Button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-amber-100/90">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        <Kbd>←</Kbd>
        <Kbd>→</Kbd>
        <span>{t('keys.move')}</span>
        <span className="mx-1 opacity-50">·</span>
        <Kbd>E</Kbd>
        <span>{t('keys.interact')}</span>
        <span className="mx-1 opacity-50">·</span>
        <Kbd>ESC</Kbd>
        <span>{t('keys.menu')}</span>
        <span className="mx-1 opacity-50">·</span>
        <Kbd>M</Kbd>
        <span>{t('keys.music')}</span>
      </div>

      {devMode && (
        <p className="mt-4 max-w-xl px-6 text-center text-[11px] leading-relaxed text-amber-100/60">
          {t('title.assetNote')}
        </p>
      )}
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-amber-200/30 bg-black/30 px-1.5 py-0.5 font-mono text-[11px] text-amber-100">
      {children}
    </kbd>
  )
}
