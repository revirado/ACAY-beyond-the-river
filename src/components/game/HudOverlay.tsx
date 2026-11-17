'use client'

import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, Sunrise, Sun, Sunset, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AssetImg } from './AssetImg'
import { useGameStore } from '@/game/state/store'
import { getEngine } from '@/game/core/engineBridge'
import { ITEM_ORDER } from '@/game/data/items'
import { PROSPERITY_STAGES } from '@/game/data/progression'
import { CONFIG } from '@/game/core/config'
import { useT } from '@/game/i18n/useT'
import { stageNameKey } from '@/game/i18n'
import type { ItemId, DayPhase } from '@/game/core/types'

const PHASE_ICON: Record<DayPhase, React.ComponentType<{ className?: string }>> = {
  dawn: Sunrise,
  day: Sun,
  dusk: Sunset,
  night: Moon,
}

/** Fracción del ciclo → fase del día (según CONFIG.day.phases). */
function phaseFor(fraction: number): DayPhase {
  for (const p of CONFIG.day.phases) {
    if (fraction >= p.from && fraction < p.to) return p.id as DayPhase
  }
  return 'night'
}

/**
 * Reloj del HUD — indicador temporal con la MISMA jerarquía visual que los
 * indicadores de items y del pueblo: chip arriba, al centro de la pantalla.
 * Relojea con un rAF propio que actualiza refs del SVG (el anillo radial
 * avanza en tiempo real) y solo re-renderiza React cuando cambia la fase.
 */
function DayClock() {
  const { t } = useT()
  const ringRef = useRef<SVGCircleElement | null>(null)
  const [phase, setPhase] = useState<DayPhase>('dawn')

  const R = 14 // radio del anillo radial (viewBox 32)
  const CIRC = 2 * Math.PI * R

  useEffect(() => {
    let raf = 0
    let lastPhase: DayPhase | null = null
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const clock = getEngine()?.getClock()
      if (!clock || clock.dayLengthSec <= 0) return
      const fraction = ((clock.time / clock.dayLengthSec) % 1 + 1) % 1
      if (ringRef.current) {
        ringRef.current.style.strokeDasharray = `${CIRC}`
        ringRef.current.style.strokeDashoffset = `${CIRC * (1 - fraction)}`
      }
      const p = phaseFor(fraction)
      if (p !== lastPhase) {
        lastPhase = p
        setPhase(p)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const Icon = PHASE_ICON[phase]

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
      <div
        role="timer"
        aria-label={t(`hud.clock.${phase}`)}
        className="flex items-center gap-2.5 rounded-2xl border border-amber-200/25 bg-[#3f2d1d]/85 px-3.5 py-2 shadow-lg shadow-black/30 backdrop-blur-sm"
      >
        {/* Timer radial + icono de fase */}
        <span className="relative block h-8 w-8" aria-hidden>
          <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
            <circle cx="16" cy="16" r={R} fill="none" stroke="rgba(255,235,190,0.18)" strokeWidth="3" />
            <circle
              ref={ringRef}
              cx="16"
              cy="16"
              r={R}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-amber-200" />
          </span>
        </span>
        <span className="text-xs font-semibold text-amber-100/90">{t(`hud.clock.${phase}`)}</span>
      </div>
    </div>
  )
}

/**
 * HUD — representación visual (no números fríos):
 * reloj arriba al centro, monedas a la izquierda, inventario en el medio,
 * skyline a la derecha. Elevado (z-30) POR ENCIMA de la ventana de
 * interacción (z-20): nunca la tapa, siempre se ve la recolección.
 */
export function HudOverlay() {
  const coins = useGameStore((s) => s.coins)
  const inventory = useGameStore((s) => s.inventory)
  const prosperity = useGameStore((s) => s.prosperity)
  const muted = useGameStore((s) => s.muted)
  const { t, tOr } = useT()

  const stage = [...PROSPERITY_STAGES].reverse().find((s) => s.level <= prosperity)
  const skylineId = `ui.skyline_${Math.min(4, prosperity)}`
  const stageName = stage ? tOr(stageNameKey(stage.level), stage.name) : ''

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Reloj — parte superior, mitad de la pantalla */}
      <DayClock />

      {/* Botón de música (flotante, esquina) */}
      <div className="pointer-events-auto absolute right-3 top-3 z-30">
        <Button
          variant="ghost"
          size="icon"
          aria-label={muted ? t('menu.unmute') : `${t('keys.music')} (M)`}
          title={`${t('keys.music')} (M)`}
          onClick={() => getEngine()?.toggleMute()}
          className="h-9 w-9 cursor-pointer rounded-full border border-amber-200/25 bg-[#3f2d1d]/80 text-amber-100 hover:bg-[#54391f] hover:text-amber-50"
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 mx-3 mb-2.5 flex items-end justify-between gap-4">
        {/* Panel de economía */}
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200/25 bg-[#3f2d1d]/85 px-4 py-2.5 shadow-lg shadow-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-1.5" title={t('hud.coins')}>
            <AssetImg id="ui.coin" className="h-7 w-7 drop-shadow" alt={t('hud.coins')} />
            <span className="min-w-6 text-lg font-bold tabular-nums text-amber-100">{coins}</span>
          </div>
          <div className="h-7 w-px bg-amber-200/20" aria-hidden />
          <div className="flex items-center gap-2.5">
            {ITEM_ORDER.map((id: ItemId) => (
              <div key={id} className="flex items-center gap-1" title={t(`items.${id}`)}>
                <AssetImg id={`ui.${id}`} className="h-6 w-6 opacity-90" alt={t(`items.${id}`)} />
                <span className="text-sm font-semibold tabular-nums text-amber-50/90">
                  {inventory[id] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skyline de prosperidad */}
        <div className="flex flex-col items-end">
          {stage && (
            <span className="mb-1 rounded-full border border-amber-200/25 bg-[#3f2d1d]/85 px-3 py-0.5 text-[11px] font-medium text-amber-100/90 shadow backdrop-blur-sm">
              {stageName}
            </span>
          )}
          <div className="overflow-hidden rounded-t-lg">
            <AssetImg
              id={skylineId}
              key={skylineId}
              className="h-20 w-auto drop-shadow-lg transition-all duration-700"
              alt={`${t('hud.prosperity')} ${prosperity} — ${stageName}`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
