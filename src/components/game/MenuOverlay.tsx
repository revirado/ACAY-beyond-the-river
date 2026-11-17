'use client'

import { Play, RotateCcw, Volume2, VolumeX, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useGameStore } from '@/game/state/store'
import { getEngine } from '@/game/core/engineBridge'
import { getLocales, type Locale } from '@/game/i18n'
import { useT } from '@/game/i18n/useT'

/** Menú de pausa: continuar, música, idioma (ENG/SPA), reiniciar y controles. */
export function MenuOverlay() {
  const muted = useGameStore((s) => s.muted)
  const volume = useGameStore((s) => s.volume)
  const locale = useGameStore((s) => s.locale)
  const { t } = useT()
  const engine = () => getEngine()

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-label={t('menu.pause')}
        className="w-full max-w-sm rounded-2xl border border-amber-200/25 bg-[#2f2113]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
      >
        <h2 className="font-serif text-2xl font-bold text-amber-100">{t('menu.pause')}</h2>
        <p className="mt-1 text-sm text-amber-100/70">{t('menu.subtitle')}</p>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button
            onClick={() => engine()?.actions.resume()}
            className="h-11 cursor-pointer gap-2 bg-[#c96f4a] text-amber-50 hover:bg-[#b85f3b]"
          >
            <Play className="h-4 w-4" aria-hidden /> {t('menu.resume')}
          </Button>

          {/* Música */}
          <div className="rounded-xl border border-amber-200/15 bg-black/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-amber-100">
                {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                {t('menu.music')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => engine()?.toggleMute()}
                className="h-7 cursor-pointer rounded-full px-3 text-xs text-amber-100/80 hover:bg-white/10 hover:text-amber-50"
              >
                {muted ? t('menu.unmute') : t('menu.mute')}
              </Button>
            </div>
            <Slider
              aria-label={t('menu.music')}
              value={[Math.round(volume * 100)]}
              max={100}
              step={5}
              onValueChange={(v) => engine()?.setVolume((v[0] ?? 50) / 100)}
              className="mt-3 [&_[data-slot=slider-range]]:bg-amber-400 [&_[data-slot=slider-thumb]]:border-amber-300 [&_[data-slot=slider-track]]:bg-black/40"
            />
          </div>

          {/* Idioma (ENG/SPA) — solo traduce textos, nunca toca el código */}
          <div className="rounded-xl border border-amber-200/15 bg-black/20 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-amber-100">
                <Languages className="h-4 w-4" aria-hidden />
                {t('menu.language')}
              </span>
              <div
                role="group"
                aria-label={t('menu.language')}
                className="flex overflow-hidden rounded-full border border-amber-200/25"
              >
                {getLocales().map((l) => {
                  const active = locale === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => engine()?.actions.setLocale(l.id as Locale)}
                      className={
                        'cursor-pointer px-3.5 py-1.5 text-xs font-semibold transition ' +
                        (active
                          ? 'bg-amber-300 text-[#3f2d1d]'
                          : 'bg-black/30 text-amber-100/75 hover:bg-white/10 hover:text-amber-50')
                      }
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Button
            onClick={() => engine()?.actions.requestRestart()}
            variant="outline"
            className="h-11 cursor-pointer gap-2 border-red-300/30 bg-black/20 text-red-200 hover:border-red-300/60 hover:bg-red-950/40 hover:text-red-100"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> {t('menu.restart')}
          </Button>
        </div>

        <div className="mt-5 border-t border-amber-200/10 pt-3.5 text-xs leading-relaxed text-amber-100/55">
          <p>
            <Kbd>↑↓←→</Kbd> {t('keys.move')} · <Kbd>E</Kbd>/<Kbd>Enter</Kbd> {t('keys.interact')} ·{' '}
            <Kbd>ESC</Kbd> {t('keys.menu')} · <Kbd>M</Kbd> {t('keys.music')} · <Kbd>F3</Kbd> debug
          </p>
        </div>
      </div>
    </div>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-amber-200/25 bg-black/30 px-1 py-0.5 font-mono text-[10px] text-amber-100">
      {children}
    </kbd>
  )
}
