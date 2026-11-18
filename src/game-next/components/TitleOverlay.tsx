'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/game-next/state/store'
import { getEngine } from '@/engine/core/engineBridge'
import { AssetImg } from './AssetImg'

/**
 * TitleOverlay — capa de título superpuesta sobre el gameplay (50.4, 60.1).
 *
 * Secuencia (sin fade en bg/título — aparecen instantáneamente):
 *   1. (0-1500ms) Fondo negro aparece instantáneo. Sin título.
 *   2. (1500-3000ms) Título aparece instantáneo sobre fondo negro.
 *   3. (3000-3800ms) Fade out del fondo negro. Revela gameplay. Título stays.
 *   4. (3800-4500ms) Título visible sobre gameplay.
 *   5. (4500-5300ms) Fade out del título.
 *   6. done: libera la capa (flags.titleShown=true).
 *
 * Total: 5300ms. Solo aparece en la primera carga (!flags.titleShown).
 */
const TOTAL_MS = 5300

export function TitleOverlay() {
  const titleShown = useGameStore((s) => s.titleShown ?? false)

  useEffect(() => {
    if (titleShown) return
    const timer = window.setTimeout(() => {
      const engine = getEngine()
      if (engine) { engine.state.flags.titleShown = true; engine.syncUI() }
    }, TOTAL_MS)
    return () => window.clearTimeout(timer)
  }, [titleShown])

  if (titleShown) return null

  return (
    <>
      <style>{`
        @keyframes titleBgSeq {
          0%, 56.6% { opacity: 1; }
          71.7% { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes titleImgSeq {
          0%, 28.3% { opacity: 0; }
          28.4%, 84.9% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
        aria-label="Title overlay"
      >
        {/* Fondo negro — aparece instantáneo, fade out revela gameplay */}
        <div
          className="absolute inset-0"
          style={{ background: '#000000', animation: `titleBgSeq ${TOTAL_MS}ms ease-out forwards` }}
        />
        {/* Título — aparece instantáneo (sin fade), fade out al final */}
        <div
          className="relative flex flex-col items-center"
          style={{ animation: `titleImgSeq ${TOTAL_MS}ms ease-out forwards` }}
        >
          <div style={{ width: 'min(60vw, 480px)' }}>
            <AssetImg id="ui.title_logo" alt="ACAY — Beyond the River" className="w-full" />
          </div>
        </div>
      </div>
    </>
  )
}
