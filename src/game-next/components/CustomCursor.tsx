'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/game-next/state/store'
import { CONFIG, PALETTE } from '@/game-next/core/config'

/**
 * CustomCursor — puntero customizado en React (NO canvas).
 *
 * Se renderiza por ENCIMA de todos los overlays (z-50) para que el puntero
 * nunca sea tapado por la caja de diálogo, inventario, etc.
 *
 * - Sigue al mouse en tiempo real (pointermove → actualiza transform via ref,
 *   sin re-render por frame).
 * - Cambia de aspecto según hoveredElementId del store:
 *   - Default: anillo hueco terracota.
 *   - Sobre elemento interactivo: círculo lleno dorado.
 * - Cursor nativo oculto (lo maneja AcayHost con cursor:none en el canvas).
 * - Solo visible en pantallas explore/rhythm-battle (lo controla AcayHost).
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const hoveredId = useGameStore((s) => s.hoveredElementId)
  const overElement = hoveredId !== null

  useEffect(() => {
    const el = cursorRef.current
    if (!el) return
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      el.style.transform = `translate(${x}px, ${y}px)`
      el.style.opacity = '1'
    }
    const onLeave = () => {
      el.style.opacity = '0'
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    return () => {
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const c = CONFIG.explore.cursorColor
  const r = CONFIG.explore.cursorSize

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none absolute left-0 top-0 z-50"
      style={{
        opacity: 0,
        transition: 'opacity 0.15s',
        willChange: 'transform',
      }}
      aria-hidden
    >
      {overElement ? (
        // Círculo lleno dorado (interactuable)
        <div
          style={{
            position: 'absolute',
            left: -(r + 4),
            top: -(r + 4),
            width: (r + 4) * 2,
            height: (r + 4) * 2,
            borderRadius: '50%',
            background: `${c}40`,
            border: `2.5px solid ${c}`,
            boxShadow: `0 0 8px ${c}80`,
          }}
        />
      ) : (
        // Anillo hueco terracota (default)
        <div
          style={{
            position: 'absolute',
            left: -r,
            top: -r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: `2.5px solid ${c}`,
            background: 'transparent',
          }}
        >
          {/* Punto central */}
          <div
            style={{
              position: 'absolute',
              left: r - 2,
              top: r - 2,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: c,
            }}
          />
        </div>
      )}
    </div>
  )
}
