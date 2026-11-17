import { ActiveGameHost } from '@/active-game'

export default function Home() {
  /**
   * DEV_MODE — variable de entorno leída SOLO en el servidor y pasada como
   * prop a la UI. Semántica:
   *   "true"  → true (se muestran los rótulos de demo)
   *   "false" / vacío / no definida → false
   */
  const devMode = process.env.DEV_MODE === 'true'
  return <ActiveGameHost devMode={devMode} />
}
