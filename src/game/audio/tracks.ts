import type { TrackDef } from '@/engine/core/types'
import type { MusicTrackId } from '@/game/core/types'

/**
 * Pistas procedurales (WebAudio) del juego cozy.
 *
 * El motor (AudioManager) las recibe vía GameModule.audioTracks y las
 * sintetiza sin archivos. Cada pista define bpm, progresión de acordes
 * (notas MIDI por compás), patrón de lead pentatónico (16 corcheas = 2
 * compases) y gain global.
 */
export const COZY_TRACKS: Record<MusicTrackId, TrackDef> = {
  title: {
    bpm: 72,
    chords: [
      [48, 52, 55, 59], // Cmaj7
      [45, 52, 55, 60], // Am7
      [41, 48, 53, 57], // Fmaj7
      [43, 50, 53, 59], // G7
    ],
    lead: [0, 2, 4, -1, 3, -1, 5, -1, 2, -1, 4, 3, -1, 2, -1, -1],
    gain: 1,
  },
  intro: {
    bpm: 84,
    chords: [
      [48, 52, 55, 59], // C
      [43, 50, 55, 59], // G
      [45, 52, 57, 60], // Am
      [41, 48, 53, 57], // F
    ],
    lead: [0, 2, 4, 5, 4, 2, 0, -1, 2, 4, -1, 5, 4, 2, -1, -1],
    gain: 1,
  },
  village: {
    bpm: 96,
    chords: [
      [48, 52, 55], // C
      [45, 48, 52], // Am
      [41, 45, 48], // F
      [43, 47, 50], // G
    ],
    lead: [0, -1, 2, 4, -1, 2, 5, 4, 0, -1, 2, -1, 4, 5, 2, -1],
    gain: 1,
  },
  menu: {
    bpm: 60,
    chords: [
      [45, 52, 55, 60], // Am7
      [41, 48, 53, 57], // Fmaj7
    ],
    lead: [-1, -1, 4, -1, -1, -1, 2, -1, -1, -1, 0, -1, -1, -1, -1, -1],
    gain: 0.6, // gains más bajos
  },
}
