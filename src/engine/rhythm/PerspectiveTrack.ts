/**
 * ════════════════════════════════════════════════════════════════════════
 *  PerspectiveTrack — sistema del motor para pistas rítmicas en perspectiva.
 * ════════════════════════════════════════════════════════════════════════
 *
 * Utilidad genérica para juegos de ritmo tipo "guitar-hero" donde los tabs
 * descienden por una pista en perspectiva (trapecio que se ensancha hacia
 * el primer plano). Independiente de cualquier mecánica concreta: el juego
 * provee la geometría, el travel time y los tabs (con hitTime + lane); el
 * motor calcula la posición en pantalla con curva de perspectiva.
 *
 * PRINCIPIO DE PERSPECTIVA (el fix):
 *   Un objeto que se mueve a velocidad constante en 3D hacia la cámara
 *   ACELERA en pantalla: cubre pocos píxeles cuando está lejos (pequeño,
 *   cerca del punto de fuga) y muchos píxeles cuando está cerca (grande,
 *   en el primer plano). Esto simula depth naturally.
 *
 *   Antes el motor usaba progress LINEAL → el tab movía a velocidad constante
 *   en píxeles → parecía "rápido lejos, lento cerca" (al revés de la
 *   perspectiva real). Ahora usa progress EASED (p^curveExp) → lento lejos,
 *   rápido cerca. Correcto.
 *
 * Uso:
 *   const track = new PerspectiveTrack(geom, travelSec, curveExp)
 *   const p = track.progress(tab.hitTime, elapsed)   // 0..1 eased
 *   const pos = track.position(p, tab.lane, lanes)    // { x, y, scale }
 */

/** Geometría de la pista en perspectiva (coords virtuales). */
export interface TrackGeometry {
  /** Centro X de la pista (punto de fuga horizontal). */
  cx: number
  /** Borde lejano (arriba, punto de fuga vertical). */
  topY: number
  /** Borde cercano (abajo, línea de hit donde está el personaje). */
  botY: number
  /** Media-anchura en el borde lejano (la pista es angosta arriba). */
  topHalfW: number
  /** Media-anchura en el borde cercano (la pista es ancha abajo). */
  botHalfW: number
}

/** Timing de un tab: cuándo llega al hit line y cuánto viaja. */
export interface TabTiming {
  /** Segundos desde el inicio de la batalla en que el tab llega al hit line. */
  hitTime: number
  /** Segundos que el tab está visible (desde que aparece lejos hasta que hit). */
  travelSec: number
}

export class PerspectiveTrack {
  constructor(
    public readonly geom: TrackGeometry,
    public readonly travelSec: number = 2.5,
    /** Exponente de la curva de perspectiva. >1 = lento lejos, rápido cerca. */
    public readonly curveExp: number = 2.2,
  ) {}

  /** Progress lineal crudo 0..1 (clamped). Útil para hit detection. */
  rawProgress(hitTime: number, elapsed: number): number {
    const raw = (elapsed - (hitTime - this.travelSec)) / this.travelSec
    return Math.max(0, Math.min(1, raw))
  }

  /**
   * Progress EASED 0..1. Aplica la curva de perspectiva (p^curveExp):
   * valores pequeños (lejos) se estiran → el tab pasa mucho tiempo lejos
   * (lento); valores grandes (cerca) se comprimen → el tab acelera al
   * acercarse. Esto simula un objeto a velocidad constante en 3D hacia la
   * cámara.
   */
  progress(hitTime: number, elapsed: number): number {
    return Math.pow(this.rawProgress(hitTime, elapsed), this.curveExp)
  }

  /**
   * Posición en pantalla + escala para un tab en el progress dado + lane.
   * - x: interpola desde el punto de fuga (cx, angosto) hasta el ancho total.
   * - y: interpola desde topY (lejos) hasta botY (cerca).
   * - scale: 0.35 lejos → 1.0 cerca (crece con la cercanía).
   */
  position(
    easedProgress: number,
    lane: number,
    lanes: number,
  ): { x: number; y: number; scale: number } {
    const p = easedProgress
    const halfW = this.geom.topHalfW + (this.geom.botHalfW - this.geom.topHalfW) * p
    // t = centro del lane dentro del track. (lane + 0.5) / lanes pone cada
    // lane en el centro de su "cuadrado" (tercio si lanes=3), NO en las
    // esquinas. Así Acay y los tabs se alinean en el centro de cada lane.
    const t = (lane + 0.5) / lanes
    const x = this.geom.cx - halfW + t * halfW * 2
    const y = this.geom.topY + (this.geom.botY - this.geom.topY) * p
    const scale = 0.35 + p * 0.65
    return { x, y, scale }
  }

  /** Y del hit line (donde está el personaje que esquiva). */
  get hitY(): number {
    return this.geom.botY
  }

  /** ¿El tab ya llegó al hit line? (raw progress >= 1) */
  hasArrived(hitTime: number, elapsed: number): boolean {
    return this.rawProgress(hitTime, elapsed) >= 1
  }

  /** ¿El tab ya apareció? (raw progress > 0) */
  isVisible(hitTime: number, elapsed: number): boolean {
    return this.rawProgress(hitTime, elapsed) > 0
  }
}
