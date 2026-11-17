/**
 * ═══════════════════════════════════════════════════════════════════
 *  i18n — internacionalización mínima basada en diccionarios JSON.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sistema GENÉRICO de diccionarios: el motor no incluye ningún locale.
 * Cada juego registra los suyos vía GameModule.locales (array de
 * { id, label, dict }) y el motor los carga al arrancar.
 *
 * - Los textos de UI viven en `locales/<idioma>.json` (claves de puntos).
 * - AGREGAR UN IDIOMA = agregar un archivo JSON + registrarlo en el GameModule.
 * - Solo se traducen TEXTOS: la lógica y el layout quedan intactos.
 * - Interpolación simple: t('common.loading') → "Cargando…".
 * - tOr(key, fallback, vars) permite usar textos de datos como fallback.
 */

export type Locale = string

export interface LocaleEntry {
  id: string
  /** Etiqueta legible para el selector de idioma (ej. "English"). */
  label: string
  /** Diccionario de claves de puntos (puede ser anidado). */
  dict: Record<string, unknown>
}

type Dict = Record<string, unknown>

const dicts = new Map<string, Dict>()
const localeOrder: string[] = []
const localeLabels = new Map<string, string>()

let current: string = 'en'
let defaultLocale: string = 'en'

/** Registra un locale (id + etiqueta + diccionario). Idempotente. */
export function registerLocale(entry: LocaleEntry): void {
  dicts.set(entry.id, entry.dict)
  localeLabels.set(entry.id, entry.label)
  if (!localeOrder.includes(entry.id)) localeOrder.push(entry.id)
}

/** Registra varios locales a la vez (típico: pasar GameModule.locales). */
export function registerLocales(entries: LocaleEntry[]): void {
  for (const e of entries) registerLocale(e)
}

/** Define el locale por defecto (al que cae t() si la key no existe en el actual). */
export function setDefaultLocale(id: string): void {
  defaultLocale = id
  current = id
}

/** Cambia el locale activo (si está registrado). */
export function setLocale(locale: string): void {
  if (dicts.has(locale)) current = locale
}

/** Locale activo actual. */
export function getLocale(): string {
  return current
}

/** Type guard para valores externos (store / querystring / storage). */
export function isLocale(value: unknown): value is string {
  return typeof value === 'string' && dicts.has(value)
}

/** Lista de locales registrados (orden = orden de registro). */
export function getLocales(): ReadonlyArray<{ id: string; label: string }> {
  return localeOrder.map((id) => ({ id, label: localeLabels.get(id) ?? id }))
}

/** Busca una clave de puntos en el diccionario. Devuelve undefined si no existe. */
function resolve(dict: Dict, key: string): string | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Dict)) {
      node = (node as Dict)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

/** Interpola {vars} sobre un texto ya resuelto. */
function interpolate(raw: string, vars?: Record<string, string | number>): string {
  if (!vars) return raw
  let out = raw
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v))
  return out
}

/**
 * Traduce `key` en el idioma actual. Si la clave no existe en el idioma
 * actual cae al idioma por defecto y, como último recurso, a la propia key.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const raw = resolve(dicts.get(current) ?? {}, key) ?? resolve(dicts.get(defaultLocale) ?? {}, key) ?? key
  return interpolate(raw, vars)
}

/**
 * Como `t`, pero con fallback explícito (útil para textos que viven en
 * archivos de datos como world.ts / trades.ts del juego).
 */
export function tOr(
  key: string,
  fallback: string,
  vars?: Record<string, string | number>,
): string {
  const raw =
    resolve(dicts.get(current) ?? {}, key) ??
    resolve(dicts.get(defaultLocale) ?? {}, key) ??
    fallback
  return interpolate(raw, vars)
}
