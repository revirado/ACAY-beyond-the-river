/**
 * Índice de assets del NUEVO juego (stub — placeholder por defecto).
 *
 * Cuando llegue el brief, aquí se definen los assets del nuevo juego:
 *   - escenarios de exploración (fondos, elementos narrativos con hover)
 *   - personajes (retratos para diálogo, sprites para guitar-hero)
 *   - UI (caja de diálogo, inventario, puntero customizado)
 *   - audio (pistas rítmicas para guitar-hero, música ambiente)
 *
 * Regla del motor: el código NUNCA referencia rutas; solo IDs lógicos.
 * Reemplazar arte = editar SOLO este archivo. Fallback a placeholder SVG
 * garantizado si un asset no se encuentra.
 *
 * Por ahora, un solo asset placeholder para que el motor arranque.
 */
import type { AssetSourceDef } from '@/engine/core/types'

export const ASSET_INDEX: Record<string, AssetSourceDef> = {
  // TODO(brief): agregar assets del nuevo juego.
  'ui.studio_logo': { type: 'placeholder', label: 'NEW GAME' },
}

/** IDs de assets que la UI React necesita como URL para <img>. */
export const UI_ASSET_URLS: string[] = [
  // TODO(brief): agregar IDs de assets de UI.
]
