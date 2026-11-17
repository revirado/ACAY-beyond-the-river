'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { VIRTUAL_WIDTH, VIRTUAL_HEIGHT, VIRTUAL_ASPECT } from '@/engine/core/config'
import { GameEngine } from '@/engine/core/GameEngine'
import { setEngineInstance as setEngineInstanceBase } from '@/engine/core/engineBridge'
import { useGameStore } from '@/game-next/state/store'
import { t } from '@/engine/i18n'
import { acayModule } from '@/game-next/core/module'
import { DialogueBox } from '@/game-next/components/DialogueBox'
import { InventoryBox } from '@/game-next/components/InventoryBox'

/**
 * AcayHost — monta el motor con `acayModule` sobre el canvas y compone los
 * overlays React según la pantalla activa.
 *
 * Overlays:
 *   - Loading (mientras !ready).
 *   - DialogueBox (inferior izquierda) — visible si hay diálogo activo.
 *   - InventoryBox (inferior derecha) — visible en explore y rhythm-battle.
 *   - devMode badge (esquina sup-izq) si devMode=true.
 */
export function AcayHost({ devMode = false }: { devMode?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [fit, setFit] = useState({ w: VIRTUAL_WIDTH, h: VIRTUAL_HEIGHT })
  const ready = useGameStore((s) => s.ready)
  const screen = useGameStore((s) => s.screen)
  const hasDialogue = useGameStore((s) => s.dialogue !== null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const engine = new GameEngine(canvas, acayModule)
    setEngineInstanceBase(engine)
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
        console.error('[acay] Error cargando assets:', err)
        if (!cancelled) engine.start()
      })

    return () => {
      cancelled = true
      setEngineInstanceBase(null)
      engine.destroy()
    }
  }, [])

  const recompute = useCallback(() => {
    const pad = 16
    const aw = window.innerWidth - pad * 2
    const ah = window.innerHeight - pad * 2
    const scale = Math.max(0.1, Math.min(aw / VIRTUAL_WIDTH, ah / VIRTUAL_HEIGHT))
    setFit({ w: Math.round(VIRTUAL_WIDTH * scale), h: Math.round(VIRTUAL_HEIGHT * scale) })
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(recompute)
    window.addEventListener('resize', recompute)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', recompute)
    }
  }, [recompute])

  // El cursor nativo se oculta en explore/rhythm-battle (puntero customizado en canvas).
  const hideNativeCursor = ready && (screen === 'explore' || screen === 'rhythm-battle')

  return (
    <main
      aria-label="Acay — Beyond the River"
      className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0a0a] p-4"
    >
      <div
        className="relative overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-amber-100/10"
        style={{ width: fit.w, height: fit.h, aspectRatio: String(VIRTUAL_ASPECT) }}
      >
        <canvas
          ref={canvasRef}
          width={VIRTUAL_WIDTH}
          height={VIRTUAL_HEIGHT}
          aria-label="Mundo de Acay"
          className="block h-full w-full select-none bg-[#2a1a10]"
          style={{ cursor: hideNativeCursor ? 'none' : 'default' }}
        />

        {/* Loading */}
        {!ready && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-[#0a0a0a] text-amber-100">
            <Loader2 className="h-8 w-8 animate-spin text-amber-300" aria-hidden />
            <p className="text-sm tracking-wide">{t('common.loading')}</p>
          </div>
        )}

        {/* Overlays según pantalla */}
        {ready && screen === 'explore' && (
          <>
            {hasDialogue && <DialogueBox />}
            <InventoryBox />
          </>
        )}
        {ready && screen === 'rhythm-battle' && (
          <>
            {/* El HUD de batalla se dibuja en canvas (RhythmBattleScreen.drawHud). */}
            {/* InventoryBox oculto en batalla (no es relevante). */}
          </>
        )}

        {/* devMode badge */}
        {ready && devMode && (
          <div className="absolute left-3 top-3 z-30 rounded-md bg-black/40 px-2 py-1 text-[11px] text-amber-200">
            acay · {screen} · devMode
          </div>
        )}
      </div>
    </main>
  )
}
