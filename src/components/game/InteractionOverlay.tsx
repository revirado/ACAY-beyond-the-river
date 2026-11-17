'use client'

import { useEffect, useRef, useState } from 'react'
import { Coins, ShoppingBasket, Hammer, Hand, Flame, Undo2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/game/state/store'
import { getEngine } from '@/game/core/engineBridge'
import { useT } from '@/game/i18n/useT'
import type { UIInteractionOption } from '@/game/core/types'

const KIND_ICON: Record<UIInteractionOption['kind'], React.ComponentType<{ className?: string }>> = {
  sell: Coins,
  buy: ShoppingBasket,
  build: Hammer,
  gather: Hand,
  produce: Flame,
}

/**
 * Escena de interacción — CONTENEDOR ÚNICO a pantalla completa:
 *  - Los personajes (canvas) ocupan toda la pantalla anclados al pie
 *    (position bottom, "gravedad", con margen para el HUD).
 *  - Este panel flota POR ENCIMA de ese contenedor (z-20), centrado entre
 *    los dos personajes y CENTRADO EN EL VIEWPORT: el centro del panel
 *    coincide con el centro del viewport (ejes X e Y). El alto del panel
 *    varía según el contenido (1 ítem vs 5) pero el centro SIEMPRE es el
 *    mismo — así una ventana chica no queda ni muy arriba ni deja un
 *    vacío asimétrico abajo. Mismo diseño que siempre; la lista de
 *    opciones colapsa con scroll si el alto disponible se reduce.
 * El HUD principal (monedas/items/pueblo) sigue POR ENCIMA de este panel
 * (z-30 > z-20) para que siempre se vea cuánto se recolecta.
 *
 * Selección con TECLADO: ↑/↓ mueven el puntero triangular (SIN ciclar: el
 * puntero se detiene en el primer/último ítem, no salta al extremo opuesto),
 * Enter ejecuta. El mouse sigue funcionando igual (hover = seleccionar, clic = ejecutar).
 */
export function InteractionOverlay() {
  const interaction = useGameStore((s) => s.interaction)
  const { t } = useT()

  // ── Puntero de selección por teclado ──
  const [sel, setSel] = useState(0)
  const selRef = useRef(0)
  const listRef = useRef<HTMLUListElement | null>(null)
  // Modalidad de input: el hover solo roba la selección pasados ~120ms de
  // la última navegación por teclado (así el scrollIntoView bajo un cursor
  // quieto no secuestra el puntero; mousemove solo dispara con movimiento real).
  const keyNavAt = useRef(0)

  const opts = interaction?.options ?? []
  const selIdx = Math.min(sel, Math.max(0, opts.length - 1))

  // Reset del puntero al cambiar de interlocutor (ajuste durante render,
  // patrón recomendado por React para “resetear estado cuando cambia X”).
  const objectId = interaction?.objectId ?? ''
  const [lastObjectId, setLastObjectId] = useState(objectId)
  if (objectId !== lastObjectId) {
    setLastObjectId(objectId)
    setSel(0)
  }

  // Ref sincronizado (para el handler de Enter sin closures viejas).
  useEffect(() => {
    selRef.current = selIdx
  }, [selIdx])

  // Teclado: ↑/↓ navegan SIN ciclar (tope en los extremos), Enter selecciona.
  // El mouse sigue operativo.
  useEffect(() => {
    if (!interaction) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault()
        keyNavAt.current = Date.now()
        setSel((s) => {
          if (opts.length === 0) return 0
          const cur = Math.min(s, opts.length - 1)
          // Sin wrap: el puntero se frena en el primer/último ítem.
          return e.code === 'ArrowDown'
            ? Math.min(cur + 1, opts.length - 1)
            : Math.max(cur - 1, 0)
        })
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault() // evita doble activación sobre botones con foco
        const opt = opts[selRef.current]
        if (opt && !opt.disabled) getEngine()?.actions.interactionAction(opt.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [interaction, opts])

  // El puntero siempre visible dentro de la lista con scroll.
  useEffect(() => {
    const row = listRef.current?.children[selIdx] as HTMLElement | undefined
    row?.scrollIntoView({ block: 'nearest' })
  }, [selIdx, opts.length])

  if (!interaction) return null

  const act = (id: string) => {
    // Blur tras clic: evita que Enter/Space re-dispare el botón enfocado.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    getEngine()?.actions.interactionAction(id)
  }
  const close = () => getEngine()?.actions.closeInteraction()

  return (
    /* Contenedor ÚNICO sobre toda la escena (inset-0). pointer-events-none:
     * los clics fuera del panel atraviesan al canvas y cierran la interacción. */
    <div className="pointer-events-none absolute inset-0 z-20 px-4">
      <div
        role="dialog"
        aria-label={`${t('interaction.dialogOf')} ${interaction.targetName}`}
        className="pointer-events-auto absolute left-1/2 top-1/2 flex max-h-[calc(100%-6rem)] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-amber-200/25 bg-[#2f2113]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300"
      >
        {/* Encabezado */}
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-amber-100">{interaction.targetName}</h2>
          <button
            onClick={close}
            aria-label={t('interaction.close')}
            className="cursor-pointer rounded-full p-1.5 text-amber-100/60 transition hover:bg-white/10 hover:text-amber-50"
          >
            <Undo2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-sm italic text-amber-100/80">
          {interaction.resultMessage ?? interaction.greeting}
        </p>

        {/* Opciones */}
        {opts.length > 0 ? (
          <ul ref={listRef} className="mt-4 grid min-h-0 shrink gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {opts.map((opt, i) => {
              const Icon = KIND_ICON[opt.kind]
              const selected = i === selIdx
              return (
                <li
                  key={opt.id}
                  onMouseMove={() => {
                    // Solo si el mouse se movió de verdad tras la última flecha.
                    if (Date.now() - keyNavAt.current > 120) setSel(i)
                  }}
                  role="option"
                  aria-selected={selected}
                >
                  <Button
                    variant="outline"
                    disabled={opt.disabled}
                    onClick={() => act(opt.id)}
                    className={
                      'h-auto w-full cursor-pointer justify-start gap-3 border-amber-200/20 bg-black/20 px-4 py-2.5 text-left text-amber-50 hover:border-amber-200/40 hover:bg-[#54391f] disabled:cursor-not-allowed disabled:opacity-45 ' +
                      (selected
                        ? 'border-amber-300/70 bg-[#54391f] shadow-[0_0_0_1px_rgba(252,211,77,0.35)]'
                        : '')
                    }
                  >
                    {/* Puntero de selección (triángulo) */}
                    <span className="flex w-4 shrink-0 justify-center" aria-hidden>
                      {selected ? <Play className="h-3.5 w-3.5 fill-current text-amber-300" /> : <span className="h-3.5 w-3.5" />}
                    </span>
                    <Icon />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold leading-tight">{opt.label}</span>
                      <span className="block text-xs font-normal text-amber-100/65">
                        {opt.description}
                      </span>
                    </span>
                    <span className="text-right text-xs font-medium text-amber-300">
                      {opt.costLine}
                      {opt.disabled && opt.disabledReason && (
                        <span className="block text-[10px] font-normal text-red-300/80">
                          {opt.disabledReason}
                        </span>
                      )}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-amber-200/15 bg-black/20 px-4 py-3 text-sm text-amber-100/70">
            {t('interaction.empty')}
          </p>
        )}

        <p className="mt-3 text-center text-[11px] text-amber-100/45">
          {t('interaction.hint')} · {t('interaction.keysHint')}
        </p>
      </div>
    </div>
  )
}
