import { create } from 'zustand'
import type { UseBoundStore, StoreApi } from 'zustand'
import type { BaseUISnapshot } from '@/engine/core/types'

let toastSeq = 1

/**
 * Store de UI (Zustand) — el engine publica snapshots aquí.
 * NO es la fuente de verdad del juego: solo refleja el estado para React.
 *
 * Genérico: cada juego crea su instancia con `createGameStore<TSnapshot>()`
 * pasando su snapshot inicial (que extiende BaseUISnapshot con sus campos
 * propios: coins, inventory, diálogo actual, etc.). El motor recibe la
 * instancia vía GameModule.store y la usa para publicar snapshots y toasts.
 */
export interface GameStore<TSnapshot extends BaseUISnapshot = BaseUISnapshot>
  extends TSnapshot {
  setSnapshot: (partial: Partial<TSnapshot>) => void
  pushToast: (text: string) => void
  removeToast: (id: number) => void
}

/**
 * Factory: crea el store de UI del juego. Cada juego la llama una vez con su
 * snapshot inicial. Retorna el hook Zustand (bound store) tipado con el
 * snapshot del juego.
 */
export function createGameStore<TSnapshot extends BaseUISnapshot>(
  initial: TSnapshot,
): UseBoundStore<StoreApi<GameStore<TSnapshot>>> {
  return create<GameStore<TSnapshot>>((set) => ({
    ...initial,
    setSnapshot: (partial) => set(partial),
    pushToast: (text) =>
      set((s) => ({ toasts: [...s.toasts.slice(-3), { id: toastSeq++, text }] })),
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  }))
}
