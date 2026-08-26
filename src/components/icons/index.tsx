import { Bell as LucideBell, Check as LucideCheck, Clock as LucideClock } from 'lucide-react';
import React from 'react';

// Icon wrapper — central place to swap in shadcn-native icons later.
// Currently re-exports lucide-react icons used across the app.

import { AssetIcon } from './AssetIcon';

export const Bell = (props: React.ComponentProps<typeof LucideBell>) => <LucideBell {...props} />;
export const Check = (props: React.ComponentProps<typeof LucideCheck>) => <LucideCheck {...props} />;
export const Clock = (props: React.ComponentProps<typeof LucideClock>) => <LucideClock {...props} />;

// Re-export the shared per-asset SVG glyph set (BTC / ETH / XLM).
// Replaces the older emoji-style "₿ / Ξ / ✦" glyphs used by RoundCard and
// Pools. See: https://github.com/TevaLabs/Xelma-Frontend/issues/321
export { AssetIcon };
export type { AssetIconProps, SupportedAsset } from './AssetIcon';

export default { Bell, Check, Clock, AssetIcon };
