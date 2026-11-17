'use client'

import { useEffect, useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGameStore } from '@/game-next/state/store'
import { CONFIG, PALETTE } from '@/game-next/core/config'
import { t } from '@/engine/i18n'

/**
 * DialogueBox — caja de diálogo (esquina inferior izquierda).
 *
 * - Efecto typewriting automático: los caracteres aparecen a CONFIG.explore.typewriterCps.
 * - Se expande verticalmente con el contenido.
 * - El texto de Acay es LEGIBLE (el jugador lee lo que Acay dice). El
 *   "balbuceo" es un ASSET DE SONIDO que suena al hablar Acay (hook futuro:
 *   reproducir audio.babble cuando isAcay=true). Los NPC sí entienden a Acay.
 * - Hint "▼" cuando el typewriting terminó y hay más líneas.
 * - Click en el canvas (handleado por ExploreScreen) avanza la línea.
 */
export function DialogueBox() {
  const dialogue = useGameStore((s) => s.dialogue)
  const [revealed, setRevealed] = useState(0)

  const fullText = dialogue?.fullText ?? ''
  const phase = dialogue?.phase ?? 'idle'

  // Reset `revealed` cuando cambia la línea (fullText). Patrón "store previous
  // prop" recomendado por React para ajustar state durante el render (evita
  // set-state-in-effect).
  const [prevFullText, setPrevFullText] = useState(fullText)
  if (fullText !== prevFullText) {
    setPrevFullText(fullText)
    setRevealed(0)
  }

  // Typewriting: incrementa `revealed` a CONFIG.explore.typewriterCps caracteres/seg.
  useEffect(() => {
    if (!dialogue || revealed >= fullText.length) return
    const cps = CONFIG.explore.typewriterCps
    const intervalMs = 1000 / cps
    const id = window.setInterval(() => {
      setRevealed((r) => {
        if (r >= fullText.length) {
          window.clearInterval(id)
          return r
        }
        return r + 1
      })
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [dialogue, fullText, revealed])

  const visibleText = useMemo(() => fullText.slice(0, revealed), [fullText, revealed])
  const done = revealed >= fullText.length
  const hasMore = dialogue ? dialogue.lineIndex < dialogue.lineCount - 1 : false

  if (!dialogue) return null

  const isAcay = dialogue.isAcay
  const speaker = dialogue.speaker

  return (
    <div
      role="region"
      aria-label={`${t('dialogue.continue')} — ${speaker}`}
      className="pointer-events-none absolute bottom-4 left-4 z-20 w-[min(46%,520px)]"
    >
      <div
        className="rounded-lg border-2 shadow-xl shadow-black/40 backdrop-blur-sm"
        style={{
          background: `${PALETTE.pergamino}f2`,
          borderColor: PALETTE.pergaminoBorde,
          padding: phase === 'conversation' ? '14px 18px 16px' : '12px 16px 14px',
        }}
      >
        {/* Speaker */}
        <div
          className="mb-1 text-sm font-bold uppercase tracking-wide"
          style={{ color: PALETTE.pergaminoBorde }}
        >
          {speaker}
        </div>
        {/* Texto — legible siempre (Acay incluido; el balbuceo es sonido, no texto) */}
        <p
          className="font-serif leading-snug"
          style={{
            color: PALETTE.tinta,
            fontSize: 17,
            minHeight: 22,
          }}
        >
          {visibleText}
          {!done && (
            <span
              className="ml-0.5 inline-block animate-pulse"
              style={{ color: PALETTE.acento }}
            >
              ▌
            </span>
          )}
        </p>
        {/* Hint continuar */}
        {done && hasMore && (
          <div className="mt-1 flex justify-end">
            <ChevronDown
              className="h-4 w-4 animate-bounce"
              style={{ color: PALETTE.pergaminoBorde }}
              aria-hidden
            />
          </div>
        )}
        {done && !hasMore && (
          <div className="mt-1 flex justify-end text-[11px] opacity-60" style={{ color: PALETTE.tinta }}>
            {t('dialogue.close')}
          </div>
        )}
      </div>
    </div>
  )
}
