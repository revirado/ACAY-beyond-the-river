import type { AssetSourceDef } from '@/engine/core/types'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ÍNDICE DE ASSETS — ACAY / BEYOND THE RIVER
 * ═══════════════════════════════════════════════════════════════════
 *
 * Mockup: TODO es procedural o placeholder SALVO el logo del estudio
 * (ui.studio_logo → /assets/ui/wrongmeca.png, el único asset real conservado).
 *
 * Reemplazar arte = editar SOLO este archivo. Fallback a placeholder SVG
 * garantizado si un drawer no existe o un file falla.
 *
 * Convención de IDs:
 *   - acay.*       → personaje principal (Acay)
 *   - ant.*        → antagonistas
 *   - scene.*      → fondos de escena
 *   - narrative.*  → elementos narrativos interactivos
 *   - rhythm.*     → elementos de la pista rítmica
 *   - ui.*         → UI (logo, iconos de inventario)
 *   - audio.*      → audio (pistas procedurales o files)
 */
export const ASSET_INDEX: Record<string, AssetSourceDef> = {
  // ─── Logo del estudio (ÚNICO asset real conservado) ───
  'ui.studio_logo': { type: 'file', src: '/assets/ui/wrongmeca.png' },

  // ─── Logo del título del juego (placeholder de texto; reemplazable por imagen) ───
  'ui.title_logo': { type: 'procedural', drawer: 'title_logo' },

  // ─── Acay (personaje principal) ───
  // De espaldas: poncho terracota + sombrero oscuro. Usado en batalla rítmica.
  'acay.back': { type: 'procedural', drawer: 'acay_back' },

  // ─── Antagonistas (siluetas mockup) ───
  'ant.ucumar': { type: 'procedural', drawer: 'antagonist_ucumar' },
  'ant.shadow': { type: 'procedural', drawer: 'antagonist_shadow' },

  // ─── Escenarios ───
  'scene.river_shore': { type: 'procedural', drawer: 'explore_background' },
  'scene.rhythm_track': { type: 'procedural', drawer: 'rhythm_track' },

  // ─── Elementos narrativos (escena POV) ───
  'narrative.rock': { type: 'procedural', drawer: 'narrative_rock' },
  'narrative.tree': { type: 'procedural', drawer: 'narrative_tree' },
  'narrative.ruin': { type: 'procedural', drawer: 'narrative_ruin' },
  'narrative.coquena': { type: 'procedural', drawer: 'narrative_coquena' },
  'narrative.guitar': { type: 'procedural', drawer: 'narrative_guitar' },
  'narrative.relic': { type: 'procedural', drawer: 'narrative_relic' },

  // ─── UI: iconos de inventario (placeholders SVG) ───
  'ui.item_guitar': { type: 'placeholder', label: 'Guitarra', color: '#a3552f' },
  'ui.item_relic': { type: 'placeholder', label: 'Reliquia', color: '#d9a83f' },

  // ─── Audio (mockup: procedural, sin pistas reales todavía) ───
  'audio.music_explore': { type: 'procedural' },
  'audio.music_battle': { type: 'procedural' },
}

/** IDs de assets que la UI React necesita como URL para <img>. */
export const UI_ASSET_URLS: string[] = [
  'ui.item_guitar',
  'ui.item_relic',
  'acay.back',
  'ant.ucumar',
  'ant.shadow',
]
