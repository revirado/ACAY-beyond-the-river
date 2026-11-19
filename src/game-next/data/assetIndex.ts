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
  'acay.back': { type: 'file', src: '/assets/char/acay_back.png' },
  
  // Inconsciente (tirado en el suelo, respirando). Asset con anim sutil.
 'acay.unconscious': {
  type: 'file',
  frames: [
    '/assets/char/acay_breath_f1.png',
    '/assets/char/acay_breath_f2.png',
  ],
  anim: { kind: 'frameSwap', loop: true, durationSec: 1 },
},
  
  // De pie, frente (sombrero tapa rostro). Tras despertar.
  'acay.stand_front': { type: 'file', src: '/assets/char/acay_stand_front.png' },

  // ─── Antagonistas (siluetas mockup) ───
  'ant.ucumar': { type: 'procedural', drawer: 'antagonist_ucumar' },
  'ant.shadow': { type: 'procedural', drawer: 'antagonist_shadow' },
  'ant.duende': { type: 'procedural', drawer: 'duende' },

  // ─── Escenarios ───
  'scene.river_shore': { type: 'file', src: '/assets/scene/river_shore.png' },
  'scene.rhythm_track': { type: 'procedural', drawer: 'rhythm_track' },

  // ─── Elementos narrativos (escena POV) ───
  'narrative.rock': { type: 'procedural', drawer: 'narrative_rock' },
  'narrative.tree': { type: 'procedural', drawer: 'narrative_tree' },
  'narrative.ruin': { type: 'procedural', drawer: 'narrative_ruin' },
  'narrative.coquena': { type: 'procedural', drawer: 'narrative_coquena' },
  'narrative.guitar': { type: 'procedural', drawer: 'narrative_guitar' },
  'narrative.relic': { type: 'procedural', drawer: 'narrative_relic' },

  // ─── Escena 01: rocas en el río ───
  'scene.rocks_in_river': { type: 'file', src: '/assets/scene/rocks_in_river_00.png' },
  'scene.unstable_rock': { type: 'file', src: '/assets/scene/rocks_in_river_01.png' },
  'scene.wood_bridge': { type: 'file', src: '/assets/scene/rocks_in_river_02.png' },

  // ─── Escena 02: Campamento del Gaucho ───
  'scene.campamento_background':  { type: 'file', src: '/assets/scene/river_shore.png' },
  'prop.gaucho_sleeping': { type: 'file', src: '/assets/prop/asset_gaucho_f00.png' },
  'prop.gaucho_awake': { type: 'file', src: '/assets/prop/asset_gaucho_f01.png' },
  'prop.cardon': { type: 'file', src: '/assets/prop/cardon.png' },
  'prop.kettle': { type: 'procedural', drawer: 'kettle' },
  'prop.wood_pile': { type: 'procedural', drawer: 'wood_pile' },
  'prop.firepit_ashes': { type: 'procedural', drawer: 'firepit_ashes' },

  // ─── UI: iconos de inventario (placeholders SVG) ───
  'ui.item_guitar': { type: 'placeholder', label: 'Guitarra', color: '#a3552f' },
  'ui.item_relic': { type: 'placeholder', label: 'Reliquia', color: '#d9a83f' },
  'ui.item_pava': { type: 'placeholder', label: 'Pava', color: '#6e7474' },
  'ui.item_wood': { type: 'placeholder', label: 'Maderas', color: '#7c5230' },
  'ui.item_poncho': { type: 'placeholder', label: 'Poncho', color: '#a3552f' },
  'ui.item_lentes': { type: 'placeholder', label: 'Lentes', color: '#9aa0a0' },
  'ui.item_vara': { type: 'placeholder', label: 'Vara de Hierro', color: '#6e7474' },

  // ─── Audio (mockup: procedural, sin pistas reales todavía) ───
  'audio.music_explore': { type: 'procedural' },
  'audio.music_battle': { type: 'procedural' },
  // OST placeholders por escena (loop). Reemplazar por file cuando haya audio real:
  //   'audio.music_ost_river_shore': { type: 'file', src: '/assets/audio/ost_river_shore.mp3' },
  'audio.music_ost_river_shore': { type: 'placeholder', label: 'OST River Shore' },
  'audio.music_ost_campamento': { type: 'placeholder', label: 'OST Campamento' },
  'audio.music_ost_battle': { type: 'placeholder', label: 'OST Battle' },
  'audio.music_ost_tutorial': { type: 'placeholder', label: 'OST Tutorial' },
}

/** IDs de assets que la UI React necesita como URL para <img>. */
export const UI_ASSET_URLS: string[] = [
  'ui.item_guitar',
  'ui.item_relic',
  'ui.item_pava',
  'ui.item_wood',
  'ui.item_poncho',
  'ui.item_lentes',
  'ui.item_vara',
  'ui.title_logo',
  'acay.back',
  'ant.ucumar',
  'ant.shadow',
  'ant.duende',
]
