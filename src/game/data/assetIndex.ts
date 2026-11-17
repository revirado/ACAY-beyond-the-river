import type { AssetSourceDef } from '@/game/core/types'

/**
 * ═══════════════════════════════════════════════════════════════════
 *  ÍNDICE DE ASSETS — única fuente de verdad de referencias de arte.
 * ═══════════════════════════════════════════════════════════════════
 *
 * El código de juego SOLO conoce IDs lógicos ("world.market_01").
 * Este índice decide de dónde sale cada imagen:
 *
 *   { type: 'procedural', drawer: 'market' }  → dibujo incorporado (placeholder artístico)
 *   { type: 'file', src: '/assets/world/market_01.png' }  → PNG real en /public
 *   { type: 'url',  src: 'https://...' }      → imagen externa de referencia
 *   { type: 'placeholder' }                   → cuadrado SVG sólido con etiqueta
 *
 * Si un 'file'/'url' no se encuentra, el sistema cae AUTOMÁTICAMENTE a un
 * placeholder SVG cuadrado con etiqueta (degradación elegante).
 *
 * ► Para actualizar arte: cambia SOLO la entrada de este índice. Cero cambios de código.
 *
 * Ejemplos de reemplazo real:
 *   'world.market_01': { type: 'file', src: '/assets/world/market_01.png' },
 *   'characters.player_map_f1': { type: 'url', src: 'https://cdn.ejemplo.com/player1.png' },
 */
export const ASSET_INDEX: Record<string, AssetSourceDef> = {
  // ─── Mundos / fondos ───
  'world.background': { type: 'file', src: '/assets/world/background.jpg' },
  'world.intro_background': { type: 'procedural', drawer: 'intro_background' },
  'world.gate_01': { type: 'file', src: '/assets/world/gate_01.png' },

  // ─── Construcciones ───
  'world.house_01': { type: 'file', src: '/assets/world/house_01.png' },
  'world.house_02': { type: 'file', src: '/assets/world/house_02.png' },
  'world.house_03': { type: 'file', src: '/assets/world/house_03.png' },
  'world.market_01': { type: 'file', src: '/assets/world/market_01.png' },
  'world.oven_01': { type: 'file', src: '/assets/world/oven.png' },
  'world.well_01': { type: 'procedural', drawer: 'well' },
  'world.fence_h': { type: 'procedural', drawer: 'fence' },

  // ─── Naturaleza ───
  'world.tree_01': { type: 'file', src: '/assets/world/tree_01.png' },
  'world.tree_02': { type: 'file', src: '/assets/world/tree_02.png' },
  'world.tree_03': { type: 'file', src: '/assets/world/tree_01.png' },
  'world.apple_tree': { type: 'file', src: '/assets/world/apple_tree.png' },
  'world.rock_01': { type: 'file', src: '/assets/world/rock_01.png' },
  'world.rock_02': { type: 'file', src: '/assets/world/rock_02.png' },
  'world.bush_01': { type: 'file', src: '/assets/world/bush_01.png' },
  'world.bush_02': { type: 'file', src: '/assets/world/bush_01.png' },
  'world.bush_03': { type: 'file', src: '/assets/world/bush_01.png' },
  'world.wheat_field': { type: 'file', src: '/assets/world/wheat_field.png' },
   /**
   * Pasto alto con PANDEO por viento — primera animación por deformación del motor.
   * La propiedad `anim` es declarativa: cualquier asset puede llevarla (ver render/anim.ts).
   * amplitude 0.16 ≈ el tope se corre ±16% del alto; loop de 2.4s. Las instancias
   * se desincronizan por fase derivada de su id (campo de viento, ver GameScreen).
   */
  'world.grass_tuft': {
    type: 'file',
    src: '/assets/world/bush_01.png',
    anim: { kind: 'pandeo', amplitude: 0.09, periodSec: 3.4 },
  },

  // ─── Personajes (sprite de mapa: 2 frames de caminata) ───
  'characters.player_map_f1':  { type: 'file', src: '/assets/char/player_map_f1.png' },
  'characters.player_map_f2': { type: 'file', src: '/assets/char/player_map_f2.png' },

  // ─── Personajes (retratos detallados para escena de interacción) ───
  'characters.player_detail': { type: 'file', src: '/assets/char/char.png' }  ,
  'characters.merchant_detail': { type: 'file', src: '/assets/char/merchant_detail.png' },

  // ─── UI ───
  // Logo del estudio (pantalla de intro). Placeholder por defecto:
  // reemplazar por el logo real editando SOLO esta entrada.
  'ui.studio_logo': { type: 'file', src: '/assets/ui/wrongmeca.png' }  ,
  'ui.coin': { type: 'procedural', drawer: 'coin' },
  'ui.wheat': { type: 'procedural', drawer: 'icon_wheat' },
  'ui.apple': { type: 'procedural', drawer: 'icon_apple' },
  'ui.bread': { type: 'procedural', drawer: 'icon_bread' },
  'ui.wood': { type: 'procedural', drawer: 'icon_wood' },
  'ui.skyline_0': { type: 'procedural', drawer: 'skyline_0' },
  'ui.skyline_1': { type: 'procedural', drawer: 'skyline_1' },
  'ui.skyline_2': { type: 'procedural', drawer: 'skyline_2' },
  'ui.skyline_3': { type: 'procedural', drawer: 'skyline_3' },
  'ui.skyline_4': { type: 'procedural', drawer: 'skyline_4' },

  // ─── Audio (si se define 'src' se usa el archivo; si no, música procedural) ───
  'audio.music_title': { type: 'procedural' },
  'audio.music_intro': { type: 'procedural' },
  'audio.music_village': { type: 'procedural' },
  'audio.music_menu': { type: 'procedural' },
}

/** IDs de assets que la UI React necesita como URL para <img>. */
export const UI_ASSET_URLS = [
  'ui.coin',
  'ui.wheat',
  'ui.apple',
  'ui.bread',
  'ui.wood',
  'ui.skyline_0',
  'ui.skyline_1',
  'ui.skyline_2',
  'ui.skyline_3',
  'ui.skyline_4',
  'characters.player_detail',
  'characters.merchant_detail',
]
