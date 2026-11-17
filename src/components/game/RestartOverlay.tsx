'use client'

import { Button } from '@/components/ui/button'
import { getEngine } from '@/game/core/engineBridge'
import { useT } from '@/game/i18n/useT'

/** Confirmación de reinicio de partida. */
export function RestartOverlay() {
  const { t } = useT()

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4">
      <div
        role="alertdialog"
        aria-label={t('restart.title')}
        className="w-full max-w-sm rounded-2xl border border-amber-200/25 bg-[#2f2113]/95 p-6 text-center shadow-2xl shadow-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      >
        <h2 className="font-serif text-xl font-bold text-amber-100">{t('restart.title')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-100/70">
          {t('restart.body')}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => getEngine()?.actions.cancelRestart()}
            className="h-10 cursor-pointer border-amber-200/25 bg-black/20 text-amber-100 hover:bg-white/10 hover:text-amber-50"
          >
            {t('restart.cancel')}
          </Button>
          <Button
            onClick={() => getEngine()?.actions.confirmRestart()}
            className="h-10 cursor-pointer bg-red-800 text-red-50 hover:bg-red-700"
          >
            {t('restart.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
