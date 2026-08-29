import { TrendingUp, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Mode selection cards shown on the Landing page.
 *
 * Displays two prediction modes:
 * - **Directional (UP/DOWN)** — blue accent, binary price prediction
 * - **Precision (Narrow Range)** — teal accent, tighter-window trading
 *
 * Both CTAs route to `/dashboard` where the prediction terminal lives.
 */
const MODES = [
  {
    id: 'directional',
    title: 'Directional Trading',
    subtitle: 'UP / DOWN',
    description:
      'Predict whether an asset price will go up or down within a fixed time window.',
    accent: 'blue' as const,
    icon: TrendingUp,
    bullets: [
      'Binary price prediction',
      'Real-time market data',
      'Instant settlement',
    ],
  },
  {
    id: 'precision',
    title: 'Precision Trading',
    subtitle: 'Narrow Range',
    description:
      'Lock in tighter price windows for higher potential multipliers on each prediction.',
    accent: 'teal' as const,
    icon: Crosshair,
    bullets: [
      'Tighter price windows',
      'Higher payout multipliers',
      'Advanced strategy mode',
    ],
  },
] as const;

const ACCENT_STYLES = {
  blue: {
    borderGlow: 'border-xelma-blue/30 hover:border-xelma-blue/50',
    glow: 'shadow-[0_0_24px_rgba(44,75,253,0.10)]',
    badge: 'bg-xelma-blue/10 text-xelma-blue',
    badgeBorder: 'border-xelma-blue/20',
    iconBg: 'bg-xelma-blue/10 text-xelma-blue',
    button:
      'bg-xelma-blue text-white hover:bg-xelma-blue-dark focus-visible:ring-xelma-blue',
    bulletDot: 'bg-xelma-blue',
  },
  teal: {
    borderGlow: 'border-xelma-teal/30 hover:border-xelma-teal/50',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.10)]',
    badge: 'bg-xelma-teal/10 text-xelma-teal',
    badgeBorder: 'border-xelma-teal/20',
    iconBg: 'bg-xelma-teal/10 text-xelma-teal',
    button:
      'bg-xelma-teal text-[#0A0F1A] font-bold hover:brightness-90 focus-visible:ring-xelma-teal',
    bulletDot: 'bg-xelma-teal',
  },
} as const;

export default function ModeCards() {
  return (
    <section
      className="px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="modes-title"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="modes-title"
          className="text-center text-3xl font-bold tracking-tight text-white"
        >
          Two Prediction Modes
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
          Choose the trading style that fits your strategy. Both modes use
          practice vXLM — no deposit required.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const styles = ACCENT_STYLES[mode.accent];

            return (
              <article
                key={mode.id}
                className={`glass-card group relative flex flex-col rounded-2xl p-6 transition-all duration-300 sm:p-8 ${styles.borderGlow} ${styles.glow}`}
              >
                {/* Accent line at top */}
                <div
                  aria-hidden="true"
                  className={`absolute -inset-x-px -top-px h-1 rounded-t-2xl bg-gradient-to-r ${
                    mode.accent === 'blue'
                      ? 'from-xelma-blue to-xelma-blue/60'
                      : 'from-xelma-teal to-xelma-teal/60'
                  }`}
                />

                {/* Header */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white">
                      {mode.title}
                    </h3>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles.badge} ${styles.badgeBorder}`}
                    >
                      {mode.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  {mode.description}
                </p>

                {/* Feature bullets */}
                <ul className="mt-4 space-y-2">
                  {mode.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 inline-block size-1.5 shrink-0 rounded-full ${styles.bulletDot}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm text-gray-300">{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Spacer */}
                <div className="flex-1" />

                {/* CTA */}
                <Link
                  to="/dashboard"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-xelma-bg ${styles.button}`}
                >
                  Start Predicting
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
