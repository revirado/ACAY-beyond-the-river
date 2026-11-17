'use client'

import { useGameStore } from '@/game-next/state/store'

/**
 * <img> alimentado por el índice de assets (URLs publicadas por el engine).
 * Si el asset aún no cargó, no renderiza nada.
 */
export function AssetImg({
  id,
  className,
  alt,
}: {
  id: string
  className?: string
  alt?: string
}) {
  const url = useGameStore((s) => s.urls[id])
  if (!url) return null
  return <img src={url} alt={alt ?? id} className={className} draggable={false} />
}
