import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  Medal,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';

const roadmapCards = [
  {
    title: 'Seasons',
    eyebrow: 'Season 01',
    description:
      'Weekly prediction sprints with qualifier windows, live standings, and a finals bracket for the sharpest market readers.',
    icon: CalendarDays,
  },
  {
    title: 'Prizes',
    eyebrow: 'Rewards pool',
    description:
      'Planned XLM prize pools, profile badges, and tournament-only multipliers for players who finish in the top tiers.',
    icon: Gift,
  },
  {
    title: 'Eligibility',
    eyebrow: 'Fair play',
    description:
      'Freighter-connected accounts with verified Stellar addresses will be eligible once the first tournament season opens.',
    icon: ShieldCheck,
  },
];

const highlights = [
  'Season roadmap publishing before registration opens',
  'Leaderboard snapshots for every qualifier round',
  'Wallet-based registration with no duplicate entries',
];

export default function Tournament() {
  const [waitlistValue, setWaitlistValue] = useState('');
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!waitlistValue.trim()) {
      return;
    }

    setJoinedWaitlist(true);
  };

  return (
    <main className="xelma-grid-bg relative min-h-screen overflow-hidden px-4 py-8 text-[#F3F4F6] sm:px-6 lg:px-8 lg:py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.22),_transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase text-cyan-200">
              <Trophy className="h-4 w-4" aria-hidden />
              Tournament mode
            </div>

            <div className="max-w-3xl">
              <h1 className="hero-headline text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Xelma Tournament
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                A branded competitive shell for seasonal prediction runs, prize milestones, and eligibility updates before the first public bracket opens.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2C4BFD] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#2C4BFD]/20 transition-colors hover:bg-[#4F6BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Back to dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#tournament-waitlist"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-gray-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Join waitlist
                <Users className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          <aside className="glass-card rounded-2xl p-6 shadow-2xl shadow-[#2C4BFD]/10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-500">Current phase</p>
                <h2 className="mt-1 text-2xl font-black text-white">Roadmap buildout</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-200">
                <Medal className="h-7 w-7" aria-hidden />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex gap-3 rounded-xl bg-white/5 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
                  <p className="text-sm leading-6 text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-12" aria-labelledby="tournament-roadmap-heading">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Roadmap</p>
              <h2 id="tournament-roadmap-heading" className="mt-2 text-2xl font-black text-white">
                Seasons, prizes, and eligibility
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-gray-400">
              Tournament details will tighten as backend registration support lands. Until then, this page gives players a useful launch map.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {roadmapCards.map(({ title, eyebrow, description, icon: Icon }) => (
              <article key={title} className="glass-card rounded-2xl p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{eyebrow}</p>
                <h3 className="mt-2 text-xl font-black text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="tournament-waitlist"
          className="mt-12 grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)] md:p-8"
          aria-labelledby="tournament-waitlist-heading"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Waitlist</p>
            <h2 id="tournament-waitlist-heading" className="mt-2 text-2xl font-black text-white">
              Get notified before qualifiers open
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Drop an email or Stellar G-address. This stays local for now and can connect to a backend endpoint when registration is ready.
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <label htmlFor="tournament-waitlist-entry" className="sr-only">
              Email or Stellar wallet address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="tournament-waitlist-entry"
                type="text"
                value={waitlistValue}
                onChange={(event) => {
                  setWaitlistValue(event.target.value);
                  setJoinedWaitlist(false);
                }}
                placeholder="Email or Stellar G-address"
                className="min-h-12 flex-1 rounded-xl border border-white/10 bg-[#0A0F1A]/80 px-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
              />
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-cyan-300 px-5 text-sm font-black text-[#0A0F1A] transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
              >
                Notify me
              </button>
            </div>
            {joinedWaitlist && (
              <p className="text-sm font-semibold text-emerald-300" role="status">
                You are on the tournament waitlist.
              </p>
            )}
          </form>
        </section>
      </div>
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
