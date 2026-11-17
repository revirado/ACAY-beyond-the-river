'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, VIRTUAL_ASPECT } from '@/engine/core/config'
import { GameEngine } from '@/engine/core/GameEngine'
import { setEngineInstance } from '@/game/core/engineBridge'
import { useGameStore } from '@/game/state/store'
import { useT } from '@/game/i18n/useT'
import { cozyModule } from '@/game/core/module'
import { TitleOverlay } from './TitleOverlay'
import { HudOverlay } from './HudOverlay'
import { InteractionOverlay } from './InteractionOverlay'
import { MenuOverlay } from './MenuOverlay'
import { RestartOverlay } from './RestartOverlay'
import { Toasts } from './Toasts'

/**
 * GameRoot — monta el engine sobre el canvas y compone los overlays React.
 * El engine vive fuera de React (loop propio); React solo pinta UI declarativa.
 *
 * `devMode` llega del servidor (page.tsx lee la env var DEV_MODE una sola vez:
 * solo el valor exacto "true" la activa; "false", vacío o no definida ⇒ false).
 */
export function GameRoot({ devMode = false }: { devMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fit, setFit] = useState({ w: VIRTUAL_WIDTH, h: VIRTUAL_HEIGHT })
  const screen = useGameStore((s) => s.screen)
  const ready = useGameStore((s) => s.ready)
  const { t } = useT()

  // ── Ciclo de vida del engine ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const engine = new GameEngine(canvas, cozyModule)
    setEngineInstance(engine)
    // Hook de depuración para pruebas automatizadas (solo desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as { __game?: GameEngine }).__game = engine
    }

    engine
      .preload((loaded, total) => {
        if (!cancelled && loaded === total) engine.start()
      })
      .then(() => {
        if (!cancelled) engine.start()
      })
      .catch((err) => {
        console.error('[game] Error cargando assets:', err)
        if (!cancelled) engine.start() // degradar: los assets fallidos usan placeholder
      })

    return () => {
      cancelled = true
      setEngineInstance(null)
      engine.destroy()
    }
  }, [])

  // ── Escalado 16:9 tipo letterbox (resolución virtual fija) ──
  const recompute = useCallback(() => {
    const pad = 16
    const aw = window.innerWidth - pad * 2
    const ah = window.innerHeight - pad * 2
    const scale = Math.max(0.1, Math.min(aw / VIRTUAL_WIDTH, ah / VIRTUAL_HEIGHT))
    setFit({ w: Math.round(VIRTUAL_WIDTH * scale), h: Math.round(VIRTUAL_HEIGHT * scale) })
  }, [])

  useEffect(() => {
    // El primer ajuste va en un frame posterior para no disparar renders en cascada
    const raf = requestAnimationFrame(recompute)
    window.addEventListener('resize', recompute)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recompute)
    }
  }, [recompute])

  return (
    <main
      aria-label="ACAY"
      className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#191007] p-4"
    >
      <div
        className="relative overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-amber-100/10"
        style={{ width: fit.w, height: fit.h, aspectRatio: String(VIRTUAL_ASPECT) }}
      >
        <canvas
          ref={canvasRef}
          width={VIRTUAL_WIDTH}
          height={VIRTUAL_HEIGHT}
          aria-label="Mundo del juego"
          className="block h-full w-full select-none bg-[#86b26b]"
        />

        {/* Overlays según pantalla */}
        {!ready && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#191007] text-amber-100">
            <Loader2 className="h-8 w-8 animate-spin text-amber-300" aria-hidden />
            <p className="text-sm tracking-wide">{t('common.loading')}</p>
          </div>
        )}
        {ready && screen === 'title' && <TitleOverlay devMode={devMode} />}
        {ready && (screen === 'gameplay' || screen === 'interaction') && <HudOverlay />}
        {ready && screen === 'interaction' && <InteractionOverlay />}
        {ready && screen === 'menu' && <MenuOverlay />}
        {ready && screen === 'restart' && <RestartOverlay />}
        <Toasts />
      </div>
    </main>
  )
}
