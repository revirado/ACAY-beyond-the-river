/**
 * DrawerDef — contrato de un drawer procedural (Canvas 2D).
 *
 * El motor NO incluye drawers concretos: cada juego provee los suyos en su
 * GameModule.drawers (registro nombre → DrawerDef). El AssetLoader los
 * resuelve cuando un asset del índice declara `{ type: 'procedural', drawer }`.
 *
 * Esto mantiene el motor libre de arte específico de cualquier juego.
 */
export interface DrawerDef {
  w: number
  h: number
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}

/** Registro vacío por defecto (el juego pasa el suyo vía GameModule.drawers). */
export const NO_DRAWERS: Record<string, DrawerDef> = {}
