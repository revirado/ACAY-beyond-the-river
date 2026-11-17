import type { Vec2 } from '@/game/core/types'

export interface InputAxes {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

export interface MovementVectors {
  right: Vec2
  left: Vec2
  down: Vec2
  up: Vec2
}

/**
 * Convención de perspectiva caballera: SOLO transforma entradas en vectores.
 * No afecta imágenes, sprites ni render. Cambiar el ángulo no requiere tocar lógica.
 *
 *   RIGHT = (1, 0)        LEFT = (-1, 0)
 *   DOWN  = (cos a, sin a)     UP = (-cos a, -sin a)
 */
export function buildMovementVectors(angleDeg: number): MovementVectors {
  const rad = (angleDeg * Math.PI) / 180
  return {
    right: { x: 1, y: 0 },
    left: { x: -1, y: 0 },
    down: { x: Math.cos(rad), y: Math.sin(rad) },
    up: { x: -Math.cos(rad), y: -Math.sin(rad) },
  }
}

/** Combina los ejes activos y normaliza el resultado (velocidad uniforme en diagonales). */
export function axesToVector(axes: InputAxes, angleDeg: number): Vec2 {
  const v = buildMovementVectors(angleDeg)
  let x = 0
  let y = 0
  if (axes.right) {
    x += v.right.x
    y += v.right.y
  }
  if (axes.left) {
    x += v.left.x
    y += v.left.y
  }
  if (axes.down) {
    x += v.down.x
    y += v.down.y
  }
  if (axes.up) {
    x += v.up.x
    y += v.up.y
  }
  const len = Math.hypot(x, y)
  if (len === 0) return { x: 0, y: 0 }
  return { x: x / len, y: y / len }
}
