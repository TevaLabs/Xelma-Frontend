import React, { useMemo } from 'react';

type Props = {
  address?: string | null;
  name?: string;
  className?: string;
  size?: number;
};

// Curated vibrant dark mode color pairs (background + foreground colors)
const PALETTES: Array<[string, string, string]> = [
  ['#0F172A', '#38BDF8', '#818CF8'], // Cyan + Indigo
  ['#18181B', '#34D399', '#059669'], // Emerald
  ['#1E1B4B', '#818CF8', '#C084FC'], // Purple + Fuchsia
  ['#172554', '#60A5FA', '#3B82F6'], // Blue
  ['#1C1917', '#F59E0B', '#F97316'], // Amber + Orange
  ['#030712', '#22C55E', '#10B981'], // Green
  ['#0A0F1A', '#2C4BFD', '#38BDF8'], // Xelma Primary Theme
  ['#180828', '#EC4899', '#A855F7'], // Pink + Violet
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic SVG Identicon generated from Stellar public G-addresses.
 * Fallback to initials if address is absent.
 */
export const IdenticonAvatar: React.FC<Props> = ({
  address,
  name = '',
  className = 'h-full w-full',
  size = 64,
}) => {
  const identiconData = useMemo(() => {
    if (!address || !address.trim()) return null;

    const trimmed = address.trim();
    const hash = simpleHash(trimmed);
    const paletteIndex = hash % PALETTES.length;
    const [bgColor, fgColor, accentColor] = PALETTES[paletteIndex];

    // Generate symmetrical 5x5 grid (3 columns mirrored to 5)
    const grid: number[][] = [];
    let state = hash;

    for (let r = 0; r < 5; r++) {
      const row: number[] = [];
      for (let c = 0; c < 3; c++) {
        state = (state * 1664525 + 1013904223) % 4294967296;
        // Determine fill state: 0 = bg, 1 = fg, 2 = accent
        const val = state % 3;
        row[c] = val;
      }
      // Mirror columns: col 3 = col 1, col 4 = col 0
      row[3] = row[1];
      row[4] = row[0];
      grid.push(row);
    }

    return { bgColor, fgColor, accentColor, grid };
  }, [address]);

  if (!identiconData) {
    return (
      <div
        className={`flex items-center justify-center bg-[#162033] font-bold text-[#BEC7FE] select-none ${className}`}
        aria-label="Avatar placeholder"
      >
        {initialsFromName(name)}
      </div>
    );
  }

  const { bgColor, fgColor, accentColor, grid } = identiconData;
  const cellSize = 10;
  const viewBoxSize = 50;

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`select-none ${className}`}
      aria-label={`Identicon for address ${address}`}
      role="img"
    >
      {/* Background fill */}
      <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />

      {/* Symmetrical 5x5 grid cells */}
      {grid.map((row, r) =>
        row.map((val, c) => {
          if (val === 0) return null;
          const fill = val === 1 ? fgColor : accentColor;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={fill}
              rx={1.5}
            />
          );
        })
      )}
    </svg>
  );
};

export default IdenticonAvatar;
