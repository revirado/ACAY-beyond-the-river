/**
 * i18n del juego cozy: re-exporta las funciones genéricas del motor y añade
 * helpers cozy-específicos (itemNameLower, stageMessageKey, stageNameKey).
 *
 * El código cozy importa desde `@/game/i18n` como antes — recibe tanto las
 * funciones del motor (t, tOr, setLocale, getLocale, isLocale, LOCALES,
 * Locale) como los helpers cozy.
 */

// Re-export de funciones y tipos del motor.
export {
  t,
  tOr,
  setLocale,
  getLocale,
  isLocale,
  registerLocale,
  registerLocales,
  setDefaultLocale,
  getLocales,
  type Locale,
  type LocaleEntry,
} from '@/engine/i18n'

import { t } from '@/engine/i18n'

/** Clave del nombre de una etapa de prosperidad (usada por HUD y toasts). */
export function stageNameKey(level: number): string {
  return `progression.stage${level}.name`
}

/** Clave del mensaje de una etapa de prosperidad (usada por los toasts). */
export function stageMessageKey(level: number): string {
  return `progression.stage${level}.message`
}

/** Nombre localizado de un ítem, ya en minúsculas para frases naturales. */
export function itemNameLower(itemId: string): string {
  return t(`items.${itemId}`).toLowerCase()
}
