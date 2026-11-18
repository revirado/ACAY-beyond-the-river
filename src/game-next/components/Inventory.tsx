'use client'

import { useEffect, useState } from 'react'
import { Package, X } from 'lucide-react'
import { useGameStore } from '@/game-next/state/store'
import { AssetImg } from './AssetImg'
import { PALETTE } from '@/game-next/core/config'
import { CONTROLS } from '@/game-next/core/controls'
import { t } from '@/engine/i18n'
import { getEngine } from '@/engine/core/engineBridge'

/**
 * Inventory — sistema de inventario (botón toggle + ventana modal centrada).
 *
 * - Botón (bottom-right, siempre visible): icono + badge con cantidad de items.
 *   Muestra 0 si está vacío (el jugador sabe antes de abrir).
 * - Click en el botón o tecla CONTROLS.inventory (I/Tab) → toggle ventana modal.
 * - Ventana modal centrada: grid de items. No cubre los items del juego
 *   (es un overlay centrado, no pegado a un borde que crece).
 * - Click fuera del modal / ESC / botón X / tecla inventory → cierra.
 */
export function Inventory() {
  const inventory = useGameStore((s) => s.inventory)
  const selectedItemId = useGameStore((s) => s.selectedItemId)
  const [open, setOpen] = useState(false)
  const count = inventory.length

  // Tecla de inventario (I/Tab) → toggle. Tab necesita preventDefault.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (CONTROLS.inventory.includes(e.code as never)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.code === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* Botón toggle (bottom-right) */}
      <button
        type="button"
        aria-label={t('ui.inventory_button')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto absolute bottom-4 right-4 z-30 flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur-sm transition"
        style={{
          borderColor: PALETTE.pergaminoBorde,
          background: `${PALETTE.tierraOscura}e6`,
        }}
      >
        <Package
          className="h-5 w-5"
          style={{ color: PALETTE.dorado }}
          aria-hidden
        />
        <span
          className="text-[11px] font-bold uppercase tracking-widest"
          style={{ color: PALETTE.dorado }}
        >
          {t('ui.inventory_button')}
        </span>
        {/* Badge con cantidad */}
        <span
          className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{
            background: count > 0 ? PALETTE.acento : 'rgba(60,40,20,0.5)',
            color: count > 0 ? '#fff' : 'rgba(243,227,194,0.5)',
          }}
        >
          {count}
        </span>
      </button>

      {/* Ventana modal centrada (cuando open) */}
      {open && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center"
          onClick={() => setOpen(false)} // click fuera → cierra
        >
          {/* Backdrop semitransparente */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(15,10,8,0.6)', backdropFilter: 'blur(2px)' }}
          />
          {/* Panel del inventario */}
          <div
            role="dialog"
            aria-label={t('ui.inventory_button')}
            onClick={(e) => e.stopPropagation()} // no cerrar al clickear dentro
            className="relative w-[min(90%,640px)] rounded-xl border-2 p-5 shadow-2xl shadow-black/60"
            style={{
              borderColor: PALETTE.pergaminoBorde,
              background: `${PALETTE.pergamino}f5`,
            }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-serif text-xl font-bold uppercase tracking-wide"
                style={{ color: PALETTE.pergaminoBorde }}
              >
                {t('ui.inventory_button')}
              </h2>
              <button
                type="button"
                aria-label={t('ui.inventory_close')}
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-md p-1 transition hover:bg-black/10"
                style={{ color: PALETTE.pergaminoBorde }}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Grid de items */}
            {count === 0 ? (
              <p
                className="py-8 text-center font-serif italic"
                style={{ color: PALETTE.tintaClara }}
              >
                {t('ui.inventory_empty')}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {inventory.map((item) => {
                  const isSelected = selectedItemId === item.id
                  return (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Guitarra → reproducir nota musical (no seleccionable)
                      if (item.id === 'guitar') {
                        getEngine()?.audio.playSfx('guitar')
                        return
                      }
                      // Otros items: seleccionar/deseleccionar (use-item mechanic)
                      const engine = getEngine()
                      if (!engine) return
                      const newId = isSelected ? null : item.id
                      engine.state.selectedItemId = newId
                      engine.syncUI()
                      if (newId) setOpen(false) // cerrar modal para clickear el escenario
                    }}
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition hover:bg-amber-200/20"
                    style={{
                      borderColor: isSelected ? PALETTE.dorado : 'rgba(124,82,48,0.3)',
                      background: isSelected ? 'rgba(217,168,63,0.2)' : 'rgba(243,227,194,0.4)',
                      boxShadow: isSelected ? `0 0 8px ${PALETTE.dorado}80` : 'none',
                    }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center">
                      <AssetImg id={item.icon} alt={item.label} className="max-h-12 max-w-12" />
                    </div>
                    <span
                      className="text-center text-[11px] font-semibold leading-tight"
                      style={{ color: PALETTE.tinta }}
                    >
                      {item.label}
                    </span>
                  </div>
                  )
                })}
              </div>
            )}

            {/* Footer hint */}
            <p
              className="mt-4 text-center text-[10px] opacity-60"
              style={{ color: PALETTE.tinta }}
            >
              {t('ui.inventory_close')}: ESC / I / Tab
            </p>
          </div>
        </div>
      )}
    </>
  )
}
