'use client'

import { useEffect } from 'react'
import { Info } from 'lucide-react'
import { useGameStore } from '@/game/state/store'

function ToastItem({ id, text }: { id: number; text: string }) {
  const removeToast = useGameStore((s) => s.removeToast)
  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 4200)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    <div
      role="status"
      className="pointer-events-auto flex items-center gap-2 rounded-xl border border-amber-300/40 bg-[#3f2d1d]/95 px-4 py-2.5 text-sm text-amber-50 shadow-lg shadow-black/40 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <Info className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
      <span>{text}</span>
    </div>
  )
}

/** Avisos del juego (progresión del pueblo, etc.). Debajo del reloj del HUD. */
export function Toasts() {
  const toasts = useGameStore((s) => s.toasts)
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} text={t.text} />
      ))}
    </div>
  )
}
