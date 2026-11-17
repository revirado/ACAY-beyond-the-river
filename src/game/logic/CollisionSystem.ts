import type { Collider, Vec2 } from '@/game/core/types'

export interface SolidBody {
  id: string
  x: number
  y: number
  collider: Collider
}

export interface AABB {
  x: number
  y: number
  w: number
  h: number
}

export interface BodySize {
  width: number
  height: number
}

/**
 * Convierte un collider lógico a AABB (el PoC usa principalmente rectángulos).
 * Ancla por defecto: bottom-center. offsetX/offsetY desplazan el collider relativo al ancla.
 */
export function solidToAABB(solid: SolidBody): AABB {
  const c = solid.collider
  const ox = c.offsetX ?? 0
  const oy = c.offsetY ?? 0
  if (c.type === 'rectangle') {
    return {
      x: solid.x - c.width / 2 + ox,
      y: solid.y - c.height + oy,
      w: c.width,
      h: c.height,
    }
  }
  const r = c.radius
  return { x: solid.x - r + ox, y: solid.y - r * 2 + oy, w: r * 2, h: r * 2 }
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function playerAABB(pos: Vec2, size: BodySize): AABB {
  return { x: pos.x - size.width / 2, y: pos.y - size.height, w: size.width, h: size.height }
}

/**
 * Sistema de colisión: independiente del asset visual.
 * Responde canMove(pos) y resuelve movimiento por ejes (permite deslizar sobre paredes).
 */
export class CollisionSystem {
  constructor(private solids: SolidBody[]) {}

  canMove(pos: Vec2, size: BodySize): boolean {
    const player = playerAABB(pos, size)
    for (const solid of this.solids) {
      if (aabbOverlap(player, solidToAABB(solid))) return false
    }
    return true
  }

  /** Intenta mover en X y luego en Y por separado. */
  tryMove(from: Vec2, dx: number, dy: number, size: BodySize): Vec2 {
    let { x, y } = from
    if (dx !== 0 && this.canMove({ x: x + dx, y }, size)) x += dx
    if (dy !== 0 && this.canMove({ x, y: y + dy }, size)) y += dy
    return { x, y }
  }
}
