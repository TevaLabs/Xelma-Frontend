import { TrendingUp, Crosshair } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type ModeAccent = 'blue' | 'teal';

type ModeDefinition = {
  id: 'directional' | 'precision';
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  bulletsKey: string;
  accent: ModeAccent;
  icon: typeof TrendingUp;
};

const MODE_DEFINITIONS: ModeDefinition[] = [
  {
    id: 'directional',
    titleKey: 'landing.modes.directional.title',
    subtitleKey: 'landing.modes.directional.subtitle',
    descriptionKey: 'landing.modes.directional.description',
    bulletsKey: 'landing.modes.directional.bullets',
    accent: 'blue',
    icon: TrendingUp,
  },
  {
    id: 'precision',
    titleKey: 'landing.modes.precision.title',
    subtitleKey: 'landing.modes.precision.subtitle',
    descriptionKey: 'landing.modes.precision.description',
    bulletsKey: 'landing.modes.precision.bullets',
    accent: 'teal',
    icon: Crosshair,
  },
];

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
      'bg-xelma-teal text-slate-950 hover:brightness-95 focus-visible:ring-xelma-teal',
    bulletDot: 'bg-xelma-teal',
  },
} as const;

export default function ModeCards() {
  const { t } = useTranslation();

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
          {t('landing.modes.title')}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
          {t('landing.modes.subtitle')}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {MODE_DEFINITIONS.map((mode) => {
            const Icon = mode.icon;
            const styles = ACCENT_STYLES[mode.accent];
            const bullets = t(mode.bulletsKey, { returnObjects: true }) as unknown;
            const bulletItems = Array.isArray(bullets) ? (bullets as string[]) : [];

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
                      {t(mode.titleKey)}
                    </h3>
                    <span
                      className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles.badge} ${styles.badgeBorder}`}
                    >
                      {t(mode.subtitleKey)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  {t(mode.descriptionKey)}
                </p>

                {/* Feature bullets */}
                <ul className="mt-4 space-y-2">
                  {bulletItems.map((bullet) => (
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
                  {t('landing.modes.cta')}
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
