import type { ReactNode, SVGProps } from 'react';

/**
 * Tickers this icon set knows about. Anything outside this union falls back
 * to a generic "unknown asset" glyph so the UI never sits on a missing asset.
 */
export type SupportedAsset = 'BTC' | 'ETH' | 'XLM';

export interface AssetIconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'role' | 'title'> {
  /** Asset ticker to render. Case-insensitive; unknown values render a fallback glyph. */
  asset: string;
  /** Pixel size for both width and height. Defaults to 24. */
  size?: number;
  /**
   * Optional override for the accessible name. When omitted, the asset ticker
   * itself is used so screen readers and tooltip hover both surface it.
   */
  title?: string;
}

/**
 * Recognizable-but-generic single-color glyphs for the three supported
 * assets. Stroke uses `currentColor` so the parent wrapper's text color
 * drives the icon, matching how the rest of the design system treats
 * glass-card foregrounds (`text-[#BEC7FE]`, brand teal, etc.).
 */
function BtcGlyph() {
  // Bitcoin: stylized B with vertical stems, hinting at "₿".
  return (
    <>
      <path d="M9 5h6.5a3.5 3.5 0 0 1 0 7H9" />
      <path d="M9 12h7a3.5 3.5 0 0 1 0 7H9" />
      <path d="M9 5v14" />
      <path d="M12 3v2" />
      <path d="M12 17v2" />
      <path d="M16 3v2" />
      <path d="M16 17v2" />
    </>
  );
}

function EthGlyph() {
  // Ethereum: two diamonds stacked (top solid, bottom hollow) — the canonical
  // ETH mark.
  return (
    <>
      <path d="M12 3 5 12l7 4 7-4-7-9Z" />
      <path d="m5 12 7 4 7-4" />
      <path d="m12 21-7-5" />
      <path d="m12 21 7-5" />
    </>
  );
}

function XlmGlyph() {
  // Stellar Lumens: four-point sparkle / gem shape.
  return (
    <>
      <path d="M12 3v6" />
      <path d="M12 15v6" />
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <path d="m5.6 5.6 4.2 4.2" />
      <path d="m14.2 14.2 4.2 4.2" />
      <path d="m5.6 18.4 4.2-4.2" />
      <path d="m14.2 9.8 4.2-4.2" />
    </>
  );
}

function UnknownGlyph() {
  // Circle + question mark, mirrors lucide's `circle-help` shape.
  return (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2.5-2.5 4" />
      <path d="M12 17h.01" />
    </>
  );
}

function pickGlyph(normalized: string): ReactNode {
  switch (normalized) {
    case 'BTC':
      return <BtcGlyph />;
    case 'ETH':
      return <EthGlyph />;
    case 'XLM':
      return <XlmGlyph />;
    default:
      return <UnknownGlyph />;
  }
}

/**
 * Shared SVG icon for the three supported Stellar Wave assets (BTC, ETH, XLM),
 * with a graceful fallback for unknown tickers.
 *
 * Closes #321: replaces the prior emoji-style "₿ / Ξ / ✦" glyphs (which
 * depended on system fonts to render) with on-brand SVG paths that render
 * identically across platforms and inherit the parent text color.
 */
export function AssetIcon({
  asset,
  size = 24,
  title,
  className,
  ...rest
}: AssetIconProps) {
  const normalized = (asset ?? '').toUpperCase().trim();
  // `??` has lower precedence than `||`, so the fallback short-circuit needs
  // parens or strict TS reports TS5076 on the mixed operators.
  const accessible = title ?? (normalized || 'Asset');
  const testKey = normalized || 'unknown';
  const ariaName = `${accessible} icon`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label={ariaName}
      data-asset={testKey}
      data-testid={`asset-icon-${testKey}`}
      {...rest}
    >
      <title>{accessible}</title>
      {pickGlyph(normalized)}
    </svg>
  );
}

export default AssetIcon;
