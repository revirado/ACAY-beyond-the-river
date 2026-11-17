import type { WorldObjectDef, Vec2 } from '@/game/core/types'

/** Posición inicial del jugador (dentro del pueblo, junto al arco de entrada). */
export const PLAYER_START: Vec2 = { x: 250, y: 440 }

/**
 * LAYOUT DEL MUNDO — descripción declarativa de posiciones (editada a mano).
 * El diseñador puede modificar x / y / scale / layer / collider sin tocar lógica.
 * Coordenadas en el espacio virtual 1280×720. Ancla por defecto: bottom-center.
 */
export const WORLD_LAYOUT: WorldObjectDef[] = [
  // Entrada del pueblo
  { id: 'gate', asset: 'world.gate_01', x: 210, y: 280, scale: 1, collision: null },

  // Construcciones decorativas (no interactuables)
  { id: 'house_1', asset: 'world.house_01', x: 430, y: 255, scale: 1.1, collision: { type: 'rectangle', width: 150, height: 80 } },
  { id: 'house_2', asset: 'world.house_02', x: 730, y: 240, scale: 1.0, collision: { type: 'rectangle', width: 140, height: 70 } },
  { id: 'house_3', asset: 'world.house_03', x: 1040, y: 280, scale: 1.05, collision: { type: 'rectangle', width: 150, height: 75 } },
  //{ id: 'well', asset: 'world.well_01', x: 620, y: 345, scale: 1, collision: { type: 'rectangle', width: 62, height: 46 } },

  // Naturaleza decorativa
  { id: 'tree_1', asset: 'world.tree_01', x: 90, y: 250, scale: 1, collision: { type: 'circle', radius: 24 } },
  { id: 'tree_2', asset: 'world.tree_02', x: 1215, y: 560, scale: 1, collision: { type: 'circle', radius: 24 } },
  { id: 'tree_3', asset: 'world.tree_03', x: 320, y: 605, scale: 1.05, collision: { type: 'circle', radius: 24 } },
  { id: 'rock_1', asset: 'world.rock_01', x: 775, y: 565, scale: 1, collision: { type: 'circle', radius: 18 } },
  { id: 'rock_2', asset: 'world.rock_02', x: 195, y: 565, scale: 1, collision: { type: 'circle', radius: 16 } },
  { id: 'bush_1', asset: 'world.bush_01', x: 255, y: 495, scale: 1, collision: null },
  { id: 'bush_2', asset: 'world.bush_02', x: 1010, y: 595, scale: 1, collision: null },
  { id: 'bush_3', asset: 'world.bush_03', x: 880, y: 330, scale: 1, collision: null },

  // Puntos de recolección (interactuables)
  {
    id: 'wheat_field',
    asset: 'world.wheat_field',
    x: 565,
    y: 590,
    scale: 1,
    collision: { type: 'rectangle', width: 150, height: 55 },
    interaction: { type: 'gather', label: 'Recolectar trigo', resource: 'wheat' },
  },
  {
    id: 'apple_tree',
    asset: 'world.apple_tree',
    x: 1120,
    y: 390,
    scale: 1.1,
    collision: { type: 'circle', radius: 26 },
    interaction: { type: 'gather', label: 'Recolectar manzanas', resource: 'apple' },
  },

  // Comercio (interactuable)
  {
    id: 'market',
    asset: 'world.market_01',
    x: 905,
    y: 475,
    scale: 1.2,
    collision: { type: 'rectangle', width: 170, height: 85 },
    interaction: { type: 'merchant', label: 'Comerciar' },
  },

  // Producción (interactuable)
  {
    id: 'oven',
    asset: 'world.oven_01',
    x: 385,
    y: 525,
    scale: 1,
    collision: { type: 'rectangle', width: 75, height: 55 },
    interaction: { type: 'oven', label: 'Usar horno' },
  },

  // Cercas del campo
  // { id: 'fence_1', asset: 'world.fence_h', x: 480, y: 614, scale: 1, collision: { type: 'rectangle', width: 72, height: 18 } },
 // { id: 'fence_2', asset: 'world.fence_h', x: 648, y: 614, scale: 1, collision: { type: 'rectangle', width: 72, height: 18 } },

  // Pasto alto (pandeo por viento, ver anim en el índice). Decorativo: sin colisión ni
  // interacción — el jugador lo atraviesa y el y-sort lo dibuja delante/detrás por base.
  // Escalas ≥3: el tope del mata mide ~55-95px en pantalla. Fases desincronizadas por id.
  { id: 'grass_1', asset: 'world.grass_tuft', x: 65, y: 300, scale: 1.0, collision: null },
  { id: 'grass_2', asset: 'world.grass_tuft', x: 140, y: 330, scale: 1.6, collision: null },
  { id: 'grass_3', asset: 'world.grass_tuft', x: 168, y: 362, scale: 1.2, collision: null },
  { id: 'grass_4', asset: 'world.grass_tuft', x: 400, y: 92, scale: 1.8, collision: null },
  { id: 'grass_5', asset: 'world.grass_tuft', x: 452, y: 368, scale: 1.0, collision: null },
  // { id: 'grass_6', asset: 'world.grass_tuft', x: 482, y: 396, scale: 2.6, collision: null },
  // { id: 'grass_7', asset: 'world.grass_tuft', x: 682, y: 392, scale: 2.9, collision: null },
  // { id: 'grass_8', asset: 'world.grass_tuft', x: 716, y: 368, scale: 3.2, collision: null },
  // { id: 'grass_9', asset: 'world.grass_tuft', x: 862, y: 352, scale: 2.7, collision: null },
  // { id: 'grass_10', asset: 'world.grass_tuft', x: 1180, y: 332, scale: 3.1, collision: null },
  // { id: 'grass_11', asset: 'world.grass_tuft', x: 120, y: 592, scale: 2.9, collision: null },
  // { id: 'grass_12', asset: 'world.grass_tuft', x: 152, y: 556, scale: 3.1, collision: null },
  //{ id: 'grass_13', asset: 'world.grass_tuft', x: 355, y: 572, scale: 1.6, collision: null },
   { id: 'grass_14', asset: 'world.grass_tuft', x: 190, y: 78, scale: 1.0, collision: null },
  { id: 'grass_15', asset: 'world.grass_tuft', x: 290, y: 82, scale: 1.8, collision: null },
  { id: 'grass_16', asset: 'world.grass_tuft', x: 362, y: 90, scale: 1.0, collision: null },
  { id: 'grass_17', asset: 'world.grass_tuft', x: 1122, y: 568, scale: 1.7, collision: null },
  { id: 'grass_18', asset: 'world.grass_tuft', x: 1162, y: 592, scale: 1.2, collision: null },
]
