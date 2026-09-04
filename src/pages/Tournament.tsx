import {
  Trophy,
  TrendingUp,
  Crosshair,
  Calendar,
  Users,
  Shield,
  Zap,
  Target,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Tournament landing page shell (issue #127).
 *
 * Shows a premium coming-soon experience with:
 * - Hero section with trophy and headline
 * - Two tournament mode cards (Directional & Precision)
 * - Roadmap timeline of upcoming features
 * - Schedule placeholder
 * - Disabled Join CTA (backend not ready)
 *
 * All styling uses the existing glass-card + brand token design system.
 */

const TOURNAMENT_MODES = [
  {
    id: 'directional',
    title: 'Directional Tournament',
    subtitle: 'UP / DOWN',
    description:
      'Compete by predicting whether asset prices will rise or fall within fixed rounds. Earn leaderboard points for accurate calls.',
    accent: 'blue' as const,
    icon: TrendingUp,
    bullets: [
      'Bracket-style elimination rounds',
      'Real-time leaderboard scoring',
      'Prize pool distribution',
    ],
  },
  {
    id: 'precision',
    title: 'Precision Tournament',
    subtitle: 'Narrow Range',
    description:
      'Lock in tighter price windows for higher multipliers. Precision traders climb the rankings faster with fewer but more accurate predictions.',
    accent: 'teal' as const,
    icon: Crosshair,
    bullets: [
      'Multiplied scoring for accuracy',
      'Advanced strategy required',
      'Separate precision leaderboard',
    ],
  },
] as const;

const ROADMAP_ITEMS = [
  {
    phase: 'Phase 1',
    title: 'Tournament Infrastructure',
    description: 'Backend tournament engine, matchmaking, and scoring system.',
    icon: Shield,
    status: 'upcoming' as const,
  },
  {
    phase: 'Phase 2',
    title: 'Ranked Seasons',
    description: 'Seasonal leaderboard resets with tier-based rewards and exclusive badges.',
    icon: Trophy,
    status: 'upcoming' as const,
  },
  {
    phase: 'Phase 3',
    title: 'Live Tournaments',
    description: 'Real-time competitive events with entry limits and escalating prize pools.',
    icon: Zap,
    status: 'upcoming' as const,
  },
  {
    phase: 'Phase 4',
    title: 'Custom Tournaments',
    description: 'Create private tournaments with friends or community groups.',
    icon: Users,
    status: 'upcoming' as const,
  },
] as const;

const ACCENT_STYLES = {
  blue: {
    borderGlow: 'border-xelma-blue/30',
    glow: 'shadow-[0_0_24px_rgba(44,75,253,0.10)]',
    iconBg: 'bg-xelma-blue/10 text-xelma-blue',
    bulletDot: 'bg-xelma-blue',
    badge: 'bg-xelma-blue/10 text-xelma-blue border-xelma-blue/20',
    accentLine: 'from-xelma-blue to-xelma-blue/60',
  },
  teal: {
    borderGlow: 'border-xelma-teal/30',
    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.10)]',
    iconBg: 'bg-xelma-teal/10 text-xelma-teal',
    bulletDot: 'bg-xelma-teal',
    badge: 'bg-xelma-teal/10 text-xelma-teal border-xelma-teal/20',
    accentLine: 'from-xelma-teal to-xelma-teal/60',
  },
} as const;

function TournamentModeCard({ mode }: { mode: (typeof TOURNAMENT_MODES)[number] }) {
  const Icon = mode.icon;
  const styles = ACCENT_STYLES[mode.accent];

  return (
    <article
      className={`glass-card group relative flex flex-col rounded-2xl p-6 transition-all duration-300 sm:p-8 ${styles.borderGlow} ${styles.glow}`}
    >
      {/* Accent line at top */}
      <div
        aria-hidden="true"
        className={`absolute -inset-x-px -top-px h-1 rounded-t-2xl bg-gradient-to-r ${styles.accentLine}`}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-white">{mode.title}</h3>
          <span
            className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles.badge}`}
          >
            {mode.subtitle}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-relaxed text-gray-400">{mode.description}</p>

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
    </article>
  );
}

function RoadmapTimeline() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="roadmap-title">
      <div className="mx-auto max-w-3xl">
        <h2 id="roadmap-title" className="text-center text-3xl font-bold tracking-tight text-white">
          Development Roadmap
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
          Here&apos;s what we&apos;re building to bring competitive tournaments to Xelma.
        </p>

        <div className="mt-10 space-y-6">
          {ROADMAP_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === ROADMAP_ITEMS.length - 1;

            return (
              <div key={item.phase} className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-500">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  {!isLast && (
                    <div className="mt-2 w-px flex-1 bg-gradient-to-b from-white/10 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="glass-card flex-1 rounded-xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {item.phase}
                    </span>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Upcoming
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SchedulePlaceholder() {
  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="schedule-title">
      <div className="mx-auto max-w-3xl">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-white/5">
            <Calendar className="size-6 text-gray-500" aria-hidden="true" />
          </div>
          <h2 id="schedule-title" className="text-xl font-bold text-white">
            Tournament Schedule
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Tournament dates, brackets, and prize pools will appear here once the backend is
            ready.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-500">
            <Target className="size-4" aria-hidden="true" />
            <span>First season expected after mainnet launch</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Tournament() {
  const { t } = useTranslation();

  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen">
      {/* Hero */}
      <section className="px-4 pt-16 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trophy icon */}
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-[#2C4BFD]/15">
            <Trophy className="size-10 text-[#BEC7FE]" aria-hidden="true" />
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            {t('tournament.title')}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-400">
            {t('tournament.description')}
          </p>

          {/* Beta badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <span className="status-dot status-dot-yellow" aria-hidden="true" />
            Coming Soon
          </div>

          {/* Disabled CTA */}
          <div className="mt-8">
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold opacity-50 cursor-not-allowed"
            >
              {t('tournament.joinCTA')}
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
            <p className="mt-3 text-xs text-gray-500">
              {t('tournament.ctaDisabledHint')}
            </p>
          </div>
        </div>
      </section>

      {/* Tournament Modes */}
      <section className="px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="modes-title">
        <div className="mx-auto max-w-5xl">
          <h2
            id="modes-title"
            className="text-center text-3xl font-bold tracking-tight text-white"
          >
            {t('tournament.modesTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
            {t('tournament.modesSubtitle')}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {TOURNAMENT_MODES.map((mode) => (
              <TournamentModeCard key={mode.id} mode={mode} />
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <RoadmapTimeline />

      {/* Schedule Placeholder */}
      <SchedulePlaceholder />

      {/* Bottom spacer */}
      <div className="h-16" />
    </main>
  );
}
