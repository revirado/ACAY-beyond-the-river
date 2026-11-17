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
  const [waiting, setWaiting] = useState(false)

  const fullText = dialogue?.fullText ?? ''
  const phase = dialogue?.phase ?? 'idle'
  const waitSec = dialogue?.waitSec ?? 0

  // Reset `revealed` + maneja waitSec cuando cambia la línea (fullText).
  const [prevFullText, setPrevFullText] = useState(fullText)
  if (fullText !== prevFullText) {
    setPrevFullText(fullText)
    setRevealed(0)
    // Si la línea tiene waitSec > 0, entrar en modo espera (pausa dramática)
    setWaiting(waitSec > 0)
  }

  // Timer para salir del modo espera tras waitSec segundos.
  useEffect(() => {
    if (!waiting) return
    const id = window.setTimeout(() => {
      setWaiting(false)
    }, waitSec * 1000)
    return () => window.clearTimeout(id)
  }, [waiting, waitSec])

  // Typewriting: incrementa `revealed` (solo si no está esperando).
  useEffect(() => {
    if (!dialogue || waiting || revealed >= fullText.length) return
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

  const slicedText = useMemo(() => fullText.slice(0, revealed), [fullText, revealed])
  const visibleText = waiting ? '…' : slicedText
  const done = !waiting && revealed >= fullText.length
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
        style={
          phase === 'voice'
            ? {
                // Voz incorpórea: fondo oscuro translúcido, borde dorado etéreo
                background: 'rgba(15,10,8,0.85)',
                borderColor: 'rgba(217,168,63,0.5)',
                padding: '14px 18px 16px',
                boxShadow: '0 0 20px rgba(217,168,63,0.15)',
              }
            : {
                background: `${PALETTE.pergamino}f2`,
                borderColor: PALETTE.pergaminoBorde,
                padding: phase === 'conversation' ? '14px 18px 16px' : '12px 16px 14px',
              }
        }
      >
        {/* Speaker */}
        <div
          className="mb-1 text-sm font-bold uppercase tracking-wide"
          style={{
            color: phase === 'voice' ? 'rgba(217,168,63,0.8)' : PALETTE.pergaminoBorde,
            fontStyle: phase === 'voice' ? 'italic' : 'normal',
          }}
        >
          {speaker}
        </div>
        {/* Texto — legible siempre. Voz incorpórea: cursiva, color dorado pálido. */}
        <p
          className="font-serif leading-snug"
          style={{
            color: phase === 'voice' ? 'rgba(230,182,85,0.9)' : PALETTE.tinta,
            fontStyle: phase === 'voice' ? 'italic' : 'normal',
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
