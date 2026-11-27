import type { FiElement, TvoreyaSymbol } from '@/lib/tale-showcase'

/**
 * Symbols shared with the print books: the alchemical element triangles of
 * „Фи“ and the five episode signs from the cover of „Творея“.
 */

const GOLDEN_SPIRAL =
  'M12 12C12 10.6 14 10.6 14 12.3C14 14.6 10 14.9 9.6 12C9.2 8.6 14.5 7.4 16.6 10.8C18.9 14.9 14.6 19 10.6 18C5.6 16.7 4.4 10.4 8 6.6C11.6 3 17.6 3.6 20.6 8'

export function ElementSymbol({
  element,
  strokeWidth = 1.8
}: {
  element: FiElement
  strokeWidth?: number
}) {
  if (element === 'spiral') {
    return (
      <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <path
          d={GOLDEN_SPIRAL}
          stroke='currentColor'
          strokeWidth={strokeWidth}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }

  const up = element === 'fire' || element === 'air'
  const triangle = up ? 'M12 3L22 20.5H2Z' : 'M12 21L2 3.5H22Z'
  const bar =
    element === 'air'
      ? 'M5.4 14.5H18.6'
      : element === 'earth'
        ? 'M5.4 9.5H18.6'
        : null

  return (
    <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path
        d={triangle}
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinejoin='round'
      />
      {bar && <path d={bar} stroke='currentColor' strokeWidth={strokeWidth} />}
    </svg>
  )
}

const EPISODE_PATHS: Record<TvoreyaSymbol, string> = {
  e0: 'M12 3L14 10L21 12L14 14L12 21L10 14L3 12L10 10Z',
  e1: 'M6 21V11A6 6 0 0 1 18 11V21Z M12 21V12 M9.5 21V13.5',
  e2: 'M3 9C6 4 9 4 12 9C15 4 18 4 21 9C17 9.5 14 11 12 15C10 11 7 9.5 3 9Z M12 15V21',
  e3: 'M12 3.5L14.6 8L12 12.5L9.4 8Z M6 12L8.6 16.5L6 21L3.4 16.5Z M18 12L20.6 16.5L18 21L15.4 16.5Z',
  e4: GOLDEN_SPIRAL,
  e5: 'M12 2.5V21.5 M2.5 12H21.5 M12 8L16 12L12 16L8 12Z M6 6L8.6 8.6 M18 6L15.4 8.6 M6 18L8.6 15.4 M18 18L15.4 15.4'
}

export function EpisodeSymbol({
  symbol,
  strokeWidth = 1.5
}: {
  symbol: TvoreyaSymbol
  strokeWidth?: number
}) {
  return (
    <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <path
        d={EPISODE_PATHS[symbol]}
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinejoin='round'
        strokeLinecap='round'
      />
    </svg>
  )
}

export function StarSymbol() {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8Z' />
    </svg>
  )
}

/** A golden spiral (φ) drawn from quarter arcs, for the „Фи“ backdrop. */
export function GoldenSpiral({ className }: { className?: string }) {
  // Fibonacci squares 1,1,2,3,5,8,13,21,34,55 → quarter arcs, scaled.
  const arcs: string[] = []
  const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
  const s = 6
  let x = 0
  let y = 0
  let d = `M ${x} ${y}`
  // Directions cycle: the spiral grows counter-clockwise.
  const dirs: Array<[number, number]> = [
    [1, -1],
    [-1, -1],
    [-1, 1],
    [1, 1]
  ]
  for (const [i, f] of fib.entries()) {
    const r = f * s
    const [dx, dy] = dirs[i % 4]!
    const nx = x + dx * r
    const ny = y + dy * r
    d += ` A ${r} ${r} 0 0 0 ${nx} ${ny}`
    x = nx
    y = ny
  }
  arcs.push(d)

  return (
    <svg
      className={className}
      viewBox='-420 -420 840 840'
      fill='none'
      aria-hidden='true'
    >
      <defs>
        <linearGradient id='tl-fi-spiral' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stopColor='var(--fi-fire)' />
          <stop offset='38%' stopColor='var(--fi-gold)' />
          <stop offset='70%' stopColor='var(--fi-water)' />
          <stop offset='100%' stopColor='var(--fi-air)' />
        </linearGradient>
      </defs>
      {arcs.map((path) => (
        <path
          key={path}
          d={path}
          stroke='url(#tl-fi-spiral)'
          strokeWidth='3'
          strokeLinecap='round'
        />
      ))}
    </svg>
  )
}
