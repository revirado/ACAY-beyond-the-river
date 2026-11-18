'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/game-next/state/store'
import { CONFIG, PALETTE } from '@/game-next/core/config'
import { AssetImg } from './AssetImg'

/**
 * CustomCursor — puntero customizado en React (NO canvas).
 *
 * Se renderiza por ENCIMA de todos los overlays (z-50) para que el puntero
 * nunca sea tapado por la caja de diálogo, inventario, etc.
 *
 * - Sigue al mouse en tiempo real (pointermove → actualiza transform via ref,
 *   sin re-render por frame).
 * - Cambia de aspecto según estado:
 *   - Default: anillo hueco blanco.
 *   - Sobre elemento interactivo: círculo lleno blanco.
 *   - Item seleccionado (60.4): muestra el icono del item arrastrándose
 *     con un borde dorado, para que el jugador sepa qué item está usando.
 * - Cursor nativo oculto (lo maneja AcayHost con cursor:none en el canvas).
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const hoveredId = useGameStore((s) => s.hoveredElementId)
  const selectedItemId = useGameStore((s) => s.selectedItemId)
  const inventory = useGameStore((s) => s.inventory)
  const overElement = hoveredId !== null

  const selectedItem = selectedItemId ? inventory.find((i) => i.id === selectedItemId) : null

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
      {selectedItem ? (
        // Item seleccionado: muestra el icono del item arrastrándose (60.4)
        <div
          style={{
            position: 'absolute',
            left: -18,
            top: -18,
            width: 36,
            height: 36,
            borderRadius: '6px',
            border: `2px solid ${PALETTE.dorado}`,
            background: 'rgba(15,10,8,0.7)',
            boxShadow: `0 0 10px ${PALETTE.dorado}80`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <AssetImg id={selectedItem.icon} alt={selectedItem.label} className="max-h-7 max-w-7" />
        </div>
      ) : overElement ? (
        // Círculo lleno (interactuable)
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
        // Anillo hueco (default)
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
