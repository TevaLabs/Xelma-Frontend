import { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface GlassCardProps extends React.HTMLAttributes<HTMLElement> {
  /** Semantic element to render: "div" (default), "article", "section", or "aside". */
  as?: 'div' | 'article' | 'section' | 'aside';
}

/**
 * Shared glass-morphism card shell. Applies the `glass-card` token so card
 * styling stays in one place.
 *
 * Usage:
 * ```
 * <GlassCard as="article" className="flex flex-col gap-4 rounded-2xl p-5">
 *   ...
 * </GlassCard>
 * ```
 *
 * The element, accessibility props (`aria-*`), and data attributes
 * (`data-testid`, …) pass straight through to the rendered element.
 * `className` is appended with plain concatenation (no tailwind-merge) so
 * custom tokens like `accent-border-teal` survive unchanged.
 */
export const GlassCard = forwardRef<HTMLElement, GlassCardProps>(function GlassCard(
  { as: Tag = 'div', className, ...props },
  ref,
) {
  return <Tag ref={ref as never} className={clsx('glass-card', className)} {...props} />;
});

export default GlassCard;